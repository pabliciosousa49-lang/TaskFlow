import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection } from "@codemirror/view";
import { history, historyKeymap, defaultKeymap, indentWithTab } from "@codemirror/commands";
import { indentOnInput, indentUnit, syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { html } from "@codemirror/lang-html";
import { tags } from "@lezer/highlight";
import { criarValidacaoHTML } from "./validacao.js";
import { criarEstruturaInicialHTML } from "./documento-html.js";
export { criarEstruturaInicialHTML } from "./documento-html.js";

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
    "&": { backgroundColor: "var(--studio-editor-fundo)", color: "var(--studio-editor-texto)" },
    ".cm-content": { caretColor: "#f5f5f5", padding: "12px 0" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#f5f5f5" },
    ".cm-gutters": { backgroundColor: "var(--studio-editor-fundo)", color: "var(--studio-secundario)", border: "none" },
    ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "#ffffff08" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": { backgroundColor: "#563385" },
    "&.cm-focused": { outline: "2px solid var(--studio-foco)", outlineOffset: "-2px" }
}, { dark: true });

// Editor — Configuração - prepara projetos novos sem substituir conteúdo recebido
export function criarEditorHTML(parent, aoAlterarCodigo, { novoProjeto = false, titulo = "", codigoInicial, posicaoCursor = 0, somenteLeitura = false } = {}) {
    const inserirEstrutura = novoProjeto && codigoInicial === undefined;
    const codigo = inserirEstrutura ? criarEstruturaInicialHTML(titulo) : (codigoInicial ?? "");
    const cursor = inserirEstrutura ? codigo.indexOf("<body>\n") + "<body>\n".length :
        Math.max(0, Math.min(posicaoCursor, codigo.length));

    return new EditorView({ parent, state: criarEstadoHTML(codigo, cursor, aoAlterarCodigo, somenteLeitura) });
}

// Editor — Documento - troca o estado da mesma instância sem misturar históricos
export function carregarDocumentoHTML(editor, codigo, aoAlterarCodigo, { posicaoCursor = 0, somenteLeitura = false } = {}) {
    const cursor = Math.max(0, Math.min(posicaoCursor, codigo.length));
    editor.setState(criarEstadoHTML(codigo, cursor, aoAlterarCodigo, somenteLeitura));
}

function criarEstadoHTML(codigo, cursor, aoAlterarCodigo, somenteLeitura) {
    return EditorState.create({
            doc: codigo,
            selection: { anchor: cursor },
            extensions: [
                EditorState.readOnly.of(somenteLeitura),
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
    });
}
