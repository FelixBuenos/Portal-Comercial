import { supabaseClient } from '../servicos/supabaseClient.js';
import { Auth } from '../servicos/auth.js';

class SelecaoModuloController {
    static init() {
        this.verificarAcesso();
        this.configurarCliquesEstaticos();
    }

    // Camada de Segurança e Controle de Acesso Baseado em Perfis (RBAC) com cache local
    static async verificarAcesso() {
        const funcao = await Auth.verificarPermissao(['mestre', 'mestre_comercial', 'comercial', 'marketing', 'user'], 'index.html');
        if (funcao) {
            this.configurarVisualPorPerfil(funcao);
        }
    }

    // Desativa visualmente o módulo que o usuário não possui permissão
    static configurarVisualPorPerfil(funcao) {
        const cardComercial = document.getElementById('card-comercial');
        const cardMarketing = document.getElementById('card-marketing');

        // Restaura estados originais antes de aplicar a regra
        if (cardMarketing) {
            cardMarketing.style.opacity = '1';
            cardMarketing.style.cursor = 'pointer';
            cardMarketing.querySelector('.card-description').innerText = 'Acesse o material de apoio, artes padrão para redes sociais, campanhas de aniversário, delivery e convênios.';
            cardMarketing.querySelector('button').innerText = 'Acessar Marketing →';
            cardMarketing.querySelector('button').style.background = '';
        }
        if (cardComercial) {
            cardComercial.style.opacity = '1';
            cardComercial.style.cursor = 'pointer';
            cardComercial.querySelector('.card-description').innerText = 'Acesse encartes, links de ofertas vigentes e realize a exportação de arquivos TXT de integração das filiais.';
            cardComercial.querySelector('button').innerText = 'Acessar Comercial →';
            cardComercial.querySelector('button').style.background = '';
        }

        if (funcao === 'comercial') {
            if (cardMarketing) {
                cardMarketing.style.opacity = '0.3';
                cardMarketing.style.cursor = 'not-allowed';
                cardMarketing.querySelector('.card-description').innerText = 'Acesso restrito para o seu perfil.';
                cardMarketing.querySelector('button').innerText = 'Acesso Negado';
                cardMarketing.querySelector('button').style.background = '#94a3b8';
            }
        } else if (funcao === 'marketing') {
            if (cardComercial) {
                cardComercial.style.opacity = '0.3';
                cardComercial.style.cursor = 'not-allowed';
                cardComercial.querySelector('.card-description').innerText = 'Acesso restrito para o seu perfil.';
                cardComercial.querySelector('button').innerText = 'Acesso Negado';
                cardComercial.querySelector('button').style.background = '#94a3b8';
            }
        }
    }

    // Vincula os eventos de clique UMA ÚNICA VEZ e decide a navegação dinamicamente
    static configurarCliquesEstaticos() {
        const cardComercial = document.getElementById('card-comercial');
        const cardMarketing = document.getElementById('card-marketing');
        const btnSair = document.getElementById('btn-sair');

        if (cardComercial) {
            cardComercial.addEventListener('click', () => {
                const funcao = sessionStorage.getItem('user_role');
                if (funcao === 'marketing') {
                    return; // Bloqueia clique se for perfil exclusivo do marketing
                }
                window.location.href = 'hub.html';
            });
        }

        if (cardMarketing) {
            cardMarketing.addEventListener('click', () => {
                const funcao = sessionStorage.getItem('user_role');
                if (funcao === 'comercial') {
                    return; // Bloqueia clique se for perfil exclusivo comercial
                }
                window.location.href = 'marketing.html';
            });
        }

        // Lógica de Logout
        if (btnSair) {
            btnSair.addEventListener('click', async () => {
                await Auth.logout();
            });
        }
    }
}

// Inicia quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', () => SelecaoModuloController.init());