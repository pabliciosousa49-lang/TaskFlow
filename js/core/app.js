// Elementos da navegação — Seleção - localiza os acessos e as telas existentes
const botaoHome = document.querySelector("#abrir-home");
const botaoTaskFlow = document.querySelector("#abrir-taskflow");
const viewHome = document.querySelector("#view-home");
const viewTaskFlow = document.querySelector("#view-taskflow");

// Animação da recepção — Processamento - reinicia a entrada a cada abertura do TaskFlow
function iniciarRecepcao() {
    viewTaskFlow.classList.remove("taskflow-entrada");
    // Reinício visual — Observação - recalcula o layout para reiniciar a animação CSS
    void viewTaskFlow.offsetWidth;
    viewTaskFlow.classList.add("taskflow-entrada");
}

// Abertura do TaskFlow — Escuta - exibe a recepção e inicia sua apresentação
botaoTaskFlow.addEventListener("click", function (event) {
    event.preventDefault();
    // Estado da interface — Atualização - ativa a recepção e seu acesso no menu
    viewHome.classList.remove("view-ativa");
    viewTaskFlow.classList.add("view-ativa");
    botaoHome.classList.remove("item-menu-ativo");
    botaoTaskFlow.classList.add("item-menu-ativo");
    iniciarRecepcao();
});

// Retorno para Home — Escuta - restaura a tela inicial sem acumular listeners
botaoHome.addEventListener("click", function (event) {
    event.preventDefault();
    // Estado da interface — Atualização - encerra a entrada e restaura a Home
    viewTaskFlow.classList.remove("view-ativa", "taskflow-entrada");
    viewHome.classList.add("view-ativa");
    botaoTaskFlow.classList.remove("item-menu-ativo");
    botaoHome.classList.add("item-menu-ativo");
});

// Tópicos Front-end — Escuta - destaque visual em memória, sem interferir na navegação.
const topicosFrontend = document.querySelectorAll(".area-topicos .topico-frontend");
for (const topico of topicosFrontend) {
    topico.addEventListener("click", () => {
        for (const outro of topicosFrontend) outro.classList.remove("topico-selecionado");
        topico.classList.add("topico-selecionado");
    });
}

// Elementos da agenda — Seleção - reúne controles do calendário, formulário e próximos eventos
const painelAgenda = document.querySelector("#painel-agenda");
const formularioCompromisso = document.querySelector("#formulario-compromisso");
const campoTitulo = document.querySelector("#compromisso-titulo");
const campoDescricao = document.querySelector("#compromisso-descricao");
const campoData = document.querySelector("#compromisso-data");
const campoHora = document.querySelector("#compromisso-hora");
const diasAgenda = document.querySelector("#agenda-dias");
const listaCompromissos = document.querySelector("#lista-compromissos");
const avisoAgenda = document.querySelector("#agenda-aviso");
const painelEventos = document.querySelector("#painel-eventos");
const botaoEventos = document.querySelector("#alternar-eventos");

// Estado da agenda — Observação - mantém seleção, edição e disponibilidade da persistência
const chaveAgenda = "taskflow.agenda.compromissos.v1";
let compromissos = [];
let armazenamentoBloqueado = false;
let avisoArmazenamento = "";
let dataSelecionada = formatarDataLocal(new Date());
let mesExibido = dataSelecionada.slice(0, 7);
let idEmEdicao = null;
let acessoAgenda = null;
let fechamentoAgenda = null;
let posicaoPaginaAgenda = 0;
let fechamentoEventos = null;

