import {useRef,useState,type FormEvent} from 'react';
import type {Api} from '../../shared/api';
export function FirstPassword({api,logout}:{api:Api;logout:()=>Promise<void>}){
 const [password,setPassword]=useState(''),[confirmation,setConfirmation]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[done,setDone]=useState(false);
 const inFlight=useRef(false);
 async function submit(e:FormEvent){
  e.preventDefault();if(inFlight.current)return;
  if(password.length<6||password!==confirmation){setError('Use pelo menos 6 caracteres e repita a mesma senha.');return;}
  inFlight.current=true;setBusy(true);setError('');
  try{await api.firstPassword(password);setDone(true);}
  catch{setError('Não foi possível confirmar o resultado. Entre novamente com a senha que tentou definir; se a troca ainda estiver pendente, escolha outra senha.');}
  finally{setPassword('');setConfirmation('');setBusy(false);inFlight.current=false;}
 }
 return <div className="login-page"><section className="login-card"><img className="brand" src="/logo-conviva.png" alt="Farmácias Conviva"/><span className="test-badge">AMBIENTE DE TESTE</span><h1>Defina sua senha</h1>
  {done?<><p role="status">Senha definida. Entre novamente com sua nova senha.</p><button className="primary" onClick={()=>void logout()}>Voltar ao login</button></>:<><p>Antes de acessar os portais, escolha sua senha pessoal.</p>
   {error&&<div role="alert" className="message error">{error}</div>}
   <form className="form-grid" onSubmit={submit}><label>Nova senha<input type="password" autoComplete="new-password" minLength={6} maxLength={128} required value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/></label><label>Repita a nova senha<input type="password" autoComplete="new-password" minLength={6} maxLength={128} required value={confirmation} onChange={e=>setConfirmation(e.target.value)} disabled={busy}/></label><button className="primary" disabled={busy}>{busy?'Salvando…':'Definir senha'}</button></form><button className="secondary" disabled={busy} onClick={()=>void logout()}>Sair</button>
  </>}
 </section></div>;
}
