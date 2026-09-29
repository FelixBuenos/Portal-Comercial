import { supabaseClient } from './servicos/supabaseClient.js';

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

    try {
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
            // Redireciona para a Seleção de Módulo já com o acesso liberado
            window.location.href = 'selecao-modulo.html';
        }
    } catch (err) {
        console.error("Erro inesperado ao atualizar senha:", err);
        alert("Ocorreu um erro de conexão ao tentar salvar a nova senha.");
        btnSalvar.innerText = "Salvar e Entrar";
        btnSalvar.disabled = false;
    }
});