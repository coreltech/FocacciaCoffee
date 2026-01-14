import { supabase } from '../../core/supabase.js';

export async function loadReports() {
    const container = document.getElementById('app-content');

    // Recuperar la meta configurada
    let currentMeta = localStorage.getItem('business-meta') || 3000;

    container.innerHTML = `
        <div class="main-container" id="report-to-print">
            <header style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:30px;">
                <div>
                    <h1 style="font-size: 1.8rem; margin:0;">📊 Reporte de Gestión Ejecutiva</h1>
                    <p style="color: #64748b; margin-top:5px;">${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}</p>
                </div>
                <div style="display:flex; gap:10px;">
                    <button id="btn-set-meta" style="background:#f1f5f9; border:1px solid #cbd5e1; padding:10px 15px; border-radius:8px; cursor:pointer; font-weight:bold;">🎯 Meta</button>
                    <button id="btn-pdf" style="background:#0f172a; color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:bold;">📥 Exportar PDF</button>
                </div>
            </header>

            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:20px;">
                <div class="stat-card" style="border-left: 4px solid #3b82f6;">
                    <small style="color:#64748b; font-weight:bold; letter-spacing:0.5px;">INVENTARIO (VALOR COSTO)</small>
                    <div id="inv-value" style="font-size:1.8rem; font-weight:800; color:#0f172a; margin-top:8px;">$0.00</div>
                </div>
                <div class="stat-card" style="border-left: 4px solid #8b5cf6;">
                    <small style="color:#64748b; font-weight:bold; letter-spacing:0.5px;">TICKET PROMEDIO</small>
                    <div id="avg-ticket" style="font-size:1.8rem; font-weight:800; color:#0f172a; margin-top:8px;">$0.00</div>
                </div>
                <div class="stat-card" style="border-left: 4px solid #10b981;">
                    <small style="color:#64748b; font-weight:bold; letter-spacing:0.5px;">VENTAS BRUTAS</small>
                    <div id="total-period-sales" style="font-size:1.8rem; font-weight:800; color:#10b981; margin-top:8px;">$0.00</div>
                </div>
            </div>

            <div id="goals-container" style="margin-top:25px;"></div>

            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap:25px; margin-top:25px;">
                <div class="stat-card">
                    <h3 style="margin-bottom:20px; font-size:1rem; color:#1e293b;">🏆 Top Productos (Venta USD)</h3>
                    <canvas id="topProductsChart" height="200"></canvas>
                </div>
                <div class="stat-card">
                    <h3 style="margin-bottom:20px; font-size:1rem; color:#1e293b;">🍕 Distribución de Gastos</h3>
                    <div style="max-width: 250px; margin: 0 auto;">
                        <canvas id="costStructureChart"></canvas>
                    </div>
                </div>
            </div>

            <div class="stat-card" style="margin-top:25px; padding:0; overflow:hidden;">
                <div style="padding:20px; background:#f8fafc; border-bottom:1px solid #e2e8f0;">
                    <h3 style="margin:0; font-size:1.1rem;">📑 Resumen Financiero Consolidadado</h3>
                </div>
                <table style="width:100%; border-collapse: collapse; font-size:0.95rem;">
                    <thead>
                        <tr style="text-align:left; color:#64748b; background:#fff;">
                            <th style="padding:15px 20px;">CONCEPTO</th>
                            <th style="text-align:right; padding:15px 20px;">MONTO USD</th>
                            <th style="text-align:right; padding:15px 20px;">% SOBRE VENTA</th>
                        </tr>
                    </thead>
                    <tbody id="financial-body"></tbody>
                </table>
            </div>
        </div>
    `;

    // Manejador de meta
    document.getElementById('btn-set-meta').onclick = () => {
        const val = prompt("Define tu meta de facturación mensual (USD):", currentMeta);
        if (val && !isNaN(val)) {
            localStorage.setItem('business-meta', val);
            loadReports();
        }
    };

    // Botón de PDF (Requiere jsPDF)
    document.getElementById('btn-pdf').onclick = () => {
        window.print(); // Solución nativa más estable para reportes con gráficas
    };

    await renderReportData(parseFloat(currentMeta));
}

