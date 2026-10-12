// HTML — Documento inicial - utilizado somente na criação explícita de index.html
export function criarEstruturaInicialHTML(titulo) {
    const tituloSeguro = titulo.replace(/[&<>"']/g, (caractere) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[caractere]);
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${tituloSeguro}</title>
</head>
<body>

</body>
</html>`;
}
