// Projeto — Sessão - preserva o título ao atualizar a mesma aba
const formularioStudio = document.querySelector("#studio-formulario");
const campoTituloStudio = document.querySelector("#studio-titulo");
const tituloProjetoStudio = document.querySelector("#studio-projeto");
const chaveProjetoStudio = "taskflow.studio.titulo.v1";
let editorStudio;
let carregandoEditorStudio = false;

// Editor — Integração - carrega uma única instância sem bloquear o fluxo do projeto
async function iniciarEditorStudio() {
    if (editorStudio || carregandoEditorStudio) return;
    carregandoEditorStudio = true;
    const status = document.querySelector("#studio-editor-status");
    const repetir = document.querySelector("#studio-editor-repetir");
    const container = document.querySelector("#studio-editor");
    status.hidden = false;
    status.textContent = "Carregando o editor HTML…";
    repetir.hidden = true;
    container.setAttribute("aria-busy", "true");

    try {
        const [{ criarEditorHTML }, { criarPreviaHTML }, { iniciarReferenciaHTML }, { mostrarProblemasHTML }] = await Promise.all([
            import("./editor.js"),
            import("./previa.js"),
            import("./referencia.js"),
            import("./validacao.js")
        ]);
        const previa = criarPreviaHTML(
            document.querySelector("#studio-previa-iframe"),
            document.querySelector("#studio-previa-vazia")
        );
        editorStudio = criarEditorHTML(container, previa.agendar);
        iniciarReferenciaHTML(
            document.querySelector("#studio-mostrar-referencia"),
            document.querySelector("#studio-referencia"),
            document.querySelector("#studio-referencia-codigo")
        );
        const botaoProblemas = document.querySelector("#studio-ver-problemas");
        botaoProblemas.disabled = false;
        botaoProblemas.addEventListener("click", () => mostrarProblemasHTML(editorStudio));
        status.hidden = true;
    } catch {
        status.textContent = "Não foi possível carregar o editor. Confira sua conexão e tente novamente.";
        repetir.hidden = false;
    } finally {
        container.setAttribute("aria-busy", "false");
        carregandoEditorStudio = false;
    }
}

document.querySelector("#studio-editor-repetir").addEventListener("click", iniciarEditorStudio);

function abrirAmbienteStudio(titulo) {
    tituloProjetoStudio.textContent = titulo;
    tituloProjetoStudio.hidden = false;
    document.querySelector("#studio-inicio").hidden = true;
    document.querySelector("#studio-ambiente").hidden = false;
    document.querySelector("#titulo-ambiente").focus();
    iniciarEditorStudio();
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
