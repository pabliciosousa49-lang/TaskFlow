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
    const troca = document.querySelector("#studio-busca-substituicao");
    const aviso = document.querySelector("#studio-busca-status");
    const dialogo = document.querySelector("#studio-localizar");
    const arquivo = document.querySelector("#studio-localizar-texto");
    const lista = document.querySelector("#studio-localizar-resultados");
    function atualizar() {
        if (!obter() || barra.hidden) return;
        const total = localizarOcorrencias(obter().state.doc.toString(), campo.value).length;
        aviso.textContent = !campo.value ? "Busca literal, sensível a maiúsculas." : total ? `${total} ocorrência(s).` : "Nenhuma ocorrência.";
    }
    function encontrar(anterior = false) {
        const view = obter(); if (!view) return;
        const itens = localizarOcorrencias(view.state.doc.toString(), campo.value);
        if (!itens.length) { atualizar(); return; }
        const atual = view.state.selection.main;
        const item = anterior ? itens.filter(i => i.from < atual.from).at(-1) || itens.at(-1) : itens.find(i => i.from >= atual.to) || itens[0];
        view.dispatch({ selection: { anchor: item.from, head: item.to }, scrollIntoView: true }); atualizar();
    }
    function substituir(todas) {
        const view = obter(); if (!view || !campo.value) return;
        let changes = substituicoes(view.state.doc.toString(), campo.value, troca.value, todas, view.state.selection.main);
        if (!todas && !changes.length) { encontrar(); changes = substituicoes(view.state.doc.toString(), campo.value, troca.value, false, view.state.selection.main); }
        if (changes.length) acoes.aplicar(view, changes, { anchor: changes[0].from + troca.value.length });
        atualizar();
    }
    function abrirBusca() { if (!obter()) return; barra.hidden = false; campo.focus(); atualizar(); }
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
    document.querySelector("#studio-busca-fechar").addEventListener("click", () => { barra.hidden = true; obter()?.focus(); });
    document.querySelector("#studio-busca-proximo").addEventListener("click", () => encontrar());
    document.querySelector("#studio-busca-anterior").addEventListener("click", () => encontrar(true));
    document.querySelector("#studio-substituir").addEventListener("click", () => substituir(false));
    document.querySelector("#studio-substituir-todos").addEventListener("click", () => substituir(true));
    barra.addEventListener("keydown", e => { if (e.key === "Escape") { e.preventDefault(); barra.hidden = true; obter()?.focus(); } });
    campo.addEventListener("input", atualizar);
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
        if (event.defaultPrevented || event.shiftKey || !(event.ctrlKey || event.metaKey) || event.altKey || !acoes.ativo()) return;
        const tecla = event.key.toLowerCase();
        if (!["s", "p", "f", "h"].includes(tecla)) return;
        if (dialogo.open && tecla !== "p") return;
        event.preventDefault();
        if (tecla === "s") acoes.salvar();
        else if (tecla === "p") abrirArquivos();
        else { abrirBusca(); if (tecla === "h") troca.focus(); }
    });
    return { atualizar };
}
