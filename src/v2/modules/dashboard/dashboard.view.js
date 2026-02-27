/**
 * Vista de Dashboard V2 - Edición Modern & Dynamic
 * Implementa estética de Glassmorphism y visualización avanzada
 */
import { Formatter } from '../../core/formatter.js';

export const DashboardView = {
    renderMain(metrics, userName = "Focaccia") {
        return `
            <div class="v2-dashboard fade-in">
                <header class="dashboard-header">
                    <div class="greeting">
                        <h2>¡Hola, ${userName}! 🥖</h2>
                        <p>Así va el desempeño de tu negocio esta semana.</p>
                    </div>
                </header>

                <!-- KPI Bento Grid -->
                <div class="kpi-bento-grid">
                    <!-- Primario: Ventas -->
                    <div class="bento-item glass-card main-kpi highlight-primary">
                        <div class="kpi-icon">💰</div>
                        <div class="kpi-info">
                            <span class="label">Ventas de la Semana</span>
                            <span class="value large">${Formatter.formatCurrency(metrics.weeklySales)}</span>
                            <div class="sub-info">Cobrado: <span class="collected">${Formatter.formatCurrency(metrics.collectedSales)}</span></div>
                        </div>
                    </div>

                    <!-- Secundario: Ticket Promedio -->
                    <div class="bento-item glass-card">
                        <div class="kpi-icon">🎫</div>
                        <div class="kpi-info">
                            <span class="label">Ticket Promedio</span>
                            <span class="value">${Formatter.formatCurrency(metrics.avgTicket)}</span>
                            <span class="trend neutral">Basado en órdenes</span>
                        </div>
                    </div>

                    <!-- Secundario: Por Cobrar -->
                    <div class="bento-item glass-card highlight-warning">
                        <div class="kpi-icon">⏳</div>
                        <div class="kpi-info">
                            <span class="label">Por Cobrar</span>
                            <span class="value">${Formatter.formatCurrency(metrics.totalReceivables)}</span>
                            <span class="trend negative">Balance pendiente</span>
                        </div>
                    </div>

                    <!-- Secundario: Pedidos -->
                    <div class="bento-item glass-card highlight-success">
                        <div class="kpi-icon">🥖</div>
                        <div class="kpi-info">
                            <span class="label">Pedidos Pendientes</span>
                            <span class="value">${metrics.pendingOrders}</span>
                            <span class="trend positive">En producción</span>
                        </div>
                    </div>
                </div>

                <!-- Charts & Lists Section -->
                <div class="dashboard-main-grid">
                    <!-- Gráfico Principal: Tendencia -->
                    <div class="card glass-card chart-container">
                        <h3 class="card-title">📉 Tendencia de Ventas</h3>
                        <div class="chart-wrapper">
                            <canvas id="dashboard-sales-chart"></canvas>
                        </div>
                    </div>

                    <!-- Top Productos -->
                    <div class="card glass-card pie-chart-container">
                        <h3 class="card-title">🏆 Top Productos (Semana)</h3>
                        <div class="chart-wrapper-small">
                            <canvas id="dashboard-products-chart"></canvas>
                        </div>
                        <div class="top-list mt-15">
                            ${metrics.topProducts.map((p, i) => `
                                <div class="top-item">
                                    <span class="rank">${i + 1}</span>
                                    <span class="name">${p.name}</span>
                                    <span class="total">${Formatter.formatCurrency(p.total)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Suministros Críticos -->
                    <div class="card glass-card stock-alerts">
                        <h3 class="card-title">🌿 Suministros Críticos (${metrics.lowStockCount})</h3>
                        <div class="alert-list">
                            ${metrics.lowStockItems.length === 0 ?
                '<p class="empty-msg">✅ Todo bajo control</p>' :
                metrics.lowStockItems.map(s => `
                                    <div class="alert-item">
                                        <div class="item-meta">
                                            <span class="name">${s.name}</span>
                                            <span class="limit">Mín: ${Formatter.formatNumber(s.min_stock)} ${s.measurement_unit}</span>
                                        </div>
                                        <span class="current-stock danger">${Formatter.formatNumber(s.stock)} ${s.measurement_unit}</span>
                                    </div>
                                `).join('')
            }
                        </div>
                        <button class="btn btn-outline-glass btn-sm w-100 mt-15" onclick="location.hash='#suministros'">
                            Ver Inventario
                        </button>
                    </div>

                    <!-- Acciones Rápidas Modernas -->
                    <div class="card glass-card quick-links">
                        <h3 class="card-title">⚡ Atajos</h3>
                        <div class="links-grid">
                            <button class="quick-btn pos" onclick="location.hash='#pos'">
                                <span class="icon">🛒</span>
                                <span class="text">POS</span>
                            </button>
                            <button class="quick-btn production" onclick="location.hash='#produccion'">
                                <span class="icon">⚖️</span>
                                <span class="text">Prod.</span>
                            </button>
                            <button class="quick-btn reports" onclick="location.hash='#reportes'">
                                <span class="icon">📊</span>
                                <span class="text">Rep.</span>
                            </button>
                            <button class="quick-btn settlement" onclick="location.hash='#liquidacion'">
                                <span class="icon">🤝</span>
                                <span class="text">Liq.</span>
                            </button>
                        </div>
                    </div>
                </div>

                <style>
                    .v2-dashboard { padding: 5px 0; }
                    .greeting h2 { margin-bottom: 5px; color: var(--text-main); font-weight: 800; }
                    .greeting p { color: var(--text-muted); margin-bottom: 25px; }

                    /* Bento Grid */
                    .kpi-bento-grid {
                        display: grid;
                        grid-template-columns: 2fr 1fr 1fr;
                        grid-template-rows: auto auto;
                        gap: 20px;
                        margin-bottom: 25px;
                    }

                    .main-kpi { grid-row: span 2; display: flex; align-items: center; gap: 20px; padding: 30px !important; }
                    .main-kpi .kpi-icon { font-size: 3rem; }
                    
                    .glass-card {
                        background: rgba(255, 255, 255, 0.7);
                        backdrop-filter: blur(12px);
                        border: 1px solid rgba(255, 255, 255, 0.3);
                        border-radius: var(--radius-xl);
                        padding: 20px;
                        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05);
                        transition: transform 0.2s ease, box-shadow 0.2s ease;
                    }

                    .glass-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.1); }

                    .highlight-primary { background: linear-gradient(135deg, rgba(112, 130, 56, 0.05) 0%, rgba(255, 255, 255, 0.7) 100%); border-left: 6px solid var(--primary-color); }
                    .highlight-warning { border-left: 6px solid #eab308; }
                    .highlight-success { border-left: 6px solid var(--success-color); }

                    .kpi-info .label { display: block; font-size: 0.85rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
                    .kpi-info .value { display: block; font-size: 1.6rem; font-weight: 800; color: var(--text-main); margin: 5px 0; }
                    .kpi-info .value.large { font-size: 2.2rem; }
                    .kpi-info .sub-info { font-size: 0.85rem; color: var(--text-muted); }
                    .kpi-info .collected { color: var(--success-color); font-weight: 700; }

                    /* Main Grid */
                    .dashboard-main-grid {
                        display: grid;
                        grid-template-columns: 2fr 1fr;
                        gap: 20px;
                    }

                    .chart-container { grid-column: span 1; min-height: 350px; }
                    .pie-chart-container { min-height: 350px; }
                    .chart-wrapper { height: 280px; width: 100%; margin-top: 15px; }
                    .chart-wrapper-small { height: 180px; width: 100%; display: flex; justify-content: center; }

                    .card-title { font-size: 1.1rem; color: var(--text-main); margin-bottom: 20px; font-weight: 700; display: flex; align-items: center; gap: 8px; }

                    /* Top List */
                    .top-item { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.05); }
                    .top-item:last-child { border-bottom: none; }
                    .top-item .rank { width: 24px; height: 24px; background: var(--bg-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; color: var(--primary-color); }
                    .top-item .name { flex: 1; font-size: 0.9rem; font-weight: 600; color: var(--text-main); }
                    .top-item .total { font-weight: 700; color: var(--primary-color); font-size: 0.9rem; }

                    /* Stock & Quick Links */
                    .stock-alerts .alert-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.05); }
                    .alert-item .name { display: block; font-weight: 700; font-size: 0.9rem; }
                    .alert-item .limit { font-size: 0.75rem; color: var(--text-muted); }
                    .current-stock.danger { color: #ef4444; font-weight: 800; font-size: 0.95rem; }

                    .links-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                    .quick-btn {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 8px;
                        padding: 15px;
                        border-radius: var(--radius-lg);
                        border: 1px solid rgba(255,255,255,0.4);
                        background: rgba(255,255,255,0.5);
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .quick-btn:hover { background: white; transform: scale(1.05); border-color: var(--primary-color); }
                    .quick-btn .icon { font-size: 1.4rem; }
                    .quick-btn .text { font-size: 0.8rem; font-weight: 700; color: var(--text-main); }

                    .btn-outline-glass { background: rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.1); color: var(--text-main); font-weight: 600; }
                    .btn-outline-glass:hover { background: rgba(0,0,0,0.07); }
                </style>
            </div>
        `;
    }
};
