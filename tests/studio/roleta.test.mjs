import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function preparar() {
    class Elemento {
        constructor() { this.style = {}; this.dataset = {}; this.listeners = {}; this.children = []; this.hidden = false; this.attrs = {}; this.textContent = ''; }
        append(...itens) { this.children.push(...itens); }
        setAttribute(k, v) { this.attrs[k] = v; }
        addEventListener(k, fn) { (this.listeners[k] ??= []).push(fn); }
        emitir(k, dados = {}) { for (const fn of this.listeners[k] ?? []) fn({ type: k, ...dados }); }
        getBoundingClientRect() { leituras++; return { width: 400, top: 0, left: 0 }; }
        setPointerCapture() {}
        focus() {}
    }
    let leituras = 0, id = 0, agora = 0;
    const frames = new Map(), raiz = new Elemento(), circulo = new Elemento(), painel = new Elemento(), alternar = new Elemento(), indicador = new Elemento(), ambiente = new Elemento(), janela = new Elemento();
    raiz.querySelector = seletor => ({ '.studio-roleta-circulo': circulo, '#studio-roleta-painel': painel, '#studio-roleta-alternar': alternar, '#studio-roleta-indicador': indicador })[seletor];
    const source = readFileSync(new URL('../../js/modules/studio/roleta.js', import.meta.url), 'utf8').replace(/^import .*;\r?\n/gm, '').replace('export function', 'function');
    let aberturas = 0;
    vm.runInNewContext(source + '\niniciarRoleta(raiz, {});', {
        raiz, window: Object.assign(janela, { matchMedia: () => ({ matches: false }) }),
        document: { createElement: () => new Elemento(), querySelector: () => ambiente, addEventListener() {}, body: { classList: { add() {}, remove() {} } } },
        tecnologias: Array.from({ length: 8 }, (_, n) => ({ id: String(n), nome: String(n), icone: '', grupo: '' })),
        criarPainelDocumentacao: () => () => aberturas++, MutationObserver: class { observe() {} },
        requestAnimationFrame: fn => { frames.set(++id, fn); return id; }, cancelAnimationFrame: n => frames.delete(n), performance: { now: () => agora }
    });
    const evento = (graus, tempo) => ({ isPrimary: true, pointerType: 'touch', pointerId: 1, clientX: 200 - 160 * Math.cos(graus * Math.PI / 180), clientY: 200 + 160 * Math.sin(graus * Math.PI / 180), timeStamp: tempo });
    return { circulo, janela, frames, evento, leituras: () => leituras, tick() { agora += 16; const atuais = [...frames.values()]; frames.clear(); atuais.forEach(fn => fn(agora)); } };
}

test('roleta: agrupa movimentos sem recalcular dimensões ou recortes e preserva a geometria', () => {
    const p = preparar(), recortes = p.circulo.children.map(b => b.style.clipPath);
    p.circulo.emitir('pointerdown', p.evento(0, 0));
    for (let n = 1; n <= 10; n++) p.circulo.emitir('pointermove', p.evento(n * 3, n * 5));
    assert.equal(p.frames.size, 1);
    assert.equal(p.leituras(), 1);
    p.tick();
    assert.match(p.circulo.children[0].style.transform, /rotate\(-30/);
    assert.deepEqual(p.circulo.children.map(b => b.style.clipPath), recortes);
    assert.equal(p.leituras(), 1);
    p.janela.emitir('pointercancel', p.evento(30, 60));
    for (let i = 0; i < 30; i++) p.tick();
    assert.equal(p.frames.size, 0);
});

test('roleta: soltar fora do círculo encerra gesto; pausa antes de soltar elimina inércia antiga', () => {
    const p = preparar();
    p.circulo.emitir('pointerdown', p.evento(0, 0));
    p.circulo.emitir('pointermove', p.evento(30, 10));
    p.janela.emitir('pointerup', p.evento(30, 200));
    p.tick();
    assert.match(p.circulo.children[0].style.transform, /rotate\(-30/);
    for (let i = 0; i < 40; i++) p.tick();
    assert.equal(p.frames.size, 0);
    p.circulo.emitir('pointermove', p.evento(90, 300));
    assert.equal(p.frames.size, 0);
});
