// Busca — Texto - correspondência literal, sensível a maiúsculas, sem expressões regulares.
export function localizarOcorrencias(codigo, termo) {
    if (!termo) return [];
    const itens = [];
    for (let pos = codigo.indexOf(termo); pos >= 0; pos = codigo.indexOf(termo, pos + termo.length)) itens.push({ from: pos, to: pos + termo.length });
    return itens;
}
export function substituicoes(codigo, termo, texto, todas, selecao) {
    const itens = localizarOcorrencias(codigo, termo);
    if (todas) return itens.map(item => ({ ...item, insert: texto }));
    const item = itens.find(item => item.from === selecao.from && item.to === selecao.to);
    return item ? [{ ...item, insert: texto }] : [];
}
export function filtrarArquivos(arquivos, consulta) {
    const termo = consulta.trim().toLocaleLowerCase("pt-BR");
    return arquivos.filter(a => a.tipo === "arquivo" && a.caminho.toLocaleLowerCase("pt-BR").includes(termo)).sort((a, b) => a.caminho.localeCompare(b.caminho, "pt-BR"));
}

export function criarFerramentasEditor(acoes) {
    const obter = acoes.editor;
    const barra = document.querySelector("#studio-busca");
    const campo = document.querySelector("#studio-busca-texto");
    const aviso = document.querySelector("#studio-busca-status");
    const dialogo = document.querySelector("#studio-localizar");
    const arquivo = document.querySelector("#studio-localizar-texto");
    const lista = document.querySelector("#studio-localizar-resultados");
    function atualizar() {
        if (!obter() || barra.hidden) return;
        const view = obter();
        const itens = localizarOcorrencias(view.state.doc.toString(), campo.value);
        const selecao = view.state.selection.main;
        const indice = itens.findIndex(i => i.from === selecao.from && i.to === selecao.to);
        aviso.textContent = !campo.value ? "Busca literal, sensível a maiúsculas." : itens.length ? (indice < 0 ? `${itens.length} ocorrências.` : `${indice + 1} de ${itens.length} ocorrências.`) : "Nenhuma ocorrência.";
        document.querySelector("#studio-busca-anterior").disabled = document.querySelector("#studio-busca-proximo").disabled = !itens.length;
    }
    function sincronizar() {
        if (obter()) acoes.realcar(obter(), barra.hidden ? "" : campo.value);
        atualizar();
    }
    function fecharBusca() {
        barra.hidden = true;
        sincronizar(); obter()?.focus();
    }

    function encontrar(anterior = false) {
        const view = obter(); if (!view) return;
        const itens = localizarOcorrencias(view.state.doc.toString(), campo.value);
        if (!itens.length) { atualizar(); return; }
        const atual = view.state.selection.main;
        const item = anterior ? itens.filter(i => i.from < atual.from).at(-1) || itens.at(-1) : itens.find(i => i.from >= atual.to) || itens[0];
        view.dispatch({ selection: { anchor: item.from, head: item.to }, scrollIntoView: true }); atualizar();
    }
    function abrirBusca() { if (!obter()) return; barra.hidden = false; campo.focus(); sincronizar(); }
    function listar() {
        const itens = filtrarArquivos(acoes.arquivos(), arquivo.value);
        lista.replaceChildren();
        document.querySelector("#studio-localizar-status").textContent = itens.length ? `${itens.length} arquivo(s); exibindo até 50.` : "Nenhum arquivo encontrado.";
        for (const item of itens.slice(0, 50)) {
            const li = document.createElement("li"), botao = document.createElement("button"); botao.type = "button";
            botao.textContent = item.caminho;
            botao.addEventListener("click", () => { if (acoes.abrir(item) !== false) dialogo.close(); });
            li.append(botao); lista.append(li);
        }
    }
    function abrirArquivos() { if (!acoes.ativo()) return; arquivo.value = ""; listar(); if (!dialogo.open) dialogo.showModal(); arquivo.focus(); }
    document.querySelector("#studio-buscar").addEventListener("click", abrirBusca);
    document.querySelector("#studio-localizar-abrir").addEventListener("click", abrirArquivos);
    document.querySelector("#studio-localizar-fechar").addEventListener("click", () => { dialogo.close(); obter()?.focus(); });
    document.querySelector("#studio-busca-fechar").addEventListener("click", fecharBusca);
    document.querySelector("#studio-busca-proximo").addEventListener("click", () => encontrar());
    document.querySelector("#studio-busca-anterior").addEventListener("click", () => encontrar(true));
    barra.addEventListener("keydown", e => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); fecharBusca(); } });
    campo.addEventListener("input", () => { sincronizar(); encontrar(); });
    campo.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); encontrar(e.shiftKey); } });
    arquivo.addEventListener("input", listar);
    dialogo.addEventListener("keydown", event => {
        const botoes = [...lista.querySelectorAll("button")];
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault(); const atual = botoes.indexOf(document.activeElement);
            const proximo = atual < 0 ? (event.key === "ArrowDown" ? 0 : botoes.length - 1) : (atual + (event.key === "ArrowDown" ? 1 : -1) + botoes.length) % botoes.length;
            botoes[proximo]?.focus();
        } else if (event.key === "Enter" && event.target === arquivo) { event.preventDefault(); botoes[0]?.click(); }
    });
    dialogo.addEventListener("cancel", () => obter()?.focus());
    document.addEventListener("keydown", event => {
        if (event.defaultPrevented || !acoes.ativo()) return;
        const noEditor = obter()?.dom.contains(event.target) || barra.contains(event.target);
        if (event.key === "Escape" && noEditor && !barra.hidden) {
            event.preventDefault(); fecharBusca(); return;
        }
        if (event.shiftKey || !(event.ctrlKey || event.metaKey) || event.altKey) return;
        const tecla = event.key.toLowerCase();
        if (!["s", "p", "f"].includes(tecla) || (tecla === "f" && !noEditor)) return;
        if (dialogo.open && tecla !== "p") return;
        event.preventDefault();
        if (tecla === "s") acoes.salvar();
        else if (tecla === "p") abrirArquivos();
        else abrirBusca();
    });
    return { atualizar, sincronizar, fecharBusca };
}
