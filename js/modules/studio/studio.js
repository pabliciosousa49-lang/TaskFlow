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
let documentoPreviaSelecionado;
let projetoAtivo;
let ultimoProjetoAbertoId;
let codigoSalvo = "";
let alteracoesPendentes = false;
let temporizadorSalvamento;
let abrindoProjeto = false;
let criandoProjeto = false;
let pedidoAbertura;
let mentorStudio;
let exploradorStudio;
let arquivoSelecionadoId = null;
let arquivoEditorAbertoId = null;
let projetoEditorAbertoId = null;
let trocandoDocumento = false;
let abasStudio;
let sessaoStudio, ferramentasStudio, consoleStudio, temporizadorSessao;

// A recepção e Meus projetos compartilham a mesma tela. Só transições reais
// entram neste histórico local; arquivos e edição ficam na sessão existente.
const historicoTelasStudio = [];
let telaStudio = { tipo: "gerenciamento", projetoId: null };
let voltandoStudio = false;
function capturarTelaStudio() {
    return { ...telaStudio, projetoId: telaStudio.tipo === "editor" ? telaStudio.projetoId : ultimoProjetoAbertoId || null };
}
function registrarTelaStudio(tipo, projetoId, anterior, registrar) {
    if (registrar && (anterior.tipo !== tipo || (tipo === "editor" && anterior.projetoId !== projetoId))) {
        historicoTelasStudio.push(anterior);
    }
    telaStudio = { tipo, projetoId };
}

function registrarInterface() {
    if (!projetoAtivo || !editorStudio || abrindoProjeto) return;
    sessaoStudio?.gravarSessao(projetoAtivo.id, {
        abas: abasStudio?.ids() || [], ativo: arquivoEditorAbertoId,
        documentos: componentesStudio?.capturarContextoEditor(editorStudio) || [],
        painel: document.querySelector("#studio-paineis").dataset.painel,
        automatica: document.querySelector("#studio-previa-automatica").checked,
        largura: Number(document.querySelector("#studio-largura-editor").value)
    });
}
function atualizarStatusEditor() {
    const item = projetoAtivo?.arquivos.find(a => a.id === arquivoEditorAbertoId);
    const status = document.querySelector("#studio-status-editor");
    if (!item || !editorStudio) { status.textContent = "Nenhum arquivo aberto."; return; }
    const pos = editorStudio.state.selection.main.head;
    const linha = editorStudio.state.doc.lineAt(pos);
    status.textContent = `${item.caminho} · ${componentesStudio.linguagemArquivo(item.nome)} · Linha ${linha.number}, coluna ${pos - linha.from + 1} · ${estadoSalvamentoStudio.textContent}`;
    ferramentasStudio?.atualizar();
}
function acompanharEditor() {
    if (trocandoDocumento || abrindoProjeto) return;
    atualizarStatusEditor(); clearTimeout(temporizadorSessao);
    temporizadorSessao = setTimeout(registrarInterface, 250);
}
function abrirLocalConsole(mensagem) {
    const item = projetoAtivo?.arquivos.find(a => a.tipo === "arquivo" && a.caminho === mensagem.caminho);
    if (!item || !selecionarArquivo(item)) return;
    if (mensagem.linha && mensagem.linha <= editorStudio.state.doc.lines) {
        const linha = editorStudio.state.doc.line(mensagem.linha);
        const pos = Math.min(linha.to, linha.from + Math.max(0, (mensagem.coluna || 1) - 1));
        editorStudio.dispatch({ selection: { anchor: pos }, scrollIntoView: true });
    }
    selecionarPainel("editor"); editorStudio.focus();
}
function ajustarLargura() {
    const valor = Math.max(30, Math.min(75, Number(document.querySelector("#studio-largura-editor").value) || 58));
    document.querySelector("#studio-paineis").style.setProperty("--studio-fracao-editor", `${valor / (100 - valor)}fr`);
    document.querySelector("#studio-largura-valor").textContent = `${valor}%`;
    editorStudio?.requestMeasure(); registrarInterface();
}

function mostrarAviso(mensagem = "") {
    avisoProjetosStudio.textContent = mensagem;
    avisoProjetosStudio.hidden = !mensagem;
}

