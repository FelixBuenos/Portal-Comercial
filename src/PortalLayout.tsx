import {ArrowLeft, BookOpen, FileSpreadsheet, FolderOpen, LayoutDashboard, LogOut, Newspaper, Tag} from 'lucide-react';
import {allowed, portalNames, portals, type Profile} from './shared/types';

const modules = {
  comercial: ['Comercial', 'azul', 'Acesse encartes, links de ofertas vigentes e realize a exportação de arquivos TXT de integração das filiais.'],
  marketing: ['Marketing', 'verde', 'Acesse o material de apoio, artes padrão para redes sociais, campanhas de aniversário, delivery e convênios.'],
  novos_negocios: ['Novos Negócios', 'vermelho', 'Acesse a planilha com o endereço das empresas conveniadas e oportunidades de negócios.'],
} as const;

const commercialItems = [
  {route: 'comercial/encartes', nav: 'Encartes', title: 'Visualizar Encartes', theme: 'encartes', icon: Newspaper, description: 'Acesse rapidamente todas as planilhas de encartes comerciais ativos e programados.'},
  {route: 'comercial/ofertas', nav: 'Ofertas', title: 'Visualizar Ofertas', theme: 'ofertas', icon: Tag, description: 'Verifique os links de ofertas vigentes e garanta as margens comerciais em loja.'},
  {route: 'comercial/arquivos-txt', nav: 'Integração TXT', title: 'Integração TXT', theme: 'integracao', icon: FileSpreadsheet, description: 'Exporte e faça download dos arquivos TXT para alimentar os sistemas gerenciais.'},
  {route: 'comercial/manual', nav: 'Manual de Ações', title: 'Manual de Ações', theme: 'manual', icon: BookOpen, description: 'Consulte manuais e normas de ações comerciais estabelecidas para o mês.'},
  {route: 'comercial/materiais-apoio', nav: 'Materiais de Apoio', title: 'Materiais de Apoio', theme: 'materiais', icon: FolderOpen, description: 'Acesse conteúdos complementares e arquivos de suporte exclusivos do departamento comercial correspondentes ao mês.'},
];

export const marketingCategories = [
  {id: 'horario-de-funcionamento', tag: 'Operações', title: 'Horário de Funcionamento', description: 'Artes oficiais no padrão da rede para divulgação de horários normais, feriados e plantões.'},
  {id: 'arte-padrao-do-aplicativo', tag: 'Campanhas', title: 'Arte do Aplicativo', description: 'Banners e posts de incentivo para download do aplicativo oficial de ofertas e fidelidade Conviva.'},
  {id: 'arte-padrao-para-aniversario', tag: 'Institucional', title: 'Arte de Aniversário', description: 'Materiais decorativos e artes institucionais voltadas para as campanhas de aniversário das filiais.'},
  {id: 'encartes-mensais', tag: 'Mensal', title: 'Encartes Mensais', description: 'Acesse o encarte oficial completo com o tablóide de ofertas ativo para o mês vigente.'},
  {id: 'arte-padrao-para-delivery', tag: 'Vendas', title: 'Arte para Delivery', description: 'Materiais de divulgação do Tele-entrega e links diretos para pedidos via WhatsApp das lojas.'},
  {id: 'arte-padrao-para-convenio', tag: 'Parcerias', title: 'Arte para Convênio', description: 'Cards informativos e panfletos digitais para divulgação de planos corporativos e parcerias.'},
  {id: 'cafe-com-marketing', tag: 'Eventos', title: 'Café com Marketing', description: 'Material de apoio, apresentações e novidades compartilhadas nos encontros do Café com Marketing.'},
  {id: 'acao-saude', tag: 'Campanhas', title: 'Ação Saúde', description: 'Artes e panfletos informativos para campanhas de saúde preventiva e eventos de bem-estar nas lojas.'},
  {id: 'tag-de-materiais', tag: 'Materiais', title: 'TAG de Materiais', description: 'Acesso a modelos, etiquetas e tags padronizadas para comunicação visual nas lojas.'},
  {id: 'vitaminas-convi', tag: 'Produtos', title: 'Vitaminas Convi', description: 'Materiais promocionais, lâminas informativas e artes de divulgação da linha Vitaminas Convi.'},
];

