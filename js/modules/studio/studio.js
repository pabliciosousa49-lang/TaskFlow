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
let exploradorStudio;
let arquivoSelecionadoId = null;
let arquivoEditorAbertoId = null;
let projetoEditorAbertoId = null;
let trocandoDocumento = false;
let abasStudio;

function mostrarAviso(mensagem = "") {
    avisoProjetosStudio.textContent = mensagem;
    avisoProjetosStudio.hidden = !mensagem;
}

function indicarSalvamento(estado) {
    estadoSalvamentoStudio.dataset.estado = estado;
    estadoSalvamentoStudio.textContent = { salvando: "Salvando...", salvo: "Salvo", erro: "Erro ao salvar" }[estado];
    if (estado === "erro") mentorStudio?.erro();
    abasStudio?.atualizar(projetoAtivo?.arquivos || [], arquivoSelecionadoId, alteracoesPendentes);
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
    if (!projetoAtivo || !editorStudio || !arquivoEditorAbertoId) return true;
    const codigo = editorStudio.state.doc.toString();
    if (!alteracoesPendentes || codigo === codigoSalvo) {
        alteracoesPendentes = false;
        indicarSalvamento("salvo");
        return true;
    }
    indicarSalvamento("salvando");
    try {
        projetoAtivo = servicoProjetos.atualizarConteudoArquivo(
            projetoAtivo.id, arquivoEditorAbertoId, codigo, projetoAtivo.atualizadoEm
        );
        codigoSalvo = codigo;
        alteracoesPendentes = false;
        indicarSalvamento("salvo");
        mostrarAviso();
        exploradorStudio?.atualizar(projetoAtivo, arquivoSelecionadoId);
        return true;
    } catch (erro) {
        indicarSalvamento("erro");
        mostrarAviso(erro.message);
        return false;
    }
}

function aoAlterarCodigo(codigo) {
    if (trocandoDocumento || !projetoAtivo || !arquivoEditorAbertoId) return;
    atualizarPrevia();
    clearTimeout(temporizadorSalvamento);
    alteracoesPendentes = codigo !== codigoSalvo;
    indicarSalvamento(alteracoesPendentes ? "salvando" : "salvo");
    if (alteracoesPendentes) temporizadorSalvamento = setTimeout(salvarProjetoAtual, 800);
}

async function carregarComponentes() {
    if (!carregamentoComponentes) {
        carregamentoComponentes = Promise.all([
            import("./editor.js"), import("./previa.js"),
            import("./referencia.js"), import("./validacao.js"), import("./explorador.js"), import("./abas.js")
        ]).then(([editor, previa, referencia, validacao, explorador, abas]) => ({ ...editor, ...previa, ...referencia, ...validacao, ...explorador, ...abas }))
            .catch((erro) => { carregamentoComponentes = null; throw erro; });
    }
    return carregamentoComponentes;
}

function arquivoEditavel(item) { return item?.tipo === "arquivo"; }

function carregarArquivoNoEditor(codigo, opcoes = {}) {
    trocandoDocumento = true;
    try { componentesStudio.carregarDocumentoHTML(editorStudio, codigo, aoAlterarCodigo, opcoes); }
    finally { trocandoDocumento = false; }
}

function documentoPrincipal() {
    const arquivos = projetoAtivo?.arquivos || [];
    return arquivos.find((item) => item.tipo === "arquivo" && item.caminho === "index.html") ||
        arquivos.filter((item) => item.tipo === "arquivo" && item.nome === "index.html").sort((a, b) => a.caminho.localeCompare(b.caminho))[0];
}

function atualizarPrevia() {
    if (!previaStudio) return;
    const principal = documentoPrincipal();
    document.querySelector("#studio-previa-vazia p").textContent = principal
        ? "Escreva HTML em index.html para visualizar o resultado."
        : "Crie um arquivo chamado index.html para visualizar seu projeto.";
    const codigo = principal?.id === arquivoEditorAbertoId ? editorStudio.state.doc.toString() : (principal?.conteudo || "");
    previaStudio.agendar(codigo);
}

