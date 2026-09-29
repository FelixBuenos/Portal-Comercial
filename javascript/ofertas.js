import { supabaseClient } from './servicos/supabaseClient.js';
import { Auth } from './servicos/auth.js';

const Config = {
    MESES_PTBR: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
};

/* ==========================================================================
   ELEMENTOS DO DOM
   ========================================================================== */
const UI = {
    btnVoltarHub: document.getElementById('btn-voltar-hub'),
    selectMes: document.getElementById('select-mes'),
    btnExportar: document.getElementById('btn-exportar'), 
    iframePlanilha: document.getElementById('iframe-planilha'),
    loader: document.getElementById('loader-planilha')
};

/* ==========================================================================
   CONTROLLER DE OFERTAS
   ========================================================================== */
class OfertasController {
    static init() {
        this.verificarAcesso();
        this.vincularEventos();
    }

    // Camada de Segurança
    static async verificarAcesso() {
        const session = await Auth.verificarSessao();
        if (session) {
            this.carregarDadosDoSupabase();
        }
    }

    static mostrarLoader() {
        if (UI.loader) {
            UI.loader.style.display = 'flex';
            UI.loader.style.opacity = '1';

            if (this.loaderTimeout) clearTimeout(this.loaderTimeout);
            this.loaderTimeout = setTimeout(() => {
                this.ocultarLoader();
            }, 3500);
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

        // Oculta loader quando a planilha Google Sheets terminar de carregar
        if (UI.iframePlanilha) {
            UI.iframePlanilha.addEventListener('load', () => {
                this.ocultarLoader();
            });
        }

        UI.selectMes.addEventListener('change', () => {
            const urlSelecionada = UI.selectMes.value;
            if (urlSelecionada) {
                this.mostrarLoader();
                let iframeUrl = urlSelecionada;
                if (iframeUrl.includes('google.com/spreadsheets') && iframeUrl.includes('/edit')) {
                    iframeUrl = iframeUrl.replace(/\/edit.*/, '/preview');
                } else if ((iframeUrl.includes('sharepoint.com') || iframeUrl.includes('office.com')) && !iframeUrl.includes('action=embedview')) {
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
                    if (urlAtual.includes('/pubhtml')) {
                        urlExportacao = urlAtual.replace(/\/pubhtml.*/, '/pub?output=xlsx');
                    } else if (urlAtual.includes('/pub?')) {
                        urlExportacao = urlAtual.replace(/\/pub\?.*/, '/pub?output=xlsx');
                    } else {
                        urlExportacao = urlAtual.replace(/\/preview|\/edit.*/, '/export?format=xlsx');
                    }
                } 
                // Verifica se é SharePoint / Microsoft
                else if (urlAtual.includes('sharepoint.com') || urlAtual.includes('office.com') || urlAtual.includes('live.com')) {
                    const separador = urlExportacao.includes('?') ? '&' : '?';
                    if (!urlExportacao.includes('download=')) {
                        urlExportacao += `${separador}download=1`;
                    }
                }
                
                // Realiza o download de forma independente na mesma aba
                // Evita problemas de perda de sessão anônima/guest ao abrir nova aba (window.open)
                const a = document.createElement('a');
                a.href = urlExportacao;
                a.download = '';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        });
    }

    static async carregarDadosDoSupabase() {
        try {
            const { data, error } = await supabaseClient
                .from('ofertas')
                .select('data_oferta, url_ofertas')
                .order('data_oferta', { ascending: false });

            if (error) {
                console.error("Erro ao buscar ofertas:", error);
                UI.selectMes.innerHTML = '<option>Erro ao carregar dados.</option>';
                return;
            }

            if (!data || data.length === 0) {
                UI.selectMes.innerHTML = '<option>Nenhuma oferta disponível</option>';
                this.ocultarLoader();
                return;
            }

            UI.selectMes.innerHTML = '';
            data.forEach(item => {
                const [ano, mesStr] = item.data_oferta.split('-');
                const textoMes = `${Config.MESES_PTBR[parseInt(mesStr) - 1]} / ${ano}`;
                
                let option = document.createElement('option');
                option.value = item.url_ofertas;
                option.text = textoMes;
                UI.selectMes.appendChild(option);
            });

            UI.selectMes.disabled = false;
            UI.btnExportar.disabled = false; 

            // Inicializa a primeira planilha com loader ativo
            if (data[0] && data[0].url_ofertas) {
                this.mostrarLoader();
                let iframeUrl = data[0].url_ofertas;
                if (iframeUrl.includes('google.com/spreadsheets') && iframeUrl.includes('/edit')) {
                    iframeUrl = iframeUrl.replace(/\/edit.*/, '/preview');
                } else if ((iframeUrl.includes('sharepoint.com') || iframeUrl.includes('office.com')) && !iframeUrl.includes('action=embedview')) {
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

document.addEventListener('DOMContentLoaded', () => OfertasController.init());