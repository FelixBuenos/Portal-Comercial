import type {Link,LinkInput,PlanilhaTipo,PlanilhaMensal,Permission,Portal,Profile,UserRow} from './types';
import type {ArquivoTxt,ArquivoTxtInput} from './types';
import type {Invitation,InvitationInput} from './types';
export class ApiError extends Error {constructor(public status:number,message:string){super(message);}}
export function createApi(getToken:()=>Promise<string|null>,base='/api',fetcher:typeof fetch=fetch) {
 async function fetchResponse(path:string,method='GET',body?:unknown):Promise<Response>{
   const token=await getToken();
   if(!token)throw new ApiError(401,'Sua sessão terminou. Entre novamente.');
   let response:Response;
   try {
     const ngrokHeaders=base==='https://borough-lagging-paltry.ngrok-free.dev'
       ? {'ngrok-skip-browser-warning':'1'} : {};
     response=await fetcher(base+path,{method,headers:{Authorization:'Bearer '+token,...ngrokHeaders,...(body===undefined?{}:{'Content-Type':'application/json'})} as HeadersInit,
       ...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(10000),cache:'no-store'});
   }catch{throw new ApiError(503,'Os dados estão temporariamente indisponíveis. Tente novamente em instantes.');}
   if(!response.ok){
     let message=response.status===403?'Você não tem permissão para esta operação.':'Não foi possível concluir a operação.';
     try{const data=await response.json();if(typeof data.mensagem==='string')message=data.mensagem;}catch{}
     throw new ApiError(response.status,message);
   }
   return response;
 }
 async function request<T>(path:string,method='GET',body?:unknown):Promise<T>{
   const response=await fetchResponse(path,method,body);
   if(response.status===204)return undefined as T;
   try{return await response.json();}catch{throw new ApiError(502,'O serviço retornou uma resposta inesperada.');}
 }
 return {
  firstPassword:(senha:string)=>request<void>('/v1/access/first-password','POST',{senha}),
  invitations:()=>request<{dados:Invitation[]}>('/v1/access/invitations'),
  invite:(data:InvitationInput)=>request<Invitation>('/v1/access/invitations','POST',data),
  invitation:(id:string)=>request<Invitation>('/v1/access/invitations/'+encodeURIComponent(id)),
  reconcileInvitation:(id:string)=>request<Invitation>('/v1/access/invitations/'+encodeURIComponent(id)+'/reconcile','POST'),
  internalPassword:(id:string,senha:string)=>request<Invitation>('/v1/access/invitations/'+encodeURIComponent(id)+'/internal-password','POST',{senha}),
  arquivosTxt:(offset=0)=>request<{dados:ArquivoTxt[];mais:boolean}>('/v1/comercial/txt?offset='+offset),
  salvarTxt:(data:ArquivoTxtInput,id?:string)=>request<ArquivoTxt>('/v1/comercial/txt'+(id?'/'+encodeURIComponent(id):''),id?'PUT':'POST',data),
  removerTxt:(id:string)=>request<void>('/v1/comercial/txt/'+encodeURIComponent(id),'DELETE'),
  baixarTxt:async(id:string)=>(await fetchResponse('/v1/comercial/txt/'+encodeURIComponent(id)+'/download')).blob(),
  me:()=>request<Profile>('/v1/me'),
  links:(portal:Portal,offset=0)=>request<{dados:Link[];limit:number;offset:number}>('/v1/links?portal='+portal+'&limit=50&offset='+offset),
  create:(data:LinkInput)=>request<Link>('/v1/links','POST',data),
  update:(id:string,data:LinkInput)=>request<Link>('/v1/links/'+encodeURIComponent(id),'PUT',data),
  remove:(id:string)=>request<void>('/v1/links/'+encodeURIComponent(id),'DELETE'),
  planilhas:(tipo:PlanilhaTipo)=>request<{dados:PlanilhaMensal[]}>('/v1/comercial/planilhas/'+tipo),
  salvarPlanilha:(tipo:PlanilhaTipo,mes:string,url:string)=>request<PlanilhaMensal>('/v1/comercial/planilhas/'+tipo+'/'+encodeURIComponent(mes),'PUT',{url}),
  removerPlanilha:(tipo:PlanilhaTipo,mes:string)=>request<void>('/v1/comercial/planilhas/'+tipo+'/'+encodeURIComponent(mes),'DELETE'),
  users:(offset=0)=>request<{dados:UserRow[];limit:number;offset:number}>('/v1/access/users?limit=50&offset='+offset),
  permission:(id:string,data:Permission)=>request<Permission>('/v1/access/'+encodeURIComponent(id)+'/'+data.portal,'PUT',{consultar:data.consultar,administrar:data.administrar})
 };
}
export type Api=ReturnType<typeof createApi>;

