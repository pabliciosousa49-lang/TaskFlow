const pagina = document.querySelector("main[data-tecnologia]");
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
function blocoLeitura(titulo, valor, codigo = false) {
    const secao = document.createElement("section");
    const cabecalho = document.createElement("h2");
    cabecalho.textContent = titulo;
    secao.append(cabecalho);
    if (codigo) {
        const pre = document.createElement("pre");
        const code = document.createElement("code");
        code.textContent = valor;
        pre.tabIndex = 0;
        pre.setAttribute("aria-label", titulo);
        pre.append(code);
        secao.append(pre);
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
    const { assunto, nivel, modulo, botao, painel, categoria } = registro;
    document.querySelector("#biblioteca-titulo").textContent = assunto.titulo;
    document.querySelector("#biblioteca-nivel").textContent = `${nivel.nome} · ${modulo.titulo || modulo.nome}`;
    for (const item of assuntosOrdenados) item.botao.removeAttribute("aria-current");
    botao.setAttribute("aria-current", "true");
    painel.hidden = false;
    categoria.setAttribute("aria-expanded", "true");
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
    const exemplo = blocoLeitura("Exemplo prático", assunto.exemploCodigo, true);
    exemplo.insertBefore(contexto, exemplo.querySelector("pre"));
    conteudoLeitura.append(
        blocoLeitura("Objetivo", assunto.objetivo),
        blocoLeitura("Explicação", assunto.explicacao),
        blocoLeitura("Sintaxe", assunto.sintaxe, true),
        exemplo,
        blocoLeitura("Responsabilidade", assunto.responsabilidadeCodigo),
        blocoLeitura("Aplicação real", assunto.aplicacaoReal),
        blocoLeitura("Boas práticas", assunto.boasPraticas)
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

function listaAssuntos(assuntos, nivel, modulo, painel, categoria) {
    const lista = document.createElement("ul");
    lista.className = "biblioteca-assuntos";
    for (const assunto of assuntos) {
        const item = document.createElement("li");
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "biblioteca-assunto";
        botao.textContent = assunto.titulo || assunto.nome || assunto.id;
        const indice = assuntosOrdenados.length;
        assuntosOrdenados.push({ assunto, nivel, modulo, botao, painel, categoria });
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
