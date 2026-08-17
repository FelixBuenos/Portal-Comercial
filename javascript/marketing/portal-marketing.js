import { supabaseClient } from '../servicos/supabaseClient.js';

const UI = {
    btnVoltar: document.getElementById('btn-voltar-hub'),
    btnAdmin: document.getElementById('btn-admin'),
    navSpacer: document.getElementById('nav-spacer')
};

class PortalMarketingController {
    static init() {
        this.verificarAcesso();
        this.vincularEventos();
    }

    // Camada de Segurança e Perfis (RBAC) com cache local
    static async verificarAcesso() {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (!session) {
                window.location.href = 'index.html';
                return;
            }

            // Tenta obter a função (role) do cache instantâneo de sessão para evitar lag visual
            let funcao = sessionStorage.getItem('user_role');

            if (funcao) {
                this.aplicarSegurancaPorPerfil(funcao);
            }

            // Busca do banco em background para validar/atualizar o cache
            const { data: adminData } = await supabaseClient
                .from('usuarios_admin')
                .select('funcao')
                .eq('email', session.user.email)
                .maybeSingle();

            const funcaoBanco = adminData ? adminData.funcao : 'user';

            if (funcao !== funcaoBanco) {
                sessionStorage.setItem('user_role', funcaoBanco);
                this.aplicarSegurancaPorPerfil(funcaoBanco);
            }

        } catch (err) {
            console.error("Erro na verificação de acesso:", err);
            window.location.href = 'index.html';
        }
    }

    static aplicarSegurancaPorPerfil(funcao) {
        // Bloqueia se o usuário for administrador exclusivo Comercial
        if (funcao === 'comercial') {
            alert("Acesso Negado: Seu perfil está restrito ao módulo Comercial.");
            window.location.href = 'selecao-modulo.html';
            return;
        }

        // Libera o botão administrativo do marketing apenas para perfis Marketing ou Mestre
        if (UI.btnAdmin) {
            if (funcao === 'marketing' || funcao === 'mestre') {
                UI.btnAdmin.style.display = 'inline-block';
                if (UI.navSpacer) {
                    UI.navSpacer.style.width = '300px'; 
                }
            } else {
                UI.btnAdmin.style.display = 'none';
                if (UI.navSpacer) {
                    UI.navSpacer.style.width = '120px';
                }
            }
        }
    }

    static vincularEventos() {
        if (UI.btnVoltar) {
            UI.btnVoltar.addEventListener('click', () => {
                window.location.href = 'selecao-modulo.html';
            });
        }

        if (UI.btnAdmin) {
            UI.btnAdmin.addEventListener('click', () => {
                window.location.href = 'admin.html';
            });
        }
    }
}

// Inicializa a aplicação ao carregar a página
document.addEventListener('DOMContentLoaded', () => PortalMarketingController.init());
