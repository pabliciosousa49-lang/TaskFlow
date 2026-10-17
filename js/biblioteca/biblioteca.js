const pagina = document.querySelector("main[data-tecnologia]");
const documentacaoHTML = pagina.dataset.tecnologia === "html";
const documentacaoCSS = pagina.dataset.tecnologia === "css";
const documentacaoProgramacao = ["javascript", "typescript", "react"].includes(pagina.dataset.tecnologia);
const documentacaoCompleta = documentacaoHTML || documentacaoCSS || documentacaoProgramacao;
const menu = document.querySelector("#biblioteca-menu");
const alternarMenu = document.querySelector("#biblioteca-alternar-menu");
const niveis = document.querySelector("#biblioteca-niveis");
const tamanhoMobile = window.matchMedia("(max-width: 760px)");
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

// Menu — Responsividade - mantém navegação no fluxo, sem sobrepor o conteúdo
function atualizarMenu() {
    menu.hidden = tamanhoMobile.matches && !menuAberto;
    alternarMenu.hidden = !tamanhoMobile.matches;
    alternarMenu.setAttribute("aria-expanded", String(!menu.hidden));
    alternarMenu.textContent = menu.hidden ? "Mostrar níveis" : "Ocultar níveis";
    document.body.dataset.menuAberto = String(!menu.hidden);
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
        bloco.append(ferramentas, pre, resultado);
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

function selecionarAssunto(indice, focar = true) {
    const registro = assuntosOrdenados[indice];
    if (!registro) return;
    assuntoAtual = indice;
    const { assunto, nivel, modulo, botao, painel, categoria, detalhes } = registro;
    document.querySelector("#biblioteca-titulo").textContent = assunto.titulo;
    document.querySelector("#biblioteca-nivel").textContent = `${nivel.nome} · ${modulo.titulo || modulo.nome}`;
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
    if (documentacaoProgramacao) {
        conteudoLeitura.append(blocoLeitura("O que é", assunto.explicacao), blocoLeitura("Quando usar", assunto.aplicacaoReal));
        if (assunto.mapeamento) conteudoLeitura.append(blocoLeitura("Mapa de raciocínio", assunto.mapeamento));
        conteudoLeitura.append(blocoLeitura("Onde reproduzir", assunto.ambiente));
        if (assunto.exemploHTML) conteudoLeitura.append(blocoCodigo(assunto.exemploHTML, "HTML de apoio", "html"));
        conteudoLeitura.append(blocoLeitura("Exemplo de código", assunto.exemploCodigo, true),
            blocoLeitura("Entenda o código", assunto.responsabilidadeCodigo), blocoLeitura("Resultado esperado · não executado aqui", assunto.resultadoEsperado));
        const cuidados = blocoLeitura("Cuidados e erros comuns", assunto.boasPraticas);
        cuidados.className = "biblioteca-observacao";
        conteudoLeitura.append(cuidados);
        if (assunto.relacionados.length) {
            const relacionados = document.createElement("section"); relacionados.className = "biblioteca-programacao-relacionados";
            const titulo = document.createElement("h2"); titulo.textContent = "Veja também"; relacionados.append(titulo);
            for (const id of assunto.relacionados) {
                const i = assuntosOrdenados.findIndex(item => item.assunto.id === id);
                if (i < 0 || i === indice) continue;
                const link = document.createElement("button"); link.type = "button"; link.textContent = assuntosOrdenados[i].assunto.titulo;
                link.addEventListener("click", () => selecionarAssunto(i)); relacionados.append(link);
            }
            conteudoLeitura.append(relacionados);
        }
        const fonte = document.createElement("a"); fonte.href = assunto.fonte; fonte.textContent = "Consultar documentação de referência"; fonte.className = "biblioteca-fonte";
        conteudoLeitura.append(fonte);
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
        const boasPraticas = blocoLeitura(documentacaoHTML ? "Observações importantes" : "Boas práticas", assunto.boasPraticas);
        if (documentacaoHTML) boasPraticas.className = "biblioteca-observacao";
        conteudoLeitura.append(
            ...(!documentacaoHTML ? [blocoLeitura("Objetivo", assunto.objetivo)] : []),
            blocoLeitura(documentacaoHTML ? "Conceito" : "Explicação", assunto.explicacao),
            ...(documentacaoHTML ? [blocoLeitura("Responsabilidade", assunto.responsabilidadeCodigo)] : []),
            ...(!documentacaoHTML ? [blocoLeitura("Sintaxe", assunto.sintaxe, true)] : []),
            exemplo,
            ...(!documentacaoHTML ? [blocoLeitura("Responsabilidade", assunto.responsabilidadeCodigo)] : []),
            ...(documentacaoHTML ? [blocoResultado(assunto)] : []),
            blocoLeitura(documentacaoHTML ? "Aplicação prática" : "Aplicação real", assunto.aplicacaoReal),
            boasPraticas
        );
    }
    estadoVazio.hidden = true;
    navegacaoAssuntos.hidden = false;
    anterior.disabled = indice === 0;
    proximo.disabled = indice === assuntosOrdenados.length - 1;
    if (focar) {
        menuAberto = false;
        atualizarMenu();
        leitura.focus();
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
        assuntosOrdenados.push({ assunto, nivel, modulo, botao, painel, categoria, detalhes });
        botao.addEventListener("click", () => selecionarAssunto(indice));
        item.append(botao);
        lista.append(item);
    }
    return lista;
}

// Níveis — Apresentação - gera as categorias exclusivamente a partir do modelo carregado
function construirNiveis(dados) {
    niveis.replaceChildren();
    assuntosOrdenados.length = 0;
    dados.niveis.forEach((nivel, indice) => {
        const grupo = document.createElement("section");
        grupo.className = "biblioteca-grupo";
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "biblioteca-categoria";
        const painel = document.createElement("div");
        painel.id = `biblioteca-nivel-${nivel.id}`;
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
        niveis.append(grupo);
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
        let prioridade = Infinity;
        if (palavras.includes(termo)) prioridade = 0;
        else if (tags.includes(termo) || titulo === termo) prioridade = 1;
        else if (!curtos && titulo.includes(termo)) prioridade = 2;
        else if (!curtos && palavras.some((palavra) => palavra.includes(termo))) prioridade = 3;
        else if (!curtos && termo.split(" ").every((parte) =>
            (titulo + " " + palavras.join(" ") + " " + descricao).split(/[^a-z0-9:*=-]+/).includes(parte))) prioridade = 4;
        return { registro, indice, prioridade };
    }).filter((item) => Number.isFinite(item.prioridade));
    // Uma tag curta com associação explícita não deve listar exemplos incidentais.
    const exatoCurto = curtos && resultados.some((item) => item.prioridade === 0);
    return resultados.filter((item) => !exatoCurto || item.prioridade === 0)
        .sort((a, b) => a.prioridade - b.prioridade || a.indice - b.indice);
}

// Pesquisa — Interface - o diálogo reutiliza a seleção e a navegação de assuntos.
function iniciarPesquisa() {
    const abrir = document.querySelector("#biblioteca-pesquisar");
    const dialogo = document.querySelector("#biblioteca-pesquisa");
    if (!documentacaoCompleta || !abrir || !dialogo) return;
    const campo = dialogo.querySelector("#biblioteca-pesquisa-campo");
    const lista = dialogo.querySelector("#biblioteca-pesquisa-resultados");
    const status = dialogo.querySelector("#biblioteca-pesquisa-status");
    let resultados = [], anuncio;
    function mostrarResultados() {
        clearTimeout(anuncio);
        resultados = pesquisarAssuntos(campo.value);
        lista.replaceChildren();
        const mensagem = !normalizarPesquisa(campo.value)
            ? (documentacaoProgramacao ? "Digite um conceito ou intenção: eventos, tipos, estado ou mapear lógica." : documentacaoCSS ? "Digite uma propriedade, conceito ou intenção. Exemplos: centralizar, padding ou cor de fundo." : "Digite uma tag, conceito ou intenção. Exemplos: parágrafo, senha ou imagem.")
            : !resultados.length ? "Nenhum assunto encontrado. Tente outra tag ou palavra."
                : resultados.length + (resultados.length === 1 ? " assunto encontrado." : " assuntos encontrados. Escolha um resultado.");
        // Aguarda uma pausa na digitação antes de anunciar a contagem.
        anuncio = setTimeout(() => { status.textContent = mensagem; }, 200);
        for (const { registro, indice } of resultados) {
            const item = document.createElement("li");
            const botao = document.createElement("button");
            botao.type = "button";
            const titulo = document.createElement("strong");
            titulo.textContent = registro.assunto.titulo;
            const caminho = document.createElement("span");
            caminho.textContent = registro.nivel.nome + " · " + registro.modulo.titulo;
            const descricao = document.createElement("span");
            descricao.textContent = registro.assunto.explicacao.split(/(?<=\.)\s/)[0];
            botao.append(titulo, caminho, descricao);
            botao.addEventListener("click", () => {
                dialogo.close();
                selecionarAssunto(indice);
            });
            item.append(botao);
            lista.append(item);
        }
    }
    abrir.disabled = false;
    abrir.addEventListener("click", () => {
        campo.value = "";
        mostrarResultados();
        dialogo.showModal();
        campo.focus();
    });
    campo.addEventListener("input", mostrarResultados);
    dialogo.querySelector("#biblioteca-pesquisa-formulario").addEventListener("submit", (event) => {
        event.preventDefault();
        if (resultados.length === 1) {
            dialogo.close();
            selecionarAssunto(resultados[0].indice);
        } else lista.querySelector("button")?.focus();
    });
    dialogo.querySelector("#biblioteca-pesquisa-fechar").addEventListener("click", () => {
        dialogo.close();
        abrir.focus();
    });
    dialogo.addEventListener("keydown", (event) => {
        // Não propaga Escape para o painel externo quando a documentação está incorporada.
        if (event.key === "Escape") event.stopPropagation();
    });
    dialogo.addEventListener("cancel", (event) => {
        event.preventDefault();
        dialogo.close();
        abrir.focus();
    });
    dialogo.addEventListener("close", () => clearTimeout(anuncio));
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

iniciarBiblioteca();
