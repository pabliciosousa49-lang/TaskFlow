// Prévia — Segurança - permite HTML básico e estilos locais, sem recursos externos
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

export function prepararDocumentoPrevia(codigo) {
    // Template desconectado — Processamento - analisa sem inserir conteúdo na página principal
    const template = document.createElement("template");
    template.innerHTML = codigo;

    for (const elemento of template.content.querySelectorAll("*")) {
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

    return `<!DOCTYPE html><html lang="pt-BR"><head>` +
        `<meta http-equiv="Content-Security-Policy" content="${politicaPrevia}">` +
        `<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">` +
        `<style>html{color-scheme:light}body{overflow-wrap:anywhere}img{max-width:100%}</style>` +
        `</head><body>${template.innerHTML}</body></html>`;
}

// Prévia — Atualização - agrupa mudanças sem alterar o estado ou o foco do editor
export function criarPreviaHTML(iframe, mensagemVazia) {
    let temporizador;
    let ultimoCodigo = "";

    iframe.setAttribute("sandbox", "");

    function renderizar(codigo) {
        const vazio = !codigo.trim();
        iframe.srcdoc = prepararDocumentoPrevia(codigo);
        iframe.hidden = vazio;
        mensagemVazia.hidden = !vazio;
    }

    return {
        agendar(codigo) {
            if (codigo === ultimoCodigo) return;
            ultimoCodigo = codigo;
            clearTimeout(temporizador);
            temporizador = setTimeout(() => renderizar(codigo), 300);
        }
    };
}
