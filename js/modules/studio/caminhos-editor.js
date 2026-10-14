import { parser as html } from "@lezer/html";
import { parser as css } from "@lezer/css";
import { parser as javascript } from "@lezer/javascript";
import { resolverCaminhoVirtual } from "./resolvedor.js";

function referenciaNoCursor(codigo, pos, linguagem) {
    const parser = { html, css, javascript }[linguagem];
    if (!parser) return null;
    let node = parser.parse(codigo).resolveInner(pos, -1);
    for (; node; node = node.parent) {
        const pai = node.parent;
        let reconhecido = false, aspas = true;
        if (linguagem === "html" && node.name === "AttributeValue") {
            const nome = pai?.getChild("AttributeName");
            reconhecido = nome && ["href", "src", "action", "poster"].includes(codigo.slice(nome.from, nome.to).toLowerCase());
        } else if (linguagem === "css" && ["StringLiteral", "ParenthesizedContent"].includes(node.name)) {
            reconhecido = pai?.name === "ImportStatement" || (pai?.name === "CallLiteral" && /^url\s*\(/i.test(codigo.slice(pai.from, pai.to)));
            aspas = node.name === "StringLiteral";
        } else if (linguagem === "javascript" && node.name === "String") {
            reconhecido = pai?.name === "ImportDeclaration" || (pai?.name === "ExportDeclaration" && node.prevSibling?.name === "from");
            if (pai?.name === "ArgList" && pai.parent?.name === "CallExpression") {
                const chamada = pai.parent;
                const alvo = codigo.slice(chamada.from, pai.from).replace(/\s/g, "");
                // Apenas o primeiro argumento literal da API conhecida.
                reconhecido = alvo === "TaskFlow.navegar" && pai.getChild("String")?.from === node.from;
            }
        }
        if (!reconhecido) continue;
        const inicio = node.from + (aspas ? 1 : 0);
        if (aspas && !["'", '"'].includes(codigo[node.from])) return null;
        const fechado = aspas && codigo[node.to - 1] === codigo[node.from] && node.to > node.from + 1;
        const fim = node.to - (fechado ? 1 : 0);
        if (pos < inicio || pos > fim) return null;
        return { inicio, fim };
    }
    return null;
}

// Caminhos — Sugestões - o resolvedor existente determina o diretório virtual.
export function sugerirCaminhos(codigo, pos, linguagem, contexto) {
    if (!contexto?.caminho || !Array.isArray(contexto.arquivos)) return null;
    const referencia = referenciaNoCursor(codigo, pos, linguagem);
    if (!referencia) return null;
    const antes = codigo.slice(referencia.inicio, pos);
    // Não completa URLs externas, consultas, fragmentos ou literais com escapes.
    if (/^[a-z][a-z\d+.-]*:/i.test(antes) || antes.startsWith("//") || /[?#\\]/.test(antes)) return null;
    const ultimaBarra = antes.lastIndexOf("/");
    const diretorio = antes.slice(0, ultimaBarra + 1);
    let base, prefixo;
    try {
        const teste = resolverCaminhoVirtual(diretorio + "__taskflow_candidato__", contexto.caminho);
        base = teste.slice(0, teste.lastIndexOf("/") + 1);
        prefixo = decodeURIComponent(antes.slice(ultimaBarra + 1));
    } catch { return null; }
    const from = referencia.inicio + ultimaBarra + 1;
    let to = pos;
    while (to < referencia.fim && !"/?#".includes(codigo[to])) to++;
    const options = contexto.arquivos.filter(item => {
        const separador = item.caminho.lastIndexOf("/");
        const nome = item.caminho.slice(separador + 1);
        return ["arquivo", "pasta"].includes(item.tipo) && item.caminho.slice(0, separador + 1) === base && nome.startsWith(prefixo);
    }).map(item => {
        const nome = item.caminho.slice(item.caminho.lastIndexOf("/") + 1);
        const pasta = item.tipo === "pasta";
        const insert = encodeURIComponent(nome).replace(/[!'()*]/g, caractere => "%" + caractere.charCodeAt(0).toString(16).toUpperCase()) + (pasta ? "/" : "");
        return { label: nome + (pasta ? "/" : ""), type: pasta ? "namespace" : "text", pasta, insert,
            to: to + (pasta && codigo[to] === "/" ? 1 : 0) };
    }).sort((a, b) => Number(b.pasta) - Number(a.pasta) || a.label.localeCompare(b.label));
    return options.length ? { from, to, options } : null;
}
