import { criarServicoAnotacoes } from "../services/anotacoes-biblioteca.js";

export function iniciarAnotacoes(catalogo, selecionado) {
    const $ = id => document.getElementById(id);
    const painel = $("biblioteca-anotacoes"), abrir = $("biblioteca-abrir-anotacoes"), formulario = $("anotacoes-formulario");
    let editando = null, notas = [];
    let storage;
    try { storage = window.localStorage; } catch { storage = { getItem() { throw new Error(); } }; }
    const servico = criarServicoAnotacoes(storage);
    function status(texto) { $("anotacoes-status").textContent = texto; }
    const normalizar = texto => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    function opcao(valor, texto) { const e = document.createElement("option"); e.value = valor; e.textContent = texto; return e; }
    for (const linguagem of catalogo) {
        $("anotacoes-linguagem").append(opcao(linguagem.id, linguagem.nome));
        $("anotacoes-filtro").append(opcao(linguagem.id, linguagem.nome));
    }
    function topicos(id) { return catalogo.find(l => l.id === id)?.niveis.flatMap(n => [...n.modulos.flatMap(m => m.assuntos), ...(n.assuntos || [])]) || []; }
    function preencherTopicos() {
        $("anotacoes-topico").replaceChildren(...topicos($("anotacoes-linguagem").value).map(a => opcao(a.id, a.titulo)));
    }
    function mostrarLista() {
        const termo = normalizar($("anotacoes-pesquisa").value), filtro = $("anotacoes-filtro").value;
        const resultados = notas.filter(n => (!filtro || n.linguagem === filtro) && normalizar(`${n.titulo} ${n.texto} ${n.topicoTitulo}`).includes(termo))
            .sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm));
        const lista = $("anotacoes-lista"); lista.replaceChildren();
        for (const nota of resultados) {
            const item = document.createElement("li"), titulo = document.createElement("h3"), contexto = document.createElement("p"), data = document.createElement("time"), texto = document.createElement("p");
            titulo.textContent = nota.titulo;
            contexto.className = "anotacoes-contexto"; contexto.textContent = `${catalogo.find(l => l.id === nota.linguagem)?.nome || nota.linguagem} › ${nota.topicoTitulo}`;
            data.dateTime = nota.criadoEm; data.textContent = new Date(nota.criadoEm).toLocaleDateString("pt-BR");
            texto.className = "anotacoes-texto"; texto.textContent = nota.texto;
            item.append(titulo, contexto, data, texto);
            const acoes = document.createElement("div"); acoes.className = "anotacoes-acoes";
            for (const [acao, rotulo] of [["editar", "Editar"], ["excluir", "Excluir"]]) {
                const botao = document.createElement("button"); botao.type = "button"; botao.textContent = rotulo;
                botao.setAttribute("aria-label", `${rotulo}: ${nota.titulo}`);
                botao.addEventListener("click", () => {
                    if (acao === "editar") editar(nota);
                    else if (window.confirm(`Excluir a anotação “${nota.titulo}”?`)) {
                        try { servico.excluir(nota.id); if (editando === nota.id) cancelar(); atualizar(); status("Anotação excluída."); }
                        catch (erro) { status(erro.message); }
                    }
                }); acoes.append(botao);
            }
            item.append(acoes); lista.append(item);
        }
        if (!resultados.length) { const vazio = document.createElement("li"); vazio.textContent = notas.length ? "Nenhuma anotação corresponde à pesquisa." : "Nenhuma anotação salva. Selecione um tópico e crie sua primeira anotação."; lista.append(vazio); }
    }
    function atualizar() {
        try { notas = servico.listar(); $("anotacoes-nova").disabled = false; mostrarLista(); }
        catch (erro) { status(erro.message); $("anotacoes-nova").disabled = true; }
    }
    function cancelar() { editando = null; formulario.reset(); formulario.hidden = true; $("anotacoes-nova").focus(); }
    function editar(nota = null) {
        const contexto = selecionado();
        if (!contexto && !nota) return;
        formulario.reset(); editando = nota?.id || null;
        $("anotacoes-formulario-titulo").textContent = nota ? "Editar anotação" : "Nova anotação";
        $("anotacoes-linguagem").value = nota?.linguagem || contexto.linguagem; preencherTopicos();
        $("anotacoes-topico").value = nota?.topico || contexto.topico;
        $("anotacoes-nome").value = nota?.titulo || ""; $("anotacoes-texto").value = nota?.texto || "";
        formulario.hidden = false; $("anotacoes-nome").focus(); formulario.scrollIntoView({ block: "nearest", behavior: "instant" });
    }
    abrir.addEventListener("click", () => { status(""); atualizar(); painel.showModal(); $("anotacoes-fechar").focus(); });
    $("anotacoes-fechar").addEventListener("click", () => painel.close());
    painel.addEventListener("close", () => { formulario.hidden = true; editando = null; abrir.focus({ preventScroll: true }); });
    $("anotacoes-nova").addEventListener("click", () => editar());
    $("anotacoes-cancelar").addEventListener("click", cancelar);
    $("anotacoes-linguagem").addEventListener("change", preencherTopicos);
    $("anotacoes-filtro").addEventListener("change", mostrarLista);
    $("anotacoes-pesquisa").addEventListener("input", mostrarLista);
    formulario.addEventListener("submit", evento => {
        evento.preventDefault();
        const linguagem = $("anotacoes-linguagem").value, topico = topicos(linguagem).find(t => t.id === $("anotacoes-topico").value);
        if (!topico || !formulario.reportValidity()) return;
        try {
            servico.salvar({ titulo: $("anotacoes-nome").value, texto: $("anotacoes-texto").value, linguagem, topico: topico.id, topicoTitulo: topico.titulo }, editando);
            cancelar(); atualizar(); status("Anotação salva.");
        } catch (erro) { status(erro.message); }
    });
    window.addEventListener("storage", evento => { if (evento.key === "taskflow.biblioteca.anotacoes.v1" && painel.open) atualizar(); });
    window.addEventListener("popstate", () => { if (painel.open && !$("view-biblioteca").classList.contains("view-ativa")) painel.close(); });
    atualizar();
}
