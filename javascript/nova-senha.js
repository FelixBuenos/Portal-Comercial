// Cole aqui as suas credenciais padrão do Supabase
const Config = {
    SUPABASE_URL: 'https://meeljtyblixcdfymgaym.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZWxqdHlibGl4Y2RmeW1nYXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNjM0NTEsImV4cCI6MjA5NzkzOTQ1MX0.b1sEpavYWZOIKoKAGcPLOgQKT2I8K6kAYBjo-c_dTgo'
};

const supabaseClient = supabase.createClient(Config.SUPABASE_URL, Config.SUPABASE_KEY);

const btnSalvar = document.getElementById('btn-salvar-senha');
const inputSenha = document.getElementById('input-nova-senha');
const inputConfirmar = document.getElementById('input-confirmar-senha');

btnSalvar.addEventListener('click', async () => {
    const senha = inputSenha.value;
    const confirmar = inputConfirmar.value;

    // Validações básicas
    if (senha.length < 6) {
        alert("A senha deve ter pelo menos 6 caracteres.");
        return;
    }
    if (senha !== confirmar) {
        alert("As senhas não coincidem. Tente novamente.");
        return;
    }

    // Altera o texto do botão
    btnSalvar.innerText = "Salvando...";
    btnSalvar.disabled = true;

    // Atualiza a senha no Supabase
    const { data, error } = await supabaseClient.auth.updateUser({
        password: senha
    });

    if (error) {
        console.error("Erro:", error);
        alert("Erro ao atualizar a senha. O link pode ter expirado.");
        btnSalvar.innerText = "Salvar e Entrar";
        btnSalvar.disabled = false;
    } else {
        alert("Senha atualizada com sucesso!");
        // Redireciona para o Hub Principal já com o acesso liberado
        window.location.href = 'hub.html';
    }
});