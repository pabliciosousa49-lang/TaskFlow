import { parser as parserJavaScript } from "@lezer/javascript";
import { parser as parserCSS } from "@lezer/css";
import { resolverArquivoVirtual, resolverReferenciaVirtual } from "./resolvedor.js";

export function urlDados(conteudo, mime) {
    let binario = "";
    for (const byte of new TextEncoder().encode(conteudo)) binario += String.fromCharCode(byte);
    return `data:${mime};charset=utf-8;base64,${btoa(binario)}`;
}

function textoLiteral(texto) {
    return texto.slice(1, -1).replace(/\\(u\{[\da-f]+\}|u[\da-f]{4}|x[\da-f]{2}|\r?\n|.)/gi, (_, escape) => {
        if (escape.startsWith("u{")) return String.fromCodePoint(parseInt(escape.slice(2, -1), 16));
        if (/^[ux]/i.test(escape) && escape.length > 1) return String.fromCodePoint(parseInt(escape.slice(1), 16));
        return ({ n: "\n", r: "\r", t: "\t", "0": "\0", "\n": "", "\r\n": "" })[escape] ?? escape;
    });
}

// CSS — Escapes - hexadecimal de até seis dígitos e continuação de linha em strings.
function textoCSS(texto, aspas) {
    const valor = (aspas ? texto.slice(1, -1) : texto.trim()).replace(/\r\n?|\f/g, "\n");
    let resultado = "";
    for (let indice = 0; indice < valor.length; indice++) {
        const caractere = valor[indice];
        if (caractere !== "\\") { resultado += caractere === "\0" ? "\uFFFD" : caractere; continue; }
        if (++indice >= valor.length) { resultado += "\uFFFD"; break; }
        if (valor[indice] === "\n" && aspas) continue;
        const hex = valor.slice(indice).match(/^[\da-f]{1,6}/i)?.[0];
        if (hex) {
            const codigo = parseInt(hex, 16);
            resultado += !codigo || codigo > 0x10FFFF || (codigo >= 0xD800 && codigo <= 0xDFFF)
                ? "\uFFFD" : String.fromCodePoint(codigo);
            indice += hex.length - 1;
            if (/[\t\n ]/.test(valor[indice + 1] || "")) indice++;
        } else resultado += valor[indice];
    }
    return resultado;
}

function aplicarAlteracoes(codigo, alteracoes) {
    for (const { from, to, texto } of alteracoes.sort((a, b) => b.from - a.from)) {
        codigo = codigo.slice(0, from) + texto + codigo.slice(to);
    }
    return codigo;
}

// Recursos — Montagem - interpreta sintaxe com os parsers que o editor já utiliza.
export function criarRecursosPrevia(arquivos, diagnosticos) {
    const imports = {};
    const visitados = new Set();
    function imagem(referencia, origem) {
        const arquivo = resolverArquivoVirtual(arquivos, referencia, origem);
        if (!/\.svg$/i.test(arquivo.caminho)) throw new Error(`Recurso não suportado: ${arquivo.caminho}. O projeto armazena texto; imagens binárias ainda não podem ser importadas.`);
        return urlDados(arquivo.conteudo, "image/svg+xml");
    }
    function css(codigo, origem, ancestrais = new Set()) {
        // Pré-processamento definido pelo CSS antes da tokenização.
        codigo = codigo.replace(/\r\n?|\f/g, "\n").replace(/\0/g, "\uFFFD");
        const alteracoes = [];
        let fimURL = 0;
        const cursor = parserCSS.parse(codigo).cursor();
        do {
            const node = cursor.node;
            if (node.from < fimURL) continue;
            const importDireto = node.name === "StringLiteral" && node.parent?.name === "ImportStatement";
            const chamadaURL = node.name === "CallLiteral" && codigo.slice(node.from, node.to).match(/^url\s*\(/i);
            if (!importDireto && !chamadaURL) continue;
            if (chamadaURL) {
                const tag = node.getChild("StringLiteral") || node.getChild("ParenthesizedContent");
                if (!tag) continue;
                let fim = node.to, valor = codigo.slice(tag.from, tag.to);
                if (tag.name === "ParenthesizedContent") {
                    // O parser do editor termina o token em ')' mesmo quando escapado.
                    // Localiza o fechamento real sem interpretar parênteses escapados.
                    const inicio = node.getChild("(").to;
                    let posicao = inicio;
                    for (; posicao < codigo.length; posicao++) {
                        if (codigo[posicao] === "\\") { posicao++; continue; }
                        if (codigo[posicao] === ")") break;
                    }
                    if (posicao >= codigo.length) continue;
                    fim = posicao + 1;
                    valor = codigo.slice(inicio, posicao);
                }
                fimURL = fim;
                const referencia = textoCSS(valor, tag.name === "StringLiteral");
                substituir(referencia, { from: node.from, to: fim }, node.parent?.name === "ImportStatement", true);
            } else substituir(textoCSS(codigo.slice(node.from, node.to), true), node, true, false);
        } while (cursor.next());
        function substituir(referencia, node, importar, chamada) {
            // Fragmentos SVG do próprio documento não são referências a outro arquivo.
            if (!importar && referencia.startsWith("#")) return;
            let destino = "data:,";
            try {
                if (importar) {
                    const arquivo = resolverArquivoVirtual(arquivos, referencia, origem);
                    if (ancestrais.has(arquivo.caminho)) throw new Error(`Import CSS circular: ${arquivo.caminho}.`);
                    destino = urlDados(css(arquivo.conteudo, arquivo.caminho, new Set([...ancestrais, arquivo.caminho])), "text/css");
                } else destino = imagem(referencia, origem);
            } catch (erro) { diagnosticos.push(erro.message); }
            alteracoes.push({ from: node.from, to: node.to, texto: chamada ? `url("${destino}")` : JSON.stringify(destino) });
        }
        return aplicarAlteracoes(codigo, alteracoes);
    }
    function modulo(codigo, caminho, identidade = caminho) {
        const chave = "taskflow:/" + encodeURI(identidade);
        if (visitados.has(chave)) return chave;
        visitados.add(chave);
        const alteracoes = [];
        const cursor = parserJavaScript.parse(codigo).cursor();
        do {
            const node = cursor.node;
            if (node.name === "DynamicImport" && !node.getChild("String")) {
                diagnosticos.push(`Import dinâmico calculado não suportado: ${caminho}. Use uma referência literal.`);
            }
            if (node.name !== "String") continue;
            const pai = node.parent?.name;
            if (pai !== "ImportDeclaration" && pai !== "DynamicImport" &&
                !(pai === "ExportDeclaration" && node.prevSibling?.name === "from")) continue;
            const referencia = textoLiteral(codigo.slice(node.from, node.to));
            let destino = "taskflow:/arquivo-inexistente";
            try {
                const arquivo = resolverArquivoVirtual(arquivos, referencia, caminho);
                const ref = resolverReferenciaVirtual(referencia, caminho);
                destino = modulo(arquivo.conteudo, arquivo.caminho, arquivo.caminho + ref.consulta + ref.fragmento);
            } catch (erro) { diagnosticos.push(`${caminho}: ${erro.message}`); }
            alteracoes.push({ from: node.from, to: node.to, texto: JSON.stringify(destino) });
        } while (cursor.next());
        // O fragmento participa da identidade da URL sem alterar o código do módulo.
        // Reimportações da mesma chave reutilizam a URL; arquivos distintos não colidem.
        imports[chave] = urlDados(aplicarAlteracoes(codigo, alteracoes), "text/javascript") + "#" + encodeURIComponent(chave);
        return chave;
    }
    return { css, imagem, modulo, imports };
}
