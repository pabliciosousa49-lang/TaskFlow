import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import process from "node:process";

if (!vm.SourceTextModule) throw new Error("Use node --experimental-vm-modules --test tests/studio/*.test.mjs");
const cache = JSON.parse(readFileSync(new URL("./vendor/lezer-cache.json", import.meta.url), "utf8"));
const imports = JSON.parse(readFileSync(new URL("../../pages/studio.html", import.meta.url), "utf8").match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;
const contexto = vm.createContext({ console });
const modulos = new Map();
let reinicios = 0;
const mocks = {
    "@codemirror/state": { EditorState: { languageData: { of: fn => ({ languageData: fn }) } }, Prec: { high: x => x }, Transaction: { userEvent: { of: x => x } } },
    "@codemirror/view": { keymap: { of: x => x } },
    "@codemirror/autocomplete": { autocompletion: () => ({}), acceptCompletion: () => true, startCompletion: () => { reinicios++; }, closeCompletion: () => {}, completionStatus: state => state.completion },
    "@codemirror/language": { syntaxTree: () => ({ resolveInner: () => ({ name: "String" }) }) },
    "@codemirror/commands": { isolateHistory: { of: () => ({}) } },
    "@codemirror/lang-html": { htmlLanguage: { isActiveAt: () => false } }
};
function get(url) {
    if (!modulos.has(url)) {
        const valores = mocks[url] || (url === "https://esm.sh/node/process.mjs" ? { default: process } : null);
        const modulo = valores ? new vm.SyntheticModule(Object.keys(valores), function () {
            for (const [nome, valor] of Object.entries(valores)) this.setExport(nome, valor);
        }, { context: contexto, identifier: url }) : new vm.SourceTextModule(
            url.startsWith("file:") ? readFileSync(new URL(url), "utf8") : cache[url], { context: contexto, identifier: url });
        modulos.set(url, modulo);
    }
    return modulos.get(url);
}
const modulo = get(new URL("../../js/modules/studio/autocompletar.js", import.meta.url).href);
await modulo.link((s, ref) => get(mocks[s] ? s : imports[s] || new URL(s, ref.identifier).href));
await modulo.evaluate();
const sugerir = get(new URL("../../js/modules/studio/caminhos-editor.js", import.meta.url).href).namespace.sugerirCaminhos;
const arvore = [
    ["index.html", "arquivo"], ["pages", "pasta"], ["pages/login.html", "arquivo"], ["pages/dashboard.html", "arquivo"],
    ["pages/sub", "pasta"], ["pages/sub/usuario.html", "arquivo"], ["css", "pasta"], ["css/style.css", "arquivo"],
    ["css/style-dark.css", "arquivo"], ["js", "pasta"], ["js/app.js", "arquivo"], ["js/modules", "pasta"],
    ["js/modules/login.js", "arquivo"], ["js/modules/Meu arquivo.js", "arquivo"]
].map(([caminho, tipo]) => ({ caminho, tipo }));
function consultar(marcado, linguagem = "html", caminho = "index.html", arquivos = arvore) {
    const pos = marcado.indexOf("|");
    return sugerir(marcado.replace("|", ""), pos, linguagem, { caminho, arquivos });
}

for (const [codigo, linguagem, origem, esperados] of [
    ['<a href="./|">', "html", "index.html", ["css/", "js/", "pages/", "index.html"]],
    ['<script src="../js/|">', "html", "pages/login.html", ["modules/", "app.js"]],
    ['<a href="/pages/|">', "html", "pages/sub/usuario.html", ["sub/", "dashboard.html", "login.html"]],
    ['<a href="../../|">', "html", "pages/sub/usuario.html", ["css/", "js/", "pages/", "index.html"]],
    ['<link href="./css/st|">', "html", "index.html", ["style-dark.css", "style.css"]],
    ['<a href="./pages/s|">', "html", "index.html", ["sub/"]],
    ['<img src="./|">', "html", "pages/login.html", ["sub/", "dashboard.html", "login.html"]],
    ['@import "./st|";', "css", "css/main.css", ["style-dark.css", "style.css"]],
    ['a {background:url(../pages/|)}', "css", "css/main.css", ["sub/", "dashboard.html", "login.html"]],
    ["a {background:url('/css/st|')}", "css", "css/main.css", ["style-dark.css", "style.css"]],
    ['import { iniciar } from "./modules/|";', "javascript", "js/app.js", ["login.js", "Meu arquivo.js"]],
    ["import '../css/st|';", "javascript", "js/app.js", ["style-dark.css", "style.css"]],
    ['export { iniciar } from "./modules/|";', "javascript", "js/app.js", ["login.js", "Meu arquivo.js"]],
    ['TaskFlow.navegar("./pages/|");', "javascript", "index.js", ["sub/", "dashboard.html", "login.html"]],
    ['<a href="./pages/|', "html", "index.html", ["sub/", "dashboard.html", "login.html"]]
]) {
    test("contexto: " + codigo, () => {
        assert.deepEqual(Array.from(consultar(codigo, linguagem, origem)?.options || [], item => item.label).sort(), esperados.sort());
    });
}

for (const [codigo, linguagem] of [
    ['<p title="./|">', "html"], ['<!-- <a href="./|"> -->', "html"], ['<p>./|</p>', "html"],
    ['const mensagem = "./|";', "javascript"], ['console.log("./|");', "javascript"],
    ['// import "./|";', "javascript"], ['TaskFlow.navegar(variavel|);', "javascript"],
    ['TaskFlow.navegar("./pages/login.html", "./|");', "javascript"],
    ['a {content:"./|"}', "css"], ['/* @import "./|" */', "css"],
    ['<a href="https://site.test/|">', "html"], ['<a href="//site.test/|">', "html"],
    ['<a href="../|">', "html"], ['<a href="./ausente/|">', "html"],
    ['<a href="./pages/login.html?nome=|">', "html"], ['<a href="#|">', "html"]
]) test("não sugere: " + codigo, () => assert.equal(consultar(codigo, linguagem), null));

test("árvore atual: criação, renomeação, exclusão e movimento", () => {
    const arquivos = [...arvore];
    const codigo = '<a href="./pages/novo|">';
    assert.equal(consultar(codigo, "html", "index.html", arquivos), null);
    arquivos.push({ caminho: "pages/novo.html", tipo: "arquivo" });
    assert.equal(consultar(codigo, "html", "index.html", arquivos).options[0].label, "novo.html");
    arquivos.at(-1).caminho = "pages/renomeado.html";
    assert.equal(consultar(codigo, "html", "index.html", arquivos), null);
    arquivos.at(-1).caminho = "renomeado.html";
    assert.equal(consultar('<a href="./pages/renomeado|">', "html", "index.html", arquivos), null);
    arquivos.pop();
    assert.equal(consultar('<a href="./renomeado|">', "html", "index.html", arquivos), null);
});

test("componente: preserva prefixo, sufixo, aspas e consulta", () => {
    const marcado = '<link href="./css/st|yle.css?v=1#tema" rel="stylesheet">';
    const codigo = marcado.replace("|", "");
    const resultado = consultar(marcado);
    const opcao = resultado.options.find(item => item.label === "style-dark.css");
    assert.equal(codigo.slice(0, resultado.from) + opcao.insert + codigo.slice(opcao.to), '<link href="./css/style-dark.css?v=1#tema" rel="stylesheet">');
});

test("pasta existente não duplica barra e nomes com espaços são codificados", () => {
    const pasta = consultar('<a href="./p|ages/login.html">');
    const opcao = pasta.options.find(item => item.label === "pages/");
    const codigo = '<a href="./pages/login.html">';
    assert.equal(codigo.slice(0, pasta.from) + opcao.insert + codigo.slice(opcao.to), codigo);
    assert.equal(consultar('import "./modules/Meu|";', "javascript", "js/app.js").options[0].insert, "Meu%20arquivo.js");
});

test("fonte integrada simulada: aplicar pasta, continuar, cursor e contexto atualizado", () => {
    const view = { codigo: '<link href="./">', state: {} };
    view.state.doc = { toString: () => view.codigo };
    view.state.selection = { main: { head: view.codigo.indexOf('"./') + 3, empty: true }, ranges: [{}] };
    view.dispatch = spec => {
        view.codigo = view.codigo.slice(0, spec.changes.from) + spec.changes.insert + view.codigo.slice(spec.changes.to);
        view.state.selection.main.head = spec.selection.anchor;
    };
    let arquivos = arvore;
    modulo.namespace.atualizarContextoCaminhos(view, () => ({ caminho: "index.html", arquivos }));
    const fontes = modulo.namespace.criarAutocompletar("html").at(-1).languageData();
    assert.equal(fontes.length, 2);
    const fonte = fontes[0].autocomplete;
    function completar() { return fonte({ view, state: view.state, pos: view.state.selection.main.head }); }
    const contador = reinicios;
    completar().options.find(item => item.label === "css/").apply(view);
    assert.equal(view.codigo, '<link href="./css/">'); assert.equal(reinicios, contador + 1);
    assert.equal(view.codigo[view.state.selection.main.head], '"');
    const removida = completar().options.find(item => item.label === "style.css");
    arquivos = arvore.filter(item => item.caminho !== "css/style.css");
    removida.apply(view); assert.equal(view.codigo, '<link href="./css/">');
    completar().options[0].apply(view); assert.equal(view.codigo, '<link href="./css/style-dark.css">');
    view.state.readOnly = true; assert.equal(completar(), null);
});
