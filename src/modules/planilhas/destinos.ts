export function destinos(value:string) {
 const empty={original:null,previa:null,xlsx:null,download:null};
 let url:URL;
 try{url=new URL(value);}catch{return empty;}
 if(url.protocol!=='https:'||url.username||url.password)return empty;
 const original=url.href;
 const result={...empty,original};
 if(url.port)return result;
 if(url.hostname==='docs.google.com'){
  const match=/^\/spreadsheets\/d\/(?:e\/[\w-]+|[\w-]+)\/(edit|preview|view|pub|pubhtml|export)\/?$/.exec(url.pathname);
  if(!match)return result;
  const path=url.pathname.replace(/\/[^/]+\/?$/,'');
  const published=path.startsWith('/spreadsheets/d/e/')||['pub','pubhtml'].includes(match[1]!);
  const base=url.origin+path;
  const preview=new URL(base+(published?'/pubhtml':'/preview'));
  const download=new URL(base+(published?'/pub':'/export'));
  download.searchParams.set(published?'output':'format','xlsx');
  const gid=url.searchParams.get('gid')??new URLSearchParams(url.hash.slice(1)).get('gid');
  if(gid&&/^\d+$/.test(gid))for(const target of [preview,download])target.searchParams.set('gid',gid);
  for(const key of ['resourcekey','range','single','widget','headers','chrome']){
   const param=url.searchParams.get(key);
   if(param!==null)preview.searchParams.set(key,param);
   if(key==='resourcekey'&&param!==null)download.searchParams.set(key,param);
  }
  return {...result,previa:preview.href,xlsx:download.href};
 }
 if(['farmaciasconviva.sharepoint.com','farmaciasconviva-my.sharepoint.com'].includes(url.hostname)){
  const preview=new URL(original),download=new URL(original);
  preview.searchParams.set('action','embedview');
  download.searchParams.set('download','1');
  return {...result,previa:preview.href,download:download.href};
 }
 return result;
}