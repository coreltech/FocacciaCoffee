export const SalesView = {
    renderLayout(container, initialDate, rates) {
        container.innerHTML = `
        <div class="main-container">
            <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; flex-wrap:wrap; gap:15px;">
                <div>
                    <h1 id="sales-title" style="font-size: 1.8rem; margin:0 0 8px 0;">🛒 Punto de Venta</h1>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <input type="date" id="filter-date" value="${initialDate}" class="input-field" 
                            style="padding:8px 12px; width:auto; font-size:0.85rem; border:2px solid #e2e8f0; border-radius:6px; box-sizing:border-box;">
                    </div>
                </div>
                <div style="background:#fff; padding:12px 16px; border-radius:10px; border:2px solid #e2e8f0;">
                    <small style="color:#64748b; font-weight:800; font-size:0.65rem; display:block; text-align:center;">TASA BCV</small>
                    <b style="display:block; text-align:center; font-size:1rem; margin-top:2px;">1$ = ${rates.tasa_usd_ves.toFixed(2)} Bs</b>
                </div>
            </header>

            <div style="display:grid; grid-template-columns: 1fr 1.2fr; gap:25px;" class="sales-grid">
                <!-- FORMULARIO DE VENTA -->
                <div class="stat-card" style="padding:25px;">
                    <h3 style="margin:0 0 20px 0; border-bottom: 2px solid #e2e8f0; padding-bottom:12px; font-size:1.1rem;">📝 Nueva Venta</h3>
                    
                    <div class="input-group">
                        <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">PRODUCTO</label>
                        <select id="v-catalog-select" class="input-field" 
                            style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                            <option value="">Cargando catálogo...</option>
                        </select>
                    </div>

                    <div id="manual-desc-container" class="input-group" style="display:none; margin-top:15px;">
                        <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">DESCRIPCIÓN DE VENTA MANUAL</label>
                        <input type="text" id="v-manual-desc" class="input-field" placeholder="Ej: Focaccia especial de ajo..." 
                            style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-top:15px;">
                        <div class="input-group">
                            <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">PRECIO $</label>
                            <input type="number" id="v-final-price" class="input-field" step="0.01" 
                                style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                        </div>
                        <div class="input-group">
                            <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">CANTIDAD</label>
                            <input type="number" id="v-qty" class="input-field" value="1" 
                                style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                        </div>
                    </div>

                    <div id="stock-warning" style="display:none; color:#ef4444; font-size:0.75rem; font-weight:bold; margin-top:8px; padding:8px; background:#fef2f2; border-radius:6px; border:1px solid #fecaca;">⚠️ Cantidad supera el stock disponible</div>

                    <div class="input-group" style="margin-top:15px;">
                        <label style="display:flex; justify-content:space-between; align-items:center; font-weight:600; font-size:0.85rem; margin-bottom:8px;">
                            CLIENTE
                            <button id="btn-add-customer" style="background:none; border:none; color:#2563eb; font-size:0.75rem; font-weight:800; cursor:pointer; padding:4px 8px; border-radius:4px; transition:background 0.2s;">+ NUEVO CLIENTE</button>
                        </label>
                        <select id="v-customer-id" class="input-field" 
                            style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                            <option value="">Cliente Genérico</option>
                        </select>
                    </div>

                    <div style="background:#f8fafc; padding:18px; border-radius:10px; border:2px solid #e2e8f0; margin-top:18px;">
                        <label style="font-size:0.75rem; color:#64748b; font-weight:800; text-transform:uppercase; display:block; margin-bottom:12px;">💳 Métodos de Pago (Multimoneda)</label>
                        <div id="payment-container">
                            <div class="pay-row" style="display:grid; grid-template-columns: 1fr 1fr 0.2fr; gap:8px; margin-bottom:10px;">
                                <input type="number" class="p-amt input-field" placeholder="Monto" 
                                    style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #cbd5e1; border-radius:6px;">
                                <select class="p-meth input-field" 
                                    style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #cbd5e1; border-radius:6px; font-size:0.8rem;">
                                    <option value="Efectivo $">💵 Efectivo $</option>
                                    <option value="Pago Móvil Bs">📲 Pago Móvil (Bs)</option>
                                    <option value="Zelle $">📱 Zelle $</option>
                                    <option value="Efectivo Bs">💸 Efectivo (Bs)</option>
                                    <option value="Transferencia EUR">🇪🇺 Transf. EUR</option>
                                </select>
                                <span class="p-currency-hint" style="font-size:0.75rem; display:flex; align-items:center; font-weight:bold;">$</span>
                            </div>
                        </div>
                        <button id="add-pay-row" 
                            style="width:100%; border:2px dashed #cbd5e1; background:white; color:#475569; padding:10px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:0.8rem; transition:all 0.2s;">
                            + Agregar Pago Combinado
                        </button>
                    </div>

                    <div style="background:#0f172a; color:white; padding:25px; border-radius:15px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); margin-top:18px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-size:0.9rem; color:#94a3b8; font-weight:600;">TOTAL A PAGAR</span>
                            <b id="txt-total-usd" style="color:#4ade80; font-size:2rem;">$0.00</b>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-top:8px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.1);">
                            <span style="font-size:0.85rem; color:#94a3b8;">EQUIVALENTE BS (BCV)</span>
                            <b id="txt-total-ves" style="font-size:1.2rem; color:#fff;">0.00 Bs</b>
                        </div>
                    </div>
                    <button id="btn-submit-sale" class="btn-primary" 
                        style="width:100%; padding:16px; margin-top:18px; background:#2563eb; color:white; border:none; border-radius:10px; cursor:pointer; font-weight:bold; font-size:1rem; transition:background 0.2s;">
                        🚀 Guardar Venta
                    </button>
                </div>

                <!-- LISTADO HISTÓRICO Y CIERRE -->
                <div>
                    <div id="daily-summary" style="background:#fff; border:2px solid #e2e8f0; border-radius:12px; padding:20px; margin-bottom:20px;">
                        <!-- Se llena dinámicamente -->
                    </div>

                    <div id="sales-history">
                        <!-- Se llena dinámicamente -->
                    </div>
                    
                    <button id="btn-load-more" 
                        style="width:100%; padding:15px; background:#f1f5f9; color:#64748b; border:none; border-radius:10px; cursor:pointer; font-weight:bold; margin-top:15px; display:none; transition:background 0.2s;">
                        ⬇️ Cargar más ventas
                    </button>
                </div>
            </div>
        </div>

        <style>
            .sales-grid {
                grid-template-columns: 1fr 1.2fr;
            }
            
            @media (max-width: 1024px) {
                .sales-grid {
                    grid-template-columns: 1fr !important;
                }
            }
            
            #btn-submit-sale:hover {
                background: #1d4ed8 !important;
            }
            
            #btn-add-customer:hover {
                background: #eff6ff;
            }
            
            #add-pay-row:hover {
                background: #f8fafc;
                border-color: #94a3b8;
            }
            
            #btn-load-more:hover {
                background: #e2e8f0;
            }
            
            .input-field:focus, select:focus {
                outline: none;
                border-color: #2563eb !important;
                box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
            }
        </style>
        `;
    },

    populateCatalog(catalog) {
        const select = document.getElementById('v-catalog-select');
        select.innerHTML = '<option value="">-- Seleccionar --</option>';
        catalog.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.dataset.price = p.precio_venta_final;
            opt.dataset.stock = p.stock_disponible || 0;
            opt.textContent = `${p.product_name} (Stock: ${p.stock_disponible || 0})`;
            select.appendChild(opt);
        });
        select.insertAdjacentHTML('beforeend', '<option value="manual">+ MANUAL (ESPECIFICAR)</option>');
    },

    populateCustomers(customers) {
        const select = document.getElementById('v-customer-id');
        // Mantener "Cliente Genérico"
        select.innerHTML = '<option value="">Cliente Genérico</option>';
        customers.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            select.appendChild(opt);
        });
    },

    renderSummary(resumen) {
        const div = document.getElementById('daily-summary');
        div.innerHTML = `
            <h4 style="margin:0 0 10px 0;">📊 Cierre del Día</h4>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:15px;">
                <div style="background:#f0fdf4; padding:10px; border-radius:8px;">
                    <small style="display:block; color:#166534;">ENTRÓ EN CAJA</small>
                    <b style="font-size:1.1rem;">$${(resumen.total - resumen.credito).toFixed(2)}</b>
                </div>
                <div style="background:#fff1f2; padding:10px; border-radius:8px;">
                    <small style="display:block; color:#991b1b;">EN CRÉDITO</small>
                    <b style="font-size:1.1rem;">$${resumen.credito.toFixed(2)}</b>
                </div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:5px;">
                ${Object.entries(resumen.metodos).map(([m, val]) => `<div style="font-size:0.7rem; background:#f8fafc; padding:4px 8px; border-radius:4px;">${m}: <b>$${val.toFixed(2)}</b></div>`).join('')}
            </div>
        `;
    },

    toggleLoadMore(show) {
        const btn = document.getElementById('btn-load-more');
        if (btn) btn.style.display = show ? 'block' : 'none';
    },

    renderHistory(sales, append = false) {
        const div = document.getElementById('sales-history');

        if (!append) {
            div.innerHTML = '';
        }

        if (sales.length === 0 && !append) {
            div.innerHTML = '<p style="text-align:center; color:#94a3b8;">No hay ventas registradas hoy.</p>';
            return;
        }

        const formatterVES = new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' });

        const html = sales.map(s => {
            const isWeb = s.product_name && s.product_name.startsWith('WEB:');
            const status = (s.payment_status || "").trim().toLowerCase();
            const isPending = (status !== 'pagado');

            // Lógica de Nombre: Priorizar customers DB, luego client_name de la web, luego Genérico
            let displayCustomer = s.customers?.name || s.payment_details?.customer_web || s.client_name || 'Cliente Genérico';
            if (isWeb) displayCustomer = `🌐 ${displayCustomer}`;

            // Metadata de entrega
            const orderTypeStr = s.payment_details?.order_type === 'delivery' ? '🛵 DELIVERY' : '📍 PICKUP';
            const addressStr = s.payment_details?.delivery_address;

            // Resumen de productos para la web
            const productTitle = (isWeb && s.payment_details?.resumen)
                ? s.payment_details.resumen
                : s.product_name;

            return `
                <div style="background:white; border:1px solid #f1f5f9; padding:15px; border-radius:10px; margin-bottom:12px; border-left:5px solid ${isPending ? '#f87171' : '#10b981'}; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div style="flex:1;">
                            <b style="font-size:0.95rem; color:#1e293b; display:block;">${productTitle}</b>
                            <span style="font-size:0.7rem; color:#64748b; font-weight:800; text-transform:uppercase;">${orderTypeStr}</span>
                        </div>
                        <button class="btn-delete-sale" data-id="${s.id}" style="background:none; border:none; color:#ef4444; cursor:pointer; padding:0 0 0 10px;">🗑️</button>
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:5px;">
                        <span style="font-size:0.85rem; color:#64748b; font-weight:500;">👤 ${displayCustomer}</span>
                        <b style="font-size:1rem; color:#0f172a;">$${parseFloat(s.total_amount).toFixed(2)}</b>
                    </div>

                    ${addressStr ? `
                        <div style="margin-top:8px; font-size:0.75rem; color:#0369a1; background:#f0f9ff; padding:8px; border-radius:6px; border:1px solid #bae6fd;">
                           🏠 <b>Dirección:</b> ${addressStr}
                        </div>
                    ` : ''}

                    ${(s.payment_details && s.payment_details.items) ? `
                        <div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:5px;">
                            ${s.payment_details.items.map(p => `
                                <span style="font-size:0.65rem; background:#f1f5f9; padding:2px 6px; border-radius:4px; color:#475569;">
                                    ${p.method}: <b>${p.currency === 'VES' ? p.amount_native.toFixed(2) + ' Bs' : '$' + p.amount_native.toFixed(2)}</b>
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}

                    ${isWeb && s.payment_details && !s.payment_details.items ? `
                        <div style="margin-top:12px; padding:10px; background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; font-size:0.8rem;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                                <span style="color:#0369a1;">Tasa aplic.:</span>
                                <span style="font-weight:bold;">${s.payment_details.tasa_bcv || 'N/A'}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed #bae6fd; pt:4px; margin-top:4px;">
                                <span style="color:#0369a1; font-weight:bold;">TOTAL BS:</span>
                                <b style="color:#0284c7; font-size:1rem;">${s.payment_details.total_ves ? formatterVES.format(s.payment_details.total_ves) : 'N/A'}</b>
                            </div>
                        </div>
                    ` : ''}

                    ${s.notes ? `
                        <div style="margin-top:8px; font-size:0.75rem; color:#64748b; background:#f8fafc; padding:8px; border-radius:6px; font-style:italic;">
                            📝 ${s.notes}
                        </div>
                    ` : ''}

                    ${isPending ? `
                        <button class="btn-confirm-pay" data-id="${s.id}" data-amount="${s.total_amount}"
                                style="width:100%; margin-top:12px; background:#2563eb; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:0.8rem; transition: background 0.2s;">
                            ✅ REGISTRAR COBRO TOTAL
                        </button>
                    ` : '<div style="text-align:right; margin-top:12px; color:#059669; font-weight:bold; font-size:0.85rem;">✓ PAGADO</div>'}
                </div>
            `;
        }).join('');

        div.insertAdjacentHTML('beforeend', html);
    },

    addPaymentRow() {
        const container = document.getElementById('payment-container');
        const row = document.createElement('div');
        row.className = 'pay-row';
        row.style = 'display:grid; grid-template-columns: 1fr 1fr 0.2fr; gap:5px; margin-bottom:8px;';
        row.innerHTML = `
            <input type="number" class="p-amt input-field" placeholder="Monto">
            <select class="p-meth input-field" style="font-size: 0.8rem;">
                <option value="Efectivo $">💵 Efectivo $</option>
                <option value="Pago Móvil Bs">📲 Pago Móvil (Bs)</option>
                <option value="Zelle $">📱 Zelle $</option>
                <option value="Efectivo Bs">💸 Efectivo (Bs)</option>
                <option value="Transferencia EUR">🇪🇺 Transf. EUR</option>
            </select>
            <span class="p-currency-hint" style="font-size:0.7rem; display:flex; align-items:center;">$</span>
        `;
        container.appendChild(row);

        // Auto-update currency hint
        const sel = row.querySelector('.p-meth');
        const hint = row.querySelector('.p-currency-hint');
        sel.onchange = () => {
            const val = sel.value;
            if (val.includes('$')) hint.innerText = '$';
            else if (val.includes('Bs')) hint.innerText = 'Bs';
            else if (val.includes('EUR')) hint.innerText = '€';
        };

        return row;
    },

    updateTotals(totalUSD, totalVES) {
        document.getElementById('txt-total-usd').innerText = `$${totalUSD.toFixed(2)}`;
        document.getElementById('txt-total-ves').innerText = `${totalVES.toFixed(2)} Bs`;
    },

    toggleStockWarning(show) {
        document.getElementById('stock-warning').style.display = show ? 'block' : 'none';
        const btn = document.getElementById('btn-submit-sale');
        if (show) {
            btn.disabled = true;
            btn.style.opacity = "0.5";
            btn.style.cursor = "not-allowed";
        } else {
            btn.disabled = false;
            btn.style.opacity = "1";
            btn.style.cursor = "pointer";
        }
    },

    // UI helper to toggle manual mode
    toggleManualMode(isManual, price) {
        const manualContainer = document.getElementById('manual-desc-container');
        const manualDesc = document.getElementById('v-manual-desc');
        const priceInput = document.getElementById('v-final-price');
        const qtyInput = document.getElementById('v-qty');

        if (isManual) {
            manualContainer.style.display = 'block';
            priceInput.value = "";
            priceInput.readOnly = false;
            priceInput.style.backgroundColor = "#fff";
            manualDesc.focus();
        } else {
            manualContainer.style.display = 'none';
            manualDesc.value = "";
            priceInput.value = price;
            priceInput.readOnly = true;
            priceInput.style.backgroundColor = "#f1f5f9";
            qtyInput.focus();
        }
    }
};
