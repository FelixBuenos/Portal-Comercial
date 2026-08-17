import { supabaseClient } from '../servicos/supabaseClient.js';

const MATERIAL_MAP = {
    'horario-de-funcionamento': 'Horário de Funcionamento',
    'arte-padrao-do-aplicativo': 'Arte do Aplicativo',
    'arte-padrao-para-aniversario': 'Arte de Aniversário',
    'encartes-mensais': 'Encartes Mensais',
    'arte-padrao-para-delivery': 'Arte para Delivery',
    'arte-padrao-para-convenio': 'Arte para Convênio',
    'cafe-com-marketing': 'Café com Marketing',
    'acao-saude': 'Ação Saúde'
};

const UI = {
    btnVoltar: document.getElementById('btn-voltar-marketing'),
    nomeMaterialTitulo: document.getElementById('nome-material-titulo'),
    containerLinks: document.getElementById('container-links')
};

class DetalheMarketingController {
    static init() {
        this.verificarAcesso();
        this.vincularEventos();
    }

    // Camada de Segurança: Proteção de Rota
    static async verificarAcesso() {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (!session) {
                window.location.href = 'index.html';
            } else {
                this.carregarDados();
            }
        } catch (err) {
            console.error("Erro na verificação de acesso:", err);
            window.location.href = 'index.html';
        }
    }

    static vincularEventos() {
        if (UI.btnVoltar) {
            UI.btnVoltar.addEventListener('click', () => {
                window.location.href = 'marketing.html';
            });
        }

        const btnTutorial = document.getElementById('btn-tutorial-canva');
        const containerTutorial = document.getElementById('tutorial-canva-container');
        if (btnTutorial && containerTutorial) {
            btnTutorial.addEventListener('click', () => {
                if (containerTutorial.style.display === 'none') {
                    containerTutorial.style.display = 'block';
                    btnTutorial.innerText = 'Ocultar Ajuda Visual';
                } else {
                    containerTutorial.style.display = 'none';
                    btnTutorial.innerText = 'Ver Ajuda Visual';
                }
            });
        }
    }

    static getTipoUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('tipo');
    }

    static async carregarDados() {
        const tipo = this.getTipoUrl();
        
        if (!tipo || !MATERIAL_MAP[tipo]) {
            UI.nomeMaterialTitulo.innerText = "Material não encontrado";
            UI.containerLinks.innerHTML = `<div class="no-links-msg">Categoria inválida ou inexistente.</div>`;
            return;
        }

        // Define o título do material
        UI.nomeMaterialTitulo.innerText = MATERIAL_MAP[tipo];

        try {
            // Busca os links vinculados a essa categoria no banco
            const { data, error } = await supabaseClient
                .from('marketing_links')
                .select('descricao, url_drive')
                .eq('tipo_material', tipo)
                .order('id', { ascending: true });

            if (error) {
                console.error("Erro ao carregar links:", error);
                UI.containerLinks.innerHTML = `<div class="no-links-msg">Erro ao carregar as referências.</div>`;
                return;
            }

            if (!data || data.length === 0) {
                UI.containerLinks.innerHTML = `<div class="no-links-msg">Nenhum link de referência disponível para este material no momento.</div>`;
                return;
            }

            this.renderizarLinks(data);

        } catch (err) {
            console.error("Erro de conexão:", err);
            UI.containerLinks.innerHTML = `<div class="no-links-msg">Erro de conexão com o banco de dados.</div>`;
        }
    }

    static renderizarLinks(links) {
        UI.containerLinks.innerHTML = '';
        
        links.forEach(item => {
            const card = document.createElement('div');
            card.className = 'link-item-card';
            
            card.innerHTML = `
                <div class="link-info">
                    <div class="link-title">${item.descricao}</div>
                    <div class="link-url-text">${item.url_drive}</div>
                </div>
                <a href="${item.url_drive}" target="_blank" class="btn-abrir-link">
                    Acessar Link ↗
                </a>
            `;
            
            UI.containerLinks.appendChild(card);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => DetalheMarketingController.init());
