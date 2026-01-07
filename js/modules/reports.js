import { supabase } from '../supabase.js';

export async function loadReports() {
    const container = document.getElementById('app-content');
    
    // Recuperar la meta guardada o usar 3000 por defecto
    let currentMeta = localStorage.getItem('business-meta') || 3000;

    container.innerHTML = `
        <div class="main-container" id="report-content">
            <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <div>
                    <h1>📄 Reporte Ejecutivo de Gestión</h1>
                    <p id="report-date">Análisis de Rendimiento Operativo (Consolidado USD)</p>
                </div>
                <div style="display:flex; gap:10px;">
                    <button class="btn-secondary" id="btn-set-meta" style="background:#f1f5f9; border:1px solid #cbd5e1; color:#0f172a; cursor:pointer; padding:8px 15px; border-radius:8px;">🎯 Definir Meta</button>
                    <button class="btn-primary" id="btn-pdf" style="background:#dc2626; border:none; padding:8px 15px; border-radius:8px; color:white; cursor:pointer;">📥 Descargar PDF</button>
                </div>
            </header>

            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:20px;" id="kpi-section">
                <div class="stat-card">
                    <small style="color:#64748b; font-weight:bold;">VALOR DEL INVENTARIO (COSTO)</small>
                    <div id="inv-value" style="font-size:1.5rem; font-weight:bold; color:#0f172a; margin-top:5px;">$0.00</div>
                </div>
                <div class="stat-card">
                    <small style="color:#64748b; font-weight:bold;">TICKET PROMEDIO</small>
                    <div id="avg-ticket" style="font-size:1.5rem; font-weight:bold; color:#0f172a; margin-top:5px;">$0.00</div>
                </div>
                <div class="stat-card">
                    <small style="color:#64748b; font-weight:bold;">VENTAS TOTALES</small>
                    <div id="total-period-sales" style="font-size:1.5rem; font-weight:bold; color:#10b981; margin-top:5px;">$0.00</div>
                </div>
            </div>

            <div id="goals-container"></div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-top:20px;">
                <div class="stat-card">
                    <h3>🏆 Ventas por Producto</h3>
                    <canvas id="topProductsChart"></canvas>
                </div>
                <div class="stat-card">
                    <h3>📊 Estructura de Gastos</h3>
                    <canvas id="costStructureChart"></canvas>
                </div>
            </div>

            <div class="stat-card" style="margin-top:20px;">
                <h3>📑 Estado de Resultados (Resumen USD)</h3>
                <table style="width:100%; border-collapse: collapse; margin-top:15px; font-size:0.95rem;">
                    <thead>
                        <tr style="border-bottom:2px solid #e2e8f0; text-align:left; color:#64748b;">
                            <th style="padding:12px;">CONCEPTO</th>
                            <th style="text-align:right;">MONTO USD</th>
                            <th style="text-align:right;">%</th>
                        </tr>
                    </thead>
                    <tbody id="financial-body"></tbody>
                </table>
            </div>
        </div>
    `;

    document.getElementById('btn-set-meta').onclick = () => {
        const newMeta = prompt("Ingresa la meta de venta mensual (USD):", currentMeta);
        if (newMeta !== null && !isNaN(newMeta)) {
            localStorage.setItem('business-meta', newMeta);
            loadReports(); 
        }
    };

    await generateProfessionalReport(parseFloat(currentMeta));
    
    // El botón PDF requiere html2canvas y jspdf cargados en el index.html
    document.getElementById('btn-pdf').onclick = () => {
        if (window.html2canvas && window.jspdf) {
            exportToPDF();
        } else {
            alert("Las librerías de PDF aún no han cargado completamente.");
        }
    };
}