function atualizarApresentacaoArquivo(item) {
    const editavel = arquivoEditavel(item);
    const html = editavel && componentesStudio.linguagemArquivo(item.nome) === "html";
    document.querySelector("#studio-nome-arquivo").textContent = item?.caminho || "Nenhum arquivo";
    document.querySelector("#studio-editor-conteudo").hidden = !editavel;
    document.querySelector("#studio-arquivo-aviso").hidden = editavel;
    document.querySelector("#studio-arquivo-titulo").textContent = "Nenhum arquivo aberto";
    document.querySelector("#studio-arquivo-mensagem").textContent = "Crie um arquivo ou abra um arquivo pelo explorador para começar a editar.";
    document.querySelector("#studio-ver-problemas").disabled = !html;
    document.querySelector("#studio-mostrar-referencia").disabled = !html;
    if (!html) {
        document.querySelector("#studio-referencia").hidden = true;
        const botao = document.querySelector("#studio-mostrar-referencia");
        botao.setAttribute("aria-pressed", "false");
        botao.setAttribute("aria-expanded", "false");
        botao.textContent = "Mostrar código de referência";
    }
}

// Arquivos — Alternância - confirma o salvamento e restaura o estado do documento escolhido
function selecionarArquivo(item, primeiraAbertura = false) {
    if (!projetoAtivo || !salvarProjetoAtual()) return false;
    const atual = projetoAtivo.arquivos.find((entrada) => entrada.id === item.id);
    if (!arquivoEditavel(atual)) return false;
    trocandoDocumento = true;
    try {
        componentesStudio.abrirDocumentoEditor(editorStudio, atual, aoAlterarCodigo,
            primeiraAbertura && atual.nome === "index.html" ? atual.conteudo.indexOf("<body>\n") + "<body>\n".length : 0);
    } finally { trocandoDocumento = false; }
    arquivoEditorAbertoId = arquivoSelecionadoId = atual.id;
    projetoEditorAbertoId = projetoAtivo.id;
    codigoSalvo = atual.conteudo;
    alteracoesPendentes = false;
    abasStudio.abrir(atual.id);
    abasStudio.atualizar(projetoAtivo.arquivos, atual.id);
    atualizarApresentacaoArquivo(atual);
    atualizarPrevia();
    exploradorStudio?.atualizar(projetoAtivo, atual.id, atual.id);
    editorStudio.requestMeasure();
    return true;
}

function fecharArquivo(id) {
    if (!salvarProjetoAtual()) return;
    const ids = abasStudio.ids();
    const indice = ids.indexOf(id);
    abasStudio.remover(id);
    componentesStudio.descartarDocumentoEditor(editorStudio, id);
    if (id === arquivoEditorAbertoId) {
        arquivoEditorAbertoId = arquivoSelecionadoId = null;
        const seguinte = abasStudio.ids()[Math.max(0, indice - 1)];
        if (seguinte) selecionarArquivo(projetoAtivo.arquivos.find((item) => item.id === seguinte));
        else { carregarArquivoNoEditor("", { somenteLeitura: true }); atualizarApresentacaoArquivo(null); }
    }
    abasStudio.atualizar(projetoAtivo.arquivos, arquivoSelecionadoId);
    exploradorStudio.atualizar(projetoAtivo, arquivoSelecionadoId, arquivoSelecionadoId);
    atualizarPrevia();
    if (arquivoEditorAbertoId) editorStudio.focus();
    else document.querySelector("#explorador-novo-arquivo").focus();
}

