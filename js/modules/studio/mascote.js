const duracoes = { saudacao: 1000, atencao: 650, sucesso: 900, erro: 600 };

// Mascote — Imagem - utiliza o arquivo fornecido preservando os estados do mentor
export function criarMascote(container, aoMudarEstado) {
    const flutuacao = document.createElement("span");
    flutuacao.className = "mascote-flutuacao";
    const imagem = document.createElement("img");
    imagem.className = "mascote-imagem";
    imagem.src = new URL("../../../assets/images/mascote-voxel-azul.png", import.meta.url).href;
    imagem.alt = "";
    imagem.draggable = false;
    flutuacao.append(imagem);
    container.replaceChildren(flutuacao);
    let temporizador;

    function definirEstado(estado) {
        if (estado !== "idle" && !(estado in duracoes)) throw new Error("Estado de mascote inválido.");
        clearTimeout(temporizador);
        container.dataset.estado = estado;
        aoMudarEstado(estado);
        if (estado !== "idle") temporizador = setTimeout(() => definirEstado("idle"), duracoes[estado]);
    }
    definirEstado("idle");

    return {
        idle: () => definirEstado("idle"),
        saudacao: () => definirEstado("saudacao"),
        atencao: () => definirEstado("atencao"),
        sucesso: () => definirEstado("sucesso"),
        erro: () => definirEstado("erro"),
        pausar: (pausado) => { container.dataset.pausado = String(pausado); },
        destruir() { clearTimeout(temporizador); container.replaceChildren(); }
    };
}
