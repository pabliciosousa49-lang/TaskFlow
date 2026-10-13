// HTML — Conteúdo - referência progressiva com exemplos isolados.
const efeitosNavegador = {
    "imagens": "Sem o arquivo images/equipe.jpg, a imagem não pode aparecer. Nesta prévia o recurso é bloqueado e fica sua alternativa textual; forneça a imagem em seu projeto para visualizar a fotografia.",
    "textos-alternativos": "As imagens externas não são carregadas nesta prévia. A marca informativa mantém sua alternativa textual e a decoração com alt vazio não acrescenta descrição.",
    "audio": "Os controles de áudio são exibidos, mas não há reprodução: o arquivo externo é bloqueado. Forneça o MP3 e a transcrição em seu próprio projeto.",
    "video": "Os controles de vídeo são exibidos sem carregar MP4 ou legendas externas. Forneça esses arquivos em seu projeto para testar a reprodução e a faixa WebVTT.",
    "html-css": "link não gera conteúdo visível. A aparência depende da existência e do carregamento de style.css e de suas regras.",
    "html-javascript": "A referência não produz uma área visual. Seu efeito depende do arquivo script.js; nenhum JavaScript do exemplo é executado.",
    "validacao-nativa": "Os campos e limites declarados aparecem na prévia. O envio está bloqueado por isolamento; copie o documento para testar o fluxo completo de validação e envio no navegador.",
    "atalho-html5": "A estrutura tem body vazio e não exibe conteúdo. title identifica a aba quando o documento é aberto no navegador.",
    "estrutura-documento": "O body está vazio: não há texto apresentado, apesar de já existir título de aba e metadados.",
    "arquivo-css": "O comentário não produz conteúdo visível. style.css é criado no editor de arquivos e sua conexão exige link.",
    "iframe": "A Biblioteca bloqueia iframes dentro dos exemplos por isolamento. Fora desta prévia, o exemplo cria uma moldura com o parágrafo fornecido em srcdoc.",
    "metadados": "Esses elementos não acrescentam conteúdo ao body. title identifica a aba; os dados Open Graph podem ser usados em cartões de compartilhamento.",
    "seo-tecnico": "title identifica a aba. description não aparece no body e seu uso na busca depende do buscador.",
    "integracao-externos": "As referências não desenham conteúdo. Seus efeitos dependem dos arquivos; nenhum script do exemplo é executado.",
    "revisao-pagina": "O corpo é mostrado com estilos padrão. CSS e JavaScript externos não são carregados nesta prévia."
};

function assunto(id, titulo, objetivo, explicacao, sintaxe, exemploCodigo, responsabilidadeCodigo, aplicacaoReal, boasPraticas, contextoExemplo = "body") {
    return { id, titulo, objetivo, explicacao, sintaxe, exemploCodigo, responsabilidadeCodigo, aplicacaoReal, boasPraticas, contextoExemplo, efeitoNavegador: efeitosNavegador[id], resultadoVisual: !["atalho-html5", "estrutura-documento", "arquivo-css", "iframe"].includes(id) };
}

