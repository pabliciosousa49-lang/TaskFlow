// Console — Interface - saída textual limitada; sem entrada de comandos.
export function criarConsolePrevia(lista, limpar, abrirArquivo) {
    const mensagens = [];
    function renderizar() {
        lista.replaceChildren();
        for (const mensagem of mensagens) {
            const li = document.createElement("li");
            li.dataset.nivel = mensagem.nivel;
            const texto = document.createElement("span");
            texto.textContent = `${mensagem.nivel.toUpperCase()}: ${mensagem.texto}`;
            li.append(texto);
            if (mensagem.caminho) {
                const link = document.createElement("button"); link.type = "button";
                link.textContent = mensagem.caminho + (mensagem.linha ? `:${mensagem.linha}${mensagem.coluna ? ":" + mensagem.coluna : ""}` : "");
                link.addEventListener("click", () => abrirArquivo(mensagem)); li.append(link);
            }
            lista.append(li);
        }
    }
    limpar.addEventListener("click", () => { mensagens.length = 0; renderizar(); });
    return {
        limpar() { mensagens.length = 0; renderizar(); },
        adicionar(mensagem) {
            if (!["log", "info", "warn", "error"].includes(mensagem.nivel) || typeof mensagem.texto !== "string") return;
            mensagens.push({ ...mensagem, texto: mensagem.texto.slice(0, 4096) });
            if (mensagens.length > 200) mensagens.shift();
            renderizar();
        }
    };
}
