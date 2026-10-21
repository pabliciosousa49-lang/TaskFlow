import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { localizarOcorrencias } from "../../js/modules/studio/ferramentas-editor.js";
import { criarExplorador } from "../../js/modules/studio/explorador.js";
import { Elemento } from "../biblioteca/dom-simulado.mjs";

test("realce: marca todas as ocorrências e a selecionada; atualiza após editar e limpa sem mudar código", () => {
    const contexto = vm.createContext({ localizarOcorrencias,
        StateEffect: { define() { const tipo = { of: value => ({ value, is: outro => outro === tipo }) }; return tipo; } },
        StateField: { define: spec => spec },
        Decoration: { none: [], set: itens => itens, mark: spec => ({ range: (from, to) => ({ ...spec, from, to }) }) },
        EditorView: { decorations: { from: () => ({}) } }
    });
    const fonte = readFileSync(new URL("../../js/modules/studio/busca-codigo.js", import.meta.url), "utf8")
        .replace(/^import .*;\r?$/gm, "").replace(/export (const|function)/g, "$1");
    vm.runInContext(fonte + ";globalThis.api={realceBusca,realcarBusca};", contexto);
    const { realceBusca, realcarBusca } = contexto.api;
    let valor = realceBusca.create(), codigo = "😀 console.log(1); console.log(2)", selecao = { from: 3, to: 14 }, despachos = 0;
    const state = { doc: { toString: () => codigo }, selection: { get main() { return selecao; } }, field: () => valor };
    const view = { state, dispatch(t) { despachos++; assert(!t.changes); valor = realceBusca.update(valor, { effects: [t.effects], state }); } };
    realcarBusca(view, "console.log");
    assert.equal(valor.marcas.length, 2);
    assert.match(valor.marcas[0].class, /studio-busca-selecionada/);
    selecao = { from: 19, to: 30 };
    valor = realceBusca.update(valor, { effects: [], state, selection: selecao });
    assert.doesNotMatch(valor.marcas[0].class, /studio-busca-selecionada/);
    assert.match(valor.marcas[1].class, /studio-busca-selecionada/);
    codigo = "console.log(3)";
    valor = realceBusca.update(valor, { effects: [], state, docChanged: true });
    assert.equal(valor.marcas.length, 1);
    realcarBusca(view, "console.log"); assert.equal(despachos, 1);
    realcarBusca(view, ""); assert.equal(valor.marcas.length, 0);
    assert.equal(codigo, "console.log(3)");
});

test("explorador: ações de criação, expansão de pasta, ícones e arquivo ativo preservados", () => {
    const controles = new Map();
    const raiz = { querySelector(id) { if (!controles.has(id)) controles.set(id, new Elemento()); return controles.get(id); } };
    globalThis.document = { createElement: tag => new Elemento(tag), createElementNS: (_, tag) => new Elemento(tag) };
    let resposta = "pages", pedido, arquivoSelecionado;
    globalThis.window = { prompt: () => resposta, confirm: () => true };
    const p = { id: "p", titulo: "Existente", arquivos: [
        { id: "pasta", parentId: null, tipo: "pasta", nome: "css", caminho: "css" },
        { id: "css", parentId: "pasta", tipo: "arquivo", nome: "style.css", caminho: "css/style.css" },
        { id: "html", parentId: null, tipo: "arquivo", nome: "index.html", caminho: "index.html" }
    ] };
    const api = criarExplorador(raiz, { criar: (...args) => { pedido = args; }, selecionar: item => { arquivoSelecionado = item.id; } });
    api.atualizar(p, "html");
    controles.get("#explorador-novo-arquivo").click = () => controles.get("#explorador-novo-arquivo").disparar("click");
    controles.get("#explorador-nova-pasta").click = () => controles.get("#explorador-nova-pasta").disparar("click");
    const arvore = controles.get("#explorador-arvore");
    const item = id => arvore.querySelectorAll("button").find(b => b.dataset.item === id);
    assert.equal(item("html").getAttribute("aria-current"), "true");
    assert.equal(item("html").children[1].dataset.icone, "html");
    assert.equal(item("pasta").children[1].dataset.icone, "pasta");
    controles.get("#explorador-nova-pasta").disparar("click");
    assert.deepEqual(pedido, ["pasta", "pages", null]);
    arvore.disparar("click", { target: { closest: () => item("pasta") } });
    assert.equal(item("pasta").getAttribute("aria-expanded"), "true");
    assert.equal(item("pasta").children[1].dataset.icone, "pasta-aberta");
    assert.equal(item("css").children[1].dataset.icone, "css");
    resposta = "layout.css"; controles.get("#explorador-novo-arquivo").disparar("click");
    assert.deepEqual(pedido, ["arquivo", "layout.css", "pasta"]);
    controles.get("#explorador-criar-arquivo").disparar("click");
    assert.deepEqual(pedido, ["arquivo", "layout.css", "pasta"]);
    assert.equal(controles.get("#explorador-novo-menu").open, false);
    resposta = "componentes"; controles.get("#explorador-criar-pasta").disparar("click");
    assert.deepEqual(pedido, ["pasta", "componentes", "pasta"]);
    arvore.disparar("click", { target: { closest: () => item("css") } });
    assert.equal(arquivoSelecionado, "css");
    api.atualizar(p, "css", "css"); assert.equal(item("css").getAttribute("aria-current"), "true");
    api.indicarPendencia("css", true); assert.equal(item("css").dataset.pendente, "true");
    api.indicarPendencia("css", false); assert.equal(item("css").dataset.pendente, "false");
    arvore.disparar("click", { target: { closest: () => item("pasta") } });
    assert.equal(item("pasta").getAttribute("aria-expanded"), "false");
    assert.equal(item("css"), undefined);
});
