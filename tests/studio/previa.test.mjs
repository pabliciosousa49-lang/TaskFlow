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

test("regressão: submit respeita handlers do document, GET e bloqueio POST", () => {
    const documento = {}, janela = {}, mensagens = [];
    class DadosFormulario {
        constructor(form) { this.valores = [...form.valores]; }
        append(nome, valor) { this.valores.push([nome, valor]); }
        [Symbol.iterator]() { return this.valores[Symbol.iterator](); }
    }
    const contexto = vm.createContext({
        parent: { postMessage: msg => mensagens.push(msg) },
        window: { addEventListener: (tipo, fn) => janela[tipo] = fn },
        document: { addEventListener: (tipo, fn) => documento[tipo] = fn },
        FormData: DadosFormulario, URLSearchParams, console: { ...console }
    });
    vm.runInContext(codigoNavegacaoPrevia("canal", "pages/login.html"), contexto);
    assert.equal(documento.submit, undefined, "a ponte não antecipa handlers delegados no document");
    assert.equal(typeof janela.submit, "function");
    const form = { dataset: { taskflowAction: "./dash.html#inicio" }, valores: [["email", "teste@example.com"]], getAttribute: () => "get" };
    const evento = () => ({ target: form, defaultPrevented: false,
        submitter: { name: "acao", value: "entrar" }, preventDefault() { this.defaultPrevented = true; } });
    documento.submit = event => { event.preventDefault(); contexto.window.TaskFlow.definirDestino("./dash.html"); };
    const cancelado = evento(); documento.submit(cancelado); janela.submit(cancelado);
    assert.equal(mensagens.length, 1, "preventDefault não cria uma segunda navegação automática");
    assert.equal(mensagens[0].referencia, "./dash.html");
    const padrao = evento(); janela.submit(padrao);
    assert(padrao.defaultPrevented);
    assert.equal(mensagens[1].referencia, "./dash.html?email=teste%40example.com&acao=entrar#inicio");
    form.getAttribute = () => "post";
    janela.submit(evento());
    assert.equal(mensagens[2].tipo, "erro");
    assert(mensagens[2].referencia.includes("POST"));
});

test("regressão: formulários conservam CSP de envio e demais restrições", async () => {
    const pagina = readFileSync(new URL("../../pages/studio.html", import.meta.url), "utf8");
    const sandbox = pagina.match(/<iframe[^>]*id="studio-previa-iframe"[^>]*sandbox="([^"]+)"/)[1];
    assert.equal(sandbox, "allow-scripts allow-forms");
    const { api } = await carregar();
    const { documento } = api.montarDocumentoPrevia('<form action="https://externo.test" method="post"><input type="email" required><button type="submit">Entrar</button></form>');
    assert(documento.includes("form-action 'none'"));
    assert(documento.includes("connect-src 'none'"));
    assert(documento.includes("frame-src 'none'"));
    assert(documento.includes("base-uri 'none'"));
    assert(documento.includes('type="email" required=""'));
    assert(documento.includes('type="submit"'));
    assert(!documento.includes('<form action="https://externo.test"'));
});

async function executarNavegacao(codigo, extras = {}) {
    const { recursos } = await carregar();
    const diagnosticos = [], mensagens = [], handlers = {};
    const montagem = recursos.criarRecursosPrevia(extras.arquivos || [], diagnosticos);
    const chave = montagem.modulo(codigo, "js/script.js");
    const contexto = vm.createContext({ ...extras.globais, parent: { postMessage: msg => mensagens.push(msg) },
        document: extras.document || { addEventListener: (tipo, fn) => handlers[tipo] = fn },
        console: { ...console }, URLSearchParams, FormData });
    contexto.window = contexto;
    contexto.addEventListener = () => {};
    vm.runInContext(codigoNavegacaoPrevia("canal", "pages/index.html"), contexto);
    const modulos = new Map();
    function get(key) {
        if (!modulos.has(key)) modulos.set(key, new vm.SourceTextModule(decode(montagem.imports[key]), { context: contexto, identifier: key }));
        return modulos.get(key);
    }
    if (extras.modulo) { const principal = get(chave); await principal.link(get); await principal.evaluate(); }
    else vm.runInContext(decode(montagem.imports[chave]), contexto);
    return { mensagens, contexto, diagnosticos, transformado: decode(montagem.imports[chave]), montagem };
}

