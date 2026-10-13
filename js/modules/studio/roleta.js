import { tecnologias } from "./tecnologias.js";
import { criarPainelDocumentacao } from "./painel-documentacao.js";

export function iniciarRoleta(raiz, dialogo) {
    const alternar = raiz.querySelector("#studio-roleta-alternar");
    const painel = raiz.querySelector("#studio-roleta-painel");
    const circulo = raiz.querySelector(".studio-roleta-circulo");
    const indicador = raiz.querySelector("#studio-roleta-indicador");
    const abrirDocumento = criarPainelDocumentacao(dialogo);
    const movimento = window.matchMedia("(prefers-reduced-motion: reduce)");
    const passo = 360 / tecnologias.length;
    let angulo = 0, quadro = 0, ponteiro, ultimo = 0, instante = 0, velocidade = 0, arrastou = false, ignorarClique = false;
    const normalizar = (valor) => ((valor + 180) % 360 + 360) % 360 - 180;
    const ativo = () => ((Math.round(-angulo / passo) % tecnologias.length) + tecnologias.length) % tecnologias.length;
    const botoes = tecnologias.map((tecnologia, indice) => {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "studio-roleta-tecnologia";
        botao.dataset.tecnologia = tecnologia.id;
        botao.setAttribute("aria-label", `${tecnologia.nome} — ${tecnologia.grupo}: abrir documentação`);
        botao.setAttribute("aria-describedby", "studio-roleta-ajuda");
        botao.title = `${tecnologia.nome} — ${tecnologia.grupo}`;
        const conteudo = document.createElement("span");
        conteudo.className = "studio-roleta-rotulo";
        const icone = document.createElement("i");
        icone.className = `${tecnologia.icone} studio-roleta-icone`;
        icone.setAttribute("aria-hidden", "true");
        const nome = document.createElement("span");
        nome.className = "studio-roleta-nome";
        nome.textContent = tecnologia.nome;
        conteudo.append(icone, nome);
        botao.append(conteudo);
        botao.addEventListener("click", () => { parar(); angulo = -indice * passo; renderizar(); abrirDocumento(tecnologia, botao); });
        circulo.append(botao);
        return botao;
    });
    function renderizar() {
        const selecionado = ativo();
        const tamanho = circulo.getBoundingClientRect().width || 480;
        const centro = tamanho / 2;
        const interno = tamanho * .28, externo = tamanho * .492, raioRotulo = tamanho * .385;
        const ponto = (raio, graus) => {
            const rad = graus * Math.PI / 180;
            return `${(centro - raio * Math.cos(rad)).toFixed(2)}px ${(centro + raio * Math.sin(rad)).toFixed(2)}px`;
        };
        botoes.forEach((botao, indice) => {
            const theta = normalizar(angulo + indice * passo);
            const rad = theta * Math.PI / 180;
            // Setor anular: arcos interno/externo e intervalo entre tecnologias.
            const metade = passo * .47;
            const pontos = [];
            for (let n = 0; n <= 8; n++) pontos.push(ponto(externo, theta - metade + 2 * metade * n / 8));
            for (let n = 8; n >= 0; n--) pontos.push(ponto(interno, theta - metade + 2 * metade * n / 8));
            botao.style.clipPath = `polygon(${pontos.join(",")})`;
            const rotulo = botao.querySelector(".studio-roleta-rotulo");
            rotulo.style.left = `${centro - raioRotulo * Math.cos(rad)}px`;
            rotulo.style.top = `${centro + raioRotulo * Math.sin(rad)}px`;
            rotulo.style.transform = `translate(-50%, -50%) rotate(${-theta}deg)`;
            // A entrada/saída visual depende somente do recorte do contêiner.
            // Os setores fora do semicírculo são omitidos apenas da árvore acessível.
            botao.setAttribute("aria-hidden", String(Math.abs(theta) > 90 + metade));
            botao.tabIndex = indice === selecionado ? 0 : -1;
            botao.setAttribute("aria-pressed", String(indice === selecionado));
        });
        const texto = `${tecnologias[selecionado].nome} · ${selecionado + 1}/${tecnologias.length}`;
        if (indicador.textContent !== texto) indicador.textContent = texto;
    }
    function parar() { cancelAnimationFrame(quadro); quadro = 0; }
    function alinhar(delta = 0, focar = false) {
        parar();
        const inicio = angulo;
        const destino = -ativo() * passo + delta * passo;
        const distancia = normalizar(destino - inicio);
        if (movimento.matches) { angulo += distancia; renderizar(); if (focar) botoes[ativo()].focus(); return; }
        const comeco = performance.now();
        function animar(agora) {
            const t = Math.min(1, (agora - comeco) / 220);
            angulo = inicio + distancia * (1 - Math.pow(1 - t, 3));
            renderizar();
            if (t < 1) quadro = requestAnimationFrame(animar);
            else if (focar) botoes[ativo()].focus();
        }
        quadro = requestAnimationFrame(animar);
    }
    function recolher() {
        parar(); painel.hidden = true;
        alternar.setAttribute("aria-expanded", "false");
        alternar.textContent = "Tecnologias ◐";
        document.body.classList.remove("studio-roleta-aberta");
    }
    alternar.addEventListener("click", () => {
        if (!painel.hidden) { recolher(); return; }
        painel.hidden = false; alternar.setAttribute("aria-expanded", "true"); alternar.textContent = "Recolher ◑";
        document.body.classList.add("studio-roleta-aberta"); renderizar();
    });
    raiz.addEventListener("keydown", (event) => {
        if (painel.hidden) return;
        if (["ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"].includes(event.key)) {
            event.preventDefault(); alinhar(["ArrowUp", "ArrowLeft"].includes(event.key) ? 1 : -1, true);
        } else if (event.key === "Escape") { recolher(); alternar.focus(); }
    });
    function posicao(event) {
        const rect = circulo.getBoundingClientRect();
        const centro = rect.width / 2;
        return Math.atan2(event.clientY - rect.top - centro, centro - (event.clientX - rect.left)) * 180 / Math.PI;
    }
    circulo.addEventListener("pointerdown", (event) => {
        if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
        parar(); ponteiro = event.pointerId; ultimo = posicao(event); instante = event.timeStamp; velocidade = 0; arrastou = false; ignorarClique = false;
    });
    circulo.addEventListener("pointermove", (event) => {
        if (ponteiro !== event.pointerId) return;
        const atual = posicao(event), diferenca = normalizar(atual - ultimo);
        if (!arrastou && Math.abs(diferenca) < 2) return;
        if (!arrastou) circulo.setPointerCapture(ponteiro);
        arrastou = true;
        angulo += diferenca;
        velocidade = Math.max(-.8, Math.min(.8, diferenca / Math.max(1, event.timeStamp - instante)));
        ultimo = atual; instante = event.timeStamp;
        renderizar();
    });
    function soltar(event) {
        if (event.pointerId !== ponteiro) return;
        ponteiro = undefined;
        ignorarClique = arrastou;
        if (!arrastou) return;
        if (movimento.matches || event.type === "pointercancel") { alinhar(); return; }
        let anterior = performance.now();
        function desacelerar(agora) {
            const dt = Math.min(32, agora - anterior); anterior = agora;
            angulo += velocidade * dt;
            velocidade *= Math.pow(.92, dt / 16);
            renderizar();
            if (Math.abs(velocidade) > .008) quadro = requestAnimationFrame(desacelerar);
            else alinhar();
        }
        quadro = requestAnimationFrame(desacelerar);
    }
    circulo.addEventListener("pointerup", soltar);
    circulo.addEventListener("pointercancel", soltar);
    circulo.addEventListener("lostpointercapture", (event) => {
        if (event.pointerId === ponteiro) { ponteiro = undefined; alinhar(); }
    });
    circulo.addEventListener("click", (event) => {
        if (ignorarClique && event.detail) { event.preventDefault(); event.stopImmediatePropagation(); ignorarClique = false; }
    }, true);
    document.addEventListener("visibilitychange", () => { if (document.hidden) recolher(); });
    movimento.addEventListener?.("change", () => alinhar());
    const ambiente = document.querySelector("#studio-ambiente");
    function acompanharAmbiente() {
        raiz.hidden = ambiente.hidden;
        if (ambiente.hidden) { recolher(); if (dialogo.open) dialogo.close(); }
    }
    new MutationObserver(acompanharAmbiente).observe(ambiente, { attributes: true, attributeFilter: ["hidden"] });
    if (typeof ResizeObserver !== "undefined") new ResizeObserver(renderizar).observe(circulo);
    acompanharAmbiente();
    renderizar();
}
