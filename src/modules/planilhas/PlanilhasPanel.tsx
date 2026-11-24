import {useEffect,useState,type FormEvent} from 'react';
import {CalendarDays, ChevronDown, Download, ExternalLink, FileSpreadsheet, Plus, RefreshCw} from 'lucide-react';
import {Modal} from '../../components/Modal';
import {ApiError,type Api} from '../../shared/api';
import type {PlanilhaMensal,PlanilhaTipo} from '../../shared/types';
import {destinos} from './destinos';

const nomes={encartes:'Encartes',ofertas:'Ofertas',manual:'Manual de Ações','materiais-apoio':'Materiais de Apoio'} satisfies Record<PlanilhaTipo,string>;
const tipos=Object.keys(nomes) as PlanilhaTipo[];
export function tipoDaRota(route:string){
 return tipos.find(tipo=>route==='comercial/'+tipo);
}
export function NavegacaoComercial({tipo}:{tipo?:PlanilhaTipo|'arquivos-txt'}){
 return <nav className="planilhas-nav" aria-label="Módulos do Comercial">
  {tipo&&<a href="#/comercial">Links do Comercial</a>}
  {tipos.map(t=><a key={t} href={'#/comercial/'+t} aria-current={tipo===t?'page':undefined}>{nomes[t]}</a>)}
  <a href="#/comercial/arquivos-txt" aria-current={tipo==='arquivos-txt'?'page':undefined}>Arquivos TXT</a>
 </nav>;
}
function mesAtual(){
 return new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit'}).format(new Date());
}
function rotulo(mes:string){return mes.split('-').reverse().join('/');}
const formatoMes = new Intl.DateTimeFormat('pt-BR', {month:'long', year:'numeric', timeZone:'UTC'});
function mesPorExtenso(mes:string) {
 const data=new Date(mes+'-01T00:00:00Z');
 if(Number.isNaN(data.getTime()))return rotulo(mes);
 const texto=formatoMes.format(data);
 return texto.charAt(0).toLocaleUpperCase('pt-BR')+texto.slice(1);
}
function mensagem(error:unknown){return error instanceof ApiError?error.message:'Não foi possível concluir a operação.';}

