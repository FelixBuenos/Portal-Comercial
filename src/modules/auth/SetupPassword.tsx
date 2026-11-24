import {useEffect,useMemo,useRef,useState,type FormEvent} from 'react';
import {createClient} from '@supabase/supabase-js';
import {publicKeyValid,supabaseUrl} from '../../shared/config';
import {captureSetup} from './setup';
let initialCredentials=captureSetup(window.location,window.history);
export function SetupPassword(){
 const [ready,setReady]=useState(false),[busy,setBusy]=useState(false),[done,setDone]=useState(false),[error,setError]=useState('');
 const [password,setPassword]=useState(''),[confirmation,setConfirmation]=useState('');
 const credentials=useRef(initialCredentials),pending=useRef<Promise<void>|null>(null),saving=useRef(false);
 const client=useMemo(()=>{
  const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY??'';
  return supabaseUrl&&publicKeyValid(key)?createClient(supabaseUrl,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
   global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(8000)})}}):null;
 },[]);
 useEffect(()=>{
  let active=true;
  if(!pending.current)pending.current=(async()=>{
   if(!client||!credentials.current)throw new Error('Link inválido ou expirado. Peça ao administrador mestre um novo link.');
   const {data,error}=await client.auth.setSession(credentials.current);
   if(error||!data.session)throw new Error('Link inválido ou expirado. Peça ao administrador mestre um novo link.');
   const verified=await client.auth.getUser();
   if(verified.error||!verified.data.user)throw new Error('Não foi possível confirmar o acesso. Peça um novo link ao administrador mestre.');
  })().finally(()=>{initialCredentials=null;credentials.current=null;});
  void pending.current.then(()=>{if(active)setReady(true);}).catch(()=>{if(active)setError('Não foi possível validar este link. Ele pode estar inválido, expirado ou temporariamente indisponível. Peça um novo link ao administrador mestre.');});
  return()=>{active=false;};
 },[client]);
 async function submit(e:FormEvent){
  e.preventDefault();if(saving.current||!client||!ready)return;
  if(password.length<12||password!==confirmation){setError('Use pelo menos 12 caracteres e repita a mesma senha.');return;}
  saving.current=true;setBusy(true);setError('');
  try{
   const {error}=await client.auth.updateUser({password});
   if(error)throw new Error();
   setReady(false);setDone(true);
   // O destinatário fará um login normal após escolher a senha.
   await client.auth.signOut({scope:'local'}).catch(()=>{});
  }catch{setError('Não foi possível confirmar a nova senha. Tente novamente ou solicite outro link.');}
  finally{setPassword('');setConfirmation('');setBusy(false);saving.current=false;}
 }
 return <div className="login-page"><section className="login-card"><img className="brand" src="/logo-conviva.png" alt="Farmácias Conviva"/><span className="test-badge">AMBIENTE DE TESTE</span><h1>Defina sua senha</h1>
  {done?<><p role="status">Senha definida. Entre no portal com seu e-mail e sua nova senha.</p><a className="primary" href="/">Ir para o login</a></>:<>
   <p>Crie sua senha pessoal. Não a compartilhe com o administrador.</p>
   {error&&<div className="message error" role="alert">{error}</div>}
   {!ready&&!error&&<p role="status">Verificando o link…</p>}
   {ready&&<form className="form-grid" onSubmit={submit}><label>Nova senha<input type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={password} disabled={busy} onChange={e=>setPassword(e.target.value)}/></label><label>Repita a nova senha<input type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={confirmation} disabled={busy} onChange={e=>setConfirmation(e.target.value)}/></label><button className="primary" disabled={busy}>{busy?'Salvando…':'Definir senha'}</button></form>}
  </>}
 </section></div>;
}
