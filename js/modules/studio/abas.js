// Abas — Interface - mantém identificadores abertos sem duplicar documentos ou excluir arquivos
export function criarAbas(raiz, acoes) {
    const abertas = new Set();
    let arquivos = [];
    let ativo;
    let pendente = false;

    function renderizar() {
        raiz.replaceChildren();
        for (const id of abertas) {
            const item = arquivos.find((arquivo) => arquivo.id === id);
            if (!item) continue;
            const aba = document.createElement("div");
            aba.className = "studio-aba";
            aba.dataset.ativa = String(id === ativo);
            const abrir = document.createElement("button");
            abrir.type = "button";
            abrir.dataset.abrir = id;
            abrir.setAttribute("aria-pressed", String(id === ativo));
            abrir.title = item.caminho;
            abrir.textContent = item.nome + (id === ativo && pendente ? " ●" : "");
            abrir.setAttribute("aria-label", `${item.caminho}${id === ativo && pendente ? ", alterações não salvas" : ""}`);
            const fechar = document.createElement("button");
            fechar.type = "button";
            fechar.dataset.fechar = id;
            fechar.textContent = "×";
            fechar.setAttribute("aria-label", `Fechar aba ${item.nome}`);
            aba.append(abrir, fechar);
            raiz.append(aba);
        }
    }
    raiz.addEventListener("click", (event) => {
        const botao = event.target.closest("button");
        if (!botao) return;
        if (botao.dataset.fechar) acoes.fechar(botao.dataset.fechar);
        else if (botao.dataset.abrir) acoes.abrir(botao.dataset.abrir);
    });
    return {
        abrir(id) { abertas.add(id); },
        remover(id) { abertas.delete(id); },
        ids: () => Array.from(abertas),
        limpar() { abertas.clear(); raiz.replaceChildren(); },
        atualizar(itens, selecionado, sujo = false) {
            arquivos = itens.filter((item) => item.tipo === "arquivo");
            for (const id of abertas) if (!arquivos.some((item) => item.id === id)) abertas.delete(id);
            ativo = selecionado;
            pendente = sujo;
            renderizar();
        }
    };
}