for (const [codigo, tipo] of [
    ['window.location.href = "./dash.html";', "navegar"],
    ['window.location.assign("./pasta/dash.html?origem=login#inicio");', "navegar"],
    ['window.location.replace("../dash.html");', "substituir"]
]) {
    test("navegação JavaScript convencional: " + codigo, async () => {
        const resultado = await executarNavegacao(codigo);
        assert.equal(resultado.mensagens.length, 1);
        assert.equal(resultado.mensagens[0].tipo, tipo);
        assert.equal(resultado.mensagens[0].referencia, codigo.match(/"([^"]+)"/)[1]);
        assert.equal(resultado.diagnosticos.length, 0);
    });
}

test("navegação: expressões executam uma vez, na ordem e preservam valores de retorno", async () => {
    const { contexto, mensagens } = await executarNavegacao(`
        let chamadas = 0;
        const proximo = () => (++chamadas, "./dash.html");
        const objeto = { toString() { chamadas++; return "/dash.html"; } };
        window.resultado = window.location.href = objeto;
        window.atribuido = window.location.assign(proximo(), chamadas++);
        window.substituido = window.location.replace(proximo());
        window.contador = chamadas;
        window.mesmoObjeto = window.resultado === objeto;
    `);
    assert.equal(contexto.contador, 4);
    assert.equal(contexto.mesmoObjeto, true);
    assert.equal(contexto.atribuido, undefined);
    assert.equal(contexto.substituido, undefined);
    assert.deepEqual(mensagens.map(m => m.referencia), ["/dash.html", "./dash.html", "./dash.html"]);
});

test("navegação: strings, comentários, nomes semelhantes e window local são preservados", async () => {
    const codigo = `
        const texto = 'window.location.href = "fake.html"';
        // window.location.assign("fake.html");
        const outro = { location: { href: "" } }; outro.location.href = "local";
        function teste(window) { window.location.href = "parametro"; }
        teste(outro);
        { const window = outro; window.location.href = "bloco"; }
        function comVar() { window.location.href = "var"; var window = outro; }
        function destruturado({ window }) { window.location.replace("local"); }
        window.location.assign("./dash.html");
    `;
    const { mensagens, transformado } = await executarNavegacao(codigo);
    assert.equal(mensagens.length, 1);
    assert.equal(mensagens[0].referencia, "./dash.html");
    assert(transformado.includes(`const texto = 'window.location.href = "fake.html"'`));
    assert(transformado.includes('// window.location.assign("fake.html");'));
    assert(transformado.includes('window.location.href = "parametro"'));
    assert(transformado.includes('window.location.href = "bloco"'));
    assert(transformado.includes('window.location.href = "var"'));
    assert(transformado.includes('window.location.replace("local")'));
});

for (const fonte of [
    'import window from "./local.js"; window.location.href = "local";',
    'const { window } = local; window.location.assign("local");',
    'try {} catch(window) { window.location.replace("local"); }',
    'const f = window => window.location.assign("local");',
    'const \\u0077indow = local; window.location.assign("local");',
    'import { window } from "./local.js"; window.location.replace("local");'
]) {
    test("navegação: bindings locais não são reescritos: " + fonte, async () => {
        const { recursos } = await carregar();
        const montagem = recursos.criarRecursosPrevia([], []);
        const chave = montagem.modulo(fonte, "script.js");
        assert(!decode(montagem.imports[chave]).includes("window.TaskFlow"));
    });
}

