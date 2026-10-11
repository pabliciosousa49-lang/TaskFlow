const codigoReferencia = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Meu projeto</title>
</head>
<body>

</body>
</html>`;

// Referência — Exibição - mostra orientação separada sem acessar o documento do editor
export function iniciarReferenciaHTML(botao, painel, codigo) {
    codigo.textContent = codigoReferencia;
    botao.disabled = false;
    botao.addEventListener("click", () => {
        const ativa = painel.hidden;
        painel.hidden = !ativa;
        botao.setAttribute("aria-pressed", String(ativa));
        botao.setAttribute("aria-expanded", String(ativa));
        botao.textContent = ativa ? "Ocultar código de referência" : "Mostrar código de referência";
    });
}
