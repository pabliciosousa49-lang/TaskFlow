# Arquitetura do TaskFlow

## Organização atual

A aplicação utiliza páginas estáticas, CSS e JavaScript modular. Não há backend, framework ou build obrigatório.

| Local | Responsabilidade |
|---|---|
| `index.html` | Estrutura da Home, TaskFlow, Biblioteca central, Agenda e painel do Pomodoro. |
| `pages/studio.html` | Recepção, gerenciamento e ambiente do Laboratório. |
| `pages/carreira.html` | Área de Carreira. |
| `pages/biblioteca/` | Documentação por linguagem. |
| `css/global/` | Base visual da aplicação. |
| `css/pages/` | Home, Studio e Carreira. |
| `css/components/` | Componentes como Pomodoro. |
| `css/biblioteca/` | Central e documentação da Biblioteca. |
| `js/core/app.js` | Integração da página principal, navegação de áreas e Agenda. |
| `js/core/navegacao.js` | Retorno entre páginas válidas do TaskFlow e destino alternativo. |
| `js/modules/studio/` | Componentes especializados do Laboratório. |
| `js/biblioteca/` | Apresentação e navegação da documentação e anotações. |
| `js/modules/pomodoro/` | Interface do painel e lógica do temporizador. |
| `js/services/` | Persistência e validação de projetos e anotações. |
| `data/biblioteca/` | Dados da documentação por linguagem. |
| `assets/` | Imagens e recursos estáticos. |
| `tests/` | Suítes de Agenda, Biblioteca, navegação, Pomodoro e Studio. |

## Laboratório

- `studio.js` coordena telas, projeto aberto, eventos, salvamento e estado de interface.
- `editor.js` configura CodeMirror e mantém estados por arquivo; `abas.js` e `explorador.js` recebem ações do coordenador.
- `autocompletar.js`, `sugestoes-inline.js` e `caminhos-editor.js` fornecem sugestões; `validacao.js` valida HTML; `formatacao.js` indenta a seleção.
- `ferramentas-editor.js` e `busca-codigo.js` implementam pesquisa, localização e atalhos.
- `projetos-studio.js` valida projetos, árvore, nomes e revisões, grava o catálogo e importa/exporta backups.
- `sessao.js` guarda abas, cursor, rolagem, painel e largura em sessão opcional.
- `previa.js`, `recursos-previa.js` e `resolvedor.js` montam o documento e resolvem referências entre arquivos virtuais.
- `navegacao-previa.js` transporta navegação e mensagens; `console-previa.js` apresenta texto e origens conhecidas.
- `roleta.js`, `tecnologias.js` e `painel-documentacao.js` integram materiais de apoio.
- `mentor.js`, `mascote.js`, `documento-html.js` e `referencia.js` oferecem apresentação, orientação e estrutura inicial.

O editor usa CodeMirror/Lezer por CDN com versões declaradas no import map de `pages/studio.html`. A aplicação não funciona integralmente offline.

## Fluxo de dados

Usuário → componente visual → coordenador → serviço → armazenamento → atualização de editor, abas e explorador.

Durante a digitação, o documento do editor contém o texto mais recente. O coordenador agenda autosave após 800 ms e encaminha uma cópia com esse conteúdo para a prévia. Trocas de arquivo e saídas verificam a gravação; falhas mantêm o texto no editor.

A prévia agrupa atualizações por 300 ms e executa em iframe sem origem compartilhada. CSP restringe rede e recursos; mensagens são verificadas por janela, origem e canal. A validação automatizada não substitui homologação dessas políticas em navegador real.

O histórico interno registra telas relevantes do Studio, sem registrar digitação ou modais. O retorno direto ao TaskFlow permanece separado.

## Persistência e recuperação

| Dados | Armazenamento |
|---|---|
| Projetos e árvore virtual | `localStorage: taskflow.studio.projetos.v1` |
| Anotações | `localStorage: taskflow.biblioteca.anotacoes.v1` |
| Compromissos | `localStorage: taskflow.agenda.compromissos.v1` |
| Pomodoro | `localStorage: taskflow.pomodoro.v1` |
| Interface do Studio | `sessionStorage: taskflow.studio.interface.v1` |
| Projeto ativo | `sessionStorage: taskflow.studio.projeto-ativo.v1` |

O catálogo do Studio é um array JSON único. A leitura valida todos os registros; dados inválidos não são reparados ou sobrescritos automaticamente. Projetos legados continuam usando o mecanismo existente de migração validada.

Backups individuais mantêm formato `taskflow.studio.backup`, versão 1. A restauração valida os dados, remapeia IDs e cria uma cópia. Não há cortes artificiais por quantidade ou bytes; memória e quota do navegador limitam a operação, que pode falhar sem substituir os registros anteriores.

Recuperação é somente exportação: o catálogo bruto é baixado como TXT para tratamento manual; o projeto em memória pode ser serializado com o arquivo pendente como backup individual. Nenhuma dessas ações grava no catálogo. Não existe sincronização ou mesclagem de versões.

## Execução, testes e publicação

Sirva a raiz por HTTP/HTTPS. As instruções estão no [README](../README.md). A publicação existente em `.github/workflows/deploy.yml` envia a raiz ao GitHub Pages em push na branch main ou acionamento manual; o workflow não foi alterado nesta estabilização.

Execute `node --experimental-vm-modules --test tests/*/*.test.mjs` com Node.js 24+. Os testes do Studio utilizam armazenamento e DOM simulados e parsers reais mantidos em `tests/studio/vendor/`, exclusivos dos testes.

A inicialização em navegador real e o candidato publicado precisam de validação manual. Antes de trocar origem ou limpar dados, exporte backups. Não publique dados pessoais ou credenciais em arquivos estáticos.
