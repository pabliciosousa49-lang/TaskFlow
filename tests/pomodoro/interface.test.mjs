import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { Elemento } from "../biblioteca/dom-simulado.mjs";

// DOM simulado: testa eventos e contratos, sem alegar validação visual de navegador.
async function iniciar() {
    let agora = new Date(2026, 9, 19, 10).getTime(), confirmar = true;
    const fonteHTML = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
    const elementos = new Map(), intervalos = [], dados = new Map();
    function criar() {
        const e = new Elemento();
        const classes = new Set();
        e.classList = { add: c => classes.add(c), remove: c => classes.delete(c), toggle: (c, ativo) => ativo ? classes.add(c) : classes.delete(c) };
        e.style = { setProperty() {}, removeProperty() {} };
        e.setCustomValidity = v => { e.validacao = v; };
        e.reportValidity = () => !e.validacao;
        return e;
    }
    for (const [, id] of fonteHTML.matchAll(/\bid="([^"]+)"/g)) elementos.set(id, criar());
    const obter = id => elementos.get(id);
    const modos = ["foco", "curta", "longa", "personalizado"].map(modo => { const e = criar(); e.dataset.modo = modo; return e; });
    const abas = ["foco", "relogio", "estatisticas"].map(id => {
        const aba = obter(`pomodoro-aba-${id}`); aba.setAttribute("aria-controls", `pomodoro-tab-${id}`); return aba;
    });
    obter("pomodoro-painel").querySelectorAll = s => s === "[data-modo]" ? modos : abas;
    obter("pomodoro-ciclos").append(...Array.from({ length: 4 }, criar));
    const document = { getElementById: obter, documentElement: criar(), addEventListener() {} };
    class Relogio extends Date { constructor(...args) { super(...(args.length ? args : [agora])); } static now() { return agora; } }
    const contexto = vm.createContext({ document, Date: Relogio, window: {
        localStorage: { getItem: k => dados.get(k) ?? null, setItem: (k, v) => dados.set(k, v) },
        setInterval: fn => { intervalos.push(fn); }, addEventListener() {},
        confirm: () => confirmar, scrollY: 120, scrollTo() {}
    } });
    const motor = new vm.SourceTextModule(readFileSync(new URL("../../js/modules/pomodoro/temporizador.js", import.meta.url), "utf8"), { context: contexto });
    const ui = new vm.SourceTextModule(readFileSync(new URL("../../js/modules/pomodoro/pomodoro.js", import.meta.url), "utf8"), { context: contexto });
    await ui.link(() => motor); await ui.evaluate();
    return {
        obter, dados, modos, abas,
        clicar: id => obter(id).disparar("click"),
        avancar: ms => { agora += ms; intervalos.forEach(fn => fn()); },
        confirmar: valor => { confirmar = valor; }
    };
}

test("painel fecha sem parar o tempo, conclui em segundo plano e restaura foco", async () => {
    const a = await iniciar();
    a.clicar("abrir-pomodoro");
    assert.equal(a.obter("pomodoro-painel").open, true);
    assert.ok(a.obter("pomodoro-fechar").focado);
    a.clicar("pomodoro-iniciar"); a.avancar(10000);
    assert.equal(a.obter("pomodoro-tempo").textContent, "24:50");
    a.clicar("pomodoro-fechar");
    assert.ok(a.obter("abrir-pomodoro").focado);
    a.avancar(25 * 60000);
    assert.equal(a.obter("pomodoro-notificacao").hidden, false);
    assert.match(a.obter("pomodoro-notificacao").textContent, /concluído/);
    a.clicar("abrir-pomodoro");
    assert.equal(a.obter("pomodoro-tempo").textContent, "00:00");
    assert.equal(a.obter("pomodoro-focos").textContent, "1");
    a.avancar(10000); assert.equal(a.obter("pomodoro-focos").textContent, "1");
});

test("modalidades pedem confirmação, pausa conserva tempo e quatro focos recomendam pausa longa", async () => {
    const a = await iniciar(); a.clicar("abrir-pomodoro"); a.clicar("pomodoro-iniciar");
    a.avancar(1000); a.confirmar(false); a.modos[1].disparar("click");
    assert.equal(a.obter("pomodoro-modalidade").textContent, "Foco");
    a.clicar("pomodoro-iniciar"); a.avancar(60000);
    assert.equal(a.obter("pomodoro-tempo").textContent, "24:59");
    a.clicar("pomodoro-iniciar"); a.avancar(25 * 60000);
    for (let i = 0; i < 3; i++) { a.clicar("pomodoro-iniciar"); a.avancar(25 * 60000); }
    assert.match(a.obter("pomodoro-aviso").textContent, /pausa longa/);
    assert.equal(a.obter("pomodoro-focos").textContent, "4");
    assert.equal(a.obter("pomodoro-minutos-total").textContent, "100");
    a.confirmar(true); a.modos[1].disparar("click");
    a.clicar("pomodoro-iniciar"); a.avancar(5 * 60000);
    assert.equal(a.obter("pomodoro-pausas").textContent, "1");
    assert.equal(a.obter("pomodoro-focos").textContent, "4");
});

