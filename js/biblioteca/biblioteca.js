const pagina = document.querySelector("main[data-tecnologia]") || document.querySelector("[data-biblioteca-central]");
const central = pagina.dataset.bibliotecaCentral !== undefined;
const linguagensGuia = new Map();
const catalogoCentral = new Map();
let tecnologiaConstruida = pagina.dataset.tecnologia;
let documentacaoHTML = pagina.dataset.tecnologia === "html";
let documentacaoCSS = pagina.dataset.tecnologia === "css";
let documentacaoProgramacao = ["javascript", "typescript", "react"].includes(pagina.dataset.tecnologia);
let documentacaoCompleta = documentacaoHTML || documentacaoCSS || documentacaoProgramacao;
const menu = document.querySelector("#biblioteca-menu");
const alternarMenu = document.querySelector("#biblioteca-alternar-menu");
const niveis = document.querySelector("#biblioteca-niveis");
const tamanhoMobile = window.matchMedia(documentacaoProgramacao ? "(max-width: 1000px)" : "(max-width: 760px)");
const modelos = {
    html: () => import("../../data/biblioteca/html/conteudos.js"),
    css: () => import("../../data/biblioteca/css/conteudos.js"),
    javascript: () => import("../../data/biblioteca/javascript/conteudos.js"),
    typescript: () => import("../../data/biblioteca/typescript/conteudos.js"),
    react: () => import("../../data/biblioteca/react/conteudos.js")
};
let menuAberto = false;
const leitura = document.querySelector("#biblioteca-leitura");
const estadoVazio = document.querySelector("#biblioteca-estado-vazio");
const navegacaoAssuntos = document.querySelector(".biblioteca-conteudos-navegacao");
const [anterior, proximo] = navegacaoAssuntos.querySelectorAll("button");
const assuntosOrdenados = [];
let conteudoLeitura;
let assuntoAtual = -1;
let limparPesquisaCentral;

// Menu — Responsividade - mantém navegação no fluxo, sem sobrepor o conteúdo
function atualizarMenu() {
    menu.hidden = tamanhoMobile.matches && !menuAberto;
    alternarMenu.hidden = !tamanhoMobile.matches;
    alternarMenu.setAttribute("aria-expanded", String(!menu.hidden));
    alternarMenu.textContent = menu.hidden ? "Mostrar níveis" : "Ocultar níveis";
    (central ? pagina : document.body).dataset.menuAberto = String(!menu.hidden);
}

alternarMenu.disabled = false;
alternarMenu.addEventListener("click", () => { menuAberto = !menuAberto; atualizarMenu(); });
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && tamanhoMobile.matches && menuAberto) {
        menuAberto = false;
        atualizarMenu();
        alternarMenu.focus();
    }
});
function ajustarLargura() { menuAberto = false; atualizarMenu(); }
if (tamanhoMobile.addEventListener) tamanhoMobile.addEventListener("change", ajustarLargura);
else tamanhoMobile.addListener(ajustarLargura);
atualizarMenu();

// Assuntos — Leitura - usa somente texto, inclusive para exemplos de HTML.
function destacarHTML(codigo, destino) {
    // Tokens são textos; nunca são inseridos como marcação na documentação.
    const tokens = /<!--[\s\S]*?(?:-->|$)|<![^>]*>|<\/?[a-zA-Z](?:"[^"]*"|'[^']*'|[^'">])*>/g;
    function trecho(texto, classe) {
        const span = document.createElement("span");
        span.className = classe;
        span.textContent = texto;
        destino.append(span);
    }
    let fim = 0;
    for (const token of codigo.matchAll(tokens)) {
        trecho(codigo.slice(fim, token.index), "biblioteca-token-texto");
        const tag = token[0];
        if (tag.startsWith("<!--")) trecho(tag, "biblioteca-token-comentario");
        else if (tag.startsWith("<!")) trecho(tag, "biblioteca-token-tag");
        else {
            const inicio = tag.match(/^<\/?[\w:-]+/)[0];
            trecho(inicio, "biblioteca-token-tag");
            const atributos = /\s+[^\s=/>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/g;
            const resto = tag.slice(inicio.length, tag.endsWith("/>") ? -2 : -1);
            let ultimo = 0;
            for (const atributo of resto.matchAll(atributos)) {
                trecho(resto.slice(ultimo, atributo.index), "biblioteca-token-texto");
                const partes = atributo[0].match(/^(\s+)([^\s=]+)(\s*=\s*)?([\s\S]*)$/);
                trecho(partes[1], "biblioteca-token-texto");
                trecho(partes[2], "biblioteca-token-atributo");
                if (partes[3]) trecho(partes[3], "biblioteca-token-texto");
                if (partes[4]) trecho(partes[4], "biblioteca-token-valor");
                ultimo = atributo.index + atributo[0].length;
            }
            trecho(resto.slice(ultimo), "biblioteca-token-texto");
            trecho(tag.endsWith("/>") ? "/>" : ">", "biblioteca-token-tag");
        }
        fim = token.index + tag.length;
    }
    trecho(codigo.slice(fim), "biblioteca-token-texto");
}

