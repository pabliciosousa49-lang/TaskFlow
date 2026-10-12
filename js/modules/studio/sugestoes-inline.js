import { StateEffect, StateField, Prec, Transaction } from "@codemirror/state";
import { Decoration, EditorView, WidgetType, keymap } from "@codemirror/view";
import { closeCompletion } from "@codemirror/autocomplete";
import { isolateHistory } from "@codemirror/commands";
import { contextoEditavel } from "./autocompletar.js";

const descartar = StateEffect.define();
class TextoSugerido extends WidgetType {
    constructor(texto) { super(); this.texto = texto; }
    eq(outro) { return outro.texto === this.texto; }
    toDOM() {
        const span = document.createElement("span");
        span.className = "studio-sugestao-inline";
        span.textContent = this.texto;
        span.setAttribute("aria-hidden", "true");
        return span;
    }
    ignoreEvent() { return true; }
}

export function sugestaoContextual(state, linguagem) {
    const pos = state.selection.main.head;
    if (!contextoEditavel(state, pos)) return null;
    const linha = state.doc.lineAt(pos);
    if (pos !== linha.to) return null;
    const antes = state.doc.sliceString(linha.from, pos);
    let candidatos = [], prefixo;
    if (linguagem === "javascript") {
        const metodo = antes.match(/\bdocument\.([a-zA-Z]{2,})$/);
        if (metodo) { prefixo = metodo[1]; candidatos = ['querySelector("")', 'getElementById("")', 'addEventListener("click", () => {})']; }
        else {
            const palavra = antes.match(/^\s*([a-zA-Z]{2,})$/);
            if (palavra) { prefixo = palavra[1]; candidatos = ["const ", "let ", "function nome() {}", "if () {}", "for (let i = 0; i < 10; i++) {}"]; }
        }
    } else if (linguagem === "html") {
        const tag = antes.match(/<([a-zA-Z]{2,})$/);
        if (tag) { prefixo = tag[1]; candidatos = ["div", "section", "header", "main", "form", "input", "button", "article", "footer"].map((nome) => nome === "input" ? 'input type="text">' : `${nome}></${nome}>`); }
    } else if (linguagem === "css") {
        const bloco = state.doc.sliceString(Math.max(0, pos - 4000), pos);
        const propriedade = bloco.match(/[{;]\s*([a-zA-Z-]{2,})$/);
        if (propriedade && bloco.lastIndexOf("{") > bloco.lastIndexOf("}")) {
            prefixo = propriedade[1]; candidatos = ["display", "position", "background", "color", "margin", "padding", "border", "flex", "grid"].map((nome) => `${nome}: ;`);
        }
    }
    const completo = prefixo && candidatos.find((item) => item.startsWith(prefixo) && item !== prefixo);
    return completo ? { pos, texto: completo.slice(prefixo.length) } : null;
}

export function criarSugestoesInline(linguagem) {
    if (!["html", "css", "javascript"].includes(linguagem)) return [];
    const campo = StateField.define({
        create(state) { return { hint: sugestaoContextual(state, linguagem), fechado: false }; },
        update(valor, tr) {
            if (tr.effects.some((e) => e.is(descartar))) return { hint: null, fechado: true };
            const fechado = valor.fechado && !tr.docChanged && !tr.selection;
            return { hint: fechado ? null : sugestaoContextual(tr.state, linguagem), fechado };
        },
        provide: (field) => EditorView.decorations.from(field, ({ hint }) => hint
            ? Decoration.set([Decoration.widget({ widget: new TextoSugerido(hint.texto), side: 1 }).range(hint.pos)]) : Decoration.none)
    });
    return [campo, Prec.highest(keymap.of([
        { key: "Tab", run(view) {
            const hint = view.state.field(campo).hint;
            if (!hint || view.composing || view.state.readOnly) return false;
            let cursor = hint.texto.length;
            const aspas = hint.texto.indexOf('""');
            const conteudo = hint.texto.indexOf("></");
            const parenteses = hint.texto.indexOf("()");
            const corpo = hint.texto.indexOf("{}");
            const valorCSS = hint.texto.indexOf(";");
            if (aspas >= 0) cursor = aspas + 1;
            else if (conteudo >= 0) cursor = conteudo + 1;
            else if (parenteses >= 0) cursor = parenteses + 1;
            else if (corpo >= 0) cursor = corpo + 1;
            else if (linguagem === "css" && valorCSS >= 0) cursor = valorCSS;
            view.dispatch({ changes: { from: hint.pos, insert: hint.texto }, selection: { anchor: hint.pos + cursor },
                annotations: [Transaction.userEvent.of("input.complete"), isolateHistory.of("full")] });
            closeCompletion(view);
            return true;
        } },
        { key: "Escape", run(view) {
            if (!view.state.field(campo).hint) return false;
            view.dispatch({ effects: descartar.of(null) });
            closeCompletion(view);
            view.setTabFocusMode?.(2000);
            return true;
        } }
    ]))];
}
