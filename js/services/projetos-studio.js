import { criarEstruturaInicialHTML } from "../modules/studio/documento-html.js";

const chaveProjetos = "taskflow.studio.projetos.v1";
const erroDados = "Os dados dos projetos estão inválidos. Nenhum dado foi substituído.";

function tituloValido(titulo) {
    return typeof titulo === "string" && titulo.trim().length > 0 && titulo.length <= 120;
}

function dataValida(data) {
    return typeof data === "string" && Number.isFinite(Date.parse(data)) && new Date(data).toISOString() === data;
}

function nomeValido(nome) {
    return typeof nome === "string" && nome.length > 0 && nome.length <= 120 &&
        nome === nome.trim() && ![".", ".."].includes(nome) && !/[<>:"/\\|?*\x00-\x1f]/.test(nome) && !nome.endsWith(".");
}

function validarMetadados(projeto) {
    if (!projeto || typeof projeto.id !== "string" || !projeto.id.trim() || !tituloValido(projeto.titulo) ||
        projeto.linguagem !== "html" || !dataValida(projeto.criadoEm) || !dataValida(projeto.atualizadoEm) ||
        projeto.atualizadoEm < projeto.criadoEm) throw new Error(erroDados);
}

function validarArquivos(projeto) {
    if (projeto.formatoArquivos !== 1 || !Array.isArray(projeto.arquivos)) throw new Error(erroDados);
    const itens = new Map();
    const caminhos = new Set();
    for (const item of projeto.arquivos) {
        if (!item || typeof item.id !== "string" || !item.id.trim() || itens.has(item.id) || !nomeValido(item.nome) ||
            !["arquivo", "pasta"].includes(item.tipo) || typeof item.caminho !== "string" || caminhos.has(item.caminho) ||
            !(item.parentId === null || typeof item.parentId === "string") ||
            (item.tipo === "arquivo" && typeof item.conteudo !== "string")) throw new Error(erroDados);
        itens.set(item.id, item);
        caminhos.add(item.caminho);
    }
    for (const item of projeto.arquivos) {
        const parent = item.parentId === null ? null : itens.get(item.parentId);
        if (item.parentId !== null && (!parent || parent.tipo !== "pasta")) throw new Error(erroDados);
        if (item.caminho !== (parent ? `${parent.caminho}/${item.nome}` : item.nome)) throw new Error(erroDados);
        const ancestrais = new Set([item.id]);
        let atual = parent;
        while (atual) {
            if (ancestrais.has(atual.id)) throw new Error(erroDados);
            ancestrais.add(atual.id);
            atual = atual.parentId === null ? null : itens.get(atual.parentId);
        }
    }
    if (projeto.arquivoEditorId !== null && itens.get(projeto.arquivoEditorId)?.tipo !== "arquivo") throw new Error(erroDados);
}

function validarProjetos(projetos) {
    if (!Array.isArray(projetos)) throw new Error(erroDados);
    const ids = new Set();
    for (const projeto of projetos) {
        validarMetadados(projeto);
        if (ids.has(projeto.id)) throw new Error(erroDados);
        ids.add(projeto.id);
        validarArquivos(projeto);
    }
}

// Migração — Compatibilidade - conserva o código exato e os metadados dos projetos antigos
function converterLegado(projeto) {
    validarMetadados(projeto);
    if (Object.hasOwn(projeto, "arquivos")) return projeto;
    if (typeof projeto.codigo !== "string") throw new Error(erroDados);
    const { codigo, ...metadados } = projeto;
    const idArquivo = `${projeto.id}:index.html`;
    const arquivos = codigo.length ? [{ id: idArquivo, nome: "index.html", caminho: "index.html", parentId: null, tipo: "arquivo", conteudo: codigo }] : [];
    return { ...metadados, formatoArquivos: 1, arquivos, arquivoEditorId: arquivos.length ? idArquivo : null };
}

function gravarProjetos(projetos) {
    validarProjetos(projetos);
    try {
        localStorage.setItem(chaveProjetos, JSON.stringify(projetos));
    } catch {
        throw new Error("Não foi possível salvar. O armazenamento pode estar cheio ou bloqueado. As alterações permanecem no editor.");
    }
}

// Backup — Contrato - somente dados textuais; importação sempre cria outra identidade.
export const limiteBackupBytes = 2 * 1024 * 1024;
export function exportarProjeto(id) {
    const projeto = buscarProjeto(id);
    if (!projeto) throw new Error("Projeto não encontrado.");
    const texto = JSON.stringify({ formato: "taskflow.studio.backup", versao: 1, projeto }, null, 2);
    if (new TextEncoder().encode(texto).length > limiteBackupBytes) throw new Error("O backup excede o limite de 2 MiB.");
    return texto;
}

export function importarProjeto(texto) {
    if (typeof texto !== "string" || new TextEncoder().encode(texto).length > limiteBackupBytes) throw new Error("Selecione um backup JSON de até 2 MiB.");
    let backup;
    try { backup = JSON.parse(texto); } catch { throw new Error("O arquivo não contém JSON válido."); }
    if (backup?.formato !== "taskflow.studio.backup" || backup.versao !== 1 || !Array.isArray(backup.projeto?.arquivos) || backup.projeto.arquivos.length > 1000) throw new Error("Backup incompatível. Limite: 1.000 arquivos e pastas.");
    validarProjetos([backup.projeto]);
    const projetos = lerProjetos();
    const ids = new Set(projetos.flatMap(p => [p.id, ...p.arquivos.map(a => a.id)]));
    const novoId = () => { const id = criarId(ids); ids.add(id); return id; };
    const mapa = new Map(backup.projeto.arquivos.map(item => [item.id, novoId()]));
    const agora = new Date().toISOString();
    const projeto = {
        id: novoId(), titulo: backup.projeto.titulo.slice(0, 112) + " (cópia)", linguagem: "html",
        criadoEm: agora, atualizadoEm: agora, formatoArquivos: 1,
        arquivoEditorId: mapa.get(backup.projeto.arquivoEditorId) || null,
        arquivos: backup.projeto.arquivos.map(item => ({
            id: mapa.get(item.id), nome: item.nome, caminho: item.caminho, tipo: item.tipo,
            parentId: item.parentId === null ? null : mapa.get(item.parentId),
            ...(item.tipo === "arquivo" ? { conteudo: item.conteudo } : {})
        }))
    };
    gravarProjetos([...projetos, projeto]);
    return projeto;
}

// Persistência — Leitura - migra somente depois de validar todos os registros
function lerProjetos() {
    let texto;
    try { texto = localStorage.getItem(chaveProjetos); } catch {
        throw new Error("Não foi possível acessar seus projetos. Confira as permissões de armazenamento do navegador.");
    }
    let antigos;
    try { antigos = texto === null ? [] : JSON.parse(texto); } catch { throw new Error(erroDados); }
    if (!Array.isArray(antigos)) throw new Error(erroDados);
    const projetos = antigos.map(converterLegado);
    validarProjetos(projetos);
    if (antigos.some((projeto) => !Object.hasOwn(projeto, "arquivos"))) {
        try { gravarProjetos(projetos); } catch {
            throw new Error("Não foi possível migrar os projetos. O formato anterior permanece salvo. Libere espaço ou permita o armazenamento e tente novamente.");
        }
    }
    return projetos;
}

function criarId(ids) {
    let id;
    do {
        id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() :
            Array.from(crypto.getRandomValues(new Uint8Array(16)), (valor) => valor.toString(16).padStart(2, "0")).join("");
    } while (ids.has(id));
    return id;
}

function alterarProjeto(id, atualizadoEmEsperado, alterar) {
    const projetos = lerProjetos();
    const projeto = projetos.find((item) => item.id === id);
    if (!projeto) throw new Error("Este projeto não está mais salvo. As alterações permanecem no editor.");
    if (atualizadoEmEsperado && projeto.atualizadoEm !== atualizadoEmEsperado) {
        throw new Error("Este projeto foi alterado em outra aba. Copie seu código antes de recarregar; a versão salva não foi substituída.");
    }
    const anterior = JSON.stringify(projeto);
    alterar(projeto);
    if (JSON.stringify(projeto) === anterior) return projeto;
    projeto.atualizadoEm = new Date(Math.max(Date.now(), Date.parse(projeto.atualizadoEm) + 1)).toISOString();
    gravarProjetos(projetos);
    return projeto;
}

export function listarProjetos() {
    return lerProjetos().sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm));
}

