const modelos = {
    html: () => import("../../../data/biblioteca/html/conteudos.js"),
    css: () => import("../../../data/biblioteca/css/conteudos.js"),
    javascript: () => import("../../../data/biblioteca/javascript/conteudos.js"),
    typescript: () => import("../../../data/biblioteca/typescript/conteudos.js"),
    react: () => import("../../../data/biblioteca/react/conteudos.js")
};

// Somente imagens conhecidas do produto entram no documento, sem liberar rede no iframe.
const imagensLocais = new Map();
const assetsHTML = ["taskflow-logo-voxel.png", "biblioteca-html-banner-voxel.png", "biblioteca-html-codigo-voxel.png", "laboratorio-fundo-voxel.png"];
const assetsCSS = ["biblioteca-css-banner-voxel.png", "biblioteca-css-codigo-voxel.png"];
const permitidas = new Map([
    [new URL("../../../assets/images/TaskCentro.png", import.meta.url).href, "image/png"],
    ...Object.keys(modelos).map(id => [new URL(`../../../assets/images/biblioteca-${id}.svg`, import.meta.url).href, "image/svg+xml"]),
    ...assetsHTML.concat(assetsCSS).map(nome => [new URL(`../../../assets/images/${nome}`, import.meta.url).href, "image/png"])
]);
async function imagemLocal(url) {
    if (!permitidas.has(url)) throw new Error("Imagem não autorizada na documentação.");
    if (!imagensLocais.has(url)) imagensLocais.set(url, (async () => {
        const resposta = await fetch(url, { credentials: "omit" });
        if (!resposta.ok) throw new Error("Imagem da documentação indisponível.");
        const bytes = new Uint8Array(await resposta.arrayBuffer());
        let binario = "";
        for (let n = 0; n < bytes.length; n += 8192) binario += String.fromCharCode(...bytes.subarray(n, n + 8192));
        return `data:${permitidas.get(url)};base64,${btoa(binario)}`;
    })().catch(erro => { imagensLocais.delete(url); throw erro; }));
    return imagensLocais.get(url);
}
async function incorporarImagens(doc, paginaURL) {
    await Promise.all(Array.from(doc.querySelectorAll("img[src]"), async imagem => {
        const url = new URL(imagem.getAttribute("src"), paginaURL).href;
        imagem.removeAttribute("srcset");
        if (!permitidas.has(url)) { imagem.removeAttribute("src"); return; }
        imagem.setAttribute("src", await imagemLocal(url));
    }));
}

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
    await incorporarImagens(doc, new URL(recursos[0], import.meta.url));
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
    politica.content = `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; frame-src about:; img-src data:; media-src 'none'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`;
    doc.head.prepend(politica);
    const estilo = doc.createElement("style");
    let estilos = css;
    // Somente URLs estáticas conhecidas do tema são incorporadas; a CSP permanece restrita.
    const assetsTema = id === "html" ? assetsHTML : id === "css" ? assetsCSS.concat("laboratorio-fundo-voxel.png") : [];
    for (const nome of assetsTema) {
        const referencia = `url("../../assets/images/${nome}")`;
        if (estilos.includes(referencia)) estilos = estilos.replaceAll(referencia, `url("${await imagemLocal(new URL(`../../../assets/images/${nome}`, import.meta.url).href)}")`);
    }
    estilo.textContent = estilos;
    doc.head.append(estilo);
    const dados = JSON.stringify(conteudos).replace(/</g, "\\u003c");
    const codigo = doc.createElement("script");
    codigo.type = "module";
    codigo.setAttribute("nonce", nonce);
    codigo.textContent = `window.addEventListener('keydown', (event) => { if (event.key === 'Escape') { event.preventDefault(); parent.postMessage({tipo:'fechar-documentacao',canal:${JSON.stringify(canal)}}, '*'); } });\n` + script.replace(/import\("\.\.\/\.\.\/data\/biblioteca\/(html|css|javascript|typescript|react)\/conteudos\.js"\)/g,
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
        if (iframeAtivo && event.origin === "null" && event.source === iframeAtivo.contentWindow && event.data?.tipo === "fechar-documentacao" && event.data.canal === canal) encerrar();
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
