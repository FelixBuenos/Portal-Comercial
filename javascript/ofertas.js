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
    btnExportar: document.getElementById('btn-exportar'), 
    iframePlanilha: document.getElementById('iframe-planilha')
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
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            window.location.href = 'index.html';
        } else {
            this.carregarDadosDoSupabase();
        }
    }

    static vincularEventos() {
        // Botão de Retorno ao Hub
        UI.btnVoltarHub.addEventListener('click', () => {
            window.location.href = 'hub.html';
        });

        // Atualiza automaticamente a planilha ao trocar o mês no dropdown
        UI.selectMes.addEventListener('change', () => {
            const urlSelecionada = UI.selectMes.value;
            if (urlSelecionada) {
                UI.iframePlanilha.src = urlSelecionada;
            }
        });

        // Exportação para Excel
        UI.btnExportar.addEventListener('click', () => {
            const urlAtual = UI.selectMes.value;
            if (urlAtual) {
                // Substitui preview/edit pela URL de exportação do Excel
                const urlExportacao = urlAtual.replace(/\/preview|\/edit.*/, '/export?format=xlsx');
                window.open(urlExportacao, '_blank');
            }
        });
    }

    static async carregarDadosDoSupabase() {
        // Busca na tabela de ofertas ordenando pela data mais recente
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

        // Libera os controles
        UI.selectMes.disabled = false;
        UI.btnExportar.disabled = false; 
        
        // Abre automaticamente a oferta mais recente
        UI.iframePlanilha.src = data[0].url_ofertas;
    }
}

document.addEventListener('DOMContentLoaded', () => OfertasController.init());