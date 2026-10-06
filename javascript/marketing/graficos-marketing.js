const TOKEN_CLICKUP = 'pk_216020149_KOM58P636SZWT18C5BH45PABHKMQ54K4';
const LIST_ID = '901714249715';

// --- GLOBAL STATE ---
let allTasksData = [];
let chartInstances = {};
let currentFilters = {
    loja: null,
    status: null,
    categoria: null,
    origem: null
};
let globalFilters = {
    loja: "",
    dataInicio: null, // timestamp em ms
    dataFim: null     // timestamp em ms
};

// 1. Extração Recursiva e Paralela dos Dados (ETL - Extract)
async function fetchAllClickUpTasks() {
    let page = 0;
    let allTasks = [];
    let isLastPage = false;
    const PAGES_PER_BATCH = 5;

    while (!isLastPage) {
        const promises = [];
        for (let i = 0; i < PAGES_PER_BATCH; i++) {
            const targetUrl = `https://api.clickup.com/api/v2/list/${LIST_ID}/task?archived=false&subtasks=true&include_closed=true&page=${page + i}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            promises.push(
                fetch(targetUrl, {
                    headers: { 'Authorization': TOKEN_CLICKUP, 'Content-Type': 'application/json' },
                    signal: controller.signal
                }).then(res => {
                    clearTimeout(timeoutId);
                    if (!res.ok) throw new Error(`Erro na API (Status ${res.status})`);
                    return res.json();
                }).catch(err => {
                    clearTimeout(timeoutId);
                    if (err.name === 'AbortError') throw new Error('A requisição demorou muito (Timeout). Verifique a rede.');
                    throw err;
                })
            );
        }

        const results = await Promise.all(promises);
        for (const data of results) {
            if (data.tasks && data.tasks.length > 0) {
                allTasks = allTasks.concat(data.tasks);
            } else {
                isLastPage = true;
            }
        }
        page += PAGES_PER_BATCH;
    }
    return allTasks;
}

// 2. Transformação dos Dados (ETL - Transform)
function processTasks(tasks) {
    const processed = [];
    tasks.forEach(t => {
        let loja = "";
        let categoria = "";
        let subcategoria = "";
        let complexidade = "";
        let origem = "";
        let descricao = t.name || "Sem Título";

        // Os dados na verdade estão no nome da tarefa separados por vírgula!
        // Ex: "Rede, Reunião, Alinhar - Treinar, C1, Novos Negócios, Descrição..."
        if (t.name && t.name.includes(',')) {
            const parts = t.name.split(',').map(p => p.trim());
            loja = parts[0] ? parts[0].toUpperCase() : "";
            categoria = parts[1] || "";
            subcategoria = parts[2] || "";
            complexidade = parts[3] || "";
            origem = parts[4] || "";
            
            // A descrição pode conter vírgulas, então juntamos o resto
            if (parts.length > 5) {
                descricao = parts.slice(5).join(', ');
            }
        }

        // Limpeza de Lojas (...", ".." -> "REDE")
        if (loja === "..." || loja === "..") loja = "REDE";

        const responsaveis = t.assignees && t.assignees.length > 0 
            ? t.assignees.map(a => a.username) 
            : ["Não Atribuído"];

        let prioridade = "Normal";
        if (t.priority) {
            const p = t.priority.priority;
            if (p === 'high') prioridade = 'Alta';
            else if (p === 'low') prioridade = 'Baixa';
            else if (p === 'urgent') prioridade = 'Urgente';
            else if (p === 'normal') prioridade = 'Normal';
        }

        const status = t.status ? t.status.status.toUpperCase() : "DESCONHECIDO";
        const timeMs = t.time_spent || 0;
        const tempoHorasDecimal = Number((timeMs / 1000 / 60 / 60).toFixed(2));
        const dataCriacao = t.date_created ? new Date(parseInt(t.date_created)).toLocaleDateString('pt-BR') : "";
        const timestamp = t.date_created ? parseInt(t.date_created) : 0;

        processed.push({
            id: `#${t.id}`, loja, categoria, subcategoria, complexidade, origem, descricao, status,
            criado_por: t.creator ? t.creator.username : "",
            prioridade, responsaveis, tempoHorasDecimal, dataCriacao, timestamp
        });
    });
    return processed;
}

function updateKPIs(data) {
    const total = data.length;
    document.getElementById('kpi-total').innerText = total;
}

