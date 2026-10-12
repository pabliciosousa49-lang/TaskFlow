import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection } from "@codemirror/view";
import { history, historyKeymap, defaultKeymap, indentWithTab } from "@codemirror/commands";
import { indentOnInput, indentUnit, syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
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
    { tag: tags.meta, color: "#c586c0" },
    { tag: tags.keyword, color: "#c586c0" },
    { tag: tags.number, color: "#b5cea8" },
    { tag: tags.bool, color: "#569cd6" },
    { tag: tags.variableName, color: "#dcdcaa" },
    { tag: tags.propertyName, color: "#9cdcfe" },
    { tag: tags.className, color: "#d7ba7d" },
    { tag: tags.operator, color: "#d4d4d4" }
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

function criarEstadoHTML(codigo, cursor, aoAlterarCodigo, somenteLeitura, linguagem = "html") {
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
                linguagem === "html" ? html({ autoCloseTags: true }) : linguagem === "css" ? css() : linguagem === "javascript" ? javascript() : [],
                keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
                syntaxHighlighting(coresHTML),
                temaEditor,
                linguagem === "html" ? criarValidacaoHTML() : [],
                EditorView.updateListener.of((atualizacao) => {
                    if (atualizacao.docChanged) {
                        aoAlterarCodigo(atualizacao.state.doc.toString());
                    }
                }),
                EditorView.contentAttributes.of({
                    "aria-label": "Editor de código",
                    "aria-describedby": "studio-editor-ajuda",
                    spellcheck: "false",
                    autocapitalize: "off",
                    autocorrect: "off"
                })
            ]
    });
}

export function linguagemArquivo(nome) {
    return ({ html: "html", htm: "html", css: "css", js: "javascript" })[nome.split(".").at(-1).toLowerCase()] || "texto";
}

// Documentos — Estado - conserva histórico, cursor e rolagem por arquivo na mesma view
const documentos = new WeakMap();

export function limparDocumentosEditor(editor) {
    documentos.set(editor, { ativo: null, arquivos: new Map() });
}

export function abrirDocumentoEditor(editor, item, aoAlterarCodigo, posicaoCursor = 0) {
    if (!documentos.has(editor)) limparDocumentosEditor(editor);
    const memoria = documentos.get(editor);
    const anterior = memoria.arquivos.get(memoria.ativo);
    if (anterior) {
        anterior.estado = editor.state;
        anterior.top = editor.scrollDOM.scrollTop;
        anterior.left = editor.scrollDOM.scrollLeft;
    }
    const linguagem = linguagemArquivo(item.nome);
    let documento = memoria.arquivos.get(item.id);
    if (!documento || documento.linguagem !== linguagem || documento.estado.doc.toString() !== item.conteudo) {
        const cursor = documento?.estado.selection.main.head ?? posicaoCursor;
        documento = { linguagem, estado: criarEstadoHTML(item.conteudo, Math.min(cursor, item.conteudo.length), aoAlterarCodigo, false, linguagem), top: documento?.top || 0, left: documento?.left || 0 };
        memoria.arquivos.set(item.id, documento);
    }
    if (memoria.ativo !== item.id || editor.state !== documento.estado) {
        editor.setState(documento.estado);
        const estado = documento.estado;
        editor.requestMeasure({ write() {
            if (editor.state !== estado) return;
            editor.scrollDOM.scrollTop = documento.top;
            editor.scrollDOM.scrollLeft = documento.left;
        } });
    }
    memoria.ativo = item.id;
}

export function descartarDocumentoEditor(editor, id) {
    const memoria = documentos.get(editor);
    memoria?.arquivos.delete(id);
    if (memoria?.ativo === id) memoria.ativo = null;
}
