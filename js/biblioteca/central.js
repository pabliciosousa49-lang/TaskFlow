import { iniciarBibliotecaCentral } from "./biblioteca.js";
import { iniciarAnotacoes } from "./anotacoes.js";

try {
    const biblioteca = await iniciarBibliotecaCentral();
    const status = document.getElementById("biblioteca-integracao-status");
    function atualizarCategoria() {
        const linguagem = biblioteca.selecionado()?.linguagem;
        for (const controle of document.querySelectorAll("#taskflow-categorias .topico-frontend")) {
            const ativo = controle.dataset.topico === linguagem;
            controle.classList.toggle("topico-selecionado", ativo);
            if (ativo) controle.setAttribute("aria-current", "true"); else controle.removeAttribute("aria-current");
        }
    }
    document.getElementById("biblioteca-central").addEventListener("biblioteca:selecao", atualizarCategoria);
    atualizarCategoria();
    for (const id of ["abrir-biblioteca", "acessar-biblioteca"]) document.getElementById(id)?.addEventListener("click", evento => {
        if (evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey || evento.button > 0) return;
        biblioteca.reiniciar();
        status.textContent = "";
    });
    for (const controle of document.querySelectorAll("#taskflow-categorias [data-topico]")) {
        controle.addEventListener("click", evento => {
            if (evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey || evento.button > 0) return;
            const id = controle.dataset.topico;
            if (biblioteca.catalogo.some(d => d.id === id)) { evento.preventDefault(); biblioteca.selecionarLinguagem(id); status.textContent = ""; }
            else { status.textContent = `A documentação de ${controle.textContent.trim()} ainda está em preparação.`; atualizarCategoria(); }
        });
    }
    for (const [indice, botao] of [...document.querySelectorAll(".biblioteca-categoria-atalho")].entries()) botao.addEventListener("click", () => {
        if (indice === 0) biblioteca.selecionarLinguagem("html");
        else status.textContent = `Os conteúdos de ${indice === 1 ? "Back-end" : "Mobile"} ainda não estão disponíveis nesta Biblioteca.`;
    });
    iniciarAnotacoes(biblioteca.catalogo, biblioteca.selecionado);
} catch {
    document.getElementById("biblioteca-integracao-status").textContent = "Não foi possível integrar a consulta. Os links originais das documentações continuam disponíveis. Recarregue a página para tentar novamente.";
    document.getElementById("biblioteca-vazio-titulo").textContent = "Consulta indisponível";
    document.getElementById("biblioteca-vazio-descricao").textContent = "Use os acessos originais das linguagens acima.";
}
