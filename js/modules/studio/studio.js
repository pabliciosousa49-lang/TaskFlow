const formularioStudio = document.querySelector("#studio-formulario");
const campoTituloStudio = document.querySelector("#studio-titulo");
const tituloProjetoStudio = document.querySelector("#studio-projeto");
const listaProjetosStudio = document.querySelector("#studio-lista-projetos");
const avisoProjetosStudio = document.querySelector("#studio-projetos-aviso");
const botaoCriarStudio = document.querySelector("#studio-criar-projeto");
const botaoSalvarStudio = document.querySelector("#studio-salvar-projeto");
const estadoSalvamentoStudio = document.querySelector("#studio-salvamento");
const chaveProjetoAtivo = "taskflow.studio.projeto-ativo.v1";
let servicoProjetos;
let componentesStudio;
let carregamentoComponentes;
let editorStudio;
let previaStudio;
let projetoAtivo;
let codigoSalvo = "";
let alteracoesPendentes = false;
let temporizadorSalvamento;
let abrindoProjeto = false;
let criandoProjeto = false;
let referenciaInicializada = false;
let pedidoAbertura;
let mentorStudio;

function mostrarAviso(mensagem = "") {
    avisoProjetosStudio.textContent = mensagem;
    avisoProjetosStudio.hidden = !mensagem;
}

function indicarSalvamento(estado) {
    estadoSalvamentoStudio.dataset.estado = estado;
    estadoSalvamentoStudio.textContent = { salvando: "Salvando...", salvo: "Salvo", erro: "Erro ao salvar" }[estado];
    if (estado === "erro") mentorStudio?.erro();
}

// Interface — Painéis - alterna a apresentação no mobile sem recriar o documento
function selecionarPainel(nome) {
    document.querySelector("#studio-paineis").dataset.painel = nome;
    document.querySelector("#studio-abrir-editor").setAttribute("aria-pressed", String(nome === "editor"));
    document.querySelector("#studio-abrir-previa").setAttribute("aria-pressed", String(nome === "previa"));
    if (nome === "editor") editorStudio?.requestMeasure();
}

function registrarProjetoAtivo(id) {
    try {
        if (id) sessionStorage.setItem(chaveProjetoAtivo, id);
        else sessionStorage.removeItem(chaveProjetoAtivo);
    } catch {
        // O registro da aba é opcional; os projetos continuam salvos no localStorage.
    }
}

// Projetos — Listagem - utiliza texto seguro e ações delegadas por identificador
function atualizarListaProjetos() {
    try {
        const projetos = servicoProjetos.listarProjetos();
        listaProjetosStudio.replaceChildren();
        if (!projetos.length) {
            const vazio = document.createElement("li");
            vazio.textContent = "Você ainda não possui projetos salvos.";
            listaProjetosStudio.append(vazio);
        }
        for (const projeto of projetos) {
            const item = document.createElement("li");
            const titulo = document.createElement("strong");
            titulo.textContent = projeto.titulo;
            const data = document.createElement("time");
            data.dateTime = projeto.atualizadoEm;
            data.textContent = `Atualizado em ${new Date(projeto.atualizadoEm).toLocaleString("pt-BR")}`;
            const acoes = document.createElement("div");
            acoes.className = "studio-lista-acoes";
            for (const [acao, texto] of [["continuar", "Continuar"], ["renomear", "Renomear"], ["excluir", "Excluir"]]) {
                const botao = document.createElement("button");
                botao.type = "button";
                botao.className = "studio-retorno";
                botao.dataset.acao = acao;
                botao.dataset.id = projeto.id;
                botao.textContent = texto;
                botao.setAttribute("aria-label", `${texto} projeto ${projeto.titulo}`);
                acoes.append(botao);
            }
            item.append(titulo, data, acoes);
            listaProjetosStudio.append(item);
        }
        return true;
    } catch (erro) {
        mostrarAviso(erro.message);
        return false;
    }
}

// Projetos — Salvamento - confirma a escrita antes de atualizar o estado visual
function salvarProjetoAtual() {
    clearTimeout(temporizadorSalvamento);
    if (!projetoAtivo || !editorStudio) return true;
    const codigo = editorStudio.state.doc.toString();
    if (!alteracoesPendentes || codigo === codigoSalvo) {
        alteracoesPendentes = false;
        indicarSalvamento("salvo");
        return true;
    }
    indicarSalvamento("salvando");
    try {
        projetoAtivo = servicoProjetos.atualizarProjeto(
            projetoAtivo.id, { codigo }, projetoAtivo.atualizadoEm
        );
        codigoSalvo = codigo;
        alteracoesPendentes = false;
        indicarSalvamento("salvo");
        mostrarAviso();
        return true;
    } catch (erro) {
        indicarSalvamento("erro");
        mostrarAviso(erro.message);
        return false;
    }
}

