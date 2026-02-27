/**
 * Controlador de Dashboard V2 (Refinado)
 */
import { DashboardView } from './dashboard.view.js';
import { DashboardService } from './dashboard.service.js';
import { Store } from '../../core/store.js';

export async function loadDashboard(container) {
    try {
        // Mostrar Loading animado (placeholder glass)
        container.innerHTML = `
            <div style="display:flex; justify-content:center; align-items:center; height:100%; flex-direction:column; gap:20px;">
                <div class="spinner"></div>
                <p style="color:var(--text-muted); font-weight:500;">Sincronizando métricas maestras...</p>
            </div>
            <style>
                .spinner { width: 40px; height: 40px; border: 4px solid rgba(112, 130, 56, 0.1); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
            </style>
        `;

        const metrics = await DashboardService.getDashboardMetrics();
        const userName = (Store.state.user?.name || "Focaccia").split(' ')[0];

        container.innerHTML = DashboardView.renderMain(metrics, userName);

        // Inicializar Gráficos con Chart.js
        renderMainCharts(metrics);

    } catch (error) {
        container.innerHTML = `
            <div style="padding:40px; text-align:center; color:var(--danger-color);">
                <h3>❌ Error al cargar dashboard inteligente</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function renderMainCharts(metrics) {
    // 1. Gráfico de Tendencia de Ventas (Lineal)
    const ctxSales = document.getElementById('dashboard-sales-chart')?.getContext('2d');
    if (ctxSales) {
        new Chart(ctxSales, {
            type: 'line',
            data: {
                labels: metrics.salesTrend.map(d => d.label),
                datasets: [{
                    label: 'Ventas USD',
                    data: metrics.salesTrend.map(d => d.total),
                    borderColor: '#708238',
                    backgroundColor: 'rgba(112, 130, 56, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#708238'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { padding: 12, backgroundColor: '#1e293b' }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { callback: (v) => '$' + v } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // 2. Gráfico de Top Productos (Doughnut)
    const ctxProducts = document.getElementById('dashboard-products-chart')?.getContext('2d');
    if (ctxProducts && metrics.topProducts.length > 0) {
        new Chart(ctxProducts, {
            type: 'doughnut',
            data: {
                labels: metrics.topProducts.map(p => p.name),
                datasets: [{
                    data: metrics.topProducts.map(p => p.total),
                    backgroundColor: [
                        '#708238', // Olive
                        '#eab308', // Gold
                        '#0ea5e9', // Sky
                        '#f43f5e', // Rose
                        '#8b5cf6'  // Violet
                    ],
                    borderWidth: 0,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}