test("abas usam teclado, relógio real e foco personalizado valida e persiste duração", async () => {
    const a = await iniciar(); a.clicar("abrir-pomodoro");
    a.abas[0].disparar("keydown", { key: "ArrowRight", preventDefault() {} });
    assert.equal(a.abas[1].getAttribute("aria-selected"), "true");
    assert.equal(a.obter("pomodoro-tab-foco").hidden, true);
    assert.equal(a.obter("pomodoro-tab-relogio").hidden, false);
    const hora = a.obter("pomodoro-relogio").textContent; a.avancar(1000);
    assert.notEqual(a.obter("pomodoro-relogio").textContent, hora);
    assert.match(a.obter("pomodoro-data").textContent, /2026/);
    a.modos[3].disparar("click");
    const campo = a.obter("pomodoro-estudo"), pausa = a.obter("pomodoro-pausa"), form = a.obter("pomodoro-personalizado");
    campo.value = "0"; form.disparar("submit", { preventDefault() {} }); assert.ok(campo.validacao);
    campo.value = "0130"; campo.disparar("input", { target: campo });
    assert.equal(campo.value, "01:30");
    pausa.value = "00:10"; form.disparar("submit", { preventDefault() {} });
    assert.equal(a.obter("pomodoro-tempo").textContent, "01:30:00");
    const salvo = JSON.parse(a.dados.get("taskflow.pomodoro.v1"));
    assert.equal(salvo.personalizado, 90);
    assert.equal(salvo.pausa, 10);
    assert.equal(a.modos[1].hidden, true);
    assert.equal(a.modos[2].hidden, true);
    a.clicar("pomodoro-iniciar"); a.avancar(1000);
    a.clicar("pomodoro-recolher-campos");
    assert.equal(form.hidden, true);
    assert.equal(a.modos[3].getAttribute("aria-expanded"), "false");
    assert.ok(a.modos[3].focado);
    assert.equal(a.modos[1].hidden, true);
    a.avancar(1000);
    assert.equal(a.obter("pomodoro-tempo").textContent, "01:29:58");
    a.modos[3].disparar("click");
    assert.equal(form.hidden, false);
    assert.equal(a.modos[3].getAttribute("aria-expanded"), "true");
    assert.equal(campo.value, "01:30");
    assert.equal(pausa.value, "00:10");
    a.modos[0].disparar("click");
    assert.equal(a.modos[1].hidden, false);
    assert.equal(a.modos[2].hidden, false);
});

test("estudo personalizado prepara pausa configurada sem iniciá-la e contabiliza etapas separadas", async () => {
    const a = await iniciar(); a.clicar("abrir-pomodoro"); a.modos[3].disparar("click");
    const form = a.obter("pomodoro-personalizado");
    a.obter("pomodoro-estudo").value = "00:01";
    a.obter("pomodoro-pausa").value = "00:02";
    form.disparar("submit", { preventDefault() {} });
    a.clicar("pomodoro-iniciar"); a.avancar(60000);
    assert.equal(a.obter("pomodoro-focos").textContent, "1");
    assert.equal(a.obter("pomodoro-pausas").textContent, "0");
    assert.equal(a.obter("pomodoro-modalidade").textContent, "Pausa personalizada");
    assert.equal(a.obter("pomodoro-tempo").textContent, "00:02:00");
    assert.equal(a.obter("pomodoro-iniciar").textContent, "Iniciar pausa");
    a.avancar(180000);
    assert.equal(a.obter("pomodoro-tempo").textContent, "00:02:00");
    a.clicar("pomodoro-iniciar"); a.avancar(120000);
    assert.equal(a.obter("pomodoro-pausas").textContent, "1");
    assert.equal(a.obter("pomodoro-minutos-total").textContent, "1");
    assert.equal(a.obter("pomodoro-tempo").textContent, "00:01:00");
    assert.equal(a.obter("pomodoro-iniciar").textContent, "Iniciar estudo");
    a.clicar("pomodoro-iniciar"); a.avancar(1000); a.clicar("pomodoro-parar");
    assert.equal(a.obter("pomodoro-focos").textContent, "1");
});

