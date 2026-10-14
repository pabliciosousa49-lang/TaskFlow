// Resolvedor — Referências - separa caminho, consulta e fragmento sem acessar a rede.
export function resolverReferenciaVirtual(referencia, caminhoOrigem) {
    if (typeof referencia !== "string" || !referencia.trim()) throw new Error("Referência de arquivo vazia.");
    if (typeof caminhoOrigem !== "string") throw new Error("O documento de origem é inválido.");
    const origem = caminhoOrigem.replace(/\\/g, "/");
    if (!origem || origem.startsWith("/") || /^[a-z][a-z0-9+.-]*:/i.test(origem) ||
        origem.split("/").some((parte) => !parte || parte === "." || parte === "..") || /[\x00-\x1f?#]/.test(origem)) {
        throw new Error("O documento de origem deve estar dentro da raiz virtual.");
    }
    const texto = referencia.trim();
    const indiceFragmento = texto.indexOf("#");
    const fragmento = indiceFragmento < 0 ? "" : texto.slice(indiceFragmento);
    const semFragmento = indiceFragmento < 0 ? texto : texto.slice(0, indiceFragmento);
    const indiceConsulta = semFragmento.indexOf("?");
    const consulta = indiceConsulta < 0 ? "" : semFragmento.slice(indiceConsulta);
    const parteCaminho = indiceConsulta < 0 ? semFragmento : semFragmento.slice(0, indiceConsulta);
    let caminho;
    try { caminho = decodeURIComponent(parteCaminho).replace(/\\/g, "/"); }
    catch { throw new Error("A referência contém uma codificação de caminho inválida."); }
    if (/^[a-z][a-z0-9+.-]*:/i.test(caminho) || caminho.startsWith("//") || /[\x00-\x1f]/.test(caminho)) {
        throw new Error("Use apenas caminhos dentro do projeto. Recursos externos não são permitidos.");
    }
    if (!caminho) return { caminho: origem, consulta, fragmento };
    const partes = caminho.startsWith("/") ? [] : origem.split("/").slice(0, -1);
    for (const parte of caminho.split("/")) {
        if (!parte || parte === ".") continue;
        if (parte === "..") {
            if (!partes.length) throw new Error("A referência tenta sair da raiz do projeto.");
            partes.pop();
        } else partes.push(parte);
    }
    if (!partes.length || caminho.endsWith("/") || [".", ".."].includes(caminho.split("/").at(-1))) {
        throw new Error("A referência não aponta para um arquivo.");
    }
    return { caminho: partes.join("/"), consulta, fragmento };
}

export function resolverCaminhoVirtual(referencia, caminhoOrigem) {
    return resolverReferenciaVirtual(referencia, caminhoOrigem).caminho;
}

export function resolverArquivoVirtual(arquivos, referencia, caminhoOrigem) {
    const caminho = resolverCaminhoVirtual(referencia, caminhoOrigem);
    const arquivo = arquivos.find((item) => item.tipo === "arquivo" && item.caminho === caminho);
    if (!arquivo) throw new Error(`Arquivo não encontrado: ${caminho}. Confira a referência no arquivo de origem.`);
    return arquivo;
}
