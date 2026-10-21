import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import * as servico from '../../js/services/projetos-studio.js';
import * as sessao from '../../js/modules/studio/sessao.js';
import { criarAbas } from '../../js/modules/studio/abas.js';

class Elemento {
  constructor() { this.children=[];this.attrs={};this.events={};this.dataset={painel:'editor'};this.hidden=false;this.value='58';this.checked=true;this.textContent='';this.classList={add(){},remove(){}};this.style={setProperty(){}}; }
  append(...n){this.children.push(...n)} replaceChildren(...n){this.children=n}
  setAttribute(k,v){this.attrs[k]=v} getAttribute(k){return this.attrs[k]??null}
  addEventListener(k,fn){(this.events[k]??=[]).push(fn)} focus(){} setCustomValidity(){} reportValidity(){return true}
}
function estado(codigo='',cursor=0,extensions=[]) {
  const linhas=codigo.split('\n');
  return { codigo, extensions, selection:{main:{head:cursor,anchor:cursor,from:cursor,to:cursor}}, doc:{toString:()=>codigo,length:codigo.length,lines:linhas.length,
    line(n){const from=linhas.slice(0,n-1).reduce((a,b)=>a+b.length+1,0);return{number:n,from,to:from+linhas[n-1].length}},
    lineAt(pos){const n=codigo.slice(0,pos).split('\n').length;return this.line(n)} } };
}
function ambiente() {
  const memoria=new Map(), temporizadores=new Map();let proximoTimer=0;
  globalThis.localStorage={getItem:k=>memoria.get(k)??null,setItem:(k,v)=>memoria.set(k,v)};
  const valoresSessao=new Map();globalThis.sessionStorage={getItem:k=>valoresSessao.get(k)??null,setItem:(k,v)=>valoresSessao.set(k,v),removeItem:k=>valoresSessao.delete(k)};
  const ids=new Map(); const elemento=id=>{if(!ids.has(id))ids.set(id,new Elemento());return ids.get(id)};
  const documento={querySelector:elemento,createElement:()=>new Elemento(),body:new Elemento(),events:{},addEventListener(k,fn){this.events[k]=fn},hidden:false};
  globalThis.document=documento;
  const view={state:estado(),scrollDOM:{scrollTop:0,scrollLeft:0,addEventListener(){}},setState(s){this.state=s},requestMeasure(p){p?.write()},focus(){},
    dispatch(t){let codigo=this.state.doc.toString();if(t.changes)for(const c of (Array.isArray(t.changes)?t.changes:[t.changes]).slice().reverse())codigo=codigo.slice(0,c.from)+c.insert+codigo.slice(c.to);const cursor=t.selection?.anchor??this.state.selection.main.head;this.state=estado(codigo,cursor,this.state.extensions);for(const e of this.state.extensions)if(e?.callback)e.callback({view:this,state:this.state,docChanged:Boolean(t.changes),selectionSet:Boolean(t.selection)});}
  };
  const vazio=()=>[];
  const ctx=vm.createContext({document:documento,window:{events:{},addEventListener(k,fn){this.events[k]=fn},location:{assign(){}}},sessionStorage:globalThis.sessionStorage,
    setTimeout:fn=>{const id=++proximoTimer;temporizadores.set(id,fn);return id},clearTimeout:id=>temporizadores.delete(id),console,
    EditorView:{theme:vazio,updateListener:{of:callback=>({callback})},contentAttributes:{of:vazio}},EditorState:{create:c=>estado(c.doc,c.selection.anchor,c.extensions),readOnly:{of:vazio}},
    realceBusca:[],HighlightStyle:{define:vazio},tags:new Proxy({},{get:()=>''}),keymap:{of:vazio},historyKeymap:[],defaultKeymap:[],indentWithTab:{},
    html:vazio,css:vazio,javascript:vazio,criarSugestoesInline:vazio,criarAutocompletar:vazio,criarFormatacao:vazio,criarValidacaoHTML:vazio,syntaxHighlighting:vazio,lineNumbers:vazio,highlightActiveLine:vazio,highlightActiveLineGutter:vazio,drawSelection:vazio,history:vazio,indentOnInput:vazio,indentUnit:{of:vazio},isolateHistory:{of:valor=>valor}
  });
  let editor=readFileSync(new URL('../../js/modules/studio/editor.js',import.meta.url),'utf8').replace(/^import .*;\r?$/gm,'').replace(/^export \{.*;\r?$/gm,'').replace(/export function/g,'function');
  vm.runInContext(editor+';globalThis.editorAPI={limparDocumentosEditor,abrirDocumentoEditor,descartarDocumentoEditor,capturarContextoEditor,observarEditor,linguagemArquivo,carregarDocumentoHTML,alterarComHistorico};',ctx);
  const comp={...ctx.editorAPI,atualizarContextoCaminhos(){},criarEditorHTML:()=>view,criarAbas,criarPreviaHTML:()=>({agendar(){},definirAutomatica(){},atualizar(){}}),criarExplorador:()=>({atualizar(){},focarSelecionado(){}})};
  const fonte=readFileSync(new URL('../../js/modules/studio/studio.js',import.meta.url),'utf8').replace(/iniciarStudio\(\);\s*$/,'');
  vm.runInContext(fonte+';globalThis.studioAPI={configurar(servico,sessao,comp){servicoProjetos=servico;sessaoStudio=sessao;carregarComponentes=async()=>comp},abrirProjeto,selecionarArquivo,fecharArquivo,mostrarGerenciamento,salvarProjetoAtual,registrarInterface,abas:()=>abasStudio.ids(),projeto:()=>projetoAtivo,atualizarPrevia};',ctx);
  ctx.studioAPI.configurar(servico,sessao,comp);
  return{api:ctx.studioAPI,view,elemento,ctx,temporizadores};
}
function projetoTeste() {
  let p=servico.criarProjeto('Interface');let r=servico.criarArquivo(p.id,'index.html',null,p.atualizadoEm);p=r.projeto;const html=r.item;
  r=servico.criarArquivo(p.id,'app.js',null,p.atualizadoEm);p=r.projeto;
  p=servico.atualizarConteudoArquivo(p.id,r.item.id,'const a = 1;\nconsole.log(a);',p.atualizadoEm);
  return{p,html,js:p.arquivos.find(a=>a.nome==='app.js')};
}
test('integração simulada: recarregar restaura abas, arquivo, cursor, rolagem, painel e proporção',async()=>{
  const a=ambiente();const{p,html,js}=projetoTeste();
  sessao.gravarSessao(p.id,{abas:[html.id,'excluido',js.id],ativo:js.id,documentos:[{id:js.id,cursor:15,top:80,left:10}],painel:'previa',automatica:false,largura:70});
  await a.api.abrirProjeto(p.id);
  assert.equal(a.elemento('#studio-nome-arquivo').textContent,'app.js');
  assert.deepEqual([...a.api.abas()],[html.id,js.id]);
  assert.equal(a.view.state.selection.main.head,15);assert.equal(a.view.scrollDOM.scrollTop,80);assert.equal(a.view.scrollDOM.scrollLeft,10);
  assert.equal(a.elemento('#studio-paineis').dataset.painel,'previa');assert.equal(a.elemento('#studio-previa-automatica').checked,false);assert.equal(a.elemento('#studio-largura-editor').value,'70');
  const salvo=sessao.lerSessao(p.id);assert.equal(salvo.ativo,js.id);assert(!salvo.abas.includes('excluido'));
});
test('integração simulada: trocar arquivo grava pendências e falha de gravação impede saída',async()=>{
  const a=ambiente();const{p,html,js}=projetoTeste();await a.api.abrirProjeto(p.id);
  a.view.dispatch({changes:{from:0,to:a.view.state.doc.length,insert:'<p>novo</p>'}});
  assert.equal(a.api.selecionarArquivo(js),true);
  assert.equal(servico.buscarProjeto(p.id).arquivos.find(f=>f.id===html.id).conteudo,'<p>novo</p>');
  a.view.dispatch({changes:{from:0,to:a.view.state.doc.length,insert:'console.log(2);'}});
  const gravar=localStorage.setItem;localStorage.setItem=()=>{throw new Error('quota')};
  assert.equal(a.api.salvarProjetoAtual(),false);a.api.mostrarGerenciamento();
  assert(a.api.projeto());assert.equal(a.elemento('#studio-salvamento').textContent,'Erro ao salvar');assert.equal(a.view.state.doc.toString(),'console.log(2);');
  localStorage.setItem=gravar;assert.equal(a.api.salvarProjetoAtual(),true);a.api.mostrarGerenciamento();assert.equal(a.api.projeto(),null);
});
test('integração simulada: fechar todas as abas é restaurado sem criar documentos',async()=>{
  const a=ambiente();const{p}=projetoTeste();await a.api.abrirProjeto(p.id);
  for(const id of [...a.api.abas()])a.api.fecharArquivo(id);
  assert.equal(a.api.abas().length,0);await a.api.abrirProjeto(p.id);
  assert.equal(a.api.abas().length,0);assert.equal(servico.buscarProjeto(p.id).arquivos.length,2);
});

test('Voltar salva pendências antes do histórico e bloqueia saída quando a gravação falha',async()=>{
  const a=ambiente();let retornos=0;a.ctx.window.taskflowNavegacao={voltar(){retornos++}};
  const {p,html}=projetoTeste();await a.api.abrirProjeto(p.id);
  const voltar=()=>a.elemento('#studio-voltar').events.click[0]();
  a.view.dispatch({changes:{from:0,to:a.view.state.doc.length,insert:'<p>preservado</p>'}});
  const gravar=localStorage.setItem;localStorage.setItem=()=>{throw new Error('quota')};
  voltar();assert.equal(retornos,0);assert.equal(a.elemento('#studio-salvamento').textContent,'Erro ao salvar');
  localStorage.setItem=gravar;voltar();assert.equal(retornos,1);
  assert.equal(servico.buscarProjeto(p.id).arquivos.find(f=>f.id===html.id).conteudo,'<p>preservado</p>');
});

test('Meus projetos identifica o último aberto, preserva conteúdo ao renomear e confirma exclusão',async()=>{
  const a=ambiente(); const {p,html}=projetoTeste();
  await a.api.abrirProjeto(p.id); a.api.mostrarGerenciamento();
  const lista=a.elemento('#studio-lista-projetos'), card=lista.children.find(c=>c.dataset.aberto==='true');
  assert(card); assert.equal(card.children[0].textContent,'Interface');
  assert.equal(card.children.at(-1).textContent,'Último projeto aberto');
  assert(card.children[1].textContent.startsWith('Atualizado em '));
  assert.deepEqual(card.children[2].children.map(b=>b.dataset.acao),['continuar','exportar','renomear','excluir']);
  const acao=async nome=>lista.events.click[0]({target:{closest:()=>({dataset:{acao:nome,id:p.id}})}});
  const antes=servico.buscarProjeto(p.id).arquivos;
  a.ctx.window.prompt=()=> 'Renomeado'; await acao('renomear');
  assert.equal(servico.buscarProjeto(p.id).titulo,'Renomeado');
  assert.deepEqual(servico.buscarProjeto(p.id).arquivos,antes);
  a.ctx.window.confirm=()=>false; await acao('excluir'); assert(servico.buscarProjeto(p.id));
  await acao('continuar'); assert.equal(a.api.projeto().id,p.id);
  assert.equal(a.view.state.doc.toString(),antes.find(f=>f.id===html.id).conteudo);
  a.api.mostrarGerenciamento(); a.ctx.window.confirm=()=>true; await acao('excluir');
  assert.equal(servico.buscarProjeto(p.id),null);
});
