# Biblioteca Técnica TaskFlow

Base independente para materiais de HTML, CSS e JavaScript, organizados nos níveis básico, intermediário e avançado. Esta fase contém somente arquitetura, sem conteúdo educacional ou interface visual.

## Estrutura

- pages/biblioteca/html.html
- pages/biblioteca/css.html
- pages/biblioteca/javascript.html
- css/biblioteca/biblioteca.css
- js/biblioteca/biblioteca.js
- data/biblioteca/html/conteudos.js
- data/biblioteca/css/conteudos.js
- data/biblioteca/javascript/conteudos.js
- docs/biblioteca/arquitetura.md

## Responsabilidades e conexões

As três páginas possuem um main vazio, identificado por ID e data-tecnologia. Todas referenciam os arquivos compartilhados por ../../css/biblioteca/biblioteca.css e ../../js/biblioteca/biblioteca.js. O script é carregado como ES Module, sem comportamento nesta fase. O CSS contém somente a reserva de responsabilidade e não importa estilos globais.

Cada módulo de dados exporta conteudos, com id e nome da tecnologia e três níveis. Cada nível possui id, nome, modulos e assuntos. As duas listas começam vazias. Um assunto poderá futuramente possuir id, titulo, explicacao, exemploCodigo e responsabilidadeCodigo; nenhum assunto foi criado agora.

Na Fase 2, o módulo compartilhado poderá importar os dados da tecnologia indicada pela página, usando caminhos como ../../data/biblioteca/html/conteudos.js, e apresentar a interface. Os dados não são importados ou renderizados nesta fase.

## Preservação

Nenhum acesso foi adicionado aos botões atuais da plataforma. A Biblioteca não carrega scripts do Laboratório ou da Agenda. Os caminhos são relativos e compatíveis com a publicação da raiz no GitHub Pages; o deploy não exige alteração.
