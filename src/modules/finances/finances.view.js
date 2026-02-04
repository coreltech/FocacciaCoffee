export const FinancesView = {
    renderLayout(container) {
        container.innerHTML = `
        <div class="finances-container">
            <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h1 style="font-size:1.8rem; margin:0;">💰 Gestión de Inversión y Capital</h1>
                <button id="btn-download-report" class="btn-secondary" style="background:#fff; border:2px solid #cbd5e1; padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:bold; color:#475569;">
                    📄 Descargar Reporte PDF
                </button>
            </header>

            <!-- DASHBOARD DE RESUMEN -->
            <div id="finance-summary" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:20px; margin-bottom:30px;">
                <!-- Card Capital -->
                <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:20px; border-radius:12px; text-align:center;">
                    <h3 style="margin:0; color:#166534; font-size:0.9rem; text-transform:uppercase;">Capital Total Ingresado</h3>
                    <b id="summary-capital" style="display:block; font-size:2rem; color:#15803d; margin-top:5px;">$0.00</b>
                </div>
                
                <!-- Card Gastos -->
                <div style="background:#fff1f2; border:1px solid #fecaca; padding:20px; border-radius:12px; text-align:center; position:relative;">
                    <h3 style="margin:0; color:#991b1b; font-size:0.9rem; text-transform:uppercase;">Total Ejecutado / Gastos</h3>
                    <b id="summary-expenses" style="display:block; font-size:2rem; color:#b91c1c; margin-top:5px;">$0.00</b>
                </div>

                <!-- Card Disponible -->
                <div style="background:#eff6ff; border:1px solid #bfdbfe; padding:20px; border-radius:12px; text-align:center;">
                    <h3 style="margin:0; color:#1e40af; font-size:0.9rem; text-transform:uppercase;">Capital Disponible</h3>
                    <b id="summary-balance" style="display:block; font-size:2rem; color:#2563eb; margin-top:5px;">$0.00</b>
                </div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:25px;" class="finance-actions-grid">
                
                <!-- SECCION IZQUIERDA: NUEVO GASTO / FACTURA -->
                <div class="card" style="background:white; padding:25px; border-radius:10px; border:1px solid #e2e8f0; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
                    <h3 style="margin:0 0 15px 0; border-bottom:2px solid #f1f5f9; padding-bottom:10px;">🧾 Registrar Factura / Gasto</h3>
                    
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:10px;">
                        <input type="date" id="inv-date" class="input-field" value="${new Date().toISOString().split('T')[0]}">
                        <input type="text" id="inv-number" class="input-field" placeholder="Nro Factura (Opcional)">
                    </div>
                    <input type="text" id="inv-provider" class="input-field" placeholder="Proveedor / Beneficiario" style="width:100%; margin-bottom:10px;">
                    
                    <div style="background:#f8fafc; padding:10px; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:10px;">
                        <label style="font-size:0.75rem; font-weight:bold; color:#64748b; margin-bottom:5px; display:block;">ÍTEMS DE LA FACTURA</label>
                        <div id="invoice-items-container">
                            <!-- Items go here -->
                        </div>
                        <button id="btn-add-item" style="font-size:0.8rem; color:#2563eb; background:none; border:none; cursor:pointer; font-weight:bold; margin-top:5px;">+ Agregar Ítem</button>
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:15px; margin-bottom:15px;">
                        <b style="color:#0f172a;">TOTAL FACTURA:</b>
                        <b id="inv-total-display" style="font-size:1.2rem; color:#b91c1c;">$0.00</b>
                    </div>

                    <button id="btn-save-expense" class="btn-primary" style="width:100%; background:#ef4444; color:white; padding:12px; border-radius:8px; border:none; cursor:pointer; font-weight:bold;">Guardar Gasto</button>
                </div>

                <!-- SECCION DERECHA: NUEVO CAPITAL Y LISTAS -->
                <div>
                     <!-- FORMULARIO CAPITAL -->
                    <div class="card" style="background:white; padding:20px; border-radius:10px; border:1px solid #e2e8f0; margin-bottom:20px;">
                        <h3 style="margin:0 0 15px 0; border-bottom:2px solid #f1f5f9; padding-bottom:10px; color:#15803d;">➕ Ingresar Capital</h3>
                        <div style="display:flex; gap:10px;">
                            <input type="number" id="cap-amount" placeholder="Monto ($)" class="input-field" style="flex:1;">
                            <input type="text" id="cap-source" placeholder="Fuente / Socio" class="input-field" style="flex:2;">
                        </div>
                        <div style="display:flex; gap:10px; margin-top:10px;">
                            <input type="text" id="cap-notes" placeholder="Notas adicionales" class="input-field" style="flex:3;">
                            <button id="btn-save-capital" style="flex:1; background:#22c55e; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">Ingresar</button>
                        </div>
                    </div>

                    <!-- TABS HISTORIAL -->
                    <div class="card" style="background:white; border-radius:10px; border:1px solid #e2e8f0; overflow:hidden;">
                        <div style="display:flex; background:#f1f5f9; border-bottom:1px solid #e2e8f0;">
                            <button class="tab-btn active" data-tab="tab-expenses" style="flex:1; padding:12px; border:none; background:white; font-weight:bold; cursor:pointer; border-bottom:2px solid #ef4444;">Facturas Recientes</button>
                            <button class="tab-btn" data-tab="tab-capital" style="flex:1; padding:12px; border:none; background:#f1f5f9; color:#64748b; cursor:pointer;">Ingresos Capital</button>
                        </div>
                        
                        <div id="tab-expenses" class="tab-content" style="padding:0; max-height:400px; overflow-y:auto;">
                            <!-- Expenses List -->
                        </div>
                        <div id="tab-capital" class="tab-content" style="display:none; padding:0; max-height:400px; overflow-y:auto;">
                            <!-- Capital List -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <style>
             @media (max-width: 900px) {
                .finance-actions-grid { grid-template-columns: 1fr !important; }
             }
             .input-field { padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; width:100%; }
             .inv-item-row { display: grid; grid-template-columns: 2fr 0.8fr 1fr 0.2fr; gap: 5px; margin-bottom: 5px; }
        </style>
        `;
    },

    addItemRow() {
        const container = document.getElementById('invoice-items-container');
        const row = document.createElement('div');
        row.className = 'inv-item-row';
        row.innerHTML = `
            <input type="text" class="item-desc input-field" placeholder="Descripción" style="padding:6px;">
            <input type="number" class="item-qty input-field" placeholder="Cant." value="1" style="padding:6px;">
            <input type="number" class="item-price input-field" placeholder="Precio Unit." step="0.01" style="padding:6px;">
            <button class="btn-remove-item" style="background:#fee2e2; color:#ef4444; border:none; border-radius:4px; cursor:pointer;">×</button>
        `;
        container.appendChild(row);
        return row;
    },

    renderLists(expenses, capital) {
        // Render Expenses
        const expContainer = document.getElementById('tab-expenses');
        if (expenses.length === 0) {
            expContainer.innerHTML = '<p style="padding:20px; text-align:center; color:#94a3b8;">No hay gastos registrados.</p>';
        } else {
            expContainer.innerHTML = expenses.map(e => `
                <div style="padding:15px; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <b style="display:block; color:#1e293b; font-size:0.9rem;">${e.provider || 'Sin Proveedor'}</b>
                        <small style="color:#64748b;">${e.date} | Fact: ${e.invoice_number || 'N/A'}</small>
                        <div style="font-size:0.8rem; color:#475569; margin-top:4px;">
                            ${e.items && e.items.length ? e.items[0].description + (e.items.length > 1 ? ` y ${e.items.length - 1} más` : '') : 'Sin detalles'}
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <b style="color:#b91c1c;">$${parseFloat(e.total_amount).toFixed(2)}</b>
                        <button class="btn-del-exp" data-id="${e.id}" style="display:block; margin-left:auto; margin-top:5px; font-size:0.7rem; color:#ef4444; border:none; background:none; cursor:pointer; text-decoration:underline;">Eliminar</button>
                    </div>
                </div>
            `).join('');
        }

        // Render Capital
        const capContainer = document.getElementById('tab-capital');
        if (capital.length === 0) {
            capContainer.innerHTML = '<p style="padding:20px; text-align:center; color:#94a3b8;">No hay ingresos de capital.</p>';
        } else {
            capContainer.innerHTML = capital.map(c => `
                <div style="padding:15px; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <b style="display:block; color:#15803d; font-size:0.9rem;">${c.source}</b>
                        <small style="color:#64748b;">${c.date}</small>
                        ${c.notes ? `<div style="font-size:0.75rem; color:#64748b; font-style:italic;">${c.notes}</div>` : ''}
                    </div>
                    <div style="text-align:right;">
                        <b style="color:#15803d;">$${parseFloat(c.amount).toFixed(2)}</b>
                        <button class="btn-del-cap" data-id="${c.id}" style="display:block; margin-left:auto; margin-top:5px; font-size:0.7rem; color:#ef4444; border:none; background:none; cursor:pointer; text-decoration:underline;">Eliminar</button>
                    </div>
                </div>
            `).join('');
        }
    }
};
