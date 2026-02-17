import { supabase } from '../../core/supabase.js';
import { SettingsService } from '../settings/settings.service.js';

export async function loadDashboard() {
    const container = document.getElementById('app-content');

    // 1. Lógica de Saludo con Alma
    const ahora = new Date();
    const hora = ahora.getHours();
    let saludo = "¡Hola, Agustín!";
    let emoji = "🥖";

    if (hora >= 5 && hora < 12) {
        saludo = "¡Buen día, Agustín!";
        emoji = "☕";
    } else if (hora >= 12 && hora < 19) {
        saludo = "¡Buenas tardes, Agustín!";
        emoji = "🥖";
    } else {
        saludo = "¡Buenas noches, Agustín!";
        emoji = "🌙";
    }

    const mensajesAlma = [
        '¡Hoy es un gran día para hornear sueños! ✨',
        'El aroma a focaccia recién horneada ya se siente... 🥐',
        'Artesanía pura en cada amasado. ¡Vamos con todo! 💪',
        'Comparte la alegría de una focaccia en familia. ❤️',
        'Calidad mediterránea, sabor que enamora. 🌿'
    ];
    const mensajeDelDia = mensajesAlma[Math.floor(Math.random() * mensajesAlma.length)];

    // 2. Fetching de datos modernos
    const today = new Date().toISOString().split('T')[0];

    const [ratesRes, dailyCashRes, lowStockRes, suppliesRes, recipesRes] = await Promise.all([
        supabase.from('global_config').select('*').eq('id', 'current_rates').single(),
        supabase.from('v_daily_cash_closure').select('*').eq('closure_date', today),
        supabase.from('supplies').select('*').order('stock_min_units', { ascending: true }).limit(5),
        supabase.from('supplies').select('*'),
        supabase.from('recipes').select('*, items:recipe_items(*)').eq('name', 'Focaccia Base').single()
    ]);

    const rates = ratesRes.data || { tasa_usd_ves: 0, tasa_eur_ves: 0 };
    const dailyCash = dailyCashRes.data || [];
    const lowStock = lowStockRes.data || [];
    const allSupplies = suppliesRes.data || [];
    const focacciaRecipe = recipesRes.data;

    // Calcular KPIs de Hoy
    const totalTodayUSD = dailyCash.reduce((acc, c) => acc + (parseFloat(c.total_usd) || 0), 0);
    const totalTodayVES = dailyCash.reduce((acc, c) => acc + (parseFloat(c.total_native) || 0), 0);
    const transCount = dailyCash.reduce((acc, c) => acc + (c.transaction_count || 0), 0);
    const avgTicket = transCount > 0 ? (totalTodayUSD / transCount) : 0;

    // Calcular Capacidad de Producción (Focaccia Base)
    let capacity = 0;
    if (focacciaRecipe && focacciaRecipe.items) {
        const limits = focacciaRecipe.items.map(ri => {
            const supply = allSupplies.find(s => s.id === ri.supply_id);
            if (!supply || ri.quantity === 0) return Infinity;
            return Math.floor(supply.stock_min_units / ri.quantity);
        });
        capacity = Math.min(...limits);
    }

    window.navTo = (tabName) => {
        const targetBtn = document.querySelector(`.nav-btn[data-tab="${tabName}"]`);
        if (targetBtn) targetBtn.click();
    };

    // --- WORKFLOW LOGIC ---
    const dayOfWeek = new Date().getDay(); // 0 (Sun) to 6 (Sat)
    let workflowPhase = {
        title: "Modo: Tomar Pedidos",
        desc: "Fase de recolección de reservas para la semana.",
        icon: "📝",
        color: "#3b82f6", // Blue
        action: "ventas",
        btnText: "Ir a Reservas"
    };

    if (dayOfWeek >= 0 && dayOfWeek <= 3) {
        // Domingo (0) a Miércoles (3)
        workflowPhase = {
            title: "Fase: Tomar Reservas",
            desc: "Abierto para recibir pedidos hasta el miércoles.",
            icon: "📝",
            color: "#3b82f6", // Blue
            action: "ventas",
            btnText: "Gestionar Pedidos"
        };
    } else if (dayOfWeek === 4) {
        // Jueves (4)
        workflowPhase = {
            title: "Fase: Producción",
            desc: "Día de preparación de masa y mise en place.",
            icon: "🥣",
            color: "#eab308", // Yellow
            action: "produccion",
            btnText: "Ir a Producción"
        };
    } else if (dayOfWeek === 5) {
        // Viernes (5)
        workflowPhase = {
            title: "Fase: Horneado y Despacho",
            desc: "Hornear focaccias frescas y coordinar entregas.",
            icon: "🔥",
            color: "#f97316", // Orange
            action: "produccion",
            btnText: "Ver Producción"
        };
    } else if (dayOfWeek === 6) {
        // Sábado (6)
        workflowPhase = {
            title: "Fase: Despacho y Entregas",
            desc: "Entrega final a clientes y cierre de semana.",
            icon: "🚚",
            color: "#10b981", // Green
            action: "ventas", // Or dispatch module if exists (sales for now)
            btnText: "Ver Entregas"
        };
    }

    container.innerHTML = `
        <style>
            .dashboard-gourmet {
                color: var(--coffee);
                background-color: var(--warm-white);
                min-height: 100vh;
                padding: 10px;
                animation: fadeIn 0.5s ease-out;
            }

            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

            .workflow-banner {
                background: linear-gradient(135deg, ${workflowPhase.color} 0%, #ffffff 100%);
                border-left: 8px solid ${workflowPhase.color};
                padding: 20px;
                border-radius: 12px;
                margin-bottom: 25px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 15px;
            }


            .hero-gourmet-structured {
                margin-bottom: 30px;
                text-align: center;
                padding: 20px 0;
            }

            .card-structured {
                background-color: var(--sand-beige);
                border: 1px solid var(--border);
                border-radius: 15px;
                box-shadow: 0 4px 15px rgba(62, 39, 35, 0.05), inset 0 0 40px rgba(255,255,255,0.1);
                overflow: hidden;
                margin-bottom: 25px;
                transition: var(--transition);
            }

            .card-structured:hover {
                transform: translateY(-3px);
                box-shadow: 0 8px 25px rgba(62, 39, 35, 0.1);
            }

            .card-header-gourmet {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 20px;
                background: rgba(62, 39, 35, 0.06);
                border-bottom: 1px solid var(--border);
            }

            .card-header-gourmet h3 {
                margin: 0;
                font-size: 1.1rem;
                font-family: var(--font-head);
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .kpi-grid-structured {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                padding: 20px;
            }

            .kpi-box {
                background: white;
                border: 1px solid var(--border);
                padding: 20px;
                border-radius: 12px;
                text-align: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.02);
            }

            .kpi-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); font-weight: 700; }
            .kpi-value { font-size: 1.8rem; font-weight: 900; color: var(--coffee); margin-top: 5px; }

            .action-bar-structured {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 12px;
                padding: 20px;
            }

            .btn-structured {
                background: white;
                color: var(--coffee);
                border: 1px solid var(--border);
                padding: 15px;
                border-radius: 12px;
                font-weight: 800;
                cursor: pointer;
                transition: var(--transition);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                font-size: 0.85rem;
                box-shadow: 0 2px 6px rgba(0,0,0,0.03);
            }

            .btn-structured:hover {
                background: var(--warm-white);
                border-color: var(--olive);
                transform: translateY(-2px);
            }

            .main-grid-structured {
                display: grid;
                grid-template-columns: 1.2fr 0.8fr;
                gap: 25px;
            }

            .content-box {
                padding: 20px;
            }

            .capacity-display {
                background: white;
                border: 2px solid var(--olive);
                color: var(--olive);
                padding: 30px;
                text-align: center;
                border-radius: 20px;
                margin-top: 10px;
            }

            .stock-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 15px;
                background: white;
                border: 1px solid var(--border);
                border-radius: 10px;
                margin-bottom: 8px;
            }

            @media (max-width: 1000px) { .main-grid-structured { grid-template-columns: 1fr; } }
        </style>

        <div class="dashboard-gourmet">
            <div class="hero-gourmet-structured">
                <h1 style="font-size: 2.8rem; margin: 0; font-weight: 900; color: var(--coffee);">${saludo} <span style="font-size: 1.5rem;">${emoji}</span></h1>
                <p style="font-size: 1.2rem; color: var(--terracotta); font-weight: 600; font-family: var(--font-head); margin-top: 5px;">${mensajeDelDia}</p>
            </div>

            <!-- WORKFLOW BANNER -->
            <div class="workflow-banner">
                <div>
                    <h2 style="margin:0; font-size: 1.4rem; color: #1e293b; display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 1.8rem;">${workflowPhase.icon}</span> 
                        ${workflowPhase.title}
                    </h2>
                    <p style="margin: 5px 0 0 0; color: #475569; font-weight: 500;">${workflowPhase.desc}</p>
                </div>
                <button onclick="navTo('${workflowPhase.action}')" 
                    style="background: white; color: ${workflowPhase.color}; border: 2px solid ${workflowPhase.color}; padding: 10px 20px; border-radius: 8px; font-weight: 800; cursor: pointer; transition: all 0.2s;">
                    ${workflowPhase.btnText} →
                </button>
            </div>

            <!-- SECCIÓN KPIs y ACCIONES -->
            <div class="card-structured">
                <div class="card-header-gourmet">
                    <span style="font-size: 1.5rem;">📊</span>
                    <h3 style="color: var(--terracotta);">Resumen del Día y Acciones</h3>
                </div>
                <div class="kpi-grid-structured">
                    <div class="kpi-box" style="border-top: 4px solid #10b981;">
                        <div class="kpi-label">Ventas Hoy (USD)</div>
                        <div class="kpi-value" style="color: #10b981;">$${totalTodayUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div class="kpi-box" style="border-top: 4px solid var(--olive);">
                        <div class="kpi-label">Ventas Hoy (VES)</div>
                        <div class="kpi-value" style="color: var(--olive);">Bs ${totalTodayVES.toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div class="kpi-box" style="border-top: 4px solid var(--terracotta);">
                        <div class="kpi-label">Ticket Promedio</div>
                        <div class="kpi-value" style="color: var(--terracotta);">$${avgTicket.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    </div>
                </div>
                <div class="action-bar-structured">
                    <button class="btn-structured" onclick="navTo('ventas')">
                        <span style="font-size: 1.8rem;">💰</span>
                        <span style="font-weight:900;">Ventas</span>
                    </button>
                    <button class="btn-structured" onclick="navTo('produccion')">
                        <span style="font-size: 1.8rem;">🥣</span>
                        <span style="font-weight:900;">Producción</span>
                    </button>
                    <button class="btn-structured" onclick="navTo('mermas')">
                        <span style="font-size: 1.8rem;">🗑️</span>
                        <span style="color: #bc4749; font-weight:900;">Mermas</span>
                    </button>
                    <button class="btn-structured" onclick="navTo('reportes')">
                        <span style="font-size: 1.8rem;">📈</span>
                        <span style="font-weight:900;">Análisis</span>
                    </button>
                </div>
            </div>

            <div class="main-grid-structured">
                <!-- GRÁFICO -->
                <div class="card-structured">
                    <div class="card-header-gourmet">
                        <span style="font-size: 1.5rem;">📈</span>
                        <h3 style="color: var(--coffee);">Tendencia Semanal</h3>
                    </div>
                    <div class="content-box">
                        <div style="height: 320px;">
                            <canvas id="salesTrendsChart"></canvas>
                        </div>
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <!-- CAPACIDAD -->
                    <div class="card-structured">
                        <div class="card-header-gourmet">
                            <span style="font-size: 1.5rem;">🥖</span>
                            <h3 style="color: var(--olive);">Capacidad de Horno</h3>
                        </div>
                        <div class="content-box" style="text-align: center;">
                            <div class="capacity-display">
                                <div style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">Focaccia Base</div>
                                <div style="font-size: 4rem; font-weight: 900; line-height: 1;">${capacity}</div>
                                <div style="font-size: 0.9rem; font-weight: 700; margin-top: 5px;">Unidades Disponibles</div>
                            </div>
                            <button class="btn-primary" style="margin-top: 15px; width: 100%;" onclick="navTo('produccion')">¡Encender Hornos!</button>
                        </div>
                    </div>

                    <!-- STOCK CRÍTICO -->
                    <div class="card-structured">
                        <div class="card-header-gourmet">
                            <span style="font-size: 1.5rem;">🌿</span>
                            <h3 style="color: var(--olive);">Materia Prima Crítica</h3>
                        </div>
                        <div class="content-box">
                            <div id="low-stock-list">
                                ${lowStock.map(s => `
                                    <div class="stock-item">
                                        <div>
                                            <div style="font-weight: 800; font-size: 0.9rem;">${s.name}</div>
                                            <div style="font-size: 0.65rem; color: var(--text-muted);">${s.brand || 'Artesanal'}</div>
                                        </div>
                                        <div style="text-align: right;">
                                            <div style="font-size: 1rem; font-weight: 900; color: ${s.stock_min_units <= s.min_stock_threshold ? 'var(--error)' : 'var(--terracotta)'}">
                                                ${s.stock_min_units} ${s.min_unit}
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            <button class="btn-structured" style="width: 100%; margin-top: 10px; background: rgba(0,0,0,0.02);" onclick="navTo('suministros')">Ir a Inventario</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    renderSalesChart();
}

async function renderSalesChart() {
    const canvas = document.getElementById('salesTrendsChart');
    if (!canvas) return;

    // Obtener los últimos 7 días
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push(d.toISOString().split('T')[0]);
    }

    const { data } = await supabase.from('v_daily_cash_closure').select('*').in('closure_date', last7Days);

    const chartData = last7Days.map(date => {
        const daySales = (data || []).filter(d => d.closure_date === date);
        return daySales.reduce((acc, s) => acc + (parseFloat(s.total_usd) || 0), 0);
    });

    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: last7Days.map(d => new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })),
            datasets: [{
                label: 'Ventas USD ($)',
                data: chartData,
                backgroundColor: '#708238', // Olive
                borderRadius: 12,
                hoverBackgroundColor: '#e2725b' // Terracotta
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#3e2723',
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    padding: 12,
                    displayColors: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#f0ebd8' },
                    ticks: {
                        callback: (v) => '$' + v,
                        color: '#8d7b68',
                        font: { weight: '600' }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        color: '#8d7b68',
                        font: { weight: '600' }
                    }
                }
            }
        }
    });
}
