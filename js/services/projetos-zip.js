// fflate 0.8.2, MIT, distribuída localmente em js/vendor (sem CDN em execução).
import { zipSync, Inflate } from "../vendor/fflate-0.8.2.js";
import { exportarProjeto, importarProjeto } from "./projetos-studio.js";

export const limitesZIP = Object.freeze({ compactado: 5 * 1024 * 1024, total: 10 * 1024 * 1024,
    arquivo: 2 * 1024 * 1024, itens: 500, profundidade: 20, caminho: 1024 });
const codificador = new TextEncoder();
const decodificador = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
const tabelaCRC = Uint32Array.from({ length: 256 }, (_, indice) => {
    let valor = indice;
    for (let bit = 0; bit < 8; bit++) valor = (valor >>> 1) ^ ((valor & 1) ? 0xedb88320 : 0);
    return valor >>> 0;
});
function crc32(bytes) {
    let valor = 0xffffffff;
    for (const byte of bytes) valor = tabelaCRC[(valor ^ byte) & 255] ^ (valor >>> 8);
    return (valor ^ 0xffffffff) >>> 0;
}
function falhar(mensagem = "ZIP inválido, corrompido ou não suportado.") { throw new Error(mensagem); }

function caminhoSeguro(caminho) {
    const partes = caminho.split("/");
    if (caminho.length > limitesZIP.caminho || partes.length > limitesZIP.profundidade || partes.some(nome =>
        !nome || nome !== nome.trim() || nome.length > 120 || [".", "..", "__proto__", "prototype", "constructor"].includes(nome.toLowerCase()) ||
        /[<>:"\\|?*\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/.test(nome) || nome.endsWith(".") ||
        /^(con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i.test(nome))) falhar("Caminho inseguro ou incompatível no ZIP: " + caminho);
    return partes;
}

function textoUTF8(bytes, caminho) {
    let texto;
    try { texto = decodificador.decode(bytes); } catch { falhar(`Arquivo não textual UTF-8: ${caminho}. O Studio não armazena binários.`); }
    if (/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(texto)) falhar(`Arquivo binário não suportado: ${caminho}.`);
    return texto;
}

export function exportarProjetoZIP(id) {
    // O backup usa o catálogo salvo e validado, nunca os scripts transformados da prévia.
    const { projeto } = JSON.parse(exportarProjeto(id));
    const arquivos = Object.create(null);
    const nomes = new Set();
    for (const item of projeto.arquivos) {
        caminhoSeguro(item.caminho);
        const chave = item.caminho.normalize("NFC").toLowerCase();
        if (nomes.has(chave)) falhar("Nomes conflitantes para extração em sistemas externos: " + item.caminho);
        nomes.add(chave);
        const bytes = item.tipo === "pasta" ? new Uint8Array() : codificador.encode(item.conteudo);
        if (item.tipo === "arquivo" && decodificador.decode(bytes) !== item.conteudo) falhar("Texto Unicode inválido: " + item.caminho);
        arquivos[item.caminho + (item.tipo === "pasta" ? "/" : "")] = bytes;
    }
    return zipSync(arquivos, { level: 6 });
}

// Inspeciona o diretório central antes de descompactar: não confia em nomes já
// normalizados ou dicionários de bibliotecas que possam esconder entradas repetidas.
function lerEntradas(bytes) {
    if (!(bytes instanceof Uint8Array) || bytes.length > limitesZIP.compactado) falhar("Selecione um ZIP de até 5 MiB.");
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const u16 = pos => view.getUint16(pos, true), u32 = pos => view.getUint32(pos, true);
    let fim = bytes.length - 22;
    for (; fim >= Math.max(0, bytes.length - 65557); fim--) {
        if (u32(fim) === 0x06054b50 && fim + 22 + u16(fim + 20) === bytes.length) break;
    }
    if (fim < 0 || fim < bytes.length - 65557) falhar();
    const quantidade = u16(fim + 10), inicio = u32(fim + 16);
    if (u16(fim + 4) || u16(fim + 6) || u16(fim + 8) !== quantidade || quantidade === 65535 ||
        inicio + u32(fim + 12) !== fim) falhar("ZIP multipartes, ZIP64 ou diretório inválido não suportado.");
    if (quantidade > limitesZIP.itens) falhar("O ZIP excede o limite de 500 itens.");
    const entradas = [], nomes = new Set(), intervalos = [];
    let pos = inicio, total = 0;
    for (let i = 0; i < quantidade; i++) {
        if (pos + 46 > fim || u32(pos) !== 0x02014b50) falhar();
        const flags = u16(pos + 8), metodo = u16(pos + 10), crc = u32(pos + 16);
        const tamanho = u32(pos + 20), original = u32(pos + 24), nomeBytes = u16(pos + 28);
        const proximo = pos + 46 + nomeBytes + u16(pos + 30) + u16(pos + 32), local = u32(pos + 42);
        if (proximo > fim || u16(pos + 34) || (flags & 65) || ![0, 8].includes(metodo)) falhar("ZIP criptografado ou método de compressão não suportado.");
        const nomeRaw = bytes.subarray(pos + 46, pos + 46 + nomeBytes);
        if (!(flags & 2048) && nomeRaw.some(byte => byte > 127)) falhar("Nomes de arquivos devem usar UTF-8.");
        let nome;
        try { nome = decodificador.decode(nomeRaw); } catch { falhar("Nome de arquivo inválido no ZIP."); }
        const pasta = nome.endsWith("/"), caminho = pasta ? nome.slice(0, -1) : nome;
        caminhoSeguro(caminho);
        const chave = caminho.normalize("NFC").toLowerCase();
        if (nomes.has(chave)) falhar("Entradas duplicadas ou nomes conflitantes no ZIP: " + caminho);
        nomes.add(chave);
        const tipoUnix = (u32(pos + 38) >>> 16) & 0xf000;
        if (tipoUnix && tipoUnix !== (pasta ? 0x4000 : 0x8000)) falhar("Links simbólicos e arquivos especiais não são suportados.");
        total += original;
        if (original > limitesZIP.arquivo || total > limitesZIP.total || (pasta && original)) falhar("ZIP excede 2 MiB por arquivo ou 10 MiB descompactados.");
        if (local + 30 > inicio || u32(local) !== 0x04034b50 || u16(local + 8) !== metodo || u16(local + 6) !== flags) falhar();
        const nomeLocal = u16(local + 26), dados = local + 30 + nomeLocal + u16(local + 28);
        if (nomeLocal !== nomeBytes || dados + tamanho > inicio || !nomeRaw.every((byte, n) => bytes[local + 30 + n] === byte)) falhar();
        if (intervalos.some(([a, b]) => local < b && dados + tamanho > a)) falhar("Entradas sobrepostas no ZIP.");
        intervalos.push([local, dados + tamanho]);
        entradas.push({ caminho, pasta, metodo, crc, original, dados: bytes.subarray(dados, dados + tamanho) });
        pos = proximo;
    }
    if (pos !== fim) falhar();
    return entradas;
}

export function importarProjetoZIP(bytes, nome = "Projeto ZIP") {
    let entradas;
    try { entradas = lerEntradas(bytes); } catch (erro) {
        if (erro instanceof RangeError) falhar();
        throw erro;
    }
    const itens = new Map();
    let total = 0;
    function incluir(caminho, tipo, conteudo) {
        const partes = caminhoSeguro(caminho), nome = partes.pop(), pai = partes.join("/");
        if (pai) incluir(pai, "pasta");
        const chave = caminho.normalize("NFC").toLowerCase(), anterior = itens.get(chave);
        if (anterior) {
            if (tipo !== "pasta" || anterior.tipo !== "pasta" || anterior.caminho !== caminho) falhar("Conflito entre arquivo e pasta: " + caminho);
            return;
        }
        if (itens.size >= limitesZIP.itens) falhar("O projeto excede 500 itens, incluindo pastas implícitas.");
        itens.set(chave, { id: caminho, caminho, nome, parentId: pai || null, tipo, ...(tipo === "arquivo" ? { conteudo } : {}) });
    }
    for (const entrada of entradas) {
        // Inflate em blocos pequenos limita a expansão real, mesmo se o cabeçalho mentir.
        const partes = []; let tamanho = 0;
        const receber = dados => {
            tamanho += dados.length; total += dados.length;
            if (tamanho > entrada.original || tamanho > limitesZIP.arquivo || total > limitesZIP.total) falhar("Expansão excessiva ou tamanho inválido no ZIP.");
            partes.push(dados);
        };
        try {
            if (entrada.metodo === 0) receber(entrada.dados);
            else {
                if (!entrada.dados.length) falhar("Fluxo DEFLATE vazio.");
                const inflate = new Inflate(receber);
                for (let pos = 0; pos < entrada.dados.length; pos += 1024) inflate.push(entrada.dados.subarray(pos, pos + 1024), pos + 1024 >= entrada.dados.length);
            }
        } catch (erro) { falhar(`Não foi possível extrair ${entrada.caminho}: ${erro.message}`); }
        const dados = new Uint8Array(tamanho); let offset = 0;
        for (const parte of partes) { dados.set(parte, offset); offset += parte.length; }
        if (tamanho !== entrada.original || crc32(dados) !== entrada.crc) falhar("Conteúdo corrompido no ZIP: " + entrada.caminho);
        incluir(entrada.caminho, entrada.pasta ? "pasta" : "arquivo", entrada.pasta ? undefined : textoUTF8(dados, entrada.caminho));
    }
    const arquivos = [...itens.values()], agora = new Date().toISOString();
    const titulo = nome.replace(/\.zip$/i, "").trim().slice(0, 112) || "Projeto ZIP";
    // Reutiliza a transação do backup: valida tudo, gera novos IDs e grava uma única vez.
    return importarProjeto(JSON.stringify({ formato: "taskflow.studio.backup", versao: 1, projeto: {
        id: "zip", titulo, linguagem: "html", criadoEm: agora, atualizadoEm: agora, formatoArquivos: 1,
        arquivoEditorId: arquivos.find(a => a.caminho === "index.html" && a.tipo === "arquivo")?.id ||
            arquivos.find(a => a.tipo === "arquivo" && /\.html?$/i.test(a.nome))?.id || null,
        arquivos
    } }));
}
