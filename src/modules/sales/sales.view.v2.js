export const SalesView = {
    renderLayout(container, initialDate, initialEndDate, rates) {
        container.innerHTML = `
        <div class="layout">
            <!-- LEFT: PRODUCT CATALOG -->
            <div class="glass-panel catalog-panel">
                <div class="catalog-header">
                    <div>
                         <h1 class="gradient-text">🛒 Punto de Venta</h1>
                         <div style="display:flex; gap:10px; align-items:center;">
                            <small style="color:#64748b; font-weight:600;">1$ = ${rates.tasa_usd_ves.toFixed(2)} Bs</small>
                            <button id="btn-toggle-filters" style="background:none; border:none; cursor:pointer; font-size:1rem;">⚙️</button>
                         </div>
                    </div>
                    <div style="position:relative;">
                        <input type="text" id="catalog-search" class="search-bar" placeholder="🔍 Buscar producto...">
                        <button id="btn-clear-search" style="position:absolute; right:10px; top:10px; background:none; border:none; cursor:pointer; display:none;">✕</button>
                    </div>
                </div>

                <!-- FILTERS DRAWER (Hidden by default) -->
                <div id="filters-drawer" style="display:none; padding-bottom:15px; margin-bottom:15px; border-bottom:1px solid #e2e8f0;">
                     <div style="display:flex; gap:10px; align-items:center;">
                        <input type="date" id="filter-date-start" value="${initialDate}" class="input-field-sm">
                        <span style="color:#cbd5e1;">➔</span>
                        <input type="date" id="filter-date-end" value="${initialEndDate || initialDate}" class="input-field-sm">
                        <button id="btn-refresh-sales" class="btn-icon-sm" title="Actualizar">🔄</button>
                     </div>
                     <div style="margin-top:10px; display:flex; gap:10px;">
                        <button id="btn-view-catalog" class="tab-btn active" style="background:#2563eb; color:white;">🛍️ Catálogo</button>
                        <button id="btn-view-sales" class="tab-btn">📜 Historial</button>
                        <button id="btn-view-receivables" class="tab-btn">Cuentas x Cobrar</button>
                        <button id="btn-view-reservations" class="tab-btn">Reservas</button>
                     </div>
                </div>

                <div class="categories" id="category-pills">
                    <div class="cat-pill active" data-cat="all">Todos</div>
                    <!-- Dynamic categories -->
                </div>

                <div class="products-grid" id="products-grid">
                    <!-- Products injected here -->
                </div>
                
                <!-- SALES HISTORY / RECEIVABLES LIST (Hidden by default, toggled via tabs) -->
                <div id="sales-history-container" style="display:none; flex:1; overflow-y:auto;">
                    <br>
                    <div id="sales-summary-bar" style="display:flex; justify-content:space-between; background:#f1f5f9; padding:10px; border-radius:8px; margin-bottom:10px; font-size:0.9rem;">
                        <span>Total: <b id="sum-total">$0.00</b></span>
                        <span>Crédito: <b id="sum-credit" style="color:#ef4444;">$0.00</b></span>
                    </div>
                    <div id="sales-list" style="display:flex; flex-direction:column; gap:8px;"></div>
                    <button id="btn-load-more" style="width:100%; margin-top:10px; padding:10px; background:#e2e8f0; border:none; border-radius:8px; cursor:pointer; display:none;">Cargar Más</button>
                    <br><br>
                </div>
            </div>

            <!-- RIGHT: CART -->
            <div class="glass-panel cart-panel">
                <h2 style="margin:0 0 10px 0; font-size:1.2rem; color:#1e293b;">🛍️ Orden Actual</h2>
                
                <div class="customer-select-area">
                    <select id="v-customer-id" style="flex:1; padding:10px; border-radius:8px; border:1px solid #cbd5e1; outline:none; background:#f8fafc;">
                        <option value="">Cliente Genérico</option>
                    </select>
                    <button id="btn-add-customer" style="background:#eff6ff; border:1px solid #bfdbfe; color:#2563eb; border-radius:8px; width:40px; cursor:pointer; font-weight:bold; font-size:1.2rem;">+</button>
                    <button id="btn-edit-customer" style="background:#f1f5f9; border:1px solid #e2e8f0; color:#64748b; border-radius:8px; width:40px; cursor:pointer;">✏️</button>
                </div>
                
                <!-- NEW: Order Type Selector (Compact) -->
                 <div style="display:flex; gap:5px; margin-bottom:10px;">
                    <select id="v-order-type" style="flex:1; padding:8px; border-radius:6px; border:1px solid #e2e8f0; font-size:0.85rem;">
                        <option value="pickup">📍 Pickup</option>
                        <option value="delivery">🛵 Delivery</option>
                        <option value="dine_in">🍽️ En Mesa</option>
                    </select>
                    <input type="date" id="v-delivery-date" style="flex:1; padding:8px; border-radius:6px; border:1px solid #e2e8f0; font-size:0.85rem; display:none;" title="Fecha Entrega Futura">
                 </div>
                 
                 <textarea id="v-delivery-address" placeholder="Dirección de entrega..." rows="2" style="width:100%; box-sizing:border-box; padding:8px; margin-bottom:10px; border:1px solid #bae6fd; border-radius:6px; background:#f0f9ff; display:none; resize:none; font-size:0.85rem;"></textarea>

                <div class="cart-items" id="cart-list">
                    <p style="text-align:center; color:#94a3b8; margin-top:20px;">Carrito vacío</p>
                </div>
                
                <!-- Manual Entry Toggle -->
                 <div style="margin-top:10px; text-align:center;">
                    <button id="btn-toggle-manual" style="background:none; border:none; color:#64748b; text-decoration:underline; cursor:pointer; font-size:0.8rem;">+ Item Manual</button>
                    <div id="manual-entry-box" style="display:none; background:#f8fafc; padding:10px; border-radius:8px; margin-top:5px; text-align:left; border:1px solid #e2e8f0;">
                        <input type="text" id="manual-desc" placeholder="Descripción" class="input-field-sm" style="width:100%; margin-bottom:5px;">
                        <div style="display:flex; gap:5px;">
                            <input type="number" id="manual-price" placeholder="$ Precio" class="input-field-sm" style="width:80px;">
                            <button id="btn-add-manual" style="flex:1; background:#2563eb; color:white; border:none; border-radius:4px; cursor:pointer;">Agregar</button>
                        </div>
                    </div>
                 </div>

                <div style="flex:1;"></div>

                <!-- Payment Methods Section (Compact) -->
                <div id="payment-methods-container" style="max-height:100px; overflow-y:auto; margin-bottom:10px; font-size:0.85rem;">
                    <!-- Rows added dynamically -->
                </div>
                <button id="btn-add-pay-method" style="width:100%; margin-bottom:10px; background:#f1f5f9; border:1px dashed #cbd5e1; padding:5px; border-radius:6px; cursor:pointer; font-size:0.8rem; color:#475569;">+ Método de Pago</button>

                <div class="total-section">
                    <div style="font-size:0.9rem; opacity:0.8; margin-bottom:5px;">TOTAL A PAGAR</div>
                    <div style="font-size:2.5rem; font-weight:900;" id="cart-total-usd">$0.00</div>
                    <div style="font-size:1.1rem; color:#86efac; margin-bottom:10px;" id="cart-total-ves">0.00 Bs</div>
                    <button id="btn-submit-sale" class="pay-btn" disabled>🚫 CARRITO VACÍO</button>
                </div>
            </div>
            
            <!-- HIDDEN INPUTS FOR CONTROLLER LOGIC COMPATIBILITY -->
            <input type="hidden" id="v-qty" value="1">
            <input type="hidden" id="v-final-price">
            <input type="hidden" id="v-sale-date" value="${initialDate}">
        </div>

        <!-- MODALS -->
        <div id="reservations-modal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>📅 Próximas Reservas</h2>
                    <button id="btn-close-res-modal" class="close-btn">&times;</button>
                </div>
                <div id="reservations-content" style="max-height:60vh; overflow-y:auto;"></div>
            </div>
        </div>

        <div id="new-customer-modal" class="modal-overlay">
             <div class="modal-content" style="max-width:400px;">
                <div class="modal-header">
                    <h3 id="lbl-cust-form-title">Nuevo Cliente</h3>
                    <button id="btn-cancel-customer" class="close-btn">&times;</button>
                </div>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    <input type="hidden" id="edit-cust-id">
                    <input type="text" id="new-cust-name" placeholder="Nombre Completo *" class="input-field">
                    <input type="text" id="new-cust-phone" placeholder="Teléfono" class="input-field">
                    <input type="email" id="new-cust-email" placeholder="Email" class="input-field">
                    <textarea id="new-cust-address" placeholder="Dirección" class="input-field" rows="2"></textarea>
                    
                    <div style="display:flex; gap:10px; margin-top:10px;">
                        <button id="btn-save-customer" class="btn-primary" style="flex:1;">Guardar</button>
                        <button id="btn-del-customer" style="background:#fee2e2; color:#ef4444; border:none; padding:10px; border-radius:8px; cursor:pointer;" title="Eliminar Cliente">🗑️</button>
                    </div>
                </div>
             </div>
        </div>

        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');

            :root {
                --primary: #2563eb;
                --primary-dark: #1e40af;
                --glass-bg: rgba(255, 255, 255, 0.85);
                --glass-border: rgba(255, 255, 255, 0.6);
                --shadow-lg: 0 10px 30px -5px rgba(0, 0, 0, 0.05);
            }

            /* OVERRIDES */
            #app-content { padding: 0 !important; max-width: 100% !important; margin: 0 !important; }

            .layout {
                display: grid;
                grid-template-columns: 1fr 350px;
                gap: 20px;
                height: calc(100vh - 70px); /* Adjust for navbar */
                padding: 10px 20px;
                box-sizing: border-box;
                font-family: 'Inter', sans-serif;
            }

            @media (max-width: 900px) {
                .layout { grid-template-columns: 1fr; height: auto; overflow-y:auto; }
                .cart-panel { position: relative; height: auto; border-left:none; order: -1; } /* Cart on top on mobile? Or bottom? */
                /* Actually cart usually better at bottom or separate tab on mobile. For now, let's stack */
            }

            .glass-panel {
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                box-shadow: var(--shadow-lg);
                padding: 20px;
                display: flex;
                flex-direction: column;
                height: 100%;
                box-sizing: border-box;
                transition: all 0.3s;
            }

            .search-bar {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                padding: 10px 15px;
                border-radius: 10px;
                width: 250px;
                transition: all 0.2s;
            }
            .search-bar:focus { outline:none; border-color:var(--primary); background:white; width:300px; }

            /* GRID & CARDS */
            .products-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                gap: 12px;
                overflow-y: auto;
                padding: 5px;
                flex:1;
            }

            .product-card {
                 background: white;
                 border: 1px solid #f1f5f9;
                 border-radius: 12px;
                 padding: 15px;
                 text-align: center;
                 cursor: pointer;
                 transition: all 0.2s;
                 position: relative;
                 display: flex;
                 flex-direction: column;
                 justify-content: space-between;
                 min-height: 120px;
                 box-shadow: 0 2px 4px rgba(0,0,0,0.02);
            }

            .product-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 12px -3px rgba(0,0,0,0.08);
                border-color: #bfdbfe;
            }
            
            .product-card:active { transform: scale(0.96); }

            .p-icon { font-size: 2rem; margin-bottom: 8px; display:block; }
            .p-name { font-weight: 600; font-size: 0.9rem; margin-bottom: 5px; color:#334155; line-height:1.2; }
            .p-price { font-weight: 800; color: var(--primary); font-size: 1rem; }
            .p-stock-warn { font-size:0.65rem; color:#ef4444; background:#fee2e2; padding:2px 4px; border-radius:4px; position:absolute; top:5px; right:5px; font-weight:bold; }

            /* CART STYLE */
            .cart-items { flex:1; overflow-y: auto; padding-right:5px; max-height: 40vh; }
            .cart-item {
                display: flex; justify-content: space-between; align-items: center;
                padding: 10px; background: white; border-radius: 10px;
                margin-bottom: 8px; border: 1px solid #f1f5f9;
                animation: slideIn 0.3s ease-out;
            }
            .cart-item:hover { border-color: #cbd5e1; }
            
            .cart-actions { display:flex; gap:5px; align-items:center; }
            .btn-qty { width:24px; height:24px; border-radius:4px; border:1px solid #cbd5e1; background:white; cursor:pointer; display:flex; align-items:center; justify-content:center; font-weight:bold; color:#64748b; }
            .btn-qty:hover { background:#f1f5f9; color:#0f172a; }

            .total-section {
                background: #0f172a; 
                color: white; 
                padding: 20px; 
                border-radius: 16px; 
                text-align: center; 
                margin-top: auto;
                box-shadow: 0 10px 20px -5px rgba(0,0,0,0.3);
            }

            .pay-btn {
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                color: white; border: none; width: 100%; padding: 12px;
                border-radius: 10px; font-size: 1.1rem; font-weight: 800;
                margin-top: 10px; cursor: pointer; transition: transform 0.1s;
                box-shadow: 0 4px 6px rgba(22, 163, 74, 0.2);
            }
            .pay-btn:disabled { background: #475569; cursor: not-allowed; opacity:0.7; box-shadow:none; }
            .pay-btn:active { transform: scale(0.98); }

            /* PILLS */
            .categories { display: flex; gap: 8px; margin-bottom: 15px; overflow-x: auto; padding-bottom: 5px; scrollbar-width:none; }
            .cat-pill {
                background: #f1f5f9; padding: 6px 14px; border-radius: 20px;
                font-size: 0.85rem; font-weight: 600; color: #64748b;
                cursor: pointer; white-space: nowrap; transition: all 0.2s;
            }
            .cat-pill.active { background: var(--primary); color: white; box-shadow: 0 4px 10px rgba(37,99,235,0.3); }

            /* UTILS */
            .gradient-text {
                background: linear-gradient(45deg, #2563eb, #3b82f6);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin:0; font-size:1.5rem;
            }
            .modal-overlay {
                display:none; position:fixed; top:0; left:0; width:100%; height:100%;
                background:rgba(0,0,0,0.6); backdrop-filter:blur(3px); z-index:9999;
                justify-content:center; align-items:center;
            }
            .modal-content {
                background:white; padding:25px; border-radius:16px; width:90%; max-width:500px;
                box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
            }
            .modal-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; }
            .close-btn { background:none; border:none; font-size:1.5rem; cursor:pointer; color:#64748b; }
            
            .customer-select-area { display: flex; gap:10px; margin-bottom:10px; }
            
            @keyframes slideIn {
                from { opacity:0; transform:translateX(10px); }
                to { opacity:1; transform:translateX(0); }
            }
        </style>
        `;
    },

    populateCustomers(customers) {
        const select = document.getElementById('v-customer-id');
        const currentVal = select.value;
        select.innerHTML = '<option value="">Cliente Genérico</option>';
        customers.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.text = c.name;
            opt.dataset.address = c.address || "";
            opt.dataset.phone = c.phone || "";
            select.appendChild(opt);
        });
        if (currentVal && Array.from(select.options).some(o => o.value === currentVal)) {
            select.value = currentVal;
        }
    },

    populateCatalog(catalog) {
        // Render Grid
        const grid = document.getElementById('products-grid');
        const searchInput = document.getElementById('catalog-search');
        const clearBtn = document.getElementById('btn-clear-search');

        // Store catalog globally for simple filtering
        this.fullCatalog = catalog;

        this._renderGridItems(catalog);

        // Bind Search
        if (searchInput) {
            searchInput.oninput = (e) => {
                const term = e.target.value.toLowerCase();
                clearBtn.style.display = term ? 'block' : 'none';
                const filtered = this.fullCatalog.filter(p => p.product_name.toLowerCase().includes(term));
                this._renderGridItems(filtered);
            };
        }
        if (clearBtn) {
            clearBtn.onclick = () => {
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input'));
            };
        }
    },

    _renderGridItems(items) {
        const grid = document.getElementById('products-grid');
        grid.innerHTML = '';

        if (items.length === 0) {
            grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#94a3b8; margin-top:20px;">No se encontraron productos</p>';
            return;
        }

        items.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.dataset.id = p.id;

            // Simple Icon based on name (very basic heuristic)
            let icon = '📦';
            const name = p.product_name.toLowerCase();
            if (name.includes('focaccia')) icon = '🍕';
            else if (name.includes('cafe') || name.includes('café')) icon = '☕';
            else if (name.includes('coca') || name.includes('bebida') || name.includes('agua')) icon = '🥤';
            else if (name.includes('tiramisu') || name.includes('postre')) icon = '🍰';

            const stock = p.stock_disponible || 0;
            const stockWarn = (stock < 5) ? `<span class="p-stock-warn">${stock} disp</span>` : '';

            card.innerHTML = `
                ${stockWarn}
                <span class="p-icon">${icon}</span>
                <span class="p-name">${p.product_name}</span>
                <span class="p-price">$${p.precio_venta_final.toFixed(2)}</span>
            `;

            // Interaction: Click to Add
            card.onclick = () => {
                // Trigger Add Event logic (we'll bind this in controller or expose a method)
                // For now, let's dispatch a custom event or call a global handler if we want
                // Better: The controller binds to '.product-card' click? 
                // Or better yet, we pass the logic into render. 
                // Let's use a CustomEvent that controller listens to? 
                // Or just a global window function? 
                // Let's use a standard DOM event dispatch to the container
                const event = new CustomEvent('add-product', { detail: p });
                document.getElementById('app-content').dispatchEvent(event);
            };

            grid.appendChild(card);
        });
    },

    renderCart(cart, rates) {
        const listDiv = document.getElementById('cart-list');
        const totalUSDLabel = document.getElementById('cart-total-usd');
        const totalVESLabel = document.getElementById('cart-total-ves');
        const submitBtn = document.getElementById('btn-submit-sale');

        listDiv.innerHTML = '';

        if (cart.length === 0) {
            listDiv.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:20px;">Carrito vacío</p>';
            submitBtn.disabled = true;
            submitBtn.innerHTML = '🚫 CARRITO VACÍO';
            submitBtn.style.background = '#475569';
            if (totalUSDLabel) totalUSDLabel.innerText = "$0.00";
            if (totalVESLabel) totalVESLabel.innerText = "0.00 Bs";
            return;
        }

        cart.forEach((item, index) => {
            const el = document.createElement('div');
            el.className = 'cart-item';
            el.innerHTML = `
                <div style="flex:1;">
                    <b style="font-size:0.9rem; color:#334155; display:block;">${item.product_name}</b>
                    <small style="color:#64748b;">$${item.price.toFixed(2)} c/u</small>
                </div>
                <div class="cart-actions">
                    <button class="btn-qty btn-minus" data-idx="${index}">−</button>
                    <span style="font-weight:bold; font-size:0.9rem; width:20px; text-align:center;">${item.quantity}</span>
                    <button class="btn-qty btn-plus" data-idx="${index}">+</button>
                </div>
                <div style="font-weight:bold; color:#0f172a; min-width:60px; text-align:right;">
                    $${item.total_amount.toFixed(2)}
                </div>
                <button class="cart-remove-btn" data-index="${index}" style="margin-left:10px; background:none; border:none; color:#ef4444; font-weight:bold; cursor:pointer;">×</button>
            `;
            listDiv.appendChild(el);
        });

        const totalUSD = cart.reduce((acc, i) => acc + i.total_amount, 0);
        const totalVES = totalUSD * rates.tasa_usd_ves;

        if (totalUSDLabel) totalUSDLabel.innerText = `$${totalUSD.toFixed(2)}`;
        if (totalVESLabel) totalVESLabel.innerText = `~ ${totalVES.toLocaleString('es-VE')} Bs`;

        submitBtn.disabled = false;
        submitBtn.innerHTML = '✅ COBRAR';
        submitBtn.style.background = ''; // Reset to gradient
    },

    addPaymentRow() {
        const container = document.getElementById('payment-methods-container');
        const row = document.createElement('div');
        row.className = 'pay-row';
        row.style.cssText = 'display:grid; grid-template-columns: 1fr 1fr 1fr 20px; gap:5px; margin-bottom:5px; align-items:center;';
        row.innerHTML = `
            <input type="number" class="p-amt input-field-sm" placeholder="Monto" step="0.01" style="padding:6px; border:1px solid #e2e8f0; border-radius:4px;">
            <select class="p-meth input-field-sm" style="padding:6px; border:1px solid #e2e8f0; border-radius:4px;">
                <option value="Efectivo $">💵 Efec $</option>
                <option value="Pago Móvil Bs">📲 P.Móvil</option>
                <option value="Zelle $">📱 Zelle</option>
                <option value="Efectivo Bs">💸 Efec Bs</option>
                <option value="Punto de Venta">💳 Punto</option>
            </select>
            <input type="text" class="p-ref input-field-sm" placeholder="Ref" style="padding:6px; border:1px solid #e2e8f0; border-radius:4px;">
            <button class="btn-rm-pay-row" style="background:none; border:none; color:#ef4444; cursor:pointer;">×</button>
        `;
        container.appendChild(row);
        return row;
    },

    applyVendorRestrictions() {
        // ... (Optional: Hide settings button or filters)
        document.getElementById('btn-toggle-filters').style.display = 'none';
        document.getElementById('v-sale-date').parentElement.style.display = 'none'; // Only if we had a container
    },

    // ... (Helpers for Reservations/Recievables can stay similar or be adapted) ...
    renderReservationsModal(data) {
        // Reuse logic but target new modal ID structure if changed
        const content = document.getElementById('reservations-content');
        if (!content) return;

        const dates = Object.keys(data).sort();
        if (dates.length === 0) {
            content.innerHTML = '<p style="text-align:center; padding:20px;">No hay reservas.</p>';
            return;
        }

        content.innerHTML = dates.map(date => {
            const dayData = data[date];
            const itemsHtml = Object.entries(dayData.items).map(([prod, qty]) => `
                    <div style="display:flex; justify-content:space-between; padding:4px 0; font-size:0.9rem;">
                        <span>${prod}</span><b>x${qty}</b>
                    </div>`).join('');
            return `<div style="background:#f0fdf4; margin-bottom:10px; padding:10px; border-radius:8px;">
                        <h4 style="margin:0 0 5px 0;">${date}</h4>
                        ${itemsHtml}
                    </div>`;
        }).join('');
    },

    // Stub for compatibility if controller calls it
    toggleStockWarning(show) { /* Managed visually in cards now */ },
    toggleManualMode(active, price) { /* Managed by manual toggle button */ },

    // --- MISSING METHODS RE-IMPLEMENTED ---
    renderSummary(resumen) {
        const sumTotal = document.getElementById('sum-total');
        const sumCredit = document.getElementById('sum-credit');
        const summaryBar = document.getElementById('sales-summary-bar');

        if (sumTotal) sumTotal.innerText = `$${(resumen.total || 0).toFixed(2)}`;
        if (sumCredit) sumCredit.innerText = `$${(resumen.credito || 0).toFixed(2)}`;

        // Render Methods Breakdown
        // Remove old breakdown if exists
        const oldBreakdown = document.getElementById('methods-breakdown');
        if (oldBreakdown) oldBreakdown.remove();

        if (resumen.metodos && Object.keys(resumen.metodos).length > 0) {
            const breakdownDiv = document.createElement('div');
            breakdownDiv.id = 'methods-breakdown';
            breakdownDiv.style.cssText = "display:flex; gap:10px; flex-wrap:wrap; margin-top:5px; padding-top:5px; border-top:1px dashed #cbd5e1; font-size:0.8rem; color:#475569;";

            Object.entries(resumen.metodos).forEach(([method, amount]) => {
                const tag = document.createElement('span');
                tag.style.cssText = "background:white; padding:2px 6px; border-radius:4px; border:1px solid #e2e8f0; display:flex; align-items:center; gap:4px;";

                // Icons for methods
                let icon = '💵';
                if (method.toLowerCase().includes('zelle')) icon = '📱';
                if (method.toLowerCase().includes('pago movil') || method.toLowerCase().includes('móvil')) icon = '📲';
                if (method.toLowerCase().includes('punto')) icon = '💳';

                tag.innerHTML = `${icon} <b>${method}:</b> $${amount.toFixed(2)}`;
                breakdownDiv.appendChild(tag);
            });

            if (summaryBar) {
                summaryBar.style.flexDirection = 'column';
                summaryBar.appendChild(breakdownDiv);
            }
        }
    },

    renderHistory(sales, append = false) {
        const listContainer = document.getElementById('sales-list');
        const historyContainer = document.getElementById('sales-history-container');
        const grid = document.getElementById('products-grid');
        const categoryPills = document.getElementById('category-pills');

        // Toggle Views based on context
        // If we are rendering history and not appending, we might want to show the list container
        // However, the controller calls this on load. 
        // Logic: If 'append' is false, it means a fresh load. 
        // We need a way to know if we are in "Sales Mode" (Catalog) or "History Mode".
        // The Controller manages logic, View manages UI. 
        // Let's rely on the TABS to toggle visibility, but here we just render the content.

        if (!append) {
            listContainer.innerHTML = '';
        }

        sales.forEach(s => {
            const card = document.createElement('div');
            card.style.cssText = "background:white; border:1px solid #e2e8f0; border-radius:10px; padding:12px; display:flex; justify-content:space-between; align-items:center;";

            const status = (s.payment_status || "").toLowerCase();
            const isPaid = status === 'pagado' || (Number(s.balance_due) <= 0.01);
            const statusColor = isPaid ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
            const statusText = isPaid ? 'PAGADO' : 'PENDIENTE';

            card.innerHTML = `
                <div>
                    <div style="font-weight:bold; color:#1e293b; display:flex; align-items:center; gap:5px;">
                        ${s.customers ? s.customers.name : 'Cliente Genérico'}
                        ${isPaid ? '<span title="Solvente / Verificado" style="color:#22c55e; font-size:1rem;">☑️</span>' : ''}
                    </div>
                    <div style="font-size:0.8rem; color:#64748b;">
                        ${new Date(s.created_at).toLocaleString()} • #${s.id.slice(0, 6)}
                    </div>
                    ${isPaid && s.payment_date ? `<div style="font-size:0.75rem; color:#059669;">Pagado el: ${new Date(s.payment_date).toLocaleDateString()}</div>` : ''}
                    ${!isPaid ? `<div style="font-size:0.75rem; color:#dc2626; font-weight:bold;">Deuda: $${s.balance_due}</div>` : ''}
                </div>
                <div style="text-align:right;">
                    <div style="font-weight:900; font-size:1.1rem;">$${s.total_amount}</div>
                    <button class="btn-delete-sale" data-id="${s.id}" style="font-size:0.8rem; color:#ef4444; background:none; border:none; cursor:pointer; text-decoration:underline;">Eliminar</button>
                    ${!isPaid ? `<button class="btn-confirm-pay" data-id="${s.id}" data-amount="${s.balance_due}" style="margin-left:5px; background:#dcfce7; color:#166534; border:none; padding:4px 8px; border-radius:4px; font-weight:bold; cursor:pointer;">Cobrar</button>` : ''}
                </div>
            `;
            listContainer.appendChild(card);
        });

        // Auto-switch to history tab if we are NOT in initial load? 
        // No, let's keep tabs manual. 
        // But we need to handle the tabs click logic to hide grid/show list.
        this._bindTabLogic();
    },

    renderReceivables(sales, totalCount, rates) {
        // Similar to history but forced view
        this.renderHistory(sales, false);

        // Force switch to list view
        document.getElementById('products-grid').style.display = 'none';
        document.getElementById('category-pills').style.display = 'none';
        document.getElementById('sales-history-container').style.display = 'block';

        // Inject partial payment logic into cards if needed (handled by controller bindings usually)
        // But we need to render the inputs for partial payments here if we want them.
        // Let's enhance the card render for receivables in the future or now?
        // For now, reuse renderHistory logic is fine, maybe add extra buttons?
        // The renderHistory above has "Cobrar" button which is full payment.
        // If we want partial, we need to add the input.

        const cards = document.getElementById('sales-list').children;
        // Logic to add partial inputs to existing cards? 
        // Or better: update renderHistory to accept a 'mode' or check balance

        // Let's iterate and add the partial payment UI to unpaid items if needed.
        Array.from(cards).forEach((card, idx) => {
            const s = sales[idx];
            if (s && s.balance_due > 0) {
                const div = document.createElement('div');
                div.style.marginTop = '10px';
                div.style.paddingTop = '10px';
                div.style.borderTop = '1px dashed #e2e8f0';
                div.style.display = 'flex';
                div.style.gap = '5px';

                div.innerHTML = `
                  <input type="number" class="input-partial-pay input-field-sm" data-id="${s.id}" data-rate="${rates.tasa_usd_ves}" placeholder="Abono $" style="width:80px;">
                  <span id="calc-${s.id}" style="font-size:0.8rem; color:#64748b; align-self:center;">0.00 Bs</span>
                  <button class="btn-register-partial" data-id="${s.id}" style="margin-left:auto; background:#eff6ff; color:#2563eb; border:1px solid #bfdbfe; border-radius:4px; padding:4px 8px; cursor:pointer;">Abonar</button>
               `;
                card.querySelector('div > div:last-child').appendChild(div); // Append to right side or main?
                // Actually existing layout is flex row. Let's make it flex col to hold this?
                card.style.flexDirection = 'column';
                card.style.alignItems = 'stretch';
                card.children[0].style.marginBottom = '5px';
                card.appendChild(div);
            }
        });
    },

    toggleLoadMore(show) {
        const btn = document.getElementById('btn-load-more');
        if (btn) btn.style.display = show ? 'block' : 'none';
    },

    _bindTabLogic() {
        const btnSales = document.getElementById('btn-view-sales');
        //const btnRec = document.getElementById('btn-view-receivables');

        // We need to ensure these buttons toggle the visibility of GRID vs LIST
        // The controller handles data loading, but UI toggling should be immediate?
        // Actually, controller calls loadSales which calls renderHistory. 
        // If we serve "Ventas" tab, we want GRID + List? Or just List?
        // Usually "Ventas" in this context creates a New Sale (Grid). History is secondary.
        // Let's make "Ventas" = Grid (Default).

        // Wait, where is the History button? 
        // Using "Ventas" tab to show HISTORY might be confusing if it also shows Grid.
        // Let's assume the user uses the Filters Drawer "Ventas" button to see HISTORY.
        // And there should be a "Nuevo Pedido" or "Catálogo" button?
        // Currently 'btn-view-sales' is active by default.

        // Let's just expose a helper to toggle
    }
};
