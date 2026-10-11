// Projeto — Sessão - preserva o título ao atualizar a mesma aba
const formularioStudio = document.querySelector("#studio-formulario");
const campoTituloStudio = document.querySelector("#studio-titulo");
const tituloProjetoStudio = document.querySelector("#studio-projeto");
const chaveProjetoStudio = "taskflow.studio.titulo.v1";

function abrirAmbienteStudio(titulo) {
    tituloProjetoStudio.textContent = titulo;
    tituloProjetoStudio.hidden = false;
    document.querySelector("#studio-inicio").hidden = true;
    document.querySelector("#studio-ambiente").hidden = false;
    document.querySelector("#titulo-ambiente").focus();
}

try {
    const tituloSalvo = sessionStorage.getItem(chaveProjetoStudio);
    if (tituloSalvo && tituloSalvo.trim() && tituloSalvo.length <= 120) {
        abrirAmbienteStudio(tituloSalvo.trim());
    }
} catch {
    document.querySelector("#studio-aviso").textContent =
        "O navegador bloqueou o armazenamento desta sessão. Permita-o para manter o projeto após atualizar.";
}

campoTituloStudio.addEventListener("input", function () {
    campoTituloStudio.setCustomValidity("");
});

formularioStudio.addEventListener("submit", function (event) {
    event.preventDefault();
    const titulo = campoTituloStudio.value.trim();

    campoTituloStudio.setCustomValidity(titulo ? "" : "Informe um título para o projeto.");
    if (!formularioStudio.reportValidity()) return;

    try {
        sessionStorage.setItem(chaveProjetoStudio, titulo);
    } catch {
        document.querySelector("#studio-aviso").textContent =
            "Não foi possível guardar o título nesta sessão. Permita o armazenamento do navegador e tente novamente.";
        return;
    }

    abrirAmbienteStudio(titulo);
});
