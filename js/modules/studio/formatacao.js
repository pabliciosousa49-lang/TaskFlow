import { EditorSelection, Facet, Transaction } from "@codemirror/state";
import { ViewPlugin, keymap } from "@codemirror/view";
import { ensureSyntaxTree, indentRange } from "@codemirror/language";
import { isolateHistory } from "@codemirror/commands";

const linguagemFormatacao = Facet.define({ combine: (valores) => valores[0] || "texto" });
export function podeFormatarSelecao(state) {
    return !state.readOnly && state.selection.ranges.length === 1 && !state.selection.main.empty &&
        ["html", "css", "javascript"].includes(state.facet(linguagemFormatacao));
}

// Seleção — Indentação - altera somente recuos contidos no trecho selecionado.
export function calcularFormatacao(state) {
    if (!podeFormatarSelecao(state)) return { mensagem: "Selecione um trecho editável de HTML, CSS ou JavaScript." };
    const selecao = state.selection.main;
    const fim = state.doc.lineAt(selecao.to).from === selecao.to ? selecao.to - 1 : selecao.to;
    const arvore = ensureSyntaxTree(state, selecao.to, 100);
    if (!arvore) return { mensagem: "Não foi possível analisar este trecho com segurança. Selecione um trecho menor e tente novamente." };
    const protegidos = [];
    arvore.iterate({ from: selecao.from, to: selecao.to, enter(node) {
        if (/String|Comment|AttributeValue/.test(node.name) || (node.name === "Element" &&
            /^<(?:pre|textarea|script|style)\b/i.test(state.doc.sliceString(node.from, Math.min(node.to, node.from + 40))))) {
            protegidos.push({ from: node.from, to: node.to });
            return false;
        }
    } });
    const mudancas = [];
    let parcial = false, preservados = false;
    indentRange(state, selecao.from, fim).iterChanges((from, to, _inicio, _fim, inserido) => {
        if (from < selecao.from || to > selecao.to) { parcial = true; return; }
        const linha = state.doc.lineAt(from);
        const recuo = linha.text.match(/^[\t ]*/)[0];
        if (from !== linha.from || to > linha.from + recuo.length || /[^\t ]/.test(inserido.toString())) return;
        if (protegidos.some((r) => from >= r.from && from < r.to || to > r.from && from < r.to) ||
            state.facet(linguagemFormatacao) === "html" && !/^\s*</.test(linha.text)) {
            preservados = true;
            return;
        }
        mudancas.push({ from, to, insert: inserido });
    });
    // Uma seleção parcial não autoriza alterar o recuo que ficou fora dela.
    if (parcial) return { mensagem: "Inclua o início das linhas e seus recuos na seleção. Nada foi alterado." };
    const changes = state.changes(mudancas);
    return { changes, mensagem: changes.empty
        ? "Nenhum recuo precisa ser alterado. Textos e trechos protegidos são preservados."
        : `Indentação da seleção ajustada.${preservados ? " Textos, comentários e trechos protegidos foram preservados." : ""}` };
}

export function formatarSelecao(view) {
    if (!podeFormatarSelecao(view.state)) return false;
    const resultado = calcularFormatacao(view.state);
    if (resultado.changes && !resultado.changes.empty) {
        const { anchor, head } = view.state.selection.main;
        const selection = EditorSelection.single(
            resultado.changes.mapPos(anchor, anchor <= head ? -1 : 1),
            resultado.changes.mapPos(head, head >= anchor ? 1 : -1));
        view.dispatch({ changes: resultado.changes, selection,
            annotations: [Transaction.userEvent.of("input.format"), isolateHistory.of("full")], scrollIntoView: false });
    }
    const aviso = view.dom?.ownerDocument.querySelector("#studio-formatacao-status");
    if (aviso) aviso.textContent = resultado.mensagem;
    return true;
}

// Ação — Interface - acompanha o estado do arquivo sem manter outra seleção.
export function criarFormatacao(linguagem) {
    return [linguagemFormatacao.of(linguagem), keymap.of([{ key: "Mod-Alt-f", run: formatarSelecao }]),
        ViewPlugin.fromClass(class {
            constructor(view) {
                this.view = view;
                this.botao = view.dom.ownerDocument.querySelector("#studio-formatar-selecao");
                this.aviso = view.dom.ownerDocument.querySelector("#studio-formatacao-status");
                if (this.aviso) this.aviso.textContent = "";
                this.clique = () => { formatarSelecao(view); view.focus(); };
                this.botao?.addEventListener("click", this.clique);
                this.atualizar();
            }
            atualizar() {
                if (this.botao) this.botao.disabled = !podeFormatarSelecao(this.view.state);
            }
            update(update) {
                if (update.docChanged || update.selectionSet) {
                    this.atualizar();
                    if (this.aviso) this.aviso.textContent = "";
                }
            }
            destroy() { this.botao?.removeEventListener("click", this.clique); }
        })];
}