export const conteudos = {
    id: "html", nome: "HTML",
    niveis: [
        { id: "basico", nome: "Básico", assuntos: [], modulos: [
            { id: "introducao-preparacao", titulo: "01 — Introdução e preparação", assuntos: [
                assunto("o-que-e-html", "O que é HTML", "Reconhecer o papel do HTML na construção de páginas.",
                    "HTML é uma linguagem de marcação: seus elementos identificam o significado e a estrutura do conteúdo. Um título, um parágrafo e um link têm funções diferentes, mesmo antes de receberem estilos. CSS cuida da apresentação; JavaScript pode acrescentar comportamento. HTML não é uma linguagem de programação.",
                    "<p>Conteúdo de um parágrafo.</p>",
                    `<h1>Meu primeiro site</h1>
<p>Estou aprendendo a estruturar conteúdo com HTML.</p>
<a href="https://developer.mozilla.org/pt-BR/">Consultar a documentação</a>`,
                    ["h1 identifica o título principal desse conteúdo.", "p delimita um parágrafo; a cria um link cujo destino está em href."],
                    "Montar o conteúdo de uma página antes de decidir suas cores e interações.",
                    ["Escolha elementos pelo significado.", "Não use tags de título apenas para obter uma fonte maior."]),
                assunto("responsabilidade-html",
                    "Responsabilidade do HTML em uma aplicação web",
                    "Consultar responsabilidade do html em uma aplicação web.",
                    "HTML descreve o conteúdo e seu significado: títulos, parágrafos, links e controles. CSS determina a apresentação e JavaScript pode implementar comportamento. Uma classe ou um ID oferece um ponto de integração, mas não aplica estilos nem executa ações por si só.",
                    "<h1>Título</h1>\n<p>Conteúdo.</p>",
                    "<h1>Catálogo de estudos</h1>\n<p>Materiais de referência para desenvolvimento web.</p>",
                    ["h1 identifica o assunto principal; p organiza a explicação.","A marcação oferece estrutura; cores e ações adicionais pertencem a outras tecnologias."],
                    "Separar as responsabilidades antes de organizar os arquivos da página.",
                    ["Escolha elementos pelo significado.","Não confunda uma classe com um estilo já implementado."],
                    "body"),
                assunto("interpretacao-navegador",
                    "Como o navegador interpreta um documento HTML?",
                    "Consultar como o navegador interpreta um documento html?.",
                    "O navegador lê o arquivo e constrói o DOM, uma árvore que representa os elementos em memória. Depois combina essa estrutura com os estilos e os recursos carregados. Elementos dentro de outros formam relações de pai e filho; a árvore pode ser inspecionada na aba Elementos do navegador. A recuperação automática de erros não torna uma marcação inválida confiável.",
                    "<h1>Título</h1>\n<p>Texto.</p>",
                    "<h1>Biblioteca</h1>\n<p>Referência de HTML.</p>",
                    ["h1 identifica o título e p o parágrafo; ambos pertencem ao corpo do documento.","O DOM descreve essas relações, não apenas as linhas do arquivo."],
                    "Comparar o código-fonte com a estrutura construída pelo navegador.",
                    ["Inspecione o DOM ao investigar aninhamento.","Não dependa da recuperação automática de erros."],
                    "body"),
                assunto("primeiro-index",
                    "Criando o primeiro arquivo index.html",
                    "Consultar criando o primeiro arquivo index.html.",
                    "index.html é uma convenção comum para a entrada de um site estático. Crie um arquivo de texto com essa extensão e salve em UTF-8; no Laboratório, utilize o explorador de arquivos. O servidor decide qual documento entrega como entrada: index não é uma tag especial.",
                    "<!-- Salve como index.html, não index.html.txt. -->",
                    "<!DOCTYPE html>\n<html lang=\"pt-BR\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Meu Projeto</title>\n</head>\n<body>\n    <h1>Meu primeiro site</h1>\n    <p>Estou aprendendo HTML.</p>\n</body>\n</html>",
                    ["A extensão .html identifica o documento de marcação.","head reúne as informações da página e body o conteúdo visível."],
                    "Preparar a entrada de um site e conferir o arquivo por um servidor local ou publicação estática.",
                    ["Confira se o editor acrescentou .txt ao nome.","Salve em UTF-8 e confira os acentos."],
                    "documento"),
                assunto("atalho-html5",
                    "O que é o atalho html:5?",
                    "Consultar o que é o atalho html:5?.",
                    "html:5 é uma abreviação de ferramentas de edição, como Emmet, e não uma tag ou comando nativo de HTML. A ferramenta pode expandi-la para uma estrutura editável; o resultado varia conforme sua configuração. No Laboratório, Tab ou Enter confirma o atalho em um arquivo HTML sem outra estrutura completa. O navegador interpreta o HTML resultante, não o atalho.",
                    "<!-- Abreviação no editor: html:5 -->",
                    "<!DOCTYPE html>\n<html lang=\"pt-BR\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Meu Projeto</title>\n</head>\n<body>\n\n</body>\n</html>",
                    ["A ferramenta substitui a abreviação por marcação, sem conferir validade de todos os dados do projeto.","html, head e body organizam o documento; meta e title descrevem suas propriedades."],
                    "Obter uma base de documento sem redigitar todas as linhas.",
                    ["Use a expansão ao preparar um documento novo.","Revise idioma, título e viewport; não presuma valores idênticos em todos os editores."],
                    "documento"),
                assunto("estrutura-documento",
                    "Entendendo a estrutura HTML5 gerada",
                    "Consultar entendendo a estrutura html5 gerada.",
                    "A estrutura separa propriedades do documento e conteúdo visível. lang declara o idioma, charset a codificação e viewport o dimensionamento inicial em telas móveis. title nomeia a aba; body recebe os elementos apresentados. A base pode ser editada sem repetir html, head ou body.",
                    "<!DOCTYPE html>\n<html lang=\"pt-BR\">\n    <head>...</head>\n    <body>...</body>\n</html>",
                    "<!DOCTYPE html>\n<html lang=\"pt-BR\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Meu Projeto</title>\n</head>\n<body>\n\n</body>\n</html>",
                    ["html é a raiz; head reúne metadados e body o conteúdo da página.","meta charset interpreta caracteres; meta viewport orienta o dimensionamento; title identifica a aba."],
                    "Reconhecer onde inserir cada informação de uma página.",
                    ["Mantenha apenas uma estrutura principal.","Não confunda o título da aba com um heading visível."],
                    "documento"),
                assunto("doctype-html-head-body",
                    "Responsabilidades de DOCTYPE, html, head, body, meta e title",
                    "Consultar responsabilidades de doctype, html, head, body, meta e title.",
                    "DOCTYPE solicita o modo de padrões; html é a raiz, com idioma em lang. head reúne informações sobre o documento. meta declara propriedades como codificação e viewport; title identifica a aba. body contém o conteúdo apresentado. Essas funções são distintas e não devem ser trocadas.",
                    "<!DOCTYPE html>\n<html lang=\"pt-BR\"><head><meta charset=\"UTF-8\"><title>Contato</title></head><body><h1>Contato</h1></body></html>",
                    "<!DOCTYPE html>\n<html lang=\"pt-BR\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Contato</title>\n</head>\n<body>\n    <h1>Contato</h1>\n</body>\n</html>",
                    ["DOCTYPE precede a raiz e não possui fechamento.","html contém head e body; meta é vazio e title contém texto.","meta viewport usa width=device-width e initial-scale=1.0; h1 é o título visível."],
                    "Identificar informações que foram colocadas na região errada.",
                    ["Declare charset próximo ao início do head.","Não coloque conteúdo visual dentro de title."],
                    "documento"),
                assunto("arquivo-css",
                    "Criando e organizando o arquivo style.css",
                    "Consultar criando e organizando o arquivo style.css.",
                    "Uma folha CSS é um arquivo de texto que reúne regras de apresentação. Crie style.css na mesma pasta de index.html para iniciar com um caminho simples. Criar o arquivo não conecta os estilos à página: a associação é feita por link, assunto seguinte. O nome style.css é uma convenção, não uma obrigação.",
                    "<!-- index.html e style.css ficam na mesma pasta -->",
                    "<!-- Organização de arquivos:\nmeu-site/\n    index.html\n    style.css\n-->",
                    ["index.html organiza a página; style.css reúne apresentação.","O comentário ilustra a organização e não cria os arquivos."],
                    "Separar marcação e estilos para facilitar reutilização e manutenção.",
                    ["Salve a folha em UTF-8, sem uma extensão .txt adicional.","Ao mover a folha, atualize as referências."],
                    "body"),
                assunto("html-css",
                    "Conectando CSS ao HTML com link",
                    "Consultar conectando css ao html com link.",
                    "link com rel=\"stylesheet\" informa que o recurso é uma folha de estilos; href aponta para sua localização. Insira esse elemento vazio no head. Neste exemplo, style.css fica ao lado de index.html. Um caminho incorreto impede aplicar a folha, mas o navegador ainda pode mostrar o conteúdo com seus estilos padrão.",
                    "<link rel=\"stylesheet\" href=\"style.css\">",
                    "<link rel=\"stylesheet\" href=\"style.css\">",
                    ["rel=\"stylesheet\" declara a relação do recurso com o documento.","href=\"style.css\" é relativo ao HTML; link não recebe fechamento."],
                    "Conectar uma folha existente e conferir a requisição na aba Rede.",
                    ["Verifique nome, extensão e capitalização do caminho.","URLs dentro do CSS são relativas à folha, não ao HTML."],
                    "head"),
                assunto("html-javascript",
                    "Conectando JavaScript ao HTML com script",
                    "Consultar conectando javascript ao html com script.",
                    "script com src referencia JavaScript, como script.js ao lado de index.html. Em scripts clássicos externos, defer permite baixar o recurso sem bloquear a análise do HTML e executá-lo depois dessa análise. Coloque a referência no head e feche script. Um caminho incorreto impede carregar o arquivo; o HTML não implementa automaticamente suas ações.",
                    "<script src=\"script.js\" defer></script>",
                    "<script src=\"script.js\" defer></script>",
                    ["src informa a URL do arquivo.","defer organiza a execução do script clássico externo após a análise do documento."],
                    "Conectar um arquivo de comportamento existente, sem ensinar ou executar seu conteúdo nesta documentação.",
                    ["Crie script.js e confira a requisição na aba Rede.","defer não tem esse efeito em scripts clássicos inline."],
                    "head"),
                assunto("caminhos", "Caminhos relativos e absolutos", "Resolver destinos conforme a localização do documento.",
                    "Caminhos relativos são resolvidos a partir da URL do documento, salvo quando há base. ../ sobe um diretório; ./ indica o atual. URLs completas incluem protocolo e domínio. Um caminho iniciado por / parte da raiz do site e pode ignorar o prefixo de um projeto no GitHub Pages.",
                    "./contato.html\n../index.html\nhttps://example.org/pagina",
                    `<a href="../index.html">Página inicial</a>
<a href="./contato.html">Contato nesta pasta</a>
<a href="https://developer.mozilla.org/pt-BR/docs/Web/HTML">Referência de HTML</a>`,
                    ["../index.html sobe da pasta pages para a raiz.", "./contato.html busca na pasta atual; a URL completa aponta para outro site."],
                    "Use o trecho em pages/sobre.html e crie index.html e pages/contato.html para testar os destinos.",
                    ["Considere a pasta da página, não a do editor.", "Confira maiúsculas e minúsculas: servidores podem diferenciá-las."])
            ] },
            { id: "elementos-fundamentais", titulo: "02 — Elementos fundamentais", assuntos: [
                assunto("tags-elementos", "Tags e elementos", "Identificar abertura, fechamento e elementos vazios.",
                    "Uma tag é uma marcação delimitada por sinais de menor e maior. O elemento inclui abertura, conteúdo e fechamento, quando existem. Elementos vazios, como img e br, não recebem conteúdo nem fechamento. A indentação ajuda a ler o aninhamento sem mudar o significado.",
                    "<strong>Texto importante</strong>\n<br>",
                    `<p>Leia o <strong>aviso de segurança</strong> antes de continuar.</p>
<p>Primeira linha<br>Segunda linha</p>`,
                    ["strong marca um trecho importante dentro de p.", "br é vazio e representa uma quebra textual."],
                    "Destacar uma advertência dentro de um parágrafo.",
                    ["Feche elementos na ordem inversa de abertura.", "Não escreva </br> ou </img>."]),
                assunto("abertura-fechamento",
                    "Tags de abertura e fechamento",
                    "Consultar tags de abertura e fechamento.",
                    "Elementos com conteúdo usam abertura e fechamento com o mesmo nome. A barra no fechamento encerra o elemento, não seus irmãos. Elementos vazios, como img, input e br, não aceitam conteúdo nem fechamento. Escrever /> em HTML não torna uma div vazia.",
                    "<p>Texto</p>\n<br>",
                    "<p>Primeira informação.</p>\n<p>Segunda informação.<br>Continuação da mesma ideia.</p>",
                    ["Cada p delimita seu parágrafo.","br representa uma quebra e não deve receber </br>."],
                    "Conferir os limites dos conteúdos para evitar elementos abertos involuntariamente.",
                    ["Feche as tags consistentemente.","Não use <div /> como substituto de <div></div> em HTML."],
                    "body"),
                assunto("atributos", "Atributos HTML", "Configurar elementos pela tag de abertura.",
                    "Atributos fornecem informações ou ajustam um elemento. Alguns são globais, como id e class; outros dependem da tag, como href em a. Atributos booleanos, como disabled, são ativados pela presença: disabled=\"false\" ainda desabilita o botão.",
                    "<a href=\"destino.html\" class=\"link\">Texto</a>",
                    `<a id="link-estudos" class="link-destaque" href="estudos.html">Meus estudos</a>
<button type="button" disabled>Disponível em breve</button>`,
                    ["href define o destino; id identifica um elemento e class agrupa elementos para CSS ou scripts.", "disabled impede a interação nativa com o botão."],
                    "Identificar elementos e destinos; crie estudos.html para testar o link local.",
                    ["Use aspas nos valores e IDs únicos.", "Remova atributos booleanos para desativá-los."]),
                assunto("aninhamento",
                    "Aninhamento de elementos",
                    "Consultar aninhamento de elementos.",
                    "Aninhar significa colocar um elemento dentro de outro, criando uma relação de pai e filho. Feche primeiro o elemento mais interno. Essa relação deve respeitar as regras de conteúdo: um p não pode conter outra tag p ou uma div. A indentação ajuda a enxergar a estrutura, mas não corrige um aninhamento inválido.",
                    "<div><p>Texto com <strong>importância</strong>.</p></div>",
                    "<div>\n    <p>Guarde uma <strong>cópia dos arquivos</strong>.</p>\n</div>",
                    ["div agrupa o conteúdo e p é seu filho.","strong, fechado antes de p, identifica um trecho importante."],
                    "Organizar grupos e trechos internos preservando a árvore pretendida.",
                    ["Confira a ordem dos fechamentos.","Inspecione o DOM quando o navegador reorganizar a marcação."],
                    "body"),
                assunto("titulos-paragrafos",
                    "Títulos h1 a h6",
                    "Consultar títulos h1 a h6.",
                    "h1 a h6 representam níveis de títulos. h1 apresenta o assunto principal; h2 delimita uma seção e h3 sua subdivisão. Os níveis seguintes continuam essa hierarquia quando necessários. O nível depende da relação entre conteúdos, não do tamanho de fonte desejado.",
                    "<h1>Página</h1>\n<h2>Seção</h2>\n<h3>Subseção</h3>",
                    "<h1>Plano de estudos</h1>\n<h2>Fundamentos</h2>\n<h3>Estrutura do documento</h3>",
                    ["h1 nomeia o assunto geral.","h2 e h3 comunicam subdivisões; h4 a h6 são níveis mais profundos, não itens obrigatórios."],
                    "Permitir localizar assuntos e subdivisões de uma referência.",
                    ["Evite pular níveis por aparência.","Controle fonte e cor com CSS."],
                    "body"),
                assunto("paragrafos",
                    "Parágrafos com p",
                    "Consultar parágrafos com p.",
                    "p reúne um parágrafo de texto. Use um elemento por ideia, em vez de repetir br para separar parágrafos. Espaços e quebras digitados no arquivo geralmente são colapsados na apresentação normal. A formatação do código não substitui a estrutura da marcação.",
                    "<p>Uma ideia em texto.</p>",
                    "<p>HTML organiza o conteúdo.</p>\n<p>CSS define sua apresentação.</p>",
                    ["Cada p forma um bloco textual distinto.","A quebra entre as tags organiza o arquivo; os elementos separam os parágrafos apresentados."],
                    "Dividir uma descrição em ideias legíveis.",
                    ["Não coloque div, títulos ou outro p dentro de p.","Use CSS para espaçamento visual, não parágrafos vazios."],
                    "body"),
                assunto("quebras-separadores", "Quebras de linha e separadores", "Diferenciar uma quebra textual de uma mudança temática.",
                    "br indica uma quebra necessária no mesmo texto, como em um endereço ou poema. hr representa uma mudança de tema. Não devem ser repetidos para criar espaçamento ou substituir a estrutura de parágrafos.",
                    "Texto<br>Continuação\n<hr>",
                    `<p>Rua dos Estudos, 120<br>Recife — PE</p>
<hr>
<p>Atendimento: segunda a sexta.</p>`,
                    ["br separa as linhas do endereço.", "hr indica a transição para outro tema."],
                    "Apresentar um endereço e separar informações de atendimento.",
                    ["Use p para parágrafos e CSS para margens.", "br e hr são elementos vazios."]),
                assunto("formatacao-textos", "Formatação e organização de textos", "Expressar importância e ênfase sem confundir significado com aparência.",
                    "strong marca importância; em expressa ênfase que pode mudar o sentido de uma frase; small representa comentários laterais, como uma nota legal. A aparência habitual desses elementos pode ser modificada por CSS. Escolha o significado primeiro, em vez de usar tags apenas para obter negrito ou itálico.",
                    "<p>Texto com <strong>importância</strong> e <em>ênfase</em>.</p>",
                    `<p><strong>Atenção:</strong> salve o arquivo antes de fechar.</p>
<p>Estude <em>um assunto por vez</em> para acompanhar os exemplos.</p>
<p><small>Material de apoio para estudo individual.</small></p>`,
                    ["strong identifica o aviso importante, normalmente exibido em negrito.", "em marca a ênfase da orientação, normalmente em itálico; small delimita a nota complementar."],
                    "Organizar avisos, orientações e notas em uma página de estudo.",
                    ["Não substitua headings por parágrafos com strong.", "Use CSS para aparência e essas tags para significado."]),
                assunto("comentarios", "Comentários", "Documentar decisões sem exibi-las como conteúdo.",
                    "Comentários são delimitados por <!-- e -->. Podem explicar uma decisão ou indicar uma região do arquivo. Não aparecem como texto na página, mas ficam acessíveis no código-fonte e no DOM, portanto não servem para guardar segredos.",
                    "<!-- Observação para quem mantém o arquivo -->",
                    `<!-- A lista acompanha a ordem de estudo definida pela equipe. -->
<ol>
    <li>Estrutura do documento</li>
    <li>Elementos semânticos</li>
</ol>`,
                    ["O comentário explica a ordem escolhida.", "ol e li continuam sendo o conteúdo apresentado."],
                    "Registrar uma decisão que não é evidente na marcação.",
                    ["Evite comentários que apenas repetem tags.", "Não aninhe comentários nem registre credenciais."]),
                assunto("links", "Links", "Navegar para páginas ou pontos do mesmo documento.",
                    "a com href cria um hiperlink. O destino pode ser outra página, uma URL externa ou um fragmento iniciado por # que aponta para um id. Seu texto deve comunicar o destino sem depender de frases ao redor.",
                    "<a href=\"#contato\">Contato</a>",
                    `<a href="#contato">Ir para informações de contato</a>
<section id="contato">
    <h2>Contato</h2>
    <p>Atendimento durante o horário comercial.</p>
</section>`,
                    ["href=#contato aponta para o elemento com id=contato.", "section agrupa as informações e h2 nomeia a seção."],
                    "Criar um índice de uma página longa.",
                    ["Prefira textos descritivos a clique aqui.", "Use links para navegar e botões para ações."]),
                assunto("imagens", "Imagens", "Inserir uma imagem com alternativa textual e proporção correta.",
                    "img referencia um arquivo em src e oferece uma alternativa em alt. width e height podem informar dimensões intrínsecas para reservar espaço antes do carregamento. O HTML não cria o arquivo: ele deve existir no caminho informado.",
                    "<img src=\"images/foto.jpg\" alt=\"Descrição\" width=\"640\" height=\"360\">",
                    `<img src="images/equipe.jpg"
     alt="Equipe de estudantes reunida na biblioteca"
     width="640" height="360">`,
                    ["src localiza o arquivo; alt comunica seu conteúdo.", "width e height informam a proporção: ajuste-os às dimensões da imagem usada."],
                    "Forneça images/equipe.jpg para mostrar a equipe em uma página institucional.",
                    ["Não distorça a proporção da imagem.", "Não use o nome do arquivo como alternativa textual."]),
                assunto("listas", "Listas ordenadas e não ordenadas", "Escolher a lista conforme a importância da sequência.",
                    "ol representa uma sequência relevante; ul representa um conjunto sem ordem obrigatória. li delimita cada item. Uma sublista deve ficar dentro de um li para manter a relação entre itens.",
                    "<ul><li>Item</li></ul>\n<ol><li>Etapa</li></ol>",
                    `<h2>Materiais</h2>
<ul>
    <li>Editor de texto</li>
    <li>Navegador</li>
</ul>
<h2>Passos</h2>
<ol>
    <li>Crie index.html.</li>
    <li>Abra o arquivo no navegador.</li>
</ol>`,
                    ["ul agrupa materiais sem prioridade de ordem.", "ol expressa uma sequência; li delimita um material ou etapa."],
                    "Documentar materiais e instruções de uma atividade.",
                    ["Não simule listas com marcadores em parágrafos.", "Use ol quando trocar a ordem mudar a orientação."]),
                assunto("div-span", "Div e span", "Usar recipientes genéricos quando não há significado específico.",
                    "div agrupa conteúdo em fluxo; span delimita um trecho de texto. São genéricos e podem receber class para CSS ou scripts. Não substituem títulos, links e botões quando a função já possui um elemento apropriado.",
                    "<div><p>Texto com <span>um detalhe</span>.</p></div>",
                    `<div class="resumo-estudos">
    <p>Tempo dedicado: <span class="duracao">30 minutos</span>.</p>
    <p>Conteúdo: elementos e atributos.</p>
</div>`,
                    ["div agrupa os dois parágrafos.", "span marca apenas a duração; as classes não aplicam estilos sozinhas."],
                    "Preparar um grupo para layout e um trecho para destaque visual com CSS.",
                    ["Prefira um elemento semântico quando adequado.", "Não use div clicável como substituta de button."])
            ] }
        ] },
        { id: "intermediario", nome: "Intermediário", assuntos: [], modulos: [
            { id: "estrutura-semantica", titulo: "03 — Estrutura e semântica", assuntos: [
                assunto("html-semantico", "HTML semântico", "Escolher elementos que comuniquem a função do conteúdo.",
                    "HTML semântico usa elementos pelo significado: nav representa navegação, main identifica o conteúdo principal e article reúne uma publicação independente. Essa escolha ajuda pessoas, navegadores e tecnologias assistivas a entenderem a estrutura. Ela não define automaticamente o layout, que continua sendo responsabilidade do CSS.",
                    "<main><h1>Assunto principal</h1><p>Conteúdo</p></main>",
                    `<nav aria-label="Nesta página"><a href="#aula">Aula</a></nav>
<main id="aula">
    <h1>Aprendendo semântica</h1>
    <p>A estrutura informa a função de cada região.</p>
</main>`,
                    ["nav agrupa a navegação; aria-label informa seu nome.", "main identifica a região principal e id oferece um destino ao link; h1 nomeia o assunto."],
                    "Planejar as regiões de uma página antes de escolher cores e posições.",
                    ["Pergunte qual é a função do conteúdo antes de escolher a tag.", "Use recipientes genéricos somente quando não houver significado mais específico."]),
                assunto("semanticos-genericos",
                    "Elementos semânticos e genéricos",
                    "Consultar elementos semânticos e genéricos.",
                    "Elementos semânticos comunicam funções, como nav para navegação. div e span são genéricos e servem para agrupamento sem declarar uma finalidade específica. Ambos são válidos no contexto adequado. Uma tag semântica escolhida apenas por aparência pode fornecer uma informação equivocada sobre o conteúdo.",
                    "<nav>Links de navegação</nav>\n<div>Agrupamento genérico</div>",
                    "<nav aria-label=\"Nesta página\"><a href=\"#resumo\">Resumo</a></nav>\n<div class=\"resumo\" id=\"resumo\">\n    <p>Este grupo reúne uma explicação.</p>\n</div>",
                    ["nav informa a função; aria-label fornece o nome da navegação.","div agrupa o texto e recebe id como destino do link, sem criar uma seção temática."],
                    "Escolher recipientes conforme o significado e a função do conteúdo.",
                    ["Não troque todas as div por section automaticamente.","Uma classe CSS não fornece semântica nativa."],
                    "body"),
                assunto("header", "Header", "Reconhecer conteúdo introdutório da página ou de uma seção.",
                    "header reúne introdução, título e informações relacionadas. Pode servir à página ou estar dentro de um article. Não posiciona conteúdo no topo por si só: a posição visual depende do CSS.",
                    "<header>Introdução</header>",
                    `<header>
    <h1>Diário de aprendizagem</h1>
    <p>Experiências de quem está começando na programação.</p>
</header>`,
                    ["header delimita a introdução.", "h1 nomeia o conteúdo e p apresenta seu propósito."],
                    "Agrupar a apresentação de um blog ou de uma publicação.",
                    ["Escolha header pela função, não pela posição.", "Não aninhe header em header ou footer."]),
                assunto("nav", "Nav", "Marcar conjuntos relevantes de links de navegação.",
                    "nav identifica uma região importante de navegação, como menu principal ou índice. Nem todo grupo de links precisa desse elemento. Nomes acessíveis distintos ajudam a diferenciar várias navegações.",
                    "<nav aria-label=\"Principal\">Links</nav>",
                    `<nav aria-label="Principal">
    <ul>
        <li><a href="index.html">Início</a></li>
        <li><a href="pages/estudos.html">Estudos</a></li>
    </ul>
</nav>`,
                    ["nav identifica a região; aria-label fornece seu nome.", "ul organiza os destinos e a permite abrir cada página."],
                    "Montar o menu do site; forneça index.html e pages/estudos.html para testar os links.",
                    ["Diferencie menus principal e secundário.", "Não use nav apenas como recipiente de estilos."]),
                assunto("main", "Main", "Delimitar o conteúdo principal do documento.",
                    "main contém o conteúdo dominante e específico da página. Menus e rodapés recorrentes normalmente ficam fora dele. Mantenha apenas um main não oculto para oferecer uma região principal clara.",
                    "<main id=\"conteudo\">Conteúdo principal</main>",
                    `<a href="#conteudo">Ir para o conteúdo</a>
<main id="conteudo">
    <h1>Introdução à programação</h1>
    <p>Comece entendendo como representar instruções.</p>
</main>`,
                    ["main identifica a região principal.", "id fornece um destino para o link de salto."],
                    "Separar uma aula dos menus recorrentes da plataforma.",
                    ["Não coloque main dentro de nav, aside, article, header ou footer.", "Evite múltiplos main visíveis."]),
                assunto("section", "Section", "Agrupar um tema identificável do documento.",
                    "section representa uma seção temática quando não há elemento mais específico. Geralmente possui um título que explica o tema. Se o propósito for apenas envolver elementos para layout, div costuma ser mais adequada.",
                    "<section><h2>Tema</h2><p>Conteúdo</p></section>",
                    `<section aria-labelledby="objetivos">
    <h2 id="objetivos">Objetivos da aula</h2>
    <p>Organizar uma página com elementos semânticos.</p>
</section>`,
                    ["section agrupa o tema; h2 o identifica.", "aria-labelledby usa o título existente como nome acessível."],
                    "Dividir uma aula em objetivos, materiais e conclusão.",
                    ["Prefira seções com títulos claros.", "Não crie section apenas para adicionar margens."]),
                assunto("article", "Article", "Representar conteúdo que faça sentido isoladamente.",
                    "article serve a um conteúdo autocontido, como notícia, publicação ou comentário. Uma section pode dividir temas dentro dele. Independência do conteúdo, e não tamanho ou aparência de cartão, determina a escolha.",
                    "<article><h2>Título</h2><p>Publicação</p></article>",
                    `<article>
    <h2>Minha primeira página publicada</h2>
    <p>Por Ana — <time datetime="2026-10-12">12 de outubro de 2026</time></p>
    <p>Hoje publiquei meu portfólio e revisei os links.</p>
</article>`,
                    ["article reúne uma publicação independente.", "datetime fornece uma data padronizada ao elemento time."],
                    "Apresentar publicações de um blog em lista ou individualmente.",
                    ["Dê um título ao conteúdo.", "Não transforme todo recipiente visual em article."]),
                assunto("aside", "Aside", "Separar informações complementares do conteúdo principal.",
                    "aside contém informações secundárias relacionadas ao conteúdo ao redor, como dicas ou referências. A semântica não exige que fique à direita; a posição é responsabilidade do layout.",
                    "<aside><h2>Complemento</h2><p>Informação relacionada</p></aside>",
                    `<main>
    <h1>Publicação de sites</h1>
    <p>Um site estático pode ser publicado sem um servidor de aplicação.</p>
</main>
<aside>
    <h2>Termo relacionado</h2>
    <p>Hospedagem disponibiliza os arquivos na web.</p>
</aside>`,
                    ["main mantém a explicação central.", "aside apresenta uma definição complementar."],
                    "Mostrar um glossário sem interromper a sequência de uma aula.",
                    ["Reserve aside para conteúdo complementar.", "Não separe como acessória uma informação essencial ao entendimento."]),
                assunto("footer", "Footer", "Identificar encerramento e autoria no contexto correto.",
                    "footer representa o rodapé da página ou de sua seção. Pode conter autoria, direitos e links relacionados. Um article pode ter seu próprio footer, distinto do rodapé geral do site.",
                    "<footer>Informações de encerramento</footer>",
                    `<article>
    <h2>Estudando HTML</h2>
    <p>Separe conteúdo de apresentação visual.</p>
    <footer><p>Material preparado pela equipe de estudos.</p></footer>
</article>`,
                    ["footer pertence a este article.", "p apresenta a autoria; a tag não define posição na tela."],
                    "Adicionar autoria a cada publicação de uma página.",
                    ["Escolha informações conforme o contexto.", "Não aninhe footer em footer ou header."]),
                assunto("div-ou-section",
                    "Quando utilizar div ou section",
                    "Consultar quando utilizar div ou section.",
                    "section delimita um tema identificável, geralmente com título. div é adequada quando o agrupamento existe para layout ou organização genérica. article tem outra função: conteúdo independente. Essas tags não são alternativas intercambiáveis de aparência.",
                    "<section><h2>Tema</h2><p>Conteúdo.</p></section>",
                    "<section>\n    <h2>Materiais de referência</h2>\n    <div class=\"grupo-links\">\n        <p><a href=\"https://developer.mozilla.org/pt-BR/docs/Web/HTML\">Referência de HTML</a></p>\n    </div>\n</section>",
                    ["section delimita o tema e h2 o identifica.","div agrupa o link para organização visual, sem inventar outra seção."],
                    "Distinguir uma seção real de um recipiente para posicionamento.",
                    ["Procure um tema e título antes de escolher section.","Use article quando o conteúdo fizer sentido isoladamente."],
                    "body"),
                assunto("hierarquia-titulos", "Hierarquia de títulos", "Revisar headings como um índice lógico.",
                    "Títulos estruturam a leitura e a navegação por headings em leitores de tela. Sua sequência representa assuntos e subdivisões. Fonte grande não transforma um texto em heading, e usar headings não garante posições em buscadores.",
                    "<h1>Assunto</h1>\n<h2>Seção</h2>\n<h3>Subseção</h3>",
                    `<h1>Guia de formulários</h1>
<h2>Campos de texto</h2>
<h3>Entrada de uma linha</h3>
<p>Use input para entradas curtas.</p>
<h3>Entrada de várias linhas</h3>
<p>Use textarea para mensagens.</p>
<h2>Envio dos dados</h2>
<p>Configure destino e método no formulário.</p>`,
                    ["Os h3 são subseções de Campos de texto.", "O último h2 retorna ao nível de seção."],
                    "Auditar os tópicos de uma documentação longa usando sua sequência de títulos.",
                    ["Adote um h1 principal claro e níveis coerentes.", "Não escolha headings apenas pelo estilo visual."]),
                assunto("organizacao-documentos",
                    "Organização de uma página HTML",
                    "Consultar organização de uma página html.",
                    "Organize metadados no head e regiões de conteúdo no body. Uma sequência previsível facilita localizar introdução, navegação, conteúdo dominante e informações complementares. Elementos semânticos devem refletir funções reais; a ordem do arquivo não define o layout. Não crie recipientes sem responsabilidade clara.",
                    "<header>...</header>\n<main>...</main>\n<footer>...</footer>",
                    "<!DOCTYPE html>\n<html lang=\"pt-BR\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Portal de estudos</title>\n</head>\n<body>\n    <header><p>Portal de estudos</p>\n        <nav aria-label=\"Principal\"><a href=\"#materiais\">Materiais</a></nav>\n    </header>\n    <main>\n        <h1>Referência de programação</h1>\n        <section id=\"materiais\">\n            <h2>Materiais disponíveis</h2>\n            <article><h3>Guia de HTML</h3><p>Referência de elementos e atributos.</p></article>\n        </section>\n    </main>\n    <aside><h2>Glossário</h2><p>Marcação identifica a estrutura do conteúdo.</p></aside>\n    <footer><p>Material preparado pela equipe de estudos.</p></footer>\n</body>\n</html>",
                    ["header apresenta a identidade e nav os destinos; main contém o assunto principal.","section reúne um tema; article identifica publicação independente e aside informação complementar.","footer encerra a página; h1, h2 e h3 expressam a hierarquia."],
                    "Planejar uma página antes de aplicar layout e comportamento.",
                    ["Confira se a ordem faz sentido sem estilos.","Não escolha aside apenas para posicionar conteúdo à direita."],
                    "documento")
            ] },
            { id: "formularios-interacao", titulo: "04 — Formulários e interação", assuntos: [
                assunto("introducao-formularios",
                    "Introdução aos formulários",
                    "Consultar introdução aos formulários.",
                    "Formulários coletam dados por controles, como entradas e seleções. HTML define rótulos, nomes e envio nativo, mas não cria processamento no servidor ou banco de dados. Um conjunto básico relaciona form, label, input e button. O rótulo explica o campo e name identifica seu valor no envio.",
                    "<form><label for=\"campo\">Rótulo</label><input id=\"campo\" name=\"campo\"><button type=\"submit\">Enviar</button></form>",
                    "<form method=\"get\">\n    <label for=\"assunto\">Assunto</label>\n    <input id=\"assunto\" name=\"q\" type=\"text\">\n    <button type=\"submit\">Consultar</button>\n</form>",
                    ["form organiza a coleta e, sem action, envia para a URL atual.","for e id associam o rótulo; name=q identifica o dado; submit inicia o envio."],
                    "Preparar uma consulta; mostrar seus resultados exige implementação adicional.",
                    ["Explique o propósito dos campos.","Não confunda enviar com persistir os dados."],
                    "body"),
                assunto("form", "Form", "Agrupar campos e compreender o envio dos valores.",
                    "form reúne controles para coletar e enviar dados. action indica o destino; method define como enviar. Campos precisam de name para participar normalmente do envio. HTML cria a estrutura e o envio nativo, mas não implementa o processamento de um servidor.",
                    "<form action=\"destino\" method=\"get\">Controles</form>",
                    `<form method="get">
    <label for="busca">Buscar assunto</label>
    <input id="busca" name="q" type="search">
    <button type="submit">Buscar</button>
</form>`,
                    ["Sem action, o envio usa a URL atual; get acrescenta dados à consulta da URL.", "name=q identifica o valor e submit aciona o envio."],
                    "Teste em um arquivo HTML e observe a consulta na URL. Exibir resultados exige outra implementação.",
                    ["Não aninhe formulários.", "Não envie informações sensíveis em URLs."]),
                assunto("label", "Label", "Dar um rótulo visível a um controle.",
                    "label descreve o que deve ser preenchido ou escolhido. for aponta para o id do controle; clicar no rótulo normalmente foca ou ativa o controle. placeholder oferece uma dica temporária e não substitui um rótulo persistente.",
                    "<label for=\"nome\">Nome</label>\n<input id=\"nome\" name=\"nome\">",
                    `<label for="nome-completo">Nome completo</label>
<input id="nome-completo" name="nome" type="text" autocomplete="name">`,
                    ["for e id com o mesmo valor fazem a associação.", "autocomplete=name orienta o preenchimento automático."],
                    "Identificar campos de cadastro sem exigir que o usuário adivinhe seu propósito.",
                    ["Mantenha o rótulo visível.", "Use IDs únicos para evitar associações erradas."]),
                assunto("input", "Input", "Configurar controles de entrada para os dados esperados.",
                    "input é vazio e usa type para escolher o controle. id permite associar um rótulo; name identifica o dado enviado; value define um valor inicial. O campo não salva dados automaticamente em armazenamento local ou banco de dados.",
                    "<input type=\"text\" id=\"cidade\" name=\"cidade\" value=\"Recife\">",
                    `<label for="cidade">Cidade</label>
<input type="text" id="cidade" name="cidade" value="Recife" maxlength="80">`,
                    ["value inicia um texto que pode ser editado.", "maxlength limita caracteres; name identifica o dado em um envio."],
                    "Oferecer um valor inicial editável em um formulário de perfil.",
                    ["Escolha o tipo conforme a informação.", "Não use value como substituto de label."]),
                assunto("tipos-input", "Tipos de input", "Escolher controles e verificações adequados ao dado.",
                    "text aceita texto geral; email verifica um formato de endereço; date representa uma data; checkbox representa uma escolha booleana. number serve para quantidades, não para identificadores com zeros iniciais. A aparência pode variar conforme navegador e sistema operacional.",
                    "<input type=\"email\">\n<input type=\"date\">\n<input type=\"checkbox\">",
                    `<label for="email">E-mail</label>
<input id="email" name="email" type="email" autocomplete="email">
<label for="data-estudo">Data de estudo</label>
<input id="data-estudo" name="data" type="date">
<label><input name="lembrete" type="checkbox" value="sim"> Desejo um lembrete</label>`,
                    ["email verifica formato, não a existência do endereço.", "date escolhe uma data; checkbox participa do envio normal somente quando marcado."],
                    "Coletar contatos, datas e preferências em controles reconhecidos pelo dispositivo.",
                    ["Use tel para telefone e text para códigos, não number.", "Teste em diferentes navegadores sem depender de uma aparência única."]),
                assunto("textarea", "Textarea", "Coletar texto com várias linhas.",
                    "textarea aceita texto extenso e quebras de linha. Seu valor inicial fica entre as tags, não em um atributo value. rows sugere a quantidade de linhas visíveis sem limitar a quantidade digitada.",
                    "<textarea name=\"mensagem\" rows=\"4\">Texto inicial</textarea>",
                    `<label for="anotacoes">Anotações da aula</label>
<textarea id="anotacoes" name="anotacoes" rows="5" maxlength="1000">Hoje aprendi sobre formulários.</textarea>`,
                    ["O texto entre as tags é o valor inicial editável.", "rows ajusta a área visível; maxlength limita caracteres."],
                    "Registrar observações, mensagens ou descrições de um projeto.",
                    ["Não insira indentação extra dentro da tag se ela não deve compor o valor.", "Ofereça um rótulo e espaço confortável de escrita."]),
                assunto("select", "Select", "Oferecer alternativas predefinidas de seleção.",
                    "select reúne opções em option. value pode ser diferente do texto visível. Sem multiple, normalmente uma opção é escolhida; selected marca uma escolha inicial. O controle é útil quando os valores aceitos já são conhecidos.",
                    "<select name=\"nivel\"><option value=\"basico\">Básico</option></select>",
                    `<label for="nivel-estudo">Nível de estudo</label>
<select id="nivel-estudo" name="nivel" required>
    <option value="">Escolha um nível</option>
    <option value="basico">Básico</option>
    <option value="intermediario">Intermediário</option>
    <option value="avancado">Avançado</option>
</select>`,
                    ["label identifica o controle e name identifica o dado.", "A primeira opção tem valor vazio; required exige uma escolha válida no envio."],
                    "Coletar uma categoria entre alternativas reconhecidas pela aplicação.",
                    ["Use nomes claros para opções.", "Não navegue automaticamente apenas porque uma opção recebeu foco."]),
                assunto("button", "Button", "Distinguir envio, restauração e outras ações.",
                    "button oferece interação nativa por mouse, toque e teclado. Dentro de form, omitir type pode causar envio. submit envia; reset restaura valores iniciais; button não envia e pode receber uma ação de JavaScript quando ela estiver implementada.",
                    "<button type=\"submit\">Enviar</button>",
                    `<form method="get">
    <label for="tema">Tema</label>
    <input id="tema" name="tema" value="HTML">
    <button type="submit">Enviar tema</button>
    <button type="reset">Restaurar valor inicial</button>
</form>`,
                    ["submit envia para a URL atual.", "reset restaura HTML e não necessariamente esvazia o campo."],
                    "Evitar que botões destinados a outras ações enviem um formulário por acidente.",
                    ["Declare type explicitamente.", "Evite reset quando puder descartar alterações importantes."]),
                assunto("atributos-campos",
                    "Name, id, value e placeholder",
                    "Consultar name, id, value e placeholder.",
                    "id identifica um elemento e permite associar label; name identifica o dado enviado. value define o valor inicial de controles como input. placeholder é uma dica exibida quando um campo compatível está vazio e não substitui o rótulo. Os atributos possuem funções diferentes e podem usar valores distintos.",
                    "<input id=\"campo\" name=\"dado\" value=\"Inicial\" placeholder=\"Dica\">",
                    "<label for=\"cidade-form\">Cidade</label>\n<input id=\"cidade-form\" name=\"cidade\" type=\"text\" value=\"Recife\" placeholder=\"Ex.: Salvador\">",
                    ["id=cidade-form vincula o rótulo; name=cidade é a chave do envio.","value inicia Recife; placeholder aparece somente depois que o campo é esvaziado."],
                    "Definir valores editáveis e identificadores coerentes em um formulário.",
                    ["Use IDs únicos.","Não use placeholder ou value como instrução permanente no lugar de label."],
                    "body"),
                assunto("restricoes-campos",
                    "Required, minlength e maxlength",
                    "Consultar required, minlength e maxlength.",
                    "required exige preenchimento em controles compatíveis. minlength e maxlength definem limites de caracteres de entradas textuais. No envio normal, o navegador pode impedir valores inválidos e mostrar suas mensagens. Essas restrições não substituem a validação no servidor, pois dados podem ser enviados fora da interface.",
                    "<input required minlength=\"3\" maxlength=\"20\">",
                    "<form method=\"get\">\n    <label for=\"apelido-limite\">Apelido, de 3 a 20 caracteres</label>\n    <input id=\"apelido-limite\" name=\"apelido\" required minlength=\"3\" maxlength=\"20\">\n    <button type=\"submit\">Enviar</button>\n</form>",
                    ["required impede valor vazio no envio normal.","minlength e maxlength restringem comprimento, sem definir os caracteres permitidos."],
                    "Declarar limites simples acompanhados de orientação visível.",
                    ["Informe os requisitos antes do envio.","Não trate essas restrições como segurança do servidor."],
                    "body"),
                assunto("validacao-nativa", "Validação nativa", "Declarar restrições básicas para o envio.",
                    "required exige valor; minlength e maxlength restringem certos textos; min e max restringem valores compatíveis. O navegador verifica as condições no envio normal e mostra mensagens próprias. Essa validação não garante segurança: um servidor também deve validar o que recebe.",
                    "<input required minlength=\"3\" maxlength=\"20\">",
                    `<form method="get">
    <label for="apelido">Apelido, de 3 a 20 caracteres</label>
    <input id="apelido" name="apelido" required minlength="3" maxlength="20">
    <label for="horas">Horas de estudo, de 1 a 8</label>
    <input id="horas" name="horas" type="number" min="1" max="8" step="1" required>
    <button type="submit">Verificar e enviar</button>
</form>`,
                    ["required impede valor vazio; os limites restringem as entradas.", "step=1 define incrementos inteiros para horas."],
                    "Testar campos vazios, textos curtos e valores fora dos limites.",
                    ["Explique requisitos no texto do formulário.", "Não confie apenas no navegador para rejeitar dados maliciosos."]),
                assunto("formularios-acessiveis",
                    "Organização e acessibilidade básica de formulários",
                    "Consultar organização e acessibilidade básica de formulários.",
                    "fieldset agrupa controles relacionados e legend identifica o grupo. Cada controle precisa de rótulo; instruções adicionais podem ser associadas por aria-describedby. Esse atributo aponta para o id de um texto existente, sem substituir label. A ordem do documento deve acompanhar a ordem de preenchimento.",
                    "<fieldset><legend>Grupo</legend>Controles relacionados</fieldset>",
                    "<fieldset>\n    <legend>Contato</legend>\n    <label for=\"email-grupo\">E-mail</label>\n    <input id=\"email-grupo\" name=\"email\" type=\"email\" aria-describedby=\"email-ajuda\">\n    <p id=\"email-ajuda\">Informe o endereço para receber a resposta.</p>\n</fieldset>",
                    ["fieldset e legend identificam o conjunto de campos.","for associa o rótulo; aria-describedby conecta a instrução complementar."],
                    "Organizar grupos identificáveis por tecnologias assistivas.",
                    ["Mantenha rótulos e instruções visíveis.","Não use ARIA para compensar rótulos ausentes quando label resolve a relação."],
                    "body")
            ] },
            { id: "recursos-complementares", titulo: "05 — Recursos complementares", assuntos: [
                assunto("tabelas", "Tabelas", "Representar dados relacionados em linhas e colunas.",
                    "table organiza dados tabulares; tr cria linhas; th identifica cabeçalhos; td contém valores. caption dá um título. scope informa se o cabeçalho descreve linha ou coluna. Não use tabelas para organizar o layout geral da página.",
                    "<table><caption>Título</caption><tr><th scope=\"col\">Coluna</th></tr><tr><td>Valor</td></tr></table>",
                    `<table>
    <caption>Horas de estudo por assunto</caption>
    <thead><tr><th scope="col">Assunto</th><th scope="col">Horas</th></tr></thead>
    <tbody>
        <tr><th scope="row">HTML</th><td>4</td></tr>
        <tr><th scope="row">CSS</th><td>3</td></tr>
    </tbody>
</table>`,
                    ["thead e tbody agrupam cabeçalhos e dados.", "scope associa linhas e colunas; caption identifica o conjunto."],
                    "Mostrar um cronograma ou comparar dados com dois eixos.",
                    ["Inclua cabeçalhos e título explicativos.", "Planeje rolagem do recipiente com CSS para tabelas largas."]),
                assunto("elementos-tabela",
                    "Table, tr, th e td",
                    "Consultar table, tr, th e td.",
                    "table reúne dados tabulares; tr delimita uma linha; th representa cabeçalho e td contém valores. scope em th informa se o cabeçalho descreve coluna ou linha. Um cabeçalho é informação estrutural, não apenas texto em negrito. A quantidade e posição das células precisam representar as relações dos dados.",
                    "<table><tr><th scope=\"col\">Assunto</th></tr><tr><td>HTML</td></tr></table>",
                    "<table>\n    <caption>Materiais disponíveis</caption>\n    <tr><th scope=\"col\">Assunto</th><th scope=\"col\">Formato</th></tr>\n    <tr><th scope=\"row\">HTML</th><td>Documentação</td></tr>\n</table>",
                    ["caption identifica a tabela; tr organiza cada linha.","th com scope relaciona cabeçalhos; td contém o formato associado ao assunto."],
                    "Criar uma comparação pequena com cabeçalhos identificáveis.",
                    ["Use th para cabeçalhos e td para valores.","Não use tabelas para montar o layout geral da página."],
                    "body"),
                assunto("audio", "Áudio", "Disponibilizar reprodução manual de mídia sonora.",
                    "audio incorpora som; controls oferece os controles nativos. source informa o arquivo e seu tipo. O suporte ao formato depende do navegador. Uma transcrição deve acompanhar o áudio quando o conteúdo for necessário à compreensão da página.",
                    "<audio controls><source src=\"audio/aula.mp3\" type=\"audio/mpeg\"></audio>",
                    `<audio controls preload="metadata">
    <source src="audio/introducao.mp3" type="audio/mpeg">
    Seu navegador não oferece o elemento de áudio.
</audio>
<p><a href="transcricao.html">Ler a transcrição da introdução</a></p>`,
                    ["controls permite comandar a reprodução; preload sugere carregar metadados.", "O link oferece a alternativa textual fora do elemento de mídia."],
                    "Forneça audio/introducao.mp3 e transcricao.html para publicar uma aula gravada.",
                    ["Evite reprodução automática inesperada.", "Ofereça transcrição e teste o formato."]),
                assunto("video", "Vídeo", "Inserir vídeo com controles e legendas.",
                    "video disponibiliza mídia audiovisual. source indica o arquivo e track pode carregar legendas WebVTT. playsinline solicita reprodução dentro da página em dispositivos compatíveis. HTML referencia os arquivos, sem produzir vídeo ou legendas.",
                    "<video controls playsinline><source src=\"video/aula.mp4\" type=\"video/mp4\"></video>",
                    `<video controls playsinline preload="metadata" width="320">
    <source src="video/aula.mp4" type="video/mp4">
    <track kind="captions" src="video/aula-pt.vtt" srclang="pt-BR" label="Português" default>
    Seu navegador não oferece o elemento de vídeo.
</video>
<p><a href="transcricao-video.html">Ler a transcrição da aula</a></p>`,
                    ["source informa a mídia; track associa uma faixa de legendas com idioma e nome.", "controls oferece reprodução manual; a largura pode ser adaptada com CSS."],
                    "Forneça MP4, VTT e transcrição para uma demonstração. Teste legendas por HTTP na mesma origem.",
                    ["Inclua sons relevantes nas legendas.", "Adapte a largura no CSS e não exija autoplay para acessar conteúdo."]),
                assunto("iframe",
                    "Incorporação de conteúdo com iframe",
                    "Consultar incorporação de conteúdo com iframe.",
                    "iframe cria outro contexto de navegação dentro da página. src aponta para uma página existente; srcdoc pode fornecer um documento inline. title identifica o conteúdo incorporado para acessibilidade. sandbox sem permissões bloqueia scripts e outras ações; conceda somente as permissões necessárias ao conteúdo confiável.",
                    "<iframe title=\"Conteúdo incorporado\" sandbox=\"\" srcdoc=\"&lt;p&gt;Olá&lt;/p&gt;\"></iframe>",
                    "<iframe title=\"Mensagem incorporada\" sandbox=\"\" referrerpolicy=\"no-referrer\"\n        srcdoc=\"&lt;p&gt;Conteúdo de outro documento.&lt;/p&gt;\"></iframe>",
                    ["iframe mantém o conteúdo em outro documento; title nomeia esse contexto.","sandbox restringe capacidades e referrerpolicy limita informação de referência."],
                    "Incorporar conteúdo respeitando seus limites de confiança e origem.",
                    ["Avalie a necessidade de cada permissão.","Não combine allow-scripts e allow-same-origin indiscriminadamente."],
                    "body"),
                assunto("atributos-globais",
                    "Atributos globais",
                    "Consultar atributos globais.",
                    "Atributos globais oferecem identificação, idioma e outros recursos aos elementos HTML. id identifica um elemento, class agrupa elementos, lang declara idioma e hidden oculta conteúdo. Poder usar um atributo não significa que ele é útil em qualquer contexto. title oferece informação adicional e não substitui um rótulo acessível.",
                    "<p id=\"resumo\" class=\"nota\" lang=\"pt-BR\">Texto.</p>",
                    "<p id=\"resumo-global\" class=\"nota\" lang=\"pt-BR\">Resumo disponível.</p>\n<p hidden>Conteúdo temporariamente oculto.</p>",
                    ["id deve ser único; class pode ser compartilhada.","lang orienta o idioma; hidden oculta o segundo parágrafo sem excluir sua marcação."],
                    "Identificar elementos para referências e declarar idiomas ou estados.",
                    ["Não oculte controles necessários ao fluxo principal.","Não use title como única fonte de instruções."],
                    "body"),
                assunto("data-atributos",
                    "Atributos personalizados data-*",
                    "Consultar atributos personalizados data-*.",
                    "data-* associa dados próprios a um elemento sem inventar atributos fora do padrão. Os valores são textos e não produzem ações automaticamente. Um script pode consultá-los por dataset: data-produto-id corresponde a dataset.produtoId. Esses dados ficam disponíveis no documento e não são adequados para informações privadas.",
                    "<button type=\"button\" data-produto-id=\"42\">Consultar</button>",
                    "<button type=\"button\" data-assunto=\"html\" data-nivel=\"basico\">Consultar HTML</button>",
                    ["data-assunto e data-nivel guardam identificações para uma integração futura.","button continua sendo o controle; sem comportamento implementado, seu clique não abre outro conteúdo."],
                    "Identificar itens para tratamento posterior, sem alterar o texto visível.",
                    ["Use nomes em minúsculas e hífens.","Não guarde credenciais ou permissões de acesso nesses atributos."],
                    "body"),
                assunto("elementos-adicionais",
                    "Elementos adicionais relevantes",
                    "Consultar elementos adicionais relevantes.",
                    "figure e figcaption associam um recurso à sua legenda. dl relaciona termos e descrições por dt e dd. details e summary oferecem expansão nativa; time pode fornecer uma data legível acompanhada de datetime. Escolha o elemento conforme a relação do conteúdo, sem incluir todos por obrigação.",
                    "<details><summary>Título da expansão</summary><p>Detalhe.</p></details>",
                    "<figure>\n    <pre><code>&lt;p&gt;Um parágrafo.&lt;/p&gt;</code></pre>\n    <figcaption>Exemplo de marcação.</figcaption>\n</figure>\n<dl><dt>HTML</dt><dd>Linguagem de marcação.</dd></dl>\n<details><summary>Data do material</summary>\n    <p><time datetime=\"2026-10-12\">12 de outubro de 2026</time></p>\n</details>",
                    ["figure mantém exemplo e legenda juntos; as entidades exibem tags como texto.","dt e dd associam termo e descrição; summary controla details; datetime padroniza a data."],
                    "Apresentar exemplos, glossários e informações complementares com elementos nativos.",
                    ["Coloque figcaption como primeiro ou último filho de figure.","Não acrescente um estado aria-expanded separado ao details sem necessidade."],
                    "body")
            ] }
        ] },
        { id: "avancado", nome: "Avançado", assuntos: [], modulos: [
            { id: "qualidade-boas-praticas", titulo: "06 — Qualidade e boas práticas", assuntos: [
                assunto("acessibilidade",
                    "Acessibilidade em HTML",
                    "Consultar acessibilidade em html.",
                    "Acessibilidade permite perceber, compreender e operar conteúdo de diferentes formas. HTML nativo fornece nomes, funções e interação de teclado, enquanto contraste e foco também dependem do CSS. A ordem do DOM orienta a navegação por Tab. ARIA complementa nomes, relações e estados quando necessário, mas não cria foco ou comportamento.",
                    "<a href=\"#conteudo\">Ir para o conteúdo</a>",
                    "<a href=\"#conteudo-acessivel\">Ir para o conteúdo</a>\n<main id=\"conteudo-acessivel\" tabindex=\"-1\">\n    <h1>Referência de HTML</h1>\n    <details><summary>Como consultar?</summary><p>Use os títulos para localizar assuntos.</p></details>\n</main>",
                    ["O link oferece um salto; tabindex=-1 torna main focável fora da sequência normal de Tab.","details e summary oferecem expansão de teclado nativa."],
                    "Revisar uma página com teclado e tecnologia assistiva para identificar barreiras.",
                    ["Mantenha foco visível e evite tabindex positivo.","Prefira controles nativos; não use aria-hidden em elementos focáveis."],
                    "body"),
                assunto("semantica-acessibilidade", "HTML semântico e acessibilidade", "Relacionar elementos nativos à navegação assistiva.",
                    "Elementos nativos comunicam funções e oferecem comportamentos de teclado nos controles. Regiões como nav e main ajudam a percorrer páginas. Essa base não basta sozinha: contraste, foco, linguagem e testes de uso também fazem parte da acessibilidade.",
                    "<main><h1>Título principal</h1><p>Conteúdo</p></main>",
                    `<nav aria-label="Seções da aula"><a href="#resumo">Resumo</a></nav>
<main>
    <h1>Aula de formulários</h1>
    <section id="resumo" aria-labelledby="titulo-resumo">
        <h2 id="titulo-resumo">Resumo</h2>
        <p>Controles nativos oferecem uma base de interação acessível.</p>
    </section>
</main>`,
                    ["nav fornece uma região identificada e um destino real.", "aria-labelledby usa o título visível como nome da seção."],
                    "Revisar uma aula antes composta apenas de recipientes genéricos.",
                    ["Prefira semântica nativa antes de ARIA.", "Teste teclado e, quando possível, leitor de tela."]),
                assunto("textos-alternativos", "Textos alternativos", "Escolher alternativas conforme a função da imagem.",
                    "Imagens informativas precisam comunicar a informação relevante em alt; imagens puramente decorativas usam alt vazio. Se a imagem é o único conteúdo de um link, a alternativa deve comunicar o destino ou função. Gráficos complexos também precisam de uma explicação equivalente próxima ou vinculada.",
                    "<img src=\"decoracao.png\" alt=\"\">\n<a href=\"index.html\"><img src=\"marca.png\" alt=\"Página inicial\"></a>",
                    `<a href="index.html">
    <img src="images/marca.png" alt="Página inicial do Portal de Estudos">
</a>
<img src="images/ornamento.png" alt="">`,
                    ["O alt da marca comunica o destino, não apenas a aparência.", "alt vazio identifica uma decoração; omitir alt não expressa essa mesma intenção."],
                    "Forneça as imagens para revisar uma marca clicável e um ornamento decorativo.",
                    ["Avalie a função no contexto.", "Não repita texto adjacente sem necessidade nem prefixe tudo com imagem de."]),
                assunto("metadados",
                    "Metadados do documento",
                    "Consultar metadados do documento.",
                    "Metadados descrevem o documento para navegadores e outros consumidores. charset define a codificação, viewport orienta o layout inicial e title identifica a aba. lang pertence a html e indica o idioma, não a codificação. Open Graph pode fornecer informações para cartões de compartilhamento, sem substituir title ou garantir resultados de busca.",
                    "<meta charset=\"UTF-8\">\n<title>Título do documento</title>",
                    "<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n<title>Guia de HTML | Portal de Estudos</title>\n<meta property=\"og:title\" content=\"Guia de HTML\">\n<meta property=\"og:type\" content=\"website\">\n<meta property=\"og:url\" content=\"https://example.org/guia.html\">\n<meta property=\"og:image\" content=\"https://example.org/images/guia.png\">\n<meta property=\"og:image:alt\" content=\"Capa do Guia de HTML\">",
                    ["charset e viewport definem propriedades de interpretação e dimensionamento.","title nomeia a aba; campos og:* são usados por serviços de compartilhamento compatíveis."],
                    "Revisar o head de uma página publicada; substitua example.org por URLs reais e confira lang na raiz.",
                    ["Não bloqueie o zoom do usuário.","Um trecho em outro idioma pode receber lang próprio; teste cartões no serviço de destino e considere seu cache."],
                    "head"),
                assunto("seo-tecnico",
                    "Introdução ao SEO técnico",
                    "Consultar introdução ao seo técnico.",
                    "SEO técnico ajuda buscadores a acessar e compreender o conteúdo publicado. Títulos claros, descrições fiéis, headings coerentes e links com destinos reais contribuem para essa compreensão. Acesso do servidor e qualidade do conteúdo também importam. Uma description pode ser usada no resumo de busca, sem garantir classificação ou exibição exata.",
                    "<meta name=\"description\" content=\"Resumo fiel do conteúdo.\">",
                    "<title>Elementos HTML | Portal de Estudos</title>\n<meta name=\"description\" content=\"Referência de elementos HTML, suas funções e exemplos de utilização.\">",
                    ["title identifica o assunto específico.","description oferece um resumo; o buscador pode escolher outro trecho conforme a consulta."],
                    "Preparar uma referência publicada com conteúdo correspondente à descrição e URLs acessíveis.",
                    ["Não repita palavras-chave artificialmente.","Confira links e acesso; metadados não garantem indexação ou posicionamento."],
                    "head"),
                assunto("manutencao", "Boas práticas de manutenção", "Preservar referências e significado nas mudanças.",
                    "Nomes claros, IDs estáveis e ausência de duplicação facilitam alterações. Antes de renomear elementos, procure referências em links, CSS e JavaScript. A manutenção deve preservar significado, acessibilidade e comportamento, não apenas aparência.",
                    "<a href=\"#plano-estudos\">Plano</a>\n<section id=\"plano-estudos\">...</section>",
                    `<nav aria-label="Nesta página">
    <a href="#plano-estudos">Plano de estudos</a>
</nav>
<section id="plano-estudos" aria-labelledby="titulo-plano">
    <h2 id="titulo-plano">Plano de estudos</h2>
    <p>Revise um assunto por dia e registre suas dúvidas.</p>
</section>`,
                    ["plano-estudos é usado pelo fragmento do link.", "titulo-plano é referenciado por aria-labelledby; renomeá-lo exige atualizar essa relação."],
                    "Alterar uma seção de documentação preservando seus links e nome acessível.",
                    ["Pesquise referências antes de renomear IDs e arquivos.", "Depois da mudança, teste links, teclado e carregamento."]),
                assunto("integracao-externos",
                    "Integração correta com arquivos externos",
                    "Consultar integração correta com arquivos externos.",
                    "Após conectar recursos, verifique URLs e momento de carregamento. Scripts clássicos com defer executam após a análise do HTML, na ordem do documento; async não garante essa ordem. Módulos são diferidos por padrão sem async. CSS resolve suas próprias URLs relativas. Investigue erros de caminho, cache e respostas na aba Rede, sem mascará-los copiando arquivos para dentro do HTML.",
                    "<link rel=\"stylesheet\" href=\"style.css\">\n<script src=\"script.js\" defer></script>",
                    "<link rel=\"stylesheet\" href=\"style.css\">\n<script src=\"configuracao.js\" defer></script>\n<script src=\"script.js\" defer></script>",
                    ["href e src localizam recursos que precisam existir.","defer conserva a ordem configuracao.js antes de script.js nestes scripts clássicos."],
                    "Revisar uma publicação em que a marcação aparece, mas estilos ou comportamentos não carregam.",
                    ["Confira status, URL final e conteúdo da resposta na aba Rede.","Não use async quando houver dependência de ordem; confira capitalização e prefixo da publicação."],
                    "head"),
                assunto("validacao-html", "Validação de HTML", "Usar um verificador de conformidade e entender seu alcance.",
                    "O Nu HTML Checker identifica problemas como aninhamento inválido, atributos inadequados e IDs duplicados. Não substitui testes de links, acessibilidade e carregamento. O navegador conseguir mostrar uma página não comprova a conformidade de sua marcação.",
                    "<!-- Valide o documento completo, incluindo DOCTYPE, head e body. -->",
                    `<!doctype html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Página para validar</title></head>
<body>
    <h1>Lista de revisão</h1>
    <ul>
        <li>IDs únicos</li>
        <li>Aninhamento coerente</li>
    </ul>
    <p><a href="https://validator.w3.org/nu/">Abrir o verificador de HTML</a></p>
</body>
</html>`,
                    ["O documento completo fornece contexto à verificação.", "O link abre o serviço onde você pode colar ou enviar seu arquivo."],
                    "Validar antes de publicar e repetir após alterações estruturais.",
                    ["Leia cada erro e sua localização; uma falha pode gerar várias mensagens.", "Teste também funcionamento e não envie documentos sensíveis a serviços públicos."], "documento"),
                assunto("erros-comuns", "Erros comuns", "Reconhecer falhas que quebram estrutura ou referências.",
                    "IDs repetidos, fechamentos fora de ordem e caminhos incorretos são frequentes. Colocar div dentro de p também é inválido: o navegador fecha o parágrafo antes da div, alterando o DOM. Ajuste a estrutura em vez de confiar na recuperação automática.",
                    "<div><p>Texto</p><p>Outro texto</p></div>",
                    `<div class="aviso">
    <p>Revise os arquivos antes de publicar.</p>
    <p><a href="#revisao">Consultar a revisão</a></p>
</div>
<section id="revisao">
    <h2>Revisão</h2>
    <p>Confira aninhamento, IDs e caminhos.</p>
</section>`,
                    ["div envolve parágrafos completos, sem ser inserida dentro deles.", "O fragmento corresponde a um único id presente."],
                    "Investigar um layout cuja árvore real ficou diferente da marcação esperada.",
                    ["Inspecione DOM, console e Rede conforme o erro.", "Confira a capitalização de caminhos e valide o documento."]),
                assunto("boas-praticas",
                    "Boas práticas de desenvolvimento",
                    "Consultar boas práticas de desenvolvimento.",
                    "Um documento sustentável combina semântica, referências coerentes e revisão contínua. Indentação ajuda a leitura, mas conformidade e acessibilidade exigem verificações próprias. Registre decisões relevantes, mantenha IDs estáveis e evite duplicação sem apagar informação útil. Ao mover arquivos, revise quem os referencia.",
                    "<section aria-labelledby=\"titulo\"><h2 id=\"titulo\">Tema</h2></section>",
                    "<section aria-labelledby=\"titulo-referencia\">\n    <h2 id=\"titulo-referencia\">Referências</h2>\n    <p><a href=\"https://developer.mozilla.org/pt-BR/docs/Web/HTML\">Documentação de HTML</a></p>\n</section>",
                    ["O título visível nomeia a seção por uma referência explícita.","O link informa seu destino e o ID permanece único."],
                    "Definir critérios de revisão para alterações de conteúdo e estrutura.",
                    ["Não confunda formatação com validação.","Revise semântica, teclado, caminhos e conteúdo alternativo depois das mudanças."],
                    "body"),
                assunto("revisao-pagina",
                    "Revisão da estrutura de uma página completa",
                    "Consultar revisão da estrutura de uma página completa.",
                    "A revisão relaciona informações do head, regiões do body e conexões externas. Cada região precisa ter função clara, títulos devem representar subdivisões e formulários devem ter rótulos. O exemplo apresenta conteúdo sem depender de JavaScript. style.css e script.js são referências e não são criados pelo documento.",
                    "<!DOCTYPE html>\n<html lang=\"pt-BR\"><head>...</head><body>...</body></html>",
                    "<!DOCTYPE html>\n<html lang=\"pt-BR\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <meta name=\"description\" content=\"Informações sobre a biblioteca do bairro.\">\n    <title>Biblioteca do bairro</title>\n    <link rel=\"stylesheet\" href=\"style.css\">\n    <script src=\"script.js\" defer></script>\n</head>\n<body>\n    <header><p>Biblioteca do bairro</p>\n        <nav aria-label=\"Principal\"><a href=\"#servicos\">Serviços</a></nav>\n    </header>\n    <main>\n        <h1>Informações da biblioteca</h1>\n        <section id=\"servicos\"><h2>Serviços</h2>\n            <ul><li>Consulta ao acervo</li><li>Leitura no local</li></ul>\n        </section>\n    </main>\n    <footer><p>Atendimento de segunda a sexta.</p></footer>\n</body>\n</html>",
                    ["head reúne codificação, viewport, descrição, título e conexões.","header e nav apresentam identidade e navegação; main contém o assunto, section um tema e footer o encerramento."],
                    "Conferir uma página antes de publicar, sem depender de uma sequência obrigatória de exercícios.",
                    ["Forneça os arquivos externos para testar a integração.","Valide o documento e confira links, teclado e layout em diferentes telas."],
                    "documento")
            ] }
        ] }
    ]
};
