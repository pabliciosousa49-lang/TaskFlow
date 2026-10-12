// Explorador — Interface - organiza a árvore e solicita operações ao coordenador
export function criarExplorador(raiz, acoes) {
    const arvore = raiz.querySelector("#explorador-arvore");
    const botaoRaiz = raiz.querySelector("#explorador-raiz");
    const local = raiz.querySelector("#explorador-local");
    const novoArquivo = raiz.querySelector("#explorador-novo-arquivo");
    const novaPasta = raiz.querySelector("#explorador-nova-pasta");
    const renomear = raiz.querySelector("#explorador-renomear");
    const excluir = raiz.querySelector("#explorador-excluir");
    const abertas = new Set();
    let projeto;
    let selecionadoId = null;
    let arquivoAtivoId = null;

    function itemSelecionado() { return projeto?.arquivos.find((item) => item.id === selecionadoId); }
    function diretorioAtual() {
        const item = itemSelecionado();
        return item?.tipo === "pasta" ? item.id : (item?.parentId ?? null);
    }

    function icone(item) {
        if (item.tipo === "pasta") return "▱";
        const extensao = item.nome.split(".").at(-1).toLowerCase();
        return ({ html: "</>", htm: "</>", css: "#", js: "{}" })[extensao] || "▤";
    }

    function expandirAncestrais(id) {
        let item = projeto.arquivos.find((entrada) => entrada.id === id);
        while (item) {
            if (item.tipo === "pasta") abertas.add(item.id);
            item = projeto.arquivos.find((entrada) => entrada.id === item.parentId);
        }
    }

    function focarSelecionado() {
        const botao = Array.from(arvore.querySelectorAll("button[data-item]")).find((item) => item.dataset.item === selecionadoId);
        (botao || botaoRaiz).focus();
    }

    function renderizar() {
        botaoRaiz.textContent = projeto.titulo;
        botaoRaiz.setAttribute("aria-pressed", String(selecionadoId === null));
        novoArquivo.disabled = novaPasta.disabled = false;
        renomear.disabled = excluir.disabled = !itemSelecionado();
        const parent = projeto.arquivos.find((item) => item.id === diretorioAtual());
        local.textContent = `Criar em: ${parent ? parent.caminho : "raiz do projeto"}`;
        arvore.replaceChildren();
        const filhos = new Map();
        for (const item of projeto.arquivos) {
            if (!filhos.has(item.parentId)) filhos.set(item.parentId, []);
            filhos.get(item.parentId).push(item);
        }
        function desenhar(parentId, lista) {
            const itens = (filhos.get(parentId) || []).slice().sort((a, b) =>
                (a.tipo === b.tipo ? 0 : a.tipo === "pasta" ? -1 : 1) || a.nome.localeCompare(b.nome, "pt-BR", { numeric: true }));
            for (const item of itens) {
                const li = document.createElement("li");
                const botao = document.createElement("button");
                botao.type = "button";
                botao.className = "explorador-item";
                botao.dataset.item = item.id;
                botao.dataset.tipo = item.tipo;
                botao.title = item.caminho;
                botao.setAttribute("aria-pressed", String(item.id === selecionadoId));
                if (item.id === arquivoAtivoId) botao.setAttribute("aria-current", "true");
                const simbolo = document.createElement("span");
                simbolo.className = "explorador-icone";
                simbolo.setAttribute("aria-hidden", "true");
                simbolo.textContent = (item.tipo === "pasta" ? (abertas.has(item.id) ? "▾ " : "▸ ") : "") + icone(item);
                const nome = document.createElement("span");
                nome.className = "explorador-nome";
                nome.textContent = item.nome;
                botao.append(simbolo, nome);
                li.append(botao);
                if (item.tipo === "pasta") {
                    botao.setAttribute("aria-expanded", String(abertas.has(item.id)));
                    if (abertas.has(item.id)) {
                        const sublista = document.createElement("ul");
                        desenhar(item.id, sublista);
                        li.append(sublista);
                    }
                }
                lista.append(li);
            }
        }
        desenhar(null, arvore);
        if (!projeto.arquivos.length) {
            const vazio = document.createElement("li");
            vazio.className = "explorador-vazio";
            vazio.textContent = "Projeto vazio. Crie um arquivo ou uma pasta para começar.";
            arvore.append(vazio);
        }
    }

    botaoRaiz.addEventListener("click", () => { selecionadoId = null; renderizar(); });
    arvore.addEventListener("click", (event) => {
        const botao = event.target.closest("button[data-item]");
        if (!botao || !projeto) return;
        const item = projeto.arquivos.find((entrada) => entrada.id === botao.dataset.item);
        if (!item) return;
        if (item.tipo === "arquivo" && acoes.selecionar(item) === false) return;
        selecionadoId = item.id;
        if (item.tipo === "pasta") {
            if (abertas.has(item.id)) abertas.delete(item.id);
            else abertas.add(item.id);
        }
        renderizar();
        focarSelecionado();
    });

    function solicitarCriacao(tipo) {
        if (!projeto) return;
        const nome = window.prompt(tipo === "arquivo" ? "Nome do novo arquivo:" : "Nome da nova pasta:");
        if (nome !== null) acoes.criar(tipo, nome.trim(), diretorioAtual());
    }
    novoArquivo.addEventListener("click", () => solicitarCriacao("arquivo"));
    novaPasta.addEventListener("click", () => solicitarCriacao("pasta"));
    renomear.addEventListener("click", () => {
        const item = itemSelecionado();
        if (!item) return;
        const nome = window.prompt(`Novo nome de ${item.nome}:`, item.nome);
        if (nome !== null) acoes.renomear(item, nome.trim());
    });
    excluir.addEventListener("click", () => {
        const item = itemSelecionado();
        if (!item) return;
        const mensagem = item.tipo === "pasta"
            ? `Excluir a pasta “${item.caminho}” e todos os seus arquivos e subpastas? Esta ação não pode ser desfeita.`
            : `Excluir o arquivo “${item.caminho}”? Esta ação não pode ser desfeita.`;
        if (window.confirm(mensagem)) acoes.excluir(item);
    });

    return {
        atualizar(novoProjeto, arquivoAtivo, selecao) {
            if (projeto?.id !== novoProjeto.id) { abertas.clear(); selecionadoId = arquivoAtivo || null; }
            projeto = novoProjeto;
            arquivoAtivoId = arquivoAtivo;
            if (selecao !== undefined) { selecionadoId = selecao; expandirAncestrais(selecao); }
            if (!projeto.arquivos.some((item) => item.id === selecionadoId)) selecionadoId = null;
            renderizar();
        },
        focarSelecionado
    };
}
