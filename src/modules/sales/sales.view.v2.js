export const SalesView = {
    renderLayout(container, initialDate, rates) {
        container.innerHTML = `
        <div class="main-container">
            <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; flex-wrap:wrap; gap:15px;">
                <div>
                    <h1 id="sales-title" style="font-size: 1.8rem; margin:0 0 8px 0;">🛒 Punto de Venta</h1>
                    <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                        <input type="date" id="filter-date-start" value="${initialDate}" class="input-field" 
                            style="padding:8px 12px; font-size:0.85rem; border:2px solid #e2e8f0; border-radius:6px;">
                        <span style="font-weight:bold; color:#cbd5e1;">➔</span>
                        <input type="date" id="filter-date-end" value="${initialDate}" class="input-field" 
                            style="padding:8px 12px; font-size:0.85rem; border:2px solid #e2e8f0; border-radius:6px;">
                        
                        <div style="display:flex; align-items:center; gap:5px; background:white; padding:5px 10px; border-radius:6px; border:1px solid #e2e8f0;">
                            <input type="checkbox" id="chk-view-delivery" style="cursor:pointer;">
                            <label for="chk-view-delivery" style="font-size:0.8rem; cursor:pointer; user-select:none;">Ver Entregas/Reservas</label>
                        </div>

                        <div style="display:flex; gap:5px;">
                            <button id="btn-tab-sales" class="tab-btn active" style="background:#2563eb; color:white; border:none; padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:0.85rem;">📋 Ventas</button>
                            <button id="btn-tab-receivables" class="tab-btn" style="background:#f1f5f9; color:#64748b; border:none; padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:0.85rem;">💰 Cuentas por Cobrar</button>
                            <button id="btn-view-reservations" class="tab-btn" style="background:#f1f5f9; color:#0f766e; border:1px solid #ccfbf1; padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:0.85rem;">📅 Próximas Reservas</button>
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
                    
                    <!-- 1. FECHA Y TIPO DE ENTREGA -->
                    <div style="display:flex; gap:10px; align-items:flex-end; margin-bottom:15px;">
                        <div style="flex:1;">
                            <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">📅 FECHA REGISTRO</label>
                            <input type="date" id="v-sale-date" class="input-field" value="${initialDate}"
                                style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                        </div>
                        <div style="flex:1;">
                            <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">📅 ENTREGA (OPCIONAL)</label>
                            <input type="date" id="v-delivery-date" class="input-field" 
                                style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #bae6fd; border-radius:6px; background-color:#f0f9ff; color:#0369a1; font-weight:bold;">
                        </div>
                        <div style="flex:1;">
                            <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">🚚 TIPO DE ENTREGA</label>
                            <select id="v-order-type" class="input-field" 
                                onchange="document.getElementById('div-delivery-address').style.display = (this.value === 'delivery') ? 'block' : 'none'"
                                style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                                <option value="pickup">📍 Pickup (Retiro)</option>
                                <option value="delivery">🛵 Delivery</option>
                                <option value="dine_in">🍽️ En Local</option>
                            </select>
                        </div>
                    </div>

                    <!-- DIRECCION DE DELIVERY (CONDICIONAL) -->
                    <div id="div-delivery-address" style="display:none; margin-bottom:15px; background:#f0f9ff; padding:10px; border-radius:6px; border:1px solid #bae6fd;">
                        <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:5px; color:#0284c7;">📍 DIRECCIÓN DE ENTREGA</label>
                        <textarea id="v-delivery-address" class="input-field" placeholder="Dirección detallada..." rows="2" style="width:100%; box-sizing:border-box; padding:8px;"></textarea>
                    </div>

                    <!-- 2. CLIENTE -->
                     <div class="input-group" style="margin-bottom:15px; border-bottom:1px dashed #e2e8f0; padding-bottom:15px;">
                        <label style="display:flex; justify-content:space-between; align-items:center; font-weight:600; font-size:0.85rem; margin-bottom:8px;">
                            CLIENTE
                            <div style="display:flex; gap:5px;">
                                <button id="btn-edit-customer" title="Editar Cliente Seleccionado" style="background:#f1f5f9; border:none; color:#64748b; font-size:0.9rem; cursor:pointer; padding:4px 8px; border-radius:4px;">✏️</button>
                                <button id="btn-add-customer" style="background:none; border:none; color:#2563eb; font-size:0.75rem; font-weight:800; cursor:pointer; padding:4px 8px; border-radius:4px; transition:background 0.2s;">+ NUEVO</button>
                            </div>
                        </label>
                        <div style="display:flex; gap:5px;">
                            <select id="v-customer-id" class="input-field" 
                                style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                                <option value="">Cliente Genérico</option>
                            </select>
                             <button id="btn-del-customer" title="Borrar Cliente" style="background:#fee2e2; border:none; color:#ef4444; font-size:0.9rem; cursor:pointer; padding:0 12px; border-radius:6px;">🗑️</button>
                        </div>
                        
                        <div id="new-customer-form" style="display:none; background:#eff6ff; padding:12px; border-radius:8px; margin-top:8px; border:1px solid #bfdbfe;">
                            <label id="lbl-cust-form-title" style="font-size:0.75rem; color:#1e40af; font-weight:bold; display:block; margin-bottom:8px;">RATA NUEVO CLIENTE</label>
                            <input type="hidden" id="edit-cust-id">
                            <input type="text" id="new-cust-name" placeholder="Nombre Completo *" class="input-field" 
                                style="width:100%; box-sizing:border-box; padding:8px; border:1px solid #93c5fd; border-radius:4px; margin-bottom:8px;">
                            <input type="text" id="new-cust-phone" placeholder="Teléfono" class="input-field" 
                                style="width:100%; box-sizing:border-box; padding:8px; border:1px solid #93c5fd; border-radius:4px; margin-bottom:8px;">
                            <input type="email" id="new-cust-email" placeholder="Email (Opcional)" class="input-field" 
                                style="width:100%; box-sizing:border-box; padding:8px; border:1px solid #93c5fd; border-radius:4px; margin-bottom:8px;">
                            <textarea id="new-cust-address" placeholder="Dirección Preferida (Opcional)" class="input-field" rows="2"
                                style="width:100%; box-sizing:border-box; padding:8px; border:1px solid #93c5fd; border-radius:4px; margin-bottom:8px;"></textarea>
                            <div style="display:flex; gap:5px;">
                                <button id="btn-save-customer" style="flex:1; background:#2563eb; color:white; border:none; padding:8px; border-radius:4px; cursor:pointer; font-weight:bold;">Guardar</button>
                                <button id="btn-cancel-customer" style="width:30px; background:#ef4444; color:white; border:none; padding:8px; border-radius:4px; cursor:pointer;">✕</button>
                            </div>
                        </div>
                    </div>

                    <!-- 3. SELECCION DE PRODUCTO -->
                    <div style="background:#f8fafc; padding:15px; border-radius:8px; border:1px solid #e2e8f0;">
                         <h4 style="margin:0 0 10px 0; font-size:0.85rem; color:#64748b; text-transform:uppercase;">➕ Agregar Ítems</h4>
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

                        <button id="btn-add-to-cart" class="btn-secondary" 
                            style="width:100%; padding:12px; margin-top:10px; background:#fff; color:#334155; border:2px dashed #cbd5e1; border-radius:8px; cursor:pointer; font-weight:bold; font-size:0.9rem; transition:all 0.2s;">
                            🛒 Agregar al Carrito
                        </button>
                    </div>

                    <!-- 4. SECCIÓN CARRITO -->
                    <div id="cart-section" style="margin-top:25px; border-top:2px solid #e2e8f0; padding-top:15px;">
                        <h4 style="margin:0 0 10px 0; color:#475569;">🛍️ Carrito de Compra <span id="cart-count-badge" style="background:#ef4444; color:white; font-size:0.7rem; padding:2px 6px; border-radius:10px; display:none;">0</span></h4>
                        
                        <div id="cart-list" style="max-height: 200px; overflow-y: auto; margin-bottom:15px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px;">
                            <p style="text-align:center; color:#94a3b8; font-size:0.8rem; margin:10px 0;">Carrito vacío</p>
                        </div>
                        
                        <!-- TOTALES Y PAGOS -->
                        <div style="background:#f1f5f9; padding:15px; border-radius:10px; margin-top:15px;">
                             <label style="font-size:0.75rem; color:#64748b; font-weight:800; text-transform:uppercase; display:block; margin-bottom:12px;">💳 Métodos de Pago</label>
                             <div id="payment-container">
                                <!-- Dynamic rows invoked by controller -->
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

        <div id="reservations-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1000; justify-content:center; align-items:center;">
            <div style="background:white; width:90%; max-width:600px; max-height:80vh; border-radius:12px; padding:20px; display:flex; flex-direction:column; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #e2e8f0; padding-bottom:10px;">
                    <h2 style="margin:0; font-size:1.2rem;">📅 Próximas Reservas</h2>
                    <button id="btn-close-res-modal" style="background:none; border:none; font-size:1.5rem; cursor:pointer;">&times;</button>
                </div>
                <div id="reservations-content" style="flex:1; overflow-y:auto;">
                    <p style="text-align:center; color:#64748b;">Cargando...</p>
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
            opt.text = `${c.name} (${c.phone || 'Sin tlf'})`;
            opt.dataset.address = c.address || ""; // Store Address
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

        // Update Payment Input Default to Total if only 1 row and empty
        const payRows = document.querySelectorAll('.pay-row');
        if (payRows.length === 1 && totalUSD > 0) {
            const amtInput = payRows[0].querySelector('.p-amt');
            // Only auto-fill if empty or equal to previous total (simple heuristic)
            if (!amtInput.value || parseFloat(amtInput.value) === 0) {
                amtInput.value = totalUSD.toFixed(2);
                // Trigger input event manually if needed, but controller handles calculation on click/input
                // We will rely on user interaction or final validation, but let's try to trigger it:
                amtInput.dispatchEvent(new Event('input'));
            }
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

    applyVendorRestrictions() {
        // 1. Ocultar Pestaña de Cuentas por Cobrar
        const btnRec = document.getElementById('btn-tab-receivables');
        if (btnRec) btnRec.style.display = 'none';

        // 2. Ocultar Filtros de Fecha (Solo Hoy)
        const dateStart = document.getElementById('filter-date-start');
        const dateEnd = document.getElementById('filter-date-end');
        const dateArrow = document.querySelector('header span');

        if (dateStart) dateStart.parentElement.style.display = 'none'; // Ocultar todo el bloque de fechas

        // 3. Ocultar Checkbox de Ver Entregas (Si no es relevante)
        const chkDelivery = document.getElementById('chk-view-delivery');
        if (chkDelivery) chkDelivery.parentElement.style.display = 'none';

        // 4. Simplificar Header
        const headerTitle = document.getElementById('sales-title');
        if (headerTitle) headerTitle.innerText = '📱 Modo Vendedor';

        // 5. Ocultar Input de Fecha Retroactiva (Backdating)
        const saleDateInput = document.getElementById('v-sale-date');
        if (saleDateInput) {
            saleDateInput.parentElement.style.display = 'none';
        }

        // 6. Optimización Móvil (CSS inyectado)
        const style = document.createElement('style');
        style.innerHTML = `
            .nav-bar { display: none !important; } /* Ocultar menú principal para ganar espacio */
            body { padding-top: 10px !important; }
            .sales-grid { grid-template-columns: 1fr !important; gap: 10px !important; }
            .stat-card { padding: 15px !important; border-radius: 12px; }
            .btn-add-cart { padding: 15px !important; font-size: 1.1rem !important; }
            .catalog-item-btn { padding: 12px !important; }
            #payment-container { padding: 10px; background: #f8fafc; border-radius: 8px; }
            /* Ocultar botones peligrosos */
            .btn-delete-sale, .btn-confirm-pay { display: none !important; }
        `;
        document.head.appendChild(style);
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

    renderReceivables(sales, totalCount) {
        const div = document.getElementById('sales-history');
        const summaryDiv = document.getElementById('daily-summary');

        // Receivables Summary
        if (summaryDiv) {
            const totalDebt = sales.reduce((acc, s) => acc + (parseFloat(s.balance_due) || 0), 0);
            summaryDiv.innerHTML = `
                <div style="background:#fff1f2; padding:20px; border-radius:12px; border:2px solid #fecaca; text-align:center;">
                    <h4 style="margin:0 0 10px 0; color:#991b1b;">💰 Total por Cobrar (Mostrado)</h4>
                    <b style="font-size:2rem; color:#ef4444;">$${totalDebt.toFixed(2)}</b>
                    <p style="margin:5px 0 0 0; font-size:0.85rem; color:#7f1d1d;">Registros: ${sales.length} / ${totalCount}</p>
                </div>
            `;
        }

        if (sales.length === 0) {
            div.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:20px;">🎉 No hay cuentas por cobrar pendientes.</p>';
            return;
        }

        const html = sales.map(s => {
            const customerName = s.customers?.name || 'Cliente Desconocido';
            const phone = s.customers?.phone || 'Sin Tlf';
            const balance = parseFloat(s.balance_due).toFixed(2);
            const total = parseFloat(s.total_amount).toFixed(2);
            const paid = parseFloat(s.amount_paid).toFixed(2);
            const dateStr = s.sale_date.split('T')[0];

            return `
                <div style="background:white; border:1px solid #fecaca; padding:15px; border-radius:10px; margin-bottom:12px; border-left:5px solid #ef4444; box-shadow: 0 2px 4px rgba(239, 68, 68, 0.1); position:relative;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <div style="color:#64748b; font-size:0.75rem; margin-bottom:4px;">📅 ${dateStr} &bull; ID: ${s.id.slice(0, 8)}</div>
                            <b style="font-size:1.1rem; color:#1e293b; display:block;">${customerName}</b>
                            <span style="font-size:0.85rem; color:#64748b;">📞 ${phone}</span>
                            <div style="margin-top:5px; font-size:0.85rem; color:#334155;">
                                Producto: <b>${s.product_name}</b> <br>
                                Total Venta: $${total} <br>
                                Pagado: $${paid}
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <small style="display:block; color:#991b1b; font-weight:bold;">DEUDA</small>
                            <b style="font-size:1.4rem; color:#ef4444;">$${balance}</b>
                        </div>
                    </div>

                    <button class="btn-confirm-pay" data-id="${s.id}" data-amount="${balance}"
                        style="width:100%; margin-top:15px; background:#ef4444; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:0.9rem; transition: background 0.2s;">
                        💸 REGISTRAR PAGO TOTAL ($${balance})
                    </button>
                </div>
            `;
        }).join('');

        div.innerHTML = html;
    },

    addPaymentRow() {
        const container = document.getElementById('payment-container');
        const row = document.createElement('div');
        row.className = 'pay-row';
        row.style.cssText = 'display:grid; grid-template-columns: 1fr 1fr 1fr 0.2fr; gap:5px; margin-bottom:8px;';

        row.innerHTML = `
            <input type="number" class="p-amt input-field" placeholder="Monto" step="0.01">
            <select class="p-meth input-field" style="font-size: 0.8rem;">
                <option value="Efectivo $">💵 Efectivo $</option>
                <option value="Pago Móvil Bs">📲 Pago Móvil (Bs)</option>
                <option value="Zelle $">📱 Zelle $</option>
                <option value="Efectivo Bs">💸 Efectivo (Bs)</option>
                <option value="Transferencia EUR">🇪🇺 Transf. EUR</option>
                <option value="Punto de Venta">💳 Punto de Venta</option>
            </select>
            <input type="text" class="p-ref input-field" placeholder="Ref / Operación" style="font-size: 0.8rem;">
            <button class="btn-rm-pay-row" style="background:#fee2e2; color:#ef4444; border:none; border-radius:4px; cursor:pointer;">×</button>
        `;

        container.appendChild(row);
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

    },

    renderReservationsModal(data) {
        const modal = document.getElementById('reservations-modal');
        const content = document.getElementById('reservations-content');
        modal.style.display = 'flex'; // Show modal

        const dates = Object.keys(data).sort(); // Ensure sorted date string YYYY-MM-DD

        if (dates.length === 0) {
            content.innerHTML = '<p style="text-align:center; color:#64748b; padding:20px;">No hay reservas futuras registradas.</p>';
            return;
        }

        content.innerHTML = dates.map(date => {
            const dayData = data[date];
            // Format Date nicely
            const dateObj = new Date(date);
            const userTimezoneOffset = dateObj.getTimezoneOffset() * 60000;
            const adjustedDate = new Date(dateObj.getTime() + userTimezoneOffset);
            const dateStr = adjustedDate.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' });

            const itemsHtml = Object.entries(dayData.items).map(([prod, qty]) => `
                    <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px dashed #e2e8f0;">
                        <span style="color:#334155;">${prod}</span>
                        <b style="color:#0f172a;">x${qty}</b>
                    </div>
                    `).join('');

            return `
                    <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:15px; margin-bottom:15px;">
                        <h3 style="margin:0 0 10px 0; color:#166534; font-size:1rem; text-transform:capitalize;">${dateStr}</h3>
                        <div style="background:white; padding:10px; border-radius:8px;">
                            ${itemsHtml}
                        </div>
                    </div>
                    `;
        }).join('');
    }
}