async function renderReportData(metaMensual) {
    // 1. Fetching de datos reales
    const { data: sales } = await supabase.from('sales_orders').select('*');
    const { data: expenses } = await supabase.from('operational_expenses').select('*');
    const { data: supplies } = await supabase.from('supplies').select('last_purchase_price, stock_min_units');

    const totalVentas = sales?.reduce((acc, s) => acc + (parseFloat(s.total_amount) || 0), 0) || 0;
    const totalGastos = expenses?.reduce((acc, e) => acc + (parseFloat(e.amount_usd) || 0), 0) || 0;
    const valorInv = supplies?.reduce((acc, i) => acc + (parseFloat(i.last_purchase_price) || 0), 0) || 0;
    // Note: ValorInv simple implementation using last_purchase_price for the whole stock unit
    const avgTicket = sales?.length > 0 ? (totalVentas / sales.length) : 0;

    // Actualizar UI de KPIs con verificaciones de seguridad
    const invEl = document.getElementById('inv-value');
    const avgEl = document.getElementById('avg-ticket');
    const salesEl = document.getElementById('total-period-sales');

    if (invEl) invEl.innerText = `$${valorInv.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (avgEl) avgEl.innerText = `$${avgTicket.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (salesEl) salesEl.innerText = `$${totalVentas.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    // 2. Barra de Progreso de Meta
    const pct = Math.min((totalVentas / metaMensual) * 100, 100);
    const statusColor = pct < 50 ? '#ef4444' : (pct < 90 ? '#f59e0b' : '#10b981');

    const goalsContainer = document.getElementById('goals-container');
    if (goalsContainer) {
        goalsContainer.innerHTML = `
            <div class="stat-card" style="background: white; border: 1px solid #e2e8f0;">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span style="font-weight:bold; color:#1e293b;">Progreso de Meta Mensual</span>
                    <span style="font-weight:800; color:${statusColor}">${pct.toFixed(1)}%</span>
                </div>
                <div style="width:100%; background:#f1f5f9; height:14px; border-radius:10px; overflow:hidden;">
                    <div style="width:${pct}%; background:${statusColor}; height:100%; transition: width 0.8s ease-in-out;"></div>
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:10px; font-size:0.8rem; color:#64748b;">
                    <span>Vendido: $${totalVentas.toFixed(2)}</span>
                    <span>Objetivo: $${metaMensual.toFixed(2)}</span>
                </div>
            </div>
        `;
    }

    // 3. Gráficas (Chart.js)
    const productAgg = {};
    sales?.forEach(s => { productAgg[s.product_name || 'Otros'] = (productAgg[s.product_name] || 0) + parseFloat(s.total_amount); });

    const topProductsCanvas = document.getElementById('topProductsChart');
    if (topProductsCanvas) {
        new Chart(topProductsCanvas, {
            type: 'bar',
            data: {
                labels: Object.keys(productAgg),
                datasets: [{
                    data: Object.values(productAgg),
                    backgroundColor: '#3b82f6',
                    borderRadius: 5
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });
    }

    const expenseAgg = {};
    expenses?.forEach(e => { expenseAgg[e.category || 'Varios'] = (expenseAgg[e.category] || 0) + parseFloat(e.amount_usd); });

    const costStructureCanvas = document.getElementById('costStructureChart');
    if (costStructureCanvas) {
        new Chart(costStructureCanvas, {
            type: 'doughnut',
            data: {
                labels: Object.keys(expenseAgg),
                datasets: [{
                    data: Object.values(expenseAgg),
                    backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#7c3aed']
                }]
            },
            options: { cutout: '70%', plugins: { legend: { position: 'bottom' } } }
        });
    }

    // 4. Tabla Financiera (Estado de Resultados)
    const utilidad = totalVentas - totalGastos;
    const margin = totalVentas > 0 ? (utilidad / totalVentas * 100).toFixed(1) : 0;

    const dataRows = [
        { label: 'INGRESOS TOTALES', val: totalVentas, p: '100%', c: '#0f172a' },
        { label: 'COSTOS Y GASTOS OPERATIVOS', val: totalGastos, p: totalVentas > 0 ? (totalGastos / totalVentas * 100).toFixed(1) + '%' : '-', c: '#dc2626' },
        { label: 'UTILIDAD NETA ESTIMADA', val: utilidad, p: margin + '%', c: '#16a34a' }
    ];

    const financialBody = document.getElementById('financial-body');
    if (financialBody) {
        financialBody.innerHTML = dataRows.map(r => `
            <tr style="border-top:1px solid #f1f5f9; font-weight:bold; color:${r.c};">
                <td style="padding:18px 20px;">${r.label}</td>
                <td style="text-align:right; padding:18px 20px;">$${r.val.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td style="text-align:right; padding:18px 20px;">${r.p}</td>
            </tr>
        `).join('');
    }
}