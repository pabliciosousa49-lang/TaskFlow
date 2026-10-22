# TaskFlow

Plataforma educacional para reunir estudo, prática e organização em um só lugar. O objetivo do MVP é ajudar estudantes a aprender desenvolvimento web, experimentar código e acompanhar sua rotina, com identidade visual pixel/voxel.

## Funcionalidades

- Home com guia de utilização e acessos às áreas.
- Biblioteca Técnica com documentação, pesquisa por tópicos e anotações locais.
- Laboratório TaskFlow Studio: projetos HTML/CSS/JavaScript, arquivos e pastas virtuais, abas, sugestões, busca, prévia isolada e console.
- Agenda com compromissos, filtros, calendário e Próximos Eventos.
- Relógio e Pomodoro com tempos personalizados, alertas, estatísticas e visualização minimizada.
- Área de Carreira com conteúdos de preparação profissional.

Gestor de IA está indisponível; Comunidade é um acesso visual sem integração funcional. A plataforma não oferece autenticação nem sincronização em nuvem.

## Tecnologias

HTML5, CSS3 e JavaScript, sem framework ou build obrigatório. O Studio utiliza CodeMirror 6 e parsers Lezer via import map com versões fixadas em CDN. Ícones utilizam Devicon e Font Awesome. É necessário acesso à internet para carregar recursos externos.

## Executar localmente

Sirva a raiz do repositório por HTTP; abrir o HTML diretamente por `file://` não é o fluxo suportado para módulos e documentação.

Use um servidor estático já disponível, como o Live Server do VS Code. Se Python estiver instalado, execute na raiz:

```powershell
py -m http.server 8000 --bind 127.0.0.1
```