// Retorna dados filtrados EXCETO pelo filtro que está sendo analisado (para manter barras relativas)
function getFilteredData(excludeKey) {
    return allTasksData.filter(d => {
        const dLoja = d.loja && d.loja.trim() !== "" ? d.loja.trim().toUpperCase() : "SEM LOJA";
        const dStatus = d.status;
        const dCat = d.categoria;
        let dOrigem = d.origem && d.origem.trim() !== "" ? d.origem.trim().toUpperCase() : "NÃO ESPECIFICADO";
        if (dOrigem === "..." || dOrigem === "..") dOrigem = "REDE"; 

        // Filtros Globais (Inputs explícitos)
        if (globalFilters.loja && globalFilters.loja !== "" && dLoja !== globalFilters.loja) return false;
        if (globalFilters.dataInicio && d.timestamp < globalFilters.dataInicio) return false;
        if (globalFilters.dataFim && d.timestamp > globalFilters.dataFim) return false;

        // Filtros interativos (cliques nos gráficos)
        if (excludeKey !== 'loja' && currentFilters.loja && dLoja !== currentFilters.loja) return false;
        if (excludeKey !== 'status' && currentFilters.status && dStatus !== currentFilters.status) return false;
        if (excludeKey !== 'categoria' && currentFilters.categoria && dCat !== currentFilters.categoria) return false;
        if (excludeKey !== 'origem' && currentFilters.origem && dOrigem !== currentFilters.origem) return false;
        return true;
    });
}

function handleChartClick(filterKey) {
    return function(event, elements, chart) {
        if (elements.length > 0) {
            const index = elements[0].index;
            const label = chart.data.labels[index];
            currentFilters[filterKey] = currentFilters[filterKey] === label ? null : label;
            applyFilters();
        }
    }
}

