const chaveProjetos = "taskflow.studio.projetos.v1";

function tituloValido(titulo) {
    return typeof titulo === "string" && titulo.trim().length > 0 && titulo.length <= 120;
}

function dataValida(data) {
    return typeof data === "string" && Number.isFinite(Date.parse(data)) &&
        new Date(data).toISOString() === data;
}

function validarProjetos(projetos) {
    if (!Array.isArray(projetos)) throw new Error("Os dados dos projetos estão inválidos. Nenhum dado foi substituído.");
    const ids = new Set();
    for (const projeto of projetos) {
        if (!projeto || typeof projeto.id !== "string" || !projeto.id.trim() || ids.has(projeto.id) ||
            !tituloValido(projeto.titulo) || projeto.linguagem !== "html" ||
            typeof projeto.codigo !== "string" || !dataValida(projeto.criadoEm) ||
            !dataValida(projeto.atualizadoEm) || projeto.atualizadoEm < projeto.criadoEm) {
            throw new Error("Os dados dos projetos estão inválidos. Nenhum dado foi substituído.");
        }
        ids.add(projeto.id);
    }
}

// Persistência — Leitura - relê os dados em cada operação e preserva conteúdo inválido
function lerProjetos() {
    let texto;
    try {
        texto = localStorage.getItem(chaveProjetos);
    } catch {
        throw new Error("Não foi possível acessar seus projetos. Confira as permissões de armazenamento do navegador.");
    }
    let projetos;
    try {
        projetos = texto === null ? [] : JSON.parse(texto);
    } catch {
        throw new Error("Os dados dos projetos estão inválidos. Nenhum dado foi substituído.");
    }
    validarProjetos(projetos);
    return projetos;
}

function gravarProjetos(projetos) {
    validarProjetos(projetos);
    try {
        localStorage.setItem(chaveProjetos, JSON.stringify(projetos));
    } catch {
        throw new Error("Não foi possível salvar. O armazenamento pode estar cheio ou bloqueado. Seu código permanece no editor.");
    }
}

export function listarProjetos() {
    return lerProjetos().sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm));
}

export function buscarProjeto(id) {
    return lerProjetos().find((projeto) => projeto.id === id) || null;
}

export function criarProjeto(titulo, codigo) {
    if (!tituloValido(titulo) || typeof codigo !== "string") throw new Error("Informe um título válido de até 120 caracteres.");
    const projetos = lerProjetos();
    let id;
    do {
        id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() :
            Array.from(crypto.getRandomValues(new Uint8Array(16)), (valor) => valor.toString(16).padStart(2, "0")).join("");
    } while (projetos.some((projeto) => projeto.id === id));
    const agora = new Date().toISOString();
    const projeto = { id, titulo: titulo.trim(), linguagem: "html", codigo, criadoEm: agora, atualizadoEm: agora };
    gravarProjetos([...projetos, projeto]);
    return projeto;
}

// Persistência — Atualização - modifica somente o projeto selecionado após validar os dados
export function atualizarProjeto(id, alteracoes, atualizadoEmEsperado) {
    if (!alteracoes || typeof alteracoes !== "object" || Array.isArray(alteracoes) ||
        Object.keys(alteracoes).some((campo) => !["titulo", "codigo"].includes(campo)) ||
        ("titulo" in alteracoes && !tituloValido(alteracoes.titulo)) ||
        ("codigo" in alteracoes && typeof alteracoes.codigo !== "string")) {
        throw new Error("Os dados enviados para salvar o projeto estão inválidos.");
    }
    const projetos = lerProjetos();
    const indice = projetos.findIndex((projeto) => projeto.id === id);
    if (indice < 0) throw new Error("Este projeto não está mais salvo. Seu código permanece no editor.");
    const anterior = projetos[indice];
    if (atualizadoEmEsperado && anterior.atualizadoEm !== atualizadoEmEsperado) {
        throw new Error("Este projeto foi alterado em outra aba. Copie seu código antes de recarregar; a versão salva não foi substituída.");
    }
    const titulo = "titulo" in alteracoes ? alteracoes.titulo.trim() : anterior.titulo;
    const codigo = "codigo" in alteracoes ? alteracoes.codigo : anterior.codigo;
    if (titulo === anterior.titulo && codigo === anterior.codigo) return anterior;
    const atualizadoEm = new Date(Math.max(Date.now(), Date.parse(anterior.atualizadoEm) + 1)).toISOString();
    const projeto = { ...anterior, titulo, codigo, atualizadoEm };
    projetos[indice] = projeto;
    gravarProjetos(projetos);
    return projeto;
}

export function excluirProjeto(id) {
    const projetos = lerProjetos();
    if (!projetos.some((projeto) => projeto.id === id)) throw new Error("O projeto selecionado não foi encontrado.");
    gravarProjetos(projetos.filter((projeto) => projeto.id !== id));
}
