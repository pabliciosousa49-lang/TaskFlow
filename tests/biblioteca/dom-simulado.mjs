import { readFileSync } from "node:fs";
import vm from "node:vm";
import { conteudos as css } from "../../data/biblioteca/css/conteudos.js";
import { conteudos as html } from "../../data/biblioteca/html/conteudos.js";
import { conteudos as javascript } from "../../data/biblioteca/javascript/conteudos.js";
import { conteudos as typescript } from "../../data/biblioteca/typescript/conteudos.js";
import { conteudos as react } from "../../data/biblioteca/react/conteudos.js";

// DOM simulado — verifica seleção, conteúdo, pesquisa e eventos sem alegar QA visual.
export class Elemento {
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
    focus(opcoes) { this.focado = true; this.opcoesFoco = opcoes; }
    scrollIntoView(opcoes) { this.ultimaRolagem = opcoes; this.rolagens = (this.rolagens || 0) + 1; }
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
export function iniciar(tecnologia) {
    const copias = [];
    const elementos = {};
    for (const id of ["biblioteca-html-breadcrumb", "biblioteca-menu", "biblioteca-alternar-menu", "biblioteca-niveis", "biblioteca-leitura", "biblioteca-estado-vazio", "biblioteca-titulo", "biblioteca-nivel", "biblioteca-vazio-titulo", "biblioteca-vazio-descricao", "biblioteca-pesquisa", "biblioteca-pesquisa-campo", "biblioteca-pesquisa-resultados", "biblioteca-pesquisa-status", "biblioteca-pesquisa-formulario", "biblioteca-pesquisa-limpar"]) {
        elementos["#" + id] = new Elemento(); elementos["#" + id].id = id;
    }
    const pagina = new Elemento("main"); pagina.dataset.tecnologia = tecnologia;
    const nav = new Elemento("nav"); nav.className = "biblioteca-conteudos-navegacao"; nav.append(new Elemento("button"), new Elemento("button"));
    elementos["#biblioteca-leitura"].append(nav);
    elementos["#biblioteca-pesquisa"].append(...["campo", "resultados", "status", "formulario", "limpar"].map(id => elementos["#biblioteca-pesquisa-" + id]));
    const document = { body: new Elemento("body"), addEventListener() {}, querySelector: s => s === "main[data-tecnologia]" ? pagina : s === ".biblioteca-conteudos-navegacao" ? nav : elementos[s], createElement: tag => {
        const node = new Elemento(tag);
        if (tag === "template") { node.content = { querySelectorAll: () => [] }; node.innerHTML = ""; }
        return node;
    } };
    const mobile = { matches: false, addEventListener() {} };
    const ctx = vm.createContext({ document, window: { matchMedia: () => mobile }, navigator: { clipboard: { writeText: async texto => { copias.push(texto); } } }, setTimeout: fn => { fn(); return 1; }, clearTimeout() {} });
    const fonte = readFileSync(new URL("../../js/biblioteca/biblioteca.js", import.meta.url), "utf8").replace(/iniciarBiblioteca\(\);\s*$/, "");
    vm.runInContext(fonte + ";globalThis.api={construirNiveis,selecionarAssunto,pesquisarAssuntos,iniciarPesquisa,destacarCSS,destacarScript,blocoCodigo};", ctx);
    ctx.api.construirNiveis({ css, html, javascript, typescript, react }[tecnologia]);
    return { api: ctx.api, elementos, nav, mobile, copias };
}

