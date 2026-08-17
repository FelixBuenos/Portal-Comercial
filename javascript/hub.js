/* ==========================================================================
   CONFIGURAÇÃO DO SUPABASE
   ========================================================================== */
const Config = {
    SUPABASE_URL: 'https://meeljtyblixcdfymgaym.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZWxqdHlibGl4Y2RmeW1nYXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNjM0NTEsImV4cCI6MjA5NzkzOTQ1MX0.b1sEpavYWZOIKoKAGcPLOgQKT2I8K6kAYBjo-c_dTgo'
};

const supabaseClient = supabase.createClient(Config.SUPABASE_URL, Config.SUPABASE_KEY);

/* ==========================================================================
   ELEMENTOS DO DOM
   ========================================================================== */
const Elementos = {
    btnSair: document.getElementById('btn-sair'),
    btnEncartes: document.getElementById('btn-acessar-encartes'),
    btnOfertas: document.getElementById('btn-acessar-gerencial'),
    btnIntegracao: document.getElementById('btn-acessar-integracao') // <-- Novo botão mapeado aqui
};

/* ==========================================================================
   CONTROLLER DO HUB
   ========================================================================== */
class HubController {
    static init() {
        this.verificarAcesso();
        this.configurarCliques();
    }

    // Camada de Segurança
    static async verificarAcesso() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            // Se não estiver logado, chuta de volta para o login
            window.location.href = 'index.html';
        }
    }

    static configurarCliques() {
        // Botão de Sair
        Elementos.btnSair.addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
            window.location.href = 'index.html';
        });

        // Rota para Encartes (Azul)
        Elementos.btnEncartes.addEventListener('click', () => {
            window.location.href = 'encartes.html';
        });

        // Rota para Ofertas (Vermelho)
        Elementos.btnOfertas.addEventListener('click', () => {
            window.location.href = 'ofertas.html';
        });

        // Rota para Integração TXT (Verde)
        Elementos.btnIntegracao.addEventListener('click', () => {
            window.location.href = 'integracao.html';
        });
    }
}

// Inicia o Hub quando a página carregar
document.addEventListener('DOMContentLoaded', () => HubController.init());