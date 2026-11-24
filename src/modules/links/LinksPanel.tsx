import {useEffect,useRef,useState,type FormEvent} from 'react';
import {Plus,Pencil,Trash2,ExternalLink,Search,RefreshCw,Eye,EyeOff,Save,X} from 'lucide-react';
import type {Api} from '../../shared/api';
import {ApiError} from '../../shared/api';
import {safeWebUrl,type Link,type LinkInput,type Portal,portalNames} from '../../shared/types';
import {Modal} from '../../components/Modal';
export function LinksPanel({portal,api,admin,category,onAccessChanged}:{portal:Portal;api:Api;admin:boolean;category?:{id:string;title:string};onAccessChanged:()=>void}){
 const [links,setLinks]=useState<Link[]>([]),[offset,setOffset]=useState(0),[loading,setLoading]=useState(true);
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[search,setSearch]=useState('');
 const [editing,setEditing]=useState<Link|null|undefined>(),[removing,setRemoving]=useState<Link|null>(null),[busy,setBusy]=useState(false);
 const [tutorialAberto,setTutorialAberto]=useState(false);
 const generation=useRef(0);
 function failure(e:unknown){setError(e instanceof Error?e.message:'Não foi possível concluir.');if(e instanceof ApiError&&[401,403].includes(e.status)){setLinks([]);onAccessChanged();}}
 async function load(){
  const version=++generation.current;setLoading(true);setError('');setLinks([]);
  try{
   const result=await api.links(portal,offset);
   if(!category){
    if(version===generation.current)setLinks(result.dados);
    return;
   }
   const matching=result.dados.filter(link=>link.categoria===category.id);
   let page=result;
   let nextOffset=offset;
   while(version===generation.current && page.dados.length>0 && page.dados.length>=page.limit){
    nextOffset+=page.dados.length;
    page=await api.links(portal,nextOffset);
    matching.push(...page.dados.filter(link=>link.categoria===category.id));
   }
   if(version===generation.current)setLinks(matching);
  }
  catch(e){if(version===generation.current)failure(e);}
  finally{if(version===generation.current)setLoading(false);}
 }
 useEffect(()=>{void load();return ()=>{generation.current++;};},[portal,offset,category?.id]);
 async function save(data:LinkInput){
  setBusy(true);setError('');setNotice('');
  try{if(editing)await api.update(String(editing.id),data);else await api.create(data);setEditing(undefined);setNotice('Link salvo.');await load();}
  catch(e){failure(e);}finally{setBusy(false);}
 }
 async function remove(){
  if(!removing)return;setBusy(true);setError('');setNotice('');
  try{await api.remove(String(removing.id));setRemoving(null);setNotice('Link excluído.');await load();}
  catch(e){failure(e);}finally{setBusy(false);}
 }
 const filtered=links.filter(l=>(l.descricao+' '+l.categoria).toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
 function linkActions(link:Link){
  const url=safeWebUrl(link.url);
  return <div className="row-actions">
   {url&&<a className={category?'btn-abrir-link':'open-link'} href={url} target="_blank" rel="noopener noreferrer">Abrir{category?' link':''}<ExternalLink size={14}/></a>}
   {admin&&<><button className="icon-button" aria-label={'Editar '+link.descricao} onClick={()=>setEditing(link)}><Pencil size={16}/></button><button className="icon-button danger" aria-label={'Excluir '+link.descricao} onClick={()=>setRemoving(link)}><Trash2 size={16}/></button></>}
  </div>;
 }
 return <>
  <div className={category?'page-top marketing-intro':'page-top'}><div><h1 className={category?'marketing-main-title':undefined}>{category?.title??portalNames[portal]}</h1><p className={category?'marketing-subtitle':undefined}>{category?'Abaixo estão listadas as artes e links de referência disponíveis para download.':'Consulte os links disponíveis para sua equipe.'}</p></div>
   {admin&&<button className="primary" onClick={()=>setEditing(null)}><Plus size={18}/>Novo link</button>}
  </div>
  <section className={category?'links-wrapper':'surface'}>
   {category&&<div className="canva-note">
    <div className="canva-note-conteudo">
     <span className="canva-note-icone" aria-hidden="true">⚠️</span>
     <p><strong className="canva-note-titulo">Instrução Importante:</strong> Ao clicar em qualquer link abaixo, o Canva abrirá uma página externa. <strong>"Clique obrigatoriamente"</strong> na aba <strong>"Arquivo"</strong> (no canto superior esquerdo) e selecione a opção <strong>"Fazer uma cópia"</strong> para salvar o modelo em sua conta de forma segura. Dessa forma, as alterações serão feitas apenas no seu arquivo e a matriz original permanecerá intacta.</p>
     <button type="button" className="canva-note-botao" aria-expanded={tutorialAberto} aria-controls="tutorial-canva" onClick={()=>setTutorialAberto(!tutorialAberto)}>{tutorialAberto?<EyeOff size={15} aria-hidden="true"/>:<Eye size={15} aria-hidden="true"/>}{tutorialAberto?'Ocultar Ajuda Visual':'Ver Ajuda Visual'}</button>
    </div>
    {tutorialAberto&&<div className="canva-note-tutorial" id="tutorial-canva">
     <a href="/tutorial-canva.jpeg" target="_blank" rel="noopener noreferrer" title="Clique para abrir a imagem em tamanho real"><img src="/tutorial-canva.jpeg" alt="Tutorial Canva - Usar Modelo"/></a>
     <p>(Clique na imagem acima para ampliá-la em alta qualidade)</p>
    </div>}
   </div>}
   <div className="toolbar"><label className="search"><Search size={18}/><span className="sr-only">Filtrar links desta página</span><input placeholder="Buscar nesta página" value={search} onChange={e=>setSearch(e.target.value)}/></label>
    <button className="secondary" onClick={()=>void load()} disabled={loading}><RefreshCw size={16}/>Atualizar</button></div>
   {error&&<div className="message error" role="alert">{error}</div>}
   {notice&&<div className="message success" role="status">{notice}</div>}
   {loading?<p className="empty" role="status">Carregando links…</p>:filtered.length===0?<div className={category?'empty no-links-msg':'empty'}><h2>{error?'Não foi possível carregar os links':'Nenhum link encontrado'}</h2><p>{error?'Use Atualizar para tentar novamente.':'Os links cadastrados aparecerão aqui.'}</p></div>:
   category?<div>
    {filtered.map(link=><article className="link-item-card" key={link.id}><div className="link-info">
     <h2 className="link-title">{link.descricao}</h2><p className="link-url-text">{safeWebUrl(link.url)??'Endereço inválido'}</p>
    </div>{linkActions(link)}</article>)}
   </div>:
   <div className="table-wrap"><table><thead><tr><th>Material</th><th>Categoria</th><th>Referência</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>
    {filtered.map(link=><tr key={link.id}><td><strong>{link.descricao}</strong><span className="url-label">{safeWebUrl(link.url)?new URL(link.url).hostname:'Endereço inválido'}</span></td><td><span className="tag">{link.categoria}</span></td><td>{link.referencia?new Intl.DateTimeFormat('pt-BR',{timeZone:'UTC'}).format(new Date(link.referencia)):'—'}</td>
    <td>{linkActions(link)}</td></tr>)}
   </tbody></table></div>}
   {!category&&<div className="pagination"><span>Até 50 links por página</span><div><button className="secondary" disabled={loading||offset===0} onClick={()=>setOffset(Math.max(0,offset-50))}>Anterior</button><button className="secondary" disabled={loading||links.length<50} onClick={()=>setOffset(offset+50)}>Próxima</button></div></div>}
  </section>
  {editing!==undefined&&<Modal title={editing?'Editar link':'Cadastrar link'} busy={busy} onClose={()=>setEditing(undefined)}>{error&&<p role="alert" className="message error">{error}</p>}<LinkForm portal={portal} initial={editing} fixedCategory={category} busy={busy} onSave={save} onCancel={()=>setEditing(undefined)}/></Modal>}
  {removing&&<Modal title="Excluir link" busy={busy} onClose={()=>setRemoving(null)}><p className="dialog-copy">Excluir “{removing.descricao}”? O destino externo continuará existindo.</p>{error&&<p role="alert" className="message error">{error}</p>}<div className="form-actions"><button className="secondary" onClick={()=>setRemoving(null)} disabled={busy}><X size={16} aria-hidden="true"/>Cancelar</button><button className="danger-fill" onClick={()=>void remove()} disabled={busy}><Trash2 size={16} aria-hidden="true"/>{busy?'Excluindo…':'Excluir link'}</button></div></Modal>}
 </>;
}
function LinkForm({portal,initial,fixedCategory,busy,onSave,onCancel}:{portal:Portal;initial:Link|null;fixedCategory?:{id:string;title:string};busy:boolean;onSave:(data:LinkInput)=>Promise<void>;onCancel:()=>void}){
 const [description,setDescription]=useState(initial?.descricao??''),[category,setCategory]=useState(initial?.categoria??fixedCategory?.id??'teste');
 const [url,setUrl]=useState(initial?.url??''),[date,setDate]=useState(initial?.referencia?.slice(0,10)??''),[error,setError]=useState('');
 function submit(e:FormEvent){e.preventDefault();if(!safeWebUrl(url)){setError('Informe um endereço HTTP ou HTTPS sem usuário ou senha.');return;}setError('');void onSave({portal,categoria:fixedCategory?.id??category.trim(),descricao:description.trim(),url:url.trim(),referencia:date||null});}
 return <form onSubmit={submit} className="form-grid">
  <label>Descrição<input autoFocus required maxLength={500} value={description} onChange={e=>setDescription(e.target.value)} disabled={busy}/></label>
  {fixedCategory?<p>Categoria: <strong>{fixedCategory.title}</strong></p>:<label>Categoria<input required maxLength={100} value={category} onChange={e=>setCategory(e.target.value)} disabled={busy}/></label>}
  <label>Endereço do link<input required type="url" maxLength={4096} placeholder="https://" value={url} onChange={e=>setUrl(e.target.value)} disabled={busy}/></label>
  <label>Data de referência <span className="muted">(opcional)</span><input type="date" value={date} onChange={e=>setDate(e.target.value)} disabled={busy}/></label>
  {error&&<p role="alert" className="message error">{error}</p>}
  <div className="form-actions"><button type="button" className="secondary" disabled={busy} onClick={onCancel}><X size={16} aria-hidden="true"/>Cancelar</button><button className="primary" disabled={busy}><Save size={16} aria-hidden="true"/>{busy?'Salvando…':'Salvar link'}</button></div>
 </form>;
}

