import {useEffect,useRef,type ReactNode} from 'react';
export function Modal({title,children,onClose,busy=false}:{title:string;children:ReactNode;onClose:()=>void;busy?:boolean}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{ref.current?.showModal();return ()=>ref.current?.close();},[]);
 return <dialog ref={ref} aria-label={title} onCancel={e=>{e.preventDefault();if(!busy)onClose();}}>
  <div className="dialog-heading"><h2>{title}</h2><button className="icon-button" aria-label="Fechar" disabled={busy} onClick={onClose}>×</button></div>{children}
 </dialog>;
}

