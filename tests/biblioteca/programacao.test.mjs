import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { iniciar, Elemento } from './dom-simulado.mjs';
import { conteudos as javascript } from '../../data/biblioteca/javascript/conteudos.js';
import { conteudos as typescript } from '../../data/biblioteca/typescript/conteudos.js';
import { conteudos as react } from '../../data/biblioteca/react/conteudos.js';

if (!vm.SourceTextModule) throw new Error('Execute com --experimental-vm-modules.');
const cache = JSON.parse(readFileSync(new URL('../studio/vendor/lezer-cache.json', import.meta.url), 'utf8'));
const imports = JSON.parse(readFileSync(new URL('../../pages/studio.html', import.meta.url), 'utf8').match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;
const contexto = vm.createContext({});
const modulos = new Map();
function obter(url) {
  if (!modulos.has(url)) modulos.set(url, url === 'https://esm.sh/node/process.mjs'
    ? new vm.SyntheticModule(['default'], function () { this.setExport('default', process); }, { context: contexto, identifier: url })
    : new vm.SourceTextModule(cache[url], { context: contexto, identifier: url }));
  return modulos.get(url);
}
const modulo = obter(imports['@lezer/javascript']);
await modulo.link((s, ref) => obter(imports[s] || new URL(s, ref.identifier).href));
await modulo.evaluate();
const parsers = { javascript: modulo.namespace.parser, typescript: modulo.namespace.parser.configure({ dialect: 'ts' }), react: modulo.namespace.parser.configure({ dialect: 'jsx' }) };
const moduloCSS = obter(imports['@lezer/css']);
await moduloCSS.link((s, ref) => obter(imports[s] || new URL(s, ref.identifier).href));
await moduloCSS.evaluate();
test('sintaxe da folha compartilhada e dos três novos temas', () => {
  const fonte = readFileSync(new URL('../../css/biblioteca/biblioteca.css', import.meta.url), 'utf8');
  const cursor = moduloCSS.namespace.parser.parse(fonte).cursor();
  do { assert(!cursor.type.isError, fonte.slice(cursor.from, cursor.to)); } while (cursor.next());
});
function assuntos(dados) { return dados.niveis.flatMap(n => n.modulos.flatMap(m => m.assuntos)); }
function arquivos(assunto) {
  return assunto.arquivosSeparados ? assunto.exemploCodigo.split(/\/\/ Arquivo: [^\n]+\n/).filter(s => s.trim()) : [assunto.exemploCodigo];
}
for (const dados of [javascript, typescript, react]) {
  test(dados.nome + ': níveis, módulos e referências completos', () => {
    assert.deepEqual(dados.niveis.map(n => n.id), ['basico', 'intermediario', 'avancado']);
    const lista = assuntos(dados);
    assert(lista.length >= 10);
    assert.equal(new Set(lista.map(a => a.id)).size, lista.length);
    for (const nivel of dados.niveis) {
      assert(nivel.modulos.length > 0);
      for (const m of nivel.modulos) assert(m.assuntos.length > 0);
    }
    for (const a of lista) assert(a.relacionados.every(id => lista.some(b => b.id === id)));
  });
  for (const a of assuntos(dados)) {
    test(dados.id + ': conteúdo e gramática de ' + a.id, () => {
      for (const campo of ['titulo', 'explicacao', 'aplicacaoReal', 'exemploCodigo', 'resultadoEsperado', 'ambiente']) assert(a[campo]?.length > 5, campo);
      assert(a.responsabilidadeCodigo.length >= 2);
      assert(a.boasPraticas.length >= 2);
      assert(a.palavrasChave.length > 0);
      assert(!/lorem ipsum|conteúdo em preparação/i.test(a.explicacao));
      assert(a.fonte.startsWith('https://'));
      for (const codigo of arquivos(a)) {
        const cursor = parsers[dados.id].parse(codigo).cursor();
        do { assert(!cursor.type.isError, codigo.slice(cursor.from, cursor.to)); } while (cursor.next());
        if (dados.id === 'javascript') new vm.SourceTextModule(codigo);
      }
    });
  }
  test(dados.nome + ': leitura inerte, cópia e navegação em todos os assuntos', async () => {
    const { api, elementos, nav, copias } = iniciar(dados.id);
    const lista = assuntos(dados);
    for (let i = 0; i < lista.length; i++) {
      api.selecionarAssunto(i);
      const leitura = elementos['#biblioteca-leitura'];
      assert.equal(elementos['#biblioteca-titulo'].textContent, lista[i].titulo);
      assert.equal(leitura.querySelector('iframe'), null, 'não cria executor para scripts');
      assert(leitura.textContent.includes('Resultado esperado · não executado aqui'));
      const bloco = leitura.querySelectorAll('.biblioteca-codigo').find(b => b.querySelector('code').textContent === lista[i].exemploCodigo);
      assert(bloco);
      assert(bloco.querySelector('.biblioteca-codigo-ferramentas').textContent.includes(dados.id === 'react' ? 'JSX / React' : dados.id.toUpperCase()));
      bloco.querySelector('button').disparar('click'); await Promise.resolve();
      assert.equal(copias.at(-1), lista[i].exemploCodigo);
      assert.equal(nav.children[0].disabled, i === 0);
      assert.equal(nav.children[1].disabled, i === lista.length - 1);
    }
    api.selecionarAssunto(0); nav.children[1].disparar('click');
    assert.equal(elementos['#biblioteca-titulo'].textContent, lista[1].titulo);
  });
}

test('pesquisa por intenção é limitada à tecnologia aberta e permite selecionar resultado', () => {
  const casos = [
    ['javascript', [['clicar','mapa-click'],['validar formulário','formularios'],['salvar dados','localstorage'],['mapear lógica','mapear-logica']]],
    ['typescript', [['tipar objeto','objetos'],['valor opcional','objetos'],['elemento nulo','null-dom'],['mapear lógica','mapa-tipado']]],
    ['react', [['atualizar tela','estado'],['passar dados','props'],['mapear lógica','mapa-react']]]
  ];
  for (const [tecnologia, termos] of casos) {
    const { api, elementos, mobile } = iniciar(tecnologia);
    for (const [termo, id] of termos) assert.equal(api.pesquisarAssuntos(termo)[0]?.registro.assunto.id, id, termo);
    api.iniciarPesquisa();
    elementos['#biblioteca-pesquisa-campo'].value = 'mapear lógica';
    elementos['#biblioteca-pesquisa-campo'].disparar('input');
    mobile.matches = true;
    elementos['#biblioteca-pesquisa-resultados'].querySelector('button').disparar('click');
    assert.equal(elementos['#biblioteca-pesquisa-campo'].disabled, false);
    assert.equal(elementos['#biblioteca-menu'].hidden, true);
    assert(elementos['#biblioteca-leitura'].focado);
    assert.equal(api.pesquisarAssuntos('senha').length, 0);
  }
});

test('destaque preserva código com tags e strings, sem inserir marcação no DOM', () => {
  const { api } = iniciar('javascript');
  const fonte = 'const mensagem = "<img src=x onerror=alert(1)>"; // somente texto';
  const destino = new Elemento(); api.destacarScript(fonte, destino);
  assert.equal(destino.textContent, fonte);
  assert(destino.children.every(e => e.tag === 'span'));
});

function executarExemplo(id, ids) {
  const elementos = Object.fromEntries(ids.map(id => [id, new Elemento()]));
  const documento = { querySelector: s => elementos[s.slice(1)] || null, createElement: tag => new Elemento(tag), createTextNode: texto => { const n = new Elemento('text'); n.textContent = texto; return n; } };
  vm.runInNewContext(assuntos(javascript).find(a => a.id === id).exemploCodigo, { document: documento });
  return elementos;
}
test('mapeamento JavaScript: clique e formulário funcionam no DOM simulado', () => {
  const click = executarExemplo('mapa-click', ['confirmar','confirmacao']);
  click.confirmar.disparar('click'); assert.equal(click.confirmacao.textContent, 'Ação confirmada');
  const form = executarExemplo('mapa-formulario', ['saudacao','pessoa','resultado']);
  form.pessoa.value = '   '; form.saudacao.disparar('submit', { preventDefault() {} });
  assert.equal(form.resultado.textContent, 'Digite seu nome');
  form.pessoa.value = ' Lia '; form.saudacao.disparar('submit', { preventDefault() {} });
  assert.equal(form.resultado.textContent, 'Olá, Lia');
});
test('mapeamento JavaScript: inclusão, vazio e remoção independente com títulos repetidos', () => {
  const e = executarExemplo('mapa-lista', ['tarefas','tarefa','lista']);
  const enviar = valor => { e.tarefa.value = valor; e.tarefas.disparar('submit', { preventDefault() {} }); };
  enviar('   '); assert.equal(e.lista.children.length, 0);
  enviar('Estudar'); enviar('Estudar'); assert.equal(e.lista.children.length, 2);
  e.lista.querySelector('button').disparar('click'); assert.equal(e.lista.children.length, 1);
  e.lista.querySelector('button').disparar('click'); assert.equal(e.lista.children.length, 0);
});
test('roteiros ensinam seis etapas com as adaptações de tipos e componentes', () => {
  for (const dados of [javascript, typescript, react]) {
    const mapas = assuntos(dados).filter(a => a.mapeamento);
    assert(mapas.length > 0);
    assert(mapas.every(a => a.mapeamento.length === 6));
  }
  const reactMapa = assuntos(react).find(a => a.id === 'mapa-react');
  assert(reactMapa.mapeamento.some(s => s.startsWith('Estado mínimo:')));
  assert(assuntos(typescript).find(a => a.id === 'mapa-tipado').mapeamento.some(s => s.includes('HTMLInputElement')));
});
