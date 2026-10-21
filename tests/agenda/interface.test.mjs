import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { Elemento } from "../biblioteca/dom-simulado.mjs";

// Exercita os eventos reais da Agenda em DOM simulado, sem substituir QA visual.
function iniciar(dados = "[]", urlInicial = "https://taskflow.test/index.html", instante = Date.now()) {
    const fonte = readFileSync(new URL("../../js/core/app.js", import.meta.url), "utf8");
    const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
    const elementos = new Map();
    const eventosDocumento = {}, eventosJanela = {};
    const entradas = [{ url: urlInicial, state: null }];
    let indice = 0, agora = instante, proximoTimer = 0;
    const temporizadores = new Map();
    class Relogio extends Date {
        constructor(...args) { super(...(args.length ? args : [agora])); }
        static now() { return agora; }
    }
    function elemento(tag = "div") {
        const e = new Elemento(tag);
        const classes = new Set();
        e.classList = { add: (...nomes) => nomes.forEach(n => classes.add(n)), remove: (...nomes) => nomes.forEach(n => classes.delete(n)), contains: n => classes.has(n) };
        e.style = { setProperty() {}, removeProperty() {} };
        e.setCustomValidity = valor => { e.validacao = valor; };
        e.reportValidity = () => !e.validacao;
        e.closest = seletor => {
            if (seletor === "[data-taskflow-voltar]") return e.id === "biblioteca-voltar" ? e : null;
            if (seletor === "button[data-data]") return e.dataset.data ? e : null;
            if (seletor === "button[data-acao]") return e.dataset.acao ? e : null;
            return null;
        };
        return e;
    }
    for (const [, id] of html.matchAll(/\bid="([^"]+)"/g)) { const e = elemento(); e.id = id; elementos.set(`#${id}`, e); }
    const campos = ["titulo", "descricao", "data", "hora"].map(c => elementos.get(`#compromisso-${c}`));
    const formulario = elementos.get("#formulario-compromisso");
    formulario.reset = () => campos.forEach(c => { c.value = ""; });
    formulario.reportValidity = () => campos.every(c => !c.validacao);
    const armazenamento = new Map([["taskflow.agenda.compromissos.v1", dados]]);
    const document = {
        documentElement: elemento(),
        currentScript: { src: "https://taskflow.test/js/core/navegacao.js" }, referrer: "",
        querySelector: s => elementos.get(s), querySelectorAll: () => [],
        createElement: tag => elemento(tag), addEventListener: (tipo, fn) => { (eventosDocumento[tipo] ??= []).push(fn); }
    };
    let id = 0;
    const contexto = vm.createContext({
        document, Date: Relogio, URL,
        setTimeout: (fn, atraso) => { const id = ++proximoTimer; temporizadores.set(id, { fn, quando: agora + atraso }); return id; },
        clearTimeout: id => temporizadores.delete(id),
        sessionStorage: { getItem: () => null, removeItem() {}, setItem() {} },
        localStorage: { getItem: k => armazenamento.get(k) ?? null, setItem: (k, v) => armazenamento.set(k, v) },
        crypto: { randomUUID: () => `novo-${++id}` },
        window: {
            location: { get href() { return entradas[indice].url; }, replace(url) { entradas[indice] = { url, state: null }; } },
            history: {
                get length() { return entradas.length; }, get state() { return entradas[indice].state; },
                replaceState(state, _, url) { entradas[indice] = { url, state }; },
                pushState(state, _, url) { entradas.splice(indice + 1); entradas.push({ url, state }); indice++; },
                back() { if (indice) { indice--; for (const fn of eventosJanela.popstate || []) fn(); } }
            },
            matchMedia: () => ({ matches: true }), scrollY: 0, scrollTo() {}, confirm: () => true,
            addEventListener: (tipo, fn) => { (eventosJanela[tipo] ??= []).push(fn); }
        }
    });
    vm.runInContext(readFileSync(new URL("../../js/core/navegacao.js", import.meta.url), "utf8"), contexto);
    vm.runInContext(fonte, contexto);
    const obter = id => elementos.get(`#${id}`);
    const clicar = id => {
        const evento = { currentTarget: obter(id), target: obter(id), button: 0, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
        obter(id).disparar("click", evento);
        for (const fn of eventosDocumento.click || []) fn(evento);
    };
    const selecionar = data => {
        const alvo = elemento(); alvo.dataset.data = data;
        obter("agenda-dias").disparar("click", { target: alvo });
    };
    const acao = (acao, id, lista = "lista-compromissos") => {
        const alvo = elemento(); alvo.dataset = { acao, id };
        obter(lista).disparar("click", { target: alvo });
    };
    const salvar = (titulo, data, hora = "10:00") => {
        obter("compromisso-titulo").value = titulo;
        obter("compromisso-data").value = data;
        obter("compromisso-hora").value = hora;
        formulario.disparar("submit", { preventDefault() {} });
    };
    const filtrar = value => { obter("agenda-filtro-status").value = value; obter("agenda-filtro-status").disparar("change", { target: { value } }); };
    const avancar = ms => {
        agora += ms;
        for (const [id, timer] of [...temporizadores]) if (timer.quando <= agora) { temporizadores.delete(id); timer.fn(); }
    };
    return { obter, clicar, selecionar, acao, salvar, filtrar, avancar, storage: contexto.localStorage, armazenamento, historico: contexto.window.history, location: contexto.window.location };
}

test("Agenda filtra por dia, atualiza quantidade e preserva marcadores e navegação mensal", () => {
    const hoje = new Date();
    const data = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
    const registros = [
        { id: "a", titulo: "Hoje", descricao: "", data, hora: "09:00" },
        { id: "b", titulo: "Outra data", descricao: "", data: "2040-02-01", hora: "08:00" }
    ];
    const a = iniciar(JSON.stringify(registros));
    assert.equal(a.obter("agenda-quantidade").textContent, "1 compromisso");
    assert.match(a.obter("lista-compromissos").textContent, /Hoje/);
    assert.doesNotMatch(a.obter("lista-compromissos").textContent, /Outra data/);
    const dia = a.obter("agenda-dias").children.find(e => e.dataset.data === data);
    assert.equal(dia.getAttribute("aria-current"), "date");
    assert.equal(dia.getAttribute("aria-pressed"), "true");
    assert.match(dia.className, /com-compromisso/);
    const mes = a.obter("agenda-mes").textContent;
    a.clicar("mes-seguinte"); assert.notEqual(a.obter("agenda-mes").textContent, mes);
    a.clicar("mes-anterior"); assert.equal(a.obter("agenda-mes").textContent, mes);
    a.selecionar("2040-02-02");
    assert.equal(a.obter("agenda-quantidade").textContent, "0 compromissos");
    assert.equal(a.obter("lista-compromissos").textContent, "Nenhum compromisso para este dia.");
    assert.equal(a.obter("formulario-compromisso").hidden, false);
});

test("Agenda mantém abertura, cadastro, edição, cancelamento, exclusão e persistência", () => {
    const a = iniciar();
    a.clicar("abrir-agenda"); assert.equal(a.obter("painel-agenda").open, true);
    a.selecionar("2040-02-02");
    a.salvar("Estudar CSS", "2040-02-02");
    a.salvar("Estudar HTML", "2040-02-02", "11:00");
    assert.equal(a.obter("agenda-quantidade").textContent, "2 compromissos");
    const chave = "taskflow.agenda.compromissos.v1";
    const recarregada = iniciar(a.armazenamento.get(chave)); recarregada.selecionar("2040-02-02");
    assert.equal(recarregada.obter("agenda-quantidade").textContent, "2 compromissos");
    a.acao("editar", "novo-1"); assert.equal(a.obter("compromisso-titulo").value, "Estudar CSS");
    a.salvar("Revisar CSS", "2040-02-03");
    assert.equal(a.obter("agenda-quantidade").textContent, "1 compromisso");
    a.acao("editar", "novo-1"); a.clicar("cancelar-compromisso");
    assert.equal(a.obter("formulario-compromisso").hidden, true);
    a.acao("excluir", "novo-1");
    assert.equal(a.obter("agenda-quantidade").textContent, "0 compromissos");
    assert.equal(JSON.parse(a.armazenamento.get(chave)).length, 1);
    a.clicar("fechar-agenda"); assert.equal(a.obter("painel-agenda").open, false);
    assert.equal(a.obter("abrir-agenda").focado, true);
});

test("Agenda rejeita campos inválidos e preserva armazenamento ilegível", () => {
    const a = iniciar(); a.selecionar("2040-02-02");
    a.salvar(" ", "2040-02-30", "25:00");
    assert.equal(a.armazenamento.get("taskflow.agenda.compromissos.v1"), "[]");
    assert.ok(a.obter("compromisso-data").validacao);
    const bloqueada = iniciar("dados ilegíveis");
    assert.equal(bloqueada.obter("salvar-compromisso").disabled, true);
    bloqueada.salvar("Estudar", "2040-02-02");
    assert.equal(bloqueada.armazenamento.get("taskflow.agenda.compromissos.v1"), "dados ilegíveis");
});

test("Biblioteca abre pelos dois acessos sem duplicar as views", () => {
    const a = iniciar();
    for (const acesso of ["abrir-biblioteca", "acessar-biblioteca"]) {
        a.clicar(acesso);
        assert.ok(a.obter("view-biblioteca").classList.contains("view-ativa"));
        assert.ok(a.obter("view-biblioteca").classList.contains("biblioteca-entrada"));
        assert.equal(a.obter("abrir-biblioteca").getAttribute("aria-current"), "page");
        assert.equal(a.obter("view-taskflow").classList.contains("view-ativa"), false);
        a.clicar("biblioteca-voltar");
        assert.ok(a.obter("view-home").classList.contains("view-ativa"));
        assert.equal(a.obter("view-biblioteca").classList.contains("view-ativa"), false);
    }
    a.clicar("abrir-home");
    assert.ok(a.obter("view-home").classList.contains("view-ativa"));
    assert.equal(a.obter("view-taskflow").classList.contains("view-ativa"), false);
});

test("cards da Home não direcionam nem abrem a Agenda", () => {
    const a = iniciar();
    const tamanho = a.historico.length;
    for (const id of ["home-explorar", "home-agenda", "home-carreira"]) {
        a.clicar(id);
        assert.ok(a.obter("view-home").classList.contains("view-ativa"));
        assert.equal(a.obter("painel-agenda").open, undefined);
        assert.equal(a.historico.length, tamanho);
    }
    const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
    const cards = html.match(/<div[^>]*class="home-guia-card"[^>]*>/g);
    assert.equal(cards.length, 4);
    for (const card of cards) assert.doesNotMatch(card, /href=|aria-haspopup=/);
});

test("Voltar restaura Biblioteca → TaskFlow → Home e modais não criam páginas", () => {
    const a = iniciar();
    a.clicar("abrir-taskflow");
    const tamanho = a.historico.length;
    a.clicar("abrir-agenda"); a.clicar("fechar-agenda");
    assert.equal(a.historico.length, tamanho);
    a.clicar("abrir-biblioteca");
    a.clicar("biblioteca-voltar");
    assert.ok(a.obter("view-taskflow").classList.contains("view-ativa"));
    a.historico.back();
    assert.ok(a.obter("view-home").classList.contains("view-ativa"));
});

test("favorito antigo da Carreira abre a página independente preservando parâmetros", () => {
    const a = iniciar("[]", "https://taskflow.test/index.html?origem=atalho#taskflow-carreira");
    assert.equal(a.location.href, "https://taskflow.test/pages/carreira.html?origem=atalho");
    assert.equal(a.historico.length, 1);
});

test("Agenda navega para 2027, indica feriados e fins de semana sem alterar compromissos", () => {
    const a = iniciar();
    for (let i = 0; i < new Date().getMonth(); i++) a.clicar("mes-anterior");
    const ano = a.obter("agenda-ano");
    ano.value = "2027";
    ano.disparar("change", { target: ano });
    assert.match(a.obter("agenda-mes").textContent, /2027/);
    const dias = a.obter("agenda-dias").children;
    const feriado = dias.find(e => e.dataset.data === "2027-01-01");
    assert.match(feriado.className, /agenda-feriado/);
    assert.match(feriado.getAttribute("aria-label"), /feriado nacional: Confraternização Universal/);
    assert.match(a.obter("agenda-feriados").textContent, /01\/01 — Confraternização Universal/);
    const sabado = dias.find(e => e.dataset.data === "2027-01-02");
    assert.match(sabado.className, /agenda-fim-semana/);
    assert.match(sabado.getAttribute("aria-label"), /fim de semana/);
    assert.doesNotMatch(sabado.className, /agenda-feriado/);
    for (let i = 0; i < 12; i++) a.clicar("mes-seguinte");
    assert.match(a.obter("agenda-mes").textContent, /2028/);
    a.clicar("mes-anterior"); assert.match(a.obter("agenda-mes").textContent, /2027/);
    ano.value = "0"; ano.disparar("change", { target: ano });
    assert.ok(ano.validacao);
    assert.match(a.obter("agenda-mes").textContent, /2027/);
    assert.equal(a.armazenamento.get("taskflow.agenda.compromissos.v1"), "[]");
});

const chaveCompromissos = "taskflow.agenda.compromissos.v1";
const instanteAgenda = new Date(2040, 1, 2, 10, 0, 0).getTime();
const eventoAgenda = (id, hora, extras = {}) => ({ id, titulo: id, descricao: "Descrição de " + id, data: "2040-02-02", hora, ...extras });
const cardsAgenda = (a, lista = "lista-compromissos") => a.obter(lista).children.filter(item => item.dataset.compromisso);

test("eventos exibem descrição completa e segura, ordenam futuros pendentes e abrem a data na Agenda", () => {
    const descricao = '<script>alert("inofensivo")</script>\n' + "Uma descrição longa com todas as orientações. ".repeat(25);
    const registros = [eventoAgenda("Tarde", "12:00"), eventoAgenda("Expirado", "09:59"), eventoAgenda("Agora", "10:00", { descricao }),
        eventoAgenda("Concluído", "13:00", { concluidoEm: new Date(instanteAgenda - 5000).toISOString() }), eventoAgenda("Manhã", "11:00", { descricao: "" }), eventoAgenda("Depois", "14:00")];
    const texto = JSON.stringify(registros), a = iniciar(texto, undefined, instanteAgenda);
    assert.deepEqual(cardsAgenda(a, "lista-eventos").map(c => c.dataset.compromisso), ["Agora", "Manhã", "Tarde"]);
    const card = cardsAgenda(a, "lista-eventos")[0];
    assert.equal(card.querySelector(".eventos-descricao-texto").textContent, descricao);
    assert.equal(card.querySelector("details"), null);
    assert.equal(card.querySelector(".eventos-info-data").querySelector("time").dateTime, "2040-02-02");
    assert.equal(card.querySelector(".eventos-info-hora").querySelector("time").textContent, "10:00");
    assert.equal(card.querySelector(".eventos-dia-semana").textContent, new Date(2040, 1, 2, 12).toLocaleDateString("pt-BR", { weekday: "long" }));
    assert.equal(card.querySelector("script"), null);
    assert.equal(cardsAgenda(a, "lista-eventos")[1].querySelector(".eventos-descricao-texto").textContent, "Nenhuma descrição cadastrada");
    assert.equal(a.obter("evento-abrir-unico").hidden, true);
    for (const item of cardsAgenda(a, "lista-eventos")) assert.equal(item.querySelector("button").dataset.id, item.dataset.compromisso);
    a.filtrar("concluido");
    a.acao("abrir", "Agora", "lista-eventos");
    assert.equal(a.obter("painel-agenda").open, true);
    assert.equal(a.obter("agenda-filtro-status").value, "todos");
    assert.equal(cardsAgenda(a).find(c => c.dataset.compromisso === "Agora").dataset.destaque, "true");
    assert.equal(a.obter("formulario-compromisso").hidden, true);
    assert.equal(a.armazenamento.get(chaveCompromissos), texto, "consulta não migra nem regrava dados antigos");
});

test("criação com descrição, conclusão, edição e reabertura persistem sem perder campos ou registros antigos", () => {
    const antigo = eventoAgenda("Antigo", "13:00", { campoPreservado: "original" });
    const a = iniciar(JSON.stringify([antigo]), undefined, instanteAgenda);
    a.obter("compromisso-descricao").value = "Linha um\nLinha dois";
    a.salvar("Estudar", "2040-02-02", "12:00");
    assert.match(a.obter("lista-eventos").textContent, /Linha um\nLinha dois/);
    a.acao("concluir", "novo-1");
    let salvos = JSON.parse(a.armazenamento.get(chaveCompromissos));
    assert.equal(salvos.find(c => c.id === "novo-1").concluidoEm, new Date(instanteAgenda).toISOString());
    assert.deepEqual(salvos[0], antigo);
    assert(!cardsAgenda(a, "lista-eventos").some(c => c.dataset.compromisso === "novo-1"));
    a.filtrar("concluido"); assert.equal(cardsAgenda(a).length, 1); assert.equal(cardsAgenda(a)[0].dataset.status, "concluido");
    a.acao("editar", "novo-1"); a.salvar("Revisar", "2040-02-02", "12:30");
    salvos = JSON.parse(a.armazenamento.get(chaveCompromissos));
    assert.equal(salvos[1].descricao, "Linha um\nLinha dois"); assert.equal(salvos[1].concluidoEm, new Date(instanteAgenda).toISOString());
    const recarregada = iniciar(a.armazenamento.get(chaveCompromissos), undefined, instanteAgenda);
    assert.equal(cardsAgenda(recarregada).find(c => c.dataset.compromisso === "novo-1").dataset.status, "concluido");
    recarregada.acao("reabrir", "novo-1");
    assert.equal(cardsAgenda(recarregada).find(c => c.dataset.compromisso === "novo-1").dataset.status, "pendente");
    assert(cardsAgenda(recarregada, "lista-eventos").some(c => c.dataset.compromisso === "novo-1"));
    assert(!Object.hasOwn(JSON.parse(recarregada.armazenamento.get(chaveCompromissos))[1], "concluidoEm"));
    recarregada.acao("excluir", "novo-1"); assert.deepEqual(JSON.parse(recarregada.armazenamento.get(chaveCompromissos)), [antigo]);
});

test("expiração usa data/hora local, atualiza automaticamente e conclusão prevalece mesmo depois do prazo", () => {
    const registros = [eventoAgenda("Limite", "10:00"), eventoAgenda("Realizado", "09:00", { concluidoEm: new Date(instanteAgenda - 3600000).toISOString() })];
    const texto = JSON.stringify(registros), a = iniciar(texto, undefined, instanteAgenda);
    a.clicar("abrir-agenda");
    const card = cardsAgenda(a).find(c => c.dataset.compromisso === "Limite");
    assert.equal(card.dataset.status, "pendente"); card.querySelector("details").open = true;
    a.avancar(1);
    const expirado = cardsAgenda(a).find(c => c.dataset.compromisso === "Limite");
    assert.equal(expirado.dataset.status, "expirado"); assert.equal(expirado.querySelector("details").open, true);
    assert.match(expirado.textContent, /Horário previsto encerrado/);
    assert.equal(cardsAgenda(a).find(c => c.dataset.compromisso === "Realizado").dataset.status, "concluido");
    assert.equal(cardsAgenda(a, "lista-eventos").length, 0); assert.equal(a.armazenamento.get(chaveCompromissos), texto);
    a.filtrar("expirado"); assert.equal(cardsAgenda(a).length, 1);
    a.acao("concluir", "Limite"); assert.equal(cardsAgenda(a).length, 0);
    a.filtrar("concluido"); assert.equal(cardsAgenda(a).length, 2);
    a.acao("reabrir", "Limite"); assert.equal(cardsAgenda(a).length, 1);
    a.filtrar("expirado"); assert.equal(cardsAgenda(a)[0].dataset.status, "expirado");
    a.filtrar("pendente"); assert.equal(cardsAgenda(a).length, 0);
    a.filtrar("todos"); assert.equal(cardsAgenda(a).length, 2);
});

test("falhas de gravação e metadados inválidos preservam os dados e ações desconhecidas não excluem", () => {
    const texto = JSON.stringify([eventoAgenda("Salvar", "11:00")]), a = iniciar(texto, undefined, instanteAgenda);
    const gravar = a.storage.setItem; a.storage.setItem = () => { throw new Error("quota"); };
    a.acao("concluir", "Salvar");
    assert.equal(a.armazenamento.get(chaveCompromissos), texto); assert.equal(cardsAgenda(a)[0].dataset.status, "pendente");
    assert.match(a.obter("agenda-aviso").textContent, /Não foi possível salvar/);
    a.storage.setItem = gravar; a.acao("desconhecida", "Salvar"); assert.equal(a.armazenamento.get(chaveCompromissos), texto);
    a.acao("concluir", "Salvar"); const concluido = a.armazenamento.get(chaveCompromissos);
    a.storage.setItem = () => { throw new Error("quota"); }; a.acao("reabrir", "Salvar");
    assert.equal(a.armazenamento.get(chaveCompromissos), concluido); assert.equal(cardsAgenda(a)[0].dataset.status, "concluido");
    const invalido = JSON.stringify([eventoAgenda("Inválido", "11:00", { concluidoEm: "inválido" })]);
    const bloqueada = iniciar(invalido, undefined, instanteAgenda); bloqueada.salvar("Novo", "2040-02-02");
    assert.equal(bloqueada.armazenamento.get(chaveCompromissos), invalido); assert.equal(bloqueada.obter("salvar-compromisso").disabled, true);
});

test("janela: evento único usa ação no rodapé, fecha com X/Esc e abre Agenda completa separadamente", () => {
    const descricao = "Texto completo\n" + "Orientação detalhada. ".repeat(60);
    const texto = JSON.stringify([eventoAgenda("Único", "11:00", { descricao })]);
    const a = iniciar(texto, undefined, instanteAgenda);
    a.clicar("alternar-eventos");
    assert.equal(a.obter("painel-eventos").hidden, false);
    assert.equal(a.obter("alternar-eventos").getAttribute("aria-expanded"), "true");
    assert.equal(a.obter("fechar-eventos").focado, true);
    assert.equal(a.obter("evento-abrir-unico").hidden, false);
    assert.equal(a.obter("evento-abrir-unico").dataset.id, "Único");
    const card = cardsAgenda(a, "lista-eventos")[0];
    assert.equal(card.querySelector(".eventos-descricao-texto").textContent, descricao);
    assert.equal(card.querySelectorAll("button").length, 0, "ação única fica apenas no rodapé");
    assert.doesNotMatch(card.textContent, /Ver detalhes|Mais detalhes/);
    assert.match(card.textContent, /Pendente/);
    a.clicar("fechar-eventos"); assert.equal(a.obter("painel-eventos").hidden, true);
    assert.equal(a.obter("alternar-eventos").focado, true);
    a.clicar("alternar-eventos");
    let prevenido = false; a.obter("painel-eventos").disparar("keydown", { key: "Escape", preventDefault() { prevenido = true; } });
    assert(prevenido); assert.equal(a.obter("painel-eventos").hidden, true);
    a.clicar("alternar-eventos"); a.acao("abrir", "Único", "evento-abrir-unico");
    assert.equal(a.obter("painel-agenda").open, true);
    assert.equal(cardsAgenda(a)[0].dataset.destaque, "true");
    a.clicar("fechar-agenda"); a.clicar("agenda-completa");
    assert.equal(a.obter("painel-agenda").open, true);
    assert.equal(cardsAgenda(a)[0].dataset.destaque, "false");
    assert.equal(a.armazenamento.get(chaveCompromissos), texto);
    const recarregada = iniciar(texto, undefined, instanteAgenda);
    assert.equal(cardsAgenda(recarregada, "lista-eventos")[0].querySelector(".eventos-descricao-texto").textContent, descricao);
});

test("janela vazia mantém acesso geral, informa ausência e continua excluindo concluídos e expirados", () => {
    const texto = JSON.stringify([eventoAgenda("Expirado", "09:00"), eventoAgenda("Concluído", "11:00", { concluidoEm: new Date(instanteAgenda).toISOString() })]);
    const a = iniciar(texto, undefined, instanteAgenda);
    assert.equal(cardsAgenda(a, "lista-eventos").length, 0);
    assert.match(a.obter("lista-eventos").textContent, /Nenhum próximo evento encontrado\./);
    assert(a.obter("lista-eventos").querySelector("i"));
    assert.equal(a.obter("evento-abrir-unico").hidden, true);
    a.clicar("alternar-eventos"); a.clicar("agenda-completa");
    assert.equal(a.obter("painel-agenda").open, true);
    assert.deepEqual(cardsAgenda(a).map(c => c.dataset.status), ["expirado", "concluido"]);
    assert.equal(a.armazenamento.get(chaveCompromissos), texto);
});
