import { resolverArquivoVirtual, resolverReferenciaVirtual } from "./resolvedor.js";
import { criarRecursosPrevia, urlDados } from "./recursos-previa.js";
import { codigoNavegacaoPrevia } from "./navegacao-previa.js";

// Prévia — Segurança - scripts locais incorporados, sem origem compartilhada ou rede.
const politicaPrevia = "default-src 'none'; script-src data:; script-src-attr 'none'; style-src 'unsafe-inline' data:; " +
    "img-src data:; media-src 'none'; font-src 'none'; connect-src 'none'; " +
    "frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";

const elementosPermitidos = new Set((
    "a abbr address article aside b bdi bdo blockquote br button caption cite code col colgroup " +
    "data datalist dd del details dfn div dl dt em fieldset figcaption figure footer form " +
    "h1 h2 h3 h4 h5 h6 header hgroup hr i img input ins kbd label legend li main map mark " +
    "menu meter nav ol optgroup option output p picture pre progress q rp rt ruby s samp " +
    "section select small source span strong style sub summary sup table tbody td textarea " +
    "tfoot th thead time title tr u ul var wbr"
).split(" "));

const atributosPermitidos = new Set((
    "id class title lang dir style role alt width height for name type value placeholder " +
    "checked selected disabled readonly required multiple min max step minlength maxlength " +
    "rows cols size colspan rowspan scope headers start reversed open datetime " +
    "low high optimum max label span wrap method autocomplete inputmode pattern accept spellcheck tabindex form novalidate"
).split(" "));

function criarCanalPrevia() {
    return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
}

