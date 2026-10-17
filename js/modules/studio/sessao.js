// Sessão — Interface - dados opcionais por aba; nunca contém o código dos projetos.
const chave = "taskflow.studio.interface.v1";
export function normalizarSessao(valor) {
    const texto = v => typeof v === "string" && v.length <= 200 ? v : null;
    const numero = v => Number.isFinite(v) && v >= 0 ? Math.min(v, 10000000) : 0;
    return {
        abas: Array.isArray(valor?.abas) ? [...new Set(valor.abas.map(texto).filter(Boolean))].slice(0, 1000) : [],
        ativo: texto(valor?.ativo),
        documentos: Array.isArray(valor?.documentos) ? valor.documentos.slice(0, 1000).filter(d => texto(d?.id)).map(d => ({ id: d.id, cursor: Math.floor(numero(d.cursor)), top: numero(d.top), left: numero(d.left) })) : [],
        painel: valor?.painel === "previa" ? "previa" : "editor",
        automatica: valor?.automatica !== false,
        largura: Number.isFinite(valor?.largura) ? Math.max(30, Math.min(75, valor.largura)) : 58
    };
}
export function lerSessao(id) {
    try { const registros = JSON.parse(sessionStorage.getItem(chave) || "{}"); return { ...normalizarSessao(registros?.[id]), existente: registros !== null && typeof registros === "object" && Object.hasOwn(registros, id) }; }
    catch { return normalizarSessao(null); }
}
export function gravarSessao(id, dados) {
    try {
        const atual = JSON.parse(sessionStorage.getItem(chave) || "{}");
        const registros = Object.entries(atual && typeof atual === "object" ? atual : {}).filter(([k]) => k !== id).slice(-29);
        sessionStorage.setItem(chave, JSON.stringify(Object.fromEntries([...registros, [id, normalizarSessao(dados)]])));
    } catch { /* Estado de interface é opcional e não impede edição nem salvamento. */ }
}
