import { limiteMiniatura } from "../../services/miniaturas-studio.js";

export function capturaDisponivel() {
    return Boolean(globalThis.isSecureContext && globalThis.navigator?.mediaDevices?.getDisplayMedia &&
        navigator.mediaDevices.setCaptureHandleConfig && globalThis.CropTarget?.fromElement &&
        globalThis.BrowserCaptureMediaStreamTrack?.prototype?.cropTo);
}

function verificarArea(iframe) {
    const area = iframe.getBoundingClientRect();
    if (iframe.hidden || area.width < 1 || area.height < 1 || area.left < 0 || area.top < 0 ||
        area.right > innerWidth || area.bottom > innerHeight) {
        throw new Error("Exiba a prévia inteira na tela antes de atualizar a miniatura.");
    }
}

function aguardarFrame(video) {
    return new Promise((resolve, reject) => {
        let pedido;
        const timer = setTimeout(() => {
            if (pedido !== undefined) video.cancelVideoFrameCallback?.(pedido);
            reject(new Error("O navegador não entregou uma imagem da prévia. Tente novamente."));
        }, 5000);
        const pronto = () => { clearTimeout(timer); resolve(); };
        if (video.requestVideoFrameCallback) pedido = video.requestVideoFrameCallback(pronto);
        else if (video.readyState >= 2) pronto();
        else video.addEventListener("loadeddata", pronto, { once: true });
    });
}

export async function compactarMiniatura(video) {
    if (!video.videoWidth || !video.videoHeight) throw new Error("A captura da prévia está vazia.");
    const canvas = document.createElement("canvas");
    canvas.width = 320; canvas.height = 200;
    const contexto = canvas.getContext("2d");
    if (!contexto) throw new Error("Não foi possível preparar a imagem da miniatura.");
    contexto.fillStyle = "#061326"; contexto.fillRect(0, 0, 320, 200);
    const escala = Math.min(320 / video.videoWidth, 200 / video.videoHeight);
    const largura = video.videoWidth * escala, altura = video.videoHeight * escala;
    contexto.drawImage(video, (320 - largura) / 2, (200 - altura) / 2, largura, altura);
    for (const tipo of ["image/webp", "image/jpeg"]) {
        for (const qualidade of [.78, .6, .45]) {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, tipo, qualidade));
            if (blob?.type === tipo && blob.size > 0 && blob.size <= limiteMiniatura) return blob;
        }
    }
    throw new Error("Não foi possível compactar a miniatura em até 80 KiB.");
}

// Captura pixels autorizados pelo navegador, sem ler o DOM isolado nem executar
// uma cópia do projeto. Nenhum frame é lido antes de confirmar e recortar a própria aba.
export async function capturarMiniatura(iframe) {
    if (!capturaDisponivel()) throw new Error("A captura exige HTTPS ou localhost e um navegador desktop com Region Capture.");
    iframe.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
    verificarArea(iframe);
    let fluxo, video;
    const handle = crypto.randomUUID();
    try {
        navigator.mediaDevices.setCaptureHandleConfig({ handle, permittedOrigins: [location.origin], exposeOrigin: false });
        // Esta chamada ocorre antes do primeiro await, preservando a ativação do botão.
        fluxo = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: "browser" }, audio: false,
            preferCurrentTab: true, selfBrowserSurface: "include", surfaceSwitching: "exclude", monitorTypeSurfaces: "exclude" });
        const track = fluxo.getVideoTracks()[0];
        if (!track || track.getSettings().displaySurface !== "browser" || track.getCaptureHandle?.()?.handle !== handle) {
            throw new Error("Selecione a própria aba do TaskFlow Studio. Nenhuma imagem foi salva.");
        }
        verificarArea(iframe);
        await track.cropTo(await CropTarget.fromElement(iframe));
        video = document.createElement("video"); video.muted = true; video.playsInline = true; video.srcObject = fluxo;
        await video.play();
        await aguardarFrame(video);
        verificarArea(iframe);
        return await compactarMiniatura(video);
    } catch (erro) {
        if (erro.name === "NotAllowedError") throw new Error("Captura cancelada ou não autorizada. A miniatura anterior foi mantida.");
        throw erro;
    } finally {
        fluxo?.getTracks().forEach(track => track.stop());
        if (video) { video.pause(); video.srcObject = null; }
        navigator.mediaDevices.setCaptureHandleConfig({ handle: "", permittedOrigins: [] });
    }
}