export function montarDocumentoPrevia(codigo, arquivos = [], caminhoHTML = "index.html", canal = criarCanalPrevia(), referenciaAtual = caminhoHTML) {
    const diagnosticos = [];
    const scripts = [];
    const estilos = [];
    const recursos = criarRecursosPrevia(arquivos, diagnosticos);
    // Template desconectado — Processamento - analisa sem inserir conteúdo na página principal
    const template = document.createElement("template");
    template.innerHTML = codigo;

    // Estilos — Montagem - mantém a ordem da cascata e serializa CSS no head do srcdoc.
    function adicionarEstilo(conteudo, media, origem = caminhoHTML) {
        const style = document.createElement("style");
        style.textContent = recursos.css(conteudo, origem).replace(/</g, "\\3c ");
        if (media) style.setAttribute("media", media);
        estilos.push(style.outerHTML);
    }

    for (const elemento of template.content.querySelectorAll("*")) {
        if (elemento.localName === "style" && elemento.namespaceURI === "http://www.w3.org/1999/xhtml") {
            adicionarEstilo(elemento.textContent, elemento.getAttribute("media"));
            elemento.remove();
            continue;
        }
        if (elemento.localName === "link" && (elemento.getAttribute("rel") || "").toLowerCase().split(/\s+/).includes("stylesheet")) {
            try {
                const arquivo = resolverArquivoVirtual(arquivos, elemento.getAttribute("href"), caminhoHTML);
                if (!elemento.hasAttribute("disabled")) adicionarEstilo(arquivo.conteudo, elemento.getAttribute("media"), arquivo.caminho);
                elemento.remove();
            } catch (erro) {
                diagnosticos.push(`${caminhoHTML}: ${erro.message}`);
                elemento.remove();
            }
            continue;
        }
        if (elemento.localName === "script") {
            const tipo = (elemento.getAttribute("type") || "").trim().toLowerCase();
            const tiposJavaScript = ["", "text/javascript", "application/javascript", "text/ecmascript", "application/ecmascript", "module"];
            if (elemento.namespaceURI === "http://www.w3.org/1999/xhtml" && tiposJavaScript.includes(tipo)) {
                const referencia = elemento.getAttribute("src");
                try {
                    const arquivo = referencia !== null
                        ? resolverArquivoVirtual(arquivos, referencia, caminhoHTML)
                        : { caminho: caminhoHTML + " (inline)", conteudo: elemento.textContent };
                    scripts.push({ caminho: arquivo.caminho, conteudo: arquivo.conteudo, tipo });
                } catch (erro) { diagnosticos.push(`${caminhoHTML}: ${erro.message}`); }
            } else if (tipo === "importmap") {
                diagnosticos.push("Import maps personalizados não são suportados. Os imports relativos dos módulos são resolvidos pelo Laboratório.");
            }
            elemento.remove();
            continue;
        }
        if (!elementosPermitidos.has(elemento.localName) ||
            elemento.namespaceURI !== "http://www.w3.org/1999/xhtml") {
            elemento.remove();
            continue;
        }

        if (elemento.localName === "img") elemento.__referenciaImagem = elemento.getAttribute("src");
        if (elemento.localName === "a") elemento.__destino = elemento.getAttribute("href");
        if (elemento.localName === "form") elemento.__acao = elemento.getAttribute("action");
        for (const atributo of Array.from(elemento.attributes)) {
            const nome = atributo.name;
            if (nome === "style") elemento.setAttribute("style", recursos.css("a{" + atributo.value + "}", caminhoHTML).slice(2, -1));
            // Âncoras locais ficam no próprio srcdoc; URLs e navegações externas são removidas.
            if (nome === "href" && elemento.localName === "a" && atributo.value.startsWith("#")) {
                elemento.setAttribute("href", `about:srcdoc${atributo.value}`);
            } else if (!atributosPermitidos.has(nome) && !nome.startsWith("aria-") && !(nome.startsWith("data-") && !nome.startsWith("data-taskflow-"))) {
                elemento.removeAttribute(nome);
                if (!["src", "href", "action"].includes(nome)) diagnosticos.push(`${caminhoHTML}: atributo “${nome}” removido por restrição da prévia.`);
            }
        }
        if (elemento.localName === "img" && elemento.__referenciaImagem) {
            try { elemento.setAttribute("src", recursos.imagem(elemento.__referenciaImagem, caminhoHTML)); }
            catch (erro) { diagnosticos.push(`${caminhoHTML}: ${erro.message}`); }
        }
        if (elemento.localName === "a" && elemento.__destino && !elemento.__destino.startsWith("#")) {
            try {
                const destino = resolverReferenciaVirtual(elemento.__destino, caminhoHTML);
                const arquivo = resolverArquivoVirtual(arquivos, elemento.__destino, caminhoHTML);
                if (!/\.html?$/i.test(arquivo.caminho)) throw new Error("Links da prévia devem apontar para HTML.");
                elemento.setAttribute("href", "#");
                elemento.setAttribute("data-taskflow-destino", "/" + destino.caminho + destino.consulta + destino.fragmento);
            } catch (erro) { diagnosticos.push(`${caminhoHTML}: ${erro.message}`); }
        }
        if (elemento.localName === "form") elemento.setAttribute("data-taskflow-action", elemento.__acao || "/" + caminhoHTML);
    }

    // Scripts — Montagem - base64 conserva o código, inclusive Unicode e </script> em strings.
    // Todos são deferidos: o DOM fica disponível e scripts clássicos mantêm a ordem do HTML.
    const codigoScripts = scripts.map(({ conteudo, tipo, caminho }, indice) => {
        const inline = caminho.endsWith(" (inline)");
        const chave = recursos.modulo(conteudo, inline ? caminhoHTML : caminho, inline ? caminhoHTML + "#inline-" + indice : caminho);
        const origem = recursos.imports[chave];
        return '<script src="' + origem + '"' + (tipo === "module" ? ' type="module"' : ' defer') + '></script>';
    }).join("");
    const mapa = Object.keys(recursos.imports).length
        ? '<script type="importmap" nonce="' + canal + '">' + JSON.stringify({ imports: recursos.imports }).replace(/</g, "\\u003c") + '</script>' : "";
    const ponte = canal ? '<script src="' + urlDados(codigoNavegacaoPrevia(canal, referenciaAtual), "text/javascript") + '" defer></script>' : "";
    // A segunda política limita a autorização do nonce a URLs data: e código inline.
    // Scripts de rede continuam bloqueados mesmo que o projeto copie o nonce.
    const politica = politicaPrevia.replace("script-src data:", "script-src data: 'nonce-" + canal + "'");
    const documento = `<!DOCTYPE html><html lang="pt-BR"><head>` +
        `<meta http-equiv="Content-Security-Policy" content="${politica}">` +
        `<meta http-equiv="Content-Security-Policy" content="script-src data: 'unsafe-inline'; script-src-attr 'none'">` +
        `<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">` +
        `<style>html{color-scheme:light}body{overflow-wrap:anywhere}img{max-width:100%}</style>` +
        estilos.join("") + mapa + ponte + codigoScripts +
        `</head><body>${template.innerHTML}</body></html>`;
    const fontes = new Map(Object.entries(recursos.imports).filter(([chave]) => !chave.includes("#inline-")).map(([chave]) => [chave, chave.replace(/^taskflow:\//, "").split(/[?#]/)[0]]));
    return { documento, diagnosticos: Array.from(new Set(diagnosticos)), scripts, fontes };
}

export function prepararDocumentoPrevia(codigo) {
    return montarDocumentoPrevia(codigo).documento;
}

// Prévia — Atualização - agrupa mudanças sem alterar o estado ou o foco do editor
export function criarPreviaHTML(iframe, mensagemVazia, painelDiagnosticos, { aoEstado = () => {}, aoMensagem = () => {} } = {}) {
    let temporizador, ultimaAssinatura = "", assinaturaPedida = "", canal = "", arquivosAtuais = [], entrada = "", projeto = "";
    let historico = [], indice = -1, diagnosticos = [], fontes = new Map(), pendencia, automatica = true, recebidas = 0;
    // Habilita validação e submit nativos; form-action 'none' continua impedindo envios de rede.
    iframe.setAttribute("sandbox", "allow-scripts allow-forms");
    function mostrarDiagnosticos() {
        if (!painelDiagnosticos) return;
        diagnosticos = diagnosticos.slice(-100);
        painelDiagnosticos.replaceChildren();
        painelDiagnosticos.hidden = !diagnosticos.length;
        const lista = document.createElement("ul");
        for (const mensagem of [...new Set(diagnosticos)]) {
            const item = document.createElement("li"); item.textContent = mensagem; lista.append(item);
        }
        painelDiagnosticos.append(lista);
    }
    function renderizar() {
        const atual = historico[indice];
        const arquivo = atual ? arquivosAtuais.find(item => item.tipo === "arquivo" && item.caminho === atual.caminho) : null;
        canal = criarCanalPrevia(); recebidas = 0;
        const resultado = montarDocumentoPrevia(arquivo?.conteudo || "", arquivosAtuais, atual?.caminho || "index.html", canal, atual ? atual.caminho + atual.consulta + atual.fragmento : "index.html");
        fontes = resultado.fontes;
        diagnosticos = resultado.diagnosticos;
        if (atual && !arquivo) diagnosticos.push("Arquivo não encontrado: " + atual.caminho);
        iframe.srcdoc = resultado.documento;
        iframe.hidden = !arquivo?.conteudo.trim(); mensagemVazia.hidden = !iframe.hidden;
        mostrarDiagnosticos(); notificarEstado(true);
    }
    function aplicar() {
        clearTimeout(temporizador);
        if (pendencia) {
            const { codigo, arquivos, caminho, id, assinatura } = pendencia;
            arquivosAtuais = arquivos;
            // Um HTML antes vazio precisa recuperar sua entrada ao receber conteúdo.
            if (projeto !== id || entrada !== caminho || !codigo || !historico.length) {
                historico = codigo ? [{ caminho, consulta: "", fragmento: "" }] : []; indice = codigo ? 0 : -1;
            }
            projeto = id; entrada = caminho; ultimaAssinatura = assinatura; pendencia = null;
        }
        renderizar();
    }
    function receber(event) {
        const dados = event.data;
        if (event.source !== iframe.contentWindow || event.origin !== "null" || !canal || dados?.canal !== canal) return;
        if (dados.tipo === "console") {
            if (++recebidas > 500 || !["log", "info", "warn", "error"].includes(dados.nivel) || typeof dados.texto !== "string" || dados.texto.length > 4096) return;
            const caminho = typeof dados.origem === "string" ? fontes.get(dados.origem) : undefined;
            const linha = Number.isSafeInteger(dados.linha) && dados.linha > 0 && dados.linha < 10000000 ? dados.linha : undefined;
            const coluna = Number.isSafeInteger(dados.coluna) && dados.coluna > 0 && dados.coluna < 10000000 ? dados.coluna : undefined;
            aoMensagem({ nivel: dados.nivel, texto: dados.texto, caminho, linha, coluna }); return;
        }
        if (!["navegar", "substituir", "voltar", "erro"].includes(dados.tipo)) return;
        if (dados.tipo === "voltar") {
            if (indice > 0) { indice--; clearTimeout(temporizador); renderizar(); } return;
        }
        if (typeof dados.referencia !== "string" || dados.referencia.length > 2048) return;
        if (dados.tipo === "erro") {
            diagnosticos.push(dados.referencia); mostrarDiagnosticos(); return;
        }
        try {
            const atual = historico[indice]; if (!atual) return;
            const destino = resolverReferenciaVirtual(dados.referencia, atual.caminho);
            const arquivo = resolverArquivoVirtual(arquivosAtuais, dados.referencia, atual.caminho);
            if (!/\.html?$/i.test(arquivo.caminho)) throw new Error("A navegação deve apontar para um arquivo HTML.");
            if (dados.tipo === "substituir") historico[indice] = destino;
            else { historico = historico.slice(0, indice + 1); historico.push(destino); indice++; }
            clearTimeout(temporizador); renderizar();
        } catch (erro) { diagnosticos.push(erro.message); mostrarDiagnosticos(); }
    }
    window.addEventListener("message", receber);
    function notificarEstado(executando) {
        const atual = historico[indice];
        aoEstado({ pendente: Boolean(pendencia), executando, caminho: atual ? "/" + atual.caminho + atual.consulta + atual.fragmento : "" });
    }
    return {
        definirAutomatica(valor) {
            automatica = Boolean(valor); clearTimeout(temporizador);
            if (automatica && pendencia) temporizador = setTimeout(aplicar, 300);
        },
        atualizar: aplicar,
        agendar(codigo, arquivos = [], caminhoHTML = "index.html", idProjeto = "") {
            const assinatura = JSON.stringify([codigo, caminhoHTML, idProjeto, arquivos.filter(item => item.tipo === "arquivo").map(item => [item.caminho, item.conteudo])]);
            if (assinatura === assinaturaPedida) return;
            assinaturaPedida = assinatura;
            const itens = arquivos.map(item => item.tipo === "arquivo" && item.caminho === caminhoHTML ? { ...item, conteudo: codigo } : item);
            if (!itens.some(item => item.tipo === "arquivo" && item.caminho === caminhoHTML) && codigo) itens.push({ tipo: "arquivo", caminho: caminhoHTML, conteudo: codigo });
            const novoContexto = projeto !== idProjeto || entrada !== caminhoHTML;
            pendencia = assinatura === ultimaAssinatura ? null : { codigo, arquivos: itens, caminho: caminhoHTML, id: idProjeto, assinatura };
            clearTimeout(temporizador);
            if (novoContexto) canal = "";
            notificarEstado(false);
            if (pendencia && (automatica || novoContexto)) temporizador = setTimeout(aplicar, 300);
        }
    };
}
