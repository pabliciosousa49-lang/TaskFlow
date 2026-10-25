// Imagens locais separadas dos arquivos, localStorage e contratos de backup.
export const limiteMiniatura = 80 * 1024;
export const limiteCatalogoMiniaturas = 8 * 1024 * 1024;
const banco = "taskflow.studio.miniaturas.v1", tabela = "miniaturas";
let conexao;

function abrirBanco() {
    if (!conexao) conexao = new Promise((resolve, reject) => {
        if (!globalThis.indexedDB) { reject(new Error("Este navegador não permite armazenar miniaturas.")); return; }
        const pedido = indexedDB.open(banco, 1);
        pedido.onupgradeneeded = () => pedido.result.createObjectStore(tabela, { keyPath: "projetoId" });
        pedido.onerror = () => reject(new Error("Não foi possível abrir o armazenamento de miniaturas."));
        pedido.onblocked = () => reject(new Error("Feche as outras abas do Studio e tente novamente."));
        pedido.onsuccess = () => {
            const db = pedido.result;
            db.onversionchange = () => { db.close(); conexao = undefined; };
            resolve(db);
        };
    }).catch(erro => { conexao = undefined; throw erro; });
    return conexao;
}

export function miniaturaValida(registro) {
    return registro?.blob instanceof Blob && ["image/webp", "image/jpeg"].includes(registro.blob.type) &&
        registro.blob.size > 0 && registro.blob.size <= limiteMiniatura && registro.largura === 320 && registro.altura === 200;
}

export async function lerMiniatura(projetoId) {
    const db = await abrirBanco();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(tabela, "readonly"), pedido = tx.objectStore(tabela).get(projetoId);
        let registro;
        pedido.onsuccess = () => { registro = pedido.result; };
        tx.oncomplete = () => resolve(miniaturaValida(registro) ? registro : null);
        tx.onabort = tx.onerror = () => reject(new Error("Não foi possível ler a miniatura."));
    });
}

export async function salvarMiniatura(projetoId, blob) {
    if (typeof projetoId !== "string" || !projetoId || !miniaturaValida({ blob, largura: 320, altura: 200 })) {
        throw new Error("Miniatura inválida ou maior que 80 KiB.");
    }
    const db = await abrirBanco();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(tabela, "readwrite"), store = tx.objectStore(tabela);
        let total = blob.size, erro;
        const pedido = store.openCursor();
        pedido.onsuccess = () => {
            const cursor = pedido.result;
            if (cursor) {
                if (cursor.key !== projetoId) total += cursor.value.blob?.size || 0;
                cursor.continue();
            } else if (total > limiteCatalogoMiniaturas) {
                erro = new Error("O limite local de 8 MiB de miniaturas foi atingido. A imagem anterior foi mantida.");
                tx.abort();
            } else store.put({ projetoId, blob, largura: 320, altura: 200, atualizadoEm: new Date().toISOString() });
        };
        tx.oncomplete = () => resolve();
        tx.onabort = tx.onerror = () => reject(erro || new Error("Não foi possível salvar a miniatura. O projeto e a imagem anterior foram preservados."));
    });
}

export async function excluirMiniatura(projetoId) {
    const db = await abrirBanco();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(tabela, "readwrite");
        tx.objectStore(tabela).delete(projetoId);
        tx.oncomplete = () => resolve();
        tx.onabort = tx.onerror = () => reject(new Error("Não foi possível remover a miniatura local."));
    });
}
