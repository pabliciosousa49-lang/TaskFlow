import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { zipSync, unzipSync } from '../../js/vendor/fflate-0.8.2.js';
import { exportarProjetoZIP, importarProjetoZIP, limitesZIP } from '../../js/services/projetos-zip.js';
import * as projetos from '../../js/services/projetos-studio.js';
import { resolverArquivoVirtual } from '../../js/modules/studio/resolvedor.js';

const enc = new TextEncoder(), dec = new TextDecoder('utf-8', { ignoreBOM: true });
let dados;
beforeEach(() => {
    dados = new Map();
    globalThis.localStorage = { getItem: k => dados.get(k) ?? null, setItem: (k, v) => dados.set(k, v) };
});
const compactar = (arquivos, level = 6) => zipSync(Object.fromEntries(Object.entries(arquivos).map(([nome, valor]) =>
    [nome, typeof valor === 'string' ? enc.encode(valor) : valor])), { level });
function registros(bytes) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const fim = bytes.length - 22, entradas = [];
    let pos = view.getUint32(fim + 16, true);
    for (let i = 0; i < view.getUint16(fim + 10, true); i++) {
        entradas.push(pos);
        pos += 46 + view.getUint16(pos + 28, true) + view.getUint16(pos + 30, true) + view.getUint16(pos + 32, true);
    }
    return { view, entradas };
}
function preparar() {
    return importarProjetoZIP(compactar({
        'index.html': '<link rel="stylesheet" href="./css/style.css"><script src="./js/script.js" defer></script>',
        'dash.html': '<h1>Olá 😀</h1>', 'css/style.css': 'body { color: blue; }\r\n',
        'js/script.js': 'window.location.href = "./dash.html";',
        'pages/login.html': '<a href="../dash.html">Dashboard</a>',
        'pages/deep/login.html': '\uFEFF<p>Mesmo nome, outra pasta</p>', 'vazia/': '', 'vazia/outra/': ''
    }), 'Projeto.zip');
}

test('ZIP: exporta árvore, código original, Unicode, BOM, CRLF e pastas vazias', () => {
    const p = preparar(), antes = projetos.exportarProjeto(p.id);
    const zip = exportarProjetoZIP(p.id), arquivos = unzipSync(zip);
    assert.equal(dec.decode(arquivos['js/script.js']), 'window.location.href = "./dash.html";');
    assert.equal(dec.decode(arquivos['css/style.css']), 'body { color: blue; }\r\n');
    assert.equal(dec.decode(arquivos['pages/deep/login.html']), '\uFEFF<p>Mesmo nome, outra pasta</p>');
    assert.equal(dec.decode(arquivos['dash.html']), '<h1>Olá 😀</h1>');
    assert.equal(arquivos['vazia/outra/'].length, 0);
    assert.equal(arquivos['vazia/'].length, 0);
    assert(arquivos['pages/']); assert(arquivos['pages/deep/']);
    assert.equal(projetos.exportarProjeto(p.id), antes);
});

test('ZIP: ida e volta preserva árvore, caminhos relativos e nunca sobrescreve', () => {
    const p = preparar(), antes = projetos.exportarProjeto(p.id), zip = exportarProjetoZIP(p.id);
    const copia = importarProjetoZIP(zip, 'Projeto.zip'), outra = importarProjetoZIP(zip, 'Projeto.zip');
    assert.notEqual(p.id, copia.id); assert.notEqual(copia.id, outra.id);
    const normalizar = p => p.arquivos.map(a => [a.caminho, a.tipo, a.conteudo]).sort((a, b) => a[0].localeCompare(b[0]));
    assert.deepEqual(normalizar(copia), normalizar(p));
    assert(copia.arquivos.every(a => !p.arquivos.some(b => a.id === b.id)));
    for (const a of copia.arquivos) if (a.parentId) assert(copia.arquivos.some(b => b.id === a.parentId && b.tipo === 'pasta'));
    assert.equal(resolverArquivoVirtual(copia.arquivos, '../dash.html', 'pages/login.html').caminho, 'dash.html');
    assert.equal(resolverArquivoVirtual(copia.arquivos, './css/style.css', 'index.html').caminho, 'css/style.css');
    assert.equal(resolverArquivoVirtual(copia.arquivos, './js/script.js', 'index.html').caminho, 'js/script.js');
    assert.equal(projetos.exportarProjeto(p.id), antes);
    assert.equal(projetos.listarProjetos().length, 3);
});

for (const nome of ['../fora.js', '/absoluto.html', 'C:/arquivo.js', 'a\\b.js', 'a/../../b.js', 'a//b.js', './index.html',
    'CON.txt', 'aux', 'a/nul.js', '__proto__/a.js', 'constructor', 'a/.. /b.js', 'a./b.js', 'a/arquivo\x00.js']) {
    test('ZIP: rejeita caminho inseguro sem gravar: ' + JSON.stringify(nome), () => {
        projetos.criarProjeto('Existente'); const antes = [...dados.values()];
        assert.throws(() => importarProjetoZIP(compactar({ [nome]: 'texto' })), /Caminho inseguro/);
        assert.deepEqual([...dados.values()], antes);
    });
}

test('ZIP: rejeita duplicados, diferenças só de caixa e conflitos arquivo/pasta', () => {
    for (const arquivos of [{ 'A.js': 'a', 'a.js': 'b' }, { 'a': 'arquivo', 'a/b.js': 'b' }, { 'A/b.js': 'b', 'a/c.js': 'c' }])
        assert.throws(() => importarProjetoZIP(compactar(arquivos)), /conflit|Conflito/);
    const zip = compactar({ 'a.js': 'a', 'b.js': 'b' });
    const { view, entradas } = registros(zip), segundo = entradas[1];
    zip[segundo + 46] = 97;
    zip[view.getUint32(segundo + 42, true) + 30] = 97;
    assert.throws(() => importarProjetoZIP(zip), /duplicadas/);
    assert.equal(projetos.listarProjetos().length, 0);
});