function renderCharts() {
    const gridColor = 'rgba(255, 255, 255, 0.05)';
    const textColor = '#cbd5e1';

    // Plugin comum para pintar valores
    const drawVerticalValuesPlugin = {
        id: 'drawVerticalValues',
        afterDatasetsDraw(chart) {
            const { ctx, data } = chart;
            ctx.save();
            ctx.font = "12px 'Sora', sans-serif";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            chart.getDatasetMeta(0).data.forEach((bar, index) => {
                const value = data.datasets[0].data[index];
                const label = data.labels[index];
                // Se esse item for o filtro ativo, pinta de branco, senão meio apagado
                const isActive = Object.values(currentFilters).includes(label);
                ctx.fillStyle = (Object.values(currentFilters).some(v=>v!==null) && !isActive) ? 'rgba(255,255,255,0.4)' : '#ffffff';
                ctx.fillText(value, bar.x, bar.y - 5);
            });
            ctx.restore();
        }
    };
    
    const drawHorizontalValuesPlugin = {
        id: 'drawHorizontalValues',
        afterDatasetsDraw(chart) {
            const { ctx, data } = chart;
            ctx.save();
            ctx.font = "12px 'Sora', sans-serif";
            ctx.textBaseline = 'middle';
            chart.getDatasetMeta(0).data.forEach((bar, index) => {
                const value = data.datasets[0].data[index];
                const label = data.labels[index];
                const isActive = Object.values(currentFilters).includes(label);
                ctx.fillStyle = (Object.values(currentFilters).some(v=>v!==null) && !isActive) ? 'rgba(255,255,255,0.4)' : '#ffffff';
                ctx.fillText(value, bar.x + 10, bar.y);
            });
            ctx.restore();
        }
    };

    // 1. Status Chart
    const dataStatus = getFilteredData('status');
    const statusCounts = {};
    dataStatus.forEach(d => { statusCounts[d.status] = (statusCounts[d.status] || 0) + 1; });
    const sortedStatus = Object.entries(statusCounts).sort((a,b) => b[1] - a[1]);
    
    if(chartInstances['status']) chartInstances['status'].destroy();
    chartInstances['status'] = new Chart(document.getElementById('statusChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: sortedStatus.map(s => s[0]),
            datasets: [{
                label: 'Demandas',
                data: sortedStatus.map(s => s[1]),
                backgroundColor: sortedStatus.map(s => currentFilters.status === s[0] ? '#ef4444' : (currentFilters.status ? '#7f1d1d' : '#dc2626')),
                borderRadius: 4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            onClick: handleChartClick('status'),
            onHover: (event, chartElement) => { event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default'; },
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, grid: { color: gridColor } }, x: { grid: { display: false } } }
        }
    });

    // 2. Loja Chart
    const dataLoja = getFilteredData('loja');
    const lojaCounts = {};
    dataLoja.forEach(d => {
        let nomeLoja = d.loja && d.loja.trim() !== "" ? d.loja.trim().toUpperCase() : "SEM LOJA";
        lojaCounts[nomeLoja] = (lojaCounts[nomeLoja] || 0) + 1;
    });
    const sortedLojas = Object.entries(lojaCounts).sort((a,b) => b[1] - a[1]);

    // Dinamicamente ajustar a altura do contêiner para o scroll funcionar no Chart.js (aprox 20px por barra)
    const containerHeight = Math.max(300, sortedLojas.length * 20);
    document.getElementById('lojaChart').parentElement.style.height = `${containerHeight}px`;

    if(chartInstances['loja']) chartInstances['loja'].destroy();
    chartInstances['loja'] = new Chart(document.getElementById('lojaChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: sortedLojas.map(l => l[0]),
            datasets: [{
                label: 'Demandas',
                data: sortedLojas.map(l => l[1]),
                backgroundColor: sortedLojas.map(l => currentFilters.loja === l[0] ? '#60a5fa' : (currentFilters.loja ? '#1e3a8a' : '#3b82f6')),
                borderRadius: 4
            }]
        },
        plugins: [drawHorizontalValuesPlugin],
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            onClick: handleChartClick('loja'),
            onHover: (event, chartElement) => { event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default'; },
            layout: { padding: { right: 40 } },
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false, beginAtZero: true },
                y: { grid: { display: false }, ticks: { color: textColor, autoSkip: false, font: { size: 11 } } }
            }
        }
    });

    // 3. Categoria Chart
    const dataCat = getFilteredData('categoria');
    const categoriaCounts = {};
    dataCat.forEach(d => { categoriaCounts[d.categoria] = (categoriaCounts[d.categoria] || 0) + 1; });
    const sortedCats = Object.entries(categoriaCounts).sort((a,b) => b[1] - a[1]);

    if(chartInstances['categoria']) chartInstances['categoria'].destroy();
    chartInstances['categoria'] = new Chart(document.getElementById('categoriaChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: sortedCats.map(c => c[0]),
            datasets: [{
                label: 'Categorias',
                data: sortedCats.map(c => c[1]),
                backgroundColor: sortedCats.map(c => currentFilters.categoria === c[0] ? '#60a5fa' : (currentFilters.categoria ? '#1e3a8a' : '#3b82f6')),
                borderRadius: 2, barThickness: 30
            }]
        },
        plugins: [drawVerticalValuesPlugin],
        options: {
            responsive: true, maintainAspectRatio: false,
            onClick: handleChartClick('categoria'),
            onHover: (event, chartElement) => { event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default'; },
            layout: { padding: { top: 25 } },
            plugins: { legend: { display: false } },
            scales: {
                y: { display: false, beginAtZero: true },
                x: { grid: { display: false }, ticks: { color: textColor, autoSkip: false, maxRotation: 45, minRotation: 45, font: { size: 10 } } }
            }
        }
    });

    // 4. Origem Chart
    const dataOrigem = getFilteredData('origem');
    const origemCounts = {};
    dataOrigem.forEach(d => {
        let nomeOrigem = d.origem && d.origem.trim() !== "" ? d.origem.trim().toUpperCase() : "NÃO ESPECIFICADO";
        if (nomeOrigem === "..." || nomeOrigem === "..") nomeOrigem = "REDE"; 
        origemCounts[nomeOrigem] = (origemCounts[nomeOrigem] || 0) + 1;
    });
    const sortedOrigens = Object.entries(origemCounts).sort((a,b) => b[1] - a[1]);

    if(chartInstances['origem']) chartInstances['origem'].destroy();
    chartInstances['origem'] = new Chart(document.getElementById('origemChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: sortedOrigens.map(o => o[0]),
            datasets: [{
                label: 'Origens',
                data: sortedOrigens.map(o => o[1]),
                backgroundColor: sortedOrigens.map(o => currentFilters.origem === o[0] ? '#60a5fa' : (currentFilters.origem ? '#1e3a8a' : '#3b82f6')),
                borderRadius: 2, barThickness: 30
            }]
        },
        plugins: [drawVerticalValuesPlugin],
        options: {
            responsive: true, maintainAspectRatio: false,
            onClick: handleChartClick('origem'),
            onHover: (event, chartElement) => { event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default'; },
            layout: { padding: { top: 25 } },
            plugins: { legend: { display: false } },
            scales: {
                y: { display: false, beginAtZero: true },
                x: { grid: { display: false }, ticks: { color: textColor, autoSkip: false, maxRotation: 45, minRotation: 45, font: { size: 10 } } }
            }
        }
    });
}

