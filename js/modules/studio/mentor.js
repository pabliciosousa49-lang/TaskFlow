import { criarMascote } from "./mascote.js";

// Mentor — Apresentação - recebe mensagens explícitas e estados, sem analisar o código
export function criarMentorStudio(raiz) {
    const texto = raiz.querySelector("#studio-mentor-texto");
    const mensagem = raiz.querySelector("#studio-mentor-mensagem");
    const recolher = raiz.querySelector("#studio-mentor-recolher");
    const estado = raiz.querySelector("#studio-mentor-estado");
    const nomesEstados = { idle: "Disponível", saudacao: "Boas-vindas", atencao: "Uma orientação para você", sucesso: "Concluído", erro: "Algo precisa de atenção" };
    const mascote = criarMascote(raiz.querySelector("#studio-mascote"), (nome) => {
        raiz.dataset.estado = nome;
        estado.textContent = nomesEstados[nome];
    });
    let ativo = false;

    function atualizarPausa() { mascote.pausar(!ativo || document.hidden); }
    function alternarMensagem() {
        mensagem.hidden = !mensagem.hidden;
        recolher.setAttribute("aria-expanded", String(!mensagem.hidden));
        recolher.textContent = mensagem.hidden ? "Mostrar mensagem" : "Recolher mensagem";
    }
    recolher.addEventListener("click", alternarMensagem);
    document.addEventListener("visibilitychange", atualizarPausa);
    atualizarPausa();

    return {
        ativar(valor) { ativo = Boolean(valor); atualizarPausa(); },
        saudacao: mascote.saudacao,
        idle: mascote.idle,
        atencao: mascote.atencao,
        sucesso: mascote.sucesso,
        erro: mascote.erro,
        mostrarMensagem(conteudo) {
            if (typeof conteudo !== "string") throw new Error("A mensagem do mentor deve ser um texto.");
            texto.textContent = conteudo;
            mensagem.hidden = false;
            recolher.setAttribute("aria-expanded", "true");
            recolher.textContent = "Recolher mensagem";
            mascote.atencao();
        },
        destruir() {
            recolher.removeEventListener("click", alternarMensagem);
            document.removeEventListener("visibilitychange", atualizarPausa);
            mascote.destruir();
        }
    };
}