test('ZIP: rejeita inválidos, truncados, CRC errado e metadados inconsistentes', () => {
    for (const bytes of [new Uint8Array(), enc.encode('não é ZIP'), compactar({ 'a.js': 'abc' }).slice(0, -4)])
        assert.throws(() => importarProjetoZIP(bytes));
    const zip = compactar({ 'a.js': 'abc' }, 0), { view, entradas } = registros(zip);
    const local = view.getUint32(entradas[0] + 42, true);
    zip[local + 30 + view.getUint16(local + 26, true)] ^= 1;
    assert.throws(() => importarProjetoZIP(zip), /corrompido/);
    view.setUint32(entradas[0] + 24, 0xffffffff, true);
    assert.throws(() => importarProjetoZIP(zip), /excede/);
    assert.equal(projetos.listarProjetos().length, 0);
});

test('ZIP: rejeita links simbólicos, criptografia e compressão não suportada', () => {
    for (const alterar of [
        (v, p) => v.setUint32(p + 38, 0xa1ff0000, true),
        (v, p) => v.setUint16(p + 8, 1, true),
        (v, p) => v.setUint16(p + 10, 99, true)
    ]) {
        const zip = compactar({ 'a.js': 'abc' }), { view, entradas } = registros(zip);
        alterar(view, entradas[0]); assert.throws(() => importarProjetoZIP(zip));
    }
    assert.equal(projetos.listarProjetos().length, 0);
});

test('ZIP: limita entrada, quantidade, arquivo, soma e profundidade', () => {
    assert.throws(() => importarProjetoZIP(new Uint8Array(limitesZIP.compactado + 1)), /5 MiB/);
    assert.throws(() => importarProjetoZIP(compactar(Object.fromEntries(Array.from({ length: 501 }, (_, i) => ['a' + i, ''])))), /500/);
    assert.throws(() => importarProjetoZIP(compactar({ 'a.js': 'a'.repeat(limitesZIP.arquivo + 1) })), /2 MiB/);
    assert.throws(() => importarProjetoZIP(compactar(Object.fromEntries(Array.from({ length: 6 }, (_, i) => [i + '.js', 'a'.repeat(limitesZIP.arquivo)])))), /10 MiB/);
    assert.throws(() => importarProjetoZIP(compactar({ ['a/'.repeat(21) + 'a.js']: '' })), /Caminho inseguro/);
    assert.equal(projetos.listarProjetos().length, 0);
});

test('ZIP: tamanho real não pode exceder tamanho declarado nem ocultar pastas implícitas', () => {
    const zip = compactar({ 'a.js': 'a'.repeat(100000) }), { view, entradas } = registros(zip);
    view.setUint32(entradas[0] + 24, 1, true);
    assert.throws(() => importarProjetoZIP(zip), /Expansão excessiva/);
    const muitos = Object.fromEntries(Array.from({ length: 251 }, (_, i) => ['p' + i + '/a.js', '']));
    assert.throws(() => importarProjetoZIP(compactar(muitos)), /pastas implícitas/);
    assert.equal(projetos.listarProjetos().length, 0);
});

test('ZIP: rejeita binários e UTF-8 inválido atomicamente; mantém JSON e dados antigos', () => {
    const p = projetos.criarProjeto('Existente'), antes = projetos.exportarCatalogoBruto();
    for (const binario of [new Uint8Array([255, 254]), new Uint8Array([0, 1, 2])])
        assert.throws(() => importarProjetoZIP(compactar({ 'ok.js': 'ok', 'imagem.png': binario })), /binário|UTF-8/);
    assert.equal(projetos.exportarCatalogoBruto(), antes);
    const copia = projetos.importarProjeto(projetos.exportarProjeto(p.id));
    assert.notEqual(copia.id, p.id);
    const legado = [{ id: 'antigo', titulo: 'Legado', linguagem: 'html', codigo: '<h1>Legado</h1>', criadoEm: '2026-01-01T00:00:00.000Z', atualizadoEm: '2026-01-01T00:00:00.000Z' }];
    dados.set('taskflow.studio.projetos.v1', JSON.stringify(legado));
    assert.equal(dec.decode(unzipSync(exportarProjetoZIP('antigo'))['index.html']), '<h1>Legado</h1>');
});

test('ZIP: erro de quota não substitui catálogo', () => {
    projetos.criarProjeto('Existente'); const antes = projetos.exportarCatalogoBruto();
    localStorage.setItem = () => { throw new Error('QuotaExceeded'); };
    assert.throws(() => importarProjetoZIP(compactar({ 'index.html': '<h1>Teste</h1>' })), /armazenamento/);
    assert.equal(projetos.exportarCatalogoBruto(), antes);
});

test('ZIP: arquivo vazio e projeto vazio continuam exportáveis e importáveis', () => {
    const p = importarProjetoZIP(compactar({ 'vazia/': '', 'index.html': '' }));
    assert.equal(importarProjetoZIP(exportarProjetoZIP(p.id)).arquivos.length, 2);
    const vazio = projetos.criarProjeto('Vazio');
    assert.equal(importarProjetoZIP(exportarProjetoZIP(vazio.id)).arquivos.length, 0);
});
