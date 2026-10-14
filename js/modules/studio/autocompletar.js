import { EditorState, Prec, Transaction } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { autocompletion, acceptCompletion, startCompletion, closeCompletion, completionStatus } from "@codemirror/autocomplete";
import { syntaxTree } from "@codemirror/language";
import { isolateHistory } from "@codemirror/commands";
import { criarEstruturaInicialHTML } from "./documento-html.js";
import { sugerirCaminhos } from "./caminhos-editor.js";
import { htmlLanguage } from "@codemirror/lang-html";

export function contextoEditavel(state, pos) {
    if (state.readOnly || !state.selection.main.empty || state.selection.ranges.length !== 1) return false;
    const node = syntaxTree(state).resolveInner(pos, -1);
    return !/Comment|String|Attribute|ScriptText|StyleText/.test(node.name);
}

function atalhoHTML5(state, pos) {
    if (!htmlLanguage.isActiveAt(state, pos)) return null;
    if (!contextoEditavel(state, pos)) return null;
    const linha = state.doc.lineAt(pos);
    const antes = state.doc.sliceString(linha.from, pos);
    const match = antes.match(/(?:^|\s)(html:5)$/);
    if (!match || state.doc.sliceString(pos, linha.to).trim()) return null;
    const from = pos - match[1].length;
    const restante = state.doc.sliceString(0, from) + state.doc.sliceString(pos);
    if (/<(?:html|head|body)\b|<!doctype\b/i.test(restante)) return null;
    return { from, to: pos };
}

export function expandirHTML5(view) {
    const trecho = atalhoHTML5(view.state, view.state.selection.main.head);
    if (!trecho) return false;
    const codigo = criarEstruturaInicialHTML("Meu Projeto");
    view.dispatch({ changes: { ...trecho, insert: codigo },
        selection: { anchor: trecho.from + codigo.indexOf("<body>\n") + 7 },
        annotations: [Transaction.userEvent.of("input.complete"), isolateHistory.of("full")] });
    return true;
}

function completarHTML5(context) {
    const trecho = atalhoHTML5(context.state, context.pos);
    return trecho ? { from: trecho.from, options: [{ label: "html:5", type: "snippet", detail: "Documento HTML5", apply: expandirHTML5 }] } : null;
}

function completarDocument(context) {
    if (!contextoEditavel(context.state, context.pos)) return null;
    const palavra = context.matchBefore(/document\.[a-zA-Z]*/);
    if (!palavra) return null;
    return { from: palavra.from + 9, options: [
        { label: "querySelector", type: "method", apply: 'querySelector("")' },
        { label: "getElementById", type: "method", apply: 'getElementById("")' },
        { label: "addEventListener", type: "method", apply: 'addEventListener("click", () => {})' }
    ], validFor: /^[a-zA-Z]*$/ };
}

const valoresCSS = {
    display: ["block", "inline", "inline-block", "flex", "grid", "none"],
    position: ["static", "relative", "absolute", "fixed", "sticky"],
    color: ["inherit", "transparent", "currentColor"],
    background: ["none", "transparent"],
    margin: ["0", "auto"], padding: ["0"], border: ["none", "1px solid"],
    "flex-direction": ["row", "column"], "grid-template-columns": ["1fr", "repeat(2, 1fr)"]
};

function completarCSS(context) {
    if (!contextoEditavel(context.state, context.pos)) return null;
    const antes = context.state.doc.sliceString(Math.max(0, context.pos - 4000), context.pos);
    if (antes.lastIndexOf("{") <= antes.lastIndexOf("}")) return null;
    const propriedade = antes.match(/[{;]\s*([\w-]*)$/);
    if (propriedade) return { from: context.pos - propriedade[1].length,
        options: Object.keys(valoresCSS).map((label) => ({ label, type: "property", apply: `${label}: ` })), validFor: /^[\w-]*$/ };
    const valor = antes.match(/([\w-]+)\s*:\s*([\w-]*)$/);
    return valor && valoresCSS[valor[1]] ? { from: context.pos - valor[2].length,
        options: valoresCSS[valor[1]].map((label) => ({ label, type: "keyword" })), validFor: /^[\w-]*$/ } : null;
}

// Caminhos — Contexto - consulta o projeto atual sem duplicar a árvore do explorador.
const contextosCaminhos = new WeakMap();
export function atualizarContextoCaminhos(view, obterContexto) {
    if (!view) return;
    contextosCaminhos.set(view, obterContexto);
    if (completionStatus(view.state)) {
        closeCompletion(view);
        startCompletion(view);
    }
}
function completarCaminhos(context, linguagem) {
    if (context.state.readOnly || !context.state.selection.main.empty || context.state.selection.ranges.length !== 1) return null;
    const dados = contextosCaminhos.get(context.view)?.();
    const resultado = sugerirCaminhos(context.state.doc.toString(), context.pos, linguagem, dados);
    if (!resultado) return null;
    return { from: resultado.from, to: resultado.to, filter: false, options: resultado.options.map(item => ({
        label: item.label, type: item.type,
        apply(view) {
            // Recalcula com a árvore atual para não inserir uma sugestão removida.
            const atual = sugerirCaminhos(view.state.doc.toString(), view.state.selection.main.head, linguagem, contextosCaminhos.get(view)?.());
            const opcao = atual?.options.find(opcao => opcao.label === item.label);
            if (!opcao) return;
            closeCompletion(view);
            view.dispatch({ changes: { from: atual.from, to: opcao.to, insert: opcao.insert },
                selection: { anchor: atual.from + opcao.insert.length }, annotations: Transaction.userEvent.of("input.complete") });
            if (opcao.pasta) startCompletion(view);
        }
    })) };
}

// Linguagens — Sugestões - acrescenta fontes sem substituir o suporte nativo.
export function criarAutocompletar(linguagem) {
    if (!["html", "css", "javascript"].includes(linguagem)) return [];
    return [
        autocompletion({ activateOnTyping: true }),
        ...(linguagem === "html" ? [
            Prec.high(keymap.of([
                { key: "Tab", run: (view) => expandirHTML5(view) || acceptCompletion(view) },
                { key: "Enter", run: expandirHTML5 }
            ])),
        ] : [Prec.high(keymap.of([{ key: "Tab", run: acceptCompletion }]))]),
        // EditorState.languageData complementa o facet fornecido por cada linguagem.
        fontesAdicionais(linguagem)
    ];
}

function fontesAdicionais(linguagem) {
    // O CodeMirror associa consultas e resultados à identidade da fonte.
    const completarReferencia = context => completarCaminhos(context, linguagem);
    return EditorState.languageData.of(() => [
        { autocomplete: completarReferencia },
        { autocomplete: linguagem === "html" ? completarHTML5 : linguagem === "javascript" ? completarDocument : completarCSS }
    ]);
}
