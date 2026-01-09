import { supabase } from '../supabase.js';

export async function loadDashboard() {
    const container = document.getElementById('app-content');
    
    // 1. Lógica del saludo dinámico
    const ahora = new Date();
    const hora = ahora.getHours();
    let saludo = "¡Hola"; // Saludo por defecto

    if (hora >= 5 && hora < 12) {
        saludo = "¡Buenos días";
    } else if (hora >= 12 && hora < 19) {
        saludo = "¡Buenas tardes";
    } else {
        saludo = "¡Buenas noches";
    }

    // Aquí definimos el nombre. En el futuro, esto vendrá del login del usuario.
    const nombreUsuario = "Agustin"; 

    // 2. Carga de datos (Recetas, Tasas y Logs)
    const [recipeCountRes, logsRes, ratesRes] = await Promise.all([
        supabase.from('recipes').select('*', { count: 'exact', head: true }),
        supabase.from('production_logs').select('*').order('fecha_produccion', { ascending: false }).limit(10),
        supabase.from('global_config').select('*').eq('id', 'current_rates').single()
    ]);

    const recipeCount = recipeCountRes.count || 0;
    const historyLogs = logsRes.data || []; 
    const lastLog = historyLogs[0];
    const rates = ratesRes.data || { tasa_usd_ves: 0, tasa_eur_ves: 0 };

    window.navTo = (tabName) => {
        const targetBtn = document.querySelector(`.nav-btn[data-tab="${tabName}"]`);
        if (targetBtn) targetBtn.click();
    };

    container.innerHTML = `
        <style>
            .hero-section {
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                color: white; padding: 40px; border-radius: 28px;
                margin-bottom: 25px; position: relative; overflow: hidden;
            }
            .hero-section::after {
                content: '🥖'; position: absolute; right: -10px; bottom: -20px;
                font-size: 150px; opacity: 0.05; transform: rotate(-15deg);
            }
            .welcome-text h1 { font-size: 2.2rem; margin: 0; font-weight: 800; }
            .welcome-text p { opacity: 0.8; font-size: 1.1rem; margin-top: 5px; }
            
            .quick-access {
                display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 15px; margin-top: 30px;
            }
            .access-card {
                background: rgba(255,255,255,0.08); backdrop-filter: blur(12px);
                padding: 15px 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.15);
                transition: all 0.3s ease; cursor: pointer; text-align: center;
            }
            .access-card:hover { background: rgba(255,255,255,0.15); transform: translateY(-3px); }
            
            .info-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 20px; margin-bottom: 20px; }
            .chart-full { background: white; padding: 25px; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }

            @media (max-width: 900px) { .info-grid { grid-template-columns: 1fr; } }
        </style>

        <div class="main-container">
            <div class="hero-section">
                <div class="welcome-text">
                    <h1>${saludo}, ${nombreUsuario}! 👋</h1>
                    <p>Panel de control y rendimiento.</p>
                </div>
                <div class="quick-access">
                    <div class="access-card" onclick="navTo('produccion')">🚀 <b>Nueva Tanda</b></div>
                    <div class="access-card" onclick="navTo('recetas')">📖 <b>${recipeCount} Recetas</b></div>
                    <div class="access-card" onclick="navTo('suministros')">📦 <b>Suministros</b></div>
                </div>
            </div>

            <div class="info-grid">
                <div class="stat-card" style="margin:0; display:flex; flex-direction:column; justify-content:center;">
                    <h3 style="margin-top:0; color:#64748b; font-size:0.9rem; text-transform:uppercase;">📅 Última Producción</h3>
                    ${lastLog ? `
                        <div style="display:flex; align-items:center; gap:20px;">
                            <div style="font-size:3rem;">🍞</div>
                            <div style="flex-grow: 1;">
                                <div style="font-size: 1.4rem; font-weight:800; color:#0f172a;">${lastLog.recipe_name}</div>
                                <div style="font-size:0.95rem; color:#64748b;">${new Date(lastLog.fecha_produccion).toLocaleDateString('es-ES', {weekday: 'long', day: 'numeric', month: 'long'})}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 1.8rem; font-weight:900; color:#10b981;">$${lastLog.costo_total_tanda.toFixed(2)}</div>
                                <small style="color:#94a3b8; font-weight:bold;">INVERSIÓN</small>
                            </div>
                        </div>
                    ` : `<p style="color:#94a3b8;">No hay registros recientes.</p>`}
                </div>

                <div class="stat-card" style="margin:0;">
                    <h3 style="margin-top:0; color:#64748b; font-size:0.9rem; text-transform:uppercase;">💰 Tasas del Día</h3>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                        <div style="background:#f0fdf4; padding:10px; border-radius:12px; text-align:center; border:1px solid #dcfce7;">
                            <small style="display:block; color:#166534;">USD</small>
                            <b style="font-size:1.1rem; color:#166534;">${rates.tasa_usd_ves.toFixed(2)}</b>
                        </div>
                        <div style="background:#eff6ff; padding:10px; border-radius:12px; text-align:center; border:1px solid #dbeafe;">
                            <small style="display:block; color:#1e40af;">EUR</small>
                            <b style="font-size:1.1rem; color:#1e40af;">${rates.tasa_eur_ves.toFixed(2)}</b>
                        </div>
                    </div>
                </div>
            </div>

            <div class="chart-full">
                <h3 style="margin:0 0 20px 0; font-size: 1.1rem; color: #1e293b;">📈 Tendencia de Inversión</h3>
                <div style="height: 250px; width: 100%;">
                    <canvas id="productionChart"></canvas>
                </div>
            </div>
        </div>
    `;

    initChart([...historyLogs].reverse());
}


function initChart(logs) {
    const canvas = document.getElementById('productionChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (logs.length === 0) return;

    const labels = logs.map(l => new Date(l.fecha_produccion).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }));
    const dataValues = logs.map(l => l.costo_total_tanda);

    if (typeof Chart === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => draw(ctx, labels, dataValues);
        document.head.appendChild(script);
    } else {
        draw(ctx, labels, dataValues);
    }
}

function draw(ctx, labels, dataValues) {
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Costo de Tanda ($)',
                data: dataValues,
                borderColor: '#0f172a',
                backgroundColor: 'rgba(15, 23, 42, 0.05)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#10b981',
                pointBorderColor: 'white',
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { 
                    beginAtZero: false, 
                    grid: { color: '#f1f5f9' },
                    ticks: { callback: (value) => '$' + value }
                },
                x: { grid: { display: false } }
            }
        }
    });
}