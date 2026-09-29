import { supabaseClient } from './servicos/supabaseClient.js';
import { Auth } from './servicos/auth.js';

const Config = {
    MESES_PTBR: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
};

let dadosGeraisCache = []; 

const UI = {
    btnVoltarHub: document.getElementById('btn-voltar-hub'),
    selectMes: document.getElementById('select-mes'),
    selectPlataforma: document.getElementById('select-plataforma'),
    selectArquivo: document.getElementById('select-arquivo'),
    btnBaixar: document.getElementById('btn-baixar-txt')
};

class IntegracaoController {
    static init() {
        this.verificarAcesso();
        this.vincularEventos();
    }

    static async verificarAcesso() {
        const session = await Auth.verificarSessao();
        if (session) {
            this.carregarDadosDoSupabase();
        }
    }

    static vincularEventos() {
        if (UI.btnVoltarHub) {
            UI.btnVoltarHub.addEventListener('click', () => {
                window.location.href = 'hub.html';
            });
        }

        UI.selectMes.addEventListener('change', () => {
            this.atualizarDropdownPlataformas();
        });

        UI.selectPlataforma.addEventListener('change', () => {
            this.atualizarDropdownArquivos();
        });

        UI.selectArquivo.addEventListener('change', () => {
            UI.btnBaixar.disabled = !UI.selectArquivo.value;
        });

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
        try {
            const { data, error } = await supabaseClient
                .from('integracoes')
                .select('data_integracao, sistema_erp, descricao, url_txt')
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
            this.atualizarDropdownPlataformas();
        } catch (err) {
            console.error("Erro ao carregar dados do Supabase:", err);
            UI.selectMes.innerHTML = '<option>Erro de conexão com o banco de dados.</option>';
        }
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
                plataformasUnicas.add(item.sistema_erp);
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
            return item.data_integracao === mesSelecionado && item.sistema_erp === platSelecionada;
        });

        arquivosFiltrados.forEach(item => {
            let option = document.createElement('option');
            option.value = item.url_txt; 
            option.text = item.descricao; 
            UI.selectArquivo.appendChild(option);
        });

        UI.selectArquivo.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => IntegracaoController.init());