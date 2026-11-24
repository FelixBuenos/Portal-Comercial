import {useEffect,useRef,useState,type FormEvent} from 'react';
import {UserPlus,ClipboardList} from 'lucide-react';
import type {Api} from '../../shared/api';
import {portals,portalNames,type Portal,type Permission,type Invitation,type InvitationInput} from '../../shared/types';
const messages:Record<string,string>={
 reservado:'Solicitação registrada. O cadastro pode ser retomado.',
 auth_em_andamento:'A criação da conta está em verificação. Confira o resultado antes de tentar outra solicitação.',
 auth_incerto:'A criação da conta precisa ser conferida. Use “Verificar cadastro”.',
 auth_confirmado:'Conta criada. Falta concluir os acessos. Use “Verificar cadastro”.',
 email_pendente:'Conta cadastrada. Defina a senha inicial para entrega interna.',
 email_em_andamento:'Solicitação anterior em verificação. Confira o cadastro antes de continuar.',
 email_incerto:'Solicitação anterior registrada. Defina a senha inicial para entrega interna.',
 concluido:'Solicitação anterior concluída. Confira os acessos cadastrados.',
 conflito:'O e-mail já possui conta ou cadastro. Os acessos existentes foram preservados.',
 falha_auth:'A criação da conta foi recusada. Confira a configuração do ambiente de teste.'
 ,interno_em_andamento:'A definição da senha inicial está em verificação. Aguarde antes de tentar novamente.'
 ,interno_incerto:'Não foi possível confirmar a senha inicial. O acesso permanece bloqueado; aguarde um minuto para tentar novamente.'
 ,interno_pronto:'Senha inicial definida. Entregue-a por um canal interno seguro; a pessoa deverá trocá-la no primeiro acesso.'
};
const emptyLevels=():Record<Portal,string>=>({comercial:'none',marketing:'none',novos_negocios:'none'});
export function NewUserPanel({api,onCreated}:{api:Api;onCreated:()=>void}){
 const [email,setEmail]=useState(''),[levels,setLevels]=useState(emptyLevels),[submitted,setSubmitted]=useState<InvitationInput|null>(null);
 const [internalId,setInternalId]=useState<string|null>(null),[temporary,setTemporary]=useState(''),[confirmTemporary,setConfirmTemporary]=useState('');
 const [items,setItems]=useState<Invitation[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const generation=useRef(0),inFlight=useRef(false);
 async function load(){const v=++generation.current;try{const r=await api.invitations();if(v===generation.current)setItems(r.dados);}catch(e){if(v===generation.current)setError(e instanceof Error?e.message:'Não foi possível consultar os cadastros.');}}
 useEffect(()=>{void load();return()=>{generation.current++;};},[api]);
 async function run(action:()=>Promise<Invitation>){
  if(inFlight.current)return;inFlight.current=true;setBusy(true);setError('');const v=generation.current;
  try{
   const r=await action();if(v!==generation.current)return;
   setItems(previous=>[r,...previous.filter(item=>item.id!==r.id)].slice(0,30));
   if(['concluido','email_pendente','email_incerto','email_em_andamento'].includes(r.estado))onCreated();
  }catch(e){if(v===generation.current)setError(e instanceof Error?e.message:'Não foi possível confirmar o resultado. Consulte a solicitação antes de repetir.');}
  finally{inFlight.current=false;if(v===generation.current)setBusy(false);}
 }
 function submit(e:FormEvent){
  e.preventDefault();if(inFlight.current)return;
  const permissions:Permission[]=portals.filter(p=>levels[p]!=='none').map(portal=>({portal,consultar:true,administrar:levels[portal]==='admin'}));
  if(!submitted&&permissions.length===0){setError('Selecione pelo menos um portal.');return;}
  const data=submitted??{id:crypto.randomUUID(),email:email.trim().toLowerCase(),permissoes:permissions,modo:'interno' as const};
  setSubmitted(data);void run(()=>api.invite(data));
 }
 return <section className="surface registration-panel" aria-label="Cadastro de novo usuário">
  <div className="access-section-heading"><span className="access-section-icon"><UserPlus size={21}/></span><div><h2>Cadastrar novo usuário</h2><p>Escolha os portais permitidos. Você definirá a senha inicial para entrega interna.</p></div></div>
  {error&&<div className="message error" role="alert">{error}</div>}
  <form className="form-grid" onSubmit={submit}>
   <label>E-mail do novo usuário<input type="email" autoComplete="off" maxLength={254} required value={email} disabled={busy||!!submitted} onChange={e=>setEmail(e.target.value)}/></label>
   <fieldset disabled={busy||!!submitted}><legend>Portais permitidos</legend><div className="access-portal-grid">{portals.map(portal=><label key={portal}>{portalNames[portal]}<select value={levels[portal]} onChange={e=>setLevels(previous=>({...previous,[portal]:e.target.value}))}><option value="none">Sem acesso</option><option value="read">Somente consulta</option>{portal!=='novos_negocios'&&<option value="admin">Consultar e administrar</option>}</select></label>)}</div></fieldset>
   <div className="toolbar"><button className="primary" disabled={busy}>{busy?'Verificando…':submitted?'Retomar a mesma solicitação':'Cadastrar conta'}</button>
    {submitted&&<><button type="button" className="secondary" disabled={busy} onClick={()=>void run(()=>api.invitation(submitted.id))}>Consultar resultado</button><button type="button" className="secondary" disabled={busy} onClick={()=>{setSubmitted(null);setEmail('');setLevels(emptyLevels());setError('');}}>Novo cadastro</button></>}
   </div>
  </form>
  {submitted&&<p className="admin-note">Esta solicitação mantém o mesmo e-mail e os mesmos acessos até o resultado ser conferido.</p>}
  <div className="toolbar access-requests-heading"><h3><ClipboardList size={18}/>Solicitações recentes</h3><button type="button" className="secondary" disabled={busy} onClick={()=>void load()}>Atualizar solicitações</button></div>
  {items.length===0?<p>Nenhuma solicitação recente disponível.</p>:<ul className="registration-list">{items.map(item=><li key={item.id}><strong>{item.email}</strong><p role="status">{item.estado==='reservado'&&item.modo==='email'?'Solicitação antiga não iniciada. É necessário revisá-la antes de cadastrar novamente.':item.estado==='email_pendente'&&item.modo==='interno'?'Conta cadastrada. Defina a senha inicial para entrega interna.':messages[item.estado]??'O cadastro precisa ser conferido.'}</p><p>{item.permissoes.map(p=>portalNames[p.portal]+(p.administrar?' (administração)':' (consulta)')).join(' · ')}</p>
   {!(item.estado==='reservado'&&item.modo==='email')&&['reservado','auth_em_andamento','auth_incerto','auth_confirmado','email_pendente'].includes(item.estado)&&<button className="secondary" disabled={busy} onClick={()=>void run(()=>item.estado==='reservado'?api.invite({id:item.id,email:item.email,permissoes:item.permissoes,modo:item.modo}):api.reconcileInvitation(item.id))}>Verificar cadastro de {item.email}</button>}
   {['email_pendente','email_em_andamento','email_incerto','concluido','interno_em_andamento','interno_incerto'].includes(item.estado)&&<button type="button" className="secondary" disabled={busy} onClick={()=>{setInternalId(item.id);setTemporary('');setConfirmTemporary('');}}>Definir senha inicial para {item.email}</button>}
   {internalId===item.id&&<form className="form-grid" onSubmit={e=>{e.preventDefault();if(temporary.length<6||temporary!==confirmTemporary){setError('Use pelo menos 6 caracteres e repita a mesma senha inicial.');return;}const senha=temporary;setTemporary('');setConfirmTemporary('');setInternalId(null);void run(()=>api.internalPassword(item.id,senha));}}><label>Senha inicial<input type="password" autoComplete="new-password" minLength={6} maxLength={128} required value={temporary} onChange={e=>setTemporary(e.target.value)} disabled={busy}/></label><label>Repita a senha inicial<input type="password" autoComplete="new-password" minLength={6} maxLength={128} required value={confirmTemporary} onChange={e=>setConfirmTemporary(e.target.value)} disabled={busy}/></label><button className="primary" disabled={busy}>Salvar senha inicial</button><button type="button" className="secondary" disabled={busy} onClick={()=>{setInternalId(null);setTemporary('');setConfirmTemporary('');}}>Cancelar</button></form>}
  </li>)}</ul>}
 </section>;
}
