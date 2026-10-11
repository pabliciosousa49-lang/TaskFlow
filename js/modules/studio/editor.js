import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection } from "@codemirror/view";
import { history, historyKeymap, defaultKeymap, indentWithTab } from "@codemirror/commands";
import { indentOnInput, indentUnit, syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { html } from "@codemirror/lang-html";
import { tags } from "@lezer/highlight";
import { criarValidacaoHTML } from "./validacao.js";

// Editor — Aparência - distingue tags, atributos e valores no tema escuro
const coresHTML = HighlightStyle.define([
    { tag: tags.tagName, color: "#569cd6" },
    { tag: tags.attributeName, color: "#9cdcfe" },
    { tag: tags.attributeValue, color: "#ce9178" },
    { tag: tags.angleBracket, color: "#808080" },
    { tag: tags.comment, color: "#6a9955" },
    { tag: tags.string, color: "#ce9178" },
    { tag: tags.meta, color: "#c586c0" }
]);

const temaEditor = EditorView.theme({
    "&": { backgroundColor: "#1e1e1e", color: "#d4d4d4" },
    ".cm-content": { caretColor: "#f5f5f5", padding: "12px 0" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#f5f5f5" },
    ".cm-gutters": { backgroundColor: "#1e1e1e", color: "#858585", border: "none" },
    ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "#ffffff08" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": { backgroundColor: "#264f78" },
    "&.cm-focused": { outline: "2px solid #b99af8", outlineOffset: "-2px" }
}, { dark: true });

// Editor — Configuração - inicia vazio e comunica somente mudanças no documento
export function criarEditorHTML(parent, aoAlterarCodigo) {
    return new EditorView({
        parent,
        state: EditorState.create({
            doc: "",
            extensions: [
                lineNumbers(),
                highlightActiveLine(),
                highlightActiveLineGutter(),
                drawSelection(),
                history(),
                indentOnInput(),
                indentUnit.of("  "),
                html({ autoCloseTags: true }),
                keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
                syntaxHighlighting(coresHTML),
                temaEditor,
                criarValidacaoHTML(),
                EditorView.updateListener.of((atualizacao) => {
                    if (atualizacao.docChanged) {
                        aoAlterarCodigo(atualizacao.state.doc.toString());
                    }
                }),
                EditorView.contentAttributes.of({
                    "aria-label": "Editor de código HTML — index.html",
                    "aria-describedby": "studio-editor-ajuda",
                    spellcheck: "false",
                    autocapitalize: "off",
                    autocorrect: "off"
                })
            ]
        })
    });
}
