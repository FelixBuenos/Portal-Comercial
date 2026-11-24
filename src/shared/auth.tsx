import {createClient, type Session} from '@supabase/supabase-js';
import {createContext,useContext,useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {createApi,type Api} from './api';
import {apiBaseValid,publicKeyValid,supabaseUrl} from './config';
import type {Profile} from './types';
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY??'';
const base=import.meta.env.VITE_API_BASE_URL||'/api';
export const configurationReady=!!supabaseUrl&&publicKeyValid(key)&&apiBaseValid(base);
const client=configurationReady&&supabaseUrl?createClient(supabaseUrl,key,{auth:{persistSession:false,autoRefreshToken:true,detectSessionInUrl:false}}):null;
interface AuthState {session:Session|null;profile:Profile|null;loading:boolean;error:string;api:Api;refresh:()=>Promise<void>;login:(email:string,password:string)=>Promise<void>;logout:()=>Promise<void>}
const Context=createContext<AuthState|null>(null);
export function AuthProvider({children}:{children:ReactNode}){
 const [session,setSession]=useState<Session|null>(null),[profile,setProfile]=useState<Profile|null>(null);
 const [loading,setLoading]=useState(false),[error,setError]=useState('');
 const revision=useRef(0),userId=useRef<string|null>(null),manuallySignedOut=useRef(false);
 const api=useMemo(()=>createApi(async()=>{const response=await client?.auth.getSession();return response?.data.session?.access_token??null;},base),[]);
 async function refresh(){const version=++revision.current;setLoading(true);setError('');try{const next=await api.me();if(version===revision.current)setProfile(next);}catch(e){if(version===revision.current){setProfile(null);setError(e instanceof Error?e.message:'Não foi possível consultar seu acesso.');}}finally{if(version===revision.current)setLoading(false);}}
 useEffect(()=>{
  if(!client)return;
  const {data}=client.auth.onAuthStateChange((_event,next)=>{if(manuallySignedOut.current&&next)return;if(userId.current!==(next?.user.id??null)){userId.current=next?.user.id??null;revision.current++;setProfile(null);}setSession(next);if(!next){setProfile(null);setError('');setLoading(false);}});
  return ()=>data.subscription.unsubscribe();
 },[]);
 useEffect(()=>{if(session)void refresh();},[session?.user.id]);
 async function login(email:string,password:string){
   if(!client)throw new Error('O ambiente de teste ainda precisa ser configurado.');
   setError('');const r=await client.auth.signInWithPassword({email,password});
   if(r.error||!r.data.session)throw new Error('Não foi possível entrar. Confira a conta e a senha de teste.');
   if(userId.current!==r.data.session.user.id){userId.current=r.data.session.user.id;revision.current++;setProfile(null);}
   manuallySignedOut.current=false;client.auth.startAutoRefresh();setSession(r.data.session);
 }
 async function logout(){manuallySignedOut.current=true;revision.current++;userId.current=null;setSession(null);setProfile(null);setError('');client?.auth.stopAutoRefresh();try{await client?.auth.signOut({scope:'local'});}catch{/* A interface continua desconectada mesmo se a rede falhar. */}}
 return <Context.Provider value={{session,profile,loading,error,api,refresh,login,logout}}>{children}</Context.Provider>;
}
export function useAuth(){const context=useContext(Context);if(!context)throw new Error('AuthProvider ausente');return context;}

