import { StateEffect, StateField } from "@codemirror/state";
import { Decoration, EditorView } from "@codemirror/view";
import { localizarOcorrencias } from "./ferramentas-editor.js";

// Realce nativo do CodeMirror: somente decorações, sem alterar código ou histórico.
const definirTermo = StateEffect.define();
function decoracoes(estado, termo) {
    const selecao = estado.selection.main;
    return Decoration.set(localizarOcorrencias(estado.doc.toString(), termo).map(item =>
        Decoration.mark({ class: item.from === selecao.from && item.to === selecao.to
            ? "studio-busca-ocorrencia studio-busca-selecionada" : "studio-busca-ocorrencia" }).range(item.from, item.to)));
}
export const realceBusca = StateField.define({
    create: () => ({ termo: "", marcas: Decoration.none }),
    update(valor, transacao) {
        let termo = valor.termo;
        for (const efeito of transacao.effects) if (efeito.is(definirTermo)) termo = efeito.value;
        if (termo === valor.termo && !transacao.docChanged && !transacao.selection) return valor;
        return { termo, marcas: termo ? decoracoes(transacao.state, termo) : Decoration.none };
    },
    provide: campo => EditorView.decorations.from(campo, valor => valor.marcas)
});
export function realcarBusca(editor, termo) {
    if (editor.state.field(realceBusca).termo !== termo) editor.dispatch({ effects: definirTermo.of(termo) });
}
