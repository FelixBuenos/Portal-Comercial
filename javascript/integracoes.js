/* ==========================================================================
   CONFIGURAÇÃO DO SUPABASE
   ========================================================================== */
const Config = {
    SUPABASE_URL: 'https://meeljtyblixcdfymgaym.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZWxqdHlibGl4Y2RmeW1nYXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNjM0NTEsImV4cCI6MjA5NzkzOTQ1MX0.b1sEpavYWZOIKoKAGcPLOgQKT2I8K6kAYBjo-c_dTgo',
    MESES_PTBR: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
};

const supabaseClient = supabase.createClient(Config.SUPABASE_URL, Config.SUPABASE_KEY);

let dadosGeraisCache = []; 

/* ==========================================================================
   ELEMENTOS DO DOM
   ========================================================================== */
const UI = {
    btnVoltarHub: document.getElementById('btn-voltar-hub'),
    selectMes: document.getElementById('select-mes'),
    selectPlataforma: document.getElementById('select-plataforma'), // NOVO
    selectArquivo: document.getElementById('select-arquivo'),       // ANTIGO selectSistema
    btnBaixar: document.getElementById('btn-baixar-txt')
};

/* ==========================================================================
   CONTROLLER DE INTEGRAÇÃO
   ========================================================================== */
class IntegracaoController {
    static init() {
        this.verificarAcesso();
        this.vincularEventos();
    }

    static async verificarAcesso() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            window.location.href = 'index.html';
        } else {
            this.carregarDadosDoSupabase();
        }
    }

    // MÁGICA QUE SEPARA OS SISTEMAS PELO NOME
    static identificarPlataforma(nomeSistema) {
        const nome = nomeSistema.toUpperCase();
        if (nome.includes('ALPHA7')) return 'Alpha7';
        if (nome.includes('TRIER')) return 'Trier';
        return 'Outros';
    }

    static vincularEventos() {
        UI.btnVoltarHub.addEventListener('click', () => {
            window.location.href = 'hub.html';
        });

        // 1. Mudou o Mês -> Atualiza as Plataformas (Alpha7/Trier)
        UI.selectMes.addEventListener('change', () => {
            this.atualizarDropdownPlataformas();
        });

        // 2. Mudou a Plataforma -> Atualiza os Arquivos (App/Encarte)
        UI.selectPlataforma.addEventListener('change', () => {
            this.atualizarDropdownArquivos();
        });

        // 3. Mudou o Arquivo -> Libera o botão de Download
        UI.selectArquivo.addEventListener('change', () => {
            UI.btnBaixar.disabled = !UI.selectArquivo.value;
        });

        // Evento de Download
        UI.btnBaixar.addEventListener('click', async () => {
            const urlArquivo = UI.selectArquivo.value;
            
            if (!urlArquivo) return;

            try {
                const textoOriginal = UI.btnBaixar.innerText;
                UI.btnBaixar.innerText = "Baixando...";
                UI.btnBaixar.disabled = true;
                
                const resposta = await fetch(urlArquivo);
                const blob = await resposta.blob();
                
                const linkTemporario = document.createElement('a');
                const urlBlob = window.URL.createObjectURL(blob);
                
                linkTemporario.href = urlBlob;
                const nomeArquivo = decodeURIComponent(urlArquivo.split('/').pop());
                linkTemporario.download = nomeArquivo;
                
                document.body.appendChild(linkTemporario);
                linkTemporario.click();
                
                document.body.removeChild(linkTemporario);
                window.URL.revokeObjectURL(urlBlob);
                
                UI.btnBaixar.innerText = textoOriginal;
                UI.btnBaixar.disabled = false;

            } catch (erro) {
                console.error("Erro no download:", erro);
                alert("Erro ao tentar baixar o arquivo.");
                UI.btnBaixar.innerText = "Baixar TXT";
                UI.btnBaixar.disabled = false;
            }
        });
    }

    static async carregarDadosDoSupabase() {
        const { data, error } = await supabaseClient
            .from('integracoes')
            .select('data_integracao, tipo_sistema, url_txt')
            .order('data_integracao', { ascending: false });

        if (error || !data || data.length === 0) {
            UI.selectMes.innerHTML = '<option>Nenhum dado encontrado</option>';
            return;
        }

        dadosGeraisCache = data;

        UI.selectMes.innerHTML = '';
        const mesesInseridos = new Set();

        data.forEach(item => {
            if (!mesesInseridos.has(item.data_integracao)) {
                mesesInseridos.add(item.data_integracao);
                const [ano, mesStr] = item.data_integracao.split('-');
                const textoMes = `${Config.MESES_PTBR[parseInt(mesStr) - 1]} / ${ano}`;
                
                let option = document.createElement('option');
                option.value = item.data_integracao;
                option.text = textoMes;
                UI.selectMes.appendChild(option);
            }
        });

        UI.selectMes.disabled = false;
        
        // Dispara a cascata de atualização
        this.atualizarDropdownPlataformas();
    }

    static atualizarDropdownPlataformas() {
        const mesSelecionado = UI.selectMes.value;
        UI.selectPlataforma.innerHTML = '<option value="">Selecione...</option>';
        UI.selectArquivo.innerHTML = '<option value="">Selecione o arquivo...</option>';
        UI.selectPlataforma.disabled = true;
        UI.selectArquivo.disabled = true;
        UI.btnBaixar.disabled = true;
        
        const dadosDoMes = dadosGeraisCache.filter(item => item.data_integracao === mesSelecionado);

        if (dadosDoMes.length > 0) {
            const plataformasUnicas = new Set();
            dadosDoMes.forEach(item => {
                plataformasUnicas.add(this.identificarPlataforma(item.tipo_sistema));
            });

            plataformasUnicas.forEach(plat => {
                let option = document.createElement('option');
                option.value = plat;
                option.text = plat;
                UI.selectPlataforma.appendChild(option);
            });

            UI.selectPlataforma.disabled = false;
        }
    }

    static atualizarDropdownArquivos() {
        const mesSelecionado = UI.selectMes.value;
        const platSelecionada = UI.selectPlataforma.value;
        
        UI.selectArquivo.innerHTML = '<option value="">Selecione o arquivo...</option>';
        UI.btnBaixar.disabled = true;

        if (!platSelecionada) {
            UI.selectArquivo.disabled = true;
            return;
        }

        const arquivosFiltrados = dadosGeraisCache.filter(item => {
            return item.data_integracao === mesSelecionado && 
                   this.identificarPlataforma(item.tipo_sistema) === platSelecionada;
        });

        arquivosFiltrados.forEach(item => {
            let option = document.createElement('option');
            option.value = item.url_txt; 
            option.text = item.tipo_sistema; 
            UI.selectArquivo.appendChild(option);
        });

        UI.selectArquivo.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => IntegracaoController.init());