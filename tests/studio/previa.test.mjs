import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import process from "node:process";
import vm from "node:vm";
import { webcrypto } from "node:crypto";
import { codigoNavegacaoPrevia } from "../../js/modules/studio/navegacao-previa.js";

// Parsers já usados pelo editor, copiados para os testes offline com versões fixadas.
const cachePath = new URL("./vendor/lezer-cache.json", import.meta.url);
if (!vm.SourceTextModule) throw new Error("Execute: node --experimental-vm-modules --test tests/studio/*.test.mjs");
const arquivos = JSON.parse(readFileSync(new URL("./fixtures/projeto-previa.json", import.meta.url), "utf8"));
const decode = url => Buffer.from(url.split(",")[1].split("#")[0], "base64").toString("utf8");

class Elemento {
    constructor(nome, attrs = {}, texto = "", abertura = false) {
        this.localName = nome; this.attrs = { ...attrs }; this.textContent = texto;
        this.namespaceURI = "http://www.w3.org/1999/xhtml"; this.abertura = abertura; this.children = [];
    }
    getAttribute(nome) { return this.attrs[nome] ?? null; }
    hasAttribute(nome) { return nome in this.attrs; }
    setAttribute(nome, valor) { this.attrs[nome] = valor; }
    removeAttribute(nome) { delete this.attrs[nome]; }
    remove() { this.removido = true; }
    get attributes() { return Object.entries(this.attrs).map(([name, value]) => ({ name, value })); }
    append(item) { this.children.push(item); }
    replaceChildren() { this.children = []; }
    get outerHTML() {
        const attr = Object.entries(this.attrs).map(([k, v]) => ` ${k}="${v.replaceAll('"', '&quot;')}"`).join("");
        return `<${this.localName}${attr}>` + (this.abertura ? "" : this.textContent + `</${this.localName}>`);
    }
}
class Template {
    set innerHTML(codigo) {
        this.codigo = codigo; this.nodes = [];
        const tokens = /<(script|style)\b([^>]*?)>([\s\S]*?)<\/\1\s*>|<([a-z][\w-]*)\b([^>]*?)\/?\s*>/gi;
        for (const match of codigo.matchAll(tokens)) {
            const attrs = {};
            for (const attr of (match[2] || match[5] || "").matchAll(/([\w-]+)(?:="([^"]*)")?/g)) attrs[attr[1]] = attr[2] ?? "";
            const node = new Elemento(match[1] || match[4], attrs, match[3] || "", !match[1]);
            node.original = match[0]; this.nodes.push(node);
        }
        this.content = { querySelectorAll: () => this.nodes };
    }
    get innerHTML() {
        let html = this.codigo;
        for (const node of this.nodes) html = html.replace(node.original, node.removido ? "" : node.outerHTML);
        return html;
    }
}

async function carregar() {
    const cache = JSON.parse(readFileSync(cachePath, "utf8"));
    const imports = JSON.parse(readFileSync(new URL("../../pages/studio.html", import.meta.url), "utf8").match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;
    const eventos = new Map();
    const contexto = vm.createContext({ console, TextEncoder, btoa, crypto: webcrypto,
        document: { createElement: nome => nome === "template" ? new Template() : new Elemento(nome) },
        window: { addEventListener: (nome, fn) => eventos.set(nome, fn) },
        setTimeout: fn => { contexto.timer = fn; return 1; }, clearTimeout: () => {} });
    const modulos = new Map();
    function get(url) {
        if (!modulos.has(url)) {
            // No Node, usa a API nativa em lugar do polyfill de process para browsers.
            if (url === "https://esm.sh/node/process.mjs") {
                const nativo = new vm.SyntheticModule(["default"], function () { this.setExport("default", process); }, { context: contexto, identifier: url });
                modulos.set(url, nativo); return nativo;
            }
            const codigo = url.startsWith("file:") ? readFileSync(new URL(url), "utf8") : cache[url];
            if (!codigo) throw new Error("Módulo ausente no cache: " + url);
            modulos.set(url, new vm.SourceTextModule(codigo, { context: contexto, identifier: url }));
        }
        return modulos.get(url);
    }
    const modulo = get(new URL("../../js/modules/studio/previa.js", import.meta.url).href);
    await modulo.link((s, ref) => get(imports[s] || new URL(s, ref.identifier).href));
    await modulo.evaluate();
    const recursos = get(new URL("../../js/modules/studio/recursos-previa.js", import.meta.url).href).namespace;
    return { api: modulo.namespace, recursos, contexto, eventos };
}

test("recursos: CSS, SVG, imports, comentários, ciclos e diagnósticos", async () => {
    const { recursos } = await carregar();
    const erros = [];
    const montagem = recursos.criarRecursosPrevia(arquivos, erros);
    const css = montagem.css(arquivos.find(a => a.caminho === "css/style.css").conteudo, "css/style.css");
    assert(css.includes('url("data:image/svg+xml'));
    assert(css.startsWith('@import "data:text/css'));
    assert.equal(erros.length, 0);
    const chave = montagem.modulo(arquivos.find(a => a.caminho === "js/app.js").conteudo, "js/app.js");
    assert(decode(montagem.imports[chave]).includes('from "taskflow:/js/modules/login.js"'));
    assert(montagem.imports["taskflow:/js/modules/login.js"]);
    assert.equal(erros.length, 0);
    const comentarios = '/* url(fake.svg) */ p {content:"url(fake.svg)"}';
    assert.equal(montagem.css(comentarios, "css/style.css"), comentarios);
    montagem.css('a {background:url(https://site.test/a.svg)}', "css/style.css");
    assert(erros.some(e => e.includes("Recursos externos")));
    const locais = [
        { tipo: "arquivo", caminho: "a.js", conteudo: 'export { b } from "./b.js";' },
        { tipo: "arquivo", caminho: "b.js", conteudo: 'export const b=1; import "./a.js";' },
        { tipo: "arquivo", caminho: "x.css", conteudo: '@import "./x.css";' }
    ];
    const errosCiclo = [], ciclo = recursos.criarRecursosPrevia(locais, errosCiclo);
    ciclo.modulo(locais[0].conteudo, "a.js");
    assert(decode(ciclo.imports["taskflow:/a.js"]).includes('from "taskflow:/b.js"'));
    assert.equal(Object.keys(ciclo.imports).length, 2);
    ciclo.css(locais[2].conteudo, "x.css");
    assert(errosCiclo.some(e => e.includes("circular")));
    assert.throws(() => montagem.imagem("logo.png", "index.html"), /Arquivo não encontrado/);
});

test("montagem simulada: links, scripts, módulo inline, imagem e segurança", async () => {
    const { api } = await carregar();
    const login = arquivos.find(a => a.caminho === "pages/login.html");
    const result = api.montarDocumentoPrevia(login.conteudo, arquivos, login.caminho, "canal-teste");
    assert.equal(result.diagnosticos.length, 0);
    assert(result.documento.includes('data-taskflow-destino="/pages/dashboard.html?origem=link#resultado"'));
    assert(result.documento.includes('type="importmap" nonce="canal-teste"'));
    assert(result.documento.includes("connect-src 'none'"));
    assert(result.documento.includes("script-src-attr 'none'"));
    const raiz = api.montarDocumentoPrevia(arquivos[0].conteudo, arquivos, "index.html", "canal-teste");
    assert(raiz.documento.includes('src="data:image/svg+xml'));
    const inline = api.montarDocumentoPrevia('<script type="module">const a=1;</script><script type="module">const b=2;</script>', [], "index.html", "canal-teste");
    assert(inline.documento.includes("inline-0") && inline.documento.includes("inline-1"));
});

test("execução dos módulos transformados: click, input e submit", async () => {
    const { recursos } = await carregar();
    const erros = [], montagem = recursos.criarRecursosPrevia(arquivos, erros);
    const chave = montagem.modulo(arquivos.find(a => a.caminho === "js/app.js").conteudo, "js/app.js");
    const elementos = Object.fromEntries(["status", "nome", "ir", "form"].map(id => ["#" + id, {
        textContent: "", eventos: {}, addEventListener(tipo, fn) { this.eventos[tipo] = fn; }
    }]));
    let destino;
    const contexto = vm.createContext({ document: { querySelector: id => elementos[id] }, TaskFlow: { navegar: ref => { destino = ref; } } });
    const modulos = new Map();
    function get(key) {
        if (!modulos.has(key)) modulos.set(key, new vm.SourceTextModule(decode(montagem.imports[key]), { context: contexto, identifier: key }));
        return modulos.get(key);
    }
    const modulo = get(chave);
    await modulo.link(get); await modulo.evaluate();
    assert.equal(erros.length, 0);
    assert.equal(elementos["#status"].textContent, "Módulo carregado");
    elementos["#nome"].eventos.input({ target: { value: "Ana" } });
    assert.equal(elementos["#status"].textContent, "Nome: Ana");
    elementos["#ir"].eventos.click(); assert.equal(destino, "./dashboard.html?origem=js#resultado");
    let cancelado = false;
    elementos["#form"].eventos.submit({ preventDefault() { cancelado = true; } });
    assert(cancelado); assert.equal(elementos["#status"].textContent, "Submit funcionou");
});

test("navegação simulada: origem, canal, histórico, atualização e erros", async () => {
    const { api, contexto, eventos } = await carregar();
    const frame = new Elemento("iframe"); frame.contentWindow = {};
    const painel = new Elemento("div"), vazia = new Elemento("div");
    const previa = api.criarPreviaHTML(frame, vazia, painel);
    previa.agendar(arquivos[0].conteudo, arquivos, "index.html", "projeto"); contexto.timer();
    assert.equal(frame.getAttribute("sandbox"), "allow-scripts");
    function canal() { return frame.srcdoc.match(/nonce-([^']+)/)[1]; }
    function mensagem(tipo, referencia, extra = {}) {
        eventos.get("message")({ source: frame.contentWindow, origin: "null", data: { tipo, referencia, canal: canal() }, ...extra });
    }
    const primeiro = frame.srcdoc;
    mensagem("navegar", "pages/login.html", { origin: "https://invasor.test" }); assert.equal(frame.srcdoc, primeiro);
    mensagem("navegar", "pages/login.html", { source: {} }); assert.equal(frame.srcdoc, primeiro);
    mensagem("navegar", "pages/login.html", { data: { tipo: "navegar", referencia: "pages/login.html", canal: "antigo" } }); assert.equal(frame.srcdoc, primeiro);
    mensagem("navegar", "pages/login.html"); assert(frame.srcdoc.includes("Login de teste"));
    mensagem("navegar", "./dashboard.html?origem=teste#resultado"); assert(frame.srcdoc.includes("Dashboard"));
    const dashboard = frame.srcdoc;
    const novos = arquivos.map(a => a.caminho === "css/style.css" ? { ...a, conteudo: "body{color:red}" } : a);
    previa.agendar(arquivos[0].conteudo, novos, "index.html", "projeto"); contexto.timer();
    assert(frame.srcdoc.includes("Dashboard")); assert(frame.srcdoc.includes("body{color:red}"));
    const antes = frame.srcdoc;
    mensagem("navegar", "../../fora.html"); assert.equal(frame.srcdoc, antes); assert(!painel.hidden);
    mensagem("voltar"); assert(frame.srcdoc.includes("Login de teste"));
    mensagem("voltar"); assert(frame.srcdoc.includes("Projeto de teste"));
    previa.agendar(arquivos[0].conteudo, arquivos, "index.html", "outro-projeto"); contexto.timer();
    mensagem("voltar"); assert(frame.srcdoc.includes("Projeto de teste"));
    assert.notEqual(dashboard, primeiro);
});

test("ponte: API explícita, clique e respeito a submit já cancelado", () => {
    const handlers = {}, enviados = [];
    const contexto = vm.createContext({ parent: { postMessage: msg => enviados.push(msg) }, window: {},
        document: { addEventListener: (tipo, fn) => handlers[tipo] = fn },
        URLSearchParams, FormData, console });
    contexto.window.addEventListener = () => {};
    vm.runInContext(codigoNavegacaoPrevia("canal", "pages/login.html?usuario=1#titulo"), contexto);
    contexto.window.TaskFlow.navegar("./dashboard.html");
    assert.equal(enviados[0].referencia, "./dashboard.html");
    assert.equal(contexto.window.TaskFlow.consulta, "?usuario=1");
    let prevenido = false;
    handlers.click({ target: { closest: () => ({ dataset: { taskflowDestino: "/index.html" } }) }, defaultPrevented: false, preventDefault() { prevenido = true; } });
    assert(prevenido); assert.equal(enviados[1].referencia, "/index.html");
    const anterior = enviados.length;
    handlers.submit({ defaultPrevented: true }); assert.equal(enviados.length, anterior);
});

test("regressão: arquivos idênticos têm estados independentes e reimportações compartilham estado", async () => {
    const { recursos } = await carregar();
    const fonte = "export const estado = { contador: 0 };";
    const locais = ["a.js", "b.js"].map(caminho => ({ tipo: "arquivo", caminho, conteudo: fonte }));
    const erros = [], montagem = recursos.criarRecursosPrevia(locais, erros);
    const a = montagem.modulo(fonte, "a.js"), b = montagem.modulo(fonte, "b.js");
    assert.notEqual(montagem.imports[a], montagem.imports[b]);
    assert.equal(montagem.modulo(fonte, "a.js"), a);
    // Loader real do Node: identifica módulos pela URL completa, incluindo fragmento.
    const moduloA = await import(montagem.imports[a]);
    const moduloB = await import(montagem.imports[b]);
    moduloA.estado.contador++;
    assert.equal(moduloB.estado.contador, 0);
    assert.equal((await import(montagem.imports[a])).estado, moduloA.estado);
    assert.equal((await import(montagem.imports[a])).estado.contador, 1);
    assert.equal(decode(montagem.imports[a]), fonte);
    assert.equal(erros.length, 0);
});

test("regressão: imports equivalentes reutilizam o módulo e consultas diferentes não colidem", async () => {
    const { recursos } = await carregar();
    const locais = [
        { tipo: "arquivo", caminho: "js/estado.js", conteudo: "export const estado = {};" },
        { tipo: "arquivo", caminho: "js/app.js", conteudo: 'import "./estado.js"; import "../js/estado.js"; import "./estado.js?v=2";' }
    ];
    const erros = [], montagem = recursos.criarRecursosPrevia(locais, erros);
    const raiz = montagem.modulo(locais[1].conteudo, "js/app.js");
    const referencias = [...decode(montagem.imports[raiz]).matchAll(/import "([^"]+)"/g)].map(m => m[1]);
    assert.equal(referencias[0], referencias[1]);
    assert.notEqual(montagem.imports[referencias[0]], montagem.imports[referencias[2]]);
    assert.equal(erros.length, 0);
});

const referenciasCSS = [
    ['p {background:url("./lo\\67o.svg")}', "css/logo.svg"],
    ['p {background:url(./lo\\67o.svg)}', "css/logo.svg"],
    ['p {background:url("./lo\\000067o.svg")}', "css/logo.svg"],
    ['p {background:url("./lo\\67 o.svg")}', "css/logo.svg"],
    ['p {background:url("./lo\\67\to.svg")}', "css/logo.svg"],
    ["p {background:url('./lo\\67o.svg')}", "css/logo.svg"],
    ['p {background:url("./lo\\\ngo.svg")}', "css/logo.svg"],
    ['p {background:url("./lo\\\r\ngo.svg")}', "css/logo.svg"],
    ['p {background:url("./logo\\ .svg")}', "css/logo .svg"],
    ['p {background:url(./logo\\(1\\).svg)}', "css/logo(1).svg"],
    ['p {background:url("../assets/\\e1.svg")}', "assets/á.svg"],
    ['p {background:url("./\\0.svg")}', "css/�.svg"],
    ['p {background:url("./\\D800.svg")}', "css/�.svg"],
    ['p {background:url("./\\110000.svg")}', "css/�.svg"]
];
for (const [codigo, caminho] of referenciasCSS) {
    test("escape CSS: " + JSON.stringify(codigo), async () => {
        const { recursos } = await carregar();
        const erros = [], montagem = recursos.criarRecursosPrevia([
            { tipo: "arquivo", caminho, conteudo: '<svg xmlns="http://www.w3.org/2000/svg"/>' }
        ], erros);
        const resultado = montagem.css(codigo, "css/style.css");
        assert(resultado.includes("data:image/svg+xml"));
        assert.equal(erros.length, 0);
    });
}

for (const codigo of ['@import "./ba\\73 e.css";', '@import url("./ba\\73 e.css");', '@import url(./ba\\73 e.css);']) {
    test("escape CSS em @import: " + codigo, async () => {
        const { recursos } = await carregar();
        const erros = [], montagem = recursos.criarRecursosPrevia([
            { tipo: "arquivo", caminho: "css/base.css", conteudo: "body {color: purple}" }
        ], erros);
        assert(montagem.css(codigo, "css/style.css").includes("data:text/css"));
        assert.equal(erros.length, 0);
    });
}