// Explorador — Operações - mantém a persistência e o documento aberto coerentes
function operarEstrutura(acao, item, nome, parentId) {
    if (!projetoAtivo || abrindoProjeto || !salvarProjetoAtual()) return;
    try {
        let selecao;
        let criado;
        if (acao === "arquivo" || acao === "pasta") {
            const criar = acao === "arquivo" ? servicoProjetos.criarArquivo : servicoProjetos.criarPasta;
            const resultado = criar(projetoAtivo.id, nome, parentId, projetoAtivo.atualizadoEm);
            projetoAtivo = resultado.projeto;
            criado = resultado.item;
            selecao = criado.id;
        } else if (acao === "renomear") {
            projetoAtivo = servicoProjetos.renomearItem(projetoAtivo.id, item.id, nome, projetoAtivo.atualizadoEm);
            selecao = item.id;
        } else if (acao === "excluir") {
            projetoAtivo = servicoProjetos.excluirItem(projetoAtivo.id, item.id, projetoAtivo.atualizadoEm);
            selecao = item.parentId;
        }
        for (const id of abasStudio.ids()) if (!projetoAtivo.arquivos.some((entrada) => entrada.id === id)) componentesStudio.descartarDocumentoEditor(editorStudio, id);
        abasStudio.atualizar(projetoAtivo.arquivos, arquivoSelecionadoId);
        if (arquivoEditorAbertoId && !projetoAtivo.arquivos.some((entrada) => entrada.id === arquivoEditorAbertoId)) {
            carregarArquivoNoEditor("", { somenteLeitura: true });
            arquivoEditorAbertoId = projetoEditorAbertoId = null;
            codigoSalvo = "";
            const seguinte = abasStudio.ids()[0];
            if (seguinte) selecionarArquivo(projetoAtivo.arquivos.find((entrada) => entrada.id === seguinte));
        }
        if (criado?.tipo === "arquivo") selecionarArquivo(criado, true);
        else {
            const selecionado = projetoAtivo.arquivos.find((entrada) => entrada.id === arquivoSelecionadoId);
            if (!selecionado) arquivoSelecionadoId = null;
            if (selecionado && arquivoEditavel(selecionado)) selecionarArquivo(selecionado);
            else atualizarApresentacaoArquivo(selecionado);
        }
        abasStudio.atualizar(projetoAtivo.arquivos, arquivoSelecionadoId);
        atualizarPrevia();
        exploradorStudio.atualizar(projetoAtivo, arquivoSelecionadoId, selecao);
        if (criado && arquivoEditavel(criado)) {
            selecionarPainel("editor");
            editorStudio.focus();
        } else exploradorStudio.focarSelecionado();
        indicarSalvamento("salvo");
        mostrarAviso();
    } catch (erro) {
        indicarSalvamento("erro");
        mostrarAviso(erro.message);
    }
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
        if (!editorStudio) editorStudio = componentesStudio.criarEditorHTML(container, aoAlterarCodigo, { somenteLeitura: true });
        else carregarArquivoNoEditor("", { somenteLeitura: true });
        componentesStudio.limparDocumentosEditor(editorStudio);
        if (!abasStudio) abasStudio = componentesStudio.criarAbas(document.querySelector("#studio-abas"), {
            abrir: (id) => {
                if (selecionarArquivo(projetoAtivo.arquivos.find((item) => item.id === id))) editorStudio.focus();
            }, fechar: fecharArquivo
        });
        abasStudio.limpar();
        projetoAtivo = projeto;
        arquivoSelecionadoId = arquivoEditorAbertoId = projetoEditorAbertoId = null;
        codigoSalvo = "";
        alteracoesPendentes = false;
        document.querySelector("#studio-gerenciamento").hidden = true;
        document.querySelector("#studio-ambiente").hidden = false;
        tituloProjetoStudio.textContent = projeto.titulo;
        tituloProjetoStudio.hidden = false;
        document.querySelector("#studio-acoes-projeto").hidden = false;
        selecionarPainel("editor");
        previaStudio.agendar("");
        if (!exploradorStudio) exploradorStudio = componentesStudio.criarExplorador(document.querySelector("#studio-explorador"), {
            selecionar: selecionarArquivo,
            criar: (tipo, nome, parentId) => operarEstrutura(tipo, null, nome, parentId),
            renomear: (item, nome) => operarEstrutura("renomear", item, nome),
            excluir: (item) => operarEstrutura("excluir", item)
        });
        const principal = documentoPrincipal() || projeto.arquivos.find((item) => item.tipo === "arquivo");
        if (principal) selecionarArquivo(principal);
        else atualizarApresentacaoArquivo(null);
        exploradorStudio.atualizar(projetoAtivo, arquivoSelecionadoId);
        if (!referenciaInicializada) {
            componentesStudio.iniciarReferenciaHTML(
                document.querySelector("#studio-mostrar-referencia"),
                document.querySelector("#studio-referencia"), document.querySelector("#studio-referencia-codigo")
            );
            referenciaInicializada = true;
        }
        atualizarApresentacaoArquivo(principal);
        atualizarPrevia();
        botaoSalvarStudio.disabled = false;
        indicarSalvamento("salvo");
        registrarProjetoAtivo(projeto.id);
        mostrarAviso();
        status.hidden = true;
        mentorStudio?.ativar(true);
        mentorStudio?.saudacao();
        if (arquivoEditavel(principal)) editorStudio.focus();
        else document.querySelector("#explorador-novo-arquivo").focus();
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
        const projeto = servicoProjetos.criarProjeto(titulo);
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
