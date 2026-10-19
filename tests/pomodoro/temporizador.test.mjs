import test from "node:test";
import assert from "node:assert/strict";
import { criarTemporizador, criarArmazenamento, dataLocal, lerDuracao, apresentarDuracao } from "../../js/modules/pomodoro/temporizador.js";

test("contagem usa prazo real e conclui uma única vez após suspensão da atualização", () => {
    let agora = 10000; const concluidas = [];
    const timer = criarTemporizador({ agora: () => agora, aoConcluir: s => concluidas.push(s) });
    timer.iniciar(); agora += 90000;
    assert.equal(timer.atualizar().restante, 1410000);
    agora += 2000000;
    assert.equal(timer.atualizar().estado, "concluido");
    assert.equal(timer.atualizar().restante, 0);
    assert.equal(concluidas.length, 1);
    assert.equal(concluidas[0].termino, 1510000);
});

test("pausar conserva restante; continuar não conta o intervalo de pausa", () => {
    let agora = 0;
    const timer = criarTemporizador({ agora: () => agora });
    timer.iniciar(); agora += 10000; timer.pausar();
    agora += 600000;
    assert.equal(timer.atualizar().restante, 1490000);
    timer.iniciar(); agora += 1000;
    assert.equal(timer.atualizar().restante, 1489000);
    assert.equal(timer.consultar().estado, "executando");
});

test("reiniciar e parar não contabilizam sessões incompletas e respeitam modalidades", () => {
    let agora = 0, conclusoes = 0;
    const timer = criarTemporizador({ agora: () => agora, aoConcluir: () => conclusoes++ });
    for (const [modo, minutos] of [["curta", 5], ["longa", 15], ["personalizado", 37], ["foco", 25]]) {
        timer.selecionar(modo, minutos); timer.iniciar(); agora += 1000;
        timer.atualizar(); timer.reiniciar();
        assert.equal(timer.consultar().restante, minutos * 60000);
        assert.equal(timer.consultar().estado, "inicial");
        timer.iniciar(); agora += 1000; timer.parar();
        assert.equal(timer.consultar().restante, minutos * 60000);
    }
    assert.equal(conclusoes, 0);
    assert.throws(() => timer.selecionar("inexistente"));
    for (const minutos of [0, 1440, 1.5, NaN]) assert.throws(() => timer.selecionar("personalizado", minutos));
});

function armazenamento() {
    const valores = new Map();
    return { valores, getItem: k => valores.get(k) ?? null, setItem: (k, v) => valores.set(k, v) };
}

test("preferência e estatísticas persistem; pausas não somam foco", () => {
    const storage = armazenamento(); const r = criarArmazenamento(storage);
    const termino = new Date(2026, 9, 19, 12).getTime();
    r.configurar(37);
    r.concluir({ foco: true, minutos: 37, termino });
    r.concluir({ foco: false, minutos: 5, termino });
    const recarregado = criarArmazenamento(storage);
    assert.equal(recarregado.personalizado, 37);
    assert.deepEqual(recarregado.dia(dataLocal(termino)), { focos: 1, minutos: 37, pausas: 1 });
});

test("conclusão após meia-noite usa a data local do prazo, mesmo com atualização atrasada", () => {
    const storage = armazenamento(), r = criarArmazenamento(storage);
    let agora = new Date(2026, 9, 19, 23, 50).getTime();
    const timer = criarTemporizador({ agora: () => agora, aoConcluir: s => r.concluir(s) });
    timer.selecionar("curta"); timer.iniciar();
    agora += 20 * 60000; timer.atualizar();
    assert.equal(r.dia("2026-10-19").pausas, 1);
    assert.equal(r.dia("2026-10-20").pausas, 0);
});

test("dados ilegíveis e falha de gravação preservam registros anteriores", () => {
    const storage = armazenamento(); storage.valores.set("taskflow.pomodoro.v1", "registro ilegível");
    const r = criarArmazenamento(storage);
    r.concluir({ foco: true, minutos: 25, termino: Date.now() });
    assert.equal(storage.valores.get("taskflow.pomodoro.v1"), "registro ilegível");
    assert.match(r.aviso, /preservado/);
    const bloqueado = criarArmazenamento({ getItem: () => null, setItem() { throw new Error("Quota"); } });
    bloqueado.concluir({ foco: true, minutos: 25, termino: Date.now() });
    assert.equal(bloqueado.dia(dataLocal(Date.now())).focos, 1);
    assert.match(bloqueado.aviso, /memória/);
});

test("durações HH:MM validam horas e minutos e preservam configurações anteriores", () => {
    assert.equal(lerDuracao("01:30"), 90);
    assert.equal(lerDuracao("23:59"), 1439);
    assert.equal(apresentarDuracao(90), "01:30");
    for (const valor of ["00:00", "24:00", "01:60", "1:30", "-1:00", "abc"]) assert.equal(lerDuracao(valor), null);
    const storage = armazenamento();
    storage.valores.set("taskflow.pomodoro.v1", JSON.stringify({ versao: 1, personalizado: 40, dias: { "2026-10-19": { focos: 2, minutos: 50, pausas: 1 } } }));
    const r = criarArmazenamento(storage);
    assert.equal(r.personalizado, 40); assert.equal(r.pausa, 5);
    assert.equal(r.dia("2026-10-19").focos, 2);
    assert.equal(r.configurar(90, 10), true);
    assert.equal(r.configurar(90, 0), false);
    const recarregado = criarArmazenamento(storage);
    assert.equal(recarregado.personalizado, 90); assert.equal(recarregado.pausa, 10);
    assert.equal(recarregado.dia("2026-10-19").focos, 2);
});
