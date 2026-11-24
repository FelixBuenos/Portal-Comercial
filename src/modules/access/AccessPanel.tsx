import {useEffect,useRef,useState} from 'react';
import {RefreshCw,ShieldCheck} from 'lucide-react';
import type {Api} from '../../shared/api';
import {portals,portalNames,type Permission,type UserRow} from '../../shared/types';
import {NewUserPanel} from './NewUserPanel';
export function AccessPanel({api,onAccessChanged}:{api:Api;onAccessChanged:()=>void}){
 const [users,setUsers]=useState<UserRow[]>([]),[offset,setOffset]=useState(0),[selected,setSelected]=useState<UserRow|null>(null);
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[loading,setLoading]=useState(false);
 const [searchInput,setSearchInput]=useState(''),[search,setSearch]=useState('');
 const [deactivating,setDeactivating]=useState(false);
 const generation=useRef(0);
 async function load(){
  const version=++generation.current;
  setLoading(true);setError('');
  try {
   const matches:UserRow[]=[];
   for(let page=search?0:offset;;page+=50){
    const {dados}=await api.users(page);
    if(version!==generation.current)return;
    matches.push(...dados.filter(user=>!search||[user.nome,user.email,user.authId].some(value=>value?.toLowerCase().includes(search))));
    if(!search||dados.length<50)break;
   }
   setUsers(matches);setSelected(null);
  }catch(e){
   if(version===generation.current){setUsers([]);setSelected(null);setError(e instanceof Error?e.message:'Não foi possível carregar os acessos.');}
  }finally{if(version===generation.current)setLoading(false);}
 }
 useEffect(()=>{void load();return ()=>{generation.current++;};},[offset,search]);
 async function save(permission:Permission){
  if(!selected)return;setError('');setNotice('');
  try{
   await api.permission(selected.authId,permission);
   setSelected(previous=>previous?{...previous,permissoes:[...previous.permissoes.filter(p=>p.portal!==permission.portal),permission]}:null);
   setUsers(previous=>previous.map(u=>u.authId===selected.authId?{...u,permissoes:[...u.permissoes.filter(p=>p.portal!==permission.portal),permission]}:u));
   setNotice('Permissão salva. A mudança vale para as próximas operações da conta.');onAccessChanged();
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar a permissão.');throw e;}
 }
 async function deactivateSelected(){
  if(!selected?.ativo||selected.mestre||deactivating)return;
  const {authId,nome,email}=selected;
  if(!window.confirm(`Desativar o acesso de ${email||nome||authId} ao portal?`))return;
  setDeactivating(true);setError('');setNotice('');
  try{
   await api.deactivateUser(authId);
   setUsers(previous=>previous.map(user=>user.authId===authId?{...user,ativo:false}:user));
   setSelected(previous=>previous?.authId===authId?{...previous,ativo:false}:previous);
   setNotice('Acesso desativado.');
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível desativar o acesso.');}
  finally{setDeactivating(false);}
 }
 return <div className="access-admin">
  <div className="page-top"><div><div className="eyebrow">ADMINISTRAÇÃO MESTRE</div><h1>Usuários e acessos</h1><p>Defina quais portais cada conta cadastrada pode consultar ou administrar.</p></div><ShieldCheck className="heading-icon" size={35}/></div>
  <NewUserPanel api={api} onCreated={()=>{void load();}}/>
  <section className="surface access-accounts">
   <form className="toolbar" onSubmit={event=>{event.preventDefault();setOffset(0);setSearch(searchInput.trim().toLowerCase());}}>
    <label>Nome, e-mail ou ID <input type="search" value={searchInput} onChange={event=>setSearchInput(event.target.value)}/></label>
    <button type="submit" className="secondary">Pesquisar</button>
    {search&&<button type="button" className="secondary" onClick={()=>{setSearchInput('');setSearch('');}}>Limpar busca</button>}
   </form>
   <div className="toolbar"><div><h2>Contas e permissões</h2><p className="muted">Selecione uma conta para consultar e ajustar seus acessos.</p></div><button className="secondary" disabled={loading} onClick={()=>void load()}><RefreshCw size={16}/>Atualizar</button></div>
   {error&&<div role="alert" className="message error">{error}</div>}{notice&&<div role="status" className="message success">{notice}</div>}
   {loading?<p className="empty" role="status">Carregando contas…</p>:<div className="access-layout"><div className="user-list">{users.map(user=><button key={user.authId} className={'user-item '+(selected?.authId===user.authId?'selected':'')} onClick={()=>{setSelected(user);setNotice('');}}><strong>{user.nome || user.email || (user.mestre?'Administrador mestre':'Conta cadastrada')}</strong>{user.nome && user.email && <span>{user.email}</span>}<code>{user.authId}</code><span>{user.ativo?'Ativa':'Desativada'}</span></button>)}{users.length===0&&<p>Nenhuma conta nesta página.</p>}</div>
    <div className="permission-list">{selected?<><h2>Acessos da conta</h2><code className="selected-id">{selected.authId}</code>{selected.mestre?<p className="message info">Esta conta possui administração mestre. Essa concessão não pode ser alterada nesta tela.</p>:portals.map(portal=><PermissionRow key={selected.authId+portal+JSON.stringify(selected.permissoes)} disabled={!selected.ativo} permission={selected.permissoes.find(p=>p.portal===portal)??{portal,consultar:false,administrar:false}} onSave={save}/>)}</>:<div className="empty"><ShieldCheck size={28}/><h2>Selecione uma conta</h2><p>Os acessos de cada portal aparecerão aqui.</p></div>}</div>
   </div>}
   {selected?.ativo&&!selected.mestre&&!loading&&<div className="toolbar">
    <button type="button" className="secondary" disabled={deactivating} onClick={()=>void deactivateSelected()}>
     {deactivating?'Desativando…':'Desativar acesso'}
    </button>
   </div>}
   {search ? <p className="pagination" aria-live="polite">{!loading&&!error&&`${users.length} contas encontradas`}</p> :
   <div className="pagination"><span>Até 50 contas por página</span><div><button className="secondary" disabled={loading||offset===0} onClick={()=>setOffset(Math.max(0,offset-50))}>Anterior</button><button className="secondary" disabled={loading||users.length<50} onClick={()=>setOffset(offset+50)}>Próxima</button></div></div>}
  </section>
 </div>;
}
function PermissionRow({permission,onSave,disabled}:{permission:Permission;onSave:(p:Permission)=>Promise<void>;disabled:boolean}){
 const current=permission.administrar?'admin':permission.consultar?'read':'none';
 const [level,setLevel]=useState(current),[busy,setBusy]=useState(false);
 async function save(){setBusy(true);try{await onSave({...permission,consultar:level!=='none',administrar:level==='admin'});}catch{}finally{setBusy(false);}}
 return <div className="permission-row"><label>{portalNames[permission.portal]}<select value={level} onChange={e=>setLevel(e.target.value)} disabled={disabled||busy}><option value="none">Sem acesso</option><option value="read">Somente consulta</option><option value="admin">Consultar e administrar</option></select></label><button className="primary" disabled={disabled||busy||level===current} onClick={()=>void save()}>{busy?'Salvando…':'Salvar'}</button></div>;
}

