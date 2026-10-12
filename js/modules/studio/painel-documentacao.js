const modelos = {
    html: () => import("../../../data/biblioteca/html/conteudos.js"),
    css: () => import("../../../data/biblioteca/css/conteudos.js"),
    javascript: () => import("../../../data/biblioteca/javascript/conteudos.js")
};

// Documentação — Integração - reutiliza arquivos reais em um iframe de origem opaca.
// O script é embutido para ES Modules não dependerem de CORS no iframe isolado.
async function documentoIsolado(id, conteudos, canal) {
    const recursos = [`../../../pages/biblioteca/${id}.html`, "../../../css/biblioteca/biblioteca.css", "../../biblioteca/biblioteca.js"];
    const [pagina, css, script] = await Promise.all(recursos.map(async (caminho) => {
        const resposta = await fetch(new URL(caminho, import.meta.url), { credentials: "omit" });
        if (!resposta.ok) throw new Error("Recurso indisponível.");
        return resposta.text();
    }));
    const doc = new DOMParser().parseFromString(pagina, "text/html");
    doc.querySelectorAll("script, link, base, meta[http-equiv]").forEach((el) => el.remove());
    doc.querySelector(".biblioteca-retorno")?.remove();
    doc.querySelector(".biblioteca-tecnologias")?.remove();
    doc.querySelectorAll("a[href]").forEach((link) => {
        const destino = link.getAttribute("href");
        if (destino.startsWith("#")) link.setAttribute("href", `about:srcdoc${destino}`);
        else { link.removeAttribute("href"); link.setAttribute("aria-disabled", "true"); }
    });
    const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)), (n) => n.toString(16).padStart(2, "0")).join("");
    const politica = doc.createElement("meta");
    politica.httpEquiv = "Content-Security-Policy";
    politica.content = `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; frame-src about:; img-src 'none'; media-src 'none'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`;
    doc.head.prepend(politica);
    const estilo = doc.createElement("style");
    estilo.textContent = css;
    doc.head.append(estilo);
    const dados = JSON.stringify(conteudos).replace(/</g, "\\u003c");
    const codigo = doc.createElement("script");
    codigo.type = "module";
    codigo.setAttribute("nonce", nonce);
    codigo.textContent = `window.addEventListener('keydown', (event) => { if (event.key === 'Escape') { event.preventDefault(); parent.postMessage({tipo:'fechar-documentacao',canal:${JSON.stringify(canal)}}, '*'); } });\n` + script.replace(/import\("\.\.\/\.\.\/data\/biblioteca\/(html|css|javascript)\/conteudos\.js"\)/g,
        (_, tecnologia) => tecnologia === id ? `Promise.resolve({conteudos:${dados}})` : "Promise.reject(new Error('Use a roleta para trocar de tecnologia.'))")
        .replace(/<\/script/gi, "<\\/script");
    doc.head.append(codigo);
    return "<!doctype html>" + doc.documentElement.outerHTML;
}

export function criarPainelDocumentacao(dialogo) {
    const titulo = dialogo.querySelector("#studio-documentacao-titulo");
    const conteudo = dialogo.querySelector("#studio-documentacao-conteudo");
    const fechar = dialogo.querySelector("#studio-documentacao-fechar");
    let origem, pedido = 0, iframeAtivo, canal, fechamento;
    function encerrar() {
        if (!dialogo.open || fechamento) return;
        pedido++;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { dialogo.close(); return; }
        dialogo.classList.add("studio-documentacao-fechando");
        fechamento = setTimeout(() => dialogo.close(), 160);
    }
    fechar.addEventListener("click", encerrar);
    dialogo.addEventListener("cancel", (event) => { event.preventDefault(); encerrar(); });
    dialogo.addEventListener("click", (event) => { if (event.target === dialogo) encerrar(); });
    window.addEventListener("message", (event) => {
        if (iframeAtivo && event.source === iframeAtivo.contentWindow && event.data?.tipo === "fechar-documentacao" && event.data.canal === canal) encerrar();
    });
    dialogo.addEventListener("close", () => {
        pedido++; clearTimeout(fechamento); fechamento = undefined; iframeAtivo = undefined;
        dialogo.classList.remove("studio-documentacao-fechando");
        conteudo.replaceChildren(); origem?.focus();
    });
    return async function abrir(tecnologia, controle) {
        origem = controle;
        const atual = ++pedido;
        titulo.textContent = tecnologia.nome;
        conteudo.replaceChildren();
        const mensagem = document.createElement("p");
        mensagem.className = "studio-documentacao-aviso";
        mensagem.setAttribute("role", "status");
        mensagem.textContent = "Carregando documentação…";
        conteudo.append(mensagem);
        if (!dialogo.open) dialogo.showModal();
        fechar.focus();
        try {
            const carregar = modelos[tecnologia.id];
            if (!carregar) { mensagem.textContent = "Material de apoio em desenvolvimento."; return; }
            const { conteudos } = await carregar();
            if (!conteudos.niveis.some((nivel) => nivel.assuntos.length || nivel.modulos.some((modulo) => modulo.assuntos?.length))) {
                mensagem.textContent = "Material de apoio em desenvolvimento.";
                return;
            }
            canal = crypto.getRandomValues(new Uint32Array(4)).join("-");
            const documento = await documentoIsolado(tecnologia.id, conteudos, canal);
            if (atual !== pedido || !dialogo.open) return;
            const iframe = document.createElement("iframe");
            iframe.title = `Documentação de ${tecnologia.nome}`;
            iframe.setAttribute("sandbox", "allow-scripts");
            iframe.setAttribute("referrerpolicy", "no-referrer");
            iframe.setAttribute("allow", "camera 'none'; microphone 'none'; geolocation 'none'");
            iframe.srcdoc = documento;
            iframeAtivo = iframe;
            conteudo.replaceChildren(iframe);
        } catch {
            if (atual === pedido && dialogo.open) mensagem.textContent = "Não foi possível carregar a documentação. Feche o painel e tente novamente.";
        }
    };
}
