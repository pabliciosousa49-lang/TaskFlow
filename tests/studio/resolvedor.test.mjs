import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { resolverCaminhoVirtual, resolverReferenciaVirtual, resolverArquivoVirtual } from "../../js/modules/studio/resolvedor.js";

const casos = [
    ["arquivo.html", "index.html", "arquivo.html"],
    ["./dashboard.html", "pages/login.html", "pages/dashboard.html"],
    ["../index.html", "pages/login.html", "index.html"],
    ["../../index.html", "pages/cadastro/usuario.html", "index.html"],
    ["./pages/login.html", "index.html", "pages/login.html"],
    ["../css/style.css", "pages/login.html", "css/style.css"],
    ["/pages/login.html", "pages/cadastro/usuario.html", "pages/login.html"],
    ["../images/logo.png", "css/global.css", "images/logo.png"],
    ["./modules/app.js", "js/app.js", "js/modules/app.js"],
    ["./a/../b.html", "pages/login.html", "pages/b.html"],
    ["../Meu%20Arquivo.html", "pages/login.html", "Meu Arquivo.html"],
    ["/P%C3%A1gina.html", "index.html", "Página.html"],
    ["/CSS/Style.css?v=2#tema", "index.html", "CSS/Style.css"],
    ["#secao", "pages/login.html", "pages/login.html"],
    ["?filtro=1#secao", "pages/login.html", "pages/login.html"],
    ["..\\index.html", "pages/login.html", "index.html"]
];
for (const [referencia, origem, esperado] of casos) {
    test(`resolve ${referencia} em ${origem}`, () => assert.equal(resolverCaminhoVirtual(referencia, origem), esperado));
}

test("separa consulta e fragmento, inclusive caracteres codificados no nome", () => {
    assert.deepEqual(resolverReferenciaVirtual("/a%23b.html?v=1#titulo", "index.html"), {
        caminho: "a#b.html", consulta: "?v=1", fragmento: "#titulo"
    });
});

for (const referencia of ["../fora.js", "/../fora.js", "%2e%2e/fora.js", "/%2e%2e/fora.js", "https://site.test/a.js", "//site.test/a.js", "%2f%2fsite.test/a.js", "data:text/javascript,a", "%00.js", "%ZZ", "", "/", "./"]) {
    test(`rejeita ${JSON.stringify(referencia)}`, () => assert.throws(() => resolverCaminhoVirtual(referencia, "index.html")));
}

test("valida a origem e impede escape em diretórios aninhados", () => {
    for (const origem of ["../index.html", "/index.html", "https://site.test/a", "a//b.html", "a/./b.html"]) {
        assert.throws(() => resolverCaminhoVirtual("a.js", origem));
    }
    assert.throws(() => resolverCaminhoVirtual("../../../fora.js", "pages/cadastro/usuario.html"));
});

test("localiza somente arquivos do projeto e respeita maiúsculas", () => {
    const arquivo = { tipo: "arquivo", caminho: "CSS/Style.css", conteudo: "body {}" };
    const arquivos = [arquivo, { tipo: "pasta", caminho: "pages" }];
    assert.equal(resolverArquivoVirtual(arquivos, "/CSS/Style.css?v=1", "pages/login.html"), arquivo);
    assert.throws(() => resolverArquivoVirtual(arquivos, "/css/style.css", "index.html"), /Arquivo não encontrado/);
    assert.throws(() => resolverArquivoVirtual(arquivos, "/pages", "index.html"), /Arquivo não encontrado/);
});

test("prévia mantém o HTML selecionado ao editar CSS e não mistura projetos", () => {
    const fonte = readFileSync(new URL("../../js/modules/studio/studio.js", import.meta.url), "utf8");
    const inicio = fonte.indexOf("function documentoPrincipal()");
    const fim = fonte.indexOf("function atualizarApresentacaoArquivo", inicio);
    const contexto = vm.createContext({
        projetoAtivo: { id: "projeto-a", arquivos: [
            { id: "raiz", tipo: "arquivo", caminho: "index.html", nome: "index.html", conteudo: "raiz" },
            { id: "login", tipo: "arquivo", caminho: "pages/login.html", nome: "login.html", conteudo: "login" },
            { id: "css", tipo: "arquivo", caminho: "css/style.css", nome: "style.css", conteudo: "body {}" }
        ] },
        documentoPreviaSelecionado: { projetoId: "projeto-a", arquivoId: "login" },
        arquivoEditorAbertoId: "css",
        editorStudio: { state: { doc: { toString: () => "body {color: red}" } } },
        document: { querySelector: () => ({ textContent: "" }) },
        previaStudio: { agendar: (...args) => { contexto.argumentos = args; } }
    });
    vm.runInContext(fonte.slice(inicio, fim), contexto);
    contexto.atualizarPrevia();
    assert.equal(contexto.argumentos[0], "login");
    assert.equal(contexto.argumentos[2], "pages/login.html");
    assert.equal(contexto.argumentos[1][2].conteudo, "body {color: red}");
    contexto.documentoPreviaSelecionado.projetoId = "outro-projeto";
    assert.equal(contexto.documentoPrincipal().caminho, "index.html");
    contexto.documentoPreviaSelecionado.projetoId = "projeto-a";
    contexto.projetoAtivo.arquivos.splice(1, 1);
    assert.equal(contexto.documentoPrincipal().caminho, "index.html");
});