test("navegação: comentários e imports dentro de expressões permanecem válidos", async () => {
    const { contexto, mensagens, transformado } = await executarNavegacao(`
        let contador = 0;
        window.retorno = window.location.href = /* destino calculado */ (++contador, "./dash.html");
        window.location.assign(/* manter comentário */ "../index.html");
        window.vezes = contador;
    `);
    assert.equal(contexto.vezes, 1);
    assert.equal(contexto.retorno, "./dash.html");
    assert.equal(mensagens.length, 2);
    assert(transformado.includes("/* destino calculado */"));
    assert(transformado.includes("/* manter comentário */"));
    const { recursos } = await carregar();
    const montagem = recursos.criarRecursosPrevia([
        { tipo: "arquivo", caminho: "js/destino.js", conteudo: 'export const destino="./dash.html";' }
    ], []);
    const codigo = decode(montagem.imports[montagem.modulo('window.location.href = (await import("./destino.js")).destino;', "js/script.js")]);
    assert(codigo.includes('import("taskflow:/js/destino.js")'));
    assert(codigo.includes('window.TaskFlow.definirDestino'));
    assert.doesNotThrow(() => new vm.SourceTextModule(codigo));
});

test("navegação: formas ambíguas ficam intactas e escopos dinâmicos são diagnosticados", async () => {
    const { recursos } = await carregar();
    for (const fonte of ['eval("var window"); window.location.href = "a.html";',
        'with (obj) { window.location.assign("a.html"); }', 'window.location.href = ;']) {
        const diagnosticos = [], montagem = recursos.criarRecursosPrevia([], diagnosticos);
        const chave = montagem.modulo(fonte, "script.js");
        assert.equal(decode(montagem.imports[chave]), fonte);
        assert(diagnosticos.some(m => m.includes("não adaptada")));
    }
    const fonte = 'const loc = window.location; loc.assign("a.html"); window["location"].href="a.html";';
    const montagem = recursos.criarRecursosPrevia([], []);
    assert.equal(decode(montagem.imports[montagem.modulo(fonte, "script.js")]), fonte);
});

test("navegação: módulos e imports relativos preservam identidade e usam a ponte", async () => {
    const locais = [{ tipo: "arquivo", caminho: "js/destino.js", conteudo: 'export const destino = "../dash.html?q=1#titulo";' }];
    const { mensagens, diagnosticos, montagem } = await executarNavegacao(
        'import { destino } from "./destino.js"; window.location.href = destino;', { modulo: true, arquivos: locais });
    assert.equal(mensagens[0].referencia, "../dash.html?q=1#titulo");
    assert.equal(diagnosticos.length, 0);
    assert(montagem.imports["taskflow:/js/destino.js"]);
});

test("navegação: login por submit e click mantêm listeners e preventDefault", async () => {
    const listeners = {};
    const document = { addEventListener() {}, querySelector: () => ({ addEventListener: (tipo, fn) => listeners[tipo] = fn }) };
    const { mensagens } = await executarNavegacao(`
        const formulario = document.querySelector("#loginForm");
        formulario.addEventListener("submit", event => { event.preventDefault(); window.location.href = "./dash.html"; });
        formulario.addEventListener("click", () => window.location.assign("/dash.html"));
    `, { document });
    let cancelado = false;
    listeners.submit({ preventDefault() { cancelado = true; } }); listeners.click();
    assert(cancelado);
    assert.deepEqual(mensagens.map(m => m.referencia), ["./dash.html", "/dash.html"]);
});

