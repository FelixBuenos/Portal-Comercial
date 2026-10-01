import { supabaseClient } from "./servicos/supabaseClient.js";
import { Auth } from "./servicos/auth.js";

document.addEventListener("DOMContentLoaded", async () => {
	// Verifica Sessão
	const session = await Auth.verificarSessao();
	if (!session) return;

	const filtroMes = document.getElementById("filtro-mes");
	const linkDownload = document.getElementById("link-download");

    // Filtro de Mês
    filtroMes.addEventListener("change", async (e) => {
        const valor = e.target.value; // ex: "2026-09"

        if (valor) {
            try {
                // OBS: Ajuste o nome da tabela e da coluna conforme criado no Supabase
                const { data, error } = await supabaseClient
                    .from('materiais_apoio')
                    .select('url_sharepoint')
                    .eq('data_referencia', valor + '-01')
                    .maybeSingle();

                if (error) throw error;

                if (data && data.url_sharepoint) {
                    linkDownload.href = data.url_sharepoint;
                    linkDownload.style.display = "inline-flex";
                } else {
                    linkDownload.style.display = "none";
                    alert("Ainda não há material cadastrado para este mês.");
                }
            } catch (err) {
                console.error("Erro ao buscar link do material:", err);
                linkDownload.style.display = "none";
            }
        } else {
            linkDownload.style.display = "none";
        }
    });
});