Abra [http://127.0.0.1:8000](http://127.0.0.1:8000). Não é necessário instalar pacotes do projeto. O Python ou a extensão são apenas opções de servidor local, não dependências da aplicação.

## Versão publicada

O repositório configura GitHub Pages por GitHub Actions, publicando a raiz a partir da branch `main`.

Endereço: [TaskFlow no GitHub Pages](https://pabliciosousa49-lang.github.io/TaskFlow-DevClub/). A consulta HTTP desta rodada confirmou resposta 200 da Home, Studio, Carreira, documentação HTML/CSS e recursos principais, além das 20 dependências do import map. Isso comprova disponibilidade HTTP, não execução funcional no navegador. Confira a configuração em **Settings → Pages** e as publicações em **Actions**.

As alterações locais desta rodada ainda precisam passar por commit e publicação pelo responsável. Nenhum push ou deploy foi executado pelo Codex.

## Uso básico do Laboratório

1. Acesse TaskFlow → Laboratório e crie um projeto.
2. Crie `index.html`, as pastas `css` e `js`, e os arquivos `style.css` e `app.js` dentro delas.
3. Conecte os arquivos no HTML com `./css/style.css` e `./js/app.js`.
4. Edite e confira a prévia. Ctrl+P localiza arquivos; Ctrl+F pesquisa; Ctrl+S salva sem sair.
5. O salvamento automático ocorre após uma breve pausa na digitação. Confira o indicador **Salvo**.
6. **Salvar e voltar** retorna a Meus projetos. **Voltar** percorre as telas internas; **Voltar ao TaskFlow** sai diretamente.
7. Exporte um backup JSON em Meus projetos. Restaurar cria outra identidade e mantém o projeto original.

## Dados, backup e recuperação

Os dados ficam no navegador e na origem atual; não são enviados para um servidor. Limpar dados do site, trocar navegador, dispositivo, domínio ou protocolo não transfere os projetos. Faça backups antes dessas mudanças.

O backup individual mantém o formato `taskflow.studio.backup`, versão 1. Não há o antigo corte artificial de 1.000 itens ou 2 MiB: um backup exportado válido pode ser lido pelo mesmo importador. Restaurar exige espaço para uma cópia adicional no navegador. A quota real varia e arquivos grandes podem consumir memória ou demorar; prefira projetos pequenos no MVP.

Se ocorrer falha de gravação, conflito ou catálogo inválido, os controles de recuperação permitem:
- **Baixar catálogo bruto:** copia exatamente o registro em um arquivo TXT, sem validar ou reparar. Esse arquivo exige recuperação manual e não entra no restaurador de backups individuais.
- **Baixar projeto com alterações pendentes:** produz um backup individual com o código aberto em memória, sem sobrescrever a versão salva. Pode ser restaurado como cópia quando houver armazenamento disponível.

Não recarregue nem feche a página antes de salvar essa recuperação. Se a leitura do armazenamento estiver bloqueada, o catálogo bruto não poderá ser lido; o projeto já aberto ainda pode ser exportado da memória.

## Limitações conhecidas

- Arquivos do Studio são virtuais e textuais; não há importação de imagens binárias, ZIP, terminal, backend ou instalação de pacotes.
- A prévia restringe rede, HTML e recursos por segurança. Use eventos JavaScript com `addEventListener`; atributos como `onclick` são removidos.
- Atualizar a prévia reinicia o estado JavaScript. Scripts podem continuar ativos quando a área é ocultada.
- Renomear arquivos não atualiza referências escritas no código; há aviso antes da operação.
- Formatar seleção ajusta indentação. Diagnósticos integrados se concentram em HTML; busca não oferece substituição na interface.
- Conflitos entre abas são rejeitados na gravação; não há mesclagem automática ou histórico de versões.
- Alertas do sistema e áudio dependem de suporte, permissões e interação do usuário.
- Homologação completa em navegador real, mobile e publicação permanece pendente; testes simulados não a substituem.

## Estrutura

```text
index.html              Home, TaskFlow, Biblioteca, Agenda e Pomodoro
pages/                  Studio, Carreira e documentação por linguagem
css/                    Estilos globais, componentes e páginas
js/core/                Inicialização e navegação
js/modules/             Studio e Pomodoro
js/biblioteca/          Central, documentação e anotações
js/services/            Projetos do Studio e anotações
data/biblioteca/        Conteúdos por linguagem
assets/                 Imagens e recursos visuais
tests/                  Testes por responsabilidade
docs/                   Arquitetura e documentação técnica
.github/workflows/      Publicação no GitHub Pages
```

Consulte [a arquitetura](docs/arquitetura.md) para responsabilidades e fluxo de dados.

## Testes

Com Node.js 24 ou superior, sem instalação de dependências:

```powershell
node --experimental-vm-modules --test tests/*/*.test.mjs
```

A suíte usa armazenamento em memória, DOM simulado e parsers locais de teste. Não acessa projetos reais. Detalhes em [tests/studio/README.md](tests/studio/README.md).

## Aceitação manual antes da publicação

1. Abra o site servido por HTTP em uma sessão de teste; navegue por Home, Biblioteca, documentação HTML/CSS e Carreira. Verifique console e recursos.
2. No Studio, crie os três arquivos do exemplo acima. Use CSS visível e um botão com evento em `app.js`; confirme estilo e clique na prévia.
3. Alterne arquivos, salve, saia, retorne e recarregue; confira o conteúdo dos três.
4. Baixe o JSON, restaure e execute a cópia. Confira que o original continua intacto.
5. Em um perfil descartável, teste duas abas alterando o mesmo projeto; baixe a recuperação e confira que contém o texto pendente.
6. Em 375 px e com zoom, verifique menu, painéis do Studio, Agenda e Pomodoro. Confira foco e navegação por teclado.
7. Após a publicação pelo responsável, repita o fluxo essencial na URL publicada e confira erros no console.

Esta rodada não concluiu esses passos no navegador: o navegador disponível não alcançou o servidor local. A consulta HTTP externa confirmou o site público, que ainda não contém as correções locais; execução, persistência real, downloads e mobile continuam exigindo homologação manual.