test("navegação: histórico distingue assign e replace, valida destinos e isola projetos", async () => {
    const { api, contexto, eventos } = await carregar();
    const frame = new Elemento("iframe"); frame.contentWindow = {};
    const painel = new Elemento("div"); let estado;
    const previa = api.criarPreviaHTML(frame, new Elemento("div"), painel, { aoEstado: valor => estado = valor });
    const locais = [
        { tipo: "arquivo", caminho: "index.html", conteudo: "<h1>Início</h1>" },
        { tipo: "arquivo", caminho: "pages/login.html", conteudo: "<h1>Login</h1>" },
        { tipo: "arquivo", caminho: "pages/dash.html", conteudo: '<h1>Dashboard</h1><link rel="stylesheet" href="../style.css"><script src="../script.js" defer></script>' },
        { tipo: "arquivo", caminho: "style.css", conteudo: "h1{color:cyan}" },
        { tipo: "arquivo", caminho: "script.js", conteudo: "window.carregado = true;" }
    ];
    const originais = JSON.stringify(locais);
    previa.agendar(locais[0].conteudo, locais, "index.html", "p"); contexto.timer();
    function mensagem(tipo, referencia, extra = {}) {
        eventos.get("message")({ source: frame.contentWindow, origin: "null", data: {
            tipo, referencia, canal: frame.srcdoc.match(/nonce-([^']+)/)[1], ...extra
        } });
    }
    mensagem("navegar", "./pages/login.html");
    mensagem("substituir", "./dash.html?q=1#titulo");
    assert.equal(estado.caminho, "/pages/dash.html?q=1#titulo");
    assert(frame.srcdoc.includes("h1{color:cyan}"));
    assert([...frame.srcdoc.matchAll(/src="(data:text\/javascript[^\"]+)"/g)].some(m => decode(m[1]).includes("window.carregado = true")));
    mensagem("voltar"); assert.equal(estado.caminho, "/index.html");
    mensagem("navegar", "/pages/login.html");
    mensagem("navegar", "./dash.html");
    mensagem("voltar"); assert.equal(estado.caminho, "/pages/login.html");
    mensagem("navegar", "../index.html"); assert.equal(estado.caminho, "/index.html");
    const antes = frame.srcdoc;
    for (const referencia of ["https://externo.test/a.html", "//externo.test/a.html", "../fora.html", "/inexistente.html", "/style.css", "javascript:alert(1)"]) {
        mensagem("substituir", referencia); assert.equal(frame.srcdoc, antes);
    }
    mensagem("substituir", 42); assert.equal(frame.srcdoc, antes);
    mensagem("substituir", "/pages/dash.html", { canal: "invalido" }); assert.equal(frame.srcdoc, antes);
    previa.agendar(locais[0].conteudo, locais, "index.html", "outro"); contexto.timer();
    mensagem("voltar"); assert.equal(estado.caminho, "/index.html");
    assert.equal(JSON.stringify(locais), originais);
    assert.equal(frame.getAttribute("sandbox"), "allow-scripts allow-forms");
    assert(frame.srcdoc.includes("connect-src 'none'"));
});

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

test("regressão: HTML preenchido após entrada vazia volta a renderizar automaticamente", async () => {
    const { api, contexto } = await carregar();
    const frame = new Elemento("iframe"), vazia = new Elemento("div"), estados = [];
    const previa = api.criarPreviaHTML(frame, vazia, null, { aoEstado: estado => estados.push(estado) });
    const itens = [{ tipo: "arquivo", caminho: "index.html", conteudo: "" }];
    previa.agendar("", itens, "index.html", "projeto"); contexto.timer();
    assert.equal(frame.hidden, true);
    assert.equal(estados.at(-1).caminho, "");
    previa.agendar("<h1>HTML preenchido</h1>", itens, "index.html", "projeto"); contexto.timer();
    assert.equal(frame.hidden, false);
    assert.equal(vazia.hidden, true);
    assert.equal(estados.at(-1).caminho, "/index.html");
    assert(frame.srcdoc.includes("HTML preenchido"));
});

test("regressão: limpar e reescrever HTML recupera prévia manual, CSS/JS relativos e reabertura", async () => {
    const { api, contexto } = await carregar();
    const frame = new Elemento("iframe"), vazia = new Elemento("div"), estados = [];
    const previa = api.criarPreviaHTML(frame, vazia, null, { aoEstado: estado => estados.push(estado) });
    const html = '<link rel="stylesheet" href="../css/style.css"><h1 id="resultado">Inicial</h1><script src="../js/script.js"></script>';
    const itens = [
        { tipo: "arquivo", caminho: "pages/index.html", conteudo: html },
        { tipo: "arquivo", caminho: "css/style.css", conteudo: "h1{color:orange}" },
        { tipo: "arquivo", caminho: "js/script.js", conteudo: 'document.querySelector("#resultado").textContent="JS executado";' }
    ];
    previa.agendar(html, itens, "pages/index.html", "projeto"); contexto.timer();
    assert.equal(frame.hidden, false);
    previa.agendar("", itens, "pages/index.html", "projeto"); contexto.timer();
    assert.equal(frame.hidden, true);
    previa.definirAutomatica(false);
    previa.agendar(html, itens, "pages/index.html", "projeto");
    assert.equal(frame.hidden, true, "no modo manual, aguarda Atualizar prévia");
    previa.atualizar();
    assert.equal(frame.hidden, false);
    assert.equal(estados.at(-1).caminho, "/pages/index.html");
    assert(frame.srcdoc.includes("h1{color:orange}"));
    const script = [...frame.srcdoc.matchAll(/<script src="([^"]+)"/g)].map(m => decode(m[1])).find(codigo => codigo.includes('"JS executado"'));
    assert(script, "script conectado incorporado ao documento");
    const resultado = { textContent: "Inicial" };
    vm.runInNewContext(script, { document: { querySelector: () => resultado } });
    assert.equal(resultado.textContent, "JS executado");
    const editados = itens.map(item => item.caminho === "css/style.css" ? { ...item, conteudo: "h1{color:cyan}" } : item);
    previa.agendar(html, editados, "pages/index.html", "projeto"); previa.atualizar();
    assert(frame.srcdoc.includes("h1{color:cyan}"));
    assert.equal(frame.getAttribute("sandbox"), "allow-scripts allow-forms");
    assert(frame.srcdoc.includes("connect-src 'none'"));
    const reaberto = new Elemento("iframe");
    const outraPrevia = api.criarPreviaHTML(reaberto, new Elemento("div"), null);
    outraPrevia.agendar(html, editados, "pages/index.html", "projeto"); contexto.timer();
    assert.equal(reaberto.hidden, false);
    assert(reaberto.srcdoc.includes("h1{color:cyan}"));
});

test("navegação simulada: origem, canal, histórico, atualização e erros", async () => {
    const { api, contexto, eventos } = await carregar();
    const frame = new Elemento("iframe"); frame.contentWindow = {};
    const painel = new Elemento("div"), vazia = new Elemento("div");
    const previa = api.criarPreviaHTML(frame, vazia, painel);
    previa.agendar(arquivos[0].conteudo, arquivos, "index.html", "projeto"); contexto.timer();
    assert.equal(frame.getAttribute("sandbox"), "allow-scripts allow-forms");
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
        URLSearchParams, FormData, console: { ...console } });
    contexto.window.addEventListener = (tipo, fn) => { if (tipo === "submit") handlers.submit = fn; };
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

test("MVP: preserva dataset, autocomplete e acessibilidade, sem aceitar atributos internos ou inline", async () => {
    const { api } = await carregar();
    const { documento } = api.montarDocumentoPrevia('<button data-acao="salvar" data-taskflow-destino="/falso.html" aria-label="Salvar" onclick="alert(1)">Salvar</button><input autocomplete="name" inputmode="text" tabindex="0">', [], 'index.html', 'teste');
    assert(documento.includes('data-acao="salvar"'));
    assert(documento.includes('autocomplete="name"'));
    assert(documento.includes('aria-label="Salvar"'));
    assert(!documento.includes('data-taskflow-destino="/falso.html"'));
    assert(!documento.includes('onclick="alert'));
    assert(documento.includes("script-src-attr 'none'"));
});
test("MVP: prévia manual mantém a execução aplicada e usa os dados mais recentes ao atualizar", async () => {
    const { api, contexto, eventos } = await carregar();
    const frame = new Elemento('iframe'); frame.contentWindow = {};
    const estados = [];
    const previa = api.criarPreviaHTML(frame, new Elemento('div'), new Elemento('div'), { aoEstado: e => estados.push(e) });
    previa.agendar(arquivos[0].conteudo, arquivos, 'index.html', 'a'); contexto.timer();
    assert.equal(estados.at(-1).caminho, '/index.html');
    const inicial = frame.srcdoc;
    previa.definirAutomatica(false);
    const novos = arquivos.map(a => a.caminho === 'css/style.css' ? { ...a, conteudo: 'body{color:magenta}' } : a);
    previa.agendar(arquivos[0].conteudo, novos, 'index.html', 'a');
    assert.equal(frame.srcdoc, inicial);
    assert.equal(estados.at(-1).pendente, true);
    previa.atualizar(); assert(frame.srcdoc.includes('body{color:magenta}'));
    assert.equal(estados.at(-1).pendente, false);
    const canal = frame.srcdoc.match(/nonce-([^']+)/)[1];
    eventos.get('message')({ source: frame.contentWindow, origin: 'null', data: { tipo: 'navegar', referencia: 'pages/login.html?tema=azul#form', canal } });
    assert(frame.srcdoc.includes('Login de teste'));
    assert.equal(estados.at(-1).caminho, '/pages/login.html?tema=azul#form');
    previa.agendar(arquivos[0].conteudo, arquivos, 'index.html', 'a'); previa.atualizar();
    assert(frame.srcdoc.includes('Login de teste'), 'atualizar conserva a página navegada');
    assert.equal(estados.at(-1).caminho, '/pages/login.html?tema=azul#form');
});
test("MVP: console valida remetente, canal, nível e limites, e resolve localizações conhecidas", async () => {
    const { api, contexto, eventos } = await carregar();
    const frame = new Elemento('iframe'); frame.contentWindow = {}; const logs = [];
    const previa = api.criarPreviaHTML(frame, new Elemento('div'), null, { aoMensagem: m => logs.push(m) });
    const itens = [{ tipo: 'arquivo', caminho: 'index.html', conteudo: '<script src="app.js"></script>' }, { tipo: 'arquivo', caminho: 'app.js', conteudo: 'console.log(1)' }];
    previa.agendar(itens[0].conteudo, itens, 'index.html', 'a'); contexto.timer();
    const canal = frame.srcdoc.match(/nonce-([^']+)/)[1];
    const enviar = (dados, extra = {}) => eventos.get('message')({ source: frame.contentWindow, origin: 'null', data: { tipo: 'console', canal, nivel: 'log', texto: 'ok', ...dados }, ...extra });
    enviar({}, { source: {} }); enviar({}, { origin: 'https://outro.test' }); enviar({ canal: 'antigo' });
    enviar({ nivel: 'eval' }); enviar({ texto: 'x'.repeat(4097) }); assert.equal(logs.length, 0);
    enviar({ origem: 'taskflow:/app.js', linha: 1, coluna: 2 }); assert.equal(logs[0].caminho, 'app.js'); assert.equal(logs[0].linha, 1);
    enviar({ origem: 'taskflow:/fora.js', linha: -1 }); assert.equal(logs[1].caminho, undefined); assert.equal(logs[1].linha, undefined);
    for (let i = 0; i < 600; i++) enviar({});
    assert(logs.length <= 500);
});
test("MVP: ponte serializa circular, BigInt e getters sem executar getters", () => {
    const enviados = [], handlers = {}; let lido = false;
    const contexto = vm.createContext({ parent: { postMessage: msg => enviados.push(msg) }, window: { addEventListener: (tipo, fn) => handlers[tipo] = fn }, document: { addEventListener() {} }, console: { log() {}, info() {}, warn() {}, error() {} } });
    vm.runInContext(codigoNavegacaoPrevia('teste', 'index.html'), contexto);
    const circular = { n: 1n }; circular.circular = circular;
    Object.defineProperty(circular, 'segredo', { enumerable: true, get() { lido = true; throw new Error('não ler'); } });
    contexto.console.log(circular);
    assert.equal(lido, false); assert(enviados[0].texto.includes('[Circular]')); assert(enviados[0].texto.includes('[Getter]'));
    handlers.error({ message: 'Falha', filename: 'data:text/javascript;base64,eA==#taskflow%3A%2Fapp.js', lineno: 2, colno: 3 });
    assert.equal(enviados.at(-1).origem, 'taskflow:/app.js');
    handlers.unhandledrejection({ reason: new Error('Promise rejeitada') }); assert.equal(enviados.at(-1).nivel, 'error');
    for (let i = 0; i < 600; i++) contexto.console.log('x'.repeat(6000));
    assert(enviados.length <= 500); assert(enviados.every(e => e.texto.length <= 4096));
});
