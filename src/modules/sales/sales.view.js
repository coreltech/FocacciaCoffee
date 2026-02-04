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
                        
                        <div style="display:flex; align-items:center; gap:5px; background:white; padding:5px 10px; border-radius:6px; border:1px solid #e2e8f0;">
                            <input type="checkbox" id="chk-view-delivery" style="cursor:pointer;">
                            <label for="chk-view-delivery" style="font-size:0.8rem; cursor:pointer; user-select:none;">Ver Entregas/Reservas</label>
                        </div>
                    </div>
                </div>
                <div style="background:#fff; padding:12px 16px; border-radius:10px; border:2px solid #e2e8f0;">
                    <small style="color:#64748b; font-weight:800; font-size:0.65rem; display:block; text-align:center;">TASA BCV</small>
                    <b style="display:block; text-align:center; font-size:1rem; margin-top:2px;">1$ = ${rates.tasa_usd_ves.toFixed(2)} Bs</b>
                </div>
            </header>

            <div style="display:grid; grid-template-columns: 1fr 1.2fr; gap:25px;" class="sales-grid">
                <!-- COLUMNA IZQUIERDA: FORMULARIO Y CARRITO -->
                <div class="stat-card" style="padding:25px;">
                    <h3 style="margin:0 0 20px 0; border-bottom: 2px solid #e2e8f0; padding-bottom:12px; font-size:1.1rem;">📝 Nueva Venta</h3>
                    
                    <div class="input-group">
                        <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">PRODUCTO</label>
                        <select id="v-catalog-select" class="input-field" 
                            style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                            <option value="">Cargando catálogo...</option>
                        </select>
                    </div>

                    <div class="input-group" style="margin-top:15px;">
                        <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">📅 FECHA DE RESERVA / ENTREGA</label>
                        <input type="date" id="v-delivery-date" class="input-field" 
                            style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #bae6fd; border-radius:6px; background-color:#f0f9ff; color:#0369a1; font-weight:bold;">
                        <small style="display:block; color:#64748b; font-size:0.7rem; margin-top:4px;">* Dejar vacío para entrega inmediata.</small>
                    </div>

                    <div id="manual-desc-container" class="input-group" style="display:none; margin-top:15px;">
                        <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">DESCRIPCIÓN DE VENTA MANUAL</label>
                        <input type="text" id="v-manual-desc" class="input-field" placeholder="Ej: Focaccia especial de ajo..." 
                            style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-top:15px;">
                        <div class="input-group">
                            <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">PRECIO UNIT. $</label>
                            <input type="number" id="v-final-price" class="input-field" step="0.01" 
                                style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                        </div>
                        <div class="input-group">
                            <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">CANTIDAD</label>
                            <input type="number" id="v-qty" class="input-field" value="1" min="1"
                                style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                        </div>
                    </div>

                    <div id="stock-warning" style="display:none; color:#ef4444; font-size:0.75rem; font-weight:bold; margin-top:8px; padding:8px; background:#fef2f2; border-radius:6px; border:1px solid #fecaca;">⚠️ Cantidad supera el stock disponible</div>

                    <!-- BOTÓN AGREGAR AL CARRITO -->
                    <button id="btn-add-to-cart" class="btn-secondary" 
                        style="width:100%; padding:12px; margin-top:10px; background:#f1f5f9; color:#334155; border:1px solid #cbd5e1; border-radius:8px; cursor:pointer; font-weight:bold; font-size:0.9rem; transition:all 0.2s;">
                        🛒 Agregar al Carrito
                    </button>

                    <!-- SECCIÓN CARRITO -->
                    <div id="cart-section" style="margin-top:25px; border-top:2px dashed #e2e8f0; padding-top:15px;">
                        <h4 style="margin:0 0 10px 0; color:#475569;">🛍️ Carrito de Compra <span id="cart-count-badge" style="background:#ef4444; color:white; font-size:0.7rem; padding:2px 6px; border-radius:10px; display:none;">0</span></h4>
                        
                        <div id="cart-list" style="max-height: 200px; overflow-y: auto; margin-bottom:15px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px;">
                            <p style="text-align:center; color:#94a3b8; font-size:0.8rem; margin:10px 0;">Carrito vacío</p>
                        </div>
                        
                        <!-- CLIENTE (AHORA GLOBAL PARA EL CARRITO) -->
                        <div class="input-group">
                            <label style="display:flex; justify-content:space-between; align-items:center; font-weight:600; font-size:0.85rem; margin-bottom:8px;">
                                CLIENTE
                                <button id="btn-add-customer" style="background:none; border:none; color:#2563eb; font-size:0.75rem; font-weight:800; cursor:pointer; padding:4px 8px; border-radius:4px; transition:background 0.2s;">+ NUEVO CLIENTE</button>
                            </label>
                            <select id="v-customer-id" class="input-field" 
                                style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                                <option value="">Cliente Genérico</option>
                            </select>
                            
                            <div id="new-customer-form" style="display:none; background:#eff6ff; padding:12px; border-radius:8px; margin-top:8px; border:1px solid #bfdbfe;">
                                <label style="font-size:0.75rem; color:#1e40af; font-weight:bold; display:block; margin-bottom:8px;">REGISTRAR NUEVO CLIENTE</label>
                                <input type="text" id="new-cust-name" placeholder="Nombre Completo *" class="input-field" 
                                    style="width:100%; box-sizing:border-box; padding:8px; border:1px solid #93c5fd; border-radius:4px; margin-bottom:8px;">
                                <input type="text" id="new-cust-phone" placeholder="Teléfono" class="input-field" 
                                    style="width:100%; box-sizing:border-box; padding:8px; border:1px solid #93c5fd; border-radius:4px; margin-bottom:8px;">
                                <input type="email" id="new-cust-email" placeholder="Email (Opcional)" class="input-field" 
                                    style="width:100%; box-sizing:border-box; padding:8px; border:1px solid #93c5fd; border-radius:4px; margin-bottom:8px;">
                                <div style="display:flex; gap:5px;">
                                    <button id="btn-save-customer" style="flex:1; background:#2563eb; color:white; border:none; padding:8px; border-radius:4px; cursor:pointer; font-weight:bold;">Guardar</button>
                                    <button id="btn-cancel-customer" style="width:30px; background:#ef4444; color:white; border:none; padding:8px; border-radius:4px; cursor:pointer;">✕</button>
                                </div>
                            </div>
                        </div>

                        <!-- TOTALES Y PAGOS -->
                        <div style="background:#f1f5f9; padding:15px; border-radius:10px; margin-top:15px;">
                             <label style="font-size:0.75rem; color:#64748b; font-weight:800; text-transform:uppercase; display:block; margin-bottom:12px;">💳 Métodos de Pago</label>
                             <div id="payment-container">
                                <div class="pay-row" style="display:grid; grid-template-columns: 1fr 1fr 0.2fr; gap:5px; margin-bottom:8px;">
                                    <input type="number" class="p-amt input-field" placeholder="Monto" disabled value="0">
                                    <select class="p-meth input-field" style="font-size: 0.8rem;">
                                        <option value="Efectivo $">💵 Efectivo $</option>
                                        <option value="Pago Móvil Bs">📲 Pago Móvil (Bs)</option>
                                        <option value="Zelle $">📱 Zelle $</option>
                                        <option value="Efectivo Bs">💸 Efectivo (Bs)</option>
                                        <option value="Transferencia EUR">🇪🇺 Transf. EUR</option>
                                    </select>
                                    <span class="p-currency-hint" style="font-size:0.7rem; display:flex; align-items:center;">$</span>
                                </div>
                             </div>
                             <button id="add-pay-row" style="font-size:0.8rem; color:#475569; background:none; border:none; cursor:pointer; text-decoration:underline;">+ Agregar otro método</button>

                             <div style="display:flex; justify-content:space-between; align-items:center; margin-top:15px; border-top:1px solid #cbd5e1; padding-top:10px;">
                                <span style="font-weight:bold; color:#334155;">TOTAL A PAGAR:</span>
                                <div style="text-align:right;">
                                    <b id="cart-total-usd" style="font-size:1.4rem; color:#16a34a; display:block;">$0.00</b>
                                    <span id="cart-total-ves" style="font-size:0.9rem; color:#64748b;">0.00 Bs</span>
                                </div>
                             </div>
                        </div>

                        <button id="btn-submit-sale" class="btn-primary" 
                            style="width:100%; padding:16px; margin-top:18px; background:#2563eb; color:white; border:none; border-radius:10px; cursor:pointer; font-weight:bold; font-size:1rem; transition:background 0.2s;">
                            ✅ Procesar Venta Completa
                        </button>
                    </div>
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
            
            #btn-submit-sale:disabled {
                background: #94a3b8 !important;
                cursor: not-allowed;
            }

            .cart-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: white;
                padding: 10px;
                border-radius: 6px;
                border: 1px solid #e2e8f0;
                margin-bottom: 5px;
            }
            
            .cart-remove-btn {
                background: #fee2e2;
                color: #ef4444;
                border: none;
                width: 24px;
                height: 24px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
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
        // Save current selection if any
        const currentVal = select.value;

        // Mantener "Cliente Genérico"
        select.innerHTML = '<option value="">Cliente Genérico</option>';
        customers.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.phone ? `${c.name} (${c.phone})` : c.name;
            select.appendChild(opt);
        });

        // Restore selection if still exists, otherwise default
        if (currentVal && Array.from(select.options).some(o => o.value === currentVal)) {
            select.value = currentVal;
        }
    },

    renderCart(cart, rates) {
        const listDiv = document.getElementById('cart-list');
        const badge = document.getElementById('cart-count-badge');

        // Update Badge
        if (cart.length > 0) {
            badge.style.display = 'inline-block';
            badge.textContent = cart.length;
        } else {
            badge.style.display = 'none';
        }

        // Render List
        if (cart.length === 0) {
            listDiv.innerHTML = '<p style="text-align:center; color:#94a3b8; font-size:0.8rem; margin:10px 0;">Carrito vacío</p>';
        } else {
            listDiv.innerHTML = cart.map((item, idx) => `
                <div class="cart-item">
                    <div style="flex:1;">
                        <div style="font-weight:bold; font-size:0.85rem; color:#334155;">${item.product_name}</div>
                        <div style="font-size:0.75rem; color:#64748b;">
                            ${item.quantity} x $${item.price.toFixed(2)} 
                            ${item.delivery_date ? `<span style="color:#d97706; background:#fef3c7; padding:1px 4px; border-radius:3px; margin-left:5px;">📅 ${item.delivery_date}</span>` : ''}
                        </div>
                    </div>
                    <div style="text-align:right; margin-right:10px;">
                        <div style="font-weight:bold; font-size:0.9rem; color:#0f172a;">$${item.total_amount.toFixed(2)}</div>
                    </div>
                    <button class="cart-remove-btn" data-index="${idx}" title="Eliminar">×</button>
                </div>
            `).join('');
        }

        // Calculate Totals
        const totalUSD = cart.reduce((acc, item) => acc + item.total_amount, 0);
        const totalVES = totalUSD * rates.tasa_usd_ves;

        document.getElementById('cart-total-usd').innerText = `$${totalUSD.toFixed(2)}`;
        document.getElementById('cart-total-ves').innerText = `${totalVES.toFixed(2)} Bs`;

        // Update Payment Input Default to Total if only 1 row
        const payRows = document.querySelectorAll('.pay-row');
        if (payRows.length === 1 && totalUSD > 0) {
            // First input defaults to total
            // We generally trigger this via controller to avoid overriding user input too aggressively
        }

        // Enable/Disable Submit
        const btnSubmit = document.getElementById('btn-submit-sale');
        if (cart.length === 0) {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = "🚫 Carrito Vacío";
        } else {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = "✅ Procesar Venta Completa";
        }
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
            div.innerHTML = '<p style="text-align:center; color:#94a3b8;">No hay ventas registradas.</p>';
            return;
        }

        const formatterVES = new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' });

        const html = sales.map(s => {
            const isWeb = s.product_name && s.product_name.startsWith('WEB:');
            const status = (s.payment_status || "").trim().toLowerCase();
            const isPending = (status !== 'pagado');

            // Lógica de Nombre
            let displayCustomer = s.customers?.name || s.payment_details?.customer_web || s.client_name || 'Cliente Genérico';
            if (isWeb) displayCustomer = `🌐 ${displayCustomer}`;

            const isDelivery = s.payment_details?.order_type === 'delivery';
            const orderTypeStr = isDelivery ? '🛵 DELIVERY' : '📍 PICKUP';
            const addressStr = s.payment_details?.delivery_address;

            // Delivery Date Badge
            let deliveryDateBadge = '';
            if (s.delivery_date) {
                const d = new Date(s.delivery_date);
                const userTimezoneOffset = d.getTimezoneOffset() * 60000;
                const adjustedDate = new Date(d.getTime() + userTimezoneOffset);
                const dateStr = adjustedDate.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', weekday: 'short' });
                deliveryDateBadge = `<span style="background:#fef08a; color:#854d0e; padding:4px 8px; border-radius:4px; font-weight:bold; font-size:0.7rem; border:1px solid #fde047; white-space:nowrap;">📅 ${dateStr.toUpperCase()}</span>`;
            }

            const productTitle = (isWeb && s.payment_details?.resumen)
                ? s.payment_details.resumen
                : s.product_name;

            return `
                <div style="background:white; border:1px solid #f1f5f9; padding:15px; border-radius:10px; margin-bottom:12px; border-left:5px solid ${isPending ? '#f87171' : '#10b981'}; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div style="flex:1;">
                            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                                ${deliveryDateBadge}
                                <span style="font-size:0.7rem; color:#64748b; font-weight:800; text-transform:uppercase;">${orderTypeStr}</span>
                            </div>
                            <b style="font-size:0.95rem; color:#1e293b; display:block;">${productTitle}</b>
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
        // Unused in new logic, managed by renderCart
    },

    toggleStockWarning(show) {
        document.getElementById('stock-warning').style.display = show ? 'block' : 'none';
        const btn = document.getElementById('btn-add-to-cart');
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
