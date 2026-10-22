import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { Elemento } from "./dom-simulado.mjs";
import { conteudos as html } from "../../data/biblioteca/html/conteudos.js";
import { conteudos as css } from "../../data/biblioteca/css/conteudos.js";

async function iniciar() {
    const elementos = new Map(), memoria = new Map(); let contextoAssunto = { linguagem: "html", topico: html.niveis[0].modulos[0].assuntos[0].id }, confirmar = true, id = 0;
    const fonte = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
    for (const [, nome] of fonte.matchAll(/\bid="([^"]+)"/g)) elementos.set(nome, new Elemento());
    const obter = nome => elementos.get(nome);
    obter("anotacoes-filtro").value = ""; obter("anotacoes-pesquisa").value = "";
    const formulario = obter("anotacoes-formulario");
    formulario.reset = () => { for (const nome of ["nome", "texto", "linguagem", "topico"]) obter(`anotacoes-${nome}`).value = ""; };
    formulario.reportValidity = () => true;
    const ctx = vm.createContext({ document: { getElementById: obter, createElement: tag => new Elemento(tag) }, Date,
        crypto: { randomUUID: () => `nota-${++id}` },
        window: { localStorage: { getItem: k => memoria.get(k) ?? null, setItem: (k, v) => memoria.set(k, v) }, confirm: () => confirmar, addEventListener() {} }
    });
    const servico = new vm.SourceTextModule(readFileSync(new URL("../../js/services/anotacoes-biblioteca.js", import.meta.url), "utf8"), { context: ctx });
    const ui = new vm.SourceTextModule(readFileSync(new URL("../../js/biblioteca/anotacoes.js", import.meta.url), "utf8"), { context: ctx });
    await ui.link(() => servico); await ui.evaluate(); ui.namespace.iniciarAnotacoes([html, css], () => contextoAssunto);
    return { obter, memoria, clicar: nome => obter(nome).disparar("click"), contexto: valor => { contextoAssunto = valor; }, confirmar: valor => { confirmar = valor; },
        salvar(titulo, texto) { obter("anotacoes-nome").value = titulo; obter("anotacoes-texto").value = texto; formulario.disparar("submit", { preventDefault() {} }); } };
}

test("painel de notas abre, associa ao tópico atual, salva, edita, filtra, pesquisa e exclui", async () => {
    const a = await iniciar(); a.clicar("biblioteca-abrir-anotacoes");
    assert.equal(a.obter("biblioteca-anotacoes").open, true); assert(a.obter("anotacoes-fechar").focado);
    a.clicar("anotacoes-nova");
    assert.equal(a.obter("anotacoes-linguagem").value, "html");
    assert.equal(a.obter("anotacoes-topico").value, html.niveis[0].modulos[0].assuntos[0].id);
    a.salvar("Minha página", "Não interpretar <script> como HTML nas anotações.");
    let notas = JSON.parse(a.memoria.get("taskflow.biblioteca.anotacoes.v1")).anotacoes;
    assert.equal(notas.length, 1); assert.equal(notas[0].linguagem, "html");
    assert.equal(a.obter("anotacoes-lista").querySelector("script"), null);
    a.obter("anotacoes-lista").querySelectorAll("button")[0].disparar("click");
    a.obter("anotacoes-linguagem").value = "css"; a.obter("anotacoes-linguagem").disparar("change");
    a.obter("anotacoes-topico").value = css.niveis[0].modulos[0].assuntos[0].id;
    a.salvar("Página e CSS", "Minha revisão de estilos");
    notas = JSON.parse(a.memoria.get("taskflow.biblioteca.anotacoes.v1")).anotacoes;
    assert.equal(notas[0].linguagem, "css");
    a.obter("anotacoes-filtro").value = "html"; a.obter("anotacoes-filtro").disparar("change");
    assert.match(a.obter("anotacoes-lista").textContent, /Nenhuma anotação corresponde/);
    a.obter("anotacoes-filtro").value = ""; a.obter("anotacoes-filtro").disparar("change");
    a.obter("anotacoes-pesquisa").value = "pagina"; a.obter("anotacoes-pesquisa").disparar("input");
    assert.match(a.obter("anotacoes-lista").textContent, /Página e CSS/);
    a.confirmar(false); a.obter("anotacoes-lista").querySelectorAll("button")[1].disparar("click");
    assert.equal(JSON.parse(a.memoria.get("taskflow.biblioteca.anotacoes.v1")).anotacoes.length, 1);
    a.confirmar(true); a.obter("anotacoes-lista").querySelectorAll("button")[1].disparar("click");
    assert.equal(JSON.parse(a.memoria.get("taskflow.biblioteca.anotacoes.v1")).anotacoes.length, 0);
    a.clicar("anotacoes-fechar"); assert.equal(a.obter("biblioteca-anotacoes").open, false); assert(a.obter("biblioteca-abrir-anotacoes").focado);
});


test("anotações orientam a selecionar um tópico quando a Biblioteca está no estado inicial", async () => {
    const a = await iniciar(); a.contexto(null); a.clicar("biblioteca-abrir-anotacoes");
    a.clicar("anotacoes-nova");
    assert.match(a.obter("anotacoes-status").textContent, /Selecione um tópico/);
    assert.equal(a.memoria.has("taskflow.biblioteca.anotacoes.v1"), false);
});
