// Navegação — Ponte - só solicita operações sobre o projeto; não acessa o DOM do pai.
export function codigoNavegacaoPrevia(canal, caminho) {
    return `(() => {
        const enviar = (tipo, referencia) => parent.postMessage({ tipo, referencia, canal: ${JSON.stringify(canal)} }, "*");
        // Console — Transporte - texto limitado, sem executar comandos ou ler o DOM do pai.
        let mensagens = 0;
        function resumir(valor, profundidade = 0, vistos = new WeakSet()) {
            if (typeof valor === "string") return valor.slice(0, 2048);
            if (valor === null || typeof valor !== "object") return String(valor).slice(0, 2048);
            if (vistos.has(valor)) return "[Circular]";
            if (profundidade >= 3) return "[Objeto]";
            vistos.add(valor);
            try {
                const descritores = Object.getOwnPropertyDescriptors(valor);
                return (Array.isArray(valor) ? "[" : "{") + Object.keys(descritores).slice(0, 20).map(chave => {
                    const prop = descritores[chave];
                    return chave + ": " + ("value" in prop ? resumir(prop.value, profundidade + 1, vistos) : "[Getter]");
                }).join(", ").slice(0, 2048) + (Array.isArray(valor) ? "]" : "}");
            } catch { return "[Objeto não serializável]"; }
        }
        function registrar(nivel, valores, origem = "", linha, coluna) {
            if (++mensagens > 500) return;
            let texto;
            try { texto = valores.slice(0, 20).map(v => resumir(v)).join(" ").slice(0, 4096); }
            catch { texto = "[Mensagem não serializável]"; }
            parent.postMessage({ tipo: "console", canal: ${JSON.stringify(canal)}, nivel, texto, origem, linha, coluna }, "*");
        }
        for (const nivel of ["log", "info", "warn", "error"]) {
            const original = console[nivel]?.bind(console);
            console[nivel] = (...valores) => { registrar(nivel, valores); original?.(...valores); };
        }
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
        window.addEventListener("error", event => {
            let origem = "";
            try { if (event.filename?.startsWith("data:text/javascript")) origem = decodeURIComponent(event.filename.split("#").at(-1)); } catch {}
            registrar("error", [event.message || "Falha ao carregar ou executar um recurso."], origem, event.lineno, event.colno);
        });
        window.addEventListener("unhandledrejection", event => registrar("error", [event.reason]));
    })();`;
}
