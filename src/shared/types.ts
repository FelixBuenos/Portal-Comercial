export const portals=['comercial','marketing','novos_negocios'] as const;
export type Portal=typeof portals[number];
export const portalNames:Record<Portal,string>={comercial:'Portal Comercial',marketing:'Portal Marketing',novos_negocios:'Portal Novos Negócios'};
export interface Permission {portal:Portal;consultar:boolean;administrar:boolean}
export interface Profile {authId:string;ativo:boolean;mestre:boolean;permissoes:Permission[];trocaObrigatoria?:boolean}
export interface UserRow extends Profile {nome?:string|null;email?:string|null}
export interface InvitationInput {id:string;email:string;permissoes:Permission[];modo?:'email'|'interno'}
export interface Invitation extends InvitationInput {estado:string;authId:string|null}
export type Erp='Alpha7'|'Trier';
export type ArquivoTxtInput={mes:string;erp:Erp;descricao:string;url?:string;nome?:string;base64?:string};
export type ArquivoTxt={id:string;mes:string;erp:Erp;descricao:string;url:string|null;nome:string|null};
export type PlanilhaTipo='encartes'|'ofertas'|'manual'|'materiais-apoio';
export interface PlanilhaMensal {mes:string;url:string}
export interface LinkInput {portal:Portal;categoria:string;descricao:string;url:string;referencia:string|null}
export interface Link extends LinkInput {id:string;criado_em:string;atualizado_em:string}
export function allowed(profile:Profile,portal:Portal,admin=false) {
 return profile.ativo&&(profile.mestre||profile.permissoes.some(p=>p.portal===portal&&(admin?p.administrar:p.consultar)));
}
export function safeWebUrl(value:string):string|null {
 try {const u=new URL(value);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u.href:null;}catch{return null;}
}

