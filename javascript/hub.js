import { supabaseClient } from './servicos/supabaseClient.js';

/* ==========================================================================
   ELEMENTOS DO DOM
   ========================================================================== */
const Elementos = {
    btnSair: document.getElementById('btn-sair'),
    btnEncartes: document.getElementById('btn-acessar-encartes'),
    btnOfertas: document.getElementById('btn-acessar-gerencial'),
    btnIntegracao: document.getElementById('btn-acessar-integracao'),
    btnVoltarModulo: document.getElementById('btn-voltar-modulo'),
    btnAdmin: document.getElementById('btn-admin')
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
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            
            if (!session) {
                window.location.href = 'index.html';
                return;
            }

            // Tenta validar usando a função cacheada para evitar lag visual
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
            console.error("Erro ao verificar sessão:", err);
            window.location.href = 'index.html';
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
            try {
                await supabaseClient.auth.signOut();
            } catch (err) {
                console.error("Erro ao efetuar logout:", err);
            } finally {
                sessionStorage.clear(); // Limpa cache local
                window.location.href = 'index.html';
            }
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
    }
}

document.addEventListener('DOMContentLoaded', () => HubController.init());