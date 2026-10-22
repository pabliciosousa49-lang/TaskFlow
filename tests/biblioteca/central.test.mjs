import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { Elemento, iniciar } from "./dom-simulado.mjs";
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
        const grupo = niveis.querySelectorAll(".biblioteca-linguagem")[catalogo.indexOf(linguagem)];
        assert.equal(grupo.open, true);
        grupo.querySelector(".biblioteca-assunto").disparar("click");
        assert.equal(api.central.selecionado().linguagem, linguagem.id);
        assert.equal(niveis.querySelectorAll(".biblioteca-assunto").filter(b => b.getAttribute("aria-current") === "true").length, 1);
        assert(elementos["#biblioteca-central-original"].href.endsWith(`${linguagem.id}.html`));
        assert(elementos["#biblioteca-central-breadcrumb"].textContent.startsWith(linguagem.nome));
        api.central.reiniciar();
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


test("central inicia vazia e reinicia sem recriar eventos nem manter seleção ou pesquisa", () => {
    const { api, elementos, nav } = iniciar("html", true);
    const guia = elementos["#biblioteca-niveis"];
    const conferirInicio = () => {
        assert.equal(api.central.selecionado(), null);
        assert.equal(elementos["#biblioteca-vazio-titulo"].textContent, "Selecione uma linguagem");
        assert.equal(elementos["#biblioteca-vazio-descricao"].textContent, "Escolha uma linguagem no Guia de Estudos para consultar sua documentação.");
        assert.equal(elementos["#biblioteca-central-cabecalho"].hidden, true);
        assert.equal(elementos["#biblioteca-estado-vazio"].hidden, false);
        assert.equal(nav.hidden, true);
        assert(guia.querySelectorAll("details").every(d => !d.open));
        assert(guia.querySelectorAll(".biblioteca-categoria-conteudo").every(d => d.hidden));
        assert(guia.querySelectorAll(".biblioteca-categoria").every(d => d.getAttribute("aria-expanded") === "false"));
        assert(guia.querySelectorAll(".biblioteca-assunto").every(d => !d.hasAttribute("aria-current")));
    };
    conferirInicio();
    const grupo = guia.querySelectorAll(".biblioteca-linguagem")[2];
    grupo.querySelector("summary").disparar("click", { preventDefault() {} });
    assert.equal(api.central.selecionado().linguagem, "javascript");
    assert.equal(api.central.selecionado().topico, javascript.niveis[0].modulos[0].assuntos[0].id);
    const categoria = grupo.querySelector(".biblioteca-categoria");
    categoria.disparar("click"); assert.equal(categoria.getAttribute("aria-expanded"), "false");
    categoria.disparar("click"); assert.equal(categoria.getAttribute("aria-expanded"), "true");
    for (let i = 0; i < 3; i++) {
        grupo.querySelector(".biblioteca-assunto").disparar("click");
        assert.equal(elementos["#biblioteca-central-cabecalho"].hidden, false);
        const campo = elementos["#biblioteca-pesquisa-campo"]; campo.value = "React"; campo.disparar("input");
        api.central.reiniciar(); conferirInicio();
        assert.equal(campo.value, "");
        assert.equal(elementos["#biblioteca-pesquisa-resultados"].hidden, true);
        assert.equal(elementos["#biblioteca-leitura"].querySelector(".biblioteca-conteudo").children.length, 0);
    }
    for (const b of guia.querySelectorAll(".biblioteca-assunto")) assert.equal(b.eventos.click.length, 1);
    assert.equal(elementos["#biblioteca-pesquisa-campo"].eventos.input.length, 1);
});

