import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { Elemento } from '../biblioteca/dom-simulado.mjs';

class No extends Elemento {
    set content(v) { this.setAttribute('content', v); }
    set httpEquiv(v) { this.setAttribute('http-equiv', v); }
    set type(v) { this.setAttribute('type', v); }
    prepend(no) { this.children.unshift(no); }
    remove() { this.removido = true; }
    get outerHTML() {
        return `<${this.tag}${Object.entries(this.attrs).map(([k,v]) => ` ${k}="${String(v).replaceAll('"', '&quot;')}"`).join('')}>${this.texto}${this.children.filter(n => !n.removido).map(n => n.outerHTML).join('')}</${this.tag}>`;
    }
}
class Documento {
    constructor(html) {
        this.head = new No('head'); this.body = new No('body'); this.documentElement = new No('html');
        this.documentElement.append(this.head, this.body);
        for (const m of html.matchAll(/<img\b([^>]+)>/g)) {
            const no = new No('img');
            for (const a of m[1].matchAll(/([\w-]+)="([^"]*)"/g)) no.setAttribute(a[1], a[2]);
            this.body.append(no);
        }
    }
    createElement(tag) { return new No(tag); }
    querySelector() { return null; }
    querySelectorAll(s) { return s === 'img[src]' ? this.body.children.filter(n => n.getAttribute('src')) : []; }
}
async function preparar() {
    const pedidos = [], ouvintes = {}, corpo = new No('body');
    const contexto = vm.createContext({ URL, Uint8Array, btoa, crypto: webcrypto,
        DOMParser: class { parseFromString(html) { return new Documento(html); } },
        fetch: async url => {
            const caminho = new URL(url).pathname.replace('/meu-taskflow/', ''); pedidos.push(String(url));
            const bytes = readFileSync(new URL('../../' + caminho, import.meta.url));
            return { ok: true, text: async () => bytes.toString('utf8'), arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
        },
        document: { body: corpo, createElement: tag => new No(tag) },
        window: { matchMedia: () => ({ matches: true }), addEventListener: (k, fn) => { ouvintes[k] = fn; } }, setTimeout, clearTimeout
    });
    const source = readFileSync(new URL('../../js/modules/studio/painel-documentacao.js', import.meta.url), 'utf8');
    const modulo = new vm.SourceTextModule(source + '\nexport { documentoIsolado, incorporarImagens };', {
        context: contexto,
        initializeImportMeta(meta) { meta.url = 'https://exemplo.test/meu-taskflow/js/modules/studio/painel-documentacao.js'; },
        importModuleDynamically: async s => {
            const dados = new vm.SyntheticModule(['conteudos'], function () { this.setExport('conteudos', { niveis: [{ assuntos: [1] }] }); }, { context: contexto });
            await dados.link(() => {}); await dados.evaluate(); return dados;
        }
    });
    await modulo.link(() => {}); await modulo.evaluate();
    return { api: modulo.namespace, pedidos, contexto, ouvintes };
}

for (const id of ['html', 'css', 'javascript', 'typescript', 'react']) test(`documentação ${id}: logos locais embutidas, subdiretório e CSP restrita`, async () => {
    const p = await preparar();
    const html = await p.api.documentoIsolado(id, { niveis: [] }, 'canal');
    const imagens = [...html.matchAll(/<img[^>]*src="(data:[^"]+)"/g)].map(m => m[1]);
    const voxel = id === 'html' || id === 'css';
    assert.equal(imagens.length, id === 'html' ? 5 : voxel ? 3 : 4);
    assert.deepEqual(Buffer.from(imagens[0].split(',')[1], 'base64'), readFileSync(new URL(`../../assets/images/taskflow-logo-voxel.png`, import.meta.url)));
    assert.deepEqual(Buffer.from(imagens[1].split(',')[1], 'base64'), readFileSync(new URL(`../../assets/images/${voxel ? `biblioteca-${id}-banner-voxel.png` : `biblioteca-${id}.svg`}`, import.meta.url)));
    if (voxel) {
        assert.deepEqual(Buffer.from(imagens.at(-1).split(',')[1], 'base64'), readFileSync(new URL(`../../assets/images/biblioteca-${id}-codigo-voxel.png`, import.meta.url)));
        if (id === 'html') for (const icone of imagens.slice(2, 4)) assert.deepEqual(Buffer.from(icone.split(',')[1], 'base64'), readFileSync(new URL('../../assets/images/biblioteca-html.svg', import.meta.url)));
        assert(html.includes('url("data:image/png;base64,'), 'fundo voxel também embutido');
        assert(!html.includes('url("../../assets/images/laboratorio-fundo-voxel.png")'));
    }
    assert.match(html, /img-src data:;/);
    for (const regra of ["connect-src 'none'", "base-uri 'none'", "default-src 'none'"]) assert(html.includes(regra));
    assert(!html.includes('import("../../data/biblioteca/'));
    assert(p.pedidos.every(url => url.startsWith('https://exemplo.test/meu-taskflow/')));
    const total = p.pedidos.length;
    await p.api.documentoIsolado(id, {}, 'outro');
    assert.equal(p.pedidos.length, total + 3, 'imagens reutilizadas sem novos fetches');
});

test('documentação: imagens desconhecidas são bloqueadas, inclusive srcset', async () => {
    const p = await preparar(), doc = new Documento('<img src="https://outro.test/logo.svg" srcset="https://outro.test/2x.svg 2x">');
    await p.api.incorporarImagens(doc, new URL('https://exemplo.test/meu-taskflow/pages/biblioteca/html.html'));
    assert.equal(doc.body.children[0].getAttribute('src'), null);
    assert.equal(doc.body.children[0].getAttribute('srcset'), null);
    assert.equal(p.pedidos.length, 0);
});

test('documentação: modal isola iframe, rejeita mensagem forjada e devolve foco ao fechar', async () => {
    const p = await preparar(), dialogo = new No('dialog'), titulo = new No('h2'), conteudo = new No('div'), fechar = new No('button'), origem = new No('button');
    dialogo.querySelector = s => ({ '#studio-documentacao-titulo': titulo, '#studio-documentacao-conteudo': conteudo, '#studio-documentacao-fechar': fechar })[s];
    dialogo.classList = { remove() {}, add() {} };
    const abrir = p.api.criarPainelDocumentacao(dialogo);
    await abrir({ id: 'react', nome: 'React' }, origem);
    assert.equal(dialogo.open, true); assert.equal(fechar.focado, true);
    const iframe = conteudo.children[0]; iframe.contentWindow = {};
    assert.equal(iframe.getAttribute('sandbox'), 'allow-scripts');
    const canal = iframe.srcdoc.match(/canal:"([^"]+)"/)[1];
    for (const dados of [{ origin: 'https://outro.test', source: iframe.contentWindow }, { origin: 'null', source: {} }]) {
        p.ouvintes.message({ ...dados, data: { tipo: 'fechar-documentacao', canal } }); assert.equal(dialogo.open, true);
    }
    p.ouvintes.message({ origin: 'null', source: iframe.contentWindow, data: { tipo: 'fechar-documentacao', canal } });
    assert.equal(dialogo.open, false); assert.equal(origem.focado, true); assert.equal(conteudo.children.length, 0);
});