function indicarSalvamento(estado) {
    estadoSalvamentoStudio.dataset.estado = estado;
    estadoSalvamentoStudio.textContent = { salvando: "Salvando...", salvo: "Salvo", erro: "Erro ao salvar" }[estado];
    if (estado === "erro") mentorStudio?.erro();
    abasStudio?.atualizar(projetoAtivo?.arquivos || [], arquivoSelecionadoId, alteracoesPendentes);
    atualizarStatusEditor();
}

// Interface — Painéis - alterna a apresentação no mobile sem recriar o documento
function selecionarPainel(nome) {
    document.querySelector("#studio-paineis").dataset.painel = nome;
    document.querySelector("#studio-abrir-editor").setAttribute("aria-pressed", String(nome === "editor"));
    document.querySelector("#studio-abrir-previa").setAttribute("aria-pressed", String(nome === "previa"));
    if (nome === "editor") editorStudio?.requestMeasure();
    registrarInterface();
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
            item.dataset.aberto = String(projeto.id === (projetoAtivo?.id || ultimoProjetoAbertoId));
            const titulo = document.createElement("strong");
            titulo.textContent = projeto.titulo;
            const data = document.createElement("time");
            data.dateTime = projeto.atualizadoEm;
            data.textContent = `Atualizado em ${new Date(projeto.atualizadoEm).toLocaleString("pt-BR")}`;
            const acoes = document.createElement("div");
            acoes.className = "studio-lista-acoes";
            for (const [acao, texto] of [["continuar", "Abrir projeto"], ["exportar", "Exportar backup"], ["renomear", "Renomear"], ["excluir", "Excluir"]]) {
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
            if (item.dataset.aberto === "true") {
                const indicador = document.createElement("span");
                indicador.className = "studio-projeto-aberto";
                indicador.textContent = projetoAtivo ? "Projeto aberto" : "Último projeto aberto";
                item.append(indicador);
            }
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
            import("./validacao.js"), import("./explorador.js"), import("./abas.js")
        ]).then(([editor, previa, validacao, explorador, abas]) => ({ ...editor, ...previa, ...validacao, ...explorador, ...abas }))
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
    const selecionado = documentoPreviaSelecionado?.projetoId === projetoAtivo?.id
        ? arquivos.find((item) => item.id === documentoPreviaSelecionado.arquivoId && item.tipo === "arquivo" && /\.html?$/i.test(item.nome))
        : null;
    return selecionado || arquivos.find((item) => item.tipo === "arquivo" && item.caminho === "index.html");
}

function atualizarPrevia() {
    if (!previaStudio) return;
    const principal = documentoPrincipal();
    document.querySelector("#studio-previa-vazia p").textContent = principal
        ? `Escreva HTML em ${principal.caminho} para visualizar o resultado.`
        : "Abra um arquivo HTML ou crie index.html na raiz para visualizar sua aplicação.";
    const codigo = principal?.id === arquivoEditorAbertoId ? editorStudio.state.doc.toString() : (principal?.conteudo || "");
    const arquivos = (projetoAtivo?.arquivos || []).map((item) => item.id === arquivoEditorAbertoId
        ? { ...item, conteudo: editorStudio.state.doc.toString() } : item);
    previaStudio.agendar(codigo, arquivos, principal?.caminho || "index.html", projetoAtivo?.id || "");
}

function atualizarApresentacaoArquivo(item) {
    componentesStudio?.atualizarContextoCaminhos(editorStudio, () => ({
        caminho: projetoAtivo?.arquivos.find(arquivo => arquivo.id === arquivoEditorAbertoId)?.caminho,
        arquivos: projetoAtivo?.arquivos || []
    }));
    const editavel = arquivoEditavel(item);
    if (!editavel) ferramentasStudio?.fecharBusca();
    document.querySelector("#studio-nome-arquivo").textContent = item?.caminho || "Nenhum arquivo";
    document.querySelector("#studio-editor-conteudo").hidden = !editavel;
    document.querySelector("#studio-arquivo-aviso").hidden = editavel;
    document.querySelector("#studio-arquivo-titulo").textContent = "Nenhum arquivo aberto";
    document.querySelector("#studio-arquivo-mensagem").textContent = "Crie um arquivo ou abra um arquivo pelo explorador para começar a editar.";

}

