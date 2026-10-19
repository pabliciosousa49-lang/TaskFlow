import test from "node:test";
import assert from "node:assert/strict";
import { iniciar } from "./dom-simulado.mjs";
import { conteudos as html } from "../../data/biblioteca/html/conteudos.js";
import { conteudos as css } from "../../data/biblioteca/css/conteudos.js";
import { conteudos as javascript } from "../../data/biblioteca/javascript/conteudos.js";
import { conteudos as typescript } from "../../data/biblioteca/typescript/conteudos.js";
import { conteudos as react } from "../../data/biblioteca/react/conteudos.js";

const catalogo = [html, css, javascript, typescript, react];
test("central integra os cinco modelos reais em linguagens, níveis e módulos sem IDs repetidos", () => {
    const { api, elementos } = iniciar("html", true);
    const niveis = elementos["#biblioteca-niveis"];
    assert.equal(niveis.querySelectorAll(".biblioteca-linguagem").length, 5);
    const quantidade = catalogo.flatMap(l => l.niveis.flatMap(n => [...n.modulos.flatMap(m => m.assuntos), ...n.assuntos])).length;
    assert.equal(niveis.querySelectorAll(".biblioteca-assunto").length, quantidade);
    const ids = niveis.querySelectorAll(".biblioteca-categoria-conteudo").map(e => e.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const linguagem of catalogo) {
        assert.equal(api.central.selecionarLinguagem(linguagem.id), true);
        assert.equal(api.central.selecionado().linguagem, linguagem.id);
        assert.equal(niveis.querySelectorAll(".biblioteca-assunto").filter(b => b.getAttribute("aria-current") === "true").length, 1);
        assert(elementos["#biblioteca-central-original"].href.endsWith(`${linguagem.id}.html`));
        assert(elementos["#biblioteca-central-breadcrumb"].textContent.startsWith(linguagem.nome));
    }
    assert.equal(api.central.selecionarLinguagem("docker"), false);
});

test("central pesquisa títulos de todas as linguagens e seleciona conteúdo correto desde o início", () => {
    const { api, elementos, mobile } = iniciar("html", true);
    const campo = elementos["#biblioteca-pesquisa-campo"], lista = elementos["#biblioteca-pesquisa-resultados"];
    for (const linguagem of catalogo) {
        const assunto = linguagem.niveis[0].modulos[0].assuntos[0];
        campo.value = assunto.titulo; campo.disparar("input");
        const resultado = lista.querySelectorAll("button").find(b => b.querySelector("span").textContent.startsWith(linguagem.nome));
        assert(resultado, linguagem.id);
        elementos["#biblioteca-leitura"].scrollTop = 800; mobile.matches = true; resultado.disparar("click");
        assert.equal(api.central.selecionado().linguagem, linguagem.id);
        assert.equal(api.central.selecionado().topico, assunto.id);
        assert.equal(elementos["#biblioteca-leitura"].scrollTop, 0);
        assert.equal(elementos["#biblioteca-menu"].hidden, true);
        const conteudo = elementos["#biblioteca-leitura"].querySelector(".biblioteca-conteudo");
        assert(conteudo.textContent.includes(assunto.explicacao));
        assert(conteudo.querySelectorAll("code").some(c => c.textContent === assunto.exemploCodigo));
        assert(conteudo.querySelector(".biblioteca-html-dica"));
    }
});

test("central preserva o conteúdo de todos os assuntos e permite copiar os exemplos", async () => {
    const { api, elementos, copias } = iniciar("html", true);
    const topicos = elementos["#biblioteca-niveis"].querySelectorAll(".biblioteca-assunto");
    const assuntos = catalogo.flatMap(l => l.niveis.flatMap(n => [...n.modulos.flatMap(m => m.assuntos), ...n.assuntos]));
    for (const [indice, assunto] of assuntos.entries()) {
        topicos[indice].disparar("click");
        const conteudo = elementos["#biblioteca-leitura"].querySelector(".biblioteca-conteudo");
        for (const texto of [assunto.explicacao, assunto.aplicacaoReal, ...assunto.responsabilidadeCodigo, ...assunto.boasPraticas]) assert(conteudo.textContent.includes(texto), assunto.id);
        const bloco = conteudo.querySelectorAll(".biblioteca-codigo").find(b => b.querySelector("code").textContent === assunto.exemploCodigo);
        assert(bloco, assunto.id); bloco.querySelector("button").disparar("click");
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(copias.at(-1), assunto.exemploCodigo);
    }
    for (const b of topicos) assert.equal(b.eventos.click.length, 1);
});