// Datas e horários — Condição - valida valores reais sem conversão de fuso por UTC
function dataValida(valor) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
    const [ano, mes, dia] = valor.split("-").map(Number);
    if (ano < 1 || mes < 1 || mes > 12 || dia < 1) return false;
    const bissexto = ano % 4 === 0 && (ano % 100 !== 0 || ano % 400 === 0);
    const dias = [31, bissexto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return dia <= dias[mes - 1];
}
function horaValida(valor) {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(valor);
}
function formatarDataLocal(data) {
    return `${String(data.getFullYear()).padStart(4, "0")}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}
function criarDataLocal(data, hora = "12:00") {
    const [ano, mes, dia] = data.split("-").map(Number);
    const [horas, minutos] = hora.split(":").map(Number);
    const resultado = new Date(0);
    resultado.setFullYear(ano, mes - 1, dia);
    resultado.setHours(horas, minutos, 0, 0);
    return resultado;
}
function apresentarData(data) {
    return criarDataLocal(data).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}
function ordenarCompromissos(lista) {
    return [...lista].sort((primeiro, segundo) => `${primeiro.data}T${primeiro.hora}`.localeCompare(`${segundo.data}T${segundo.hora}`));
}

// Leitura dos compromissos — Processamento - preserva o conteúdo original quando houver erro
function recuperarCompromissos() {
    try {
        const texto = localStorage.getItem(chaveAgenda);
        if (texto === null) return;
        const dados = JSON.parse(texto);
        const ids = new Set();
        if (!Array.isArray(dados) || !dados.every(compromisso => {
            if (!compromisso || typeof compromisso.id !== "string" || !compromisso.id || ids.has(compromisso.id) ||
                typeof compromisso.titulo !== "string" || !compromisso.titulo.trim() || compromisso.titulo.length > 120 ||
                typeof compromisso.descricao !== "string" || compromisso.descricao.length > 2000 ||
                typeof compromisso.data !== "string" || !dataValida(compromisso.data) ||
                typeof compromisso.hora !== "string" || !horaValida(compromisso.hora)) return false;
            ids.add(compromisso.id);
            return true;
        })) throw new Error("Dados inválidos");
        compromissos = dados;
    } catch {
        armazenamentoBloqueado = true;
        avisoArmazenamento = "Não foi possível ler os dados da agenda. O conteúdo salvo foi preservado e as alterações estão bloqueadas. Verifique o armazenamento do navegador antes de continuar.";
    }
}

// Gravação dos compromissos — Atualização - confirma a persistência antes de alterar o estado em memória
function salvarCompromissos(novosCompromissos) {
    if (armazenamentoBloqueado) {
        avisoAgenda.textContent = avisoArmazenamento;
        return false;
    }
    try {
        localStorage.setItem(chaveAgenda, JSON.stringify(novosCompromissos));
        compromissos = novosCompromissos;
        return true;
    } catch {
        avisoAgenda.textContent = "Não foi possível salvar. Os dados anteriores foram mantidos. Verifique o espaço ou a permissão de armazenamento e tente novamente.";
        return false;
    }
}

// Conteúdo dos compromissos — Atualização - apresenta textos do aluno sem interpretar HTML
function criarItemCompromisso(compromisso, permitirEdicao) {
    const item = document.createElement("li");
    item.className = "agenda-compromisso";
    const titulo = document.createElement("strong");
    titulo.textContent = compromisso.titulo;
    const horario = document.createElement("time");
    horario.dateTime = `${compromisso.data}T${compromisso.hora}`;
    horario.textContent = `${apresentarData(compromisso.data)} · ${compromisso.hora}`;
    item.append(titulo, horario);
    if (permitirEdicao && compromisso.descricao) {
        const descricao = document.createElement("p");
        descricao.textContent = compromisso.descricao.length > 160 ? `${compromisso.descricao.slice(0, 160)}…` : compromisso.descricao;
        item.append(descricao);
    }
    if (permitirEdicao) {
        const acoes = document.createElement("div");
        acoes.className = "agenda-acoes";
        for (const [acao, texto] of [["editar", "Editar"], ["excluir", "Excluir"]]) {
            const botao = document.createElement("button");
            botao.type = "button";
            botao.className = "agenda-botao";
            botao.textContent = texto;
            botao.setAttribute("aria-label", `${texto}: ${compromisso.titulo}`);
            botao.dataset.acao = acao;
            botao.dataset.id = compromisso.id;
            botao.disabled = armazenamentoBloqueado;
            acoes.append(botao);
        }
        item.append(acoes);
    }
    return item;
}
function preencherLista(lista, registros, mensagem, permitirEdicao) {
    lista.replaceChildren();
    if (!registros.length) {
        const vazio = document.createElement("li");
        vazio.textContent = mensagem;
        lista.append(vazio);
        return;
    }
    registros.forEach(compromisso => lista.append(criarItemCompromisso(compromisso, permitirEdicao)));
}

// Calendário mensal — Atualização - alinha dias da semana e marca seleção, hoje e compromissos
function atualizarCalendario() {
    const primeiroDia = criarDataLocal(`${mesExibido}-01`);
    document.querySelector("#agenda-mes").textContent = primeiroDia.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    document.querySelector("#mes-anterior").disabled = mesExibido === "0001-01";
    document.querySelector("#mes-seguinte").disabled = mesExibido === "9999-12";
    diasAgenda.replaceChildren();
    for (let indice = 0; indice < primeiroDia.getDay(); indice++) {
        const espaco = document.createElement("span");
        espaco.setAttribute("aria-hidden", "true");
        diasAgenda.append(espaco);
    }
    const hoje = formatarDataLocal(new Date());
    for (let dia = 1; dia <= 31; dia++) {
        const data = `${mesExibido}-${String(dia).padStart(2, "0")}`;
        if (!dataValida(data)) break;
        const quantidade = compromissos.filter(compromisso => compromisso.data === data).length;
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = quantidade ? "agenda-dia com-compromisso" : "agenda-dia";
        botao.textContent = dia;
        botao.dataset.data = data;
        botao.setAttribute("aria-label", `${apresentarData(data)}${quantidade ? `, ${quantidade} compromisso(s)` : ""}`);
        botao.setAttribute("aria-pressed", String(data === dataSelecionada));
        if (data === hoje) botao.setAttribute("aria-current", "date");
        diasAgenda.append(botao);
    }
}
function atualizarProximosEventos() {
    const agora = new Date();
    const proximos = ordenarCompromissos(compromissos.filter(compromisso => criarDataLocal(compromisso.data, compromisso.hora) >= agora)).slice(0, 3);
    preencherLista(document.querySelector("#lista-eventos"), proximos,
        armazenamentoBloqueado ? "Não foi possível recuperar seus eventos. Abra a agenda para mais informações." : "Nenhum próximo compromisso. Seu próximo passo pode começar na agenda.", false);
}
function atualizarAgenda() {
    atualizarCalendario();
    document.querySelector("#agenda-data-selecionada").textContent = apresentarData(dataSelecionada);
    const compromissosDoDia = ordenarCompromissos(compromissos.filter(compromisso => compromisso.data === dataSelecionada));
    document.querySelector("#agenda-quantidade").textContent = `${compromissosDoDia.length} ${compromissosDoDia.length === 1 ? "compromisso" : "compromissos"}`;
    preencherLista(listaCompromissos, compromissosDoDia, "Nenhum compromisso para este dia.", true);
    atualizarProximosEventos();
}

// Formulário da agenda — Atualização - encerra a edição, oculta o formulário e mantém a data selecionada
function cancelarEdicao() {
    formularioCompromisso.hidden = true;
    idEmEdicao = null;
    formularioCompromisso.reset();
    campoTitulo.setCustomValidity("");
    campoData.setCustomValidity("");
    campoHora.setCustomValidity("");
    campoData.value = dataSelecionada;
    document.querySelector("#titulo-formulario").textContent = "Novo compromisso";
}
// Acesso ao formulário — Atualização - torna os campos visíveis e acessíveis após seleção ou edição
function mostrarFormulario() {
    formularioCompromisso.hidden = false;
    campoTitulo.focus();
    formularioCompromisso.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        block: "nearest"
    });
}
function abrirAgenda(evento) {
    if (painelAgenda.open) return;
    acessoAgenda = evento.currentTarget;
    avisoAgenda.textContent = avisoArmazenamento;
    cancelarEdicao();
    atualizarAgenda();
    posicaoPaginaAgenda = window.scrollY;
    painelAgenda.showModal();
    // Página principal — Atualização - fixa o fundo na posição atual durante o uso da agenda
    document.documentElement.style.setProperty("--agenda-posicao-pagina", `${-posicaoPaginaAgenda}px`);
    document.documentElement.classList.add("agenda-aberta");
    document.querySelector("#fechar-agenda").focus();
}
function fecharAgenda() {
    if (!painelAgenda.open || fechamentoAgenda !== null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        painelAgenda.close();
        return;
    }
    painelAgenda.classList.add("agenda-fechando");
    fechamentoAgenda = setTimeout(() => painelAgenda.close(), 150);
}

// Acessos e fechamento — Escuta - abre o painel, trata Escape e devolve foco ao acesso original
for (const id of ["#abrir-agenda", "#agenda-completa"]) document.querySelector(id).addEventListener("click", abrirAgenda);
document.querySelector("#fechar-agenda").addEventListener("click", fecharAgenda);
painelAgenda.addEventListener("cancel", evento => { evento.preventDefault(); fecharAgenda(); });
painelAgenda.addEventListener("close", () => {
    clearTimeout(fechamentoAgenda);
    fechamentoAgenda = null;
    painelAgenda.classList.remove("agenda-fechando");
    // Página principal — Atualização - libera o fundo e restaura a rolagem sem deslocar o foco
    document.documentElement.classList.remove("agenda-aberta");
    document.documentElement.style.removeProperty("--agenda-posicao-pagina");
    window.scrollTo({ top: posicaoPaginaAgenda, behavior: "instant" });
    if (acessoAgenda) acessoAgenda.focus({ preventScroll: true });
});
document.querySelector("#cancelar-compromisso").addEventListener("click", () => {
    cancelarEdicao();
    document.querySelector("#titulo-compromissos").focus();
});

// Navegação do calendário — Escuta - muda o mês sem alterar compromissos ou abrir outras páginas
function mudarMes(deslocamento) {
    const data = criarDataLocal(`${mesExibido}-01`);
    data.setMonth(data.getMonth() + deslocamento);
    if (data.getFullYear() < 1 || data.getFullYear() > 9999) return;
    mesExibido = formatarDataLocal(data).slice(0, 7);
    atualizarCalendario();
}
document.querySelector("#mes-anterior").addEventListener("click", () => mudarMes(-1));
document.querySelector("#mes-seguinte").addEventListener("click", () => mudarMes(1));
diasAgenda.addEventListener("click", evento => {
    const botao = evento.target.closest("button[data-data]");
    if (!botao) return;
    dataSelecionada = botao.dataset.data;
    cancelarEdicao();
    atualizarAgenda();
    mostrarFormulario();
});

// Cadastro e edição — Escuta - valida campos e salva somente após confirmar a gravação
for (const campo of [campoTitulo, campoData, campoHora]) campo.addEventListener("input", () => campo.setCustomValidity(""));
formularioCompromisso.addEventListener("submit", evento => {
    evento.preventDefault();
    campoTitulo.setCustomValidity(campoTitulo.value.trim() ? "" : "Informe um título.");
    campoData.setCustomValidity(dataValida(campoData.value) ? "" : "Informe uma data válida.");
    campoHora.setCustomValidity(horaValida(campoHora.value) ? "" : "Informe um horário válido.");
    if (!formularioCompromisso.reportValidity()) return;
    const compromisso = {
        id: idEmEdicao || crypto.randomUUID(),
        titulo: campoTitulo.value.trim(), descricao: campoDescricao.value.trim(),
        data: campoData.value, hora: campoHora.value
    };
    const novosCompromissos = idEmEdicao ? compromissos.map(atual => atual.id === idEmEdicao ? compromisso : atual) : [...compromissos, compromisso];
    if (!salvarCompromissos(novosCompromissos)) return;
    dataSelecionada = compromisso.data;
    mesExibido = compromisso.data.slice(0, 7);
    cancelarEdicao();
    atualizarAgenda();
    avisoAgenda.textContent = "Compromisso salvo.";
    document.querySelector("#titulo-compromissos").focus();
});

// Ações do compromisso — Escuta - preenche edição e confirma exclusões antes de persistir
listaCompromissos.addEventListener("click", evento => {
    const botao = evento.target.closest("button[data-acao]");
    if (!botao) return;
    const compromisso = compromissos.find(atual => atual.id === botao.dataset.id);
    if (!compromisso || armazenamentoBloqueado) return;
    if (botao.dataset.acao === "editar") {
        cancelarEdicao();
        idEmEdicao = compromisso.id;
        campoTitulo.value = compromisso.titulo;
        campoDescricao.value = compromisso.descricao;
        campoData.value = compromisso.data;
        campoHora.value = compromisso.hora;
        document.querySelector("#titulo-formulario").textContent = "Editar compromisso";
        mostrarFormulario();
    } else if (window.confirm(`Excluir o compromisso "${compromisso.titulo}"?`)) {
        if (!salvarCompromissos(compromissos.filter(atual => atual.id !== compromisso.id))) return;
        if (idEmEdicao === compromisso.id) cancelarEdicao();
        atualizarAgenda();
        avisoAgenda.textContent = "Compromisso excluído.";
        document.querySelector("#titulo-compromissos").focus();
    }
});

// Janela de próximos eventos — Escuta - alterna a consulta compacta e atualiza ao retornar à aplicação
function alternarEventos(abrir) {
    clearTimeout(fechamentoEventos);
    painelEventos.classList.remove("eventos-fechando");
    atualizarProximosEventos();
    botaoEventos.setAttribute("aria-expanded", String(abrir));
    if (abrir) {
        painelEventos.hidden = false;
    } else {
        const concluirFechamento = () => {
            painelEventos.hidden = true;
            painelEventos.classList.remove("eventos-fechando");
            botaoEventos.focus();
        };
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            concluirFechamento();
        } else {
            painelEventos.classList.add("eventos-fechando");
            fechamentoEventos = setTimeout(concluirFechamento, 150);
        }
    }
}
botaoEventos.addEventListener("click", () => alternarEventos(botaoEventos.getAttribute("aria-expanded") !== "true"));
document.querySelector("#fechar-eventos").addEventListener("click", () => alternarEventos(false));
painelEventos.addEventListener("keydown", evento => {
    if (evento.key === "Escape") { evento.preventDefault(); alternarEventos(false); }
});
botaoTaskFlow.addEventListener("click", atualizarProximosEventos);
window.addEventListener("focus", atualizarProximosEventos);
document.addEventListener("visibilitychange", () => { if (!document.hidden) atualizarProximosEventos(); });

// Inicialização da agenda — Processamento - recupera dados antes de apresentar o calendário
recuperarCompromissos();
document.querySelector("#salvar-compromisso").disabled = armazenamentoBloqueado;
cancelarEdicao();
atualizarAgenda();
