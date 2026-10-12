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

function listaAssuntos(assuntos) {
    const lista = document.createElement("ul");
    for (const assunto of assuntos) {
        const item = document.createElement("li");
        item.textContent = assunto.titulo || assunto.nome || assunto.id;
        lista.append(item);
    }
    return lista;
}

// Níveis — Apresentação - gera as categorias exclusivamente a partir do modelo carregado
function construirNiveis(dados) {
    niveis.replaceChildren();
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
                if (Array.isArray(modulo.assuntos)) painel.append(listaAssuntos(modulo.assuntos));
            }
            painel.append(listaAssuntos(nivel.assuntos));
        }
        botao.addEventListener("click", () => {
            painel.hidden = !painel.hidden;
            botao.setAttribute("aria-expanded", String(!painel.hidden));
            document.querySelector("#biblioteca-nivel").textContent = nivel.nome;
            document.querySelector("#biblioteca-vazio-descricao").textContent =
                `A documentação de ${dados.nome} no nível ${nivel.nome.toLowerCase()} ainda está em preparação.`;
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