export function buscarProjeto(id) {
    return lerProjetos().find((projeto) => projeto.id === id) || null;
}

export function criarProjeto(titulo) {
    if (!tituloValido(titulo)) throw new Error("Informe um título válido de até 120 caracteres.");
    const projetos = lerProjetos();
    const agora = new Date().toISOString();
    const projeto = {
        id: criarId(new Set(projetos.map((item) => item.id))), titulo: titulo.trim(), linguagem: "html",
        criadoEm: agora, atualizadoEm: agora, formatoArquivos: 1, arquivos: [], arquivoEditorId: null
    };
    gravarProjetos([...projetos, projeto]);
    return projeto;
}

export function atualizarProjeto(id, alteracoes, atualizadoEmEsperado) {
    if (!alteracoes || typeof alteracoes !== "object" || Object.keys(alteracoes).some((campo) => campo !== "titulo") ||
        ("titulo" in alteracoes && !tituloValido(alteracoes.titulo))) throw new Error("Informe um título válido de até 120 caracteres.");
    return alterarProjeto(id, atualizadoEmEsperado, (projeto) => {
        if ("titulo" in alteracoes) projeto.titulo = alteracoes.titulo.trim();
    });
}

export function excluirProjeto(id) {
    const projetos = lerProjetos();
    if (!projetos.some((projeto) => projeto.id === id)) throw new Error("O projeto selecionado não foi encontrado.");
    gravarProjetos(projetos.filter((projeto) => projeto.id !== id));
}