test("pesquisa central expande linguagens, níveis e módulos temporariamente e restaura o guia", () => {
    const { api, elementos } = iniciar("html", true);
    const guia = elementos["#biblioteca-niveis"], linguagens = guia.querySelectorAll(".biblioteca-linguagem");
    const campo = elementos["#biblioteca-pesquisa-campo"], limpar = elementos["#biblioteca-pesquisa-limpar"];
    linguagens[2].open = true;
    linguagens[2].querySelector(".biblioteca-categoria").disparar("click");
    linguagens[2].querySelector(".biblioteca-modulo").open = true;
    const estado = () => guia.querySelectorAll("details").map(d => Boolean(d.open));
    const antes = estado();
    for (const termo of ["React", "TypeScript", "Básico", "Intermediário", "Avançado", "React Básico"]) {
        campo.value = termo; campo.disparar("input");
        const resultados = api.pesquisarAssuntos(termo);
        assert(resultados.length > 0, termo);
        for (const { registro } of resultados) {
            assert.equal(linguagens[catalogo.findIndex(l => l.id === registro.tecnologia)].open, true);
            assert.equal(registro.painel.hidden, false);
            assert.equal(registro.categoria.getAttribute("aria-expanded"), "true");
            assert.equal(registro.detalhes.open, true);
        }
        assert.equal(api.central.selecionado(), null);
    }
    campo.value = "inexistente-nenhum"; campo.disparar("input");
    assert.equal(elementos["#biblioteca-pesquisa-resultados"].hidden, true);
    limpar.disparar("click"); assert.deepEqual(estado(), antes);
    assert.equal(linguagens[2].querySelector(".biblioteca-categoria").getAttribute("aria-expanded"), "true");
    assert.equal(linguagens[4].querySelector(".biblioteca-categoria").getAttribute("aria-expanded"), "false");
    campo.value = "React Básico"; campo.disparar("input");
    elementos["#biblioteca-pesquisa-resultados"].querySelector("button").disparar("click");
    limpar.disparar("click");
    assert.equal(api.central.selecionado().linguagem, "react");
    assert.equal(linguagens[4].open, true);
    assert.equal(linguagens[4].querySelector(".biblioteca-categoria").getAttribute("aria-expanded"), "true");
    assert.equal(guia.querySelectorAll(".biblioteca-assunto").filter(b => b.getAttribute("aria-current") === "true").length, 1);
});

test("navegação principal reinicia a Biblioteca sem interferir no histórico ou nos links modificados", async () => {
    const elementos = new Map(["abrir-biblioteca", "acessar-biblioteca", "biblioteca-central", "biblioteca-integracao-status"].map(id => [id, new Elemento()]));
    let reinicios = 0;
    const biblioteca = { catalogo, reiniciar() { reinicios++; }, selecionado() { return null; } };
    const ctx = vm.createContext({ document: { getElementById: id => elementos.get(id), querySelectorAll: () => [] } });
    const central = new vm.SourceTextModule(readFileSync(new URL("../../js/biblioteca/central.js", import.meta.url), "utf8"), { context: ctx });
    const renderer = new vm.SyntheticModule(["iniciarBibliotecaCentral"], function () { this.setExport("iniciarBibliotecaCentral", async () => biblioteca); }, { context: ctx });
    const notas = new vm.SyntheticModule(["iniciarAnotacoes"], function () { this.setExport("iniciarAnotacoes", () => {}); }, { context: ctx });
    await central.link(s => s === "./biblioteca.js" ? renderer : notas); await central.evaluate();
    for (const id of ["abrir-biblioteca", "acessar-biblioteca"]) {
        const controle = elementos.get(id);
        controle.disparar("click", { ctrlKey: true }); controle.disparar("click", { button: 1 });
        assert.equal(reinicios, id === "abrir-biblioteca" ? 0 : 1);
        controle.disparar("click");
    }
    assert.equal(reinicios, 2);
    assert.equal(elementos.get("biblioteca-integracao-status").textContent, "");
});


