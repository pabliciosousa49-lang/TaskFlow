// Conteúdos — Modelo - normaliza assuntos de programação para a navegação existente.
export function assunto(id, titulo, explicacao, aplicacaoReal, exemploCodigo, explicacoes, resultadoEsperado, cuidados, palavrasChave = [], extra = {}) {
    return { id, titulo, explicacao, aplicacaoReal, exemploCodigo,
        responsabilidadeCodigo: explicacoes.split("|"), resultadoEsperado,
        boasPraticas: cuidados.split("|"), palavrasChave: [id, ...palavrasChave], ...extra };
}

export function documentacao(id, nome, niveis, fonte) {
    return {
        id, nome,
        niveis: niveis.map(([nivelId, nivelNome, modulos]) => ({
            id: nivelId, nome: nivelNome, assuntos: [],
            modulos: modulos.map(([moduloId, titulo, assuntos]) => ({
                id: moduloId, titulo,
                assuntos: assuntos.map(assunto => ({
                    contextoExemplo: "codigo",
                    linguagem: id === "react" ? "jsx" : id,
                    ambiente: id === "javascript"
                        ? "Execute cada exemplo isoladamente em um navegador. Exemplos com DOM incluem o HTML de apoio e devem carregar o script com defer. Módulos exigem servidor HTTP local e script type=module. Nada é executado nesta documentação."
                        : id === "typescript"
                            ? "Exemplo didático TypeScript: utilize um ambiente TypeScript externo com strict e bibliotecas DOM/ES modernas quando necessárias. O navegador executa o JavaScript gerado, não este código com tipos. Esta biblioteca não compila TypeScript."
                            : "Exemplo didático JSX: utilize um projeto React externo já configurado e renderize o componente exportado em App.jsx. Esta biblioteca não carrega React nem transforma ou executa JSX.",
                    relacionados: [], boasPraticas: [], palavrasChave: [],
                    fonte, ...assunto,
                    sintaxe: assunto.exemploCodigo
                }))
            }))
        }))
    };
}
