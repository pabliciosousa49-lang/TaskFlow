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

    // Ícones — Apresentação - SVGs fixos sem dependências ou conteúdo do usuário
    function icone(tipo) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 16 16");
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute("focusable", "false");
        const desenhos = {
            pasta: "M1.5 4h5l1.5 2h6.5v7.5h-13Z M1.5 4V2.5h5l1.5 1.5",
            "pasta-aberta": "M1.5 6V3.5h5l1.5 2h6V7 M1.5 7h13l-2 6.5h-12Z",
            html: "m5 4-4 4 4 4 M11 4l4 4-4 4 M9.5 2l-3 12",
            css: "M2 1.5h8l4 4v9H2Z M10 1.5v4h4 M5 8h6 M5 11h6",
            js: "M2 1.5h12v13H2Z",
            json: "M6 3H4v4L2 8l2 1v4h2 M10 3h2v4l2 1-2 1v4h-2",
            imagem: "M1.5 2.5h13v11h-13Z m0 8 4-4 3 3 2-2 4 4 M10 5h.1",
            arquivo: "M3 1.5h6l4 4v9H3Z M9 1.5v4h4",
            "novo-arquivo": "M2 1.5h6l3 3v4 M2 1.5v13h6 M8 1.5v3h3 M12 8v7 M8.5 11.5h7",
            "nova-pasta": "M1.5 4h5l1.5 2h6.5v3 M1.5 4v9.5h6 M12 9v6 M9 12h6",
            renomear: "m3 11 7-7 3 3-7 7-4 1Z m6-6 3 3 M2 2h5",
            excluir: "M2.5 4h11 M6 4V2h4v2 M4 4l1 10h6l1-10 M7 6v6 M9 6v6"
        };
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", desenhos[tipo] || desenhos.arquivo);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "currentColor");
        path.setAttribute("stroke-width", "1.2");
        path.setAttribute("stroke-linejoin", "round");
        path.setAttribute("stroke-linecap", "round");
        svg.append(path);
        if (tipo === "js") {
            const texto = document.createElementNS("http://www.w3.org/2000/svg", "text");
            texto.setAttribute("x", "4"); texto.setAttribute("y", "11");
            texto.setAttribute("font-size", "6"); texto.setAttribute("fill", "currentColor");
            texto.textContent = "JS";
            svg.append(texto);
        }
        return svg;
    }

    function tipoIcone(item) {
        if (item.tipo === "pasta") return abertas.has(item.id) ? "pasta-aberta" : "pasta";
        const extensao = item.nome.split(".").at(-1).toLowerCase();
        if (["png", "jpg", "jpeg", "gif", "webp", "svg", "avif", "ico"].includes(extensao)) return "imagem";
        return ({ html: "html", htm: "html", css: "css", js: "js", json: "json" })[extensao] || "arquivo";
    }

    for (const [botao, tipo] of [[novoArquivo, "novo-arquivo"], [novaPasta, "nova-pasta"], [renomear, "renomear"], [excluir, "excluir"]]) botao.replaceChildren(icone(tipo));

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
        botaoRaiz.title = projeto.titulo;
        botaoRaiz.setAttribute("aria-label", `Raiz do projeto ${projeto.titulo}`);
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
                botao.setAttribute("aria-label", `${item.tipo === "pasta" ? "Pasta" : "Arquivo"} ${item.caminho}`);
                botao.setAttribute("aria-pressed", String(item.id === selecionadoId));
                if (item.id === arquivoAtivoId) botao.setAttribute("aria-current", "true");
                const simbolo = document.createElement("span");
                simbolo.className = "explorador-icone";
                simbolo.setAttribute("aria-hidden", "true");
                const tipo = tipoIcone(item);
                simbolo.dataset.icone = tipo;
                simbolo.append(icone(tipo));
                const seta = document.createElement("span");
                seta.className = "explorador-seta";
                seta.setAttribute("aria-hidden", "true");
                seta.textContent = item.tipo === "pasta" ? (abertas.has(item.id) ? "⌄" : "›") : "";
                const nome = document.createElement("span");
                nome.className = "explorador-nome";
                nome.textContent = item.nome;
                botao.append(seta, simbolo, nome);
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
        if (!window.confirm("Renomear pode quebrar links, imports e referências CSS. Os caminhos no código não serão atualizados automaticamente. Continuar?")) return;
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
