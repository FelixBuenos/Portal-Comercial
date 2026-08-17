/* ==========================================================================
   CONFIGURAÇÃO DO SUPABASE
   ========================================================================== */
const Config = {
    SUPABASE_URL: 'https://meeljtyblixcdfymgaym.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZWxqdHlibGl4Y2RmeW1nYXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNjM0NTEsImV4cCI6MjA5NzkzOTQ1MX0.b1sEpavYWZOIKoKAGcPLOgQKT2I8K6kAYBjo-c_dTgo',
    MESES_PTBR: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
};

const supabaseClient = supabase.createClient(Config.SUPABASE_URL, Config.SUPABASE_KEY);

/* ==========================================================================
   ELEMENTOS DO DOM
   ========================================================================== */
const UI = {
    btnVoltarHub: document.getElementById('btn-voltar-hub'),
    selectMes: document.getElementById('select-mes'),
    btnVisualizar: document.getElementById('btn-visualizar'),
    btnExportar: document.getElementById('btn-exportar'), // <-- Botão mapeado aqui
    iframePlanilha: document.getElementById('iframe-planilha')
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
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            window.location.href = 'index.html';
        } else {
            this.carregarDadosDoSupabase();
        }
    }

    static vincularEventos() {
        // Botão de Retorno
        UI.btnVoltarHub.addEventListener('click', () => {
            window.location.href = 'hub.html';
        });

        // Botão para forçar atualização do Iframe
        UI.btnVisualizar.addEventListener('click', () => {
            const urlSelecionada = UI.selectMes.value;
            if (urlSelecionada) {
                UI.iframePlanilha.src = urlSelecionada;
            }
        });

        // Atualizar automaticamente ao selecionar no dropdown
        UI.selectMes.addEventListener('change', () => {
            const urlSelecionada = UI.selectMes.value;
            if (urlSelecionada) {
                UI.iframePlanilha.src = urlSelecionada;
            }
        });

        // NOVO: Evento Mágico de Exportação para Excel
        UI.btnExportar.addEventListener('click', () => {
            const urlAtual = UI.selectMes.value;
            if (urlAtual) {
                // Substitui a visualização pelo link de download do Excel
                const urlExportacao = urlAtual.replace(/\/preview|\/edit.*/, '/export?format=xlsx');
                
                // Abre o link e força o download
                window.open(urlExportacao, '_blank');
            }
        });
    }

    static async carregarDadosDoSupabase() {
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
            return;
        }

        // Limpa o select e preenche com os meses
        UI.selectMes.innerHTML = '';
        data.forEach(item => {
            const [ano, mesStr] = item.data_encarte.split('-');
            const textoMes = `${Config.MESES_PTBR[parseInt(mesStr) - 1]} / ${ano}`;
            
            let option = document.createElement('option');
            option.value = item.url_google;
            option.text = textoMes;
            UI.selectMes.appendChild(option);
        });

        // Libera os controles
        UI.selectMes.disabled = false;
        UI.btnVisualizar.disabled = false;
        UI.btnExportar.disabled = false; // <-- Ativa o botão de exportar
        
        // Carrega o primeiro encarte (o mais recente)
        UI.iframePlanilha.src = data[0].url_google;
    }
}

// Inicia a aplicação quando a página carregar
document.addEventListener('DOMContentLoaded', () => EncartesController.init());