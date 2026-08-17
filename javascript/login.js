/* ==========================================================================
   CONFIGURAÇÃO GERAL DO SUPABASE
   ========================================================================== */
const Config = {
    SUPABASE_URL: 'https://meeljtyblixcdfymgaym.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZWxqdHlibGl4Y2RmeW1nYXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNjM0NTEsImV4cCI6MjA5NzkzOTQ1MX0.b1sEpavYWZOIKoKAGcPLOgQKT2I8K6kAYBjo-c_dTgo'
};

const supabaseClient = supabase.createClient(Config.SUPABASE_URL, Config.SUPABASE_KEY);

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
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) {
            window.location.href = 'selecao-modulo.html';
        }
    }

    static vincularEventos() {
        // Envio do Login
        UI.formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            UI.msgErro.style.display = 'none';
            
            const { error } = await supabaseClient.auth.signInWithPassword({
                email: UI.inputEmail.value,
                password: UI.inputSenha.value
            });

            if (error) {
                UI.msgErro.textContent = "E-mail ou senha incorretos.";
                UI.msgErro.style.display = 'flex';
            } else {
                // REDIRECIONAMENTO AJUSTADO: Agora envia para a portaria geral de módulos
                window.location.href = 'selecao-modulo.html';
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