function validarNomeNoDiretorio(projeto, nome, parentId, ignorarId) {
    if (!nomeValido(nome)) throw new Error("Use um nome de até 120 caracteres, sem separadores de caminho ou caracteres inválidos.");
    if (parentId !== null && !projeto.arquivos.some((item) => item.id === parentId && item.tipo === "pasta")) throw new Error("A pasta selecionada não foi encontrada.");
    if (projeto.arquivos.some((item) => item.parentId === parentId && item.nome === nome && item.id !== ignorarId)) {
        throw new Error("Já existe um arquivo ou pasta com esse nome neste diretório.");
    }
}

function adicionarItem(idProjeto, nome, parentId, tipo, atualizadoEmEsperado) {
    let item;
    const projeto = alterarProjeto(idProjeto, atualizadoEmEsperado, (atual) => {
        validarNomeNoDiretorio(atual, nome, parentId);
        const parent = atual.arquivos.find((entrada) => entrada.id === parentId);
        item = {
            id: criarId(new Set(atual.arquivos.map((entrada) => entrada.id))), nome,
            caminho: parent ? `${parent.caminho}/${nome}` : nome, parentId, tipo
        };
        if (tipo === "arquivo") item.conteudo = nome === "index.html" ? criarEstruturaInicialHTML(atual.titulo) : "";
        atual.arquivos.push(item);
        if (tipo === "arquivo" && nome === "index.html" && !atual.arquivoEditorId) atual.arquivoEditorId = item.id;
    });
    return { projeto, item };
}

export function criarArquivo(idProjeto, nome, parentId = null, atualizadoEmEsperado) {
    return adicionarItem(idProjeto, nome, parentId, "arquivo", atualizadoEmEsperado);
}

export function criarPasta(idProjeto, nome, parentId = null, atualizadoEmEsperado) {
    return adicionarItem(idProjeto, nome, parentId, "pasta", atualizadoEmEsperado);
}

export function atualizarConteudoArquivo(idProjeto, idArquivo, conteudo, atualizadoEmEsperado) {
    if (typeof conteudo !== "string") throw new Error("O conteúdo do arquivo deve ser um texto.");
    return alterarProjeto(idProjeto, atualizadoEmEsperado, (projeto) => {
        const item = projeto.arquivos.find((entrada) => entrada.id === idArquivo && entrada.tipo === "arquivo");
        if (!item) throw new Error("O arquivo não foi encontrado. Seu código permanece no editor.");
        item.conteudo = conteudo;
    });
}

export function renomearItem(idProjeto, idItem, nome, atualizadoEmEsperado) {
    return alterarProjeto(idProjeto, atualizadoEmEsperado, (projeto) => {
        const item = projeto.arquivos.find((entrada) => entrada.id === idItem);
        if (!item) throw new Error("O arquivo ou pasta não foi encontrado.");
        validarNomeNoDiretorio(projeto, nome, item.parentId, item.id);
        const caminhoAnterior = item.caminho;
        const parent = projeto.arquivos.find((entrada) => entrada.id === item.parentId);
        const novoCaminho = parent ? `${parent.caminho}/${nome}` : nome;
        item.nome = nome;
        for (const entrada of projeto.arquivos) {
            if (entrada.caminho === caminhoAnterior || (item.tipo === "pasta" && entrada.caminho.startsWith(`${caminhoAnterior}/`))) {
                entrada.caminho = novoCaminho + entrada.caminho.slice(caminhoAnterior.length);
            }
        }
        if (item.tipo === "arquivo" && nome === "index.html" && !projeto.arquivoEditorId) projeto.arquivoEditorId = item.id;
    });
}

export function excluirItem(idProjeto, idItem, atualizadoEmEsperado) {
    return alterarProjeto(idProjeto, atualizadoEmEsperado, (projeto) => {
        const item = projeto.arquivos.find((entrada) => entrada.id === idItem);
        if (!item) throw new Error("O arquivo ou pasta não foi encontrado.");
        const removidos = new Set(projeto.arquivos.filter((entrada) => entrada.id === idItem ||
            (item.tipo === "pasta" && entrada.caminho.startsWith(`${item.caminho}/`))).map((entrada) => entrada.id));
        projeto.arquivos = projeto.arquivos.filter((entrada) => !removidos.has(entrada.id));
        if (removidos.has(projeto.arquivoEditorId)) projeto.arquivoEditorId = null;
    });
}
