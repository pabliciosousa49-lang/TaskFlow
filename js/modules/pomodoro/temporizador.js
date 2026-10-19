export const modalidades = {
    foco: { nome: "Foco", minutos: 25, foco: true },
    curta: { nome: "Pausa curta", minutos: 5, foco: false },
    longa: { nome: "Pausa longa", minutos: 15, foco: false },
    personalizado: { nome: "Foco personalizado", minutos: 25, foco: true },
    pausaPersonalizada: { nome: "Pausa personalizada", minutos: 5, foco: false }
};

export function lerDuracao(valor) {
    if (!/^\d{2}:\d{2}$/.test(valor)) return null;
    const [horas, minutos] = valor.split(":").map(Number);
    const total = horas * 60 + minutos;
    return horas <= 23 && minutos < 60 && total > 0 ? total : null;
}

export function apresentarDuracao(minutos) {
    return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
}

export function dataLocal(instante) {
    const d = new Date(instante);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// O intervalo apenas atualiza a apresentação; o prazo real determina o restante.
export function criarTemporizador({ agora = Date.now, aoConcluir = () => {} } = {}) {
    let modo = "foco", total = 25 * 60000, restante = total, prazo = null, estado = "inicial";
    const consultar = () => ({ modo, total, restante, estado });
    function atualizar() {
        if (estado === "executando") {
            restante = Math.max(0, Math.min(total, prazo - agora()));
            if (restante === 0) {
                estado = "concluido";
                const termino = prazo;
                prazo = null;
                aoConcluir({ modo, minutos: total / 60000, termino, foco: modalidades[modo].foco });
            }
        }
        return consultar();
    }
    function reiniciar() { estado = "inicial"; restante = total; prazo = null; return consultar(); }
    return {
        consultar, atualizar, reiniciar, parar: reiniciar,
        iniciar() {
            if (estado === "executando") return consultar();
            if (estado === "concluido") restante = total;
            prazo = agora() + restante;
            estado = "executando";
            return consultar();
        },
        pausar() {
            atualizar();
            if (estado === "executando") { estado = "pausado"; prazo = null; }
            return consultar();
        },
        selecionar(novoModo, minutos = modalidades[novoModo]?.minutos) {
            if (!Object.hasOwn(modalidades, novoModo) || !Number.isInteger(minutos) || minutos < 1 || minutos > 1439) throw new Error("Duração inválida.");
            modo = novoModo;
            total = minutos * 60000;
            return reiniciar();
        }
    };
}

export function criarArmazenamento(storage) {
    const chave = "taskflow.pomodoro.v1";
    let dados = { versao: 1, personalizado: 25, pausa: 5, dias: {} }, bloqueado = false;
    let aviso = "";
    const diaValido = d => d && ["focos", "minutos", "pausas"].every(k => Number.isSafeInteger(d[k]) && d[k] >= 0);
    try {
        const texto = storage.getItem(chave);
        if (texto !== null) {
            const valor = JSON.parse(texto);
            if (!valor || valor.versao !== 1 || !Number.isInteger(valor.personalizado) || valor.personalizado < 1 || valor.personalizado > 1439 ||
                (valor.pausa !== undefined && (!Number.isInteger(valor.pausa) || valor.pausa < 1 || valor.pausa > 1439)) ||
                !valor.dias || typeof valor.dias !== "object" || Array.isArray(valor.dias) ||
                !Object.entries(valor.dias).every(([data, dia]) => /^\d{4}-\d{2}-\d{2}$/.test(data) && diaValido(dia))) throw new Error("Dados inválidos");
            dados = { ...valor, pausa: valor.pausa ?? 5 };
        }
    } catch {
        bloqueado = true;
        aviso = "Não foi possível ler as estatísticas. O registro original foi preservado; os dados desta página ficarão apenas em memória.";
    }
    function gravar() {
        if (bloqueado) return;
        try { storage.setItem(chave, JSON.stringify(dados)); aviso = ""; }
        catch { aviso = "Não foi possível salvar no navegador. As estatísticas desta página permanecem em memória."; }
    }
    return {
        get personalizado() { return dados.personalizado; },
        get pausa() { return dados.pausa; },
        get aviso() { return aviso; },
        dia(data) { return { ...(dados.dias[data] || { focos: 0, minutos: 0, pausas: 0 }) }; },
        configurar(minutos, pausa = dados.pausa) {
            if (![minutos, pausa].every(valor => Number.isInteger(valor) && valor >= 1 && valor <= 1439)) return false;
            dados.personalizado = minutos; dados.pausa = pausa; gravar(); return true;
        },
        concluir(sessao) {
            const data = dataLocal(sessao.termino);
            const dia = this.dia(data);
            if (sessao.foco) { dia.focos++; dia.minutos += sessao.minutos; }
            else dia.pausas++;
            dados.dias[data] = dia;
            gravar();
            return dia;
        }
    };
}
