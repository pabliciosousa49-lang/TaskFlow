import test from "node:test";
import assert from "node:assert/strict";
import { conteudos } from "../../data/biblioteca/html/conteudos.js";
import { iniciar } from "./dom-simulado.mjs";

const registros = conteudos.niveis.flatMap(nivel => nivel.modulos.flatMap(modulo => modulo.assuntos.map(assunto => ({ assunto, nivel, modulo }))));

test("HTML: 67 tópicos conservam ordem, explicações, códigos, prévias e orientações na nova apresentação", () => {
    const { api, elementos } = iniciar("html");
    const botoes = elementos["#biblioteca-niveis"].querySelectorAll(".biblioteca-assunto");
    assert.equal(botoes.length, 67);
    assert.deepEqual(botoes.map(b => b.textContent), registros.map(r => r.assunto.titulo));
    const dicas = [];
    for (const [indice, { assunto, nivel }] of registros.entries()) {
        api.selecionarAssunto(indice);
        const conteudo = elementos["#biblioteca-leitura"].querySelector(".biblioteca-conteudo");
        const secoes = conteudo.children.map(secao => secao.querySelector("h2")?.textContent);
        assert.deepEqual(secoes.slice(0, 4), ["Conceito", "Exemplo de código", "Entenda o exemplo", "💡Dica"], assunto.id);
        assert(conteudo.textContent.includes(assunto.explicacao), assunto.id);
        assert(conteudo.textContent.includes(assunto.aplicacaoReal), assunto.id);
        for (const texto of [...assunto.responsabilidadeCodigo, ...assunto.boasPraticas]) assert(conteudo.textContent.includes(texto), assunto.id);
        assert(conteudo.querySelectorAll("code").some(code => code.textContent === assunto.exemploCodigo), assunto.id);
        assert(conteudo.querySelectorAll("code").some(code => code.textContent === assunto.sintaxe), assunto.id);
        assert.equal(Boolean(conteudo.querySelector("iframe")), assunto.resultadoVisual && assunto.contextoExemplo !== "head", assunto.id);
        assert.equal(elementos["#biblioteca-html-breadcrumb"].textContent, `HTML › ${nivel.nome} › ${assunto.titulo}`);
        assert.equal(botoes.filter(b => b.getAttribute("aria-current") === "true").length, 1);
        dicas.push(conteudo.querySelector(".biblioteca-html-dica").querySelector("p").textContent);
    }
    assert.equal(new Set(dicas).size, 67, "dicas específicas, sem repetição entre assuntos");
});

test("HTML: numeração fica fora do código e a cópia preserva o exemplo original", async () => {
    const { api, elementos, copias } = iniciar("html");
    api.selecionarAssunto(2);
    const exemplo = registros[2].assunto.exemploCodigo;
    const blocos = elementos["#biblioteca-leitura"].querySelectorAll(".biblioteca-codigo");
    const bloco = blocos.find(b => b.querySelector("code").textContent === exemplo);
    const linhas = bloco.querySelector(".biblioteca-html-linhas");
    assert.equal(linhas.textContent, exemplo.split("\n").map((_, i) => i + 1).join("\n"));
    assert.equal(linhas.getAttribute("aria-hidden"), "true");
    bloco.querySelector("button").disparar("click");
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(copias.at(-1), exemplo);
    assert.equal(bloco.querySelector(".biblioteca-copia-resultado").textContent, "Código copiado.");
});

test("HTML: níveis podem recolher e selecionar novamente reabre o módulo sem duplicar listeners", () => {
    const { api, elementos } = iniciar("html");
    const categorias = elementos["#biblioteca-niveis"].querySelectorAll(".biblioteca-categoria");
    for (const categoria of categorias) {
        categoria.disparar("click"); assert.equal(categoria.getAttribute("aria-expanded"), "true");
        categoria.disparar("click"); assert.equal(categoria.getAttribute("aria-expanded"), "false");
        assert.equal(categoria.eventos.click.length, 1);
    }
    api.selecionarAssunto(0);
    const modulo = elementos["#biblioteca-niveis"].querySelector("details");
    assert.equal(modulo.open, true); modulo.open = false;
    elementos["#biblioteca-leitura"].scrollTop = 700;
    api.selecionarAssunto(0);
    assert.equal(modulo.open, true);
    assert.equal(elementos["#biblioteca-leitura"].scrollTop, 0);
    const topico = elementos["#biblioteca-niveis"].querySelector(".biblioteca-assunto");
    assert.equal(topico.eventos.click.length, 1);
});
