export interface SetupCredentials {access_token:string;refresh_token:string}
export function captureSetup(location:Pick<Location,'pathname'|'hash'|'search'>,history:Pick<History,'replaceState'>):SetupCredentials|null {
 if(location.pathname!=='/auth/setup')return null;
 const values=new URLSearchParams(location.hash.slice(1));
 const search=location.search;
 // Limpar inclusive erros e links adulterados antes de qualquer chamada de rede.
 history.replaceState(null,'','/auth/setup');
 const access_token=values.get('access_token')??'',refresh_token=values.get('refresh_token')??'';
 if(search||values.has('error')||values.get('type')!=='recovery'||!access_token||!refresh_token||access_token.length>16384||refresh_token.length>4096)return null;
 return {access_token,refresh_token};
}
