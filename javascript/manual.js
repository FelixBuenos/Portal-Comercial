import { supabaseClient } from "./servicos/supabaseClient.js";
import { Auth } from "./servicos/auth.js";

document.addEventListener("DOMContentLoaded", async () => {
	// Verifica Sessão centralizada
	const session = await Auth.verificarSessao();
	if (!session) return;

	const btnVoltar = document.getElementById("btn-voltar-hub");
	const btnSair = document.getElementById("btn-sair");
	const filtroMes = document.getElementById("filtro-mes");
	const linkDownload = document.getElementById("link-download");

	// Navegação
	btnVoltar.addEventListener("click", () => {
		window.location.href = "hub.html";
	});

	btnSair.addEventListener("click", async () => {
		await Auth.logout();
	});

    // Filtro de Mês
    filtroMes.addEventListener("change", async (e) => {
        const valor = e.target.value; // ex: "2026-09"

        if (valor) {
            try {
                const { data, error } = await supabaseClient
                    .from('manuais')
                    .select('url_sharepoint')
                    .eq('data_manual', valor + '-01')
                    .maybeSingle();

                if (error) throw error;

                if (data && data.url_sharepoint) {
                    linkDownload.href = data.url_sharepoint;
                    linkDownload.style.display = "inline-flex";
                } else {
                    linkDownload.style.display = "none";
                    alert("Ainda não há manual cadastrado para este mês.");
                }
            } catch (err) {
                console.error("Erro ao buscar link do manual:", err);
                linkDownload.style.display = "none";
            }
        } else {
            linkDownload.style.display = "none";
        }
    });
});
