import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { Elemento } from "../biblioteca/dom-simulado.mjs";

// Exercita os eventos reais da Agenda em DOM simulado, sem substituir QA visual.
function iniciar(dados = "[]") {
    const fonte = readFileSync(new URL("../../js/core/app.js", import.meta.url), "utf8");
    const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
    const elementos = new Map();
    function elemento() {
        const e = new Elemento();
        e.classList = { add() {}, remove() {} };
        e.style = { setProperty() {}, removeProperty() {} };
        e.setCustomValidity = valor => { e.validacao = valor; };
        e.closest = () => e;
        return e;
    }
    for (const [, id] of html.matchAll(/\bid="([^"]+)"/g)) elementos.set(`#${id}`, elemento());
    const campos = ["titulo", "descricao", "data", "hora"].map(c => elementos.get(`#compromisso-${c}`));
    const formulario = elementos.get("#formulario-compromisso");
    formulario.reset = () => campos.forEach(c => { c.value = ""; });
    formulario.reportValidity = () => campos.every(c => !c.validacao);
    const armazenamento = new Map([["taskflow.agenda.compromissos.v1", dados]]);
    const document = {
        documentElement: elemento(),
        querySelector: s => elementos.get(s), querySelectorAll: () => [],
        createElement: () => elemento(), addEventListener() {}
    };
    let id = 0;
    const contexto = vm.createContext({
        document, Date, setTimeout, clearTimeout,
        localStorage: { getItem: k => armazenamento.get(k) ?? null, setItem: (k, v) => armazenamento.set(k, v) },
        crypto: { randomUUID: () => `novo-${++id}` },
        window: { matchMedia: () => ({ matches: true }), scrollY: 0, scrollTo() {}, confirm: () => true, addEventListener() {} }
    });
    vm.runInContext(fonte, contexto);
    const obter = id => elementos.get(`#${id}`);
    const clicar = id => obter(id).disparar("click", { currentTarget: obter(id), preventDefault() {} });
    const selecionar = data => {
        const alvo = elemento(); alvo.dataset.data = data;
        obter("agenda-dias").disparar("click", { target: alvo });
    };
    const acao = (acao, id) => {
        const alvo = elemento(); alvo.dataset = { acao, id };
        obter("lista-compromissos").disparar("click", { target: alvo });
    };
    const salvar = (titulo, data, hora = "10:00") => {
        obter("compromisso-titulo").value = titulo;
        obter("compromisso-data").value = data;
        obter("compromisso-hora").value = hora;
        formulario.disparar("submit", { preventDefault() {} });
    };
    return { obter, clicar, selecionar, acao, salvar, armazenamento };
}

test("Agenda filtra por dia, atualiza quantidade e preserva marcadores e navegação mensal", () => {
    const hoje = new Date();
    const data = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
    const registros = [
        { id: "a", titulo: "Hoje", descricao: "", data, hora: "09:00" },
        { id: "b", titulo: "Outra data", descricao: "", data: "2040-02-01", hora: "08:00" }
    ];
    const a = iniciar(JSON.stringify(registros));
    assert.equal(a.obter("agenda-quantidade").textContent, "1 compromisso");
    assert.match(a.obter("lista-compromissos").textContent, /Hoje/);
    assert.doesNotMatch(a.obter("lista-compromissos").textContent, /Outra data/);
    const dia = a.obter("agenda-dias").children.find(e => e.dataset.data === data);
    assert.equal(dia.getAttribute("aria-current"), "date");
    assert.equal(dia.getAttribute("aria-pressed"), "true");
    assert.match(dia.className, /com-compromisso/);
    const mes = a.obter("agenda-mes").textContent;
    a.clicar("mes-seguinte"); assert.notEqual(a.obter("agenda-mes").textContent, mes);
    a.clicar("mes-anterior"); assert.equal(a.obter("agenda-mes").textContent, mes);
    a.selecionar("2040-02-02");
    assert.equal(a.obter("agenda-quantidade").textContent, "0 compromissos");
    assert.equal(a.obter("lista-compromissos").textContent, "Nenhum compromisso para este dia.");
    assert.equal(a.obter("formulario-compromisso").hidden, false);
});

test("Agenda mantém abertura, cadastro, edição, cancelamento, exclusão e persistência", () => {
    const a = iniciar();
    a.clicar("abrir-agenda"); assert.equal(a.obter("painel-agenda").open, true);
    a.selecionar("2040-02-02");
    a.salvar("Estudar CSS", "2040-02-02");
    a.salvar("Estudar HTML", "2040-02-02", "11:00");
    assert.equal(a.obter("agenda-quantidade").textContent, "2 compromissos");
    const chave = "taskflow.agenda.compromissos.v1";
    const recarregada = iniciar(a.armazenamento.get(chave)); recarregada.selecionar("2040-02-02");
    assert.equal(recarregada.obter("agenda-quantidade").textContent, "2 compromissos");
    a.acao("editar", "novo-1"); assert.equal(a.obter("compromisso-titulo").value, "Estudar CSS");
    a.salvar("Revisar CSS", "2040-02-03");
    assert.equal(a.obter("agenda-quantidade").textContent, "1 compromisso");
    a.acao("editar", "novo-1"); a.clicar("cancelar-compromisso");
    assert.equal(a.obter("formulario-compromisso").hidden, true);
    a.acao("excluir", "novo-1");
    assert.equal(a.obter("agenda-quantidade").textContent, "0 compromissos");
    assert.equal(JSON.parse(a.armazenamento.get(chave)).length, 1);
    a.clicar("fechar-agenda"); assert.equal(a.obter("painel-agenda").open, false);
    assert.equal(a.obter("abrir-agenda").focado, true);
});

test("Agenda rejeita campos inválidos e preserva armazenamento ilegível", () => {
    const a = iniciar(); a.selecionar("2040-02-02");
    a.salvar(" ", "2040-02-30", "25:00");
    assert.equal(a.armazenamento.get("taskflow.agenda.compromissos.v1"), "[]");
    assert.ok(a.obter("compromisso-data").validacao);
    const bloqueada = iniciar("dados ilegíveis");
    assert.equal(bloqueada.obter("salvar-compromisso").disabled, true);
    bloqueada.salvar("Estudar", "2040-02-02");
    assert.equal(bloqueada.armazenamento.get("taskflow.agenda.compromissos.v1"), "dados ilegíveis");
});
