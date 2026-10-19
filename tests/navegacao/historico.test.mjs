import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

const raiz = "https://exemplo.test/TaskFlow/";
const fonte = readFileSync(new URL("../../js/core/navegacao.js", import.meta.url), "utf8");
function iniciar({ urls = [raiz + "index.html"], estado = null, referrer = "", memoria = new Map(), nativa = false } = {}) {
    const entradas = urls.map((url, indice) => ({ url, state: indice === urls.length - 1 ? estado : null }));
    let indice = entradas.length - 1, retornos = 0;
    const eventos = {};
    const history = {
        get length() { return entradas.length; }, get state() { return entradas[indice].state; },
        pushState(state, _, url) { entradas.splice(indice + 1); entradas.push({ url, state }); indice++; },
        replaceState(state, _, url) { entradas[indice] = { url, state }; },
        back() { retornos++; if (indice) indice--; }
    };
    const window = {
        history,
        location: { get href() { return entradas[indice].url; }, replace(url) { entradas[indice] = { url, state: null }; } }
    };
    if (nativa) window.navigation = {
        entries: () => entradas.map((e, i) => ({ url: e.url, key: String(i), index: i })),
        get currentEntry() { return { key: String(indice), index: indice }; }
    };
    const document = { currentScript: { src: raiz + "js/core/navegacao.js" }, referrer, addEventListener: (tipo, fn) => { eventos[tipo] = fn; } };
    const contexto = vm.createContext({ window, document, Date, URL,
        sessionStorage: { getItem: k => memoria.get(k) ?? null, removeItem: k => memoria.delete(k), setItem: (k, v) => memoria.set(k, v) }
    });
    vm.runInContext(fonte, contexto);
    return {
        api: window.taskflowNavegacao, window, entradas, memoria,
        get retornos() { return retornos; },
        clicar(href, opcoes = {}) {
            const link = { href, target: opcoes.target || "", hasAttribute: () => false };
            const { target, ...eventoOpcoes } = opcoes;
            eventos.click({ target: { closest: seletor => seletor === "a[href]" ? link : null }, button: 0, defaultPrevented: false, ...eventoOpcoes });
        }
    };
}

test("histórico nativo retorna CSS → HTML preservando parâmetros e fragmento", () => {
    const html = raiz + "pages/biblioteca/html.html?origem=guia#exemplo";
    const css = raiz + "pages/biblioteca/css.html?tema=azul";
    const a = iniciar({ urls: [raiz + "index.html", html, css], nativa: true });
    a.api.voltar();
    assert.equal(a.window.location.href, html);
    assert.equal(a.retornos, 1);
});

test("retorno externo, outro projeto na mesma origem e entrada direta usam Home sem empilhar", () => {
    for (const anterior of ["https://externo.test/", "https://exemplo.test/outro/index.html", raiz + "pages/desconhecida.html"]) {
        const a = iniciar({ urls: [anterior, raiz + "pages/biblioteca/css.html"], nativa: true });
        a.api.voltar();
        assert.equal(a.retornos, 0);
        assert.equal(a.window.location.href, raiz + "index.html");
        assert.equal(a.entradas.length, 2);
    }
    const direta = iniciar({ urls: [raiz + "pages/biblioteca/html.html"] }); direta.api.voltar();
    assert.equal(direta.window.location.href, raiz + "index.html");
    assert.equal(direta.entradas.length, 1);
});

test("Navigation API não pula entradas externas omitidas da lista", () => {
    const a = iniciar({ urls: [raiz + "index.html", "https://externo.test/", raiz + "pages/studio.html"], nativa: true });
    const listar = a.window.navigation.entries;
    a.window.navigation.entries = () => listar().filter(e => e.index !== 1);
    a.api.voltar();
    assert.equal(a.retornos, 0);
    assert.equal(a.window.location.href, raiz + "index.html");
});

test("abas usam pushState sem pilha paralela, sem duplicar e sem perder a query", () => {
    const a = iniciar({ urls: [raiz + "index.html?origem=curso"] });
    a.api.registrarView("view-taskflow");
    a.api.registrarView("view-taskflow");
    assert.equal(a.entradas.length, 2);
    assert.equal(a.window.location.href, raiz + "index.html?origem=curso#view-taskflow");
    a.api.registrarView("view-biblioteca", "taskflow-carreira");
    a.api.registrarView("view-biblioteca");
    a.api.voltar();
    assert.equal(a.api.viewAtual().alvo, "taskflow-carreira");
    a.api.voltar(); assert.equal(a.api.viewAtual().id, "view-taskflow");
    a.api.voltar(); assert.equal(a.api.viewAtual().id, "view-home");
});

test("sem Navigation API, transição comprovada entre documentos permite retorno e recarga", () => {
    const html = raiz + "pages/biblioteca/html.html?a=1", css = raiz + "pages/biblioteca/css.html?b=2";
    const origem = iniciar({ urls: [html] }); origem.clicar(css);
    const destino = iniciar({ urls: [html, css], referrer: html, memoria: origem.memoria });
    assert.equal(destino.memoria.size, 0);
    const recarga = iniciar({ urls: [html, css], estado: destino.window.history.state });
    recarga.api.voltar();
    assert.equal(recarga.window.location.href, html);
});

test("referrer interno sozinho não autoriza retorno em nova aba ou transição não comprovada", () => {
    const a = iniciar({ urls: ["https://externo.test/", raiz + "pages/biblioteca/css.html"], referrer: raiz + "pages/biblioteca/html.html" });
    a.api.voltar();
    assert.equal(a.retornos, 0);
    assert.equal(a.window.location.href, raiz + "index.html");
});

test("modais, âncoras locais, links externos e novas abas não criam provas de transição", () => {
    const a = iniciar();
    a.clicar(raiz + "index.html#painel-agenda", { defaultPrevented: true });
    a.clicar(raiz + "index.html#taskflow-areas");
    a.clicar("https://externo.test/");
    a.clicar(raiz + "pages/studio.html", { ctrlKey: true });
    a.clicar(raiz + "pages/studio.html", { target: "_blank" });
    assert.equal(a.memoria.size, 0);
    assert.equal(a.entradas.length, 1);
});

test("URLs iniciais reabrem Biblioteca, Carreira e TaskFlow sem criar entradas", () => {
    for (const [hash, id, alvo] of [["#view-biblioteca", "view-biblioteca", null], ["#taskflow-carreira", "view-biblioteca", "taskflow-carreira"], ["#view-taskflow", "view-taskflow", null]]) {
        const a = iniciar({ urls: [raiz + "index.html?v=2" + hash] });
        assert.equal(a.api.viewAtual().id, id); assert.equal(a.api.viewAtual().alvo, alvo);
        assert.equal(a.entradas.length, 1);
    }
});
