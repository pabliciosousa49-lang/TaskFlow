// CSS — Conteúdo original; demonstrações isoladas e sem JavaScript.
const base = 'body { margin: 16px; font-family: system-ui, sans-serif; }\n.palco { border: 2px dashed #777; padding: 12px; }\n.item { padding: 8px; background: #e5ddf5; margin-block: 4px; }\n';
const caixas = '<section class="palco"><div class="item alvo" id="principal" data-estado="ativo">Primeiro item</div><div class="item">Segundo item</div><div class="item">Terceiro item</div></section>';
const texto = '<section class="palco"><h2 class="alvo">Biblioteca de estilos</h2><p>Texto de apoio com <strong>informação importante</strong>.</p><a href="#fim">Link de exemplo</a><p id="fim">Fim da seção.</p></section>';
const botao = '<section class="palco"><button class="alvo" type="button">Botão de exemplo</button><p>Use o mouse ou Tab para observar os estados.</p></section>';
const longo = '<section class="palco"><div class="alvo">Cabeçalho</div><p>Conteúdo inicial.</p><p>Role esta área.</p><p>Mais conteúdo.</p><p>Outro trecho.</p><p>Fim do conteúdo.</p></section>';
function assunto(id, titulo, explicacao, css, propriedades, aplicacaoReal, boas, html = caixas, termos = [], extra = {}) {
  return { id, titulo, explicacao, objetivo: aplicacaoReal, sintaxe: css, codigoPrincipal: css, estilosApoio: base, exemploCodigo: base + css, responsabilidadeCodigo: propriedades.split('|'), aplicacaoReal, boasPraticas: boas.split('|'), exemploHTML: html, palavrasChave: [id === "responsivo" ? "design responsivo" : id, ...termos], contextoExemplo: 'css', ...extra };
}
const modulos = [];
modulos.push({ id: "introducao", titulo: "01 — Introdução e preparação", assuntos: [
    assunto(
      "o-que-e-css",
       "O que é CSS?",
       "CSS descreve a apresentação dos documentos: cor, tamanho e distribuição dos elementos. Suas regras selecionam o HTML e atribuem valores; o conteúdo continua existindo quando a folha não carrega.",
       ".alvo {\n  color: #5b21b6;\n  font-size: 24px;\n}",
       ".alvo seleciona a classe.|color muda a cor; font-size define o tamanho do texto.",
       "Dar hierarquia visual sem alterar o significado do conteúdo.",
       "Estruture primeiro o HTML.|Use contraste legível.",
       texto,
       ["css","estilos"]
  ),
    assunto(
      "responsabilidade-css",
       "Responsabilidade do CSS em uma página",
       "CSS controla aparência e organização espacial. Não implementa regras de negócio: esconder um botão não restringe permissões de acesso.",
       ".palco {\n  max-width: 480px;\n}\n.alvo {\n  border-radius: 12px;\n}",
       "max-width limita o crescimento.|border-radius arredonda os cantos do item.",
       "Padronizar cartões em várias páginas.",
       "Não use CSS como autenticação.|Mantenha informações essenciais acessíveis.",
       caixas
  ),
    assunto(
      "html-e-css",
       "Diferença entre HTML e CSS",
       "HTML identifica títulos, seções e links; CSS apresenta esses elementos. Escolha a tag pela função e depois controle seu visual, sem trocar a hierarquia apenas pelo tamanho da fonte.",
       "h2 {\n  color: #5b21b6;\n}\np {\n  line-height: 1.7;\n}",
       "h2 identifica o título estilizado.|line-height cria espaço entre linhas, sem inserir quebras no texto.",
       "Trocar a aparência preservando a estrutura semântica.",
       "Não use títulos como recurso de tamanho.|Mantenha leitura clara sem estilos.",
       texto,
       ["html","semântica"]
  ),
    assunto(
      "arquivo-style",
       "Criando o arquivo style.css",
       "Uma folha CSS é texto salvo com extensão .css. Crie o arquivo no editor e salve em UTF-8; sua existência não o conecta automaticamente ao documento HTML.",
       "/* Arquivo: style.css */ .alvo {\n  background-color: #dbeafe;\n}",
       "O comentário identifica a folha sem aparecer na página.|background-color preenche a área da caixa.",
       "Separar apresentação e conteúdo em arquivos próprios.",
       "Confira se o editor acrescentou .txt.|Salve antes de verificar a publicação.",
       caixas,
       ["style.css","criar css"]
  ),
    assunto(
      "conectar-css",
       "Como conectar CSS ao HTML",
       "No head do HTML, link com rel=stylesheet solicita a folha indicada em href. O caminho parte do HTML: pages/login.html pode usar ../css/style.css. Na demonstração, a folha é incorporada para visualizar seu efeito.",
       ".alvo {\n  color: #075985;\n  border: 2px solid currentColor;\n}",
       "rel=stylesheet identifica a relação da folha.|href precisa apontar ao arquivo; currentColor usa a cor do texto na borda.",
       "Compartilhar uma folha entre documentos de pastas diferentes.",
       "Confira diretórios e maiúsculas.|Investigue erros 404 na aba Rede.",
       caixas,
       ["link","href","conectar css","stylesheet"],
       {"htmlReferencia":"<!-- No head de index.html -->\n<link rel=\"stylesheet\" href=\"css/style.css\">"}
  ),
    assunto(
      "formas-css",
       "CSS inline, interno e externo",
       "Inline utiliza o atributo style, interno utiliza a tag style e externo utiliza link. Essas formas participam da cascata. Folhas externas facilitam o reúso, enquanto ajustes inline podem dificultar a manutenção.",
       ".alvo {\n  color: #166534;\n}",
       "A classe fornece uma declaração normal na folha.|O style inline vence essa declaração normal, sem !important.",
       "Reconhecer por que um estilo inline impede uma alteração pela classe.",
       "Prefira folhas externas para reúso.|Evite ajustes inline espalhados.",
       "<p class=\"alvo\" style=\"color: #9a3412\">Cor definida pelo atributo style</p>",
       ["inline","interno","externo"],
       { htmlReferencia: "<!-- Interno: dentro de head -->\n<style>.alvo { color: #166534; }</style>\n<!-- Externo: alternativa dentro de head -->\n<link rel=\"stylesheet\" href=\"style.css\">\n<!-- Inline: no elemento -->\n<p class=\"alvo\" style=\"color: #9a3412\">Texto</p>" }
  ),
    assunto(
      "sintaxe",
       "Sintaxe CSS",
       "Uma regra contém seletor e declarações entre chaves. Cada declaração reúne propriedade, dois-pontos e valor. Uma declaração inválida pode ser ignorada sem descartar a folha inteira.",
       ".alvo {\n  color: #5b21b6;\n  padding: 16px;\n}",
       "As chaves delimitam o bloco aplicado à classe.|O ponto e vírgula separa color e padding.",
       "Escrever regras interpretáveis e fáceis de depurar.",
       "Feche chaves e strings.|Use ponto e vírgula na última declaração também.",
       caixas
  ),
    assunto(
      "seletores-propriedades",
       "Seletores, propriedades e valores",
       "O seletor responde quais elementos serão afetados; a propriedade escolhe o aspecto e o valor configura esse aspecto. Cada propriedade aceita um conjunto específico de valores, não qualquer palavra ou unidade.",
       ".alvo {\n  font-weight: 700;\n  background-color: #fef3c7;\n}",
       ".alvo encontra o destino.|700 é peso de fonte; #fef3c7 é uma cor.",
       "Converter uma intenção visual em uma regra direcionada.",
       "Confira valores aceitos.|Verifique se o seletor corresponde ao elemento.",
       caixas
  ),
    assunto(
      "comentarios",
       "Comentários CSS",
       "Comentários começam com /* e terminam com */. Não produzem conteúdo visível e não podem ser aninhados. Use-os para explicar decisões que não ficam claras apenas pelos valores.",
       "/* Texto escuro sobre superfície clara. */ .alvo {\n  color: #1f2937;\n  background: #f3f4f6;\n}",
       "O comentário não é uma declaração.|O fechamento permite interpretar as regras seguintes.",
       "Registrar a razão de uma combinação visual.",
       "Explique o motivo, não apenas a sintaxe.|Atualize comentários quando o código mudar.",
       caixas
  ),
    assunto(
      "organizacao-inicial",
       "Organização inicial dos arquivos",
       "Uma página pequena pode começar com index.html e css/style.css. Pastas devem refletir responsabilidades reais. A ordem dos links afeta regras empatadas na cascata, portanto não deve ser acidental.",
       "/* Base compartilhada */ .palco {\n  border-color: #7c3aed;\n}\n/* Item destacado */ .alvo {\n  font-weight: 700;\n}",
       "A seção recebe um padrão comum.|A classe do item especializa o conteúdo sem copiar toda a base.",
       "Preparar uma folha pequena para futuras páginas sem ferramentas de build.",
       "Evite folhas vazias sem responsabilidade.|Verifique referências ao mover arquivos.",
       caixas,
       ["pastas","arquivos","organizar css"]
  )
] });
modulos.push({id:"seletores",titulo:"02 — Seletores e estilização",assuntos:[
  assunto(
      "elemento",
      "Seletores de elementos",
      "O nome de uma tag seleciona todos os elementos daquele tipo. É útil para padrões de texto, mas uma regra global pode atingir vários componentes; considere o alcance antes de especializar.",
      "p {\n  color: #334155;\n  line-height: 1.8;\n}",
      "p seleciona parágrafos.|line-height sem unidade acompanha o tamanho da fonte.",
      "Definir uma base de leitura para documentos.",
      "Avalie o alcance global.|Use classes para componentes específicos.",
      texto,
      ["tag","elemento"]
  ),
  assunto(
      "classe",
      "Seletores de classes",
      "Classes são nomes reutilizáveis no atributo class. O seletor leva ponto, mas o HTML não. Um elemento pode combinar várias classes separadas por espaços, mantendo funções distintas.",
      ".alvo {\n  background: #dcfce7;\n  font-weight: 700;\n}",
      ".alvo encontra o nome entre as classes.|background preenche a caixa e font-weight destaca o texto.",
      "Reutilizar o visual de avisos em diferentes lugares.",
      "Escolha nomes ligados à função.|Não atrele nomes a uma cor temporária.",
      caixas,
      ["class","classe"]
  ),
  assunto(
      "id",
      "Seletores de ID",
      "O seletor # corresponde ao id, que deve ser único no documento. Sua especificidade alta pode dificultar ajustes por classes; IDs também servem a âncoras e associações acessíveis.",
      "#principal {\n  border: 3px solid #7c3aed;\n}",
      "#principal encontra um único destino.|A borda distingue esse item dos demais.",
      "Entender uma regra de ID ao manter um estilo legado.",
      "Não duplique IDs.|Prefira classes para estilos reutilizáveis.",
      caixas,
      ["id"]
  ),
  assunto(
      "combinados",
      "Seletores combinados",
      "Duas classes sem espaço exigem as duas condições no mesmo elemento. Uma vírgula agrupa conjuntos; um espaço indica descendência. Essas formas têm significados diferentes mesmo com nomes iguais.",
      ".item.alvo {\n  color: #5b21b6;\n}\n.alvo, .palco {\n  border-radius: 8px;\n}",
      ".item.alvo exige as duas classes.|A vírgula aplica o arredondamento aos dois conjuntos.",
      "Combinar uma classe de base com um destaque.",
      "Não confunda união com descendência.|Evite condições excessivas."
  ),
  assunto(
      "descendentes",
      "Seletores descendentes",
      "O espaço alcança elementos em qualquer profundidade dentro de um ancestral. O combinador > limita a filhos diretos. Cadeias longas podem acoplar a folha à estrutura exata do documento.",
      ".palco .item {\n  color: #075985;\n}\n.palco > .alvo {\n  border-left: 6px solid #075985;\n}",
      "O espaço busca descendentes.|> exige relação direta de pai e filho.",
      "Conter estilos dentro de uma seção específica.",
      "Evite cadeias longas.|Use > quando a relação direta for necessária.",
      caixas,
      ["filho","descendente"]
  ),
  assunto(
      "atributos",
      "Seletores de atributos",
      "Colchetes selecionam presença ou valor de atributos. A comparação por valor exato é diferente dos operadores de prefixo e sufixo. Os atributos devem representar informações ou estados coerentes com o elemento.",
      "[data-estado=\"ativo\"] {\n  background: #bbf7d0;\n}",
      "O seletor verifica o valor de data-estado.|A regra destaca o estado já presente, sem executar código.",
      "Estilizar um estado declarado na marcação.",
      "Evite criar atributos sem significado.|Use valores consistentes.",
      caixas,
      ["atributo","data-estado"]
  ),
  assunto(
      "cores",
      "Cores",
      "CSS aceita nomes, hexadecimal, rgb() e hsl(), entre outros formatos. Transparência mistura a cor com o fundo. color controla o texto; background-color controla a superfície, e os dois precisam de contraste.",
      ".alvo {\n  color: #172554;\n  background-color: rgb(219 234 254);\n  border: 2px solid hsl(220 70% 40%);\n}",
      "color define o texto.|rgb e hsl representam cores por componentes diferentes.",
      "Compor texto, borda e fundo com boa leitura.",
      "Teste contraste no fundo real.|Não comunique estados apenas por cor.",
      caixas,
      ["color","rgb","hsl","hex"]
  ),
  assunto(
      "unidades",
      "Unidades de medida",
      "px é um pixel CSS, não necessariamente um pixel físico. rem, em e porcentagem usam referências diferentes. A escolha precisa considerar a propriedade e o bloco ou fonte de referência.",
      ".alvo {\n  font-size: 1.25rem;\n  padding: .75em;\n  width: 70%;\n  box-sizing: border-box;\n}",
      "rem depende da fonte raiz.|em no padding usa a fonte do próprio elemento; width percentual considera o bloco de referência.",
      "Fazer medidas acompanharem texto e área disponível.",
      "Entenda a referência de cada unidade.|Evite alturas rígidas para texto.",
      caixas,
      ["px","unidade","medida"]
  ),
  assunto(
      "tipografia",
      "Fontes e tipografia",
      "Família, peso, tamanho e altura de linha compõem a tipografia. A lista de famílias oferece fallbacks. Fontes externas precisam de carregamento próprio; este exemplo usa uma família local e uma genérica.",
      ".alvo {\n  font-family: Georgia, serif;\n  font-size: 1.5rem;\n  font-weight: 700;\n  line-height: 1.5;\n  letter-spacing: .02em;\n}",
      "A família serif é usada se Georgia faltar.|line-height separa linhas sem inserir quebras no HTML.",
      "Criar títulos distintos sem prejudicar parágrafos.",
      "Teste acentos e textos longos.|Evite pesos ausentes na família.",
      texto,
      ["font-family","font-size","font-weight","texto"]
  ),
  assunto(
      "background",
      "Background",
      "Fundos podem combinar cores, imagens e gradientes. A forma abreviada background pode redefinir componentes anteriores; background-color altera apenas a cor. O fundo não determina o tamanho da caixa.",
      ".alvo {\n  min-height: 64px;\n  background-color: #dbeafe;\n  background-image: linear-gradient(120deg, #dbeafe, #e9d5ff);\n}",
      "O gradiente é uma imagem gerada.|min-height cria área para perceber o fundo.",
      "Diferenciar superfícies mantendo o texto legível.",
      "Defina cor de fallback.|Revise resets ao usar a forma abreviada.",
      caixas,
      ["background-color","cor de fundo","fundo"]
  ),
  assunto(
      "bordas",
      "Bordas",
      "A borda envolve conteúdo e padding e participa da dimensão da caixa. Um estilo como solid é necessário para exibi-la. border-radius arredonda os cantos, sem criar espaço interno nem uma borda por si só.",
      ".alvo {\n  border: 3px solid #7c3aed;\n  border-radius: 16px;\n}",
      "border reúne espessura, estilo e cor.|border-radius curva os quatro cantos.",
      "Delimitar cartões com cantos arredondados.",
      "Considere box-sizing nas medidas.|Não indique erros somente por bordas.",
      caixas,
      ["border","border-radius","arredondar borda","cantos"]
  ),
  assunto(
      "sombras",
      "Sombras",
      "box-shadow desenha uma sombra sem reservar espaço no layout. text-shadow atua nos caracteres. Sombras desfocadas não substituem contraste e podem aumentar o custo de pintura.",
      ".alvo {\n  box-shadow: 0 4px 12px rgb(0 0 0 / .2);\n  text-shadow: 1px 1px 0 white;\n}",
      "Os primeiros valores deslocam a sombra da caixa.|O terceiro valor desfoca; a sombra de texto usa outra propriedade.",
      "Sugerir elevação discreta em cartões.",
      "Prefira intensidade moderada.|Confira a legibilidade sem o efeito.",
      caixas,
      ["box-shadow","text-shadow","sombra"]
  )
]});
modulos.push({id:"box-model",titulo:"03 — Box Model",assuntos:[
  assunto(
      "box-model",
      "O que é Box Model?",
      "A caixa reúne conteúdo, padding, borda e margem. No content-box, width mede o conteúdo; as outras camadas aumentam o espaço ocupado. Margens ficam fora da borda.",
      ".alvo {\n  width: 140px;\n  padding: 16px;\n  border: 4px solid #7c3aed;\n  margin: 12px;\n}",
      "O conteúdo mede 140px.|Padding e bordas somam 40px, resultando em 180px de caixa antes das margens.",
      "Diagnosticar por que um cartão excede a largura esperada.",
      "Conte as duas laterais.|Confira o diagrama de caixa no inspetor.",
      caixas,
      ["caixa","box model"]
  ),
  assunto(
      "content",
      "Content",
      "Content é a área que recebe texto, imagens e filhos. O tamanho resultante depende do conteúdo e do algoritmo de layout. Alturas rígidas podem cortar informações quando a fonte aumenta.",
      ".alvo {\n  width: 180px;\n  min-height: 60px;\n  background: #fde68a;\n}",
      "width mede conteúdo no content-box.|min-height permite crescimento além do mínimo.",
      "Criar uma região de leitura que possa crescer.",
      "Teste texto longo.|Prefira mínimos a alturas fixas em mensagens."
  ),
  assunto(
      "padding",
      "Padding",
      "Padding separa conteúdo e borda pelo lado interno. Dois valores representam os eixos vertical e horizontal. O fundo da caixa acompanha essa área, ao contrário da margem.",
      ".alvo {\n  padding: 24px 32px;\n  border: 2px solid #7c3aed;\n}",
      "24px vale para cima e baixo.|32px afasta o conteúdo nas laterais.",
      "Criar respiro dentro de cartões e controles.",
      "Padding negativo é inválido.|Confira a largura final do content-box.",
      caixas,
      ["padding","espaçamento interno"]
  ),
  assunto(
      "border-box-model",
      "Border no Box Model",
      "A espessura da borda participa das medidas da caixa. Em border-box ela está incluída na largura declarada; outline não ocupa espaço no layout e tem outra responsabilidade.",
      ".alvo {\n  width: 220px;\n  box-sizing: border-box;\n  border: 8px solid #7c3aed;\n}",
      "Os 8px de cada lateral entram nos 220px.|A área de conteúdo diminui para acomodar bordas e padding.",
      "Manter controles alinhados ao variar a espessura da borda.",
      "Reserve espaço para estados diferentes.|Não remova foco ao ajustar a borda."
  ),
  assunto(
      "margin",
      "Margin",
      "Margin cria espaço externo. Margens verticais de certos blocos podem colapsar; em itens flex e grid isso não ocorre. O valor auto absorve espaço conforme o algoritmo de layout.",
      ".alvo {\n  width: 180px;\n  margin: 24px auto;\n}",
      "24px fornece margem vertical.|auto divide o espaço horizontal e centraliza este bloco de largura limitada.",
      "Separar seções e centralizar um bloco no pai.",
      "Margens verticais nem sempre somam.|Use gap entre itens flex/grid.",
      caixas,
      ["margin","espaçamento externo","centralizar bloco"]
  ),
  assunto(
      "width-height",
      "Width e height",
      "As dimensões dependem do modelo de caixa e do layout. height auto acompanha o conteúdo. Uma largura rígida precisa de um limite para não ultrapassar contêineres estreitos.",
      ".alvo {\n  width: 220px;\n  max-width: 100%;\n  height: auto;\n  box-sizing: border-box;\n}",
      "width propõe uma largura.|max-width limita ao pai; height permite crescer com o texto.",
      "Criar um cartão nominal que caiba em telas menores.",
      "Teste contêineres estreitos.|Não use altura como correção de alinhamento.",
      caixas,
      ["width","height","largura","altura"]
  ),
  assunto(
      "min-max-width",
      "Min-width e max-width",
      "Esses limites restringem a largura calculada. Um mínimo maior que o pai pode causar overflow. Itens flex e grid podem precisar de min-width: 0 para encolher além do mínimo automático.",
      ".alvo {\n  width: 100%;\n  max-width: 320px;\n  min-width: 0;\n  box-sizing: border-box;\n}",
      "max-width restringe o crescimento.|min-width: 0 evita impor um limite mínimo rígido.",
      "Construir uma coluna que possa encolher.",
      "Revise mínimos automáticos.|Não force mínimos maiores que a tela.",
      caixas,
      ["min-width","max-width"]
  ),
  assunto(
      "box-sizing",
      "Box-sizing",
      "content-box mede apenas conteúdo; border-box inclui padding e borda na largura e altura. A margem continua externa. Isso torna border-box útil para dimensionar controles de modo previsível.",
      ".alvo {\n  box-sizing: border-box;\n  width: 220px;\n  padding: 24px;\n  border: 6px solid #7c3aed;\n}",
      "A caixa com borda ocupa 220px.|Padding e borda consomem espaço dentro desse total.",
      "Evitar contas repetidas em colunas e formulários.",
      "Use uma convenção consistente.|Lembre que margin não está incluída.",
      caixas,
      ["border-box","content-box","box-sizing"]
  ),
  assunto(
      "overflow",
      "Overflow",
      "Overflow trata conteúdo que excede a caixa. auto permite rolagem quando necessária; hidden recorta e pode criar contêiner de rolagem. Recortar controles pode esconder informações e foco.",
      ".alvo {\n  max-width: 180px;\n  max-height: 70px;\n  overflow: auto;\n}\n.alvo::after {\n  content: \"Texto adicional para demonstrar rolagem. Mais linhas, informações e conteúdo excedente.\";\n  display: block;\n}",
      "max-height limita a área visível.|overflow auto mantém acesso ao conteúdo excedente.",
      "Criar uma área de mensagens com limite de altura.",
      "Não esconda problemas com overflow global.|Teste teclado dentro da área.",
      caixas,
      ["overflow","rolagem","transbordamento"]
  ),
  assunto(
      "margin-padding",
      "Diferença entre margin e padding",
      "Margin fica fora da borda; padding fica dentro. O fundo pinta o padding, mas não a margem. Identifique qual caixa deve conter a área vazia antes de escolher a propriedade.",
      ".alvo {\n  margin: 24px;\n  padding: 24px;\n  border: 3px solid #7c3aed;\n  background: #fef3c7;\n}",
      "A margem revela o fundo externo.|O padding cria área amarela entre texto e borda.",
      "Separar cartões sem confundir distância externa e conforto interno.",
      "Inspecione as camadas.|Evite compensações arbitrárias de margem."
  )
]});
modulos.push({id:"layout",titulo:"04 — Organização do layout",assuntos:[
  assunto(
      "display",
      "Propriedade display",
      "Display determina o tipo de caixa e o modelo de layout de seus filhos. display none remove a caixa da apresentação e da árvore de acessibilidade; não é uma forma de autorização.",
      ".palco {\n  display: flex;\n  gap: 12px;\n}",
      "flex altera o layout dos filhos diretos.|gap cria distância entre os itens.",
      "Escolher o modelo de distribuição de um componente.",
      "Não esconda conteúdo essencial sem alternativa.|Entenda o efeito sobre os filhos.",
      caixas,
      ["display"]
  ),
  assunto(
      "block",
      "Block",
      "Uma caixa block participa do fluxo em blocos e normalmente ocupa a largura disponível. Sua dimensão pode ser limitada; a quebra entre blocos não é equivalente a uma quebra br no conteúdo.",
      ".item {\n  display: block;\n  width: 65%;\n}",
      "Cada item começa em outra linha.|width limita a caixa sem transformá-la em inline.",
      "Organizar seções empilhadas no fluxo normal.",
      "Não use br para construir layout.|Verifique margens verticais.",
      caixas,
      ["block","bloco"]
  ),
  assunto(
      "inline",
      "Inline",
      "Caixas inline participam de linhas de texto. width e height não dimensionam um inline não substituído como dimensionam blocos. Seu conteúdo pode ser dividido entre linhas.",
      ".item {\n  display: inline;\n  background: #fef3c7;\n}",
      "Os itens passam a compartilhar linhas.|A largura acompanha o conteúdo em vez de um width fixo.",
      "Destacar trechos dentro de texto.",
      "Não force controles complexos como inline.|Observe a quebra em linhas curtas.",
      caixas,
      ["inline"]
  ),
  assunto(
      "inline-block",
      "Inline-block",
      "Inline-block ocupa uma posição no fluxo de linha, mas permite dimensões de caixa. Espaços do HTML entre elementos podem aparecer como distância entre eles. Para distribuição de grupos, Flexbox costuma oferecer mais controle.",
      ".item {\n  display: inline-block;\n  width: 90px;\n  vertical-align: top;\n}",
      "width passa a dimensionar cada caixa.|vertical-align alinha as caixas na linha.",
      "Criar pequenas etiquetas com dimensões próprias.",
      "Considere espaços entre tags.|Use flex para alinhamento de conjuntos.",
      caixas,
      ["inline-block"]
  ),
  assunto(
      "flexbox",
      "Flexbox",
      "Flexbox organiza filhos diretos ao longo de um eixo principal e um transversal. É adequado para distribuição em uma dimensão. Os itens podem encolher ou crescer; o resultado depende também de seus mínimos e conteúdos.",
      ".palco {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  gap: 12px;\n  min-height: 160px;\n}",
      "justify-content centraliza no eixo principal.|align-items centraliza no transversal; a altura permite perceber esse alinhamento.",
      "Alinhar ações ou centralizar conteúdo dentro de um painel.",
      "Use gap para distâncias.|Confira a direção antes de escolher o alinhamento.",
      caixas,
      ["flex","flexbox","centralizar"]
  ),
  assunto(
      "flex-direction",
      "Flex-direction",
      "A direção define o eixo principal do Flexbox. row segue a direção inline do idioma; column segue o eixo de bloco. As variantes reverse mudam a apresentação, mas não a ordem do DOM para leitura e foco.",
      ".palco {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}",
      "column empilha os itens no eixo principal.|gap separa cada par sem margens individuais.",
      "Alternar uma barra horizontal para uma lista vertical.",
      "Preserve a ordem lógica no HTML.|Não use reverse para corrigir marcação desordenada.",
      caixas,
      ["flex-direction","coluna flex"]
  ),
  assunto(
      "justify-content",
      "Justify-content",
      "Distribui espaço livre no eixo principal do flex container. Não necessariamente corresponde ao eixo horizontal: com column ele é vertical. Se não houver espaço livre, o efeito pode ser pequeno ou inexistente.",
      ".palco {\n  display: flex;\n  justify-content: space-between;\n  gap: 8px;\n}",
      "space-between distribui espaço entre itens.|gap garante uma separação mínima adicional.",
      "Separar extremos de uma barra de ferramentas.",
      "Observe o eixo principal.|Use largura ou altura contextual suficiente.",
      caixas,
      ["justify-content","centralizar horizontal"]
  ),
  assunto(
      "align-items",
      "Align-items",
      "Controla o alinhamento transversal dos itens flex ou o alinhamento de bloco dos itens grid. No flex, stretch pode esticar itens de tamanho automático. center exige espaço transversal para revelar a diferença.",
      ".palco {\n  display: flex;\n  align-items: center;\n  min-height: 160px;\n  gap: 8px;\n}",
      "A altura do pai cria espaço vertical.|center posiciona os itens no centro transversal.",
      "Alinhar ícones e textos em um componente.",
      "Não confunda com justify-content.|Evite alturas rígidas em conteúdo real.",
      caixas,
      ["align-items","centralizar vertical"]
  ),
  assunto(
      "gap",
      "Gap",
      "Gap cria espaços entre linhas e colunas de flex ou grid, sem adicionar borda externa ao conjunto. Com dois valores, o primeiro é row-gap e o segundo column-gap. Seu efeito depende do modelo de layout.",
      ".palco {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 12px 20px;\n}",
      "12px separa linhas.|20px separa colunas; não é padding do contêiner.",
      "Manter espaçamento consistente em uma grade.",
      "Não duplique o mesmo espaço com margens.|Use padding quando precisar de borda interna.",
      caixas,
      ["gap","espaço entre itens"]
  ),
  assunto(
      "flex-wrap",
      "Flex-wrap",
      "Permite que itens flex criem novas linhas quando a linha atual não comporta seus tamanhos. Cada linha distribui seu próprio espaço. Isso difere de uma grade com colunas alinhadas entre várias linhas.",
      ".palco {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n}\n.item {\n  flex: 1 1 180px;\n}",
      "wrap permite quebra.|A base de 180px influencia quando os itens mudam de linha.",
      "Adaptar cartões a uma área variável.",
      "Teste limites estreitos.|Use grid se precisar alinhar trilhas entre linhas.",
      caixas,
      ["flex-wrap","quebrar linha"]
  ),
  assunto(
      "grid",
      "CSS Grid",
      "Grid organiza linhas e colunas com trilhas compartilhadas. O contêiner define a grade e os filhos diretos se tornam itens. É indicado quando o alinhamento precisa considerar duas dimensões.",
      ".palco {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 12px;\n}",
      "repeat cria três trilhas.|minmax permite encolher abaixo do mínimo automático de conteúdo.",
      "Distribuir cartões em colunas alinhadas.",
      "Revise overflow de textos longos.|Não fixe colunas que ultrapassem a área disponível.",
      caixas,
      ["grid","colunas","centralizar grade"]
  ),
  assunto(
      "grid-template-columns",
      "Grid-template-columns",
      "Define as trilhas explícitas de colunas. fr divide espaço disponível, enquanto minmax combina limites. As frações não ignoram gaps nem restrições mínimas dos itens.",
      ".palco {\n  display: grid;\n  grid-template-columns: 1fr 2fr;\n  gap: 12px;\n}",
      "A segunda trilha recebe duas partes do espaço flexível.|O terceiro item ocupa a linha seguinte por auto posicionamento.",
      "Criar uma coluna lateral e uma região de conteúdo.",
      "Teste mínimos dos itens.|Use minmax(0, 1fr) quando necessário.",
      caixas,
      ["grid-template-columns","colunas"]
  ),
  assunto(
      "grid-template-rows",
      "Grid-template-rows",
      "Define alturas das linhas explícitas. Linhas adicionais são implícitas e podem ser controladas por grid-auto-rows. Uma altura fixa pode transbordar se o conteúdo crescer.",
      ".palco {\n  display: grid;\n  grid-template-rows: 60px 100px;\n  grid-auto-rows: minmax(60px, auto);\n  gap: 8px;\n}",
      "As duas primeiras linhas têm medidas explícitas.|A terceira usa a regra de linhas implícitas.",
      "Reservar áreas com alturas distintas em uma grade.",
      "Não corte texto por altura fixa.|Prefira mínimos quando o conteúdo variar.",
      caixas,
      ["grid-template-rows","linhas grid"]
  ),
  assunto(
      "grid-area",
      "Grid-area",
      "Áreas nomeadas relacionam partes do layout a regiões de uma grade. Cada área em grid-template-areas deve formar um retângulo. Mudar a posição visual não altera a ordem de leitura do HTML.",
      ".palco {\n  display: grid;\n  grid-template-columns: 1fr 2fr;\n  grid-template-areas: \"topo topo\" \"lateral conteudo\";\n  gap: 8px;\n}\n.item:nth-child(1) {\n  grid-area: topo;\n}\n.item:nth-child(2) {\n  grid-area: lateral;\n}\n.item:nth-child(3) {\n  grid-area: conteudo;\n}",
      "topo ocupa duas colunas.|grid-area associa cada item a seu nome.",
      "Descrever cabeçalho, lateral e conteúdo sem coordenadas absolutas.",
      "Mantenha o DOM em ordem lógica.|Use o mesmo número de células em cada linha.",
      caixas,
      ["grid-area","grid-template-areas"]
  ),
  assunto(
      "flex-grid",
      "Diferenças entre Flexbox e Grid",
      "Flexbox prioriza a distribuição ao longo de um eixo; Grid define trilhas em duas dimensões. Eles podem coexistir: uma grade de cartões pode conter barras flexíveis. A escolha depende das relações de alinhamento.",
      ".palco {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: 12px;\n}\n.item {\n  display: flex;\n  align-items: center;\n  min-height: 60px;\n}",
      "O pai organiza colunas compartilhadas.|Cada item usa flex para alinhar seu próprio conteúdo.",
      "Combinar grade externa e alinhamento interno em cartões.",
      "Não trate um modelo como substituto universal.|Escolha pela necessidade de alinhamento."
  )
]});
modulos.push({id:"posicionamento",titulo:"05 — Posicionamento",assuntos:[
  assunto(
      "position",
      "Position",
      "Position define o esquema de posicionamento da caixa. Offsets e bloco de referência variam conforme o valor escolhido. Nem todo elemento posicionado sai do fluxo: relative e sticky conservam espaço.",
      ".palco {\n  position: relative;\n}\n.alvo {\n  position: relative;\n  top: 8px;\n  left: 12px;\n}",
      "O deslocamento parte da posição original.|O espaço reservado no fluxo permanece.",
      "Escolher um esquema sem perder a organização do documento.",
      "Use fluxo normal quando suficiente.|Identifique o bloco de referência.",
      caixas,
      ["position","posição"]
  ),
  assunto(
      "static",
      "Static",
      "É o valor inicial de position e mantém a caixa no fluxo normal. top, right, bottom e left não a deslocam nesse modo. Sua posição resulta do modelo de layout e das caixas anteriores.",
      ".alvo {\n  position: static;\n  top: 30px;\n  border-left: 5px solid #7c3aed;\n}",
      "top não desloca um elemento static.|A borda continua sendo aplicada normalmente.",
      "Reconhecer por que offsets não produzem efeito.",
      "Não use offsets sem escolher o modo adequado.|Prefira o fluxo para conteúdo sequencial.",
      caixas,
      ["static"]
  ),
  assunto(
      "relative",
      "Relative",
      "Relative preserva o espaço original e desloca a caixa visualmente. Também pode estabelecer o bloco de referência para filhos absolute. O deslocamento não empurra os irmãos para abrir um novo espaço.",
      ".alvo {\n  position: relative;\n  left: 20px;\n  top: 10px;\n}",
      "left e top deslocam a apresentação.|Os irmãos conservam suas posições no fluxo.",
      "Fazer pequenos ajustes ou ancorar um filho posicionado.",
      "Observe sobreposição após deslocar.|Não construa toda a página com offsets.",
      caixas,
      ["relative"]
  ),
  assunto(
      "absolute",
      "Absolute",
      "Absolute retira a caixa do fluxo normal. Neste exemplo o ancestral relative estabelece seu bloco de referência. Outros recursos, como transform, também podem alterar esse bloco; ele não é sempre o body.",
      ".palco {\n  position: relative;\n  min-height: 160px;\n}\n.alvo {\n  position: absolute;\n  top: 12px;\n  right: 12px;\n  margin: 0;\n}",
      "O pai relative delimita a referência.|O item absoluto deixa de reservar seu espaço anterior.",
      "Colocar um selo no canto de um cartão.",
      "Garanta altura contextual no pai.|Não sobreponha conteúdo ou controles.",
      caixas,
      ["absolute","posição absoluta"]
  ),
  assunto(
      "fixed",
      "Fixed",
      "Fixed normalmente se referencia ao viewport e não acompanha a rolagem do documento. Um ancestral com transform pode mudar essa referência. Nesta biblioteca o viewport pertence ao iframe da demonstração.",
      ".alvo {\n  position: fixed;\n  right: 16px;\n  bottom: 16px;\n  background: #ddd6fe;\n}",
      "right e bottom fixam a distância das bordas da prévia.|Os demais itens seguem o fluxo sem reservar espaço ao elemento fixo.",
      "Posicionar uma ação persistente sem deslocar o conteúdo.",
      "Não cubra informação ou foco.|Teste zoom e telas pequenas.",
      caixas,
      ["fixed","fixar elemento"]
  ),
  assunto(
      "sticky",
      "Sticky",
      "Sticky combina participação no fluxo e retenção junto a uma borda de rolagem. Precisa de um inset não automático no eixo relevante e espaço para se mover dentro de seus limites. Role a área interna desta demonstração.",
      ".palco {\n  height: 150px;\n  overflow: auto;\n}\n.alvo {\n  position: sticky;\n  top: 0;\n  background: #ddd6fe;\n}",
      "overflow cria a área de rolagem.|top define o limite em que o cabeçalho passa a ficar retido.",
      "Manter o cabeçalho visível em uma lista rolável.",
      "Confira ancestrais com overflow.|O elemento não pode ultrapassar seu limite de contenção.",
      longo,
      ["sticky","cabeçalho fixo"]
  ),
  assunto(
      "offsets",
      "Top, right, bottom e left",
      "Insets expressam distâncias conforme o esquema de position. Em absolute, definir lados opostos pode determinar uma dimensão automática. Em relative, eles deslocam a caixa a partir de sua posição normal.",
      ".palco {\n  position: relative;\n  min-height: 120px;\n}\n.alvo {\n  position: absolute;\n  top: 12px;\n  right: 12px;\n  left: 12px;\n  margin: 0;\n}",
      "As laterais opostas esticam a largura automática.|top posiciona a caixa no início do pai.",
      "Criar um aviso ancorado com distâncias consistentes.",
      "Evite medidas contraditórias.|Considere inset-inline para idiomas diferentes.",
      caixas,
      ["top","right","bottom","left","inset"]
  ),
  assunto(
      "z-index",
      "Z-index",
      "Controla a ordem de empilhamento nos contextos apropriados, como elementos posicionados e itens flex/grid. Um número alto não permite sair do contexto de empilhamento de um ancestral.",
      ".palco {\n  position: relative;\n  min-height: 130px;\n}\n.item {\n  position: absolute;\n  width: 130px;\n}\n.alvo {\n  z-index: 2;\n  top: 35px;\n  left: 35px;\n  background: #c4b5fd;\n}\n.item:nth-child(2) {\n  z-index: 1;\n  top: 15px;\n  left: 80px;\n}\n.item:nth-child(3) {\n  top: 75px;\n}",
      "Os itens compartilham o contexto do exemplo.|z-index 2 coloca o primeiro acima do segundo na área sobreposta.",
      "Resolver sobreposições de componentes.",
      "Identifique contextos antes de aumentar números.|Use uma escala de camadas pequena.",
      caixas,
      ["z-index","sobreposição"]
  ),
  assunto(
      "stacking-context",
      "Stacking context",
      "Um contexto de empilhamento agrupa seus descendentes como uma unidade. opacity menor que 1, transform e isolation podem criá-lo. O z-index de um filho compete dentro desse grupo, não globalmente.",
      ".palco {\n  isolation: isolate;\n  position: relative;\n}\n.alvo {\n  position: relative;\n  z-index: 1;\n  transform: translateY(12px);\n}\n.item:nth-child(2) {\n  position: relative;\n  z-index: 2;\n  background: #bfdbfe;\n}",
      "isolation cria um contexto explícito.|O segundo item pode cobrir a região de sobreposição por estar em uma camada superior.",
      "Investigar menus que ficam atrás de outros painéis.",
      "Inspecione os ancestrais.|Não suponha que z-index é uma escala global.",
      caixas,
      ["stacking context","contexto de empilhamento"]
  ),
  assunto(
      "overflow-position",
      "Overflow e posicionamento",
      "Recorte e rolagem de ancestrais influenciam elementos posicionados. Sticky procura um ancestral com mecanismo de rolagem; um overflow inesperado pode mudar o comportamento. O recorte também pode esconder sombras e controles.",
      ".palco {\n  position: relative;\n  height: 130px;\n  overflow: hidden;\n}\n.alvo {\n  position: absolute;\n  top: 100px;\n  left: 10px;\n  min-height: 80px;\n}",
      "O item ultrapassa o limite inferior.|overflow hidden recorta o trecho que sai da área.",
      "Diagnosticar elementos que desaparecem parcialmente.",
      "Não recorte conteúdo necessário.|Considere onde o foco aparecerá."
  )
]});
modulos.push({id:"responsividade",titulo:"06 — Responsividade",assuntos:[
  assunto(
      "responsivo",
      "O que é design responsivo?",
      "Uma interface responsiva se adapta ao espaço disponível, ao conteúdo e às condições de uso. Não consiste apenas em diminuir tudo: o layout precisa continuar legível e operável. Redimensione a janela para comparar a prévia.",
      ".palco {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(min(160px, 100%), 1fr));\n  gap: 12px;\n}",
      "auto-fit ajusta a quantidade de colunas.|O mínimo limitado a 100% evita impor uma coluna maior que o pai.",
      "Exibir cartões sem exigir uma largura fixa de dispositivo.",
      "Teste conteúdo e zoom, além da largura.|Evite esconder informação para fazer caber.",
      caixas,
      ["design responsivo","adaptar tela"]
  ),
  assunto(
      "viewport",
      "Viewport",
      "Viewport é a área usada pelo navegador para apresentar o documento. A meta viewport permite que navegadores móveis usem a largura do dispositivo em vez de uma largura de layout legada. Na demonstração, o viewport é o iframe.",
      ".alvo {\n  max-width: 100%;\n  box-sizing: border-box;\n  padding: 16px;\n}",
      "max-width limita a caixa à área disponível.|A meta fornecida pertence ao head, não à folha CSS.",
      "Preparar a página para medidas responsivas em celulares.",
      "Não desative zoom com user-scalable=no.|Confira a meta antes de ajustar breakpoints.",
      caixas,
      ["viewport","meta viewport"],
      {"htmlReferencia":"<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">"}
  ),
  assunto(
      "unidades-relativas",
      "Unidades relativas",
      "Uma medida relativa precisa de uma referência. Porcentagens, em, rem e unidades de viewport não são equivalentes; seu significado depende da propriedade. Misturá-las pode ser útil quando cada relação é intencional.",
      ".alvo {\n  width: 80%;\n  font-size: 1.2rem;\n  padding: 1em;\n  box-sizing: border-box;\n}",
      "A largura acompanha o pai.|A fonte acompanha a raiz e o padding acompanha a própria fonte.",
      "Construir componentes que respondam ao espaço e ao texto.",
      "Identifique a referência de cada declaração.|Teste aumento do tamanho de fonte."
  ),
  assunto(
      "porcentagens",
      "Porcentagens",
      "Porcentagens não têm uma única base universal. width costuma depender da largura do bloco de referência; height percentual exige uma altura de referência definida em muitos casos. transform translate usa dimensões do próprio elemento.",
      ".alvo {\n  width: 50%;\n  box-sizing: border-box;\n}",
      "50% solicita metade da largura do bloco de referência.|border-box inclui padding e borda dentro dessa metade.",
      "Fazer uma área acompanhar a largura de seu contêiner.",
      "Não presuma que height:100% sempre funciona.|Confira a propriedade antes de calcular percentuais.",
      caixas,
      ["porcentagem","%"]
  ),
  assunto(
      "rem-em",
      "Rem e em",
      "rem usa a fonte do elemento raiz. em usa uma referência tipográfica contextual: em font-size considera a fonte herdada; em padding considera a fonte calculada do próprio elemento. Isso pode gerar composição em elementos aninhados.",
      ".palco {\n  font-size: 20px;\n}\n.alvo {\n  font-size: 1.2em;\n  padding: 1em;\n  border-radius: .5rem;\n}",
      "O texto do item recebe 24px a partir dos 20px do pai.|Seu padding de 1em acompanha os 24px; o raio rem usa a raiz.",
      "Fazer controles crescerem junto ao texto.",
      "Evite multiplicações acidentais de em.|Use rem quando desejar uma referência global.",
      caixas,
      ["rem","em"]
  ),
  assunto(
      "viewport-units",
      "Viewport units",
      "vw e vh representam frações do viewport; vmin e vmax escolhem a menor ou maior dimensão. svh, lvh e dvh distinguem variações do viewport móvel. Na biblioteca, essas medidas se referem à moldura de resultado.",
      ".alvo {\n  width: 60vw;\n  max-width: 100%;\n  min-height: 20vh;\n  box-sizing: border-box;\n}",
      "60vw acompanha a largura da prévia.|20vh cria um mínimo relacionado à altura da moldura.",
      "Dimensionar áreas em relação à janela sem perder limites locais.",
      "Não use vw sozinho para todo texto.|Considere barras móveis e zoom.",
      caixas,
      ["vw","vh","dvh","svh","lvh"]
  ),
  assunto(
      "media-queries",
      "Media queries",
      "Media queries aplicam regras conforme condições como largura e preferências do usuário. A condição não identifica o modelo do aparelho. Nesta prévia, o breakpoint responde à largura do iframe.",
      ".palco {\n  display: grid;\n  gap: 8px;\n}\n@media (min-width: 480px) {\n  .palco {\n    grid-template-columns: repeat(3, minmax(0, 1fr));\n  }\n}",
      "O layout base tem uma coluna.|A consulta ativa três colunas quando a área alcança 480px.",
      "Adaptar um grupo de cartões quando há espaço suficiente.",
      "Escolha limites pelo conteúdo.|Mantenha a regra base funcional.",
      caixas,
      ["media query","media queries","responsivo","@media"]
  ),
  assunto(
      "breakpoints",
      "Breakpoints",
      "Um breakpoint é uma condição em que o layout precisa mudar. Escolha-o quando o conteúdo deixa de caber ou fica excessivamente espalhado, não por uma lista rígida de aparelhos. Pequenas diferenças de largura não devem quebrar a interface.",
      ".palco {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n@media (min-width: 520px) {\n  .palco {\n    flex-direction: row;\n  }\n}",
      "Abaixo do limite os itens ficam empilhados.|A partir de 520px o eixo muda para linha.",
      "Escolher o momento de reorganizar uma barra de ações.",
      "Teste logo antes e depois do limite.|Não crie um breakpoint para cada aparelho."
  ),
  assunto(
      "mobile-first",
      "Mobile-first",
      "A base é escrita para espaços menores e ampliada com condições min-width. Isso reduz a necessidade de desfazer grandes layouts em telas pequenas. Não impede considerar desktop e acessibilidade desde o planejamento.",
      ".item {\n  padding: 8px;\n}\n@media (min-width: 480px) {\n  .item {\n    padding: 16px;\n  }\n}",
      "O padding menor é a regra inicial.|A condição amplia o respiro quando existe mais espaço.",
      "Manter uma base simples e acrescentar capacidade progressivamente.",
      "Não confunda mobile-first com conteúdo reduzido.|Revise a leitura nas duas condições."
  ),
  assunto(
      "imagens-responsivas",
      "Imagens responsivas",
      "Uma imagem pode encolher sem perder proporção com max-width:100% e height:auto. width e height no HTML ajudam a reservar espaço. Selecionar arquivos diferentes com srcset é uma responsabilidade complementar do HTML.",
      "img {\n  display: block;\n  max-width: 100%;\n  height: auto;\n}",
      "max-width impede a imagem de exceder o pai.|height auto mantém a proporção intrínseca.",
      "Exibir uma ilustração em cartões de larguras distintas.",
      "Defina alternativa textual apropriada.|Informe dimensões intrínsecas para reduzir deslocamentos.",
      "<div class=\"palco\"><img width=\"600\" height=\"200\" alt=\"Montanhas ilustradas\" src=\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2MDAgMjAwIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Q1ZThmZiIvPjxwYXRoIGQ9Ik0wIDIwMCAyMDAgNDAgMzUwIDIwMFoiIGZpbGw9IiM2ZjQyYzEiLz48L3N2Zz4=\"></div>",
      ["img","imagem","max-width imagem"]
  ),
  assunto(
      "layouts-flexiveis",
      "Layouts flexíveis",
      "Layouts flexíveis combinam limites e espaço disponível em vez de depender só de medidas fixas. minmax, flex-basis e max-width permitem crescimento controlado. O conteúdo ainda precisa ser testado em casos extremos.",
      ".palco {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n}\n.item {\n  flex: 1 1 140px;\n  min-width: 0;\n  overflow-wrap: anywhere;\n}",
      "A base de 140px orienta a quebra.|flex-grow divide espaço livre e min-width permite redução.",
      "Distribuir cartões com textos de comprimentos diferentes.",
      "Teste palavras longas.|Evite medidas mínimas incompatíveis com o pai."
  ),
  assunto(
      "container-queries",
      "Container queries",
      "Consultas de contêiner permitem adaptar um componente à largura de um ancestral elegível. Diferem das media queries, que consultam o viewport. A condição deve atuar nos descendentes, não dimensionar o próprio contêiner consultado.",
      ".palco {\n  container-type: inline-size;\n}\n.item {\n  background: #e5ddf5;\n}\n@container (min-width: 400px) {\n  .item {\n    background: #bfdbfe;\n    padding: 20px;\n  }\n}",
      "container-type habilita consulta de tamanho inline.|Os itens mudam quando a largura interna consultada atinge o limite.",
      "Reutilizar um cartão em uma lateral e em uma região principal.",
      "Forneça um estilo base.|Confira suporte dos navegadores utilizados.",
      caixas,
      ["@container","container query","contêiner"]
  )
]});
modulos.push({id:"interacao",titulo:"07 — Interação e efeitos",assuntos:[
  assunto(
      "pseudo-classes",
      "Pseudo-classes",
      "Pseudo-classes selecionam estados ou relações estruturais sem exigir uma classe manual para cada caso. :hover e :focus são estados; :nth-child considera a posição entre irmãos. Elas continuam sujeitas à cascata.",
      ".item:nth-child(2) {\n  background: #bfdbfe;\n}",
      "nth-child(2) encontra o segundo filho.|Os outros itens preservam o estilo de base.",
      "Distinguir linhas alternadas ou um estado de interação.",
      "Não dependa somente de posição se a estrutura variar.|Separe estado visual e regra de negócio.",
      caixas,
      ["pseudo-classe",":nth-child"]
  ),
  assunto(
      "hover",
      "Hover",
      "Hover corresponde a um dispositivo apontando sobre o elemento. Em telas de toque seu comportamento pode variar. Informações essenciais e ações precisam permanecer disponíveis sem depender de hover.",
      ".alvo {\n  padding: 12px 20px;\n}\n.alvo:hover {\n  background: #ddd6fe;\n  border-color: #7c3aed;\n}",
      "A regra entra quando o ponteiro está sobre o botão.|A superfície e a borda mudam sem alterar o texto.",
      "Dar retorno visual a uma ação clicável.",
      "Ofereça também estado de foco.|Não esconda ações obrigatórias até hover.",
      botao,
      [":hover","mouse"]
  ),
  assunto(
      "focus",
      "Focus",
      "Focus identifica o elemento que recebe interação pelo teclado ou por outros mecanismos. :focus-visible é útil para mostrar um indicador quando o navegador considera necessário. Um foco visível permite localizar a ação atual.",
      ".alvo:focus-visible {\n  outline: 3px solid #075985;\n  outline-offset: 4px;\n}",
      "outline não ocupa espaço no layout.|outline-offset afasta o indicador da borda.",
      "Orientar quem navega com Tab.",
      "Não remova outline sem substituto.|Confira se o indicador não é recortado.",
      botao,
      [":focus",":focus-visible","foco","teclado"]
  ),
  assunto(
      "active",
      "Active",
      "Active corresponde ao momento de ativação de um elemento, como durante a pressão do mouse. Não representa uma página selecionada permanentemente. Para estado persistente, use semântica e atributos apropriados.",
      ".alvo {\n  padding: 12px 20px;\n}\n.alvo:active {\n  transform: translateY(2px);\n  background: #c4b5fd;\n}",
      "A regra atua durante a ativação.|translateY desloca visualmente sem reorganizar irmãos.",
      "Comunicar que um controle está sendo pressionado.",
      "Não use active como seleção permanente.|Mantenha o movimento curto e dispensável.",
      botao,
      [":active","pressionar"]
  ),
  assunto(
      "pseudo-elementos",
      "Pseudo-elementos",
      "Pseudo-elementos estilizam partes específicas ou geradas da caixa. ::first-letter atua na primeira letra de um bloco de texto; ::before e ::after podem inserir conteúdo visual. Não substituem uma estrutura HTML necessária à compreensão.",
      "p::first-letter {\n  color: #7c3aed;\n  font-size: 1.6em;\n}",
      "first-letter seleciona uma parte do texto.|O aumento afeta a apresentação, sem alterar o conteúdo original.",
      "Criar detalhes editoriais em uma introdução.",
      "Não coloque informação essencial apenas em conteúdo gerado.|Teste leitura e seleção de texto.",
      texto,
      ["pseudo-elemento","::first-letter"]
  ),
  assunto(
      "before-after",
      "Before e after",
      "::before e ::after geram caixas associadas ao elemento quando content permite. São adequados para decoração. Conteúdo relevante deve permanecer no HTML porque tecnologias assistivas podem tratá-lo de formas diferentes.",
      ".alvo::before {\n  content: \"★ \";\n  color: #7c3aed;\n}\n.alvo::after {\n  content: \" ✓\";\n}",
      "before insere um detalhe antes do conteúdo.|after insere outro depois; o texto do item continua no HTML.",
      "Adicionar ornamentação que não seja necessária à compreensão.",
      "Não substitua rótulos acessíveis.|Evite aplicar a elementos substituídos como img.",
      caixas,
      ["::before","::after","content"]
  ),
  assunto(
      "transicoes",
      "Transições",
      "Transições interpolam mudanças de propriedades animáveis quando o valor muda. Sem mudança de estado não há movimento. Escolha as propriedades explicitamente para evitar animar medidas não planejadas.",
      ".alvo {\n  background: #eee;\n  transition: background-color 250ms ease;\n}\n.alvo:hover {\n  background-color: #ddd6fe;\n}",
      "A alteração de background-color dispara a transição.|250ms define a duração; ease controla a progressão.",
      "Suavizar uma mudança de estado ao passar o mouse.",
      "Evite transition: all por padrão.|Respeite movimento reduzido.",
      botao,
      ["transition","transição"]
  ),
  assunto(
      "transform",
      "Transform",
      "Transform altera a apresentação geométrica sem reorganizar o fluxo normal. Pode criar contexto de empilhamento e mudar referências de posicionamento de descendentes. As funções são compostas na ordem declarada.",
      ".alvo {\n  transform: translateX(12px) rotate(-2deg);\n  transform-origin: center;\n}",
      "translateX desloca a caixa.|rotate inclina a apresentação; o espaço original permanece reservado.",
      "Criar um destaque visual discreto sem reordenar conteúdo.",
      "Não deixe a caixa cobrir controles.|Observe os novos contextos de empilhamento.",
      caixas,
      ["transform"]
  ),
  assunto(
      "scale",
      "Scale",
      "Scale amplia ou reduz a apresentação em relação à origem da transformação. Não reserva espaço adicional no layout. Uma ampliação exagerada pode recortar conteúdo ou sobrepor elementos vizinhos.",
      ".alvo {\n  transform: scale(1.05);\n  transform-origin: left center;\n}",
      "1.05 amplia em cinco por cento.|A origem à esquerda mantém esse lado como referência.",
      "Dar ênfase discreta a uma caixa.",
      "Preveja espaço visual.|Não use escala para tornar texto pequeno artificialmente.",
      caixas,
      ["scale","aumentar"]
  ),
  assunto(
      "rotate",
      "Rotate",
      "Rotate gira a caixa por um ângulo, normalmente em deg. O giro ocorre ao redor de transform-origin e não altera o espaço reservado. Elementos de leitura extensa raramente se beneficiam dessa transformação.",
      ".alvo {\n  transform: rotate(-3deg);\n  transform-origin: center;\n}",
      "O ângulo negativo inclina em um sentido.|A origem central mantém o centro como pivô.",
      "Criar um detalhe decorativo em um selo.",
      "Use ângulos pequenos.|Não comprometa a leitura.",
      caixas,
      ["rotate","girar"]
  ),
  assunto(
      "translate",
      "Translate",
      "Translate desloca a apresentação nos eixos da transformação. Porcentagens usam dimensões da própria caixa, diferentemente de muitos percentuais de layout. O deslocamento não empurra os irmãos.",
      ".alvo {\n  transform: translate(20px, 8px);\n}",
      "20px desloca no eixo horizontal.|8px desloca no vertical, sem mudar o fluxo dos outros itens.",
      "Ajustar uma decoração ou animar entrada e saída.",
      "Evite usar deslocamento para consertar uma grade inadequada.|Confira sobreposição em telas pequenas.",
      caixas,
      ["translate","mover"]
  ),
  assunto(
      "animacoes-basicas",
      "Animações básicas",
      "Uma animação pode percorrer estados sem depender de uma alteração por hover. @keyframes define os estados e animation configura a execução. Este exemplo faz uma entrada curta e para; a demonstração respeita movimento reduzido.",
      "@keyframes entrada {\n  from {\n    opacity: 0;\n    transform: translateY(8px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n.alvo {\n  animation: entrada 700ms ease-out both;\n}",
      "opacity e transform formam os estados.|both mantém os estados de preenchimento antes e depois da execução.",
      "Apresentar um aviso com entrada suave e finita.",
      "Não repita efeitos sem propósito.|Ofereça movimento reduzido.",
      caixas,
      ["animação básica","animation entrada"]
  )
]});
modulos.push({id:"cascata",titulo:"08 — Cascata e organização",assuntos:[
  assunto(
      "cascata",
      "Cascata CSS",
      "A cascata decide entre declarações concorrentes considerando origem, importância e camadas antes de comparar especificidade. A ordem no arquivo resolve empates em condições equivalentes; não significa simplesmente que a última regra sempre vence.",
      "@layer base, componente;\n@layer base {\n  .alvo {\n    color: #075985;\n  }\n}\n@layer componente {\n  .alvo {\n    color: #7c3aed;\n  }\n}",
      "A ordem das camadas normais coloca componente depois de base.|As regras têm a mesma classe, mas a camada posterior vence neste exemplo.",
      "Planejar a precedência entre base e componentes.",
      "Considere importância antes de especificidade.|Não tente corrigir toda disputa movendo regras.",
      caixas,
      ["cascata","@layer"]
  ),
  assunto(
      "especificidade",
      "Especificidade",
      "Especificidade compara seletores após as etapas anteriores da cascata. IDs têm peso maior que classes, que têm peso maior que tipos de elemento. :where() adiciona peso zero; herança não entra nessa contagem.",
      ".alvo {\n  color: #075985;\n}\n#principal {\n  color: #7c3aed;\n}",
      "As duas regras normais atingem o primeiro item.|O ID vence a classe dentro das mesmas condições de origem e camada.",
      "Investigar uma regra que permanece riscada no inspetor.",
      "Prefira seletores simples.|Não aumente especificidade sem entender a origem do conflito.",
      caixas,
      ["especificidade","specificity"]
  ),
  assunto(
      "heranca",
      "Herança",
      "Algumas propriedades, como color e font-family, podem ser herdadas quando não há valor aplicado diretamente. Outras, como margin, não são herdadas por padrão. Um valor declarado no filho pode substituir o herdado sem competir com a especificidade do seletor do pai.",
      ".palco {\n  color: #075985;\n  font-family: Georgia, serif;\n}\n.alvo {\n  color: #7c3aed;\n}",
      "Os itens recebem a fonte do ancestral.|O primeiro item usa sua cor própria, em vez da cor herdada.",
      "Definir padrões tipográficos sem repetir declarações em cada filho.",
      "Não espere herança de todas as propriedades.|Use inherit quando a relação for intencional.",
      caixas,
      ["inherit","herança"]
  ),
  assunto(
      "ordem-declaracoes",
      "Ordem das declarações",
      "Quando origem, importância, camada e especificidade estão empatadas, a ordem de aparecimento pode decidir o valor. Abreviações também podem redefinir componentes anteriores. A leitura deve considerar o conjunto de regras aplicáveis.",
      ".alvo {\n  color: #075985;\n  color: #7c3aed;\n}",
      "As duas declarações têm as mesmas condições.|A segunda cor válida prevalece neste bloco.",
      "Identificar duplicações que mascaram uma alteração anterior.",
      "Remova duplicação sem propósito.|Preserve fallbacks intencionais com comentário.",
      caixas,
      ["ordem","sobrescrever"]
  ),
  assunto(
      "important",
      "Uso de !important",
      "!important muda a prioridade de uma declaração, sem aumentar a especificidade do seletor. Existem prioridades por origem e camadas também entre declarações importantes. Seu uso indiscriminado dificulta a manutenção.",
      "#principal {\n  color: #075985;\n}\n.alvo {\n  color: #7c3aed !important;\n}",
      "A declaração importante vence a normal de ID neste exemplo.|O marcador se aplica a color, não a todo o seletor.",
      "Reconhecer uma exceção de precedência em código legado.",
      "Evite escaladas de !important.|Documente a necessidade de uma exceção real.",
      caixas,
      ["!important","prioridade"]
  ),
  assunto(
      "variaveis",
      "Variáveis CSS",
      "Custom properties permitem nomear valores e reutilizá-los no contexto dos seletores. São frequentemente chamadas de variáveis CSS, mas participam da cascata e geralmente herdam. Podem ser redefinidas em uma região sem alterar o restante do documento.",
      ".palco {\n  --destaque: #7c3aed;\n}\n.alvo {\n  color: var(--destaque);\n  border: 2px solid var(--destaque);\n}",
      "--destaque declara um valor no escopo da seção.|var reutiliza o valor em duas propriedades.",
      "Centralizar uma decisão visual usada em vários lugares.",
      "Nomeie pelo papel do valor.|Defina um escopo coerente com o reúso.",
      caixas,
      ["variáveis","variaveis css","tokens"]
  ),
  assunto(
      "custom-properties",
      "Custom properties",
      "Nomes iniciados por -- definem propriedades personalizadas e diferenciam maiúsculas de minúsculas. Sem registro específico, elas recebem sequências de tokens e sua validade final depende da propriedade que as consome.",
      ".palco {\n  --cor: #075985;\n}\n.alvo {\n  --cor: #7c3aed;\n  color: var(--cor);\n}\n.item:nth-child(2) {\n  color: var(--cor);\n}",
      "O primeiro item redefine o valor localmente.|O segundo herda o valor da seção.",
      "Criar variações locais de um componente.",
      "Mantenha convenções de nomes.|Não suponha que qualquer token seja válido no destino.",
      caixas,
      ["custom properties","propriedades personalizadas"]
  ),
  assunto(
      "var",
      "Função var()",
      "var() substitui uma custom property por seu valor. O fallback é usado quando a variável está ausente ou inválida como custom property, mas não corrige todo valor inadequado à propriedade final. Uma cor existente com valor 20px continua inválida para color.",
      ".alvo {\n  color: var(--cor-ausente, #7c3aed);\n  padding: var(--espaco-ausente, 16px);\n}",
      "A variável não definida aciona o fallback.|O valor substituído precisa ser válido para color ou padding.",
      "Fornecer padrões quando uma personalização opcional não existe.",
      "Valide os valores fornecidos ao componente.|Não trate fallback como validação de tipo.",
      caixas,
      ["var()","fallback"]
  ),
  assunto(
      "funcoes-matematicas",
      "Calc, min, max e clamp",
      "calc combina operações; min escolhe o menor valor e max o maior. clamp define mínimo, preferência e máximo. As expressões precisam combinar tipos compatíveis e seus resultados ainda passam pelas restrições da propriedade.",
      ".alvo {\n  box-sizing: border-box;\n  width: min(100%, 320px);\n  padding: clamp(8px, 2vw, 24px);\n  margin-left: max(0px, calc(5% - 8px));\n}",
      "min limita a largura ao pai ou a 320px.|clamp mantém padding entre limites e calc calcula uma expressão intermediária.",
      "Definir medidas fluidas sem muitos breakpoints.",
      "Use espaços em torno de + e - em calc.|Teste os dois extremos do intervalo.",
      caixas,
      ["calc","min","max","clamp","medidas fluidas"]
  ),
  assunto(
      "organizacao-estilos",
      "Organização de estilos",
      "Agrupe regras por responsabilidade, mantendo uma ordem previsível entre base, componentes e adaptações. Dividir arquivos não muda a cascata por si só: a ordem efetiva de carregamento continua relevante.",
      ".palco {\n  --espaco: 12px;\n}\n.item {\n  padding: var(--espaco);\n}\n.item.alvo {\n  border-left: 4px solid #7c3aed;\n}",
      "A seção define uma decisão compartilhada.|A variação adiciona apenas o destaque necessário.",
      "Localizar alterações sem duplicar a base do componente.",
      "Evite folhas globais com responsabilidades misturadas.|Mantenha regras relacionadas próximas."
  ),
  assunto(
      "nomenclatura",
      "Convenções de nomenclatura",
      "Uma convenção consistente torna o papel das classes mais previsível. BEM é uma opção com bloco, elemento e modificador, mas não é obrigatório. O nome deve descrever responsabilidade, sem depender da posição ou cor atual.",
      ".cartao {\n  padding: 16px;\n  border: 1px solid #777;\n}\n.cartao__titulo {\n  margin-top: 0;\n}\n.cartao--destaque {\n  border-color: #7c3aed;\n}",
      "cartao é o bloco reutilizável.|__titulo identifica uma parte e --destaque uma variação.",
      "Comunicar a estrutura de um componente entre colaboradores.",
      "Escolha uma convenção e mantenha consistência.|Evite nomes como caixa-roxa se o tema pode mudar.",
      "<article class=\"cartao cartao--destaque\"><h2 class=\"cartao__titulo\">Material de consulta</h2><p>Um componente com nomes previsíveis.</p></article>",
      ["bem","nomes de classes"]
  ),
  assunto(
      "css-modular",
      "CSS modular",
      "Modularizar CSS significa separar responsabilidades e controlar o alcance dos estilos. CSS puro não isola automaticamente classes por arquivo. CSS Modules é uma ferramenta de build diferente e não é necessária para organizar uma aplicação estática.",
      ".cartao {\n  border: 1px solid #777;\n  padding: 16px;\n}\n.cartao__acao {\n  color: #5b21b6;\n}",
      "O prefixo do componente reduz colisões de nomes.|A regra da ação não depende de um seletor global de links.",
      "Reutilizar componentes sem espalhar efeitos para outras áreas.",
      "Não assuma isolamento automático por arquivo.|Crie arquivos quando houver uma responsabilidade clara.",
      "<article class=\"cartao\"><h2>Cartão</h2><a class=\"cartao__acao\" href=\"#detalhe\">Consultar detalhe</a><p id=\"detalhe\">Conteúdo do cartão.</p></article>",
      ["modular","componentes"]
  )
]});
modulos.push({id:"avancados",titulo:"09 — Animações e recursos avançados",assuntos:[
  assunto(
      "keyframes",
      "@keyframes",
      "Keyframes descrevem estados de uma animação por percentuais ou from/to. Eles não iniciam uma animação sozinhos: um elemento precisa referenciar seu nome. Propriedades intermediárias são interpoladas quando a propriedade e os valores permitem.",
      "@keyframes surgir {\n  from {\n    opacity: 0;\n  }\n  to {\n    opacity: 1;\n  }\n}\n.alvo {\n  animation: surgir 900ms ease-out both;\n}",
      "surgir é o nome referenciado por animation.|opacity varia entre os dois estados.",
      "Reutilizar uma entrada de conteúdo em componentes diferentes.",
      "Use nomes que não colidam.|Evite movimento indispensável à compreensão.",
      caixas,
      ["@keyframes","keyframes","animação"]
  ),
  assunto(
      "animation",
      "Animation",
      "Animation é uma abreviação que configura nome, duração e outros parâmetros. animation-name sozinho não define duração visível, pois o padrão da duração é zero. O exemplo executa uma única entrada.",
      "@keyframes aparecer {\n  from {\n    opacity: 0;\n    transform: translateY(8px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n.alvo {\n  animation: aparecer 800ms ease-out 0s 1 both;\n}",
      "800ms é a duração.|1 limita a uma execução e both controla o preenchimento dos estados.",
      "Aplicar uma sequência finita a um aviso novo.",
      "Evite abreviações incompreensíveis.|Respeite a preferência por movimento reduzido.",
      caixas,
      ["animation","animação"]
  ),
  assunto(
      "timing-functions",
      "Timing functions",
      "A função de progressão determina como o tempo se distribui ao longo da animação. linear mantém progressão uniforme; ease-in e ease-out mudam o ritmo. Ela não altera a duração total declarada.",
      "@keyframes mover {\n  from {\n    transform: translateX(0);\n  }\n  to {\n    transform: translateX(24px);\n  }\n}\n.alvo {\n  animation: mover 1s cubic-bezier(.2, .7, .3, 1) both;\n}",
      "cubic-bezier controla a progressão temporal.|A distância final continua sendo 24px.",
      "Escolher uma sensação de entrada ou deslocamento.",
      "Prefira curvas discretas.|Não confunda ritmo com duração.",
      caixas,
      ["animation-timing-function","ease","linear","cubic-bezier"]
  ),
  assunto(
      "delays",
      "Delays",
      "Delay define quando uma transição ou animação começa em relação ao disparo. Um delay negativo de animação começa em uma posição já avançada da sequência. Esperas longas podem parecer falhas de interface.",
      "@keyframes mostrar {\n  from {\n    opacity: 0;\n  }\n  to {\n    opacity: 1;\n  }\n}\n.alvo {\n  animation: mostrar 700ms ease-out 300ms both;\n}",
      "300ms adia o início.|both aplica o estado inicial durante a espera.",
      "Coordenar uma pequena sequência de apresentação.",
      "Não atrase ações essenciais.|Mantenha esperas curtas e justificadas.",
      caixas,
      ["animation-delay","transition-delay","atraso"]
  ),
  assunto(
      "iteration-count",
      "Iteration count",
      "animation-iteration-count controla o número de ciclos. Pode receber números fracionários ou infinite. Repetição sem pausa pode distrair e exigir mecanismos adicionais de controle e acessibilidade.",
      "@keyframes deslocar {\n  from {\n    transform: translateX(0);\n  }\n  to {\n    transform: translateX(12px);\n  }\n}\n.alvo {\n  animation: deslocar 600ms ease-in-out 2 alternate;\n}",
      "2 solicita dois ciclos.|alternate inverte a direção do segundo ciclo.",
      "Executar uma indicação breve sem repetição infinita.",
      "Evite movimento contínuo desnecessário.|Ofereça uma versão sem movimento.",
      caixas,
      ["animation-iteration-count","repetição"]
  ),
  assunto(
      "animacoes-combinadas",
      "Animações combinadas",
      "Uma lista de animações aplica várias sequências ao mesmo elemento. Se duas alteram a mesma propriedade, a composição padrão pode fazer uma substituir a outra. Separar propriedades reduz disputas inesperadas.",
      "@keyframes clarear {\n  from {\n    opacity: 0;\n  }\n  to {\n    opacity: 1;\n  }\n}\n@keyframes elevar {\n  from {\n    transform: translateY(12px);\n  }\n  to {\n    transform: translateY(0);\n  }\n}\n.alvo {\n  animation: clarear 800ms ease-out both, elevar 800ms ease-out both;\n}",
      "Uma sequência controla opacity.|A outra controla transform, evitando disputa pela mesma propriedade.",
      "Combinar entrada de posição e transparência.",
      "Não empilhe efeitos sem propósito.|Revise conflitos de propriedades."
  ),
  assunto(
      "gradientes",
      "Gradientes",
      "Gradientes são imagens geradas pelo CSS, não cores simples. linear-gradient cria uma transição ao longo de uma direção; radial-gradient parte de uma região central. O texto precisa continuar legível em todos os pontos do fundo.",
      ".alvo {\n  min-height: 80px;\n  background: linear-gradient(120deg, #dbeafe 0%, #e9d5ff 70%, #fce7f3 100%);\n}",
      "O ângulo define a direção.|As paradas controlam onde cada cor é atingida.",
      "Criar uma superfície suave sem carregar imagem externa.",
      "Verifique contraste em toda a área.|Evite padrões visuais que dificultem leitura.",
      caixas,
      ["linear-gradient","radial-gradient","gradiente"]
  ),
  assunto(
      "filtros",
      "Filtros",
      "Filter processa a apresentação final de um elemento, incluindo seu conteúdo. blur desfoca e grayscale reduz cor. Aplicar um filtro a um contêiner também pode afetar a leitura de seus filhos e criar contexto de empilhamento.",
      ".alvo {\n  filter: grayscale(1);\n  background: #a78bfa;\n}",
      "grayscale(1) remove a saturação visual.|O valor de fundo continua declarado como uma cor roxa.",
      "Aplicar um tratamento decorativo a uma ilustração.",
      "Não filtre texto essencial de modo ilegível.|Teste custo de renderização em áreas grandes.",
      caixas,
      ["filter","blur","grayscale"]
  ),
  assunto(
      "aspect-ratio",
      "Aspect-ratio",
      "Aspect-ratio fornece uma proporção preferencial para a caixa. Ela atua com dimensões automáticas; definir largura e altura rígidas pode impedir seu efeito. Não determina sozinha como uma imagem preenche a caixa.",
      ".alvo {\n  width: min(240px, 100%);\n  aspect-ratio: 16 / 9;\n  box-sizing: border-box;\n}",
      "A largura disponível orienta a altura preferida.|16/9 relaciona as duas dimensões.",
      "Reservar espaço consistente para mídia e cartões.",
      "Não imponha duas dimensões contraditórias.|Use object-fit quando houver uma imagem real.",
      caixas,
      ["aspect-ratio","proporção"]
  ),
  assunto(
      "propriedades-logicas",
      "Propriedades lógicas",
      "Propriedades lógicas acompanham os eixos inline e block do modo de escrita. Elas reduzem dependência de esquerda e direita físicas. Em escrita horizontal, inline geralmente acompanha o texto e block o empilhamento.",
      ".alvo {\n  padding-inline: 24px;\n  margin-block: 16px;\n  border-inline-start: 5px solid #7c3aed;\n}",
      "padding-inline afasta as laterais conforme a escrita.|border-inline-start destaca o início lógico, não uma esquerda universal.",
      "Adaptar componentes a idiomas e modos de escrita diferentes.",
      "Não misture medidas físicas e lógicas sem intenção.|Teste direção rtl quando aplicável.",
      caixas,
      ["padding-inline","margin-block","inset-inline","lógico"]
  ),
  assunto(
      "layout-moderno",
      "Recursos modernos de layout",
      "Recursos como subgrid e consultas de contêiner ajudam componentes a compartilhar alinhamento e reagir ao espaço. @supports permite uma melhoria progressiva quando o navegador reconhece uma declaração. Um fallback continua necessário para ambientes não cobertos.",
      ".palco {\n  display: grid;\n  gap: 8px;\n  grid-template-columns: 1fr 1fr;\n}\n@supports (grid-template-columns: subgrid) {\n  .alvo {\n    display: grid;\n    grid-column: 1 / -1;\n    grid-template-columns: subgrid;\n  }\n}",
      "@supports verifica o reconhecimento da declaração.|subgrid permite ao item compartilhar as trilhas do pai no eixo indicado.",
      "Alinhar partes internas de cartões a uma grade externa.",
      "Teste o comportamento, não só o reconhecimento da sintaxe.|Mantenha o layout base utilizável.",
      caixas,
      ["subgrid","@supports","layout moderno"]
  )
]});
modulos.push({id:"qualidade",titulo:"10 — Qualidade e boas práticas",assuntos:[
  assunto(
      "acessibilidade-visual",
      "Acessibilidade visual",
      "A apresentação precisa continuar utilizável com zoom, mudança de fonte e diferentes formas de percepção. Cor, tamanho e espaço devem reforçar informações presentes no conteúdo. Nenhum ajuste isolado garante acessibilidade completa.",
      ".alvo {\n  color: #172554;\n  background: #eff6ff;\n  line-height: 1.6;\n  padding: 16px;\n  overflow-wrap: anywhere;\n}",
      "O par escuro/claro favorece a leitura.|A quebra de palavras evita transbordamento de sequências longas.",
      "Criar avisos que tolerem texto maior e largura menor.",
      "Teste zoom e navegação por teclado.|Não comunique sucesso ou erro somente por cor.",
      caixas,
      ["acessibilidade","legibilidade"]
  ),
  assunto(
      "contraste",
      "Contraste",
      "Contraste compara a luminância das cores do conteúdo e de seu fundo. Para texto, o nível AA da WCAG exige em geral 4,5:1 e admite 3:1 para texto grande (18pt ou mais, ou 14pt em negrito). Transparências e imagens exigem avaliar o fundo efetivo.",
      ".alvo {\n  color: #172554;\n  background-color: #eff6ff;\n}",
      "A combinação usa texto escuro e fundo claro.|O valor deve ser medido com uma ferramenta, não estimado apenas pela aparência.",
      "Escolher pares de cor para leitura em temas e estados distintos.",
      "Meça todos os estados relevantes.|Não confunda preferência estética com conformidade.",
      caixas,
      ["contraste","wcag"]
  ),
  assunto(
      "estados-foco",
      "Estados de foco",
      "Indicadores de foco mostram qual controle receberá uma ação do teclado. Devem permanecer visíveis sobre o fundo e não ser ocultados por outros elementos. :focus-visible permite um tratamento compatível com a heurística do navegador.",
      ".alvo:focus-visible {\n  outline: 3px solid #075985;\n  outline-offset: 4px;\n}",
      "A borda externa destaca o botão focado.|O afastamento ajuda a distinguir indicador e contorno.",
      "Verificar que usuários de teclado encontram cada ação.",
      "Não remova foco sem substituto.|Teste se contêineres recortam o indicador.",
      botao,
      ["estados de foco","foco visível"]
  ),
  assunto(
      "movimento-reduzido",
      "Preferência de movimento reduzido",
      "prefers-reduced-motion consulta uma preferência do sistema ou navegador. Use-a para reduzir movimentos dispensáveis sem esconder informação. Desativar uma animação não deve deixar conteúdo preso em opacity zero.",
      "@keyframes entrada {\n  from {\n    opacity: 0;\n    transform: translateY(8px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n.alvo {\n  animation: entrada 800ms ease-out;\n}\n@media (prefers-reduced-motion: reduce) {\n  .alvo {\n    animation: none;\n  }\n}",
      "A regra base define a entrada.|A consulta remove o movimento e preserva o estado normal visível.",
      "Respeitar pessoas sensíveis a animações e deslocamentos.",
      "Teste a preferência nas ferramentas do navegador.|Não dependa de eventos de animação para revelar conteúdo.",
      caixas,
      ["prefers-reduced-motion","reduzir movimento"]
  ),
  assunto(
      "performance",
      "Performance CSS",
      "O custo de uma animação depende das propriedades, da área afetada e do navegador. Transform e opacity costumam evitar alterações de layout, mas não são garantia de custo zero. Medições são mais confiáveis que regras absolutas.",
      ".alvo {\n  transition: transform 180ms ease-out;\n}\n.alvo:hover {\n  transform: translateY(-2px);\n}",
      "A transição limita a propriedade observada.|Transform evita redefinir a altura dos itens vizinhos.",
      "Escolher um efeito pequeno e verificar sua fluidez.",
      "Meça em dispositivos representativos.|Não aplique will-change em tudo.",
      botao,
      ["performance","desempenho","will-change"]
  ),
  assunto(
      "duplicacoes",
      "Evitando estilos duplicados",
      "Duplicações aumentam a chance de correções divergentes. Extraia decisões compartilhadas quando representarem a mesma responsabilidade. Não una componentes independentes apenas porque hoje possuem valores iguais.",
      ".item {\n  border-radius: 8px;\n}\n.alvo {\n  border-left: 4px solid #7c3aed;\n}",
      "A base comum é declarada uma vez.|O destaque contém somente a diferença necessária.",
      "Corrigir o padrão de vários cartões em um único ponto.",
      "Compartilhe intenção, não coincidência.|Revise regras antigas antes de acrescentar outra.",
      caixas,
      ["duplicação","reutilização"]
  ),
  assunto(
      "organizacao-arquivos",
      "Organização de arquivos",
      "Folhas podem ser separadas em base, componentes e páginas conforme o tamanho do projeto. O navegador aplica a ordem efetiva dos recursos, não a hierarquia das pastas. Uma separação útil precisa facilitar a localização e reduzir efeitos cruzados.",
      "/* base */ .item {\n  border-radius: 8px;\n}\n/* componente */ .item.alvo {\n  border: 2px solid #7c3aed;\n}",
      "A primeira regra atende a todos os itens.|A segunda concentra a variação do componente.",
      "Distribuir responsabilidades sem criar uma folha por declaração.",
      "Confira os links após mover arquivos.|Não crie pastas vazias só para imitar uma arquitetura.",
      caixas,
      ["organização de arquivos","pastas css"]
  ),
  assunto(
      "manutencao",
      "Manutenção",
      "CSS sustentável permite alterar uma parte sem reescrever toda a folha. Limites de escopo, seletores simples e valores nomeados ajudam a localizar efeitos. Antes de remover uma regra, verifique quem a utiliza e em quais estados.",
      ".palco {\n  --borda-destaque: #7c3aed;\n}\n.alvo {\n  border: 2px solid var(--borda-destaque);\n}",
      "A decisão de cor fica nomeada.|O componente consome o valor sem repetir o literal.",
      "Atualizar um padrão visual com impacto previsível.",
      "Verifique estados e tamanhos de tela.|Não remova regras sem localizar seus consumidores.",
      caixas,
      ["manutenção","refatoração css"]
  ),
  assunto(
      "erros",
      "Identificação de erros",
      "Uma regra pode não aparecer por caminho incorreto, seletor sem correspondência, valor inválido ou precedência. O navegador costuma ignorar declarações inválidas. Investigue a causa antes de aumentar especificidade ou usar !important.",
      ".alvo {\n  color: #7c3aed;\n  padding: 12px;\n}",
      "No inspetor, confira se a regra aparece no elemento correto.|Declarações riscadas podem ter sido substituídas; avisos podem indicar valores inválidos.",
      "Diagnosticar uma alteração que parece não produzir resultado.",
      "Verifique primeiro o carregamento da folha.|Compare estilo declarado e estilo calculado.",
      caixas,
      ["erro","css não funciona","depurar"]
  ),
  assunto(
      "devtools",
      "Ferramentas de inspeção do navegador",
      "As ferramentas do navegador mostram regras aplicadas, valores calculados, Box Model e recursos carregados. Alterações feitas no inspetor normalmente são temporárias. O arquivo fonte precisa ser atualizado para preservar a correção.",
      ".alvo {\n  padding: 20px;\n  border: 3px solid #7c3aed;\n  margin: 12px;\n}",
      "O diagrama de caixa permite conferir cada camada.|A aba Computed mostra o valor final após cascata e cálculo.",
      "Comparar uma hipótese visual com os valores realmente aplicados.",
      "Salve a correção no editor.|Use o modo responsivo e teste também dispositivos reais.",
      caixas,
      ["devtools","inspecionar","computed","ferramentas"]
  ),
  assunto(
      "boas-praticas",
      "Boas práticas para projetos reais",
      "Uma folha útil combina correção, clareza e verificação em diferentes condições. Prefira fluxo normal, componentes com responsabilidade e melhorias progressivas. Estilos prontos não dispensam testes de foco, contraste, conteúdo e tamanho.",
      ".palco {\n  display: grid;\n  gap: 12px;\n  grid-template-columns: repeat(auto-fit, minmax(min(160px, 100%), 1fr));\n}\n.item {\n  min-width: 0;\n  overflow-wrap: anywhere;\n}",
      "A grade se ajusta ao espaço disponível.|Os itens podem encolher e quebrar sequências longas.",
      "Entregar um componente flexível e manter suas decisões compreensíveis.",
      "Teste conteúdo real e navegação por teclado.|Evite exceções acumuladas sem investigar a causa.",
      caixas,
      ["boas práticas","projetos reais"]
  )
]});

// Exemplos — Contexto - mantém seletores compatíveis e aproxima cada módulo de uma situação real.
const cartoes = '<section class="palco"><article class="item alvo" id="principal" data-estado="ativo">Perfil</article><article class="item">Projetos</article><article class="item">Contato</article></section>';
const aviso = '<section class="palco"><p class="item alvo" id="principal" data-estado="ativo">Seu projeto foi salvo.</p><p class="item">Você pode continuar editando.</p><p class="item">Última atualização: agora.</p></section>';
const contextos = {
  introducao: aviso, seletores: aviso, 'box-model': aviso, layout: cartoes,
  responsividade: cartoes, cascata: aviso, avancados: cartoes, qualidade: cartoes
};
const referencias = {
  introducao: ['conectar-css', 'sintaxe', 'classe'],
  seletores: ['classe', 'atributos', 'especificidade'],
  'box-model': ['box-model', 'margin-padding', 'box-sizing'],
  layout: ['display', 'flexbox', 'grid', 'flex-grid'],
  posicionamento: ['position', 'relative', 'absolute', 'stacking-context'],
  responsividade: ['viewport', 'mobile-first', 'media-queries', 'container-queries'],
  interacao: ['hover', 'focus', 'transicoes', 'movimento-reduzido'],
  cascata: ['cascata', 'especificidade', 'variaveis'],
  avancados: ['keyframes', 'animation', 'movimento-reduzido'],
  qualidade: ['contraste', 'estados-foco', 'devtools']
};
const demonstracoes = {
  'box-model': {
    exemploHTML: '<section class="palco"><div class="alvo"><span>Conteúdo: 140px</span></div><p>Fundo externo: margem · fundo amarelo: padding · roxo: borda.</p></section>',
    apoio: '.palco { background: #e5ddf5; } .alvo { background: #fef3c7; } .alvo span { display: block; background: #dbeafe; }',
    orientacao: 'Do centro para fora: conteúdo azul, padding amarelo, borda roxa e margem sobre o fundo externo. A largura com bordas é 180px; as margens não fazem parte desse total.'
  },
  padding: {
    exemploHTML: '<section class="palco"><article class="alvo"><strong>Projeto salvo</strong><p>Seu conteúdo fica afastado da borda.</p></article></section>',
    apoio: '.alvo { background: #fef3c7; } .alvo > * { margin: 0; background: #dbeafe; }',
    orientacao: 'A área amarela entre o conteúdo azul e a borda é o padding: 24px em cima e embaixo, 32px nas laterais. O fundo da própria caixa preenche essa área.'
  },
  margin: {
    exemploHTML: '<section class="palco"><article class="alvo">Cartão centralizado</article></section>',
    apoio: '.palco { background: #e5ddf5; } .alvo { background: #dbeafe; }',
    css: '.alvo {\n  width: 180px;\n  max-width: 100%;\n  margin: 24px auto;\n}',
    orientacao: 'A borda tracejada pertence ao pai. A área externa roxa fica entre ele e o cartão azul. As margens auto dividem o espaço horizontal disponível; não centralizam verticalmente.'
  },
  'margin-padding': {
    exemploHTML: '<section class="palco"><article class="alvo"><span>Conteúdo do cartão</span></article></section>',
    apoio: '.palco { background: #e5ddf5; } .alvo span { display: block; background: #dbeafe; }',
    orientacao: 'O amarelo acompanha o padding, dentro da borda. O roxo aparece na margem, fora dela. Ambos têm 24px neste exemplo, mas pertencem a regiões diferentes.'
  },
  'box-sizing': {
    exemploHTML: '<section class="palco"><article class="alvo">Cartão de 220px, incluindo padding e borda.</article></section>',
    apoio: '.alvo { background: #fef3c7; max-width: 100%; }',
    orientacao: 'Os 220px incluem 48px de padding e 12px de borda. Quando há espaço para essa largura, sobram 160px de conteúdo. O limite de apoio evita transbordamento em prévias estreitas.'
  },
  flexbox: {
    exemploHTML: '<section class="palco"><button class="item" type="button">Cancelar</button><button class="item alvo" type="button">Salvar</button></section>',
    css: '.palco {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  gap: 12px;\n  min-height: 160px;\n}',
    orientacao: 'Os dois botões são filhos diretos do contêiner tracejado. Com a direção row padrão, justify-content centraliza na horizontal e align-items na vertical. Os botões são apenas demonstrativos.'
  },
  grid: {
    exemploHTML: cartoes,
    css: '.palco {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: 12px;\n}',
    responsabilidadeCodigo: ['display: grid transforma os filhos diretos em itens da grade.', 'repeat(2, minmax(0, 1fr)) cria duas colunas iguais que podem encolher; gap separa linhas e colunas.'],
    orientacao: 'Perfil e Projetos ocupam a primeira linha. Contato inicia a segunda: são três cartões distribuídos em duas colunas. Compare esse controle de colunas com o eixo principal do Flexbox.'
  },
  absolute: {
    exemploHTML: '<article class="palco"><span class="item alvo">Novo</span><h3>Curso de CSS</h3><p>O selo fica no canto; o conteúdo permanece no fluxo.</p></article>',
    apoio: '.palco { padding-top: 56px; }',
    orientacao: 'O selo Novo usa o cartão relative como referência. O padding de apoio reserva espaço para o texto não ficar atrás do selo; absolute não reserva esse espaço automaticamente.'
  },
  fixed: {
    exemploHTML: '<section class="palco"><h3>Lista de avisos</h3><p>Role dentro desta janela.</p><p class="extenso">Os avisos continuam no fluxo normal.</p><button class="item alvo" type="button">Ajuda</button></section>',
    apoio: '.extenso { min-height: 420px; } .palco { padding-bottom: 60px; }',
    orientacao: 'Role o documento dentro da prévia. Ajuda permanece junto ao canto inferior da janela de demonstração, sem se fixar na página principal da biblioteca. O botão não possui ação.'
  },
  overflow: {
    exemploHTML: '<section class="palco"><div class="item alvo" tabindex="0" role="region" aria-label="Aviso com rolagem">Seu projeto contém várias atualizações e mensagens importantes para consultar.</div></section>',
    orientacao: 'Role dentro do aviso, usando gesto, mouse ou teclado depois de focá-lo. O conteúdo excedente continua acessível porque overflow é auto, e não hidden.'
  },
  'media-queries': {
    exemploHTML: cartoes,
    orientacao: 'Esta regra muda para três colunas a partir de 480px de largura da prévia. Neste módulo, o resultado ocupa a largura disponível abaixo do código para facilitar essa comparação. Redimensione a janela: o limite considera a prévia, não toda a tela.'
  },
  sticky: { orientacao: 'Role a área tracejada, não a página da biblioteca. O cabeçalho fica retido no topo dessa área enquanto houver espaço dentro de seu contêiner.' },
  hover: { orientacao: 'Passe o ponteiro sobre o botão para observar fundo e borda. Em dispositivos de toque, hover não é uma interação garantida; consulte também o assunto Focus.' },
  focus: { orientacao: 'Use Tab para entrar no botão dentro da prévia. O contorno indica o foco pelo teclado; clicar com o mouse pode não ativar :focus-visible.' },
  active: { orientacao: 'Mantenha o botão pressionado para observar o deslocamento. Ao soltar, o estado termina: active não significa seleção permanente.' }
};
for (const modulo of modulos) {
  for (const item of modulo.assuntos) {
    if (item.exemploHTML === caixas && contextos[modulo.id]) item.exemploHTML = contextos[modulo.id];
    const demonstracao = demonstracoes[item.id] || {};
    const { apoio = '', css: principal = item.codigoPrincipal, ...dados } = demonstracao;
    Object.assign(item, dados, {
      codigoPrincipal: principal,
      sintaxe: principal,
      estilosApoio: base + (['layout', 'responsividade'].includes(modulo.id) ? '.palco > .item { margin: 0; }\n' : '') + apoio,
      relacionados: referencias[modulo.id].filter(id => id !== item.id)
    });
    item.exemploCodigo = item.estilosApoio + '\n' + item.codigoPrincipal;
    if (!item.orientacao && /animation:/.test(principal)) item.orientacao = 'A animação começa ao abrir este assunto e termina conforme sua duração e número de ciclos. Para observar novamente, selecione outro assunto e retorne. Com movimento reduzido ativado no sistema, o movimento é desabilitado.';
  }
}

export const conteudos = { id: "css", nome: "CSS", niveis: [
 { id: "basico", nome: "Básico", assuntos: [], modulos: modulos.slice(0, 3) },
 { id: "intermediario", nome: "Intermediário", assuntos: [], modulos: modulos.slice(3, 7) },
 { id: "avancado", nome: "Avançado", assuntos: [], modulos: modulos.slice(7) }
] };
