import { supabase } from '../supabase.js';

export async function loadReports() {
    const container = document.getElementById('app-content');
    
    // Recuperar la meta guardada o usar 3000 por defecto
    let currentMeta = localStorage.getItem('business-meta') || 3000;

    container.innerHTML = `
        <div class="main-container" id="report-content">
            <header class="header-flex">
                <div>
                    <h1>📄 Reporte Ejecutivo de Gestión</h1>
                    <p id="report-date">Análisis de Rendimiento Operativo</p>
                </div>
                <div style="display:flex; gap:10px;">
                    <button class="btn-secondary" id="btn-set-meta" style="background:#f1f5f9; border:1px solid #cbd5e1; color:#0f172a;">🎯 Definir Meta</button>
                    <button class="btn-primary" id="btn-pdf" style="background:#dc2626; border:none;">📥 Descargar PDF</button>
                </div>
            </header>

            <div class="main-grid" id="kpi-section">
                <div class="stat-card">
                    <small>VALOR DEL INVENTARIO (COSTO)</small>
                    <div id="inv-value" class="stat-value">$0.00</div>
                </div>
                <div class="stat-card">
                    <small>TICKET PROMEDIO DE VENTA</small>
                    <div id="avg-ticket" class="stat-value">$0.00</div>
                </div>
                <div class="stat-card">
                    <small>VENTAS TOTALES PERIODO</small>
                    <div id="total-period-sales" class="stat-value">$0.00</div>
                </div>
            </div>

            <div id="goals-container"></div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-top:20px;">
                <div class="stat-card">
                    <h3>🏆 Ventas por Producto</h3>
                    <canvas id="topProductsChart"></canvas>
                </div>
                <div class="stat-card">
                    <h3>📊 Estructura de Egresos</h3>
                    <canvas id="costStructureChart"></canvas>
                </div>
            </div>

            <div class="stat-card" style="margin-top:20px;">
                <h3>📑 Estado de Resultados (Consolidado USD)</h3>
                <table style="width:100%; border-collapse: collapse; margin-top:15px; font-size:0.95rem;">
                    <thead>
                        <tr style="border-bottom:2px solid #e2e8f0; text-align:left; color:#64748b;">
                            <th style="padding:12px;">CONCEPTO</th>
                            <th>MONTO USD</th>
                            <th>% PARTICIPACIÓN</th>
                        </tr>
                    </thead>
                    <tbody id="financial-body"></tbody>
                </table>
            </div>
        </div>
    `;

    // Lógica para cambiar la meta
    document.getElementById('btn-set-meta').onclick = () => {
        const newMeta = prompt("Ingresa la meta de venta mensual (USD):", currentMeta);
        if (newMeta !== null && !isNaN(newMeta)) {
            localStorage.setItem('business-meta', newMeta);
            loadReports(); // Recargar el módulo para aplicar cambios
        }
    };

    await generateProfessionalReport(parseFloat(currentMeta));
    document.getElementById('btn-pdf').onclick = exportToPDF;
}