async function generateProfessionalReport(metaMensual) {
    // 1. OBTENCIÓN DE DATOS (Ajustado a tus tablas reales)
    const { data: sales } = await supabase.from('sales_orders').select('*');
    const { data: expenses } = await supabase.from('operational_expenses').select('*');
    const { data: ingredients } = await supabase.from('ingredients').select('*');

    const totalVentas = sales?.reduce((acc, s) => acc + (parseFloat(s.total_amount) || 0), 0) || 0;
    const totalGastos = expenses?.reduce((acc, e) => acc + (parseFloat(e.amount_usd) || 0), 0) || 0;
    
    // Valor del inventario: Cantidad * Costo Unitario
    const valorInv = ingredients?.reduce((acc, i) => {
        const costo = parseFloat(i.costo_unidad_medida) || 0;
        const stock = parseFloat(i.stock_actual) || 0;
        return acc + (costo * stock);
    }, 0) || 0;
    
    const avgTicket = sales?.length > 0 ? (totalVentas / sales.length) : 0;

    // Actualizar KPIs
    document.getElementById('inv-value').innerText = `$${valorInv.toFixed(2)}`;
    document.getElementById('avg-ticket').innerText = `$${avgTicket.toFixed(2)}`;
    document.getElementById('total-period-sales').innerText = `$${totalVentas.toFixed(2)}`;

    // 2. LÓGICA DE BARRA DE META
    const porcentajeLogrado = Math.min((totalVentas / metaMensual) * 100, 100);
    const colorBarra = porcentajeLogrado < 40 ? '#ef4444' : (porcentajeLogrado < 80 ? '#f59e0b' : '#10b981');
    
    document.getElementById('goals-container').innerHTML = `
        <div class="stat-card" style="margin-top:20px; border-left: 6px solid ${colorBarra};">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h3 style="margin:0;">🎯 Objetivo Mensual</h3>
                <span style="font-weight:bold; color:${colorBarra}; font-size:1.2rem;">${porcentajeLogrado.toFixed(1)}%</span>
            </div>
            <div style="width:100%; background:#f1f5f9; height:12px; border-radius:10px; margin:15px 0; overflow:hidden;">
                <div style="width:${porcentajeLogrado}%; background:${colorBarra}; height:100%; transition:width 1s;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.85rem; color:#64748b;">
                <span>Progreso: $${totalVentas.toFixed(2)}</span>
                <span>Meta: $${metaMensual.toFixed(2)}</span>
            </div>
        </div>
    `;

    // 3. GRÁFICAS (Chart.js)
    // Agrupar ventas por producto
    const productData = {};
    sales?.forEach(s => {
        const nombre = s.product_name || 'Otros';
        productData[nombre] = (productData[nombre] || 0) + parseFloat(s.total_amount);
    });

    new Chart(document.getElementById('topProductsChart'), {
        type: 'bar',
        data: {
            labels: Object.keys(productData),
            datasets: [{
                label: 'Ventas USD',
                data: Object.values(productData),
                backgroundColor: '#3b82f6'
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });

    // Agrupar gastos por categoría
    const expenseCats = {};
    expenses?.forEach(e => {
        const cat = e.category || 'Otros';
        expenseCats[cat] = (expenseCats[cat] || 0) + parseFloat(e.amount_usd);
    });

    new Chart(document.getElementById('costStructureChart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(expenseCats),
            datasets: [{
                data: Object.values(expenseCats),
                backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#7c3aed']
            }]
        },
        options: { responsive: true }
    });

    // 4. ESTADO DE RESULTADOS
    const utilidadNeta = totalVentas - totalGastos;
    const marginPct = totalVentas > 0 ? (utilidadNeta / totalVentas * 100).toFixed(1) : 0;

    const rows = [
        { label: 'INGRESOS TOTALES', val: totalVentas, pct: 100, color: '#0f172a' },
        { label: 'GASTOS OPERATIVOS', val: totalGastos, pct: totalVentas > 0 ? (totalGastos/totalVentas*100).toFixed(1) : 0, color: '#ef4444' },
        { label: 'UTILIDAD NETA ESTIMADA', val: utilidadNeta, pct: marginPct, color: '#10b981' }
    ];

    document.getElementById('financial-body').innerHTML = rows.map(r => `
        <tr style="border-bottom:1px solid #f1f5f9; font-weight:bold; color:${r.color};">
            <td style="padding:15px;">${r.label}</td>
            <td style="text-align:right;">$${r.val.toFixed(2)}</td>
            <td style="text-align:right;">${r.pct}%</td>
        </tr>
    `).join('');
}