import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { Elemento } from "../biblioteca/dom-simulado.mjs";

// Exercita os eventos reais da Agenda em DOM simulado, sem substituir QA visual.
function iniciar(dados = "[]", urlInicial = "https://taskflow.test/index.html") {
    const fonte = readFileSync(new URL("../../js/core/app.js", import.meta.url), "utf8");
    const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
    const elementos = new Map();
    const eventosDocumento = {}, eventosJanela = {};
    const entradas = [{ url: urlInicial, state: null }];
    let indice = 0;
    function elemento() {
        const e = new Elemento();
        const classes = new Set();
        e.classList = { add: (...nomes) => nomes.forEach(n => classes.add(n)), remove: (...nomes) => nomes.forEach(n => classes.delete(n)), contains: n => classes.has(n) };
        e.style = { setProperty() {}, removeProperty() {} };
        e.setCustomValidity = valor => { e.validacao = valor; };
        e.reportValidity = () => !e.validacao;
        e.closest = seletor => {
            if (seletor === "[data-taskflow-voltar]") return e.id === "biblioteca-voltar" ? e : null;
            if (seletor === "button[data-data]") return e.dataset.data ? e : null;
            if (seletor === "button[data-acao]") return e.dataset.acao ? e : null;
            return null;
        };
        return e;
    }
    for (const [, id] of html.matchAll(/\bid="([^"]+)"/g)) { const e = elemento(); e.id = id; elementos.set(`#${id}`, e); }
    const campos = ["titulo", "descricao", "data", "hora"].map(c => elementos.get(`#compromisso-${c}`));
    const formulario = elementos.get("#formulario-compromisso");
    formulario.reset = () => campos.forEach(c => { c.value = ""; });
    formulario.reportValidity = () => campos.every(c => !c.validacao);
    const armazenamento = new Map([["taskflow.agenda.compromissos.v1", dados]]);
    const document = {
        documentElement: elemento(),
        currentScript: { src: "https://taskflow.test/js/core/navegacao.js" }, referrer: "",
        querySelector: s => elementos.get(s), querySelectorAll: () => [],
        createElement: () => elemento(), addEventListener: (tipo, fn) => { (eventosDocumento[tipo] ??= []).push(fn); }
    };
    let id = 0;
    const contexto = vm.createContext({
        document, Date, URL, setTimeout, clearTimeout,
        sessionStorage: { getItem: () => null, removeItem() {}, setItem() {} },
        localStorage: { getItem: k => armazenamento.get(k) ?? null, setItem: (k, v) => armazenamento.set(k, v) },
        crypto: { randomUUID: () => `novo-${++id}` },
        window: {
            location: { get href() { return entradas[indice].url; }, replace(url) { entradas[indice] = { url, state: null }; } },
            history: {
                get length() { return entradas.length; }, get state() { return entradas[indice].state; },
                replaceState(state, _, url) { entradas[indice] = { url, state }; },
                pushState(state, _, url) { entradas.splice(indice + 1); entradas.push({ url, state }); indice++; },
                back() { if (indice) { indice--; for (const fn of eventosJanela.popstate || []) fn(); } }
            },
            matchMedia: () => ({ matches: true }), scrollY: 0, scrollTo() {}, confirm: () => true,
            addEventListener: (tipo, fn) => { (eventosJanela[tipo] ??= []).push(fn); }
        }
    });
    vm.runInContext(readFileSync(new URL("../../js/core/navegacao.js", import.meta.url), "utf8"), contexto);
    vm.runInContext(fonte, contexto);
    const obter = id => elementos.get(`#${id}`);
    const clicar = id => {
        const evento = { currentTarget: obter(id), target: obter(id), button: 0, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
        obter(id).disparar("click", evento);
        for (const fn of eventosDocumento.click || []) fn(evento);
    };
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
    return { obter, clicar, selecionar, acao, salvar, armazenamento, historico: contexto.window.history, location: contexto.window.location };
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

test("Biblioteca abre pelos dois acessos sem duplicar as views", () => {
    const a = iniciar();
    for (const acesso of ["abrir-biblioteca", "acessar-biblioteca"]) {
        a.clicar(acesso);
        assert.ok(a.obter("view-biblioteca").classList.contains("view-ativa"));
        assert.ok(a.obter("view-biblioteca").classList.contains("biblioteca-entrada"));
        assert.equal(a.obter("abrir-biblioteca").getAttribute("aria-current"), "page");
        assert.equal(a.obter("view-taskflow").classList.contains("view-ativa"), false);
        a.clicar("biblioteca-voltar");
        assert.ok(a.obter("view-home").classList.contains("view-ativa"));
        assert.equal(a.obter("view-biblioteca").classList.contains("view-ativa"), false);
    }
    a.clicar("abrir-home");
    assert.ok(a.obter("view-home").classList.contains("view-ativa"));
    assert.equal(a.obter("view-taskflow").classList.contains("view-ativa"), false);
});

test("cards da Home não direcionam nem abrem a Agenda", () => {
    const a = iniciar();
    const tamanho = a.historico.length;
    for (const id of ["home-explorar", "home-agenda", "home-carreira"]) {
        a.clicar(id);
        assert.ok(a.obter("view-home").classList.contains("view-ativa"));
        assert.equal(a.obter("painel-agenda").open, undefined);
        assert.equal(a.historico.length, tamanho);
    }
    const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
    const cards = html.match(/<div[^>]*class="home-guia-card"[^>]*>/g);
    assert.equal(cards.length, 4);
    for (const card of cards) assert.doesNotMatch(card, /href=|aria-haspopup=/);
});

test("Voltar restaura Biblioteca → TaskFlow → Home e modais não criam páginas", () => {
    const a = iniciar();
    a.clicar("abrir-taskflow");
    const tamanho = a.historico.length;
    a.clicar("abrir-agenda"); a.clicar("fechar-agenda");
    assert.equal(a.historico.length, tamanho);
    a.clicar("abrir-biblioteca");
    a.clicar("biblioteca-voltar");
    assert.ok(a.obter("view-taskflow").classList.contains("view-ativa"));
    a.historico.back();
    assert.ok(a.obter("view-home").classList.contains("view-ativa"));
});

test("favorito antigo da Carreira abre a página independente preservando parâmetros", () => {
    const a = iniciar("[]", "https://taskflow.test/index.html?origem=atalho#taskflow-carreira");
    assert.equal(a.location.href, "https://taskflow.test/pages/carreira.html?origem=atalho");
    assert.equal(a.historico.length, 1);
});

test("Agenda navega para 2027, indica feriados e fins de semana sem alterar compromissos", () => {
    const a = iniciar();
    for (let i = 0; i < new Date().getMonth(); i++) a.clicar("mes-anterior");
    const ano = a.obter("agenda-ano");
    ano.value = "2027";
    ano.disparar("change", { target: ano });
    assert.match(a.obter("agenda-mes").textContent, /2027/);
    const dias = a.obter("agenda-dias").children;
    const feriado = dias.find(e => e.dataset.data === "2027-01-01");
    assert.match(feriado.className, /agenda-feriado/);
    assert.match(feriado.getAttribute("aria-label"), /feriado nacional: Confraternização Universal/);
    assert.match(a.obter("agenda-feriados").textContent, /01\/01 — Confraternização Universal/);
    const sabado = dias.find(e => e.dataset.data === "2027-01-02");
    assert.match(sabado.className, /agenda-fim-semana/);
    assert.match(sabado.getAttribute("aria-label"), /fim de semana/);
    assert.doesNotMatch(sabado.className, /agenda-feriado/);
    for (let i = 0; i < 12; i++) a.clicar("mes-seguinte");
    assert.match(a.obter("agenda-mes").textContent, /2028/);
    a.clicar("mes-anterior"); assert.match(a.obter("agenda-mes").textContent, /2027/);
    ano.value = "0"; ano.disparar("change", { target: ano });
    assert.ok(ano.validacao);
    assert.match(a.obter("agenda-mes").textContent, /2027/);
    assert.equal(a.armazenamento.get("taskflow.agenda.compromissos.v1"), "[]");
});
