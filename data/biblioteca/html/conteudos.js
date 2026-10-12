// HTML — Conteúdo - progressão didática com exemplos exibidos como texto.
function assunto(id, titulo, objetivo, explicacao, sintaxe, exemploCodigo, responsabilidadeCodigo, aplicacaoReal, boasPraticas, contextoExemplo = "body") {
    return { id, titulo, objetivo, explicacao, sintaxe, exemploCodigo, responsabilidadeCodigo, aplicacaoReal, boasPraticas, contextoExemplo };
}

export const conteudos = {
    id: "html", nome: "HTML",
    niveis: [
        { id: "basico", nome: "Básico", assuntos: [], modulos: [
            { id: "introducao", titulo: "1. Introdução ao HTML", assuntos: [
                assunto("o-que-e-html", "O que é HTML", "Reconhecer o papel do HTML na construção de páginas.",
                    "HTML é uma linguagem de marcação: seus elementos identificam o significado e a estrutura do conteúdo. Um título, um parágrafo e um link têm funções diferentes, mesmo antes de receberem estilos. CSS cuida da apresentação; JavaScript pode acrescentar comportamento. HTML não é uma linguagem de programação.",
                    "<p>Conteúdo de um parágrafo.</p>",
                    `<h1>Meu primeiro site</h1>
<p>Estou aprendendo a estruturar conteúdo com HTML.</p>
<a href="https://developer.mozilla.org/pt-BR/">Consultar a documentação</a>`,
                    ["h1 identifica o título principal desse conteúdo.", "p delimita um parágrafo; a cria um link cujo destino está em href."],
                    "Montar o conteúdo de uma página antes de decidir suas cores e interações.",
                    ["Escolha elementos pelo significado.", "Não use tags de título apenas para obter uma fonte maior."]),
                assunto("interpretacao-navegador", "Como o navegador interpreta HTML", "Entender como a marcação se torna uma árvore de elementos.",
                    "O navegador lê a marcação e constrói o DOM, uma árvore que representa o documento em memória. Elementos aninhados formam relações de pai e filho. O navegador carrega os recursos referenciados e combina o documento com estilos para apresentar a página. Sua recuperação automática de alguns erros não torna uma marcação incorreta confiável.",
                    "<main><p>Texto com <strong>importância</strong>.</p></main>",
                    `<main>
    <h1>Biblioteca</h1>
    <p>Estude <strong>HTML</strong> com exemplos.</p>
</main>`,
                    ["main é pai de h1 e p nessa árvore.", "strong é filho de p e marca importância sem interromper o parágrafo."],
                    "Comparar o código-fonte com a árvore na aba Elementos das ferramentas do navegador.",
                    ["Inspecione o DOM ao investigar aninhamento.", "Não dependa da recuperação automática de erros."]),
                assunto("estrutura-documento", "Estrutura básica de um documento", "Criar um arquivo HTML completo e pronto para abrir.",
                    "Um documento separa metadados, no head, do conteúdo apresentado, no body. charset permite interpretar acentos; viewport prepara o dimensionamento em dispositivos móveis. Salve o exemplo como index.html em UTF-8 e abra-o no navegador.",
                    "<!doctype html>\n<html lang=\"pt-BR\">\n    <head>...</head>\n    <body>...</body>\n</html>",
                    `<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Minha primeira página</title>
</head>
<body>
    <h1>Olá, mundo!</h1>
    <p>Este documento está pronto para receber conteúdo.</p>
</body>
</html>`,
                    ["lang declara o idioma; charset define a codificação.", "title nomeia a aba; h1 é o título visível dentro de body."],
                    "Iniciar uma página independente de apresentação.",
                    ["Mantenha os metadados no head.", "Use um título que identifique a página."], "documento"),
                assunto("doctype-html-head-body", "DOCTYPE, html, head e body", "Distinguir a declaração inicial das regiões do documento.",
                    "DOCTYPE é uma declaração e solicita o modo de padrões do navegador. html é o elemento raiz. head reúne informações sobre o documento; body contém o conteúdo da página. O texto de title não substitui um título visível.",
                    "<!doctype html>\n<html>\n    <head><title>Título da aba</title></head>\n    <body>Conteúdo visível</body>\n</html>",
                    `<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Contato | Meu site</title>
</head>
<body>
    <h1>Entre em contato</h1>
    <p>Envie uma mensagem para nossa equipe.</p>
</body>
</html>`,
                    ["DOCTYPE precede html e não possui fechamento.", "head e body separam informações do documento e conteúdo apresentado."],
                    "Corrigir um arquivo que misturou metadados com texto visível.",
                    ["Use uma única estrutura html/head/body.", "Coloque DOCTYPE no início do arquivo."], "documento")
            ] },
            { id: "elementos-atributos", titulo: "2. Elementos e atributos", assuntos: [
                assunto("tags-elementos", "Tags e elementos", "Identificar abertura, fechamento e elementos vazios.",
                    "Uma tag é uma marcação delimitada por sinais de menor e maior. O elemento inclui abertura, conteúdo e fechamento, quando existem. Elementos vazios, como img e br, não recebem conteúdo nem fechamento. A indentação ajuda a ler o aninhamento sem mudar o significado.",
                    "<strong>Texto importante</strong>\n<br>",
                    `<p>Leia o <strong>aviso de segurança</strong> antes de continuar.</p>
<p>Primeira linha<br>Segunda linha</p>`,
                    ["strong marca um trecho importante dentro de p.", "br é vazio e representa uma quebra textual."],
                    "Destacar uma advertência dentro de um parágrafo.",
                    ["Feche elementos na ordem inversa de abertura.", "Não escreva </br> ou </img>."]),
                assunto("atributos", "Atributos HTML", "Configurar elementos pela tag de abertura.",
                    "Atributos fornecem informações ou ajustam um elemento. Alguns são globais, como id e class; outros dependem da tag, como href em a. Atributos booleanos, como disabled, são ativados pela presença: disabled=\"false\" ainda desabilita o botão.",
                    "<a href=\"destino.html\" class=\"link\">Texto</a>",
                    `<a id="link-estudos" class="link-destaque" href="estudos.html">Meus estudos</a>
<button type="button" disabled>Disponível em breve</button>`,
                    ["href define o destino; id identifica um elemento e class agrupa elementos para CSS ou scripts.", "disabled impede a interação nativa com o botão."],
                    "Identificar elementos e destinos; crie estudos.html para testar o link local.",
                    ["Use aspas nos valores e IDs únicos.", "Remova atributos booleanos para desativá-los."]),
                assunto("titulos-paragrafos", "Títulos e parágrafos", "Organizar a leitura com títulos e blocos de texto.",
                    "h1 a h6 representam níveis de títulos, não tamanhos de fonte escolhidos livremente. p agrupa um parágrafo. Ao subdividir uma seção, use o nível seguinte para comunicar a relação entre os conteúdos.",
                    "<h1>Página</h1>\n<h2>Seção</h2>\n<p>Texto.</p>",
                    `<h1>Meu plano de estudos</h1>
<p>Reservei um horário diário para aprender.</p>
<h2>Semana 1</h2>
<p>Vou estudar os elementos básicos do HTML.</p>`,
                    ["h1 apresenta o assunto geral e h2 uma subdivisão.", "Cada p reúne uma ideia em um bloco de texto."],
                    "Estruturar um plano de estudos para localizar suas etapas.",
                    ["Não salte níveis apenas para obter uma fonte menor.", "Controle a aparência dos títulos com CSS."]),
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
                assunto("quebras-separadores", "Quebras de linha e separadores", "Diferenciar uma quebra textual de uma mudança temática.",
                    "br indica uma quebra necessária no mesmo texto, como em um endereço ou poema. hr representa uma mudança de tema. Não devem ser repetidos para criar espaçamento ou substituir a estrutura de parágrafos.",
                    "Texto<br>Continuação\n<hr>",
                    `<p>Rua dos Estudos, 120<br>Recife — PE</p>
<hr>
<p>Atendimento: segunda a sexta.</p>`,
                    ["br separa as linhas do endereço.", "hr indica a transição para outro tema."],
                    "Apresentar um endereço e separar informações de atendimento.",
                    ["Use p para parágrafos e CSS para margens.", "br e hr são elementos vazios."])
            ] },
            { id: "conteudo-navegacao", titulo: "3. Conteúdo e navegação", assuntos: [
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
                assunto("caminhos", "Caminhos relativos e absolutos", "Resolver destinos conforme a localização do documento.",
                    "Caminhos relativos são resolvidos a partir da URL do documento, salvo quando há base. ../ sobe um diretório; ./ indica o atual. URLs completas incluem protocolo e domínio. Um caminho iniciado por / parte da raiz do site e pode ignorar o prefixo de um projeto no GitHub Pages.",
                    "./contato.html\n../index.html\nhttps://example.org/pagina",
                    `<a href="../index.html">Página inicial</a>
<a href="./contato.html">Contato nesta pasta</a>
<a href="https://developer.mozilla.org/pt-BR/docs/Web/HTML">Referência de HTML</a>`,
                    ["../index.html sobe da pasta pages para a raiz.", "./contato.html busca na pasta atual; a URL completa aponta para outro site."],
                    "Use o trecho em pages/sobre.html e crie index.html e pages/contato.html para testar os destinos.",
                    ["Considere a pasta da página, não a do editor.", "Confira maiúsculas e minúsculas: servidores podem diferenciá-las."]),
                assunto("organizacao-arquivos", "Organização básica de arquivos", "Separar entrada, páginas e recursos com caminhos coerentes.",
                    "Um site pode ter index.html na raiz, páginas em pages e imagens em assets/images. Essa divisão facilita encontrar responsabilidades, mas deve acompanhar as necessidades do projeto. Ao mover um arquivo, atualize as referências que apontam para ele.",
                    "<!-- Em index.html: -->\n<a href=\"pages/sobre.html\">Sobre</a>",
                    `<h1>Meu portfólio</h1>
<a href="pages/sobre.html">Conheça minha trajetória</a>
<img src="assets/images/retrato.jpg" alt="Retrato de Ana, desenvolvedora">`,
                    ["O trecho pertence à entrada index.html.", "href e src apontam para arquivos nas pastas pages e assets/images."],
                    "Crie pages/sobre.html e assets/images/retrato.jpg para testar um pequeno portfólio.",
                    ["Use nomes claros e consistentes.", "Confira todos os links depois de mover recursos."])
            ] }
        ] },
        { id: "intermediario", nome: "Intermediário", assuntos: [], modulos: [
            { id: "html-semantico", titulo: "4. HTML semântico", assuntos: [
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
                assunto("div-span", "Div e span", "Usar recipientes genéricos quando não há significado específico.",
                    "div agrupa conteúdo em fluxo; span delimita um trecho de texto. São genéricos e podem receber class para CSS ou scripts. Não substituem títulos, links e botões quando a função já possui um elemento apropriado.",
                    "<div><p>Texto com <span>um detalhe</span>.</p></div>",
                    `<div class="resumo-estudos">
    <p>Tempo dedicado: <span class="duracao">30 minutos</span>.</p>
    <p>Conteúdo: elementos e atributos.</p>
</div>`,
                    ["div agrupa os dois parágrafos.", "span marca apenas a duração; as classes não aplicam estilos sozinhas."],
                    "Preparar um grupo para layout e um trecho para destaque visual com CSS.",
                    ["Prefira um elemento semântico quando adequado.", "Não use div clicável como substituta de button."]),
                assunto("hierarquia-semantica", "Hierarquia semântica", "Relacionar regiões, seções e títulos pela organização do conteúdo.",
                    "A estrutura deve comunicar quais informações são principais, subdivisões ou complementos. O aninhamento acompanha essa relação. Inserir section não reduz automaticamente o nível dos títulos: escolha h2, h3 e os demais explicitamente.",
                    "<main><h1>Página</h1><section><h2>Seção</h2></section></main>",
                    `<header><p>Portal de estudos</p></header>
<main>
    <h1>Trilha de HTML</h1>
    <section>
        <h2>Elementos de conteúdo</h2>
        <h3>Parágrafos</h3>
        <p>Um parágrafo reúne uma ideia no texto.</p>
    </section>
</main>
<footer><p>Material de referência.</p></footer>`,
                    ["header e footer ficam fora do conteúdo específico de main.", "h1, h2 e h3 representam assunto, seção e tópico."],
                    "Planejar uma documentação antes de aplicar seu layout.",
                    ["Confira se a estrutura faz sentido sem estilos.", "Não confunda posição visual com hierarquia."])
            ] },
            { id: "formularios", titulo: "5. Formulários", assuntos: [
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
                assunto("textarea", "Textarea", "Coletar texto com várias linhas.",
                    "textarea aceita texto extenso e quebras de linha. Seu valor inicial fica entre as tags, não em um atributo value. rows sugere a quantidade de linhas visíveis sem limitar a quantidade digitada.",
                    "<textarea name=\"mensagem\" rows=\"4\">Texto inicial</textarea>",
                    `<label for="anotacoes">Anotações da aula</label>
<textarea id="anotacoes" name="anotacoes" rows="5" maxlength="1000">Hoje aprendi sobre formulários.</textarea>`,
                    ["O texto entre as tags é o valor inicial editável.", "rows ajusta a área visível; maxlength limita caracteres."],
                    "Registrar observações, mensagens ou descrições de um projeto.",
                    ["Não insira indentação extra dentro da tag se ela não deve compor o valor.", "Ofereça um rótulo e espaço confortável de escrita."]),
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
                assunto("atributos-formularios", "Atributos de formulários", "Compreender destino, método e codificação do envio.",
                    "action indica o receptor; get envia consultas na URL e post envia dados no corpo da requisição. enctype define a codificação com post; multipart/form-data é necessário para enviar arquivos. autocomplete orienta preenchimento. POST, sozinho, não criptografa a conexão.",
                    "<form action=\"/envios\" method=\"post\" enctype=\"multipart/form-data\">...</form>",
                    `<form action="/envios" method="post" enctype="multipart/form-data">
    <label for="anexo">Arquivo HTML</label>
    <input id="anexo" name="anexo" type="file" accept=".html,text/html" required>
    <button type="submit">Enviar arquivo</button>
</form>`,
                    ["multipart/form-data inclui arquivos no envio POST.", "accept orienta a seleção, mas não valida com segurança o arquivo recebido."],
                    "Preparar um upload. /envios precisa de um serviço real; este trecho não cria esse serviço.",
                    ["Use HTTPS para proteger o transporte.", "Valide tipo, tamanho e conteúdo do arquivo no servidor."])
            ] },
            { id: "estruturas-midias", titulo: "6. Estruturas e mídias", assuntos: [
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
                assunto("figure-figcaption", "Figure e figcaption", "Associar um recurso autocontido a sua legenda.",
                    "figure reúne um recurso e uma legenda opcional em figcaption. Pode conter imagem, código ou diagrama. A legenda explica o contexto visível e não elimina automaticamente a necessidade de alt em imagens.",
                    "<figure>Recurso<figcaption>Legenda</figcaption></figure>",
                    `<figure>
    <pre><code>&lt;p&gt;Uma ideia por parágrafo.&lt;/p&gt;</code></pre>
    <figcaption>Exemplo de marcação de um parágrafo.</figcaption>
</figure>`,
                    ["figure mantém exemplo e legenda como unidade.", "pre preserva espaços; code identifica código; entidades exibem tags como texto."],
                    "Apresentar um trecho de código com legenda em um tutorial.",
                    ["Coloque figcaption como primeiro ou último filho de figure.", "Faça a legenda acrescentar contexto."]),
                assunto("agrupamento", "Elementos de agrupamento", "Escolher o agrupamento conforme a relação dos conteúdos.",
                    "Listas, figuras e recipientes genéricos agrupam conteúdo de formas diferentes. dl representa associações entre termos e descrições, com dt e dd. Em formulários, fieldset agrupa controles relacionados e legend identifica o grupo.",
                    "<dl><dt>Termo</dt><dd>Descrição</dd></dl>",
                    `<dl>
    <dt>HTML</dt>
    <dd>Linguagem para estruturar conteúdo.</dd>
</dl>
<fieldset>
    <legend>Formato de estudo</legend>
    <label><input type="radio" name="formato" value="texto"> Texto</label>
    <label><input type="radio" name="formato" value="video"> Vídeo</label>
</fieldset>`,
                    ["dt apresenta o termo e dd a descrição.", "fieldset e legend identificam o grupo; radios com mesmo name permitem uma escolha."],
                    "Criar um glossário e uma preferência entre formatos de estudo.",
                    ["Escolha o grupo pela relação dos dados.", "Use legend para explicar controles relacionados."])
            ] }
        ] },
        { id: "avancado", nome: "Avançado", assuntos: [], modulos: [
            { id: "acessibilidade", titulo: "7. Acessibilidade", assuntos: [
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
                assunto("associacao-label-input", "Associação entre label e input", "Garantir um nome acessível e instruções associadas ao campo.",
                    "Na associação explícita, for do label deve coincidir com id do input. Na implícita, o controle fica dentro de label. name não faz essa associação. aria-describedby conecta instruções adicionais sem substituir o rótulo.",
                    "<label for=\"campo\">Rótulo</label>\n<input id=\"campo\" aria-describedby=\"ajuda\">\n<p id=\"ajuda\">Instrução</p>",
                    `<label for="email-contato">E-mail de contato</label>
<input id="email-contato" name="email" type="email" aria-describedby="ajuda-email">
<p id="ajuda-email">Usaremos este endereço para responder à sua mensagem.</p>`,
                    ["for liga o rótulo ao id e permite focar o controle ao clicar.", "aria-describedby referencia a instrução; name identifica o dado enviado."],
                    "Separar um rótulo curto de uma orientação longa sem perder sua associação.",
                    ["Clique no rótulo para conferir a associação.", "Não coloque links ou outros controles interativos no label de um campo diferente."]),
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
                assunto("teclado", "Navegação por teclado", "Manter foco previsível e controles operáveis sem mouse.",
                    "Links com href e controles nativos participam da ordem de foco. Tab percorre controles; Enter ativa links e botões, e Espaço também ativa botões. A ordem do DOM deve acompanhar a sequência lógica. tabindex positivo cria uma ordem artificial difícil de manter.",
                    "<a href=\"#conteudo\">Ir para o conteúdo</a>\n<main id=\"conteudo\" tabindex=\"-1\">...</main>",
                    `<a href="#conteudo-aula">Ir para o conteúdo da aula</a>
<main id="conteudo-aula" tabindex="-1">
    <h1>Pesquisa de assuntos</h1>
    <form method="get">
        <label for="pesquisa">Assunto</label>
        <input id="pesquisa" name="q" type="search">
        <button type="submit">Pesquisar</button>
    </form>
</main>`,
                    ["O link oferece um salto para a região principal.", "tabindex=-1 torna main focável sem colocá-lo na sequência normal de Tab."],
                    "Percorrer uma pesquisa com Tab, Shift+Tab e Enter.",
                    ["Mantenha o indicador de foco no CSS.", "Evite tabindex positivo e controles genéricos sem interação completa."]),
                assunto("aria", "Uso apropriado de atributos ARIA", "Complementar a semântica sem inventar comportamentos.",
                    "ARIA descreve nomes, relações e estados para tecnologias assistivas. aria-label nomeia um elemento quando permitido; aria-labelledby referencia um texto existente. ARIA não acrescenta foco ou teclado. Estados como aria-expanded devem corresponder à interface real.",
                    "<nav aria-label=\"Principal\">...</nav>",
                    `<nav aria-label="Principal"><a href="index.html">Início</a></nav>
<nav aria-label="Nesta página"><a href="#duvida">Dúvida frequente</a></nav>
<details id="duvida">
    <summary>Preciso usar ARIA em todo elemento?</summary>
    <p>Não. Comece com a semântica nativa e complemente quando necessário.</p>
</details>`,
                    ["aria-label diferencia duas regiões de navegação.", "details e summary já oferecem expansão nativa, sem um estado ARIA mantido à parte."],
                    "Distinguir menus e mostrar uma dúvida expansível sem JavaScript.",
                    ["Não sobrescreva papéis nativos com papéis incompatíveis.", "Não use aria-hidden em controles focáveis nem anuncie estados inexistentes."])
            ] },
            { id: "metadados-seo", titulo: "8. Metadados e SEO", assuntos: [
                assunto("title", "Title", "Identificar a página fora de seu conteúdo visível.",
                    "title, no head, nomeia a aba e pode aparecer em favoritos e resultados de busca. Deve diferenciar a página das demais. O título visível continua sendo um heading no body. Buscadores podem escolher outra formulação nos resultados.",
                    "<title>Assunto | Nome do site</title>",
                    `<title>Formulários HTML | Portal de Estudos</title>`,
                    ["title informa assunto e site.", "Seu conteúdo é texto, não outra marcação HTML."],
                    "Identificar uma aula entre várias abas e favoritos.",
                    ["Use títulos específicos em cada página.", "Evite repetir palavras-chave ou prometer um título exato na busca."], "head"),
                assunto("meta-description", "Meta description", "Descrever o conteúdo de maneira curta e fiel.",
                    "meta com name=description oferece um resumo do documento. Buscadores podem usá-lo no trecho de resultado ou escolher outro texto conforme a consulta. Não altera o conteúdo visível nem garante posições nos resultados.",
                    "<meta name=\"description\" content=\"Resumo da página.\">",
                    `<meta name="description" content="Aprenda a criar formulários HTML com rótulos, campos e validação nativa, usando exemplos explicados.">`,
                    ["name identifica o metadado.", "content contém o resumo do conteúdo real."],
                    "Oferecer uma descrição própria para a página de uma aula.",
                    ["Escreva resumos distintos e relevantes.", "Um limite fixo de caracteres não garante exibição completa."], "head"),
                assunto("viewport", "Viewport", "Configurar a área inicial de layout em dispositivos móveis.",
                    "width=device-width usa a largura do dispositivo para o layout; initial-scale=1.0 define a escala inicial. Isso evita uma área virtual larga em navegadores móveis, mas não substitui CSS responsivo nem impede conteúdos largos de transbordarem.",
                    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">",
                    `<meta name="viewport" content="width=device-width, initial-scale=1.0">`,
                    ["width=device-width ajusta a área de layout à largura do dispositivo.", "initial-scale define a escala inicial sem impedir a ampliação pelo usuário."],
                    "Preparar um documento para layouts fluidos e media queries.",
                    ["Não bloqueie zoom com user-scalable=no.", "Teste imagens, textos longos e recipientes com CSS responsivo."], "head"),
                assunto("idioma-documento", "Idioma do documento", "Declarar o idioma principal e mudanças no texto.",
                    "lang informa o idioma e auxilia pronúncia, tradução e tratamento do texto. Use etiquetas reconhecidas, como pt-BR ou en. Declare o idioma principal em html e marque trechos de outras línguas localmente.",
                    "<html lang=\"pt-BR\">...</html>\n<span lang=\"en\">Hello</span>",
                    `<!doctype html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Glossário</title></head>
<body>
    <h1>Termos de programação</h1>
    <p><span lang="en">Source code</span> significa código-fonte.</p>
</body>
</html>`,
                    ["lang em html define o idioma predominante.", "lang=en identifica a expressão inglesa sem mudar o restante do texto."],
                    "Melhorar a pronúncia de um glossário bilíngue em leitores de tela.",
                    ["Declare o idioma realmente usado.", "Não confunda idioma com codificação: lang e charset são diferentes."], "documento"),
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
                assunto("compartilhamento", "Metadados para compartilhamento", "Fornecer informações para cartões de links.",
                    "Open Graph usa metadados como og:title, og:type, og:url e og:image. Serviços compatíveis podem usá-los para montar cartões, dependendo do serviço e de seu cache. Esses campos não substituem title ou a descrição geral do documento.",
                    "<meta property=\"og:title\" content=\"Título do conteúdo\">",
                    `<meta property="og:title" content="Guia de HTML">
<meta property="og:type" content="website">
<meta property="og:url" content="https://example.org/guia.html">
<meta property="og:image" content="https://example.org/images/guia.png">
<meta property="og:image:alt" content="Capa do Guia de HTML">
<meta property="og:description" content="Referência de elementos e boas práticas de HTML.">`,
                    ["property identifica o campo Open Graph e content fornece seu valor.", "og:url identifica a página; og:image aponta para uma imagem pública."],
                    "Substitua example.org por URLs reais para preparar o compartilhamento de uma aula.",
                    ["Use URLs absolutas e recursos acessíveis publicamente.", "Teste no serviço de destino e considere seu cache."], "head")
            ] },
            { id: "integracao-boas-praticas", titulo: "9. Integração e boas práticas", assuntos: [
                assunto("html-css", "Conexão entre HTML e CSS", "Vincular estilos mantendo suas responsabilidades separadas.",
                    "link com rel=stylesheet carrega CSS a partir de href, relativo ao documento HTML. Já url() dentro do CSS é relativo à própria folha. HTML define estrutura, enquanto CSS controla apresentação.",
                    "<link rel=\"stylesheet\" href=\"css/style.css\">",
                    `<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Estilos externos</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <h1 class="titulo">Meu plano de estudos</h1>
</body>
</html>`,
                    ["link conecta css/style.css ao documento.", "class=titulo fornece um seletor, sem gerar aparência sozinha."],
                    "Crie css/style.css e escreva .titulo { color: rebeccapurple; } para testar a conexão.",
                    ["Confira o carregamento na aba Rede.", "Separe estilos reutilizáveis quando isso facilitar a manutenção."], "documento"),
                assunto("html-javascript", "Conexão entre HTML e JavaScript", "Vincular um script aos elementos da página.",
                    "script com src referencia JavaScript, que pode ler o DOM e responder a eventos. HTML mantém a responsabilidade pela estrutura. defer permite que um script clássico externo execute após a análise do documento, com seus elementos disponíveis.",
                    "<script src=\"js/app.js\" defer></script>",
                    `<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Integração com script</title>
    <script src="js/app.js" defer></script>
</head>
<body>
    <h1>Minha página</h1>
    <button id="mostrar-mensagem" type="button">Mostrar mensagem</button>
    <p id="mensagem">Aguardando uma ação.</p>
</body>
</html>`,
                    ["src localiza o arquivo e defer posterga sua execução.", "IDs permitem encontrar os elementos; a ação precisa ser implementada em app.js."],
                    "Crie js/app.js com: document.querySelector('#mostrar-mensagem').addEventListener('click', () => { document.querySelector('#mensagem').textContent = 'Olá!'; });",
                    ["Registre eventos no script em vez de usar onclick na marcação.", "Não coloque segredos no código enviado ao navegador."], "documento"),
                assunto("carregamento-scripts", "Carregamento de scripts", "Escolher momento e ordem de execução.",
                    "Scripts clássicos externos sem defer ou async podem bloquear a análise do HTML. Com defer, executam após a análise e na ordem do documento. async executa quando o arquivo fica pronto, sem garantir ordem. Módulos já têm comportamento diferido por padrão quando não usam async.",
                    "<script src=\"js/app.js\" defer></script>\n<script type=\"module\" src=\"js/modulo.js\"></script>",
                    `<script src="js/configuracao.js" defer></script>
<script src="js/app.js" defer></script>`,
                    ["Os downloads não impedem a análise do documento.", "configuracao.js executa antes de app.js; forneça ambos os arquivos."],
                    "Carregar uma configuração antes do código que depende dela, usando scripts clássicos com defer.",
                    ["Use async somente se não houver dependência de ordem.", "defer não tem esse efeito em scripts clássicos inline; módulos precisam de carregamento compatível."], "head"),
                assunto("organizacao-documentos", "Organização de documentos", "Manter uma estrutura previsível para leitura e alteração.",
                    "Uma sequência consistente separa declaração, metadados, referências e conteúdo. Agrupe informações relacionadas e mantenha indentação regular. Organização não significa envolver cada linha em um recipiente: elementos adicionais precisam ter função clara.",
                    "<!doctype html>\n<html><head>...</head><body>...</body></html>",
                    `<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rotina de estudos</title>
</head>
<body>
    <header><p>Portal de Estudos</p></header>
    <main>
        <h1>Rotina de estudos</h1>
        <p>Uma etapa de cada vez.</p>
    </main>
    <footer><p>Referência para estudantes.</p></footer>
</body>
</html>`,
                    ["head concentra metadados em sequência previsível.", "header, main e footer organizam regiões sem recipientes extras."],
                    "Permitir que outra pessoa encontre rapidamente conteúdo e referências.",
                    ["Mantenha indentação consistente.", "Comente decisões relevantes, não cada tag."], "documento"),
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
                    ["Pesquise referências antes de renomear IDs e arquivos.", "Depois da mudança, teste links, teclado e carregamento."])
            ] }
        ] }
    ]
};
