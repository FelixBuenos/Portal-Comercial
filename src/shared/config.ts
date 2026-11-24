const testSupabaseUrl='https://ugkmuyxiigtskrevptrg.supabase.co';
const profile=import.meta.env.VITE_PORTAL_ENV ?? 'test';
export const isProduction=profile==='production';
const configuredUrl=import.meta.env.VITE_SUPABASE_URL;
export const supabaseUrl=isProduction
 ? (typeof configuredUrl==='string' && /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(configuredUrl) && configuredUrl!==testSupabaseUrl ? configuredUrl : null)
 : (profile==='test' && (!configuredUrl || configuredUrl===testSupabaseUrl) ? testSupabaseUrl : null);
export function publicKeyValid(key:string){
 if(key.startsWith('sb_publishable_'))return true;
 if(key.startsWith('ey')){
  try {
   const claims=JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
   return claims.role==='anon' && (!isProduction || (supabaseUrl!==null && claims.ref===new URL(supabaseUrl).hostname.split('.')[0]));
  }catch{return false;}
 }
 return false;
}
export function apiBaseValid(base:string){
 if(base.startsWith('/')&&!base.startsWith('//')&&!base.includes('\\'))return !isProduction;
 try {const u=new URL(base);return !u.username&&!u.password&&(u.protocol==='https:'||(!isProduction&&u.protocol==='http:'&&['127.0.0.1','localhost'].includes(u.hostname)));}catch{return false;}
}

