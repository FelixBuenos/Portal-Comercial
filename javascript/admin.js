import { supabaseClient } from './servicos/supabaseClient.js';

const UI = {
    btnVoltar: document.getElementById('btn-voltar-modulo'),
    btnSalvar: document.getElementById('btn-salvar'),
    btnAdicionarLinha: document.getElementById('btn-adicionar-linha'),
    selectMaterial: document.getElementById('select-material'),
    linksContainer: document.getElementById('links-dinamicos-container'),
    alertSuccess: document.getElementById('alert-success'),
    alertError: document.getElementById('alert-error')
};

class AdminController {
    static init() {
        this.verificarAcesso();
        this.vincularEventos();
        this.carregarLinksDoMaterial();
    }

    // Camada de Segurança: Bloqueia acesso se não for administrador marketing ou mestre
    static async verificarAcesso() {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (!session) {
                window.location.href = 'index.html';
                return;
            }

            // Verifica permissão e função na tabela usuarios_admin
            const { data, error } = await supabaseClient
                .from('usuarios_admin')
                .select('funcao')
                .eq('email', session.user.email)
                .maybeSingle();

            const funcao = data ? data.funcao : null;

            if (error || !data || (funcao !== 'marketing' && funcao !== 'mestre')) {
                alert("Acesso Negado: Apenas administradores do Marketing têm permissão para acessar esta página.");
                window.location.href = 'marketing.html';
            }
        } catch (err) {
            console.error("Erro na verificação de acesso:", err);
            window.location.href = 'index.html';
        }
    }

    static vincularEventos() {
        if (UI.btnVoltar) {
            UI.btnVoltar.addEventListener('click', () => {
                window.location.href = 'selecao-modulo.html';
            });
        }

        if (UI.selectMaterial) {
            UI.selectMaterial.addEventListener('change', () => {
                this.carregarLinksDoMaterial();
            });
        }

        if (UI.btnAdicionarLinha) {
            UI.btnAdicionarLinha.addEventListener('click', () => {
                this.adicionarLinhaInput('', '');
            });
        }

        if (UI.btnSalvar) {
            UI.btnSalvar.addEventListener('click', () => {
                this.salvarLinks();
            });
        }
    }

    // Adiciona uma linha de inputs para descrição e URL no container
    static adicionarLinhaInput(descricao = '', url = '') {
        const row = document.createElement('div');
        row.className = 'link-row';

        row.innerHTML = `
            <div class="row-desc">
                <input type="text" class="form-control input-descricao" value="${descricao}" placeholder="Descrição do link (ex: Feriado)">
            </div>
            <div class="row-url">
                <input type="url" class="form-control input-url" value="${url}" placeholder="Link de Template do Canva (https://...)">
            </div>
            <button type="button" class="btn-remover-linha">Excluir</button>
        `;

        // Evento do botão de remover linha
        const btnRemover = row.querySelector('.btn-remover-linha');
        btnRemover.addEventListener('click', () => {
            row.remove();
            // Se o container esvaziar, adiciona uma linha vazia padrão
            if (UI.linksContainer.children.length === 0) {
                this.adicionarLinhaInput('', '');
            }
        });

        UI.linksContainer.appendChild(row);
    }

    // Busca os links cadastrados para o material selecionado
    static async carregarLinksDoMaterial() {
        const material = UI.selectMaterial.value;
        if (!material) return;

        this.limparAlertas();
        UI.linksContainer.innerHTML = '';

        try {
            const { data, error } = await supabaseClient
                .from('marketing_links')
                .select('descricao, url_drive')
                .eq('tipo_material', material)
                .order('id', { ascending: true });

            if (error) {
                console.error("Erro ao carregar dados:", error);
                return;
            }

            if (data && data.length > 0) {
                data.forEach(item => {
                    this.adicionarLinhaInput(item.descricao, item.url_drive);
                });
            } else {
                // Se não houver dados, inicia com uma linha vazia padrão
                this.adicionarLinhaInput('', '');
            }
        } catch (err) {
            console.error("Erro na requisição dos dados:", err);
            this.adicionarLinhaInput('', '');
        }
    }

    // Salva a lista de links para o material selecionado no Supabase
    static async salvarLinks() {
        const material = UI.selectMaterial.value;
        if (!material) return;

        this.limparAlertas();
        
        UI.btnSalvar.disabled = true;
        UI.btnSalvar.innerText = "Salvando...";

        const rows = UI.linksContainer.querySelectorAll('.link-row');
        const novosRegistros = [];

        // Coleta os valores de todas as linhas de input
        rows.forEach(row => {
            const desc = row.querySelector('.input-descricao').value.trim();
            const url = row.querySelector('.input-url').value.trim();

            // Só salva linhas que tiverem tanto a descrição quanto a URL preenchidas
            if (desc && url) {
                novosRegistros.push({
                    tipo_material: material,
                    descricao: desc,
                    url_drive: url
                });
            }
        });

        try {
            // 1. Deleta os registros antigos daquele tipo de material
            const { error: deleteError } = await supabaseClient
                .from('marketing_links')
                .delete()
                .eq('tipo_material', material);

            if (deleteError) {
                console.error("Erro ao limpar links anteriores:", deleteError);
                this.exibirAlerta(UI.alertError);
                UI.btnSalvar.disabled = false;
                UI.btnSalvar.innerText = "Salvar Links do Material";
                return;
            }

            // 2. Insere a lista de novos registros (caso exista algum)
            if (novosRegistros.length > 0) {
                const { error: insertError } = await supabaseClient
                    .from('marketing_links')
                    .insert(novosRegistros);

                if (insertError) {
                    console.error("Erro ao inserir novos links:", insertError);
                    this.exibirAlerta(UI.alertError);
                    UI.btnSalvar.disabled = false;
                    UI.btnSalvar.innerText = "Salvar Links do Material";
                    return;
                }
            }

            // 3. Sucesso: Exibe mensagem de êxito e redireciona
            this.exibirAlerta(UI.alertSuccess);
            setTimeout(() => {
                window.location.href = 'selecao-modulo.html';
            }, 1500);

        } catch (err) {
            console.error("Erro na comunicação ao salvar:", err);
            this.exibirAlerta(UI.alertError);
            UI.btnSalvar.disabled = false;
            UI.btnSalvar.innerText = "Salvar Links do Material";
        }
    }

    static limparAlertas() {
        if (UI.alertSuccess) UI.alertSuccess.style.display = 'none';
        if (UI.alertError) UI.alertError.style.display = 'none';
    }

    static exibirAlerta(alertaElement) {
        if (alertaElement) {
            alertaElement.style.display = 'block';
            setTimeout(() => {
                alertaElement.style.display = 'none';
            }, 5000);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => AdminController.init());
