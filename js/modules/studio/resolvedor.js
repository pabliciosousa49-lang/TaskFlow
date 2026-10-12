// Resolvedor — Caminhos virtuais - não consulta a rede nem o sistema de arquivos
export function resolverCaminhoVirtual(referencia, caminhoOrigem) {
    if (typeof referencia !== "string" || !referencia.trim()) throw new Error("Referência de arquivo vazia.");
    let caminho;
    try { caminho = decodeURIComponent(referencia.trim().split(/[?#]/)[0]); }
    catch { throw new Error("A referência contém uma codificação de caminho inválida."); }
    caminho = caminho.replace(/\\/g, "/");
    if (!caminho) throw new Error("A referência não aponta para um arquivo.");
    if (/^[a-z][a-z0-9+.-]*:/i.test(caminho) || caminho.startsWith("/") || /[\x00-\x1f]/.test(caminho)) {
        throw new Error("Use apenas caminhos relativos dentro do projeto. Recursos externos não são permitidos.");
    }
    if (typeof caminhoOrigem !== "string") throw new Error("O documento de origem é inválido.");
    const origem = caminhoOrigem.replace(/\\/g, "/");
    if (!origem || origem.startsWith("/") || /^[a-z][a-z0-9+.-]*:/i.test(origem) || origem.split("/").includes("..")) {
        throw new Error("O documento de origem deve estar dentro da raiz virtual.");
    }
    const partes = origem.split("/").slice(0, -1);
    for (const parte of caminho.split("/")) {
        if (!parte || parte === ".") continue;
        if (parte === "..") {
            if (!partes.length) throw new Error("A referência tenta sair da raiz do projeto.");
            partes.pop();
        } else partes.push(parte);
    }
    if (!partes.length) throw new Error("A referência não aponta para um arquivo.");
    return partes.join("/");
}

export function resolverArquivoVirtual(arquivos, referencia, caminhoOrigem) {
    const caminho = resolverCaminhoVirtual(referencia, caminhoOrigem);
    const arquivo = arquivos.find((item) => item.tipo === "arquivo" && item.caminho === caminho);
    if (!arquivo) throw new Error(`Arquivo não encontrado: ${caminho}. Confira o caminho escrito no HTML.`);
    return arquivo;
}
