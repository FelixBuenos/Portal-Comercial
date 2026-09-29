import { supabaseClient } from './supabaseClient.js';

export class Auth {
    /**
     * Verifica se o usuário está logado. 
     * Redireciona para index.html se não estiver.
     * @returns {Promise<Object>} Dados da sessão
     */
    static async verificarSessao() {
        try {
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            if (error) throw error;
            
            if (!session) {
                window.location.replace('index.html');
                return null;
            }
            return session;
        } catch (err) {
            console.error("Erro na verificação de sessão:", err);
            window.location.replace('index.html');
            return null;
        }
    }

    /**
     * Verifica se o usuário logado possui a permissão (role) adequada.
     * @param {string[]} papeisPermitidos - Array de funções permitidas (ex: ['mestre', 'mestre_comercial'])
     * @param {string} redirecionamento - URL para redirecionar em caso de falha (default: hub.html)
     */
    static async verificarPermissao(papeisPermitidos, redirecionamento = 'hub.html') {
        const session = await this.verificarSessao();
        if (!session) return null;

        try {
            // Tenta validar usando a função cacheada
            let funcao = sessionStorage.getItem('user_role');

            if (!funcao) {
                const { data: adminData } = await supabaseClient
                    .from('usuarios_admin')
                    .select('funcao')
                    .eq('email', session.user.email)
                    .maybeSingle();

                funcao = adminData ? adminData.funcao : 'user';
                sessionStorage.setItem('user_role', funcao);
            }

            if (!papeisPermitidos.includes(funcao)) {
                alert("Acesso Negado: Você não tem permissão para acessar esta página.");
                window.location.replace(redirecionamento);
                return null;
            }

            return funcao;
        } catch (err) {
            console.error("Erro na verificação de permissão:", err);
            window.location.replace('index.html');
            return null;
        }
    }

    /**
     * Efetua o logout do usuário e limpa os caches.
     */
    static async logout() {
        try {
            await supabaseClient.auth.signOut();
        } catch (err) {
            console.error("Erro ao efetuar logout:", err);
        } finally {
            sessionStorage.clear();
            window.location.replace('index.html');
        }
    }
}
