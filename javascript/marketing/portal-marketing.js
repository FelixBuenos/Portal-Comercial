import { supabaseClient } from '../servicos/supabaseClient.js';
import { Auth } from '../servicos/auth.js';

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
        const funcao = await Auth.verificarPermissao(['mestre', 'mestre_marketing', 'marketing', 'user'], 'selecao-modulo.html');
        if (funcao) {
            this.aplicarSegurancaPorPerfil(funcao);
        }
    }

    static aplicarSegurancaPorPerfil(funcao) {
        // Bloqueia se o usuário for administrador exclusivo Comercial
        if (funcao === 'comercial') {
            alert("Acesso Negado: Seu perfil está restrito ao módulo Comercial.");
            window.location.href = 'selecao-modulo.html';
            return;
        }

        // Libera o botão administrativo do marketing apenas para perfil Mestre ou Mestre Marketing
        if (UI.btnAdmin) {
            if (funcao === 'mestre' || funcao === 'mestre_marketing') {
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