async function generateProfessionalReport(metaMensual) {
    const { data: sales } = await supabase.from('sales').select('*, recipes(*)');
    const { data: expenses } = await supabase.from('expenses').select('*');
    const { data: ingredients } = await supabase.from('ingredients').select('*');

    const totalVentas = sales?.reduce((acc, s) => acc + parseFloat(s.total_usd), 0) || 0;
    const totalGastosFijos = expenses?.reduce((acc, e) => acc + parseFloat(e.monto_usd), 0) || 0;
    const valorInv = ingredients?.reduce((acc, i) => acc + (i.stock_actual * i.costo_unidad_medida * (i.unit_type === 'unidad' ? 1 : 1000)), 0) || 0;
    const avgTicket = sales?.length > 0 ? (totalVentas / sales.length) : 0;

    document.getElementById('inv-value').innerText = `$${valorInv.toFixed(2)}`;
    document.getElementById('avg-ticket').innerText = `$${avgTicket.toFixed(2)}`;
    document.getElementById('total-period-sales').innerText = `$${totalVentas.toFixed(2)}`;

    // Lógica visual de la meta
    const porcentajeLogrado = Math.min((totalVentas / metaMensual) * 100, 100);
    const colorBarra = porcentajeLogrado < 40 ? '#ef4444' : (porcentajeLogrado < 80 ? '#f59e0b' : '#10b981');
    
    document.getElementById('goals-container').innerHTML = `
        <div class="stat-card" style="margin-top:20px; background: #ffffff; border: 1px solid #e2e8f0; border-left: 6px solid ${colorBarra};">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h3 style="margin:0; font-size:1.1rem; color:#1e293b;">🎯 Objetivo Mensual</h3>
                <span style="font-weight:bold; color:${colorBarra}; font-size:1.2rem;">${porcentajeLogrado.toFixed(1)}%</span>
            </div>
            <div style="width:100%; background:#f1f5f9; height:14px; border-radius:10px; margin:15px 0; overflow:hidden; border:1px solid #e2e8f0;">
                <div style="width:${porcentajeLogrado}%; background:${colorBarra}; height:100%; transition:width 1.5s ease-in-out;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <p style="font-size:0.9rem; color:#64748b; margin:0;">
                    Vendido: <b>$${totalVentas.toFixed(2)}</b>
                </p>
                <p style="font-size:0.9rem; color:#64748b; margin:0;">
                    Meta: <b>$${metaMensual.toFixed(2)}</b>
                </p>
            </div>
        </div>
    `;

    // --- GRÁFICAS (Chart.js) ---
    const productData = {};
    sales?.forEach(s => {
        const nombre = s.recipes?.nombre || 'Desconocido';
        productData[nombre] = (productData[nombre] || 0) + parseFloat(s.total_usd);
    });

    new Chart(document.getElementById('topProductsChart'), {
        type: 'bar',
        data: {
            labels: Object.keys(productData),
            datasets: [{
                label: 'Ventas USD',
                data: Object.values(productData),
                backgroundColor: '#3b82f6',
                borderRadius: 5
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });

    const expenseCats = {};
    expenses?.forEach(e => {
        expenseCats[e.categoria] = (expenseCats[e.categoria] || 0) + parseFloat(e.monto_usd);
    });

    new Chart(document.getElementById('costStructureChart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(expenseCats),
            datasets: [{
                data: Object.values(expenseCats),
                backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#6366f1']
            }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });

    // --- TABLA FINANCIERA ---
    const utilidadNeta = totalVentas - totalGastosFijos; 
    const rows = [
        { label: 'INGRESOS POR VENTAS', val: totalVentas, pct: 100, bold: true, color: '#0f172a' },
        { label: 'GASTOS OPERATIVOS (Fijos)', val: totalGastosFijos, pct: totalVentas > 0 ? (totalGastosFijos/totalVentas*100).toFixed(1) : 0, bold: false, color: '#ef4444' },
        { label: 'UTILIDAD NETA ESTIMADA', val: utilidadNeta, pct: totalVentas > 0 ? (utilidadNeta/totalVentas*100).toFixed(1) : 0, bold: true, color: '#10b981' }
    ];

    document.getElementById('financial-body').innerHTML = rows.map(r => `
        <tr style="border-bottom:1px solid #f1f5f9; font-weight: ${r.bold ? '700' : '400'}; color: ${r.color};">
            <td style="padding:15px;">${r.label}</td>
            <td>$${r.val.toFixed(2)}</td>
            <td>${r.pct}%</td>
        </tr>
    `).join('');
}

async function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const element = document.getElementById('report-content');
    const btnContainer = document.querySelector('.header-flex div:last-child');

    btnContainer.style.opacity = '0'; // Ocultar botones

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Reporte_Negocio_${new Date().toISOString().split('T')[0]}.pdf`);
    
    btnContainer.style.opacity = '1';
}