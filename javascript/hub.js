import { supabaseClient } from './servicos/supabaseClient.js';
import { Auth } from './servicos/auth.js';

/* ==========================================================================
   ELEMENTOS DO DOM
   ========================================================================== */
const Elementos = {
    btnSair: document.getElementById('btn-sair'),
    btnEncartes: document.getElementById('btn-acessar-encartes'),
    btnOfertas: document.getElementById('btn-acessar-gerencial'),
    btnIntegracao: document.getElementById('btn-acessar-integracao'),
    btnVoltarModulo: document.getElementById('btn-voltar-modulo'),
    btnAdmin: document.getElementById('btn-admin'),
    btnManual: document.getElementById('btn-acessar-manual')
};

/* ==========================================================================
   CONTROLLER DO HUB
   ========================================================================== */
class HubController {
    static init() {
        this.verificarAcesso();
        this.configurarCliques();
    }

    // Camada de Segurança e Perfis (RBAC) com cache de sessão
    static async verificarAcesso() {
        const funcao = await Auth.verificarPermissao(['mestre', 'mestre_comercial', 'comercial', 'user'], 'selecao-modulo.html');
        if (funcao) {
            this.aplicarSegurancaPorPerfil(funcao);
        }
    }

    static aplicarSegurancaPorPerfil(funcao) {
        // Bloqueia se o usuário for administrador exclusivo de Marketing
        if (funcao === 'marketing') {
            alert("Acesso Negado: Seu perfil está restrito ao módulo de Marketing.");
            window.location.href = 'selecao-modulo.html';
            return;
        }

        // Libera o botão administrativo apenas para perfil Mestre ou Mestre Comercial
        if (Elementos.btnAdmin) {
            if (funcao === 'mestre' || funcao === 'mestre_comercial') {
                Elementos.btnAdmin.style.display = 'inline-block';
            } else {
                Elementos.btnAdmin.style.display = 'none';
            }
        }
    }

    static configurarCliques() {
        if (Elementos.btnVoltarModulo) {
            Elementos.btnVoltarModulo.addEventListener('click', () => {
                window.location.href = 'selecao-modulo.html';
            });
        }

        if (Elementos.btnAdmin) {
            Elementos.btnAdmin.addEventListener('click', () => {
                window.location.href = 'admin-comercial.html';
            });
        }

        Elementos.btnSair.addEventListener('click', async () => {
            await Auth.logout();
        });

        Elementos.btnEncartes.addEventListener('click', () => {
            window.location.href = 'encartes.html';
        });

        Elementos.btnOfertas.addEventListener('click', () => {
            window.location.href = 'ofertas.html';
        });

        Elementos.btnIntegracao.addEventListener('click', () => {
            window.location.href = 'integracao.html';
        });

        // Navegação para a nova página do Manual de Ações
        if (Elementos.btnManual) {
            Elementos.btnManual.addEventListener('click', () => {
                window.location.href = 'manual.html';
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => HubController.init());