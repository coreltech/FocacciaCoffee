/**
 * Vista de Preventa y Consolidación V2
 */
import { Formatter } from '../../core/formatter.js';

export const PreventaView = {
    render(container) {
        container.innerHTML = `
            <div class="preventa-container animate-fade-in">
                <header class="module-header glass" style="display:flex; justify-content:space-between; align-items:center;">
                    <div class="header-info">
                        <h1>📋 Conssolidación de Pedidos</h1>
                        <p>Gestión centralizada de pre-ventas y encargos programados.</p>
                    </div>
                    <div class="header-actions">
                        <button id="btn-refresh-preventa" class="btn btn-outline">🔄 Actualizar</button>
                    </div>
                </header>

                <div class="preventa-tabs" style="display:flex; gap:10px; margin-top:20px;">
                    <button class="tab-btn active" data-tab="orders">📦 Órdenes</button>
                    <button class="tab-btn" data-tab="production">🥐 Producción</button>
                    <button class="tab-btn" data-tab="market">🛒 Lista de Mercado</button>
                </div>

                <div id="preventa-content" style="margin-top: 20px;">
                    <!-- Se renderiza dinámicamente según la pestaña -->
                </div>
            </div>

            <style>
                .preventa-tabs {
                    border-bottom: 1px solid var(--border-color);
                    padding-bottom: 0;
                }
                .tab-btn {
                    padding: 10px 20px;
                    background: transparent;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    font-weight: 600;
                    border-bottom: 2px solid transparent;
                    transition: all 0.2s;
                }
                .tab-btn.active {
                    color: var(--primary-color);
                    border-bottom-color: var(--primary-color);
                    background: rgba(59, 130, 246, 0.05);
                }
                .preventa-grid-full {
                   display: grid;
                   grid-template-columns: 1fr;
                   gap: 20px;
                }
                .badge-count {
                    background: var(--primary-color);
                    color: white;
                    padding: 2px 10px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 700;
                }
                .item-list-mini {
                    font-size: 0.75rem;
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    color: var(--text-muted);
                }
                .item-list-mini li {
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    padding: 2px 0;
                }
                .delivery-today {
                    background: rgba(16, 185, 129, 0.1);
                    color: var(--success-color);
                }
                .delivery-late {
                    background: rgba(239, 68, 68, 0.1);
                    color: var(--danger-color);
                }
                
                @media print {
                    .erp-sidebar, .erp-topbar, .header-actions, .card:first-child, .btn-sm { display: none !important; }
                    .erp-main { margin: 0 !important; padding: 0 !important; width: 100vw !important; }
                    .preventa-grid { grid-template-columns: 1fr !important; }
                    .card { border: none !important; box-shadow: none !important; background: white !important; color: black !important; }
                    .erp-table { color: black !important; }
                    .erp-table th, .erp-table td { border-bottom: 1px solid #000 !important; color: black !important; }
                }
            </style>
        `;
    },

    /**
     * Renderiza la estructura de la pestaña de Órdenes
     */
    renderOrdersTab(container, orders) {
        container.innerHTML = `
            <div class="card glass animate-fade-in">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <h3 style="margin:0;">📦 Órdenes Individuales (Encargos)</h3>
                        <span class="badge-count">${orders.length} Pedidos</span>
                    </div>
                    <div class="export-actions">
                        <button id="btn-export-orders-excel" class="btn btn-outline btn-sm">📊 Excel</button>
                        <button id="btn-export-orders-pdf" class="btn btn-outline btn-sm">📄 PDF</button>
                    </div>
                </div>
                <div class="table-container" style="max-height: 70vh; overflow-y:auto;">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th>Entrega</th>
                                <th>Cliente / Pedido</th>
                                <th>Detalle</th>
                                <th class="text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this._getOrdersRows(orders)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    /**
     * Renderiza la estructura de la pestaña de Producción
     */
    renderProductionTab(container, items, onBake) {
        container.innerHTML = `
            <div class="card glass animate-fade-in">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h3 style="margin:0;">🥐 Resumen de Producción (Productos)</h3>
                    <div style="display:flex; gap:8px;">
                        <button id="btn-export-prod-excel" class="btn btn-outline btn-sm">📊 Excel</button>
                        <button id="btn-export-prod-pdf" class="btn btn-outline btn-sm">📄 PDF</button>
                        <button id="btn-print-workshop" class="btn btn-outline btn-sm">🖨️ Imprimir Pedidos</button>
                    </div>
                </div>
                <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:15px;">Cantidades totales de productos terminados para hornear hoy:</p>
                <div class="table-container">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th class="text-center">Total Unids</th>
                                <th class="text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody id="table-consolidated-body">
                            ${this._getProductionRows(items)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        const btnPrint = document.getElementById('btn-print-workshop');
        if (btnPrint) btnPrint.onclick = () => window.print();

        if (onBake) {
            container.querySelectorAll('.btn-action-bake').forEach(btn => {
                btn.onclick = () => {
                    const orderIds = JSON.parse(btn.dataset.orders || '[]');
                    onBake(btn.dataset.id, btn.dataset.name, parseFloat(btn.dataset.qty), orderIds);
                };
            });
        }
    },

    /**
     * Renderiza la estructura de la pestaña de Mercado (Insumos)
     */
    renderMarketTab(container, supplies) {
        container.innerHTML = `
            <div class="card glass animate-fade-in">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h3 style="margin:0;">🛒 Lista de Mercado (Insumos)</h3>
                    <div style="display:flex; gap:8px;">
                        <button id="btn-export-market-excel" class="btn btn-outline btn-sm">📊 Excel</button>
                        <button id="btn-export-market-pdf" class="btn btn-outline btn-sm">📄 PDF</button>
                        <button id="btn-print-market" class="btn btn-outline btn-sm">🖨️ Imprimir Lista</button>
                    </div>
                </div>
                <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:15px;">Totales de ingredientes necesarios desglosados (Referencial):</p>
                <div class="table-container">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th>Ingrediente / Insumo</th>
                                <th class="text-right">Cantidad Total</th>
                                <th>Unidad</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${supplies.length === 0 ? '<tr><td colspan="3" class="text-center">No hay insumos para calcular.</td></tr>' :
                supplies.map(s => `
                                <tr>
                                    <td><strong style="color:var(--primary-color);">${s.name}</strong></td>
                                    <td class="text-right"><strong style="font-size:1.1rem;">${Formatter.formatNumber(s.qty)}</strong></td>
                                    <td><span class="badge" style="opacity:0.7;">${s.unit || 'un'}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        const btnPrint = document.getElementById('btn-print-market');
        if (btnPrint) btnPrint.onclick = () => window.print();
    },

    _getOrdersRows(orders) {
        if (orders.length === 0) return `<tr><td colspan="4" class="text-center" style="padding:40px; opacity:0.5;">No hay pre-ventas pendientes.</td></tr>`;
        return orders.map(o => {
            const itemsHtml = (o.v2_order_items || []).map(i => `<li>${i.quantity}x ${i.product_name}</li>`).join('');
            const deliveryDate = o.delivery_date ? new Date(o.delivery_date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'S/F';
            const isToday = o.delivery_date && o.delivery_date === new Date().toISOString().split('T')[0];
            const dateClass = isToday ? 'badge delivery-today' : 'badge';

            return `
                <tr>
                    <td><span class="${dateClass}">${deliveryDate}</span></td>
                    <td>
                        <strong style="display:block;">${o.v2_customers?.name || 'Cliente Genérico'}</strong>
                        <span style="font-size:0.7rem; color:var(--text-muted);">#${o.correlative || o.id.slice(0, 5)}</span>
                    </td>
                    <td><ul class="item-list-mini">${itemsHtml}</ul></td>
                    <td class="text-right"><strong>$${Formatter.formatNumber(o.total_amount)}</strong></td>
                </tr>
            `;
        }).join('');
    },

    _getProductionRows(items) {
        if (items.length === 0) return `<tr><td colspan="3" class="text-center" style="padding:40px; opacity:0.5;">No hay productos para consolidar.</td></tr>`;
        return items.map(i => `
            <tr>
                <td><strong style="font-size:0.95rem;">${i.name}</strong></td>
                <td class="text-center">
                    <span style="font-size:1.2rem; font-weight:bold; color:var(--primary-color);">${i.total_qty}</span>
                </td>
                <td class="text-center">
                    <button class="btn btn-primary btn-sm btn-action-bake" 
                            data-id="${i.id}" 
                            data-name="${i.name}" 
                            data-qty="${i.total_qty}" 
                            data-orders='${JSON.stringify(i.orderIds)}'>🔥 Hornear</button>
                </td>
            </tr>
        `).join('');
    }
};