export function PortalHeader({title, back, logout}: {title?: string; back?: {href: string; label: string}; logout: () => void}) {
  return <header className="hub-navbar">
    <div className="nav-container">
      <a href="#/home"><img src="/logo-conviva.png" alt="Rede Conviva" className="nav-logo" /></a>
      {title && <span className="nav-title">{title}</span>}
      <div className="nav-actions">
        {back && <a className="btn-voltar" href={back.href}><ArrowLeft size={16} aria-hidden="true"/>{back.label}</a>}
        <button className="portal-logout" onClick={logout}><LogOut size={16} aria-hidden="true"/>Sair</button>
      </div>
    </div>
  </header>;
}

export function PortalSelection({profile}: {profile: Profile}) {
  return <main className="hub-main-container" id="conteudo">
    <div className="hub-intro">
      <h1 className="hub-main-title">Selecione o Módulo</h1>
      <p className="hub-subtitle">Escolha qual ecossistema você deseja acessar no momento.</p>
    </div>
    <div className="hub-grid">
      {portals.map(portal => {
        const [name, color, description] = modules[portal];
        const canOpen = allowed(profile, portal);
        return <section key={portal} className={'card-modulo ' + portal.replace('_', '-') + (canOpen ? '' : ' card-restricted')}>
          <h2 className="card-title">{portalNames[portal]}</h2>
          <p className="card-description">{canOpen ? description : 'Acesso restrito para o seu perfil.'}</p>
          {canOpen ? <a href={'#/' + portal} className={'btn-action btn-action-' + color}>Acessar {name}</a> :
            <button className="btn-action" disabled>Acesso Negado</button>}
        </section>;
      })}
    </div>
    {profile.mestre && <a className="btn-voltar portal-access" href="#/access">Usuários e acessos</a>}
  </main>;
}

export function CommercialMenu({route, logout}: {route: string; logout: () => void}) {
  const navItems = [
    {route: 'comercial', nav: 'Início', icon: LayoutDashboard},
    ...commercialItems,
  ];
  return <aside className="commercial-sidebar">
    <div className="sidebar-title">Menu Comercial</div>
    <nav className="nav-menu" aria-label="Menu Comercial">
      {navItems.map(({route: path, nav, icon: Icon}) => <a key={path} href={'#/' + path}
        className={'nav-item' + (route === path ? ' active' : '')}
        aria-current={route === path ? 'page' : undefined}><Icon size={21} aria-hidden="true" />{nav}</a>)}
    </nav>
    <div className="sidebar-footer">
      <a href="#/home" className="nav-item"><ArrowLeft size={21} aria-hidden="true"/>Voltar ao Menu</a>
      <button onClick={logout} className="nav-item danger"><LogOut size={21} aria-hidden="true"/>Sair</button>
    </div>
  </aside>;
}

export function CommercialHome() {
  return <>
    <div className="welcome-header">
      <h1>Portal Comercial</h1>
      <p>Selecione um dos módulos abaixo ou utilize o menu lateral para gerenciar as rotinas de ofertas, encartes e integrações.</p>
    </div>
    <div className="widgets-grid">
      {commercialItems.map(({route, theme, icon: Icon, title, description}) => <a key={route} href={'#/' + route} className={'widget-card card-' + theme}>
        <div className="icon-wrapper"><Icon aria-hidden="true" /></div>
        <div className="widget-info"><h2>{title}</h2><p>{description}</p><span className="card-action">Acessar módulo</span></div>
      </a>)}
    </div>
  </>;
}

export function MarketingHome() {
  return <>
    <div className="marketing-intro">
      <h1 className="marketing-main-title">Artes e Materiais de Marketing</h1>
      <p className="marketing-subtitle">Selecione o indicador abaixo para acessar as pastas de downloads e materiais.</p>
    </div>
    <div className="marketing-grid">
      {marketingCategories.map(({id, tag, title, description}) => <section className="card-material" key={id}>
        <div><div className="tag-categoria">{tag}</div><h2 className="material-title">{title}</h2><p className="material-description">{description}</p></div>
        <a className="btn-acesso-arte" href={'#/marketing/' + id}><FolderOpen size={17} aria-hidden="true"/>Acessar Links</a>
      </section>)}
    </div>
  </>;
}