function renderTable(data) {
    const tbody = document.getElementById('data-table-body');
    tbody.innerHTML = '';
    data.forEach(d => {
        const tr = document.createElement('tr');
        const dLoja = d.loja && d.loja.trim() !== "" ? d.loja.trim().toUpperCase() : "SEM LOJA";
        tr.innerHTML = `
            <td title="${d.descricao}">${d.descricao}</td>
            <td>${d.dataCriacao}</td>
            <td><span style="padding: 4px 8px; background: rgba(255,255,255,0.1); border-radius: 4px; font-size: 0.8rem;">${d.status}</span></td>
            <td>${dLoja}</td>
            <td>${d.categoria || "-"}</td>
        `;
        tbody.appendChild(tr);
    });
}

function applyFilters() {
    const hasFilters = Object.values(currentFilters).some(v => v !== null) || 
                       globalFilters.loja !== "" || 
                       globalFilters.dataInicio !== null || 
                       globalFilters.dataFim !== null;
    document.getElementById('clear-filters-btn').style.display = hasFilters ? 'block' : 'none';

    const fullyFilteredData = getFilteredData(null); // Passa null para filtrar por TODOS
    updateKPIs(fullyFilteredData);
    renderCharts();
    renderTable(fullyFilteredData);
}

// Inicialização e Erros
async function initDashboard() {
    try {
        const rawTasks = await fetchAllClickUpTasks();
        allTasksData = processTasks(rawTasks);

        document.getElementById('loader-clickup').style.display = 'none';
        
        // Exibe os containers
        document.getElementById('dashboard-content').style.display = 'block'; // Or block since it's now wrapped
        document.getElementById('table-container').style.display = 'block';

        // Popula o dropdown de lojas
        const selectLoja = document.getElementById('filtro-loja');
        const lojasUnicas = [...new Set(allTasksData.map(t => t.loja).filter(Boolean))].sort();
        lojasUnicas.forEach(loja => {
            const option = document.createElement('option');
            option.value = loja;
            option.textContent = loja;
            selectLoja.appendChild(option);
        });

        // Listeners para os filtros globais (Dropdowns e Inputs de Data)
        document.getElementById('filtro-loja').addEventListener('change', (e) => {
            globalFilters.loja = e.target.value;
            applyFilters();
        });

        const updateDataFilters = () => {
            const dtInicioStr = document.getElementById('filtro-data-inicio').value;
            const dtFimStr = document.getElementById('filtro-data-fim').value;
            
            // Converter de YYYY-MM-DD para timestamp (usando timezone local)
            globalFilters.dataInicio = dtInicioStr ? new Date(dtInicioStr + "T00:00:00").getTime() : null;
            globalFilters.dataFim = dtFimStr ? new Date(dtFimStr + "T23:59:59").getTime() : null;
            applyFilters();
        };

        document.getElementById('filtro-data-inicio').addEventListener('change', updateDataFilters);
        document.getElementById('filtro-data-fim').addEventListener('change', updateDataFilters);

        // Lida com botão de limpar filtros
        document.getElementById('clear-filters-btn').addEventListener('click', () => {
            currentFilters = { loja: null, status: null, categoria: null, origem: null };
            
            // Limpa os globais e UI
            globalFilters = { loja: "", dataInicio: null, dataFim: null };
            document.getElementById('filtro-loja').value = "";
            document.getElementById('filtro-data-inicio').value = "";
            document.getElementById('filtro-data-fim').value = "";
            
            applyFilters();
        });

        // Configurações globais ChartJS
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.font.family = "'Sora', sans-serif";

        applyFilters(); // Renderiza a 1ª vez

    } catch (error) {
        console.error(error);
        const loader = document.getElementById('loader-clickup');
        loader.innerHTML = `
            <div style="background: rgba(220, 38, 38, 0.1); border: 1px solid #dc2626; padding: 20px; border-radius: 8px; text-align: left; max-width: 600px;">
                <h3 style="color: #ef4444; margin-top: 0; display: flex; align-items: center; gap: 10px;">
                    ⚠️ Erro ao carregar o painel
                </h3>
                <p style="color: #f87171; font-weight: bold; margin-bottom: 5px;">Detalhe Técnico: ${error.message}</p>
                <p style="color: #cbd5e1; font-size: 0.9rem; line-height: 1.5;">Se o erro for de conexão/API (CORS), seu provedor de rede pode estar bloqueando a comunicação com o ClickUp.</p>
            </div>
        `;
    }
}

document.addEventListener("DOMContentLoaded", initDashboard);
