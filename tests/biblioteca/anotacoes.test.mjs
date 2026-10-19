import test from "node:test";
import assert from "node:assert/strict";
import { criarServicoAnotacoes } from "../../js/services/anotacoes-biblioteca.js";

function iniciar() {
    const memoria = new Map([["taskflow.agenda.compromissos.v1", "agenda preservada"], ["taskflow.studio.projetos.v1", "projetos preservados"]]);
    const storage = { getItem: k => memoria.get(k) ?? null, setItem: (k, v) => memoria.set(k, v) };
    let numero = 0;
    const servico = criarServicoAnotacoes(storage, { agora: () => "2026-10-19T22:00:00.000Z", gerarId: () => `nota-${++numero}` });
    const campos = { titulo: "Estrutura", texto: "Usar lang no html.", linguagem: "html", topico: "estrutura-documento", topicoTitulo: "Estrutura de um documento HTML" };
    return { memoria, storage, servico, campos };
}
test("anotações: cria, restaura, edita associação, exclui e preserva outros registros", () => {
    const { memoria, storage, servico, campos } = iniciar();
    const primeira = servico.salvar(campos), segunda = servico.salvar({ ...campos, titulo: "Segunda" });
    const recarregado = criarServicoAnotacoes(storage);
    assert.equal(recarregado.listar().length, 2);
    const alterada = recarregado.salvar({ ...campos, linguagem: "css", topico: "padding", topicoTitulo: "Padding", texto: "Espaçamento interno." }, primeira.id);
    assert.equal(alterada.criadoEm, primeira.criadoEm); assert.equal(alterada.linguagem, "css");
    recarregado.excluir(segunda.id);
    assert.equal(recarregado.listar().length, 1);
    assert.equal(memoria.get("taskflow.agenda.compromissos.v1"), "agenda preservada");
    assert.equal(memoria.get("taskflow.studio.projetos.v1"), "projetos preservados");
});
test("anotações: dados inválidos e falha de gravação não apagam o conteúdo existente", () => {
    const { memoria, storage, servico, campos } = iniciar();
    servico.salvar(campos); const original = memoria.get("taskflow.biblioteca.anotacoes.v1");
    assert.throws(() => servico.salvar({ ...campos, titulo: " " }));
    assert.equal(memoria.get("taskflow.biblioteca.anotacoes.v1"), original);
    storage.setItem = () => { throw new Error("quota"); };
    assert.throws(() => servico.salvar(campos), /anteriores foram mantidos/);
    assert.equal(memoria.get("taskflow.biblioteca.anotacoes.v1"), original);
    memoria.set("taskflow.biblioteca.anotacoes.v1", "dados ilegíveis");
    assert.throws(() => servico.salvar(campos), /preservados/);
    assert.equal(memoria.get("taskflow.biblioteca.anotacoes.v1"), "dados ilegíveis");
});
test("anotações: relê os registros antes de salvar para preservar inclusões de outra instância", () => {
    const { storage, servico, campos } = iniciar();
    const outra = criarServicoAnotacoes(storage, { gerarId: () => "outra-nota" });
    servico.salvar(campos); outra.salvar({ ...campos, titulo: "Outro tópico" });
    assert.equal(servico.listar().length, 2);
});