function aoAlterarCodigo(codigo) {
    previaStudio.agendar(codigo);
    clearTimeout(temporizadorSalvamento);
    if (!projetoAtivo) return;
    alteracoesPendentes = codigo !== codigoSalvo;
    indicarSalvamento(alteracoesPendentes ? "salvando" : "salvo");
    if (alteracoesPendentes) temporizadorSalvamento = setTimeout(salvarProjetoAtual, 800);
}

async function carregarComponentes() {
    if (!carregamentoComponentes) {
        carregamentoComponentes = Promise.all([
            import("./editor.js"), import("./previa.js"),
            import("./referencia.js"), import("./validacao.js")
        ]).then(([editor, previa, referencia, validacao]) => ({ ...editor, ...previa, ...referencia, ...validacao }))
            .catch((erro) => { carregamentoComponentes = null; throw erro; });
    }
    return carregamentoComponentes;
}

// Projetos — Abertura - restaura o código exato e substitui somente a instância anterior
async function abrirProjeto(id, novo = false) {
    if (abrindoProjeto || !salvarProjetoAtual()) return;
    abrindoProjeto = true;
    pedidoAbertura = { id, novo };
    const status = document.querySelector("#studio-editor-status");
    const repetir = document.querySelector("#studio-editor-repetir");
    const container = document.querySelector("#studio-editor");
    status.hidden = false;
    status.textContent = "Carregando o editor HTML…";
    repetir.hidden = true;
    container.setAttribute("aria-busy", "true");
    try {
        componentesStudio = await carregarComponentes();
        const projeto = servicoProjetos.buscarProjeto(id);
        if (!projeto) throw new Error("O projeto selecionado não foi encontrado.");
        clearTimeout(temporizadorSalvamento);
        previaStudio ||= componentesStudio.criarPreviaHTML(
            document.querySelector("#studio-previa-iframe"), document.querySelector("#studio-previa-vazia")
        );
        const novoEditor = componentesStudio.criarEditorHTML(container, aoAlterarCodigo, {
            codigoInicial: projeto.codigo,
            posicaoCursor: novo ? projeto.codigo.indexOf("<body>\n") + "<body>\n".length : 0
        });
        editorStudio?.destroy();
        editorStudio = novoEditor;
        projetoAtivo = projeto;
        codigoSalvo = projeto.codigo;
        alteracoesPendentes = false;
        document.querySelector("#studio-gerenciamento").hidden = true;
        document.querySelector("#studio-ambiente").hidden = false;
        tituloProjetoStudio.textContent = projeto.titulo;
        tituloProjetoStudio.hidden = false;
        document.querySelector("#studio-acoes-projeto").hidden = false;
        selecionarPainel("editor");
        previaStudio.agendar(projeto.codigo);
        if (!referenciaInicializada) {
            componentesStudio.iniciarReferenciaHTML(
                document.querySelector("#studio-mostrar-referencia"),
                document.querySelector("#studio-referencia"), document.querySelector("#studio-referencia-codigo")
            );
            referenciaInicializada = true;
        }
        document.querySelector("#studio-ver-problemas").disabled = false;
        botaoSalvarStudio.disabled = false;
        indicarSalvamento("salvo");
        registrarProjetoAtivo(projeto.id);
        mostrarAviso();
        status.hidden = true;
        mentorStudio?.ativar(true);
        mentorStudio?.saudacao();
        editorStudio.focus();
    } catch (erro) {
        mostrarAviso(`Não foi possível abrir o projeto. ${erro.message} Seus projetos salvos foram preservados.`);
        repetir.hidden = false;
    } finally {
        container.setAttribute("aria-busy", "false");
        abrindoProjeto = false;
    }
}

function mostrarGerenciamento() {
    if (abrindoProjeto || !salvarProjetoAtual()) return;
    projetoAtivo = null;
    registrarProjetoAtivo(null);
    document.querySelector("#studio-gerenciamento").hidden = false;
    document.querySelector("#studio-ambiente").hidden = true;
    tituloProjetoStudio.hidden = true;
    document.querySelector("#studio-acoes-projeto").hidden = true;
    mentorStudio?.ativar(false);
    atualizarListaProjetos();
    document.querySelector("#titulo-projetos").focus();
}

campoTituloStudio.addEventListener("input", () => campoTituloStudio.setCustomValidity(""));

