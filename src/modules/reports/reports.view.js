import { supabase } from '../../core/supabase.js';

export const ReportsView = {
    renderDashboard(container, data) {
        container.innerHTML = `
            <div class="main-container" style="animation: fadeIn 0.3s ease-in-out;">
                <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; flex-wrap:wrap; gap:15px;">
                    <div>
                        <h1 style="font-size: 1.8rem; margin:0 0 5px 0; color:#1e293b;">📊 Tablero de Control</h1>
                        <p style="color: #64748b; margin:0; font-size:0.9rem;">Análisis de Ventas y Rendimiento</p>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <input type="date" id="rep-date-start" value="${data.period.start}" class="input-field" style="padding:8px; border-radius:6px; border:1px solid #cbd5e1;">
                        <span style="align-self:center; color:#94a3b8;">➔</span>
                        <input type="date" id="rep-date-end" value="${data.period.end}" class="input-field" style="padding:8px; border-radius:6px; border:1px solid #cbd5e1;">
                        <button id="btn-refresh-rep" style="background:#2563eb; color:white; border:none; padding:8px 12px; border-radius:6px; cursor:pointer;">🔄 Actualizar</button>
                        <button id="btn-export-excel" style="background:#0f766e; color:white; border:none; padding:8px 12px; border-radius:6px; cursor:pointer;">📥 Excel</button>
                    </div>
                </header>

                <!-- KPI CARDS -->
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:20px; margin-bottom:30px;">
                    <div class="stat-card" style="background:white; padding:20px; border-radius:12px; border:1px solid #e2e8f0; border-left:4px solid #3b82f6;">
                        <small style="color:#64748b; font-weight:bold; text-transform:uppercase;">Ventas Totales</small>
                        <div style="font-size:1.8rem; font-weight:800; color:#1e293b; margin-top:5px;">$${data.kpis.totalSales.toFixed(2)}</div>
                        <div style="font-size:0.85rem; color:#3b82f6; margin-top:5px;">${data.kpis.totalOrders} órdenes</div>
                    </div>
                    
                    <div class="stat-card" style="background:white; padding:20px; border-radius:12px; border:1px solid #e2e8f0; border-left:4px solid #10b981;">
                        <small style="color:#64748b; font-weight:bold; text-transform:uppercase;">Cobrado (Caja)</small>
                        <div style="font-size:1.8rem; font-weight:800; color:#065f46; margin-top:5px;">$${data.kpis.collected.toFixed(2)}</div>
                        <div style="font-size:0.85rem; color:#10b981; margin-top:5px;">Efectivo disponible</div>
                    </div>

                    <div class="stat-card" style="background:white; padding:20px; border-radius:12px; border:1px solid #e2e8f0; border-left:4px solid #ef4444;">
                        <small style="color:#64748b; font-weight:bold; text-transform:uppercase;">Por Cobrar</small>
                        <div style="font-size:1.8rem; font-weight:800; color:#991b1b; margin-top:5px;">$${data.kpis.pending.toFixed(2)}</div>
                        <div style="font-size:0.85rem; color:#ef4444; margin-top:5px;">${data.kpis.pendingCount} pendientes</div>
                    </div>

                    <div class="stat-card" style="background:white; padding:20px; border-radius:12px; border:1px solid #e2e8f0; border-left:4px solid #8b5cf6;">
                        <small style="color:#64748b; font-weight:bold; text-transform:uppercase;">Ticket Promedio</small>
                        <div style="font-size:1.8rem; font-weight:800; color:#5b21b6; margin-top:5px;">$${data.kpis.avgTicket.toFixed(2)}</div>
                        <div style="font-size:0.85rem; color:#8b5cf6; margin-top:5px;">por orden</div>
                    </div>
                </div>

                <!-- CHARTS ROW -->
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap:25px; margin-bottom:30px;">
                    
                    <!-- TOP PRODUCTS -->
                    <div style="background:white; padding:20px; border-radius:12px; border:1px solid #e2e8f0;">
                         <h3 style="margin:0 0 15px 0; font-size:1rem; color:#334155;">🔥 Productos Más Vendidos</h3>
                         <div style="height:250px;">
                            <canvas id="chart-top-products"></canvas>
                         </div>
                    </div>

                    <!-- PAYMENT METHODS -->
                    <div style="background:white; padding:20px; border-radius:12px; border:1px solid #e2e8f0;">
                         <h3 style="margin:0 0 15px 0; font-size:1rem; color:#334155;">💳 Métodos de Pago</h3>
                         <div style="height:250px; display:flex; justify-content:center;">
                            <canvas id="chart-payment-methods"></canvas>
                         </div>
                    </div>
                </div>

                <!-- SALES TREND (Daily) -->
                <div style="background:white; padding:20px; border-radius:12px; border:1px solid #e2e8f0;">
                     <h3 style="margin:0 0 15px 0; font-size:1rem; color:#334155;">📈 Tendencia de Ventas (Diaria)</h3>
                     <div style="height:300px;">
                        <canvas id="chart-sales-trend"></canvas>
                     </div>
                </div>

            </div>
        `;

        this.renderCharts(data);
    },

    renderCharts(data) {
        // 1. Top Products (Bar Horizontal)
        new Chart(document.getElementById('chart-top-products'), {
            type: 'bar',
            data: {
                labels: data.charts.products.labels,
                datasets: [{
                    label: 'Ventas ($)',
                    data: data.charts.products.values,
                    backgroundColor: '#3b82f6',
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });

        // 2. Payment Methods (Doughnut)
        new Chart(document.getElementById('chart-payment-methods'), {
            type: 'doughnut',
            data: {
                labels: data.charts.payments.labels,
                datasets: [{
                    data: data.charts.payments.values,
                    backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#6366f1'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right' } }
            }
        });

        // 3. Sales Trend (Line)
        new Chart(document.getElementById('chart-sales-trend'), {
            type: 'line',
            data: {
                labels: data.charts.trend.labels,
                datasets: [{
                    label: 'Ventas ($)',
                    data: data.charts.trend.values,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
};
