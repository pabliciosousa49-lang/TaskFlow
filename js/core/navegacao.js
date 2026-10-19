// Histórico nativo compartilhado. Não mantém uma pilha paralela de páginas.
(() => {
    const raiz = new URL("../../", document.currentScript.src);
    const principal = new URL("index.html", raiz);
    const chave = "__taskflowNavegacao";
    const transicao = "taskflow.navegacao.transicao.v1";
    const paginas = new Set([raiz.pathname, principal.pathname, new URL("pages/studio.html", raiz).pathname,
        ...["html", "css", "javascript", "typescript", "react"].map(id => new URL(`pages/biblioteca/${id}.html`, raiz).pathname)]);
    function interna(valor) {
        try {
            const url = new URL(valor, principal);
            return ["http:", "https:", "file:"].includes(url.protocol) && url.origin === raiz.origin && paginas.has(url.pathname);
        } catch { return false; }
    }
    function semFragmento(valor) { const url = new URL(valor, principal); url.hash = ""; return url.href; }
    function estado(anteriorInterno) { return { ...window.history.state, [chave]: { anteriorInterno } }; }

    // Prova de uma única transição entre documentos para navegadores sem Navigation API.
    // É consumida na chegada; não armazena uma lista ou substitui o histórico do navegador.
    if (!window.history.state?.[chave]) {
        let anteriorInterno = false;
        try {
            const pendente = JSON.parse(sessionStorage.getItem(transicao) || "null");
            sessionStorage.removeItem(transicao);
            anteriorInterno = Boolean(pendente && Date.now() - pendente.instante >= 0 && Date.now() - pendente.instante < 300000 &&
                interna(pendente.origem) && interna(pendente.destino) &&
                semFragmento(pendente.destino) === semFragmento(window.location.href) && document.referrer &&
                semFragmento(document.referrer) === semFragmento(pendente.origem) && window.history.length > 1);
        } catch { /* Sem comprovação, o retorno alternativo é a Home. */ }
        window.history.replaceState(estado(anteriorInterno), "", window.location.href);
    } else {
        try { sessionStorage.removeItem(transicao); } catch { /* Armazenamento opcional. */ }
    }
    function anteriorValido() {
        if (window.navigation?.entries && window.navigation.currentEntry) {
            try {
                const entradas = window.navigation.entries();
                const indice = entradas.findIndex(item => item.key === window.navigation.currentEntry.key);
                const anterior = entradas[indice - 1];
                return indice > 0 && anterior.index === window.navigation.currentEntry.index - 1 && Boolean(anterior.url) && interna(anterior.url);
            } catch { /* Consulta indisponível: usa a marca da entrada nativa. */ }
        }
        return window.history.length > 1 && window.history.state?.[chave]?.anteriorInterno === true;
    }
    function voltar() {
        if (anteriorValido()) window.history.back();
        else window.location.replace(principal.href);
    }
    function viewAtual() {
        const hash = new URL(window.location.href).hash;
        if (hash === "#taskflow-carreira") return { id: "view-biblioteca", alvo: "taskflow-carreira" };
        if (hash === "#taskflow-areas") return { id: "view-taskflow", alvo: "taskflow-areas" };
        if (hash === "#taskflow-categorias") return { id: "view-biblioteca", alvo: "taskflow-categorias" };
        return { id: ["#view-taskflow", "#view-biblioteca"].includes(hash) ? hash.slice(1) : "view-home", alvo: null };
    }
    function registrarView(id, alvo = null) {
        const atual = viewAtual();
        if (atual.id === id && atual.alvo === alvo) return;
        const url = new URL(window.location.href);
        url.hash = alvo || id;
        window.history.pushState(estado(interna(window.location.href)), "", url.href);
    }
    document.addEventListener("click", evento => {
        if (evento.defaultPrevented || evento.button > 0 || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
        const retorno = evento.target.closest("[data-taskflow-voltar]");
        if (retorno) { evento.preventDefault(); voltar(); return; }
        const link = evento.target.closest("a[href]");
        if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
        const destino = new URL(link.href, window.location.href);
        if (!interna(destino.href) || semFragmento(destino.href) === semFragmento(window.location.href)) return;
        try { sessionStorage.setItem(transicao, JSON.stringify({ origem: window.location.href, destino: destino.href, instante: Date.now() })); }
        catch { /* Sem armazenamento, a Navigation API ainda permite consultar a entrada anterior. */ }
    });
    window.taskflowNavegacao = Object.freeze({ voltar, registrarView, viewAtual });
})();
