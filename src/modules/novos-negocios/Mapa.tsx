import {useEffect, useState} from 'react';
import {Download, Map} from 'lucide-react';
import type {Api} from '../../shared/api';
import type {Link} from '../../shared/types';

export function Mapa({api}: {api: Api}) {
  const [links, setLinks] = useState<Link[]>([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        const todos: Link[] = [];
        let offset = 0;
        while (true) {
          const pagina = await api.links('novos_negocios', offset);
          todos.push(...pagina.dados);
          if (pagina.dados.length < pagina.limit) break;
          offset += pagina.dados.length;
        }
        if (ativo) setLinks(todos);
      } catch {
        if (ativo) setErro('Não foi possível carregar o mapa e a planilha.');
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    void carregar();
    return () => { ativo = false; };
  }, [api]);

  const mapa = links.find(link => link.categoria === 'mapa-looker');
  const planilha = links.find(link => link.categoria === 'planilha-novos-negocios');
  let mapaUrl: URL | undefined;
  let planilhaUrl: URL | undefined;
  try {
    if (mapa) mapaUrl = new URL(mapa.url);
    if (planilha) planilhaUrl = new URL(planilha.url);
  } catch { /* Um endereço inválido é tratado como indisponível. */ }
  const mapaSeguro = mapaUrl?.protocol === 'https:' && !mapaUrl.username && !mapaUrl.password && mapaUrl.hostname === 'datastudio.google.com';
  const planilhaSegura = planilhaUrl?.protocol === 'https:' && !planilhaUrl.username && !planilhaUrl.password && planilhaUrl.hostname === 'farmaciasconviva-my.sharepoint.com';

  return <>
    <div className="page-header">
      <h1>Mapa de Novos Negócios</h1>
      <p>Explore as empresas conveniadas e oportunidades de expansão através do nosso mapa interativo.</p>
    </div>
    <section className="planilha-panel" aria-label="Mapa e planilha">
      <div className="panel-header">
        <h2 className="panel-title"><Map aria-hidden="true" />Mapa Interativo - Looker Studio</h2>
        {planilhaSegura && <a className="btn-discreet" href={planilhaUrl!.href} target="_blank" rel="noopener noreferrer">
          <Download size={16} aria-hidden="true" />Planilha Excel
        </a>}
      </div>
      {carregando && <p role="status">Carregando mapa e planilha…</p>}
      {erro && <p role="alert">{erro}</p>}
      {!carregando && !erro && <>
        {!planilhaSegura && <p>Planilha indisponível.</p>}
        {mapaSeguro ? <div className="iframe-wrapper">
          <iframe title="Mapa interativo de Novos Negócios" src={mapaUrl!.href} referrerPolicy="no-referrer" sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" />
        </div> : <p>Mapa indisponível.</p>}
      </>}
    </section>
  </>;
}
