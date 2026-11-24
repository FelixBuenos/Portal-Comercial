import {useEffect,useState,type FormEvent} from 'react';
import {Modal} from '../../components/Modal';
import {ApiError,type Api} from '../../shared/api';
import type {ArquivoTxt,ArquivoTxtInput,Erp} from '../../shared/types';

const limite=512*1024;
const erps=['Alpha7','Trier'] as const;
const vazio:ArquivoTxtInput={mes:'',erp:'Alpha7',descricao:''};
function rotulo(mes:string){return mes.split('-').reverse().join('/');}

export function ArquivosPanel({api,admin,onAccessChanged}:{api:Api;admin:boolean;onAccessChanged:()=>void}){
 const [dados,setDados]=useState<ArquivoTxt[]>([]),[mes,setMes]=useState(''),[erp,setErp]=useState<Erp|''>('');
 const [rev,setRev]=useState(0),[loading,setLoading]=useState(true),[erro,setErro]=useState(''),[erroAcao,setErroAcao]=useState('');
 const [arquivoSelecionado,setArquivoSelecionado]=useState('');
 const [form,setForm]=useState<ArquivoTxtInput|null>(null),[id,setId]=useState<string>(),[remover,setRemover]=useState<ArquivoTxt|null>(null);
 const [fonte,setFonte]=useState('arquivo'),[url,setUrl]=useState(''),[file,setFile]=useState<File|null>(null),[busy,setBusy]=useState(false);
 function mensagem(error:unknown){
  if(error instanceof ApiError&&[401,403].includes(error.status))onAccessChanged();
  return error instanceof Error?error.message:'Não foi possível concluir a operação.';
 }
 useEffect(()=>{
  let ativa=true;
  setLoading(true);setErro('');
  async function listar(){
   const lista:ArquivoTxt[]=[];
   for(let offset=0;ativa;offset+=100){
    const resposta=await api.arquivosTxt(offset);
    if(!ativa)return;
    lista.push(...resposta.dados);
    if(!resposta.mais)break;
   }
   if(!ativa)return;
   setDados(lista);setMes(anterior=>lista.some(item=>item.mes===anterior)?anterior:(lista[0]?.mes??''));
  }
  void listar().catch(error=>{if(ativa){setDados([]);setErro(mensagem(error));}}).finally(()=>{if(ativa)setLoading(false);});
  return ()=>{ativa=false;};
 },[api,rev]);
 const meses=[...new Set(dados.map(item=>item.mes))];
 const sistemas=erps.filter(s=>dados.some(item=>item.mes===mes&&item.erp===s));
 const sistema=erp&&sistemas.includes(erp)?erp:'';
 const itens=dados.filter(item=>item.mes===mes&&item.erp===sistema);
 const selecionado=itens.find(item=>item.id===arquivoSelecionado);
 function abrir(item?:ArquivoTxt){
  setErroAcao('');setId(item?.id);setFonte(item?'manter':'arquivo');setFile(null);setUrl(item?.url??'');
  setForm(item?{mes:item.mes,erp:item.erp,descricao:item.descricao}:{...vazio,mes,erp:sistema||'Alpha7'});
 }
 async function acao(fn:()=>Promise<void>){
  setBusy(true);setErroAcao('');
  try{await fn();}catch(error){setErroAcao(mensagem(error));}finally{setBusy(false);}
 }
 function salvar(e:FormEvent){
  e.preventDefault();
  if(!form||busy)return;
  void acao(async()=>{
   const data={...form};
   if(fonte==='arquivo'){
    if(!file||!/[.]txt$/i.test(file.name)||!file.size||file.size>limite)throw new Error('Selecione um arquivo TXT de até 512 KiB.');
    const bytes=new Uint8Array(await file.arrayBuffer());
    let binario='';
    for(let i=0;i<bytes.length;i+=8192)binario+=String.fromCharCode(...bytes.subarray(i,i+8192));
    data.nome=file.name;data.base64=btoa(binario);
   }else if(fonte==='link'){data.url=url.trim();}
   await api.salvarTxt(data,id);
   setForm(null);setMes(data.mes);setErp(data.erp);setRev(n=>n+1);
  });
 }
 async function baixar(item:ArquivoTxt){
  const arquivo=await api.baixarTxt(item.id);
  const link=document.createElement('a');
  const blobUrl=URL.createObjectURL(arquivo);
  link.href=blobUrl;link.download=item.nome??'arquivo.txt';link.click();
  setTimeout(()=>URL.revokeObjectURL(blobUrl),1000);
 }
 return <>
  <div className="txt-header">
   <h1>Arquivos de Integração (TXT)</h1>
   <div className="txt-filtros">
    <label>Mês: <select value={mes} disabled={loading||!meses.length} onChange={e=>{setMes(e.target.value);setErp('');setArquivoSelecionado('');}}>{!meses.length&&<option value="">Sem meses cadastrados</option>}{meses.map(m=><option value={m} key={m}>{rotulo(m)}</option>)}</select></label>
    <label>Sistema: <select value={sistema} disabled={loading||!sistemas.length} onChange={e=>{setErp(e.target.value as Erp|'');setArquivoSelecionado('');}}><option value="">Selecione...</option>{sistemas.map(s=><option key={s}>{s}</option>)}</select></label>
    <label>Arquivo: <select value={selecionado?.id??''} disabled={loading||!sistema||!itens.length} onChange={e=>setArquivoSelecionado(e.target.value)}><option value="">Selecione o arquivo...</option>{itens.map(item=><option value={item.id} key={item.id}>{item.descricao}</option>)}</select></label>
    {selecionado?.url?<a className="txt-download" href={selecionado.url} target="_blank" rel="noopener noreferrer">Abrir link externo</a>:<button className="txt-download" disabled={!selecionado||busy} onClick={()=>{if(selecionado)void acao(()=>baixar(selecionado));}}>Baixar TXT</button>}
   </div>
  </div>
  <div className="txt-content">
   {erro&&<p className="message error" role="alert">{erro}</p>}
   {!form&&!remover&&erroAcao&&<p className="message error" role="alert">{erroAcao}</p>}
   {loading&&<p role="status">Carregando arquivos…</p>}
   {!loading&&!erro&&!dados.length&&<p>Nenhum arquivo cadastrado.</p>}
   <section className="txt-instrucoes">
    <div className="txt-icone" aria-hidden="true">⚙️</div>
    <h2>Como utilizar os arquivos?</h2>
    <ol><li>Selecione o <strong>Mês</strong> desejado.</li><li>Escolha o seu <strong>Sistema</strong> (Alpha7 ou Trier).</li><li>Selecione o <strong>Arquivo</strong> e clique em <strong>Baixar TXT</strong>.</li><li>Importe no seu ERP para atualizar os preços da campanha.</li></ol>
    <p className="txt-aviso"><strong>Aviso:</strong> Certifique-se de baixar o arquivo correto para o seu sistema para evitar erros de leitura na importação.</p>
   </section>
   <div className="txt-acoes">
    <button className="secondary" disabled={loading||busy} onClick={()=>setRev(n=>n+1)}>Atualizar</button>
    {admin&&<><button className="secondary" disabled={loading||busy||!!erro} onClick={()=>abrir()}>Cadastrar arquivo</button>
     {selecionado&&<><button className="secondary" disabled={busy} onClick={()=>abrir(selecionado)}>Editar arquivo</button><button className="secondary" disabled={busy} onClick={()=>{setErroAcao('');setRemover(selecionado);}}>Remover arquivo</button></>}
    </>}
   </div>
  </div>
  {admin&&form&&<Modal title={id?'Editar arquivo':'Cadastrar arquivo'} onClose={()=>setForm(null)} busy={busy}>
   <form className="form-grid" onSubmit={salvar}>
    <label>Mês<input type="month" required value={form.mes} disabled={busy} onChange={e=>setForm({...form,mes:e.target.value})}/></label>
    <label>Sistema ERP<select value={form.erp} disabled={busy} onChange={e=>setForm({...form,erp:e.target.value as Erp})}>{erps.map(s=><option key={s}>{s}</option>)}</select></label>
    <label>Descrição<input required maxLength={160} value={form.descricao} disabled={busy} onChange={e=>setForm({...form,descricao:e.target.value})}/></label>
    <label>Origem<select value={fonte} disabled={busy} onChange={e=>setFonte(e.target.value)}>{id&&<option value="manter">Manter origem atual</option>}<option value="arquivo">Enviar arquivo TXT</option><option value="link">Cadastrar link HTTPS</option></select></label>
    {fonte==='arquivo'&&<label>Arquivo TXT (até 512 KiB)<input type="file" accept=".txt" required disabled={busy} onChange={e=>setFile(e.target.files?.[0]??null)}/></label>}
    {fonte==='link'&&<label>Endereço HTTPS<input type="url" required maxLength={4096} value={url} disabled={busy} onChange={e=>setUrl(e.target.value)}/></label>}
    {erroAcao&&<p role="alert">{erroAcao}</p>}
    <button className="primary" disabled={busy}>Salvar arquivo</button>
   </form>
  </Modal>}
  {admin&&remover&&<Modal title="Remover arquivo" onClose={()=>setRemover(null)} busy={busy}>
   <p>Remover “{remover.descricao}” do catálogo?</p>
   {erroAcao&&<p role="alert">{erroAcao}</p>}
   <button className="primary" disabled={busy} onClick={()=>void acao(async()=>{await api.removerTxt(remover.id);setRemover(null);setRev(n=>n+1);})}>Confirmar remoção</button>
  </Modal>}
 </>;
}