test("pausa inválida não aplica a configuração ou interrompe a sessão ativa", async () => {
    const a = await iniciar(); a.clicar("abrir-pomodoro"); a.clicar("pomodoro-iniciar");
    a.modos[3].disparar("click"); a.obter("pomodoro-estudo").value = "01:00";
    a.obter("pomodoro-pausa").value = "00:00";
    a.obter("pomodoro-personalizado").disparar("submit", { preventDefault() {} });
    assert.ok(a.obter("pomodoro-pausa").validacao);
    a.avancar(1000);
    assert.equal(a.obter("pomodoro-modalidade").textContent, "Foco");
    assert.equal(a.obter("pomodoro-tempo").textContent, "24:59");
});


test("minimizar mantém o foco contando e restaurar preserva todas as funções do painel original", async () => {
    const a = await iniciar(); a.clicar("abrir-pomodoro"); a.clicar("pomodoro-iniciar"); a.avancar(60000);
    a.clicar("pomodoro-minimizar");
    assert.equal(a.obter("pomodoro-painel").open, false);
    assert.equal(a.obter("pomodoro-minimizado").hidden, false);
    assert.equal(a.obter("pomodoro-minimizado-tempo").textContent, "24:00");
    assert.equal(a.obter("pomodoro-minimizado-modo").textContent, "Foco");
    a.avancar(1000); assert.equal(a.obter("pomodoro-minimizado-tempo").textContent, "23:59");
    a.clicar("pomodoro-restaurar");
    assert.equal(a.obter("pomodoro-painel").open, true);
    assert.equal(a.obter("pomodoro-minimizado").hidden, true);
    assert.equal(a.obter("pomodoro-tempo").textContent, "23:59");
    a.abas[1].disparar("click"); assert.equal(a.obter("pomodoro-tab-relogio").hidden, false);
    a.abas[2].disparar("click"); assert.equal(a.obter("pomodoro-tab-estatisticas").hidden, false);
    a.abas[0].disparar("click"); a.modos[3].disparar("click");
    assert.equal(a.obter("pomodoro-personalizado").hidden, false);
    assert.equal(a.obter("pomodoro-estudo").value, "00:25");
    assert.equal(a.obter("pomodoro-pausa").value, "00:05");
});

for (const [indice, tempo] of [[1, "04:59"], [2, "14:59"]]) test(`pausa ${indice} mantém tempo visível ao minimizar`, async () => {
    const a = await iniciar(); a.clicar("abrir-pomodoro"); a.modos[indice].disparar("click");
    a.clicar("pomodoro-iniciar"); a.clicar("pomodoro-minimizar"); a.avancar(1000);
    assert.equal(a.obter("pomodoro-minimizado-tempo").textContent, tempo);
    assert.equal(a.obter("pomodoro-minimizado-modo").textContent, indice === 1 ? "Pausa curta" : "Pausa longa");
    a.clicar("pomodoro-restaurar"); a.clicar("pomodoro-iniciar"); a.clicar("pomodoro-minimizar"); a.avancar(60000);
    assert.equal(a.obter("pomodoro-minimizado-tempo").textContent, tempo);
    assert.equal(a.obter("pomodoro-minimizado-status").textContent, "Pausado");
});

test("descanso personalizado conta somente após iniciar e continua ao minimizar", async () => {
    const a = await iniciar(); a.clicar("abrir-pomodoro"); a.modos[3].disparar("click");
    a.obter("pomodoro-estudo").value = "00:01"; a.obter("pomodoro-pausa").value = "00:02";
    a.obter("pomodoro-personalizado").disparar("submit", { preventDefault() {} });
    a.clicar("pomodoro-iniciar"); a.clicar("pomodoro-minimizar"); a.avancar(60000);
    assert.equal(a.obter("pomodoro-minimizado-modo").textContent, "Pausa personalizada");
    assert.equal(a.obter("pomodoro-minimizado-tempo").textContent, "00:02:00");
    a.avancar(60000); assert.equal(a.obter("pomodoro-minimizado-tempo").textContent, "00:02:00");
    a.clicar("pomodoro-restaurar"); assert.equal(a.obter("pomodoro-personalizado").hidden, false);
    a.clicar("pomodoro-iniciar"); a.clicar("pomodoro-minimizar"); a.avancar(1000);
    assert.equal(a.obter("pomodoro-minimizado-tempo").textContent, "00:01:59");
    a.clicar("pomodoro-restaurar"); assert.equal(a.obter("pomodoro-focos").textContent, "1");
    assert.equal(a.obter("pomodoro-pausas").textContent, "0");
});
