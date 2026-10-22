import { criarTemporizador, criarArmazenamento, dataLocal, modalidades, lerDuracao, apresentarDuracao } from "./temporizador.js";

export function iniciarPomodoro() {
    const $ = id => document.getElementById(id);
    const painel = $("pomodoro-painel"), acesso = $("abrir-pomodoro");
    // O acesso ao próprio localStorage também pode ser bloqueado pelo navegador.
    let storage;
    try { storage = window.localStorage; } catch { storage = { getItem() { throw new Error("Indisponível"); } }; }
    const registros = criarArmazenamento(storage);
    let mensagem = "Escolha uma modalidade e inicie sua sessão.", posicao = 0, minimizado = false;
    const timer = criarTemporizador({ aoConcluir(sessao) {
        const dia = registros.concluir(sessao);
        mensagem = `${modalidades[sessao.modo].nome} concluído!${sessao.foco && dia.focos % 4 === 0 ? " Quatro ciclos de foco: recomendamos uma pausa longa." : " Pronto para o próximo passo?"}`;
        if (sessao.modo === "personalizado" || sessao.modo === "pausaPersonalizada") {
            const pausa = sessao.modo === "personalizado";
            timer.selecionar(pausa ? "pausaPersonalizada" : "personalizado", pausa ? registros.pausa : registros.personalizado);
            mensagem += pausa ? ` Pausa de ${apresentarDuracao(registros.pausa)} pronta. Clique em Iniciar pausa.` : " Seu próximo estudo está pronto. Clique em Iniciar estudo.";
        }
        $("pomodoro-notificacao").textContent = mensagem;
        $("pomodoro-notificacao").hidden = painel.open;
        $("pomodoro-aviso").textContent = mensagem;
    } });
    $("pomodoro-estudo").value = apresentarDuracao(registros.personalizado);
    $("pomodoro-pausa").value = apresentarDuracao(registros.pausa);

    function estatisticas() {
        const dia = registros.dia(dataLocal(Date.now()));
        $("pomodoro-focos").textContent = dia.focos;
        $("pomodoro-minutos-total").textContent = dia.minutos;
        $("pomodoro-pausas").textContent = dia.pausas;
        $("pomodoro-meta").value = Math.min(4, dia.focos);
        $("pomodoro-meta-texto").textContent = `${Math.min(4, dia.focos)} de 4 ciclos da meta diária`;
        $("pomodoro-sessoes").textContent = `${dia.focos} ${dia.focos === 1 ? "sessão de foco concluída hoje" : "sessões de foco concluídas hoje"}`;
        for (const [indice, ciclo] of [...$("pomodoro-ciclos").children].entries()) ciclo.classList.toggle("concluido", indice < Math.min(dia.focos, 4));
        if ($("pomodoro-armazenamento").textContent !== registros.aviso) $("pomodoro-armazenamento").textContent = registros.aviso;
    }
    function renderizarMinimizado(estado, tempo) {
        const compacto = $("pomodoro-minimizado");
        compacto.hidden = !minimizado || Boolean(painel.open);
        $("pomodoro-minimizado-modo").textContent = modalidades[estado.modo].nome;
        $("pomodoro-minimizado-tempo").textContent = tempo;
        $("pomodoro-minimizado-status").textContent = { inicial: "Pronto", executando: "Em andamento", pausado: "Pausado", concluido: "Concluído" }[estado.estado];
        // Permanece acessível quando outro painel modal, como a Agenda, está aberto.
        if (!compacto.hidden) {
            const destino = [...(document.querySelectorAll?.("dialog[open]") || [])].filter(dialog => dialog !== painel).at(-1) || document.body;
            if (destino && compacto.parentElement !== destino) destino.append(compacto);
        }
    }
    function renderizar() {
        const estado = timer.atualizar();
        const segundos = Math.ceil(estado.restante / 1000);
        const personalizado = ["personalizado", "pausaPersonalizada"].includes(estado.modo);
        const tempo = personalizado
            ? `${String(Math.floor(segundos / 3600)).padStart(2, "0")}:${String(Math.floor(segundos / 60) % 60).padStart(2, "0")}:${String(segundos % 60).padStart(2, "0")}`
            : `${String(Math.floor(segundos / 60)).padStart(2, "0")}:${String(segundos % 60).padStart(2, "0")}`;
        renderizarMinimizado(estado, tempo);
        if (!painel.open) return;
        $("pomodoro-tempo").textContent = tempo;
        $("pomodoro-modalidade").textContent = modalidades[estado.modo].nome;
        $("pomodoro-temporizador").setAttribute("aria-label", `${modalidades[estado.modo].nome}: ${tempo}`);
        $("pomodoro-progresso").style.strokeDashoffset = String(565.49 * (1 - estado.restante / estado.total));
        $("pomodoro-iniciar").textContent = estado.estado === "executando" ? "Pausar" : estado.estado === "pausado" ? "Continuar" : personalizado ? estado.modo === "pausaPersonalizada" ? "Iniciar pausa" : "Iniciar estudo" : "Iniciar";
        $("pomodoro-estado").textContent = { inicial: "Pronto para começar", executando: "Sessão em andamento", pausado: "Sessão pausada", concluido: "Sessão concluída" }[estado.estado];
        for (const botao of painel.querySelectorAll("[data-modo]")) botao.setAttribute("aria-pressed", String(botao.dataset.modo === estado.modo || (botao.dataset.modo === "personalizado" && personalizado)));
        const agora = new Date();
        $("pomodoro-relogio").textContent = agora.toLocaleTimeString("pt-BR", { hour12: false });
        $("pomodoro-data").textContent = agora.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
        if ($("pomodoro-aviso").textContent !== mensagem) $("pomodoro-aviso").textContent = mensagem;
        estatisticas();
    }
    function definirModalidade(modo, minutos) {
        timer.atualizar();
        if (["executando", "pausado"].includes(timer.consultar().estado) && !window.confirm("Interromper a sessão atual e trocar de modalidade?")) return false;
        timer.selecionar(modo, minutos);
        mensagem = "Modalidade selecionada. Inicie quando estiver pronto.";
        $("pomodoro-notificacao").hidden = true;
        renderizar(); return true;
    }
    function abrirPainel() {
        if (painel.open) return;
        posicao = window.scrollY;
        minimizado = false;
        painel.showModal();
        document.documentElement.style.setProperty("--pomodoro-rolagem", `${-posicao}px`);
        document.documentElement.classList.add("pomodoro-aberto");
        $("pomodoro-notificacao").hidden = true;
        renderizar();
        $("pomodoro-fechar").focus();
    }
    acesso.addEventListener("click", abrirPainel);
    $("pomodoro-restaurar").addEventListener("click", abrirPainel);
    $("pomodoro-minimizar").addEventListener("click", () => {
        minimizado = true;
        painel.close();
        renderizar();
        $("pomodoro-restaurar").focus({ preventScroll: true });
    });
    $("pomodoro-fechar").addEventListener("click", () => painel.close());
    painel.addEventListener("close", () => {
        document.documentElement.classList.remove("pomodoro-aberto");
        document.documentElement.style.removeProperty("--pomodoro-rolagem");
        window.scrollTo({ top: posicao, behavior: "instant" });
        acesso.focus({ preventScroll: true });
    });
    $("pomodoro-iniciar").addEventListener("click", () => {
        if (timer.atualizar().estado === "executando") { timer.pausar(); mensagem = "Sessão pausada."; }
        else { timer.iniciar(); mensagem = "Mantenha o foco. Um passo de cada vez."; }
        $("pomodoro-notificacao").hidden = true;
        renderizar();
    });
    for (const [id, acao, texto] of [["pomodoro-reiniciar", "reiniciar", "Tempo reiniciado."], ["pomodoro-parar", "parar", "Sessão interrompida. Nenhum ciclo incompleto foi contabilizado."]]) {
        $(id).addEventListener("click", () => { timer.atualizar(); timer[acao](); mensagem = texto; $("pomodoro-notificacao").hidden = true; renderizar(); });
    }
    const botaoPersonalizado = [...painel.querySelectorAll("[data-modo]")].find(botao => botao.dataset.modo === "personalizado");
    function mostrarCamposPersonalizados(ativo) {
        $("pomodoro-personalizado").hidden = !ativo;
        botaoPersonalizado.setAttribute("aria-expanded", String(ativo));
    }
    $("pomodoro-recolher-campos").addEventListener("click", () => {
        mostrarCamposPersonalizados(false);
        botaoPersonalizado.focus();
    });
    function exibirPersonalizado(ativo) {
        painel.dataset.personalizado = String(ativo);
        mostrarCamposPersonalizados(ativo);
        for (const botao of painel.querySelectorAll("[data-modo]")) botao.hidden = ativo && ["curta", "longa"].includes(botao.dataset.modo);
    }
    for (const botao of painel.querySelectorAll("[data-modo]")) botao.addEventListener("click", () => {
        if (botao.dataset.modo === "personalizado") {
            exibirPersonalizado(true);
            $("pomodoro-estudo").focus();
        } else if (definirModalidade(botao.dataset.modo)) exibirPersonalizado(false);
    });
    $("pomodoro-personalizado").addEventListener("submit", evento => {
        evento.preventDefault();
        const estudo = $("pomodoro-estudo"), pausa = $("pomodoro-pausa");
        const minutos = lerDuracao(estudo.value), descanso = lerDuracao(pausa.value);
        for (const [campo, valor] of [[estudo, minutos], [pausa, descanso]]) {
            campo.setCustomValidity(valor === null ? "Informe uma duração entre 00:01 e 23:59, no formato HH:MM." : "");
            if (!campo.reportValidity()) return;
        }
        if (definirModalidade("personalizado", minutos)) {
            registros.configurar(minutos, descanso);
            mensagem = `Estudo: ${apresentarDuracao(minutos)} · Pausa: ${apresentarDuracao(descanso)}. As etapas iniciam somente quando você clicar em Iniciar.`;
            renderizar();
        }
    });
    for (const id of ["pomodoro-estudo", "pomodoro-pausa"]) $(id).addEventListener("input", evento => {
        const campo = evento.target;
        // Permite usar o teclado numérico do celular: 0130 torna-se 01:30.
        if (/^\d{4}$/.test(campo.value)) campo.value = `${campo.value.slice(0, 2)}:${campo.value.slice(2)}`;
        campo.setCustomValidity("");
    });
    const abas = [...painel.querySelectorAll('[role="tab"]')];
    function selecionarAba(aba) {
        for (const item of abas) {
            const ativa = item === aba;
            item.setAttribute("aria-selected", String(ativa)); item.tabIndex = ativa ? 0 : -1;
            $(item.getAttribute("aria-controls")).hidden = !ativa;
        }
        renderizar();
    }
    abas.forEach((aba, indice) => {
        aba.addEventListener("click", () => selecionarAba(aba));
        aba.addEventListener("keydown", evento => {
            const destino = { ArrowRight: (indice + 1) % abas.length, ArrowLeft: (indice + abas.length - 1) % abas.length, Home: 0, End: abas.length - 1 }[evento.key];
            if (destino === undefined) return;
            evento.preventDefault(); selecionarAba(abas[destino]); abas[destino].focus();
        });
    });
    // O motor continua ativo com o modal fechado e recalcula ao retornar à aba.
    window.setInterval(renderizar, 250);
    window.addEventListener("focus", renderizar);
    document.addEventListener("visibilitychange", renderizar);
    estatisticas();
}

iniciarPomodoro();