// Arquivos — Alternância - confirma o salvamento e restaura o estado do documento escolhido
function selecionarArquivo(item, primeiraAbertura = false) {
    if (!projetoAtivo || !item || !salvarProjetoAtual()) return false;
    const atual = projetoAtivo.arquivos.find((entrada) => entrada.id === item.id);
    if (!arquivoEditavel(atual)) return false;
    trocandoDocumento = true;
    try {
        componentesStudio.abrirDocumentoEditor(editorStudio, atual, aoAlterarCodigo,
            primeiraAbertura && atual.nome === "index.html" ? atual.conteudo.indexOf("<body>\n") + "<body>\n".length : 0);
    } finally { trocandoDocumento = false; }
    arquivoEditorAbertoId = arquivoSelecionadoId = atual.id;
    if (/\.html?$/i.test(atual.nome)) documentoPreviaSelecionado = { projetoId: projetoAtivo.id, arquivoId: atual.id };
    projetoEditorAbertoId = projetoAtivo.id;
    codigoSalvo = atual.conteudo;
    alteracoesPendentes = false;
    abasStudio.abrir(atual.id);
    abasStudio.atualizar(projetoAtivo.arquivos, atual.id);
    atualizarApresentacaoArquivo(atual);
    ferramentasStudio?.sincronizar();
    atualizarPrevia();
    exploradorStudio?.atualizar(projetoAtivo, atual.id, atual.id);
    editorStudio.requestMeasure();
    atualizarStatusEditor(); registrarInterface();
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
    atualizarStatusEditor(); registrarInterface();
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
async function abrirProjeto(id, novo = false, registrarNavegacao = true) {
    if (abrindoProjeto || !salvarProjetoAtual()) return false;
    const telaAnterior = capturarTelaStudio();
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
        const sessao = sessaoStudio?.lerSessao(id);
        if (!projeto) throw new Error("O projeto selecionado não foi encontrado.");
        clearTimeout(temporizadorSalvamento);
        consoleStudio?.limpar();
        previaStudio ||= componentesStudio.criarPreviaHTML(
            document.querySelector("#studio-previa-iframe"), document.querySelector("#studio-previa-vazia"),
            document.querySelector("#studio-previa-diagnosticos"), {
                aoMensagem: mensagem => consoleStudio?.adicionar(mensagem),
                aoEstado: estado => {
                    document.querySelector("#studio-previa-estado").textContent = estado.pendente ? "Alterações ainda não aplicadas" : "Prévia atualizada";
                    if (estado.executando) consoleStudio?.adicionar({ nivel: "info", texto: "Nova execução da prévia. O estado JavaScript foi reiniciado." });
                }
            }
        );
        document.querySelector("#studio-previa-automatica").checked = sessao?.automatica !== false;
        previaStudio.definirAutomatica(sessao?.automatica !== false);
        if (!editorStudio) {
            editorStudio = componentesStudio.criarEditorHTML(container, aoAlterarCodigo, { somenteLeitura: true });
            componentesStudio.observarEditor(editorStudio, acompanharEditor);
            editorStudio.scrollDOM.addEventListener("scroll", acompanharEditor, { passive: true });
        }
        else carregarArquivoNoEditor("", { somenteLeitura: true });
        componentesStudio.limparDocumentosEditor(editorStudio, sessao?.documentos || []);
        if (!abasStudio) abasStudio = componentesStudio.criarAbas(document.querySelector("#studio-abas"), {
            abrir: (id) => {
                if (selecionarArquivo(projetoAtivo.arquivos.find((item) => item.id === id))) editorStudio.focus();
            }, fechar: fecharArquivo
        });
        abasStudio.limpar();
        for (const aberto of sessao?.abas || []) if (projeto.arquivos.some(a => a.id === aberto && a.tipo === "arquivo")) abasStudio.abrir(aberto);
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
        const semAbas = sessao?.existente && sessao.ativo === null && !sessao.abas.length;
        const principal = semAbas ? null : projeto.arquivos.find(a => a.id === sessao?.ativo && a.tipo === "arquivo") || projeto.arquivos.find(a => a.id === sessao?.abas[0] && a.tipo === "arquivo") || documentoPrincipal() || projeto.arquivos.find(item => item.tipo === "arquivo");
        if (principal) selecionarArquivo(principal);
        else atualizarApresentacaoArquivo(null);
        exploradorStudio.atualizar(projetoAtivo, arquivoSelecionadoId);
        atualizarApresentacaoArquivo(principal);
        atualizarPrevia();
        selecionarPainel(sessao?.painel || "editor");
        document.querySelector("#studio-largura-editor").value = String(sessao?.largura || 58); ajustarLargura();
        botaoSalvarStudio.disabled = false;
        indicarSalvamento("salvo");
        registrarProjetoAtivo(projeto.id);
        ultimoProjetoAbertoId = projeto.id;
        mostrarAviso();
        status.hidden = true;
        mentorStudio?.ativar(true);
        mentorStudio?.saudacao();
        if (arquivoEditavel(principal)) editorStudio.focus();
        else document.querySelector("#explorador-novo-arquivo").focus();
        registrarTelaStudio("editor", projeto.id, telaAnterior, registrarNavegacao);
        return true;
    } catch (erro) {
        mostrarAviso(`Não foi possível abrir o projeto. ${erro.message} Seus projetos salvos foram preservados.`);
        repetir.hidden = false;
        return false;
    } finally {
        container.setAttribute("aria-busy", "false");
        abrindoProjeto = false;
        registrarInterface();
    }
}

