import { supabaseClient } from './servicos/supabaseClient.js';

const UI = {
    btnVoltar: document.getElementById('btn-voltar-hub'),
    btnSalvar: document.getElementById('btn-salvar'),
    btnAdicionarTxt: document.getElementById('btn-adicionar-txt'),
    inputMes: document.getElementById('input-mes'),
    
    inputEncarte: document.getElementById('input-encarte'),
    inputOfertas: document.getElementById('input-ofertas'),
    
    txtContainer: document.getElementById('txt-dinamicos-container'),
    
    alertSuccess: document.getElementById('alert-success'),
    alertError: document.getElementById('alert-error')
};

class AdminComercialController {
    static init() {
        this.verificarAcesso();
        this.vincularEventos();
        this.definirMesAtual();
    }

    // Camada de Segurança: Bloqueia acesso se não for administrador comercial ou mestre
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

            if (error || !data || (funcao !== 'comercial' && funcao !== 'mestre')) {
                alert("Acesso Negado: Apenas administradores do Comercial têm permissão para acessar esta página.");
                window.location.href = 'hub.html';
            }
        } catch (err) {
            console.error("Erro na verificação de acesso:", err);
            window.location.href = 'index.html';
        }
    }

    static vincularEventos() {
        if (UI.btnVoltar) {
            UI.btnVoltar.addEventListener('click', () => {
                window.location.href = 'hub.html';
            });
        }

        if (UI.inputMes) {
            UI.inputMes.addEventListener('change', () => {
                this.carregarDadosDoMes();
            });
        }

        if (UI.btnAdicionarTxt) {
            UI.btnAdicionarTxt.addEventListener('click', () => {
                this.adicionarLinhaTxtInput('Alpha7', '', '');
            });
        }

        if (UI.btnSalvar) {
            UI.btnSalvar.addEventListener('click', () => {
                this.salvarDadosComerciais();
            });
        }
    }

    static definirMesAtual() {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        
        if (UI.inputMes) {
            UI.inputMes.value = `${ano}-${mes}`;
            this.carregarDadosDoMes();
        }
    }

    // Adiciona uma linha dinâmica de arquivo TXT
    static adicionarLinhaTxtInput(erp = 'Alpha7', descricao = '', url = '') {
        const row = document.createElement('div');
        row.className = 'upload-row';

        row.innerHTML = `
            <div class="upload-row-title" style="display: flex; gap: 15px; align-items: center; justify-content: space-between; flex-wrap: wrap;">
                <div style="display: flex; gap: 10px; align-items: center; flex: 1;">
                    <select class="form-control select-erp" style="max-width: 150px; padding: 6px 12px; height: auto;">
                        <option value="Alpha7" ${erp === 'Alpha7' ? 'selected' : ''}>Alpha7</option>
                        <option value="Trier" ${erp === 'Trier' ? 'selected' : ''}>Trier</option>
                    </select>
                    <input type="text" class="form-control input-descricao" value="${descricao}" placeholder="Descrição (ex: App, Encarte, Pampers)" style="padding: 6px 12px; height: auto; flex: 1;">
                </div>
                <button type="button" class="btn-remover-linha" style="background: #dc2626; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">Excluir</button>
            </div>
            <div class="file-input-wrapper" style="margin-top: 10px;">
                <input type="file" class="form-control file-input" accept=".txt">
                <span class="status-badge status-none">Sem arquivo</span>
            </div>
            <input type="url" class="form-control input-url" value="${url}" placeholder="Ou cole a URL direta do arquivo TXT">
        `;

        // Manipulação do badge de status ao selecionar arquivo
        const fileInput = row.querySelector('.file-input');
        const badge = row.querySelector('.status-badge');
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                badge.className = 'status-badge status-uploaded';
                badge.innerText = 'Pronto para Upload';
            }
        });

        // Se já existia um link gravado, muda o status para Cadastrado
        if (url) {
            badge.className = 'status-badge status-uploaded';
            badge.innerText = 'Cadastrado';
        }

        // Evento de exclusão da linha
        const btnRemover = row.querySelector('.btn-remover-linha');
        btnRemover.addEventListener('click', () => {
            row.remove();
            if (UI.txtContainer.children.length === 0) {
                this.adicionarLinhaTxtInput('Alpha7', '', '');
            }
        });

        UI.txtContainer.appendChild(row);
    }

    static async carregarDadosDoMes() {
        const mesSelecionado = UI.inputMes.value;
        if (!mesSelecionado) return;

        this.limparAlertas();
        this.limparCampos();

        try {
            // 1. Carrega link do Encarte
            const { data: encarteData } = await supabaseClient
                .from('planilhas')
                .select('url_google')
                .eq('data_encarte', mesSelecionado + '-01')
                .maybeSingle();

            if (encarteData) {
                UI.inputEncarte.value = encarteData.url_google;
            }

            // 2. Carrega link das Ofertas
            const { data: ofertasData } = await supabaseClient
                .from('ofertas')
                .select('url_ofertas')
                .eq('data_oferta', mesSelecionado + '-01')
                .maybeSingle();

            if (ofertasData) {
                UI.inputOfertas.value = ofertasData.url_ofertas;
            }

            // 3. Carrega arquivos de integração TXT
            const { data: integracoesData } = await supabaseClient
                .from('integracoes')
                .select('sistema_erp, descricao, url_txt')
                .eq('data_integracao', mesSelecionado)
                .order('id', { ascending: true });

            if (integracoesData && integracoesData.length > 0) {
                integracoesData.forEach(item => {
                    this.adicionarLinhaTxtInput(item.sistema_erp, item.descricao, item.url_txt);
                });
            } else {
                this.adicionarLinhaTxtInput('Alpha7', '', '');
            }

        } catch (err) {
            console.error("Erro ao carregar dados do mês comercial:", err);
            this.adicionarLinhaTxtInput('Alpha7', '', '');
        }
    }

    // Faz upload do arquivo para o bucket do Supabase Storage
    static async uploadArquivoParaBucket(file, erp, descricao, mes) {
        const fileExt = file.name.split('.').pop();
        const cleanErp = erp.replace(/[^a-zA-Z0-9]/g, '_');
        const cleanDesc = descricao.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${mes}_${cleanErp}_${cleanDesc}_${Date.now()}.${fileExt}`;
        const filePath = `txt_files/${mes}/${fileName}`;

        const { data, error } = await supabaseClient.storage
            .from('arquivos_integracao')
            .upload(filePath, file);

        if (error) {
            throw error;
        }

        const { data: { publicUrl } } = supabaseClient.storage
            .from('arquivos_integracao')
            .getPublicUrl(filePath);

        return publicUrl;
    }

    static async salvarDadosComerciais() {
        const mesSelecionado = UI.inputMes.value;
        if (!mesSelecionado) {
            alert("Selecione um mês válido.");
            return;
        }

        this.limparAlertas();
        UI.btnSalvar.disabled = true;
        UI.btnSalvar.innerText = "Salvando links e arquivos...";

        try {
            // 1. Processa e envia arquivos TXT da Integração
            const rows = UI.txtContainer.querySelectorAll('.upload-row');
            const promessasUpload = Array.from(rows).map(async row => {
                const erp = row.querySelector('.select-erp').value;
                const desc = row.querySelector('.input-descricao').value.trim();
                const fileInput = row.querySelector('.file-input');
                let finalUrl = row.querySelector('.input-url').value.trim();

                // Se não preencheu descrição e não tem arquivo/link, ignora a linha
                if (!desc && !fileInput.files.length && !finalUrl) {
                    return null;
                }

                // Se houver um novo arquivo selecionado no input, fazemos upload
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    finalUrl = await this.uploadArquivoParaBucket(file, erp, desc, mesSelecionado);
                }

                return {
                    erp,
                    descricao: desc || 'Arquivo de Integração',
                    url: finalUrl
                };
            });

            const resultadosUpload = (await Promise.all(promessasUpload)).filter(res => res !== null && res.url !== '');

            // 2. Grava links das planilhas (Encarte e Ofertas) se preenchidos
            if (UI.inputEncarte.value.trim()) {
                await supabaseClient
                    .from('planilhas')
                    .upsert({
                        data_encarte: mesSelecionado + '-01',
                        url_google: UI.inputEncarte.value.trim()
                    }, { onConflict: 'data_encarte' });
            }

            if (UI.inputOfertas.value.trim()) {
                await supabaseClient
                    .from('ofertas')
                    .upsert({
                        data_oferta: mesSelecionado + '-01',
                        url_ofertas: UI.inputOfertas.value.trim()
                    }, { onConflict: 'data_oferta' });
            }

            // 3. Deleta registros antigos de integração daquele mês
            await supabaseClient
                .from('integracoes')
                .delete()
                .eq('data_integracao', mesSelecionado);

            // 4. Insere a nova lista de registros de integração TXT
            if (resultadosUpload.length > 0) {
                const registrosIntegracao = resultadosUpload.map(res => ({
                    data_integracao: mesSelecionado,
                    sistema_erp: res.erp,
                    descricao: res.descricao,
                    url_txt: res.url
                }));

                const { error: errorInsert } = await supabaseClient
                    .from('integracoes')
                    .insert(registrosIntegracao);

                if (errorInsert) throw errorInsert;
            }

            // Sucesso: exibe êxito e redireciona
            this.exibirAlerta(UI.alertSuccess);
            setTimeout(() => {
                window.location.href = 'hub.html';
            }, 1500);

        } catch (err) {
            console.error("Erro ao salvar dados comerciais:", err);
            this.exibirAlerta(UI.alertError);
        } finally {
            UI.btnSalvar.disabled = false;
            UI.btnSalvar.innerText = "Salvar Dados Comerciais";
        }
    }

    static limparCampos() {
        UI.inputEncarte.value = '';
        UI.inputOfertas.value = '';
        UI.txtContainer.innerHTML = '';
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

document.addEventListener('DOMContentLoaded', () => AdminComercialController.init());