// CSS — Destaque - tokens tratados como texto, sem executar marcação.
function destacarCSS(codigo, destino) {
    const tokens = /\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#[\da-f]{3,8}\b|@[\w-]+|--[\w-]+|[\w-]+(?=\s*:)|[.#][a-z_][\w-]*|\b\d+(?:\.\d+)?(?:px|rem|em|vh|vw|ms|s|deg|%)?/gi;
    let fim = 0;
    function trecho(texto, classe) { const span = document.createElement("span"); span.className = classe; span.textContent = texto; destino.append(span); }
    for (const token of codigo.matchAll(tokens)) {
        trecho(codigo.slice(fim, token.index), "biblioteca-token-texto");
        const valor = token[0];
        trecho(valor, valor.startsWith("/*") ? "biblioteca-token-comentario" : /^["'\d#]/.test(valor) ? "biblioteca-token-valor" : valor.startsWith("@") || /^[.#]/.test(valor) ? "biblioteca-token-tag" : "biblioteca-token-atributo");
        fim = token.index + valor.length;
    }
    trecho(codigo.slice(fim), "biblioteca-token-texto");
}

// Programação — Destaque - coloração lexical; código permanece texto inerte.
function destacarScript(codigo, destino) {
    const tokens = /\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:const|let|function|return|if|else|for|of|import|from|export|default|async|await|try|catch|throw|new|typeof|interface|type|extends|readonly|unknown|never|number|string|boolean|void|true|false|null|undefined)\b|\b\d+(?:\.\d+)?\b/g;
    let fim = 0;
    function trecho(texto, classe) { const span = document.createElement("span"); span.className = classe; span.textContent = texto; destino.append(span); }
    for (const token of codigo.matchAll(tokens)) {
        trecho(codigo.slice(fim, token.index), "biblioteca-token-texto");
        trecho(token[0], token[0].startsWith("//") || token[0].startsWith("/*") ? "biblioteca-token-comentario" : /^["'`\d]/.test(token[0]) ? "biblioteca-token-valor" : "biblioteca-token-tag");
        fim = token.index + token[0].length;
    }
    trecho(codigo.slice(fim), "biblioteca-token-texto");
}

// Resultado — Isolamento - somente elementos visuais no iframe de origem opaca.
function documentoResultado(assunto, cssExemplo = null) {
    const fonte = assunto.contextoExemplo === "documento"
        ? assunto.exemploCodigo.match(/<body\b[^>]*>([\s\S]*?)<\/body\s*>/i)?.[1] || ""
        : assunto.exemploCodigo;
    const modelo = document.createElement("template");
    modelo.innerHTML = fonte; // Template destacado e inerte; seu conteúdo nunca entra no DOM da Biblioteca.
    const permitidos = new Set("a abbr address article aside audio b blockquote br button caption code dd details div dl dt em fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hr i img input label legend li main nav ol option p pre section select small source span strong summary table tbody td textarea th thead time tr track ul video".split(" "));
    for (const elemento of modelo.content.querySelectorAll("*")) {
        if (!permitidos.has(elemento.localName)) { elemento.remove(); continue; }
        for (const atributo of [...elemento.attributes]) {
            const nome = atributo.name.toLowerCase();
            if (cssExemplo !== null && nome === "style") continue;
            if (cssExemplo !== null && elemento.localName === "img" && nome === "src" && /^data:image\/svg\+xml;base64,[a-z0-9+/=]+$/i.test(atributo.value)) continue;
            if (nome.startsWith("on") || ["src", "srcset", "poster", "style", "srcdoc", "href", "action", "formaction", "formtarget", "target", "download", "ping", "background", "autofocus"].includes(nome)) elemento.removeAttribute(atributo.name);
        }
        if (elemento.localName === "a" && !elemento.hasAttribute("href")) elemento.setAttribute("aria-disabled", "true");
    }
    const politica = "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src 'none'; media-src 'none'; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
    const estilos = cssExemplo === null ? "" : `<style>${cssExemplo.replace(/</g, "\\3c ")} @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }</style>`;
    return `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="${cssExemplo === null ? politica : politica.replace("img-src 'none'", "img-src data:")}"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Resultado do exemplo</title><style>body{margin:16px;overflow-wrap:anywhere}img,video,audio{max-width:100%}a{color:#0000ee;text-decoration:underline}pre{overflow:auto}input,select,textarea{max-width:100%;box-sizing:border-box}</style>${estilos}</head><body>${modelo.innerHTML}</body></html>`;
}

function blocoResultado(assunto) {
    const secao = document.createElement("section");
    const titulo = document.createElement("h2");
    const apenasEfeito = assunto.contextoExemplo === "head" || assunto.resultadoVisual === false;
    titulo.textContent = apenasEfeito ? "Efeito no navegador" : "Resultado";
    secao.append(titulo);
    if (apenasEfeito) {
        const efeito = document.createElement("p");
        efeito.textContent = assunto.efeitoNavegador;
        secao.append(efeito);
        return secao;
    }
    const janela = document.createElement("div");
    janela.className = "biblioteca-resultado";
    const barra = document.createElement("div");
    barra.className = "biblioteca-resultado-barra";
    barra.textContent = documentacaoCSS ? "Prévia do exemplo · CSS" : "Prévia do exemplo · HTML";
    const iframe = document.createElement("iframe");
    iframe.title = `Resultado: ${assunto.titulo}`;
    iframe.setAttribute("sandbox", "");
    iframe.setAttribute("referrerpolicy", "no-referrer");
    iframe.setAttribute("allow", "camera 'none'; microphone 'none'; geolocation 'none'");
    iframe.srcdoc = documentacaoCSS
        ? documentoResultado({ ...assunto, exemploCodigo: assunto.exemploHTML }, assunto.exemploCodigo)
        : documentoResultado(assunto);
    janela.append(barra, iframe);
    const observacao = document.createElement("p");
    observacao.className = "biblioteca-exemplo-contexto";
    observacao.textContent = documentacaoCSS ? "A prévia combina o CSS principal com os estilos de apoio. Consulte o bloco expansível para copiar o exemplo completo. O viewport é esta janela; JavaScript, envios e recursos de rede ficam bloqueados. Movimento reduzido é respeitado." : `${assunto.efeitoNavegador || "Esta prévia mostra o HTML com os estilos padrão do navegador."} Links, envio de formulários, recursos externos e JavaScript ficam bloqueados nesta demonstração.`;
    secao.append(janela, observacao);
    return secao;
}

function blocoCodigo(valor, titulo, linguagem = documentacaoCSS ? "css" : documentacaoProgramacao ? pagina.dataset.tecnologia === "react" ? "jsx" : pagina.dataset.tecnologia : "html") {
    const bloco = document.createElement("div");
    bloco.className = "biblioteca-codigo";
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    if (documentacaoCSS && linguagem === "css") destacarCSS(valor, code);
    else if (["javascript", "typescript", "jsx"].includes(linguagem)) destacarScript(valor, code);
    else if (documentacaoCompleta) destacarHTML(valor, code);
    else code.textContent = valor;
    pre.tabIndex = 0;
    pre.setAttribute("aria-label", titulo);
    pre.append(code);
    if (documentacaoCompleta) {
        const ferramentas = document.createElement("div");
        ferramentas.className = "biblioteca-codigo-ferramentas";
        const rotulo = document.createElement("span");
        rotulo.textContent = linguagem === "jsx" ? "JSX / React" : linguagem.toUpperCase();
        const copiar = document.createElement("button");
        copiar.type = "button";
        copiar.textContent = "Copiar código";
        copiar.setAttribute("aria-label", `Copiar código: ${titulo}`);
        const resultado = document.createElement("p");
        resultado.className = "biblioteca-copia-resultado";
        resultado.setAttribute("role", "status");
        copiar.addEventListener("click", async () => {
            try {
                if (!navigator.clipboard?.writeText) throw new Error("Cópia indisponível.");
                await navigator.clipboard.writeText(code.textContent);
                resultado.textContent = "Código copiado.";
            } catch {
                const selecao = window.getSelection();
                const intervalo = document.createRange();
                intervalo.selectNodeContents(code);
                selecao.removeAllRanges();
                selecao.addRange(intervalo);
                pre.focus();
                resultado.textContent = "Código selecionado. Use Ctrl+C, ⌘C ou a opção Copiar do dispositivo.";
            }
        });
        ferramentas.append(rotulo, copiar);
        if (documentacaoHTML || documentacaoProgramacao || central) {
            const corpo = document.createElement("div");
            corpo.className = "biblioteca-html-codigo-corpo";
            const linhas = document.createElement("span");
            linhas.className = "biblioteca-html-linhas";
            linhas.setAttribute("aria-hidden", "true");
            linhas.textContent = valor.split("\n").map((_, indice) => indice + 1).join("\n");
            corpo.append(linhas, pre);
            bloco.append(ferramentas, corpo, resultado);
        } else bloco.append(ferramentas, pre, resultado);
    } else bloco.append(pre);
    return bloco;
}

function blocoLeitura(titulo, valor, codigo = false) {
    const secao = document.createElement("section");
    const cabecalho = document.createElement("h2");
    cabecalho.textContent = titulo;
    secao.append(cabecalho);
    if (codigo) {
        secao.append(blocoCodigo(valor, titulo));
    } else if (Array.isArray(valor)) {
        const lista = document.createElement("ul");
        for (const texto of valor) {
            const item = document.createElement("li");
            item.textContent = texto;
            lista.append(item);
        }
        secao.append(lista);
    } else {
        const texto = document.createElement("p");
        texto.textContent = valor;
        secao.append(texto);
    }
    return secao;
}

function selecionarAssunto(indice, focar = true, reiniciarLeitura = false) {
    const registro = assuntosOrdenados[indice];
    if (!registro) return;
    if (central) {
        document.querySelector("#biblioteca-central-cabecalho").hidden = false;
        leitura.setAttribute("aria-labelledby", "biblioteca-titulo");
        pagina.dataset.tecnologia = registro.tecnologia;
        documentacaoHTML = registro.tecnologia === "html";
        documentacaoCSS = registro.tecnologia === "css";
        documentacaoProgramacao = !documentacaoHTML && !documentacaoCSS;
        documentacaoCompleta = true;
        const linguagem = catalogoCentral.get(registro.tecnologia);
        document.querySelector("#biblioteca-central-breadcrumb").textContent = `${linguagem.nome} › ${registro.nivel.nome} › ${registro.assunto.titulo}`;
        document.querySelector("#biblioteca-central-icone").src = `./assets/images/biblioteca-${registro.tecnologia}.svg`;
        document.querySelector("#biblioteca-central-original").href = `./pages/biblioteca/${registro.tecnologia}.html`;
        linguagensGuia.get(registro.tecnologia).open = true;
    }
    const mudouAssunto = assuntoAtual !== indice;
    assuntoAtual = indice;
    const { assunto, nivel, modulo, botao, painel, categoria, detalhes } = registro;
    document.querySelector("#biblioteca-titulo").textContent = assunto.titulo;
    if (documentacaoHTML && !central) document.querySelector("#biblioteca-html-breadcrumb").textContent = `HTML › ${nivel.nome} › ${assunto.titulo}`;
    document.querySelector("#biblioteca-nivel").textContent = `${nivel.nome} · ${modulo.titulo || modulo.nome}`;
    if (documentacaoProgramacao && !central) {
        const nome = { javascript: "JavaScript", typescript: "TypeScript", react: "React" }[pagina.dataset.tecnologia];
        document.querySelector("#biblioteca-programacao-breadcrumb").textContent = `${nome} › ${nivel.nome} › ${modulo.titulo || modulo.nome} › ${assunto.titulo}`;
    }
    for (const item of assuntosOrdenados) item.botao.removeAttribute("aria-current");
    botao.setAttribute("aria-current", "true");
    painel.hidden = false;
    categoria.setAttribute("aria-expanded", "true");
    if (detalhes) detalhes.open = true;
    if (!conteudoLeitura) {
        conteudoLeitura = document.createElement("div");
        conteudoLeitura.className = "biblioteca-conteudo";
        leitura.insertBefore(conteudoLeitura, navegacaoAssuntos);
    }
    conteudoLeitura.replaceChildren();
    if ((central && !documentacaoHTML) || documentacaoProgramacao) {
        apresentarConteudoCentral(conteudoLeitura, assunto);
    } else if (documentacaoCSS) {
        conteudoLeitura.append(blocoLeitura("O que é", assunto.explicacao), blocoLeitura("Quando usar", assunto.aplicacaoReal));
        const exemplo = document.createElement("section");
        exemplo.className = modulo.id === "responsividade" ? "biblioteca-css-exemplo biblioteca-css-exemplo-amplo" : "biblioteca-css-exemplo";
        exemplo.append(blocoLeitura("CSS principal", assunto.codigoPrincipal, true), blocoResultado(assunto));
        conteudoLeitura.append(exemplo);
        if (assunto.orientacao) {
            const orientacao = blocoLeitura("Observe na prévia", assunto.orientacao);
            orientacao.className = "biblioteca-css-orientacao";
            conteudoLeitura.append(orientacao);
        }
        const apoio = document.createElement("details");
        apoio.className = "biblioteca-sintaxe";
        const resumo = document.createElement("summary");
        resumo.textContent = "HTML e estilos de apoio · exemplo completo para copiar";
        apoio.append(resumo, blocoLeitura("Como reproduzir", "Use o HTML abaixo dentro do body. No CSS, os estilos de apoio vêm antes do CSS principal; a prévia usa exatamente essa composição."),
            blocoCodigo(assunto.exemploHTML, "HTML do exemplo", "html"),
            blocoCodigo(assunto.estilosApoio, "Estilos de apoio"),
            blocoCodigo(assunto.exemploCodigo, "CSS completo"));
        if (assunto.htmlReferencia) apoio.append(blocoCodigo(assunto.htmlReferencia, "Conexão no HTML", "html"));
        conteudoLeitura.append(apoio, blocoLeitura("Entenda o código", assunto.responsabilidadeCodigo));
        const cuidados = blocoLeitura("Cuidados e erros comuns", assunto.boasPraticas);
        cuidados.className = "biblioteca-observacao";
        conteudoLeitura.append(cuidados);
        const relacionados = (assunto.relacionados || []).map(id => assuntosOrdenados.findIndex(item => item.assunto.id === id)).filter(i => i >= 0 && i !== indice);
        if (relacionados.length) {
            const secao = document.createElement("section");
            secao.className = "biblioteca-css-relacionados";
            const titulo = document.createElement("h2"); titulo.textContent = "Veja também";
            secao.append(titulo);
            for (const i of relacionados) {
                const link = document.createElement("button"); link.type = "button";
                link.textContent = assuntosOrdenados[i].assunto.titulo;
                link.addEventListener("click", () => selecionarAssunto(i));
                secao.append(link);
            }
            conteudoLeitura.append(secao);
        }
    } else {
        const contexto = document.createElement("p");
        contexto.className = "biblioteca-exemplo-contexto";
        contexto.textContent = assunto.contextoExemplo === "documento"
            ? "Exemplo completo: salve como um arquivo .html em UTF-8."
            : assunto.contextoExemplo === "head"
                ? "Exemplo para inserir dentro de <head> de um documento HTML completo."
                : "Exemplo para inserir dentro de <body> de um documento HTML completo.";
        const exemplo = blocoLeitura(documentacaoHTML ? "Exemplo de código" : "Exemplo prático", assunto.exemploCodigo, true);
        exemplo.insertBefore(contexto, exemplo.querySelector(".biblioteca-codigo"));
        if (documentacaoHTML) {
            const referencia = document.createElement("details");
            referencia.className = "biblioteca-sintaxe";
            const resumo = document.createElement("summary");
            resumo.textContent = "Consultar sintaxe de referência";
            referencia.append(resumo, blocoCodigo(assunto.sintaxe, "Sintaxe"));
            exemplo.insertBefore(referencia, contexto);
        }
        if (documentacaoHTML) {
            const dica = document.createElement("aside");
            dica.className = "biblioteca-html-dica";
            const tituloDica = document.createElement("h2");
            const lampada = document.createElement("span");
            lampada.setAttribute("aria-hidden", "true"); lampada.textContent = "💡";
            const rotulo = document.createElement("span"); rotulo.textContent = "Dica";
            tituloDica.append(lampada, rotulo);
            const textoDica = document.createElement("p");
            textoDica.textContent = assunto.boasPraticas.at(-1);
            dica.append(tituloDica, textoDica);
            conteudoLeitura.append(
                blocoLeitura("Conceito", assunto.explicacao),
                exemplo,
                blocoLeitura("Entenda o exemplo", assunto.responsabilidadeCodigo),
                dica,
                blocoResultado(assunto),
                blocoLeitura("Aplicação prática", assunto.aplicacaoReal)
            );
            const observacoes = assunto.boasPraticas.slice(0, -1);
            if (observacoes.length) {
                const boasPraticas = blocoLeitura("Observações importantes", observacoes);
                boasPraticas.className = "biblioteca-observacao";
                conteudoLeitura.append(boasPraticas);
            }
        } else conteudoLeitura.append(
            blocoLeitura("Objetivo", assunto.objetivo),
            blocoLeitura("Explicação", assunto.explicacao),
            blocoLeitura("Sintaxe", assunto.sintaxe, true),
            exemplo,
            blocoLeitura("Responsabilidade", assunto.responsabilidadeCodigo),
            blocoLeitura("Aplicação real", assunto.aplicacaoReal),
            blocoLeitura("Boas práticas", assunto.boasPraticas)
        );
    }
    if (central) pagina.dispatchEvent(new CustomEvent("biblioteca:selecao", { detail: { linguagem: registro.tecnologia, topico: assunto.id, titulo: assunto.titulo } }));
    estadoVazio.hidden = true;
    navegacaoAssuntos.hidden = false;
    anterior.disabled = indice === 0;
    proximo.disabled = indice === assuntosOrdenados.length - 1;
    if (focar) {
        menuAberto = false;
        atualizarMenu();
        if (central || documentacaoHTML || documentacaoCSS || documentacaoProgramacao || reiniciarLeitura) {
            // HTML/CSS — Leitura - retorna ao título sem deslocar a rolagem interna do guia.
            const posicaoMenu = menu.scrollTop;
            leitura.focus({ preventScroll: true });
            if (mudouAssunto || reiniciarLeitura || documentacaoHTML || documentacaoProgramacao || central) {
                leitura.scrollTop = 0;
                leitura.scrollIntoView({ block: "start", behavior: "instant" });
            }
            menu.scrollTop = posicaoMenu;
        } else leitura.focus();
    }
}

anterior.addEventListener("click", () => selecionarAssunto(assuntoAtual - 1));
proximo.addEventListener("click", () => selecionarAssunto(assuntoAtual + 1));

function listaAssuntos(assuntos, nivel, modulo, painel, categoria, detalhes) {
    const lista = document.createElement("ul");
    lista.className = "biblioteca-assuntos";
    for (const assunto of assuntos) {
        const item = document.createElement("li");
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "biblioteca-assunto";
        botao.textContent = assunto.titulo || assunto.nome || assunto.id;
        const indice = assuntosOrdenados.length;
        assuntosOrdenados.push({ assunto, nivel, modulo, botao, painel, categoria, detalhes, tecnologia: tecnologiaConstruida });
        botao.addEventListener("click", () => selecionarAssunto(indice));
        item.append(botao);
        lista.append(item);
    }
    return lista;
}

// Níveis — Apresentação - gera as categorias exclusivamente a partir do modelo carregado
function construirNiveis(dados, destino = niveis, limpar = true) {
    if (limpar) { destino.replaceChildren(); assuntosOrdenados.length = 0; }
    tecnologiaConstruida = dados.id;
    dados.niveis.forEach((nivel, indice) => {
        const grupo = document.createElement("section");
        grupo.className = "biblioteca-grupo";
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "biblioteca-categoria";
        const painel = document.createElement("div");
        painel.id = `biblioteca-nivel-${central ? dados.id + "-" : ""}${nivel.id}`;
        painel.className = "biblioteca-categoria-conteudo";
        painel.hidden = true;
        botao.setAttribute("aria-controls", painel.id);
        botao.setAttribute("aria-expanded", "false");
        const numero = document.createElement("span");
        numero.className = "biblioteca-categoria-numero";
        numero.setAttribute("aria-hidden", "true");
        numero.textContent = String(indice + 1).padStart(2, "0");
        const nome = document.createElement("span");
        nome.textContent = nivel.nome;
        const seta = document.createElement("span");
        seta.className = "biblioteca-categoria-seta";
        seta.setAttribute("aria-hidden", "true");
        seta.textContent = "⌄";
        botao.append(numero, nome, seta);
        if (!nivel.modulos.length && !nivel.assuntos.length) {
            const aviso = document.createElement("p");
            aviso.textContent = "Ainda não há módulos ou assuntos neste nível.";
            painel.append(aviso);
        } else {
            for (const modulo of nivel.modulos) {
                if (documentacaoCompleta) {
                    const detalhes = document.createElement("details");
                    detalhes.className = "biblioteca-modulo";
                    const resumo = document.createElement("summary");
                    resumo.textContent = modulo.titulo || modulo.nome || modulo.id;
                    detalhes.append(resumo);
                    if (Array.isArray(modulo.assuntos)) detalhes.append(listaAssuntos(modulo.assuntos, nivel, modulo, painel, botao, detalhes));
                    painel.append(detalhes);
                    continue;
                }
                const titulo = document.createElement("h3");
                titulo.textContent = modulo.titulo || modulo.nome || modulo.id;
                painel.append(titulo);
                if (Array.isArray(modulo.assuntos)) painel.append(listaAssuntos(modulo.assuntos, nivel, modulo, painel, botao));
            }
            if (nivel.assuntos.length) painel.append(listaAssuntos(nivel.assuntos, nivel, { titulo: "Assuntos" }, painel, botao));
        }
        botao.addEventListener("click", () => {
            painel.hidden = !painel.hidden;
            botao.setAttribute("aria-expanded", String(!painel.hidden));
            if (!assuntosOrdenados.length) {
                document.querySelector("#biblioteca-nivel").textContent = nivel.nome;
                document.querySelector("#biblioteca-vazio-descricao").textContent =
                    `A documentação de ${dados.nome} no nível ${nivel.nome.toLowerCase()} ainda está em preparação.`;
            }
        });
        grupo.append(botao, painel);
        destino.append(grupo);
    });
}

// Pesquisa — Correspondência - prioriza termos exatos e evita buscas por letras soltas.
function normalizarPesquisa(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase().replace(/[<>]/g, "").trim().replace(/\s+/g, " ");
}

function pesquisarAssuntos(consulta) {
    const termo = normalizarPesquisa(consulta);
    if (!termo) return [];
    const curtos = termo.length < 3;
    const resultados = assuntosOrdenados.map((registro, indice) => {
        const { assunto } = registro;
        const palavras = (assunto.palavrasChave || []).map(normalizarPesquisa);
        const tags = [...assunto.sintaxe.matchAll(/<([a-z][\w-]*)\b/gi)].map((tag) => tag[1].toLowerCase());
        const titulo = normalizarPesquisa(assunto.titulo);
        const descricao = normalizarPesquisa(assunto.explicacao);
        const grupo = central ? normalizarPesquisa(`${catalogoCentral.get(registro.tecnologia).nome} ${registro.nivel.nome} ${registro.modulo.titulo || registro.modulo.nome}`) : "";
        let prioridade = Infinity;
        if (palavras.includes(termo)) prioridade = 0;
        else if (tags.includes(termo) || titulo === termo) prioridade = 1;
        else if (!curtos && titulo.includes(termo)) prioridade = 2;
        else if (!curtos && palavras.some((palavra) => palavra.includes(termo))) prioridade = 3;
        else if (!curtos && termo.split(" ").every((parte) =>
            (titulo + " " + palavras.join(" ") + " " + descricao).split(/[^a-z0-9:*=-]+/).includes(parte))) prioridade = 4;
        if (central && termo.split(" ").every(parte => grupo.includes(parte))) prioridade = Math.min(prioridade, 2);
        return { registro, indice, prioridade };
    }).filter((item) => Number.isFinite(item.prioridade));
    // Uma tag curta com associação explícita não deve listar exemplos incidentais.
    const exatoCurto = curtos && resultados.some((item) => item.prioridade === 0);
    return resultados.filter((item) => !exatoCurto || item.prioridade === 0)
        .sort((a, b) => a.prioridade - b.prioridade || a.indice - b.indice);
}

// Pesquisa — Guia compartilhado: a seleção de resultados usa o mesmo estado dos tópicos.
function iniciarPesquisa() {
    const pesquisa = document.querySelector("#biblioteca-pesquisa");
    if (!documentacaoCompleta || !pesquisa) return;
    const campo = pesquisa.querySelector("#biblioteca-pesquisa-campo");
    const lista = pesquisa.querySelector("#biblioteca-pesquisa-resultados");
    const status = pesquisa.querySelector("#biblioteca-pesquisa-status");
    const limpar = pesquisa.querySelector("#biblioteca-pesquisa-limpar");
    let resultados = [], anuncio, organizacao;
    function restaurarGrupos() {
        if (!organizacao) return;
        for (const [elemento, aberto] of organizacao) {
            if (elemento.tagName === "BUTTON" || elemento.className === "biblioteca-categoria") {
                elemento.setAttribute("aria-expanded", String(aberto));
            } else if (elemento.className === "biblioteca-categoria-conteudo") elemento.hidden = !aberto;
            else elemento.open = aberto;
        }
    }
    function expandirRegistro(registro) {
        linguagensGuia.get(registro.tecnologia).open = true;
        registro.painel.hidden = false;
        registro.categoria.setAttribute("aria-expanded", "true");
        if (registro.detalhes) registro.detalhes.open = true;
    }
    function organizarResultados() {
        if (!central) return;
        const pesquisando = Boolean(normalizarPesquisa(campo.value));
        if (pesquisando && !organizacao) {
            organizacao = new Map();
            for (const elemento of niveis.querySelectorAll("details")) organizacao.set(elemento, Boolean(elemento.open));
            for (const elemento of niveis.querySelectorAll(".biblioteca-categoria")) organizacao.set(elemento, elemento.getAttribute("aria-expanded") === "true");
            for (const elemento of niveis.querySelectorAll(".biblioteca-categoria-conteudo")) organizacao.set(elemento, !elemento.hidden);
        }
        restaurarGrupos();
        if (pesquisando) for (const { registro } of resultados) expandirRegistro(registro);
        else {
            organizacao = null;
            if (assuntosOrdenados[assuntoAtual]) expandirRegistro(assuntosOrdenados[assuntoAtual]);
        }
    }
    function mostrarResultados() {
        clearTimeout(anuncio);
        resultados = pesquisarAssuntos(campo.value);
        organizarResultados();
        lista.replaceChildren();
        lista.hidden = !resultados.length;
        limpar.hidden = !campo.value;
        const mensagem = !normalizarPesquisa(campo.value)
            ? "Pesquise pelo título, conceito ou palavra-chave."
            : !resultados.length ? "Nenhum assunto encontrado. Tente outra palavra."
                : resultados.length + (resultados.length === 1 ? " assunto encontrado." : " assuntos encontrados. Escolha um resultado.");
        anuncio = setTimeout(() => { status.textContent = mensagem; }, 200);
        for (const { registro, indice } of resultados) {
            const item = document.createElement("li");
            const botao = document.createElement("button");
            botao.type = "button";
            const titulo = document.createElement("strong");
            titulo.textContent = registro.assunto.titulo;
            const caminho = document.createElement("span");
            caminho.textContent = (central ? catalogoCentral.get(registro.tecnologia).nome + " · " : "") + registro.nivel.nome + " · " + (registro.modulo.titulo || registro.modulo.nome);
            botao.append(titulo, caminho);
            botao.addEventListener("click", () => selecionarAssunto(indice, true, true));
            item.append(botao);
            lista.append(item);
        }
    }
    campo.disabled = false;
    campo.addEventListener("input", mostrarResultados);
    pesquisa.querySelector("#biblioteca-pesquisa-formulario").addEventListener("submit", event => {
        event.preventDefault();
        if (resultados.length === 1) selecionarAssunto(resultados[0].indice, true, true);
        else lista.querySelector("button")?.focus();
    });
    limpar.addEventListener("click", () => { campo.value = ""; mostrarResultados(); campo.focus(); });
    if (central) limparPesquisaCentral = () => { organizacao = null; campo.value = ""; mostrarResultados(); };
    mostrarResultados();
}

async function iniciarBiblioteca() {
    try {
        const carregar = modelos[pagina.dataset.tecnologia];
        if (!carregar) throw new Error("Tecnologia desconhecida.");
        const { conteudos } = await carregar();
        construirNiveis(conteudos);
        if (assuntosOrdenados.length) {
            selecionarAssunto(0, false);
            iniciarPesquisa();
        }
    } catch {
        niveis.replaceChildren();
        const aviso = document.createElement("p");
        aviso.className = "biblioteca-menu-aviso";
        aviso.textContent = "Não foi possível carregar os níveis. Recarregue a página e tente novamente.";
        niveis.append(aviso);
        document.querySelector("#biblioteca-vazio-titulo").textContent = "Não foi possível carregar a Biblioteca";
        document.querySelector("#biblioteca-vazio-descricao").textContent = "Confira sua conexão e recarregue esta página.";
    }
}


// A central usa os mesmos modelos, blocos de código e seleção da documentação original.
function apresentarConteudoCentral(destino, assunto) {
    destino.append(blocoLeitura(documentacaoProgramacao && !central ? "Introdução" : "Conceito", assunto.explicacao));
    if (assunto.exemploHTML) destino.append(blocoCodigo(assunto.exemploHTML, "HTML de apoio", "html"));
    destino.append(blocoLeitura("Exemplo de código", assunto.exemploCodigo, true), blocoLeitura(documentacaoProgramacao && !central ? "Explicação do código" : "Entenda o exemplo", assunto.responsabilidadeCodigo));
    const dica = blocoLeitura("💡 Dica", assunto.boasPraticas.at(-1)); dica.className = "biblioteca-html-dica"; destino.append(dica);
    destino.append(blocoLeitura("Quando usar", assunto.aplicacaoReal));
    if (documentacaoCSS) {
        destino.append(blocoResultado(assunto));
        if (assunto.orientacao) destino.append(blocoLeitura("Observe na prévia", assunto.orientacao));
        if (assunto.codigoPrincipal) destino.append(blocoCodigo(assunto.codigoPrincipal, "CSS principal", "css"));
        if (assunto.estilosApoio) destino.append(blocoCodigo(assunto.estilosApoio, "Estilos de apoio", "css"));
        if (assunto.htmlReferencia) destino.append(blocoCodigo(assunto.htmlReferencia, "Conexão no HTML", "html"));
    } else {
        if (assunto.mapeamento) destino.append(blocoLeitura("Mapa de raciocínio", assunto.mapeamento));
        if (assunto.ambiente) destino.append(blocoLeitura("Onde reproduzir", assunto.ambiente));
        if (assunto.resultadoEsperado) destino.append(blocoLeitura("Resultado esperado · não executado aqui", assunto.resultadoEsperado));
    }
    if (assunto.boasPraticas.length > 1) destino.append(blocoLeitura("Cuidados e observações", assunto.boasPraticas.slice(0, -1)));
    const relacionados = document.createElement("section");
    const titulo = document.createElement("h2"); titulo.textContent = "Veja também"; relacionados.append(titulo);
    for (const id of assunto.relacionados || []) {
        const indice = assuntosOrdenados.findIndex(r => r.tecnologia === pagina.dataset.tecnologia && r.assunto.id === id);
        if (indice < 0) continue;
        const botao = document.createElement("button"); botao.type = "button"; botao.textContent = assuntosOrdenados[indice].assunto.titulo;
        botao.addEventListener("click", () => selecionarAssunto(indice)); relacionados.append(botao);
    }
    if (relacionados.children.length > 1) destino.append(relacionados);
    if (assunto.fonte) { const fonte = document.createElement("a"); fonte.href = assunto.fonte; fonte.textContent = "Consultar documentação de referência"; destino.append(fonte); }
}

export function construirCatalogoCentral(catalogo) {
    niveis.replaceChildren(); assuntosOrdenados.length = 0; linguagensGuia.clear(); catalogoCentral.clear();
    for (const dados of catalogo) {
        catalogoCentral.set(dados.id, dados);
        const linguagem = document.createElement("details"); linguagem.className = "biblioteca-linguagem";
        const resumo = document.createElement("summary");
        const icone = document.createElement("img"); icone.src = `./assets/images/biblioteca-${dados.id}.svg`; icone.alt = ""; icone.width = 24; icone.height = 24;
        const nome = document.createElement("span"); nome.textContent = dados.nome;
        resumo.append(icone, nome); linguagem.append(resumo);
        // Somente a interação com a linguagem carrega sua introdução; a pesquisa apenas expande grupos.
        resumo.addEventListener("click", evento => {
            evento.preventDefault();
            if (linguagem.open) linguagem.open = false;
            else selecionarLinguagem(dados.id);
        });
        const conteudo = document.createElement("div"); linguagem.append(conteudo);
        linguagensGuia.set(dados.id, linguagem);
        construirNiveis(dados, conteudo, false); niveis.append(linguagem);
    }
    function selecionarLinguagem(id) {
        const indice = assuntosOrdenados.findIndex(registro => registro.tecnologia === id);
        if (indice < 0) return false;
        selecionarAssunto(indice, true, true);
        return true;
    }
    function ocultarConteudo() {
        assuntoAtual = -1;
        for (const registro of assuntosOrdenados) registro.botao.removeAttribute("aria-current");
        conteudoLeitura?.replaceChildren();
        document.querySelector("#biblioteca-central-cabecalho").hidden = true;
        leitura.setAttribute("aria-labelledby", "biblioteca-vazio-titulo");
        document.querySelector("#biblioteca-vazio-titulo").textContent = "Selecione uma linguagem";
        document.querySelector("#biblioteca-vazio-descricao").textContent = "Escolha uma linguagem no Guia de Estudos para consultar sua documentação.";
        estadoVazio.hidden = false;
        navegacaoAssuntos.hidden = true;
        anterior.disabled = proximo.disabled = true;
        leitura.scrollTop = 0;
        pagina.dispatchEvent(new CustomEvent("biblioteca:selecao", { detail: null }));
    }
    document.querySelector("#biblioteca-ocultar-conteudo").addEventListener("click", () => {
        ocultarConteudo();
        leitura.focus({ preventScroll: true });
    });
    function reiniciar() {
        assuntoAtual = -1;
        limparPesquisaCentral?.();
        for (const linguagem of linguagensGuia.values()) linguagem.open = false;
        for (const registro of assuntosOrdenados) {
            registro.botao.removeAttribute("aria-current");
            registro.painel.hidden = true;
            registro.categoria.setAttribute("aria-expanded", "false");
            if (registro.detalhes) registro.detalhes.open = false;
        }
        leitura.scrollTop = menu.scrollTop = 0;
        menuAberto = false; atualizarMenu();
        ocultarConteudo();
    }
    iniciarPesquisa();
    reiniciar();
    return {
        catalogo,
        reiniciar,
        selecionarLinguagem,
        selecionado() { const r = assuntosOrdenados[assuntoAtual]; return r ? { linguagem: r.tecnologia, topico: r.assunto.id, titulo: r.assunto.titulo } : null; }
    };
}

export async function iniciarBibliotecaCentral() {
    const catalogo = await Promise.all(Object.values(modelos).map(async carregar => (await carregar()).conteudos));
    return construirCatalogoCentral(catalogo);
}

if (!central) iniciarBiblioteca();
