/**
 * Vista de Ventas y Punto de Venta (UI Layer V2)
 */
import { Formatter } from '../../core/formatter.js';

export const SalesView = {
    render(container) {
        container.innerHTML = `
            <div class="pos-container animate-fade-in">
                <!-- TABS DE NAVEGACIÓN INTERNA -->
                <div class="pos-tabs mb-20">
                    <button class="pos-tab active" data-tab="pos-direct">✨ Venta Directa (Mostrador)</button>
                    <button class="pos-tab" data-tab="pos-history">💰 Reconstrucción Histórica</button>
                </div>

                <!-- 1. VENTA DIRECTA (POS) -->
                <div id="tab-pos-direct" class="tab-content active">
                    <div class="pos-layout">
                        <!-- PANEL IZQUIERDO: PRODUCTOS -->
                        <div class="pos-products-panel">
                            <div class="search-bar mb-15">
                                <input type="text" id="pos-search" placeholder="🔍 Buscar producto por nombre..." class="form-control">
                            </div>
                            <div id="pos-grid" class="pos-grid">
                                <!-- Cards dinámicas -->
                            </div>
                        </div>

                        <!-- PANEL DERECHO: CARRITO -->
                            <div class="pos-cart-panel glass">
                                <div class="cart-header">
                                    <h3>🛒 Carrito Actual</h3>
                                    <button id="btn-clear-cart" class="btn-text">Vaciar</button>
                                </div>

                                <div class="customer-selection p-15 border-bottom mb-10">
                                    <label class="xs-label">👤 Cliente:</label>
                                    <div style="display:flex; gap:5px;">
                                        <select id="pos-customer-id" class="form-control-sm" style="flex:1">
                                            <option value="">Cliente Genérico</option>
                                        </select>
                                        <button id="btn-quick-add-customer" class="btn btn-primary" style="padding: 0 10px;">➕</button>
                                    </div>
                                </div>

                                <div id="pos-cart-list" class="cart-items-container">
                                    <!-- Items del carrito -->
                                    <p class="text-center text-muted py-20">El carrito está vacío</p>
                                </div>

                                <div class="cart-summary">

                                <div class="payment-methods mb-15">
                                    <label class="small-label">💳 Métodos de Pago:</label>
                                    <div id="pos-payments" class="payment-rows">
                                        <!-- Filas de pago dinámicas -->
                                    </div>
                                    <button id="btn-add-payment" class="btn-text">+ Otro método</button>
                                </div>

                                <div class="total-box">
                                    <div class="total-line">
                                        <span>Total USD</span>
                                        <h2 id="pos-total-usd">${Formatter.formatCurrency(0)}</h2>
                                    </div>
                                    <div class="total-line secondary">
                                        <span>Total VES</span>
                                        <span id="pos-total-ves">${Formatter.formatNumber(0)} Bs</span>
                                    </div>
                                </div>

                                <button id="btn-process-sale" class="btn btn-primary w-100 mt-15 py-15" disabled>
                                    🚀 PROCESAR VENTA
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 2. RECONSTRUCCIÓN HISTÓRICA -->
                <div id="tab-pos-history" class="tab-content">
                    <div class="history-layout">
                        <div class="card glass max-width-600 center-block">
                            <h3 class="text-warning">⏳ Registro Retroactivo</h3>
                            <p class="small-text mb-15">Usa esto para cargar ventas de días pasados.</p>
                            <form id="form-historical-sales" class="erp-form">
                                <div class="form-group">
                                    <label>Fecha de Venta:</label>
                                    <input type="date" id="sale-date" value="${new Date().toLocaleDateString('en-CA')}" required>
                                </div>
                                <div class="form-group">
                                    <label>Producto:</label>
                                    <select id="sale-catalog-id" required>
                                        <option value="">Selecciona...</option>
                                    </select>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>Cant:</label>
                                        <input type="number" id="sale-qty" min="1" required>
                                    </div>
                                    <div class="form-group">
                                        <label>Total USD:</label>
                                        <input type="number" id="sale-total" step="0.0001" required>
                                    </div>
                                </div>
                                <button type="submit" class="btn btn-success w-100">Guardar en Historial</button>
                            </form>
                        </div>
                        
                        <div class="mt-30">
                            <h3>🕒 Últimos Movimientos</h3>
                            <table class="erp-table mt-15">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Producto</th>
                                        <th>Total</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="table-sales-history-v2"></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .pos-container { height: calc(100vh - 120px); display: flex; flex-direction: column; }
                .pos-tabs { display: flex; gap: 10px; border-bottom: 2px solid var(--border-color); padding-bottom: 10px; }
                .pos-tab { padding: 10px 20px; border: none; background: none; color: var(--text-muted); font-weight: 600; cursor: pointer; transition: all 0.3s; border-radius: 8px; }
                .pos-tab.active { background: var(--primary-color); color: white; }
                
                .tab-content { display: none; flex: 1; overflow: hidden; }
                .tab-content.active { display: flex; flex-direction: column; }

                .pos-layout { display: grid; grid-template-columns: 1fr 380px; gap: 20px; height: 100%; overflow: hidden; }
                .pos-products-panel { overflow-y: auto; padding-right: 10px; }
                .pos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px; }

                .product-card { 
                    background: white; border-radius: 12px; border: 1px solid var(--border-color); 
                    overflow: hidden; cursor: pointer; transition: all 0.2s; position: relative;
                    box-shadow: var(--shadow-sm); height: 220px; display: flex; flex-direction: column;
                }
                .product-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: var(--primary-color); }
                .product-card .img-box { height: 120px; background: #f1f5f9; position: relative; }
                .product-card .img-box img { width: 100%; height: 100%; object-fit: cover; }
                .product-card .info { padding: 10px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
                .product-card .name { font-weight: 600; font-size: 0.95rem; color: var(--text-main); line-height: 1.2; }
                .product-card .price { font-weight: 700; color: var(--success-color); font-size: 1.1rem; }
                .product-card .stock-tag { 
                    position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.6); 
                    color: white; padding: 2px 8px; border-radius: 20px; font-size: 0.75rem; 
                }

                .pos-cart-panel { 
                    border-radius: 15px; padding: 20px; 
                    height: 100%; border: 1px solid var(--border-color);
                    overflow-y: auto; 
                }
                .cart-items-container { 
                    margin-bottom: 20px;
                    border-top: 1px solid var(--border-color);
                    padding-top: 10px;
                }
                .cart-items-scroller { 
                    max-height: 250px;
                    overflow-y: auto; 
                    padding-right: 5px;
                }
                .cart-item-compact { 
                    display: grid; grid-template-columns: 1fr 60px 70px; align-items: center; 
                    padding: 6px 0; border-bottom: 1px solid var(--border-color); font-size: 0.85rem;
                }
                .item-info { display: flex; flex-direction: column; }
                .item-name { font-weight: 600; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .item-details { font-size: 0.75rem; color: var(--text-muted); }
                .item-qty-actions { display: flex; gap: 4px; }
                .item-total { text-align: right; font-weight: 700; color: var(--text-main); }
                
                .btn-qty-sm { width: 22px; height: 22px; border-radius: 4px; border: 1px solid var(--border-color); background: white; cursor: pointer; font-size: 0.8rem; }
                .btn-qty-sm:hover { background: var(--bg-main); border-color: var(--primary-color); }

                .xs-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 2px; }
                .form-control-sm { width: 100%; padding: 4px 8px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.85rem; background: var(--bg-body); }
                
                .total-box { background: var(--bg-main); padding: 10px; border-radius: 10px; }
                .total-line { display: flex; justify-content: space-between; align-items: center; }
                .total-line h2 { margin: 0; color: var(--success-color); font-size: 1.4rem; }
                .total-line.secondary { font-size: 0.85rem; color: var(--text-muted); margin-top: 2px; }

                .payment-row { display: grid; grid-template-columns: 1fr 100px 30px; gap: 5px; margin-bottom: 5px; }
                .btn-text { background: none; border: none; color: var(--primary-color); cursor: pointer; font-size: 0.85rem; font-weight: 600; }
                .btn-text:hover { text-decoration: underline; }
                
                .form-row { display: flex; gap: 10px; }
                .center-block { margin-left: auto; margin-right: auto; }
            </style>
        `;
    },

    renderProducts(products) {
        const grid = document.getElementById('pos-grid');
        if (!grid) return;

        grid.innerHTML = products.map(p => `
            <div class="product-card" data-id="${p.id}">
                <div class="img-box">
                    <img src="${p.image_url || 'https://via.placeholder.com/150'}" onerror="this.src='https://via.placeholder.com/150'">
                    <span class="stock-tag">${p.stock || 0} un.</span>
                </div>
                <div class="info">
                    <div class="name">${p.name}</div>
                    <div class="price">${Formatter.formatCurrency(p.price)}</div>
                </div>
            </div>
        `).join('');
    },

    renderCart(cart, rates) {
        const list = document.getElementById('pos-cart-list');
        const btnProcess = document.getElementById('btn-process-sale');
        if (!list) return;

        const totalUSD = cart.reduce((acc, item) => acc + (item.total || 0), 0);

        if (cart.length === 0) {
            list.innerHTML = '<p class="text-center text-muted py-20">El carrito está vacío</p>';
            btnProcess.disabled = true;
            document.getElementById('pos-total-usd').innerText = Formatter.formatCurrency(0);
            document.getElementById('pos-total-ves').innerText = `${Formatter.formatNumber(0)} Bs`;
            return;
        }

        // Preserve current UI state before re-rendering
        const todayLocal = new Date().toLocaleDateString('en-CA');
        const currentOrderType = document.getElementById('pos-order-type')?.value || 'directa';
        const currentFulfillment = document.getElementById('pos-fulfillment')?.value || 'pickup';
        const currentSaleDate = document.getElementById('pos-sale-date')?.value || todayLocal;
        const currentDeliveryDate = document.getElementById('pos-delivery-date')?.value || '';
        const currentDeliveryAddress = document.getElementById('pos-delivery-address')?.value || '';

        btnProcess.disabled = false;
        list.innerHTML = `
            <div class="cart-controls mb-10 p-10 glass" style="border-radius:10px; border-left:4px solid var(--primary-color); position: relative; z-index: 10; flex-shrink: 0;">
                <div class="form-row mb-5">
                    <div style="flex:1">
                        <label class="xs-label">📌 Operación:</label>
                        <select id="pos-order-type" class="form-control-sm">
                            <option value="directa">🛒 Vitrina</option>
                            <option value="encargo">📅 Encargo</option>
                        </select>
                    </div>
                    <div style="flex:1">
                        <label class="xs-label">🛵 Entrega:</label>
                        <select id="pos-fulfillment" class="form-control-sm">
                            <option value="pickup">🏪 Pickup</option>
                            <option value="delivery">🛵 Delivery</option>
                        </select>
                    </div>
                </div>
                <div class="form-row mb-5">
                    <div style="flex:1">
                         <label class="xs-label">🗓️ Fecha de Venta:</label>
                         <input type="date" id="pos-sale-date" class="form-control-sm" value="${todayLocal}" required>
                    </div>
                </div>
                <div id="pos-delivery-date-container" style="display:none;">
                    <label class="xs-label">🗓️ Fecha Entrega:</label>
                    <input type="date" id="pos-delivery-date" class="form-control-sm">
                </div>
                <div id="pos-delivery-address-container" style="display:none; margin-top:5px;">
                    <label class="xs-label">📍 Dirección Delivery:</label>
                    <textarea id="pos-delivery-address" class="form-control-sm" rows="2" placeholder="Dirección de entrega..."></textarea>
                </div>
            </div>

            <div class="cart-items-scroller">
                ${cart.map((item, idx) => `
                    <div class="cart-item-compact">
                        <div class="item-info">
                            <span class="item-name">${item.name}</span>
                            <span class="item-details">${Formatter.formatCurrency(item.price)} x ${Formatter.formatNumber(item.qty)}</span>
                        </div>
                        <div class="item-qty-actions">
                            <button class="btn-qty-sm" data-action="minus" data-idx="${idx}">-</button>
                            <button class="btn-qty-sm" data-action="plus" data-idx="${idx}">+</button>
                        </div>
                        <div class="item-total">${Formatter.formatCurrency(item.total)}</div>
                    </div>
                `).join('')}
            </div>
        `;

        // Restore UI state
        setTimeout(() => {
            const orderTypeEl = document.getElementById('pos-order-type');
            const fulfillmentEl = document.getElementById('pos-fulfillment');
            const saleDateEl = document.getElementById('pos-sale-date');
            const deliveryDateEl = document.getElementById('pos-delivery-date');
            const deliveryAddressEl = document.getElementById('pos-delivery-address');
            const dateContainer = document.getElementById('pos-delivery-date-container');
            const addressContainer = document.getElementById('pos-delivery-address-container');

            if (orderTypeEl) orderTypeEl.value = currentOrderType;
            if (fulfillmentEl) fulfillmentEl.value = currentFulfillment;
            if (saleDateEl) saleDateEl.value = currentSaleDate;
            if (deliveryDateEl) deliveryDateEl.value = currentDeliveryDate;
            if (deliveryAddressEl) deliveryAddressEl.value = currentDeliveryAddress;

            if (dateContainer) dateContainer.style.display = (currentOrderType === 'encargo') ? 'block' : 'none';
            if (addressContainer) addressContainer.style.display = (currentFulfillment === 'delivery') ? 'block' : 'none';
        }, 0);

        document.getElementById('pos-total-usd').innerText = Formatter.formatCurrency(totalUSD);
        const tasa = (rates && rates.tasa_usd_ves) ? rates.tasa_usd_ves : (rates?.usd_to_ves || 1);
        const totalVES = totalUSD * tasa;
        document.getElementById('pos-total-ves').innerText = `${Formatter.formatNumber(totalVES)} Bs`;
    },

    populateSelects(customers, products) {
        const custSelect = document.getElementById('pos-customer-id');
        const histSelect = document.getElementById('sale-catalog-id');

        if (custSelect) {
            custSelect.innerHTML = '<option value="">Cliente Genérico</option>' +
                customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }

        if (histSelect) {
            histSelect.innerHTML = '<option value="">Seleccionar...</option>' +
                products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        }
    },

    renderHistory(history, onDelete) {
        const tbody = document.getElementById('table-sales-history-v2');
        if (!tbody) return;

        tbody.innerHTML = history.map(h => {
            // Manejar renderizado de múltiples items de la orden V2
            const itemsList = h.v2_order_items ? h.v2_order_items.map(item => `${item.product_name} x${item.quantity}`).join(', ') : 'Desconocido';
            const clientName = h.v2_customers ? h.v2_customers.name : 'Genérico';

            return `
            <tr>
                <td>${new Date(h.sale_date).toLocaleDateString()}</td>
                <td><small>${clientName}</small><br/>${itemsList}</td>
                <td><strong>${Formatter.formatCurrency(h.total_amount)}</strong></td>
                <td>
                    <button class="btn-icon btn-delete-hist" data-id="${h.id}">🗑️</button>
                </td>
            </tr>
        `}).join('');

        tbody.querySelectorAll('.btn-delete-hist').forEach(tn => {
            tn.onclick = () => onDelete(tn.dataset.id);
        });
    },

    addPaymentRow(rates) {
        const container = document.getElementById('pos-payments');
        const div = document.createElement('div');
        div.className = 'payment-row';
        div.innerHTML = `
            <select class="pay-method form-control small-padding">
                <option value="Efectivo $">💵 Efectivo $</option>
                <option value="Pago Móvil Bs">📲 Pago Móvil (Bs)</option>
                <option value="Zelle $">📱 Zelle $</option>
                <option value="Punto de Venta">💳 Punto de Venta</option>
            </select>
            <input type="number" class="pay-amount form-control small-padding" placeholder="Monto" step="0.01">
            <button class="btn-rm-pay" style="color:var(--danger-color)">✕</button>
        `;
        container.appendChild(div);

        div.querySelector('.btn-rm-pay').onclick = () => div.remove();
    }
};
