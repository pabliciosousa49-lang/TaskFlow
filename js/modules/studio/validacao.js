import { htmlLanguage } from "@codemirror/lang-html";
import { linter, lintGutter, lintKeymap, openLintPanel } from "@codemirror/lint";
import { keymap } from "@codemirror/view";

const fechamentoOpcional = new Set([
    "html", "head", "body", "p", "li", "dt", "dd", "rt", "rp", "option",
    "optgroup", "colgroup", "thead", "tbody", "tfoot", "tr", "td", "th"
]);

// Validação — Diagnósticos - usa a árvore original do parser, sem corrigir o documento
export function analisarHTML(codigo) {
    const diagnosticos = [];
    const trechos = new Set();
    const arvore = htmlLanguage.parser.parse(codigo);

    function adicionar(no, mensagem) {
        const from = no.from;
        const to = Math.max(from + 1, no.to);
        if (from >= codigo.length) return;
        const chave = `${from}:${to}`;
        if (trechos.has(chave)) return;
        trechos.add(chave);
        diagnosticos.push({ from, to, severity: "error", message: mensagem });
    }

    arvore.iterate({
        enter(cursor) {
            const no = cursor.node;
            if (no.name === "MismatchedCloseTag" && no.getChild("EndTag")) {
                adicionar(no, "A tag de fechamento não corresponde a uma abertura neste ponto. Verifique o nome e a ordem dos elementos.");
                return false;
            }
            if (!no.type.isError) return;

            // Fragmentos ainda incompletos no fim do texto não são tratados como erros.
            if (no.from >= codigo.length) return;
            let ancestral = no.parent;
            let atributo;
            while (ancestral && !["OpenTag", "SelfClosingTag", "Element", "Document"].includes(ancestral.name)) {
                if (ancestral.name === "Attribute") atributo = ancestral;
                ancestral = ancestral.parent;
            }

            if (ancestral?.name === "OpenTag" || ancestral?.name === "SelfClosingTag") {
                if (!ancestral.getChild("EndTag") && !ancestral.getChild("SelfClosingEndTag")) return;
                adicionar(atributo || no, atributo
                    ? "O atributo está malformado. Confira o sinal de igual, o valor e as aspas."
                    : "Este trecho da tag está malformado. Confira sua sintaxe.");
            } else if (no.parent?.name === "Element" && no.from === no.to) {
                const abertura = no.parent.getChild("OpenTag");
                const nome = abertura?.getChild("TagName");
                const tag = nome && codigo.slice(nome.from, nome.to).toLowerCase();
                if (tag && !fechamentoOpcional.has(tag) && codigo.slice(no.from).startsWith("</")) {
                    adicionar(abertura, "Feche este elemento antes de fechar o elemento que o contém.");
                }
            }
        }
    });

    return diagnosticos;
}

export function criarValidacaoHTML() {
    return [
        linter((view) => analisarHTML(view.state.doc.toString()), { delay: 700 }),
        lintGutter(),
        keymap.of(lintKeymap)
    ];
}

export function mostrarProblemasHTML(editor) {
    openLintPanel(editor);
}
