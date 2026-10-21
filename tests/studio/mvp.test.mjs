import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as projetos from '../../js/services/projetos-studio.js';
import { normalizarSessao, lerSessao, gravarSessao } from '../../js/modules/studio/sessao.js';
import { localizarOcorrencias, substituicoes, filtrarArquivos, criarFerramentasEditor } from '../../js/modules/studio/ferramentas-editor.js';
import { criarConsolePrevia } from '../../js/modules/studio/console-previa.js';
let dados;
beforeEach(() => {
  dados = new Map();
  globalThis.localStorage = { getItem: k => dados.get(k) ?? null, setItem: (k, v) => dados.set(k, v) };
  const sessao = new Map();
  globalThis.sessionStorage = { getItem: k => sessao.get(k) ?? null, setItem: (k, v) => sessao.set(k, v) };
});
function preparar() {
  let p = projetos.criarProjeto('Agenda');
  let r = projetos.criarPasta(p.id, 'pages', null, p.atualizadoEm); p = r.projeto; const pasta = r.item;
  r = projetos.criarArquivo(p.id, 'index.html', pasta.id, p.atualizadoEm); p = r.projeto;
  p = projetos.atualizarConteudoArquivo(p.id, r.item.id, '<p>Olá 😀</p>\n<script>console.log(1)</script>', p.atualizadoEm);
  return p;
}
test('backup: preserva Unicode, conteúdo exato e árvore; cria cópias com novos IDs', () => {
  const original = preparar(); const backup = projetos.exportarProjeto(original.id);
  const copia = projetos.importarProjeto(backup), outra = projetos.importarProjeto(backup);
  assert.notEqual(copia.id, original.id); assert.notEqual(copia.id, outra.id);
  assert(copia.titulo.endsWith('(cópia)'));
  assert.deepEqual(copia.arquivos.map(a => [a.nome, a.caminho, a.conteudo]), original.arquivos.map(a => [a.nome, a.caminho, a.conteudo]));
  for (const a of copia.arquivos) {
    assert(!original.arquivos.some(b => b.id === a.id));
    if (a.parentId) assert(copia.arquivos.some(b => b.id === a.parentId && b.tipo === 'pasta'));
  }
  assert(copia.arquivos.some(a => a.id === copia.arquivoEditorId));
  assert.equal(projetos.listarProjetos().length, 3);
});
test('backup: dados incompatíveis, caminhos inválidos e JSON inválido não alteram os registros', () => {
  const p = preparar(), anterior = [...dados.values()][0];
  const backup = JSON.parse(projetos.exportarProjeto(p.id));
  backup.projeto.arquivos[0].nome = '..';
  for (const texto of ['{', '{}', JSON.stringify(backup), JSON.stringify({ formato: 'taskflow.studio.backup', versao: 2 })]) assert.throws(() => projetos.importarProjeto(texto));
  assert.equal([...dados.values()][0], anterior);
});
test('backup: valida tamanho em bytes e limite de itens antes de gravar', () => {
  const p = preparar(); const backup = JSON.parse(projetos.exportarProjeto(p.id));
  assert.throws(() => projetos.importarProjeto('á'.repeat(projetos.limiteBackupBytes)), /2 MiB/);
  backup.projeto.arquivos = Array(1001).fill(backup.projeto.arquivos[0]);
  assert.throws(() => projetos.importarProjeto(JSON.stringify(backup)), /1.000/);
  assert.equal(projetos.listarProjetos().length, 1);
});
test('backup: falha de armazenamento preserva o registro anterior; conflitos não sobrescrevem código', () => {
  const p = preparar(), backup = projetos.exportarProjeto(p.id), anterior = [...dados.values()][0];
  const gravar = localStorage.setItem; localStorage.setItem = () => { throw new Error('quota'); };
  assert.throws(() => projetos.importarProjeto(backup), /Não foi possível salvar/);
  assert.equal([...dados.values()][0], anterior); localStorage.setItem = gravar;
  const arquivo = p.arquivos.find(a => a.tipo === 'arquivo');
  projetos.criarPasta(p.id, 'css', null, p.atualizadoEm);
  assert.throws(() => projetos.atualizarConteudoArquivo(p.id, arquivo.id, 'perdido', p.atualizadoEm), /outra aba/);
  assert.equal(projetos.buscarProjeto(p.id).arquivos.find(a => a.id === arquivo.id).conteudo, arquivo.conteudo);
});
test('sessão: restaura somente estado de interface e tolera registros inválidos ou armazenamento bloqueado', () => {
  gravarSessao('p', { abas: ['a', 'b', 'a'], ativo: 'b', documentos: [{ id: 'b', cursor: 20, top: 80, left: 2 }], painel: 'previa', automatica: false, largura: 70, codigo: 'não persistir' });
  const s = lerSessao('p'); assert.equal(s.existente, true); assert.deepEqual(s.abas, ['a', 'b']); assert.equal(s.documentos[0].cursor, 20); assert.equal(s.painel, 'previa'); assert.equal(s.automatica, false); assert(!('codigo' in s));
  assert.equal(normalizarSessao({ largura: 999, documentos: [null] }).largura, 75);
  sessionStorage.setItem('taskflow.studio.interface.v1', '{'); assert.equal(lerSessao('p').ativo, null);
  sessionStorage.setItem = () => { throw new Error('bloqueado'); }; assert.doesNotThrow(() => gravarSessao('p', {}));
});
test('busca: literal, Unicode, sem sobreposição; substituições usam transações ordenadas', () => {
  assert.deepEqual(localizarOcorrencias('aaa', 'aa'), [{ from: 0, to: 2 }]);
  assert.deepEqual(localizarOcorrencias('texto', ''), []);
  assert.equal(localizarOcorrencias('á á A', 'á').length, 2);
  assert.equal(localizarOcorrencias('.* .*', '.*').length, 2);
  assert.deepEqual(substituicoes('a a', 'a', '$&', true), [{ from: 0, to: 1, insert: '$&' }, { from: 2, to: 3, insert: '$&' }]);
  assert.equal(substituicoes('a a', 'a', 'b', false, { from: 2, to: 3 })[0].from, 2);
  assert.equal(substituicoes('a a', 'a', 'b', false, { from: 1, to: 1 }).length, 0);
});
test('localizar: distingue arquivos homônimos pelo caminho e ignora pastas', () => {
  const itens = [{ tipo: 'arquivo', caminho: 'pages/index.html' }, { tipo: 'arquivo', caminho: 'index.html' }, { tipo: 'pasta', caminho: 'index' }];
  assert.equal(filtrarArquivos(itens, 'INDEX').length, 2); assert.equal(filtrarArquivos(itens, 'pages/')[0].caminho, 'pages/index.html');
});
class Elemento {
  constructor(tag = 'div') { this.tag = tag; this.children = []; this.dataset = {}; this.events = {}; this.hidden = false; this.value = ''; this.textContent = ''; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  addEventListener(k, fn) { (this.events[k] ??= []).push(fn); }
  disparar(k, e = {}) { for (const fn of this.events[k] || []) fn(e); }
  focus() { document.activeElement = this; }
  contains(alvo) { return this === alvo || this.children.some(c => c.contains(alvo)); }
  showModal() { this.open = true; }
  close() { this.open = false; }
  click() { this.disparar('click'); }
  querySelectorAll(tag) { return this.children.flatMap(c => [...(c.tag === tag ? [c] : []), ...c.querySelectorAll(tag)]); }
}
function dom() {
  const elementos = new Map();
  globalThis.document = { activeElement: null, createElement: tag => new Elemento(tag), querySelector: id => { if (!elementos.has(id)) elementos.set(id, new Elemento()); return elementos.get(id); }, events: {}, addEventListener(k, fn) { this.events[k] = fn; } };
  return document;
}
test('console: texto inerte, níveis, limite de 200 mensagens, limpeza e ação de localização', () => {
  dom(); const lista = new Elemento('ol'), limpar = new Elemento('button'); let aberto;
  const consoleUI = criarConsolePrevia(lista, limpar, msg => { aberto = msg; });
  consoleUI.adicionar({ nivel: 'eval', texto: 'ignorar' }); assert.equal(lista.children.length, 0);
  for (let i = 0; i < 210; i++) consoleUI.adicionar({ nivel: 'warn', texto: '<script>' + i });
  assert.equal(lista.children.length, 200); assert(lista.children[0].children[0].textContent.includes('<script>'));
  consoleUI.adicionar({ nivel: 'error', texto: 'Erro', caminho: 'app.js', linha: 2 });
  lista.children.at(-1).children[1].click(); assert.equal(aberto.caminho, 'app.js');
  limpar.click(); assert.equal(lista.children.length, 0);
});
test('ferramentas: Ctrl+F local, resultados, Enter/Shift+Enter, Esc e Ctrl+P/S preservados', () => {
  const d = dom(); let codigo = 'a a', salvo = 0, aberto, realce = '', transacoes = [];
  const conteudo = new Elemento(), view = { dom: new Elemento(), state: { doc: { toString: () => codigo }, selection: { main: { from: 0, to: 0 } } }, focus() { conteudo.focus(); }, dispatch(t) { transacoes.push(t); if (t.selection) this.state.selection.main = { from: Math.min(t.selection.anchor, t.selection.head ?? t.selection.anchor), to: Math.max(t.selection.anchor, t.selection.head ?? t.selection.anchor) }; } };
  view.dom.append(conteudo);
  const barra = d.querySelector('#studio-busca'), campo = d.querySelector('#studio-busca-texto');
  barra.append(campo); barra.hidden = true;
  const ui = criarFerramentasEditor({ editor: () => view, ativo: () => true, salvar: () => { salvo++; }, arquivos: () => [{ tipo: 'arquivo', caminho: 'a.html' }], abrir: item => { aberto = item; }, realcar: (_, termo) => { realce = termo; } });
  function tecla(key, alvo = conteudo, opcoes = {}) {
    const e = { key, target: alvo, ctrlKey: true, preventDefault() { this.defaultPrevented = true; }, ...opcoes };
    d.events.keydown(e); return e;
  }
  assert(tecla('s').defaultPrevented); assert.equal(salvo, 1);
  assert(!tecla('f', new Elemento()).defaultPrevented); assert.equal(barra.hidden, true);
  assert(tecla('f').defaultPrevented); assert.equal(barra.hidden, false); assert.equal(d.activeElement, campo);
  campo.value = 'a'; campo.disparar('input'); assert.equal(realce, 'a'); assert.equal(view.state.selection.main.from, 0);
  assert.equal(d.querySelector('#studio-busca-status').textContent, '1 de 2 ocorrências.');
  campo.disparar('keydown', { key: 'Enter', preventDefault() {} }); assert.equal(view.state.selection.main.from, 2);
  assert.equal(d.querySelector('#studio-busca-status').textContent, '2 de 2 ocorrências.');
  campo.disparar('keydown', { key: 'Enter', shiftKey: true, preventDefault() {} }); assert.equal(view.state.selection.main.from, 0);
  assert(transacoes.every(t => t.scrollIntoView && !t.changes)); assert.equal(codigo, 'a a');
  tecla('f', campo); assert.equal(d.activeElement, campo); assert.equal(realce, 'a');
  codigo = 'outro texto a'; ui.sincronizar(); assert.match(d.querySelector('#studio-busca-status').textContent, /1 ocorrências/);
  campo.value = 'ausente'; campo.disparar('input'); assert.equal(d.querySelector('#studio-busca-status').textContent, 'Nenhuma ocorrência.');
  assert.equal(d.querySelector('#studio-busca-proximo').disabled, true);
  assert(tecla('Escape', campo, {ctrlKey: false}).defaultPrevented); assert.equal(barra.hidden, true); assert.equal(realce, ''); assert.equal(d.activeElement, conteudo);
  d.querySelector('#studio-buscar').click(); assert.equal(barra.hidden, false);
  barra.disparar('keydown', { key: 'Escape', preventDefault() {}, stopPropagation() {} }); assert.equal(barra.hidden, true);
  assert(!tecla('h').defaultPrevented);
  tecla('p'); const dialogo = d.querySelector('#studio-localizar'); assert.equal(dialogo.open, true);
  dialogo.disparar('keydown', { key: 'Enter', target: d.querySelector('#studio-localizar-texto'), preventDefault() {} }); assert.equal(aberto.caminho, 'a.html'); assert.equal(dialogo.open, false);
});
