import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import process from "node:process";
import { conteudos as css } from "../../data/biblioteca/css/conteudos.js";
import { conteudos as html } from "../../data/biblioteca/html/conteudos.js";
import { conteudos as javascript } from "../../data/biblioteca/javascript/conteudos.js";

if (!vm.SourceTextModule) throw new Error("Use --experimental-vm-modules para validar os exemplos com os parsers existentes.");
const cache = JSON.parse(readFileSync(new URL("../studio/vendor/lezer-cache.json", import.meta.url), "utf8"));
const imports = JSON.parse(readFileSync(new URL("../../pages/studio.html", import.meta.url), "utf8").match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;
const contextoParser = vm.createContext({});
const modulos = new Map();
function get(url) {
    if (!modulos.has(url)) modulos.set(url, url === "https://esm.sh/node/process.mjs"
        ? new vm.SyntheticModule(["default"], function () { this.setExport("default", process); }, { context: contextoParser, identifier: url })
        : new vm.SourceTextModule(cache[url], { context: contextoParser, identifier: url }));
    return modulos.get(url);
}
const parsers = {};
for (const nome of ["css", "html"]) {
    const modulo = get(imports["@lezer/" + nome]);
    if (modulo.status === "unlinked") await modulo.link((s, ref) => get(imports[s] || new URL(s, ref.identifier).href));
    await modulo.evaluate(); parsers[nome] = modulo.namespace.parser;
}
const assuntos = css.niveis.flatMap(n => n.modulos.flatMap(m => m.assuntos));

test("estrutura CSS: 3 níveis, 10 módulos e 115 assuntos únicos", () => {
    assert.deepEqual(css.niveis.map(n => n.modulos.length), [3, 4, 3]);
    assert.deepEqual(css.niveis.flatMap(n => n.modulos.map(m => m.assuntos.length)), [10, 12, 10, 15, 10, 12, 12, 12, 11, 11]);
    assert.equal(assuntos.length, 115);
    assert.equal(new Set(assuntos.map(a => a.id)).size, 115);
});
for (const assunto of assuntos) {
    test("conteúdo e sintaxe: " + assunto.id, () => {
        for (const campo of ["titulo", "explicacao", "sintaxe", "exemploCodigo", "exemploHTML", "aplicacaoReal"]) assert(assunto[campo]?.length > (campo === "titulo" ? 0 : 10), campo);
        assert(assunto.responsabilidadeCodigo.length >= 2);
        assert(assunto.boasPraticas.length >= 2);
        assert(assunto.palavrasChave.length > 0);
        assert(!/em preparação|lorem ipsum/i.test(assunto.explicacao));
        assert(!/<script|\son\w+=/i.test(assunto.exemploHTML));
        for (const [linguagem, fonte] of [["css", assunto.exemploCodigo], ["html", assunto.exemploHTML]]) {
            const cursor = parsers[linguagem].parse(fonte).cursor();
            do { assert(!cursor.type.isError && cursor.name !== "MismatchedCloseTag", linguagem + ": " + fonte.slice(cursor.from, cursor.to)); } while (cursor.next());
        }
    });
}

// DOM simulado — verifica seleção, conteúdo, pesquisa e eventos sem alegar QA visual.
class Elemento {
    constructor(tag = "div") { this.tag = tag; this.attrs = {}; this.children = []; this.dataset = {}; this.eventos = {}; this.hidden = false; this.value = ""; this.texto = ""; }
    append(...itens) { this.children.push(...itens); }
    replaceChildren(...itens) { this.children = itens; }
    insertBefore(item, antes) { const i = this.children.indexOf(antes); this.children.splice(i < 0 ? this.children.length : i, 0, item); }
    setAttribute(k, v) { this.attrs[k] = v; }
    removeAttribute(k) { delete this.attrs[k]; }
    getAttribute(k) { return this.attrs[k] ?? null; }
    hasAttribute(k) { return k in this.attrs; }
    get attributes() { return Object.entries(this.attrs).map(([name, value]) => ({ name, value })); }
    addEventListener(k, fn) { (this.eventos[k] ??= []).push(fn); }
    disparar(k, e = {}) { for (const fn of this.eventos[k] || []) fn(e); }
    focus() { this.focado = true; }
    showModal() { this.open = true; }
    close() { this.open = false; this.disparar("close"); }
    set textContent(texto) { this.texto = texto; this.children = []; }
    get textContent() { return this.texto + this.children.map(c => c.textContent).join(""); }
    querySelectorAll(s) {
        const correspondencia = e => s === "*" || s.startsWith(".") ? s === "*" || e.className?.split(" ").includes(s.slice(1)) : s.startsWith("#") ? e.id === s.slice(1) : e.tag === s;
        return this.children.flatMap(e => [...(correspondencia(e) ? [e] : []), ...e.querySelectorAll(s)]);
    }
    querySelector(s) { return this.querySelectorAll(s)[0] || null; }
}
function iniciar(tecnologia) {
    const elementos = {};
    for (const id of ["biblioteca-menu", "biblioteca-alternar-menu", "biblioteca-niveis", "biblioteca-leitura", "biblioteca-estado-vazio", "biblioteca-titulo", "biblioteca-nivel", "biblioteca-vazio-titulo", "biblioteca-vazio-descricao", "biblioteca-pesquisar", "biblioteca-pesquisa", "biblioteca-pesquisa-campo", "biblioteca-pesquisa-resultados", "biblioteca-pesquisa-status", "biblioteca-pesquisa-formulario", "biblioteca-pesquisa-fechar"]) {
        elementos["#" + id] = new Elemento(); elementos["#" + id].id = id;
    }
    const pagina = new Elemento("main"); pagina.dataset.tecnologia = tecnologia;
    const nav = new Elemento("nav"); nav.className = "biblioteca-conteudos-navegacao"; nav.append(new Elemento("button"), new Elemento("button"));
    elementos["#biblioteca-leitura"].append(nav);
    elementos["#biblioteca-pesquisa"].append(...["campo", "resultados", "status", "formulario", "fechar"].map(id => elementos["#biblioteca-pesquisa-" + id]));
    const document = { body: new Elemento("body"), addEventListener() {}, querySelector: s => s === "main[data-tecnologia]" ? pagina : s === ".biblioteca-conteudos-navegacao" ? nav : elementos[s], createElement: tag => {
        const node = new Elemento(tag);
        if (tag === "template") { node.content = { querySelectorAll: () => [] }; node.innerHTML = ""; }
        return node;
    } };
    const mobile = { matches: false, addEventListener() {} };
    const ctx = vm.createContext({ document, window: { matchMedia: () => mobile }, navigator: { clipboard: { writeText: async () => {} } }, setTimeout: fn => { fn(); return 1; }, clearTimeout() {} });
    const fonte = readFileSync(new URL("../../js/biblioteca/biblioteca.js", import.meta.url), "utf8").replace(/iniciarBiblioteca\(\);\s*$/, "");
    vm.runInContext(fonte + ";globalThis.api={construirNiveis,selecionarAssunto,pesquisarAssuntos,iniciarPesquisa,destacarCSS,blocoCodigo};", ctx);
    ctx.api.construirNiveis(tecnologia === "css" ? css : tecnologia === "html" ? html : javascript);
    return { api: ctx.api, elementos, nav, mobile };
}

test("pesquisa CSS: sinônimos, acentos, parciais e relevância", () => {
    const { api } = iniciar("css");
    for (const [termo, id] of [["centralizar", "flexbox"], ["cor de fundo", "background"], ["espaçamento interno", "padding"], ["espacamento externo", "margin"], ["arredondar borda", "bordas"], ["responsivo", "media-queries"], ["colunas", "grid"], ["animação", "keyframes"], ["fixar elemento", "fixed"], ["VARIÁVEIS", "variaveis"], ["background-col", "background"]]) {
        assert.equal(api.pesquisarAssuntos(termo)[0]?.registro.assunto.id, id, termo);
    }
    assert.equal(api.pesquisarAssuntos("palavrainexistente").length, 0);
    assert.equal(api.pesquisarAssuntos("senha").length, 0);
});

test("navegação CSS simulada: 115 assuntos, prévias isoladas, anterior/próximo e pesquisa", () => {
    const { api, elementos, nav, mobile } = iniciar("css");
    assert.equal(elementos["#biblioteca-niveis"].querySelectorAll("details").length, 10);
    for (let i = 0; i < assuntos.length; i++) {
        api.selecionarAssunto(i);
        assert.equal(elementos["#biblioteca-titulo"].textContent, assuntos[i].titulo);
        assert.equal(nav.children[0].disabled, i === 0);
        assert.equal(nav.children[1].disabled, i === assuntos.length - 1);
        const frame = elementos["#biblioteca-leitura"].querySelector("iframe");
        assert.equal(frame.getAttribute("sandbox"), "");
        assert(frame.srcdoc.includes("script-src 'none'"));
        assert(frame.srcdoc.includes("prefers-reduced-motion"));
        assert(frame.srcdoc.includes(assuntos[i].exemploCodigo.replace(/</g, "\\3c ")));
    }
    api.iniciarPesquisa();
    elementos["#biblioteca-pesquisar"].disparar("click");
    elementos["#biblioteca-pesquisa-campo"].value = "padding";
    elementos["#biblioteca-pesquisa-campo"].disparar("input");
    const resultado = elementos["#biblioteca-pesquisa-resultados"].querySelector("button");
    mobile.matches = true; resultado.disparar("click");
    assert.equal(elementos["#biblioteca-titulo"].textContent, "Padding");
    assert.equal(elementos["#biblioteca-menu"].hidden, true);
    assert.equal(elementos["#biblioteca-pesquisa"].open, false);
    assert(elementos["#biblioteca-leitura"].focado);
});

test("tokens e regressão HTML/JavaScript: fontes e exemplos continuam textuais", () => {
    const { api } = iniciar("css");
    const codigo = '/* exemplo */ .alvo { color: #7c3aed; content: "<script>"; }';
    const destino = new Elemento(); api.destacarCSS(codigo, destino);
    assert.equal(destino.textContent, codigo);
    assert(destino.children.some(c => c.className === "biblioteca-token-comentario"));
    const bibliotecaHTML = iniciar("html"); bibliotecaHTML.api.selecionarAssunto(0);
    assert.equal(bibliotecaHTML.api.pesquisarAssuntos("senha")[0].registro.assunto.id, "tipos-input");
    assert.equal(bibliotecaHTML.elementos["#biblioteca-leitura"].querySelector("iframe").getAttribute("sandbox"), "");
    assert.equal(iniciar("javascript").elementos["#biblioteca-niveis"].querySelectorAll("button").length, 3);
});