function mostrarGerenciamento(registrarNavegacao = true) {
    if (abrindoProjeto || !salvarProjetoAtual()) return false;
    const telaAnterior = capturarTelaStudio();
    registrarInterface();
    ferramentasStudio?.fecharBusca();
    projetoAtivo = null;
    registrarProjetoAtivo(null);
    document.querySelector("#studio-gerenciamento").hidden = false;
    document.querySelector("#studio-ambiente").hidden = true;
    tituloProjetoStudio.hidden = true;
    document.querySelector("#studio-acoes-projeto").hidden = true;
    mentorStudio?.ativar(false);
    atualizarListaProjetos();
    document.querySelector("#titulo-projetos").focus();
    registrarTelaStudio("gerenciamento", ultimoProjetoAbertoId || null, telaAnterior, registrarNavegacao);
    return true;
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
        if (acao === "exportar") {
            if (projetoAtivo?.id === id && !salvarProjetoAtual()) return;
            const url = URL.createObjectURL(new Blob([servicoProjetos.exportarProjeto(id)], { type: "application/json" }));
            const link = document.createElement("a"); link.href = url; link.download = "taskflow-" + id + ".json";
            document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
            mostrarAviso("Backup preparado para download."); return;
        }
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
botaoSalvarStudio.addEventListener("click", () => mostrarGerenciamento());
document.querySelector("#studio-meus-projetos").addEventListener("click", () => mostrarGerenciamento());
async function voltarNoStudio() {
    if (voltandoStudio || abrindoProjeto || criandoProjeto) return;
    registrarInterface();
    if (alteracoesPendentes && !salvarProjetoAtual()) return;
    voltandoStudio = true;
    try {
        // Ignora projetos excluídos e retornos à mesma tela que restarem após essa remoção.
        while (historicoTelasStudio.length) {
            const entrada = historicoTelasStudio.at(-1);
            const mesmaTela = entrada.tipo === telaStudio.tipo && (entrada.tipo !== "editor" || entrada.projetoId === telaStudio.projetoId);
            if (!mesmaTela && (entrada.tipo !== "editor" || servicoProjetos.buscarProjeto(entrada.projetoId))) break;
            historicoTelasStudio.pop();
        }
        const anterior = historicoTelasStudio.at(-1);
        if (!anterior) { window.taskflowNavegacao.voltar(); return; }
        let restaurado;
        if (anterior.tipo === "editor") restaurado = await abrirProjeto(anterior.projetoId, false, false);
        else {
            const ultimo = ultimoProjetoAbertoId;
            ultimoProjetoAbertoId = anterior.projetoId;
            restaurado = mostrarGerenciamento(false);
            if (!restaurado) ultimoProjetoAbertoId = ultimo;
        }
        if (restaurado) historicoTelasStudio.pop();
    } catch (erro) {
        mostrarAviso(`Não foi possível retornar à tela anterior. ${erro.message}`);
    } finally { voltandoStudio = false; }
}
document.querySelector("#studio-voltar").addEventListener("click", voltarNoStudio);
document.querySelector("#studio-abrir-editor").addEventListener("click", () => selecionarPainel("editor"));
document.querySelector("#studio-abrir-previa").addEventListener("click", () => selecionarPainel("previa"));
document.querySelector("#studio-editor-repetir").addEventListener("click", () => {
    if (pedidoAbertura) abrirProjeto(pedidoAbertura.id, pedidoAbertura.novo);
});

// Saída — Proteção - grava mudanças pendentes antes de ocultar ou sair da página
document.addEventListener("visibilitychange", () => {
    if (document.hidden) { registrarInterface(); if (alteracoesPendentes) salvarProjetoAtual(); }
});
window.addEventListener("beforeunload", (event) => {
    registrarInterface();
    if (alteracoesPendentes && !salvarProjetoAtual()) {
        event.preventDefault();
        event.returnValue = "";
    }
});

// Studio — Inicialização - carrega registros sem criar projetos durante uma recarga
async function iniciarStudio() {
    try {
        sessaoStudio = await import("./sessao.js");
        const { criarConsolePrevia } = await import("./console-previa.js");
        const { criarFerramentasEditor } = await import("./ferramentas-editor.js");
        consoleStudio = criarConsolePrevia(document.querySelector("#studio-console-saida"), document.querySelector("#studio-console-limpar"), abrirLocalConsole);
        ferramentasStudio = criarFerramentasEditor({
            ativo: () => Boolean(projetoAtivo) && !abrindoProjeto && !criandoProjeto,
            editor: () => arquivoEditorAbertoId ? editorStudio : null,
            arquivos: () => projetoAtivo?.arquivos || [],
            abrir: item => { const aberto = selecionarArquivo(item); if (aberto) { selecionarPainel("editor"); editorStudio.focus(); } return aberto; },
            salvar: () => { if (salvarProjetoAtual()) { mostrarAviso("Projeto salvo."); registrarInterface(); } },
            realcar: (view, termo) => componentesStudio.realcarBusca(view, termo)
        });
    } catch (erro) { mostrarAviso("Ferramentas auxiliares indisponíveis: " + erro.message); }
    try {
        const { iniciarRoleta } = await import("./roleta.js");
        iniciarRoleta(document.querySelector("#studio-roleta"), document.querySelector("#studio-documentacao"));
    } catch {
        document.querySelector("#studio-roleta").hidden = true;
    }
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
        document.querySelector("#studio-importar-backup").disabled = false;
        let id;
        try { id = sessionStorage.getItem(chaveProjetoAtivo); } catch { /* Sessão opcional. */ }
        if (id && servicoProjetos.buscarProjeto(id)) await abrirProjeto(id);
    } catch (erro) {
        mostrarAviso(erro.message);
    }
}

document.querySelector("#studio-importar-backup").addEventListener("change", async event => {
    const campo = event.target; const arquivo = campo.files?.[0]; if (!arquivo || !servicoProjetos) return;
    campo.disabled = true;
    try {
        if (arquivo.size > servicoProjetos.limiteBackupBytes) throw new Error("Selecione um backup de até 2 MiB.");
        const projeto = servicoProjetos.importarProjeto(await arquivo.text());
        atualizarListaProjetos(); mostrarAviso(`Backup restaurado como “${projeto.titulo}”.`);
    } catch (erro) { mostrarAviso(erro.message); }
    finally { campo.disabled = false; campo.value = ""; }
});
document.querySelector("#studio-atualizar-previa").addEventListener("click", () => { atualizarPrevia(); previaStudio?.atualizar(); });
document.querySelector("#studio-previa-automatica").addEventListener("change", event => { previaStudio?.definirAutomatica(event.target.checked); registrarInterface(); });
document.querySelector("#studio-largura-editor").addEventListener("input", ajustarLargura);

iniciarStudio();
