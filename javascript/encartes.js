import { supabaseClient } from './servicos/supabaseClient.js';

const Config = {
    MESES_PTBR: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
};

/* ==========================================================================
   ELEMENTOS DO DOM
   ========================================================================= */
const UI = {
    btnVoltarHub: document.getElementById('btn-voltar-hub'),
    selectMes: document.getElementById('select-mes'),
    btnVisualizar: document.getElementById('btn-visualizar'),
    btnExportar: document.getElementById('btn-exportar'),
    iframePlanilha: document.getElementById('iframe-planilha'),
    loader: document.getElementById('loader-planilha')
};

/* ==========================================================================
   CONTROLLER DE ENCARTES
   ========================================================================== */
class EncartesController {
    static init() {
        this.verificarAcesso();
        this.vincularEventos();
    }

    // Camada de Segurança
    static async verificarAcesso() {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            
            if (!session) {
                window.location.href = 'index.html';
            } else {
                this.carregarDadosDoSupabase();
            }
        } catch (err) {
            console.error("Erro na verificação de acesso:", err);
            window.location.href = 'index.html';
        }
    }

    static mostrarLoader() {
        if (UI.loader) {
            UI.loader.style.display = 'flex';
            UI.loader.style.opacity = '1';
        }
    }

    static ocultarLoader() {
        if (UI.loader) {
            UI.loader.style.opacity = '0';
            setTimeout(() => {
                UI.loader.style.display = 'none';
            }, 300);
        }
    }

    static vincularEventos() {
        UI.btnVoltarHub.addEventListener('click', () => {
            window.location.href = 'hub.html';
        });

        // Oculta loader quando o iframe terminar de carregar os dados do Google Sheets
        if (UI.iframePlanilha) {
            UI.iframePlanilha.addEventListener('load', () => {
                this.ocultarLoader();
            });
        }

        UI.btnVisualizar.addEventListener('click', () => {
            const urlSelecionada = UI.selectMes.value;
            if (urlSelecionada) {
                this.mostrarLoader();
                let iframeUrl = urlSelecionada;
                if ((iframeUrl.includes('sharepoint.com') || iframeUrl.includes('office.com')) && !iframeUrl.includes('action=embedview')) {
                    iframeUrl += iframeUrl.includes('?') ? '&action=embedview' : '?action=embedview';
                }
                UI.iframePlanilha.src = iframeUrl;
            }
        });

        UI.selectMes.addEventListener('change', () => {
            const urlSelecionada = UI.selectMes.value;
            if (urlSelecionada) {
                this.mostrarLoader();
                let iframeUrl = urlSelecionada;
                if ((iframeUrl.includes('sharepoint.com') || iframeUrl.includes('office.com')) && !iframeUrl.includes('action=embedview')) {
                    iframeUrl += iframeUrl.includes('?') ? '&action=embedview' : '?action=embedview';
                }
                UI.iframePlanilha.src = iframeUrl;
            }
        });

        UI.btnExportar.addEventListener('click', () => {
            const urlAtual = UI.selectMes.value;
            if (urlAtual) {
                let urlExportacao = urlAtual;
                
                // Verifica se é Google Sheets
                if (urlAtual.includes('google.com/spreadsheets')) {
                    urlExportacao = urlAtual.replace(/\/preview|\/edit.*/, '/export?format=xlsx');
                } 
                // Verifica se é SharePoint / Microsoft
                else if (urlAtual.includes('sharepoint.com') || urlAtual.includes('office.com') || urlAtual.includes('live.com')) {
                    const separador = urlExportacao.includes('?') ? '&' : '?';
                    if (!urlExportacao.includes('download=')) {
                        urlExportacao += `${separador}download=1`;
                    }
                }
                
                window.open(urlExportacao, '_blank');
            }
        });
    }

    static async carregarDadosDoSupabase() {
        try {
            const { data, error } = await supabaseClient
                .from('planilhas')
                .select('data_encarte, url_google')
                .order('data_encarte', { ascending: false });

            if (error) {
                console.error("Erro ao buscar encartes:", error);
                UI.selectMes.innerHTML = '<option>Erro ao carregar dados.</option>';
                return;
            }

            if (!data || data.length === 0) {
                UI.selectMes.innerHTML = '<option>Nenhum encarte disponível</option>';
                this.ocultarLoader();
                return;
            }

            UI.selectMes.innerHTML = '';
            data.forEach(item => {
                const [ano, mesStr] = item.data_encarte.split('-');
                const textoMes = `${Config.MESES_PTBR[parseInt(mesStr) - 1]} / ${ano}`;
                
                let option = document.createElement('option');
                option.value = item.url_google;
                option.text = textoMes;
                UI.selectMes.appendChild(option);
            });

            UI.selectMes.disabled = false;
            UI.btnExportar.disabled = false; 

            // Inicializa a primeira planilha com loader ativo
            if (data[0] && data[0].url_google) {
                this.mostrarLoader();
                let iframeUrl = data[0].url_google;
                if ((iframeUrl.includes('sharepoint.com') || iframeUrl.includes('office.com')) && !iframeUrl.includes('action=embedview')) {
                    iframeUrl += iframeUrl.includes('?') ? '&action=embedview' : '?action=embedview';
                }
                UI.iframePlanilha.src = iframeUrl;
            } else {
                this.ocultarLoader();
            }

        } catch (err) {
            console.error("Erro ao carregar dados do Supabase:", err);
            UI.selectMes.innerHTML = '<option>Erro de conexão com o banco de dados.</option>';
            this.ocultarLoader();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => EncartesController.init());