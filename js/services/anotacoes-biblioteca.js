const chave = "taskflow.biblioteca.anotacoes.v1";
const linguagens = new Set(["html", "css", "javascript", "typescript", "react"]);
export function criarServicoAnotacoes(storage, { agora = () => new Date().toISOString(), gerarId = () => crypto.randomUUID() } = {}) {
    function validarCampos(valor) {
        if (!valor || !linguagens.has(valor.linguagem) || typeof valor.topico !== "string" || !valor.topico ||
            typeof valor.topicoTitulo !== "string" || !valor.topicoTitulo || typeof valor.titulo !== "string" || !valor.titulo.trim() || valor.titulo.length > 120 ||
            typeof valor.texto !== "string" || !valor.texto.trim() || valor.texto.length > 10000) throw new Error("Preencha título, linguagem, tópico e anotação dentro dos limites indicados.");
    }
    function listar() {
        try {
            const fonte = storage.getItem(chave);
            if (fonte === null) return [];
            const dados = JSON.parse(fonte), ids = new Set();
            if (!dados || dados.versao !== 1 || !Array.isArray(dados.anotacoes)) throw new Error();
            for (const nota of dados.anotacoes) {
                validarCampos(nota);
                if (typeof nota.id !== "string" || !nota.id || ids.has(nota.id) || typeof nota.criadoEm !== "string" || !Number.isFinite(Date.parse(nota.criadoEm)) || typeof nota.atualizadoEm !== "string" || !Number.isFinite(Date.parse(nota.atualizadoEm))) throw new Error();
                ids.add(nota.id);
            }
            return dados.anotacoes;
        } catch { throw new Error("Não foi possível ler as anotações. Os dados originais foram preservados; nenhuma alteração será gravada."); }
    }
    function gravar(notas) {
        try { storage.setItem(chave, JSON.stringify({ versao: 1, anotacoes: notas })); }
        catch { throw new Error("Não foi possível salvar as anotações no navegador. Os dados anteriores foram mantidos."); }
    }
    return {
        listar,
        salvar(campos, id = null) {
            validarCampos(campos);
            const notas = listar(), anterior = notas.find(n => n.id === id);
            if (id && !anterior) throw new Error("Esta anotação não está mais disponível. Atualize a lista.");
            const instante = agora();
            const nota = { id: anterior?.id || gerarId(), titulo: campos.titulo.trim(), texto: campos.texto.trim(), linguagem: campos.linguagem, topico: campos.topico, topicoTitulo: campos.topicoTitulo, criadoEm: anterior?.criadoEm || instante, atualizadoEm: instante };
            gravar(anterior ? notas.map(n => n.id === id ? nota : n) : [...notas, nota]);
            return nota;
        },
        excluir(id) {
            const notas = listar();
            if (!notas.some(n => n.id === id)) throw new Error("Esta anotação não está mais disponível.");
            gravar(notas.filter(n => n.id !== id));
        }
    };
}
