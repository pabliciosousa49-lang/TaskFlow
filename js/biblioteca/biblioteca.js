const pagina = document.querySelector("main[data-tecnologia]");
const documentacaoHTML = pagina.dataset.tecnologia === "html";
const menu = document.querySelector("#biblioteca-menu");
const alternarMenu = document.querySelector("#biblioteca-alternar-menu");
const niveis = document.querySelector("#biblioteca-niveis");
const tamanhoMobile = window.matchMedia("(max-width: 760px)");
const modelos = {
    html: () => import("../../data/biblioteca/html/conteudos.js"),
    css: () => import("../../data/biblioteca/css/conteudos.js"),
    javascript: () => import("../../data/biblioteca/javascript/conteudos.js")
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

// Resultado — Isolamento - somente elementos visuais no iframe de origem opaca.
function documentoResultado(assunto) {
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
            if (nome.startsWith("on") || ["src", "srcset", "poster", "style", "srcdoc", "href", "action", "formaction", "formtarget", "target", "download", "ping", "background", "autofocus"].includes(nome)) elemento.removeAttribute(atributo.name);
        }
        if (elemento.localName === "a" && !elemento.hasAttribute("href")) elemento.setAttribute("aria-disabled", "true");
    }
    const politica = "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src 'none'; media-src 'none'; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
    return `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="${politica}"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Resultado do exemplo</title><style>body{margin:16px;overflow-wrap:anywhere}img,video,audio{max-width:100%}a{color:#0000ee;text-decoration:underline}pre{overflow:auto}input,select,textarea{max-width:100%;box-sizing:border-box}</style></head><body>${modelo.innerHTML}</body></html>`;
}

function blocoResultado(assunto) {
    const secao = document.createElement("section");
    const titulo = document.createElement("h2");
    titulo.textContent = assunto.contextoExemplo === "head" ? "Efeito no navegador" : "Resultado visual";
    secao.append(titulo);
    if (assunto.contextoExemplo === "head") {
        const efeito = document.createElement("p");
        efeito.textContent = assunto.efeitoNavegador;
        secao.append(efeito);
        return secao;
    }
    const janela = document.createElement("div");
    janela.className = "biblioteca-resultado";
    const barra = document.createElement("div");
    barra.className = "biblioteca-resultado-barra";
    barra.textContent = "Prévia do exemplo · HTML";
    const iframe = document.createElement("iframe");
    iframe.title = `Resultado: ${assunto.titulo}`;
    iframe.setAttribute("sandbox", "");
    iframe.setAttribute("referrerpolicy", "no-referrer");
    iframe.setAttribute("allow", "camera 'none'; microphone 'none'; geolocation 'none'");
    iframe.srcdoc = documentoResultado(assunto);
    janela.append(barra, iframe);
    const observacao = document.createElement("p");
    observacao.className = "biblioteca-exemplo-contexto";
    observacao.textContent = `${assunto.efeitoNavegador || "Esta prévia mostra o HTML com os estilos padrão do navegador."} Links, envio de formulários, recursos externos e JavaScript ficam bloqueados nesta demonstração.`;
    secao.append(janela, observacao);
    return secao;
}

function blocoCodigo(valor, titulo) {
    const bloco = document.createElement("div");
    bloco.className = "biblioteca-codigo";
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    if (documentacaoHTML) destacarHTML(valor, code);
    else code.textContent = valor;
    pre.tabIndex = 0;
    pre.setAttribute("aria-label", titulo);
    pre.append(code);
    if (documentacaoHTML) {
        const ferramentas = document.createElement("div");
        ferramentas.className = "biblioteca-codigo-ferramentas";
        const linguagem = document.createElement("span");
        linguagem.textContent = "HTML";
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
        ferramentas.append(linguagem, copiar);
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
    const contexto = document.createElement("p");
    contexto.className = "biblioteca-exemplo-contexto";
    contexto.textContent = assunto.contextoExemplo === "documento"
        ? "Exemplo completo: salve como um arquivo .html em UTF-8."
        : assunto.contextoExemplo === "head"
            ? "Exemplo para inserir dentro de <head> de um documento HTML completo."
            : "Exemplo para inserir dentro de <body> de um documento HTML completo.";
    const exemplo = blocoLeitura(documentacaoHTML ? "Como funciona no código?" : "Exemplo prático", assunto.exemploCodigo, true);
    exemplo.insertBefore(contexto, exemplo.querySelector(".biblioteca-codigo"));
    if (documentacaoHTML) {
        const referencia = document.createElement("details");
        referencia.className = "biblioteca-sintaxe";
        const resumo = document.createElement("summary");
        resumo.textContent = "Consultar sintaxe de referência";
        referencia.append(resumo, blocoCodigo(assunto.sintaxe, "Sintaxe"));
        exemplo.insertBefore(referencia, contexto);
    }
    const boasPraticas = blocoLeitura("Boas práticas", assunto.boasPraticas);
    if (documentacaoHTML) boasPraticas.className = "biblioteca-observacao";
    conteudoLeitura.append(
        blocoLeitura(documentacaoHTML ? "O que vamos aprender?" : "Objetivo", assunto.objetivo),
        blocoLeitura(documentacaoHTML ? "Entendendo o conceito" : "Explicação", assunto.explicacao),
        ...(!documentacaoHTML ? [blocoLeitura("Sintaxe", assunto.sintaxe, true)] : []),
        exemplo,
        blocoLeitura(documentacaoHTML ? "Entendendo as responsabilidades" : "Responsabilidade", assunto.responsabilidadeCodigo),
        ...(documentacaoHTML ? [blocoResultado(assunto)] : []),
        blocoLeitura(documentacaoHTML ? "Aplicação prática" : "Aplicação real", assunto.aplicacaoReal),
        boasPraticas
    );
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
                if (documentacaoHTML) {
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

async function iniciarBiblioteca() {
    try {
        const carregar = modelos[pagina.dataset.tecnologia];
        if (!carregar) throw new Error("Tecnologia desconhecida.");
        const { conteudos } = await carregar();
        construirNiveis(conteudos);
        if (assuntosOrdenados.length) selecionarAssunto(0, false);
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
