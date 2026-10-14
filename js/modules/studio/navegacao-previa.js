// Navegação — Ponte - só solicita operações sobre o projeto; não acessa o DOM do pai.
export function codigoNavegacaoPrevia(canal, caminho) {
    return `(() => {
        const enviar = (tipo, referencia) => parent.postMessage({ tipo, referencia, canal: ${JSON.stringify(canal)} }, "*");
        Object.defineProperty(window, "TaskFlow", { value: Object.freeze({
            navegar: referencia => enviar("navegar", String(referencia)),
            voltar: () => enviar("voltar"),
            caminho: ${JSON.stringify(caminho.split(/[?#]/)[0])},
            consulta: ${JSON.stringify((caminho.match(/\?[^#]*/) || [""])[0])},
            fragmento: ${JSON.stringify(caminho.includes("#") ? caminho.slice(caminho.indexOf("#")) : "")}
        }), writable: false });
        document.addEventListener("click", event => {
            const link = event.target.closest?.("a[data-taskflow-destino]");
            if (!link || event.defaultPrevented) return;
            event.preventDefault();
            enviar("navegar", link.dataset.taskflowDestino);
        });
        document.addEventListener("submit", event => {
            if (event.defaultPrevented) return;
            event.preventDefault();
            if (event.target.dataset.taskflowAction) {
                const form = event.target;
                if ((form.getAttribute("method") || "get").toLowerCase() !== "get") {
                    enviar("erro", "Envio POST não suportado: a prévia não possui backend."); return;
                }
                const referencia = form.dataset.taskflowAction;
                const hash = referencia.indexOf("#");
                const fragmento = hash < 0 ? "" : referencia.slice(hash);
                const base = (hash < 0 ? referencia : referencia.slice(0, hash)).split("?")[0];
                const valores = new FormData(form);
                if (event.submitter?.name) valores.append(event.submitter.name, event.submitter.value);
                const consulta = new URLSearchParams();
                for (const [nome, valor] of valores) if (typeof valor === "string") consulta.append(nome, valor);
                enviar("navegar", base + "?" + consulta + fragmento);
            }
        });
        document.addEventListener("DOMContentLoaded", () => {
            try { document.getElementById(decodeURIComponent(TaskFlow.fragmento.slice(1)))?.scrollIntoView(); } catch {}
        });
        window.addEventListener("error", event => enviar("erro", event.message || "Falha ao carregar ou executar um recurso."));
        window.addEventListener("unhandledrejection", event => enviar("erro", String(event.reason?.message || event.reason)));
    })();`;
}