test("clicar na linguagem abre sua introdução na central e recolher não troca o tópico ativo", () => {
    const { api, elementos } = iniciar("html", true);
    const grupos = elementos["#biblioteca-niveis"].querySelectorAll(".biblioteca-linguagem");
    for (const [i, dados] of catalogo.entries()) {
        api.central.reiniciar();
        const resumo = grupos[i].querySelector("summary");
        elementos["#biblioteca-menu"].scrollTop = 130;
        elementos["#biblioteca-leitura"].scrollTop = 850;
        let prevenido = false;
        resumo.disparar("click", { preventDefault() { prevenido = true; } });
        assert(prevenido); assert.equal(grupos[i].open, true);
        const primeiro = dados.niveis[0].modulos[0].assuntos[0];
        assert.equal(api.central.selecionado().linguagem, dados.id);
        assert.equal(api.central.selecionado().topico, primeiro.id);
        assert.equal(elementos["#biblioteca-estado-vazio"].hidden, true);
        assert.equal(elementos["#biblioteca-leitura"].scrollTop, 0);
        assert.equal(elementos["#biblioteca-menu"].scrollTop, 130);
        const conteudo = elementos["#biblioteca-leitura"].querySelector(".biblioteca-conteudo");
        assert(conteudo.textContent.includes(primeiro.explicacao));
        if (i >= 2) {
            assert.equal(conteudo.querySelector("h2").textContent, "Conceito");
            assert(conteudo.querySelectorAll("h2").some(h => h.textContent === "Entenda o exemplo"));
        }
        const topicos = grupos[i].querySelectorAll(".biblioteca-assunto");
        topicos[1].disparar("click");
        const selecionado = api.central.selecionado().topico;
        resumo.disparar("click", { preventDefault() {} });
        assert.equal(grupos[i].open, false);
        assert.equal(api.central.selecionado().topico, selecionado);
        assert.equal(elementos["#biblioteca-niveis"].querySelectorAll(".biblioteca-assunto").filter(b => b.getAttribute("aria-current") === "true").length, 1);
        resumo.disparar("click", { preventDefault() {} });
        assert.equal(grupos[i].open, true); assert.equal(api.central.selecionado().topico, primeiro.id);
    }
});

test("seleções da central e de uma documentação própria não compartilham estado", () => {
    const central = iniciar("html", true), roleta = iniciar("react");
    roleta.api.selecionarAssunto(3, false);
    const tituloRoleta = roleta.elementos["#biblioteca-titulo"].textContent;
    central.api.central.selecionarLinguagem("javascript");
    assert.equal(roleta.elementos["#biblioteca-titulo"].textContent, tituloRoleta);
    assert.equal(central.api.central.selecionado().linguagem, "javascript");
    const tituloCentral = central.elementos["#biblioteca-titulo"].textContent;
    roleta.api.selecionarAssunto(5);
    assert.equal(central.elementos["#biblioteca-titulo"].textContent, tituloCentral);
    central.api.central.reiniciar();
    assert.equal(roleta.elementos["#biblioteca-titulo"].textContent, react.niveis[0].modulos.flatMap(m => m.assuntos)[5].titulo);
});


test("ocultar conteúdo limpa a leitura e seleção, preserva guia e pesquisa e permite reabrir tópicos", () => {
    const { api, elementos, nav } = iniciar("html", true);
    api.central.selecionarLinguagem("javascript");
    const guia = elementos["#biblioteca-niveis"], campo = elementos["#biblioteca-pesquisa-campo"];
    campo.value = "React"; campo.disparar("input");
    const abertos = guia.querySelectorAll("details").map(d => Boolean(d.open));
    elementos["#biblioteca-menu"].scrollTop = 220;
    const ocultar = elementos["#biblioteca-ocultar-conteudo"];
    for (let i = 0; i < 2; i++) {
        ocultar.disparar("click");
        assert.equal(api.central.selecionado(), null);
        assert.equal(elementos["#biblioteca-central-cabecalho"].hidden, true);
        assert.equal(elementos["#biblioteca-estado-vazio"].hidden, false);
        assert.equal(elementos["#biblioteca-leitura"].querySelector(".biblioteca-conteudo").children.length, 0);
        assert.equal(nav.hidden, true);
        assert.equal(campo.value, "React");
        assert.equal(elementos["#biblioteca-menu"].scrollTop, 220);
        assert.deepEqual(guia.querySelectorAll("details").map(d => Boolean(d.open)), abertos);
        assert(guia.querySelectorAll(".biblioteca-assunto").every(b => !b.hasAttribute("aria-current")));
        assert.equal(elementos["#biblioteca-leitura"].opcoesFoco.preventScroll, true);
        elementos["#biblioteca-pesquisa-resultados"].querySelector("button").disparar("click");
        assert.equal(elementos["#biblioteca-central-cabecalho"].hidden, false);
        assert.equal(api.central.selecionado().linguagem, "react");
    }
    assert.equal(ocultar.eventos.click.length, 1);
});
