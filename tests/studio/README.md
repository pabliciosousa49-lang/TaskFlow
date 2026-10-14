# Testes do Laboratório

Na raiz do repositório, com Node.js 24 ou superior:

```powershell
node --experimental-vm-modules --test tests/studio/previa.test.mjs tests/studio/resolvedor.test.mjs tests/studio/caminhos-editor.test.mjs
```

Não é necessário instalar pacotes, baixar arquivos ou definir `TASKFLOW_CDN_CACHE`.
Sem a opção `--experimental-vm-modules`, a suíte informa um erro em vez de ignorar testes.

`vendor/lezer-cache.json` contém cópias das distribuições ESM dos parsers já utilizados pelo editor:
`@lezer/javascript` 1.5.6, `@lezer/css` 1.3.9, `@lezer/common` 1.5.3,
`@lezer/lr` 1.4.11, `@lezer/highlight` 1.2.5 e `@lezer/html` 1.3.13. As URLs de origem são as chaves do JSON.
As licenças MIT estão nos arquivos `vendor/*.LICENSE`.
O carregador de teste usa `node:process` em lugar do polyfill de navegador do CDN.
As cópias são exclusivas dos testes; a aplicação continua usando seu import map existente.

Os testes usam os parsers reais e um DOM simulado. Não comprovam a aplicação de CSP,
sandbox ou a execução da interface em um navegador real.