export function PlanilhasPanel({tipo,api,admin,onAccessChanged}:{tipo:PlanilhaTipo;api:Api;admin:boolean;onAccessChanged:()=>void}){
 const [dados,setDados]=useState<PlanilhaMensal[]>([]),[mes,setMes]=useState(''),[rev,setRev]=useState(0);
 const [loading,setLoading]=useState(true),[erro,setErro]=useState(''),[ok,setOk]=useState('');
 const [form,setForm]=useState<{mes:string;url:string;fixo:boolean}|null>(null),[excluir,setExcluir]=useState(''),[busy,setBusy]=useState(false),[erroForm,setErroForm]=useState('');
 useEffect(()=>{
  let ativa=true;
  setLoading(true);setErro('');
  api.planilhas(tipo).then(({dados})=>{
   if(!ativa)return;
   setDados(dados);
   setMes(atual=>dados.some(item=>item.mes===atual)?atual:(dados[0]?.mes??''));
  }).catch(error=>{
   if(!ativa)return;
   setDados([]);setErro(mensagem(error));
   if(error instanceof ApiError&&[401,403].includes(error.status))onAccessChanged();
  }).finally(()=>{if(ativa)setLoading(false);});
  return ()=>{ativa=false;};
 },[api,tipo,rev]);
 const item=dados.find(p=>p.mes===mes), links=destinos(item?.url??'');
 const materialDisponivel=!!item&&!loading&&!erro;
 const exportarExcel=links.xlsx??links.download;
 const documento=tipo==='manual'||tipo==='materiais-apoio';
 const materiaisApoio=tipo==='materiais-apoio';
 const ofertas=tipo==='ofertas';
 const nomeMaterial=ofertas?'oferta':'encarte';
 const nomePlural=ofertas?'ofertas':'encartes';
 async function alterar(action:()=>Promise<void>){
  setBusy(true);setErroForm('');setOk('');
  try{await action();}
  catch(error){
   setErroForm(mensagem(error));
   if(error instanceof ApiError&&[401,403].includes(error.status))onAccessChanged();
  }finally{setBusy(false);}
 }
 function salvar(e:FormEvent){
  e.preventDefault();
  if(!form||busy)return;
  if(!destinos(form.url.trim()).original){setErroForm('Informe um endereço HTTPS válido, sem usuário ou senha.');return;}
  void alterar(async()=>{
   await api.salvarPlanilha(tipo,form.mes,form.url.trim());
   setForm(null);setMes(form.mes);setOk('Link mensal salvo.');setRev(n=>n+1);
  });
 }
 function abrirForm(fixo:boolean){
  setErroForm('');
  setForm(fixo&&item?{...item,fixo:true}:{mes:mesAtual(),url:'',fixo:false});
 }
 return <>
  {!documento?<div className="encarte-workspace">
   <header className="encarte-cabecalho">
    <div className="encarte-titulo">
     <span className="encarte-icone"><FileSpreadsheet size={22} aria-hidden="true"/></span>
     <h1>{ofertas?'Ofertas Comerciais':'Encartes Comerciais'}</h1>
    </div>
    <div className="encarte-controles">
     <label className="encarte-mes"><span>Mês de referência</span>
      <span className="encarte-seletor"><CalendarDays size={17} aria-hidden="true"/>
       <select value={mes} disabled={loading||!!erro||!dados.length} onChange={e=>{setMes(e.target.value);setOk('');}}>
        {(!dados.length||!item)&&<option value="">Sem meses cadastrados</option>}
        {dados.map(p=><option value={p.mes} key={p.mes}>{mesPorExtenso(p.mes)}</option>)}
       </select>
       <ChevronDown size={16} aria-hidden="true"/>
      </span>
     </label>
     {materialDisponivel&&links.original&&<a className="secondary" href={links.original} target="_blank" rel="noopener noreferrer">Abrir {nomeMaterial} <ExternalLink size={16} aria-hidden="true"/></a>}
     {materialDisponivel&&exportarExcel&&<a className="encarte-exportar" href={exportarExcel} target="_blank" rel="noopener noreferrer"><Download size={16} aria-hidden="true"/>Exportar Excel</a>}
     {admin&&<button className="secondary" disabled={loading||!!erro} onClick={()=>abrirForm(false)}><Plus size={16} aria-hidden="true"/>Cadastrar mês</button>}
     {admin&&materialDisponivel&&item&&<details className="encarte-gerenciar" key={item.mes}><summary>Gerenciar <ChevronDown size={16} aria-hidden="true"/></summary>
      <div className="encarte-menu">
       <button onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');abrirForm(true);}}>Editar link</button>
       <button className="danger" onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');setErroForm('');setExcluir(item.mes);}}>Remover link</button>
      </div>
     </details>}
     {!erro&&<button className="secondary encarte-atualizar" disabled={loading} onClick={()=>setRev(n=>n+1)} aria-label={'Atualizar '+nomePlural} title={'Atualizar '+nomePlural}><RefreshCw size={16} aria-hidden="true"/></button>}
    </div>
   </header>
   <section className="encarte-area" aria-label={ofertas?'Ofertas do mês':'Encarte do mês'}>
    {ok&&<p role="status" className="message success">{ok}</p>}
    {erro?<div className="encarte-cartao"><p role="alert">{erro}</p><button className="secondary" onClick={()=>setRev(n=>n+1)}>Tentar novamente</button></div>:
     loading?<div className="encarte-cartao" role="status">Carregando {nomePlural}…</div>:
     !item?<div className="encarte-cartao"><h2>{ofertas?'Nenhuma oferta cadastrada':'Nenhum encarte cadastrado'}</h2><p>Os meses disponíveis aparecem no seletor assim que um material é cadastrado.</p></div>:
     links.previa?<iframe key={item.mes} className="encarte-previa" title={ofertas?'Prévia das ofertas':'Prévia do encarte'} src={links.previa} referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-forms"/>:
     <div className="encarte-cartao">
      <h2>{mesPorExtenso(item.mes)}</h2>
      <p>{links.original?`Use Abrir ${nomeMaterial} para consultar esta planilha em outra aba.`:'O link desta planilha está indisponível.'}</p>
     </div>}
   </section>
  </div>:<div className="manual-workspace">
   <section className={'manual-card'+(materiaisApoio?' materiais-card':'')} aria-labelledby="manual-titulo">
    <h1 id="manual-titulo">{materiaisApoio?'Materiais de Apoio':'Manual de Ações'}</h1>
    <p className="manual-descricao">Selecione o mês e o ano para acessar os arquivos correspondentes.</p>
    {ok&&<p role="status" className="message success">{ok}</p>}
    {erro&&<p role="alert" className="message error">{erro}</p>}
    {loading?<p role="status">Carregando meses…</p>:<>
     <label className="manual-filtro">Mês de referência
      <select value={mes} disabled={!!erro||!dados.length} onChange={e=>{setMes(e.target.value);setOk('');}}>
       {(!dados.length||!item)&&<option value="">Sem meses cadastrados</option>}
       {dados.map(p=><option value={p.mes} key={p.mes}>{mesPorExtenso(p.mes)}</option>)}
      </select>
     </label>
     {!erro&&!item&&<p>{materiaisApoio?'Nenhum material cadastrado.':'Nenhum manual cadastrado.'}</p>}
     {!erro&&item&&!links.original&&<p role="alert">{materiaisApoio?'O link deste material está indisponível.':'O link deste manual está indisponível.'}</p>}
     {!erro&&item&&links.original&&<a className="manual-abrir" href={links.original} target="_blank" rel="noopener noreferrer">{materiaisApoio?'Abrir material de apoio':'Abrir manual de ações'} <ExternalLink size={17} aria-hidden="true"/></a>}
    </>}
    <div className="manual-acoes">
     <button className="manual-secundario" disabled={loading} onClick={()=>setRev(n=>n+1)}>{erro?'Tentar novamente':'Atualizar'}</button>
     {admin&&<button className="manual-secundario" disabled={loading||!!erro} onClick={()=>abrirForm(false)}>Cadastrar mês</button>}
     {admin&&materialDisponivel&&item&&<details className="manual-gerenciar" key={item.mes}>
      <summary>Gerenciar <ChevronDown size={16} aria-hidden="true"/></summary>
      <div className="manual-menu">
       <button onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');abrirForm(true);}}>Editar link</button>
       <button className="danger" onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');setErroForm('');setExcluir(item.mes);}}>Remover link</button>
      </div>
     </details>}
    </div>
   </section>
  </div>}
  {admin&&form&&<Modal title={form.fixo?'Editar link do mês':'Cadastrar mês'} onClose={()=>setForm(null)} busy={busy}>
   <form className="form-grid" onSubmit={salvar}>
    <label>Mês<input type="month" required value={form.mes} disabled={busy||form.fixo} onChange={e=>setForm({...form,mes:e.target.value})}/></label>
    <label>Endereço HTTPS<input type="url" required maxLength={4096} value={form.url} disabled={busy} onChange={e=>setForm({...form,url:e.target.value})}/></label>
    {!form.fixo&&dados.some(p=>p.mes===form.mes)&&<p role="status" className="message info">Já existe um link para esse mês. Ao salvar, ele será substituído.</p>}
    {erroForm&&<p role="alert" className="message error">{erroForm}</p>}
    <button className="primary" disabled={busy}>{documento?'Salvar documento':'Salvar planilha'}</button>
   </form>
  </Modal>}
  {admin&&excluir&&<Modal title="Remover link do mês" onClose={()=>setExcluir('')} busy={busy}>
   <p>Remover o link de {rotulo(excluir)}? O arquivo original no provedor será preservado.</p>
   {erroForm&&<p role="alert" className="message error">{erroForm}</p>}
   <button className="primary" disabled={busy} onClick={()=>void alterar(async()=>{await api.removerPlanilha(tipo,excluir);setExcluir('');setOk('Link mensal removido.');setRev(n=>n+1);})}>Confirmar remoção</button>
  </Modal>}
 </>;
}
