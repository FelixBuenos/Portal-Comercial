import { supabaseClient } from './servicos/supabaseClient.js';

/* ==========================================================================
   MAPEAMENTO DA INTERFACE DE LOGIN
   ========================================================================== */
const UI = {
    formLogin: document.getElementById('form-login'),
    inputEmail: document.getElementById('email'),
    inputSenha: document.getElementById('senha'),
    msgErro: document.getElementById('mensagem-erro'),
    
    linkMudarSenha: document.getElementById('link-mudar-senha'),
    modalRecuperar: document.getElementById('modal-recuperar-senha'),
    inputRecuperarEmail: document.getElementById('input-recuperar-email'),
    btnEnviarLink: document.getElementById('btn-enviar-link'),
    btnFecharModal: document.getElementById('btn-fechar-modal')
};

/* ==========================================================================
   CONTROLE DE AUTENTICAÇÃO E REDIRECIONAMENTO
   ========================================================================== */
class LoginController {
    static init() {
        this.verificarSessaoAtiva();
        this.vincularEventos();
        this.escutarLinkDeEmail();
    }

    // Checa se o usuário já está logado para enviá-lo direto à seleção de módulos
    static async verificarSessaoAtiva() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            window.location.href = 'selecao-modulo.html';
        }
    }

    static vincularEventos() {
        // Envio do Login
        UI.formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            UI.msgErro.style.display = 'none';
            
            try {
                const { error } = await supabaseClient.auth.signInWithPassword({
                    email: UI.inputEmail.value,
                    password: UI.inputSenha.value
                });

                if (error) {
                    UI.msgErro.textContent = "E-mail ou senha incorretos.";
                    UI.msgErro.style.display = 'flex';
                } else {
                    // Busca e salva a funcao (role) no sessionStorage para acesso instantaneo
                    const email = UI.inputEmail.value.trim();
                    try {
                        const { data: adminData } = await supabaseClient
                            .from('usuarios_admin')
                            .select('funcao')
                            .eq('email', email)
                            .maybeSingle();
                        
                        const role = adminData ? adminData.funcao : 'user';
                        sessionStorage.setItem('user_role', role);
                    } catch (roleErr) {
                        console.error("Erro ao cachear funcao de admin:", roleErr);
                    }

                    window.location.href = 'selecao-modulo.html';
                }
            } catch (err) {
                console.error("Erro inesperado no login:", err);
                UI.msgErro.textContent = "Erro de conexão ao tentar fazer login.";
                UI.msgErro.style.display = 'flex';
            }
        });

        // Modais: Fluxo de Esqueci a Senha
        UI.linkMudarSenha.addEventListener('click', (e) => {
            e.preventDefault();
            UI.modalRecuperar.style.display = 'flex';
        });

        UI.btnFecharModal.addEventListener('click', () => {
            UI.modalRecuperar.style.display = 'none';
            UI.inputRecuperarEmail.value = '';
        });

        UI.btnEnviarLink.addEventListener('click', async () => {
            if (!UI.inputRecuperarEmail.value) { alert("Digite um e-mail válido."); return; }
            
            try {
                const { error } = await supabaseClient.auth.resetPasswordForEmail(UI.inputRecuperarEmail.value, {
                    redirectTo: window.location.href
                });

                if (error) {
                    alert("Erro: " + error.message);
                } else {
                    alert("Link de redefinição enviado com sucesso! Verifique seu e-mail.");
                    UI.modalRecuperar.style.display = 'none';
                    UI.inputRecuperarEmail.value = '';
                }
            } catch (err) {
                console.error("Erro ao enviar link de recuperação:", err);
                alert("Erro ao tentar enviar o link de redefinição. Verifique sua conexão.");
            }
        });
    }

    // Captura o token caso o usuário retorne através do link recebido por e-mail
    static escutarLinkDeEmail() {
        supabaseClient.auth.onAuthStateChange(async (event) => {
            if (event === "PASSWORD_RECOVERY") {
                // Quando clicar no link do e-mail, envia para a página exclusiva de nova senha
                window.location.href = 'nova-senha.html';
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => LoginController.init());