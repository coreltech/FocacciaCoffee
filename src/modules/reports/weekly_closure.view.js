export const WeeklyClosureView = {
    renderCard(id, content, isHtml = false) {
        const el = document.getElementById(id);
        if (el) {
            if (isHtml) el.innerHTML = content;
            else el.textContent = content;
        }
    },

    renderLayout(container) {
        container.innerHTML = `
        <div style="max-width:1100px; margin:0 auto; padding:20px; font-family:'Inter',sans-serif;">
            
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <div>
                    <h1 style="margin:0; font-size:1.8rem; color:#0f172a;">📊 Cierre Semanal</h1>
                    <p style="margin:5px 0 0; color:#64748b;">Resumen de rendimiento y rentabilidad.</p>
                </div>
                <div style="display:flex; gap:10px; align-items:flex-end;">
                    <div>
                        <label style="display:block; font-size:0.75rem; color:#64748b; margin-bottom:4px;">Desde</label>
                        <input type="date" id="report-start" style="padding:8px; border:1px solid #cbd5e1; border-radius:6px;">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.75rem; color:#64748b; margin-bottom:4px;">Hasta</label>
                        <input type="date" id="report-end" style="padding:8px; border:1px solid #cbd5e1; border-radius:6px;">
                    </div>
                    <button id="btn-refresh-report" style="padding:8px 12px; background:#0f172a; color:white; border:none; border-radius:6px; cursor:pointer;">🔄</button>
                    <button id="btn-print-report" onclick="window.print()" style="padding:8px 12px; background:#fff; border:1px solid #cbd5e1; border-radius:6px; cursor:pointer;" title="Imprimir / Guardar PDF">🖨️</button>
                </div>
            </div>

            <!-- KPI GRID -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:20px; margin-bottom:25px;">
                <div class="card p-4 bg-white rounded-lg shadow-sm border border-slate-200" style="background:white; padding:15px; border-radius:8px; border:1px solid #e2e8f0;">
                    <div style="font-size:0.75rem; font-weight:bold; color:#64748b; text-transform:uppercase; margin-bottom:4px;">Ventas Totales</div>
                    <div id="kpi-income" style="font-size:1.5rem; font-weight:bold; color:#0f172a;">$0.00</div>
                </div>
                <div class="card p-4 bg-white rounded-lg shadow-sm border border-slate-200" style="background:white; padding:15px; border-radius:8px; border:1px solid #e2e8f0;">
                    <div style="font-size:0.75rem; font-weight:bold; color:#64748b; text-transform:uppercase; margin-bottom:4px;">Costo Producción</div>
                    <div id="kpi-cost" style="font-size:1.5rem; font-weight:bold; color:#dc2626;">$0.00</div>
                </div>
                <div class="card p-4 bg-white rounded-lg shadow-sm border border-slate-200" style="background:white; padding:15px; border-radius:8px; border:1px solid #e2e8f0;">
                    <div style="font-size:0.75rem; font-weight:bold; color:#64748b; text-transform:uppercase; margin-bottom:4px;">Utilidad Bruta</div>
                    <div id="kpi-profit" style="font-size:1.5rem; font-weight:bold; color:#16a34a;">$0.00</div>
                </div>
                <!-- WINNER CARD -->
                <div class="card p-4 bg-white rounded-lg shadow-sm border border-amber-200 bg-amber-50" style="background:#fffbeb; padding:15px; border-radius:8px; border:1px solid #fcd34d;">
                    <div style="font-size:0.75rem; font-weight:bold; color:#b45309; text-transform:uppercase; margin-bottom:4px;">🏆 Producto Estrella</div>
                    <div id="kpi-winner">-</div>
                </div>
            </div>

            <!-- COBRANZA -->
            <div style="background:white; border-radius:12px; padding:20px; border:1px solid #e2e8f0; margin-bottom:25px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                <h3 style="margin-top:0; font-size:1rem; color:#475569; margin-bottom:15px;">Recuperación de Efectivo</h3>
                <div style="background:#f1f5f9; height:24px; border-radius:12px; overflow:hidden; position:relative;">
                    <div id="collection-progress" class="progress-bar" style="width:0%; height:100%; background:#22c55e; transition: width 0.5s ease;"></div>
                </div>
                <div id="collection-text" style="margin-top:10px; display:flex; justify-content:space-between; font-size:0.9rem; color:#64748b;">
                    0% Cobrado
                </div>
            </div>

            <div style="display:grid; grid-template-columns: 2fr 1fr; gap:20px;">
                <!-- Main Breakdown -->
                <div style="background:white; border-radius:12px; padding:20px; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                    <h3 style="margin-top:0; margin-bottom:15px; font-size:1.1rem; color:#0f172a;">Detalle por Producto</h3>
                    <div style="overflow-x:auto;">
                        <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
                            <thead>
                                <tr style="text-align:left; color:#64748b; border-bottom:2px solid #f1f5f9;">
                                    <th style="padding:10px;">Producto</th>
                                    <th style="padding:10px; text-align:center;">Cant.</th>
                                    <th style="padding:10px; text-align:right;">Venta</th>
                                    <th style="padding:10px; text-align:right;">Costo</th>
                                    <th style="padding:10px; text-align:right;">Margen</th>
                                </tr>
                            </thead>
                            <tbody id="breakdown-body">
                                <tr><td colspan="5" style="text-align:center; padding:20px;">Cargando...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Usage Side Panel -->
                <div id="usage-container" style="background:white; border-radius:12px; padding:20px; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                    <p style="text-align:center; color:#94a3b8;">Cargando insumos...</p>
                </div>
            </div>

        </div>
        
        <style>
            @media print {
                body * { visibility: hidden; }
                #app-content, #app-content * { visibility: visible; }
                #app-content { position: absolute; left: 0; top: 0; width: 100%; }
                #btn-refresh-report, #btn-print-report, .nav-group { display: none !important; }
            }
            .progress-bar.high { background: #22c55e; }
            .progress-bar.low { background: #eab308; }
        </style>
        `;
    },

    renderData(data) {
        const { summary, breakdown, usage } = data;

        // KPI Cards
        this.renderCard('kpi-income', `$${summary.totalIncome.toFixed(2)}`);
        this.renderCard('kpi-cost', `$${summary.totalCost.toFixed(2)}`);
        this.renderCard('kpi-profit', `$${summary.grossProfit.toFixed(2)}`);

        // Product Winner Card
        const winnerHtml = summary.winner.name !== 'N/A'
            ? `<div>
                 <div style="font-size:1.1rem; font-weight:bold; color:#0f172a;">${summary.winner.name}</div>
                 <div style="font-size:0.85rem; color:#16a34a;">+$${summary.winner.profit.toFixed(2)} Utilidad</div>
               </div>`
            : '<span style="color:#94a3b8;">Sin datos</span>';
        this.renderCard('kpi-winner', winnerHtml, true);

        // Collection Progress
        const progressBar = document.getElementById('collection-progress');
        const progressText = document.getElementById('collection-text');
        if (progressBar && progressText) {
            const pending = summary.totalIncome - summary.totalPaid;
            progressBar.style.width = `${summary.collectionProgress}%`;
            progressBar.className = summary.collectionProgress < 50 ? 'progress-bar low' : 'progress-bar high';

            progressText.innerHTML = `
                <b>${summary.collectionProgress.toFixed(1)}% Cobrado</b> ($${summary.totalPaid.toFixed(2)}) 
                <span style="color:#ef4444; margin-left:10px;">Pendiente: $${pending.toFixed(2)}</span>
            `;
        }

        // Product Breakdown Table
        const tbody = document.getElementById('breakdown-body');
        if (tbody) {
            if (breakdown.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#94a3b8;">No hay ventas en este período.</td></tr>`;
            } else {
                tbody.innerHTML = breakdown.map(p => {
                    const marginStyle = p.margin < 30 ? 'background:#fef2f2; color:#b91c1c;' : '';

                    return `
                    <tr style="border-bottom:1px solid #f1f5f9; ${marginStyle}">
                        <td style="padding:12px;">${p.name}</td>
                        <td style="padding:12px; text-align:center;">${p.qty}</td>
                        <td style="padding:12px; text-align:right;">$${p.income.toFixed(2)}</td>
                        <td style="padding:12px; text-align:right;">$${p.cost.toFixed(2)}</td>
                        <td style="padding:12px; text-align:right; font-weight:bold;">$${p.profit.toFixed(2)} (${p.margin.toFixed(1)}%)</td>
                    </tr>
                    `;
                }).join('');
            }
        }

        // Supply Usage Table (New)
        const usageContainer = document.getElementById('usage-container');
        if (usageContainer) {
            if (!usage || usage.length === 0) {
                usageContainer.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:20px;">Sin consumo registrado.</p>';
            } else {
                usageContainer.innerHTML = `
                    <h3 style="margin-top:0; margin-bottom:10px; font-size:1.1rem; color:#0f172a;">📦 Consumo Teórico</h3>
                    <div style="overflow-x:auto;">
                        <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
                            <thead>
                                <tr style="background:#f8fafc; color:#64748b; text-align:left;">
                                    <th style="padding:10px;">Insumo</th>
                                    <th style="padding:10px; text-align:center;">Cant.</th>
                                    <th style="padding:10px; text-align:right;">Costo ($)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${usage.slice(0, 15).map(u => `
                                    <tr style="border-bottom:1px solid #f1f5f9;">
                                        <td style="padding:8px; font-size:0.85rem;">${u.insumo_nombre}</td>
                                        <td style="padding:8px; text-align:center; font-size:0.85rem;">${u.cantidad_teorica_usada} ${u.unidad_medida}</td>
                                        <td style="padding:8px; text-align:right; font-size:0.85rem;">$${u.costo_teorico_usd}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        ${usage.length > 15 ? '<p style="text-align:center; font-size:0.75rem; color:#94a3b8; margin-top:5px;">Top 15 insumos mostrados</p>' : ''}
                    </div>
                `;
            }
        }
    }
};