formularioStudio.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!servicoProjetos || criandoProjeto || abrindoProjeto) return;
    const titulo = campoTituloStudio.value.trim();
    campoTituloStudio.setCustomValidity(titulo ? "" : "Informe um título para o projeto.");
    if (!formularioStudio.reportValidity()) return;
    criandoProjeto = true;
    botaoCriarStudio.disabled = true;
    try {
        const { criarEstruturaInicialHTML } = await carregarComponentes();
        const projeto = servicoProjetos.criarProjeto(titulo, criarEstruturaInicialHTML(titulo));
        campoTituloStudio.value = "";
        atualizarListaProjetos();
        await abrirProjeto(projeto.id, true);
    } catch (erro) {
        mostrarAviso(erro.message);
    } finally {
        criandoProjeto = false;
        botaoCriarStudio.disabled = false;
    }
});

listaProjetosStudio.addEventListener("click", async (event) => {
    const botao = event.target.closest("button[data-acao]");
    if (!botao || !servicoProjetos || abrindoProjeto || criandoProjeto) return;
    const { acao, id } = botao.dataset;
    try {
        const projeto = servicoProjetos.buscarProjeto(id);
        if (!projeto) throw new Error("O projeto selecionado não foi encontrado.");
        if (acao === "continuar") {
            await abrirProjeto(id);
            return;
        }
        if (acao === "renomear") {
            const titulo = window.prompt("Novo título do projeto:", projeto.titulo);
            if (titulo === null) return;
            servicoProjetos.atualizarProjeto(id, { titulo: titulo.trim() }, projeto.atualizadoEm);
        } else if (acao === "excluir") {
            if (!window.confirm(`Excluir o projeto “${projeto.titulo}”? Esta ação não pode ser desfeita.`)) return;
            servicoProjetos.excluirProjeto(id);
        }
        mostrarAviso();
        atualizarListaProjetos();
        document.querySelector("#titulo-projetos").focus();
    } catch (erro) {
        mostrarAviso(erro.message);
    }
});

// Navegação — Retorno - sai do editor somente depois de confirmar o salvamento
botaoSalvarStudio.addEventListener("click", mostrarGerenciamento);
document.querySelector("#studio-meus-projetos").addEventListener("click", mostrarGerenciamento);
document.querySelector("#studio-voltar").addEventListener("click", () => {
    if (abrindoProjeto || criandoProjeto) return;
    if (!document.querySelector("#studio-ambiente").hidden) {
        mostrarGerenciamento();
    } else {
        window.location.assign("../index.html");
    }
});
document.querySelector("#studio-ver-problemas").addEventListener("click", () => {
    if (editorStudio && componentesStudio) componentesStudio.mostrarProblemasHTML(editorStudio);
});
document.querySelector("#studio-abrir-editor").addEventListener("click", () => selecionarPainel("editor"));
document.querySelector("#studio-abrir-previa").addEventListener("click", () => selecionarPainel("previa"));
document.querySelector("#studio-editor-repetir").addEventListener("click", () => {
    if (pedidoAbertura) abrirProjeto(pedidoAbertura.id, pedidoAbertura.novo);
});

// Saída — Proteção - grava mudanças pendentes antes de ocultar ou sair da página
document.addEventListener("visibilitychange", () => {
    if (document.hidden && alteracoesPendentes) salvarProjetoAtual();
});
window.addEventListener("beforeunload", (event) => {
    if (alteracoesPendentes && !salvarProjetoAtual()) {
        event.preventDefault();
        event.returnValue = "";
    }
});

// Studio — Inicialização - carrega registros sem criar projetos durante uma recarga
async function iniciarStudio() {
    try {
        const { criarMentorStudio } = await import("./mentor.js");
        mentorStudio = criarMentorStudio(document.querySelector("#studio-mentor"));
    } catch {
        document.querySelector("#studio-mentor-estado").textContent = "Mentor indisponível";
    }
    try {
        servicoProjetos = await import("../../services/projetos-studio.js");
        if (!atualizarListaProjetos()) {
            const indisponivel = document.createElement("li");
            indisponivel.textContent = "Não foi possível carregar seus projetos. Confira o aviso acima.";
            listaProjetosStudio.replaceChildren(indisponivel);
            return;
        }
        botaoCriarStudio.disabled = false;
        let id;
        try { id = sessionStorage.getItem(chaveProjetoAtivo); } catch { /* Sessão opcional. */ }
        if (id && servicoProjetos.buscarProjeto(id)) await abrirProjeto(id);
    } catch (erro) {
        mostrarAviso(erro.message);
    }
}

iniciarStudio();
