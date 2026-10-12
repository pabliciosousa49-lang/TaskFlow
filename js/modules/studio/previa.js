import { resolverArquivoVirtual } from "./resolvedor.js";

// Prévia — Segurança - permite HTML e CSS locais; JavaScript continua desabilitado
const politicaPrevia = "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; " +
    "img-src 'none'; media-src 'none'; font-src 'none'; connect-src 'none'; " +
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
    "low high optimum max label span wrap"
).split(" "));

export function montarDocumentoPrevia(codigo, arquivos = [], caminhoHTML = "index.html") {
    const diagnosticos = [];
    const scripts = [];
    const estilos = [];
    // Template desconectado — Processamento - analisa sem inserir conteúdo na página principal
    const template = document.createElement("template");
    template.innerHTML = codigo;

    // Estilos — Montagem - mantém a ordem da cascata e serializa CSS no head do srcdoc.
    function adicionarEstilo(conteudo, media) {
        const style = document.createElement("style");
        style.textContent = conteudo.replace(/</g, "\\3c ");
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
                if (!elemento.hasAttribute("disabled")) adicionarEstilo(arquivo.conteudo, elemento.getAttribute("media"));
                elemento.remove();
            } catch (erro) {
                diagnosticos.push(erro.message);
                elemento.remove();
            }
            continue;
        }
        if (elemento.localName === "script") {
            const referencia = elemento.getAttribute("src");
            if (referencia !== null) {
                try {
                    const arquivo = resolverArquivoVirtual(arquivos, referencia, caminhoHTML);
                    scripts.push({ caminho: arquivo.caminho, conteudo: arquivo.conteudo });
                    diagnosticos.push(`JavaScript localizado: ${arquivo.caminho}. A execução está desabilitada neste ambiente.`);
                } catch (erro) { diagnosticos.push(erro.message); }
            } else diagnosticos.push("A execução de JavaScript inline está desabilitada neste ambiente.");
            elemento.remove();
            continue;
        }
        if (!elementosPermitidos.has(elemento.localName) ||
            elemento.namespaceURI !== "http://www.w3.org/1999/xhtml") {
            elemento.remove();
            continue;
        }

        for (const atributo of Array.from(elemento.attributes)) {
            const nome = atributo.name;
            // Âncoras locais ficam no próprio srcdoc; URLs e navegações externas são removidas.
            if (nome === "href" && elemento.localName === "a" && atributo.value.startsWith("#")) {
                elemento.setAttribute("href", `about:srcdoc${atributo.value}`);
            } else if (!atributosPermitidos.has(nome) && !nome.startsWith("aria-")) {
                elemento.removeAttribute(nome);
            }
        }
    }

    const documento = `<!DOCTYPE html><html lang="pt-BR"><head>` +
        `<meta http-equiv="Content-Security-Policy" content="${politicaPrevia}">` +
        `<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">` +
        `<style>html{color-scheme:light}body{overflow-wrap:anywhere}img{max-width:100%}</style>` +
        estilos.join("") +
        `</head><body>${template.innerHTML}</body></html>`;
    return { documento, diagnosticos: Array.from(new Set(diagnosticos)), scripts };
}

export function prepararDocumentoPrevia(codigo) {
    return montarDocumentoPrevia(codigo).documento;
}

// Prévia — Atualização - agrupa mudanças sem alterar o estado ou o foco do editor
export function criarPreviaHTML(iframe, mensagemVazia, painelDiagnosticos) {
    let temporizador;
    let ultimoCodigo = "";

    iframe.setAttribute("sandbox", "");

    function renderizar(codigo, arquivos, caminhoHTML) {
        const vazio = !codigo.trim();
        const resultado = montarDocumentoPrevia(codigo, arquivos, caminhoHTML);
        iframe.srcdoc = resultado.documento;
        iframe.hidden = vazio;
        mensagemVazia.hidden = !vazio;
        if (painelDiagnosticos) {
            painelDiagnosticos.replaceChildren();
            painelDiagnosticos.hidden = !resultado.diagnosticos.length;
            if (resultado.diagnosticos.length) {
                const lista = document.createElement("ul");
                for (const mensagem of resultado.diagnosticos) {
                    const item = document.createElement("li");
                    item.textContent = mensagem;
                    lista.append(item);
                }
                painelDiagnosticos.append(lista);
            }
        }
    }

    return {
        agendar(codigo, arquivos = [], caminhoHTML = "index.html") {
            const assinatura = JSON.stringify([codigo, caminhoHTML, arquivos.filter((item) => item.tipo === "arquivo").map((item) => [item.caminho, item.conteudo])]);
            if (assinatura === ultimoCodigo) return;
            ultimoCodigo = assinatura;
            clearTimeout(temporizador);
            temporizador = setTimeout(() => renderizar(codigo, arquivos, caminhoHTML), 300);
        }
    };
}
