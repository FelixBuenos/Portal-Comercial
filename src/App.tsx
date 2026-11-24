import {isProduction} from './shared/config';
import {useEffect, useState, type FormEvent} from 'react';
import {ArrowLeft, ArrowRight, LockKeyhole, ShieldCheck} from 'lucide-react';
import {configurationReady, useAuth} from './shared/auth';
import {allowed, type Portal} from './shared/types';
import {LinksPanel} from './modules/links/LinksPanel';
import {tipoDaRota, PlanilhasPanel} from './modules/planilhas/PlanilhasPanel';
import {ArquivosPanel} from './modules/arquivos/ArquivosPanel';
import {AccessPanel} from './modules/access/AccessPanel';
import {Mapa} from './modules/novos-negocios/Mapa';
import {SetupPassword} from './modules/auth/SetupPassword';
import {FirstPassword} from './modules/auth/FirstPassword';
import {CommercialHome, CommercialMenu, MarketingHome, marketingCategories, PortalHeader, PortalSelection} from './PortalLayout';
import './portal-visual.css';

function useRoute() {
  const [route, setRoute] = useState(window.location.hash.slice(2) || 'home');
  useEffect(() => {
    const update = () => setRoute(window.location.hash.slice(2) || 'home');
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [route]);
  return route;
}

export function App() {
  const auth = useAuth();
  const route = useRoute();
  if(window.location.pathname==='/auth/setup')return <SetupPassword/>;
  if(!auth.session)return <Login/>;
  if(!auth.profile)return <div className="login-page"><div className="login-card"><Brand/><h1>{auth.loading?'Verificando seu acesso…':'Não foi possível abrir o portal'}</h1><p>{auth.error||'Aguarde enquanto consultamos suas permissões.'}</p>{auth.error&&<button className="primary full" onClick={()=>void auth.refresh()}>Tentar novamente</button>}<button className="secondary full" onClick={()=>void auth.logout()}>Sair da conta</button></div></div>;
  if(auth.profile.trocaObrigatoria)return <FirstPassword api={auth.api} logout={auth.logout}/>;

  const profile = auth.profile;
  const api = auth.api;
  const logout = () => { void auth.logout(); };
  const onAccessChanged = () => { void auth.refresh(); };
  const [section, item] = route.split('/');
  const portal: Portal | undefined = section === 'comercial' || section === 'marketing' || section === 'novos_negocios' ? section : undefined;

  if (portal && !allowed(profile, portal)) {
    return <div className="portal-visual">
      <PortalHeader logout={logout} />
      <main className="portal-content" id="conteudo">
        <div className="surface empty"><LockKeyhole /><h1>Acesso não autorizado</h1>
          <p>Esta conta não tem permissão para abrir este portal.</p><a className="primary" href="#/home">Voltar ao Menu</a>
        </div>
      </main>
    </div>;
  }

  if (portal === 'comercial') {
    const admin = allowed(profile, portal, true);
    const tipo = tipoDaRota(route);
    return <div className="portal-visual commercial-layout">
      <CommercialMenu route={route} logout={logout} />
      <main className={'commercial-workspace' + (tipo || item === 'arquivos-txt' ? ' commercial-tool' : '')} id="conteudo">
        {tipo ? <PlanilhasPanel key={profile.authId + tipo} tipo={tipo} api={api} admin={admin} onAccessChanged={onAccessChanged} /> :
          item === 'arquivos-txt' ? <ArquivosPanel key={profile.authId} api={api} admin={admin} onAccessChanged={onAccessChanged} /> :
          item === 'links' ? <LinksPanel key={profile.authId + portal} portal={portal} api={api} admin={admin} onAccessChanged={onAccessChanged} /> :
          <CommercialHome />}
      </main>
    </div>;
  }

  if (portal === 'marketing') {
    const category = marketingCategories.find(category => category.id === item);
    const admin = allowed(profile, portal, true);
    const showLinks = item === 'links' || !!category;
    return <div className="portal-visual">
      <PortalHeader title={category ? 'Links de Referência' : 'Portal Marketing'} logout={logout}
        back={showLinks ? {href: '#/marketing', label: 'Voltar ao Marketing'} : {href: '#/home', label: 'Voltar ao Menu'}} />
      <main className="marketing-main-container" id="conteudo">
        {showLinks ? <LinksPanel key={profile.authId + route} portal={portal} api={api} admin={admin}
          category={category} onAccessChanged={onAccessChanged} /> : <MarketingHome />}
      </main>
    </div>;
  }

  if (portal === 'novos_negocios') {
    return <div className="portal-visual">
      <header className="business-navbar"><div className="business-navbar-content">
        <div className="business-nav-left"><a href="#/home"><img src="/logo-conviva.png" alt="Rede Conviva" className="business-nav-logo"/></a><span className="business-nav-title">Novos Negócios</span></div>
        <a href="#/home" className="business-back"><ArrowLeft size={18} aria-hidden="true"/>Voltar</a>
      </div></header>
      <main className="portal-content business-content" id="conteudo">
        <Mapa api={api} />
        {allowed(profile,portal,true)&&<details className="business-admin"><summary>Gerenciar links de Novos Negócios</summary>
          <LinksPanel key={profile.authId + portal} portal={portal} api={api} admin onAccessChanged={onAccessChanged} />
        </details>}
      </main>
    </div>;
  }

  if (route === 'access') {
    return <div className="portal-visual">
      <PortalHeader title="Painel Administrativo" logout={logout} back={{href: '#/home', label: 'Voltar ao Menu'}} />
      <main className="portal-content" id="conteudo">
        {profile.mestre ? <AccessPanel key={profile.authId} api={api} onAccessChanged={onAccessChanged} /> :
          <div role="alert" className="surface empty"><h1>Acesso restrito ao administrador mestre</h1><a href="#/home">Voltar ao Menu</a></div>}
      </main>
    </div>;
  }

  return <div className="portal-visual">
    <PortalHeader logout={logout} />
    <PortalSelection profile={profile} />
  </div>;
}

function Brand(){return <img className="brand" src="/logo-conviva.png" alt="Farmácias Conviva"/>;}
function Login(){
 const {login}=useAuth();
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError('');try{await login(email.trim(),password);}catch(e){setError(e instanceof Error?e.message:'Não foi possível entrar.');}finally{setPassword('');setBusy(false);}}
 return <div className="login-page"><section className="login-intro"><Brand/>{!isProduction && <span className="test-badge">AMBIENTE DE TESTE</span>}<h1>Um portal.<br/>Toda a nossa rede.</h1><p>Acesse os materiais de Comercial, Marketing e Novos Negócios com a sua conta.</p><div className="intro-rule"/><small>Portal Rede Conviva</small></section><div className="login-card"><div className="eyebrow">BEM-VINDO</div><h2>Acesse sua conta</h2>{!isProduction && <p>Use somente as contas fictícias deste ambiente.</p>}
  {!configurationReady&&<div role="status" className="message info">A configuração de acesso deste ambiente ainda não foi preenchida. Consulte as instruções de instalação.</div>}
  <form onSubmit={submit} className="form-grid"><label>E-mail<input autoComplete="username" type="email" required value={email} onChange={e=>setEmail(e.target.value)} disabled={busy}/></label><label>Senha<input autoComplete="current-password" type="password" required value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/></label>{error&&<div role="alert" className="message error">{error}</div>}<button className="primary full" disabled={busy||!configurationReady}>{busy?'Entrando…':'Entrar no portal'}<ArrowRight size={17}/></button></form><p className="login-footnote"><ShieldCheck size={16}/>Acesso conforme as permissões da sua conta.</p></div></div>;
}

