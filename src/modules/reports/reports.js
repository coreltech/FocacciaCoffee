import { supabase } from '../../core/supabase.js';

import { loadReports as loadDashboard } from './reports.controller.js';

export async function loadReports() {
    // Forward to new controller
    await loadDashboard();
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