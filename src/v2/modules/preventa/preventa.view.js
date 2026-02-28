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

                <div class="preventa-grid">
                    <!-- PANEL IZQUIERDO: LISTA DE ÓRDENES -->
                    <div class="card glass">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                            <h3 style="margin:0;">📦 Órdenes Individuales</h3>
                            <span id="orders-count-badge" class="badge-count">0 Órdenes</span>
                        </div>
                        <div class="table-container" style="max-height: 70vh; overflow-y:auto;">
                            <table class="erp-table">
                                <thead>
                                    <tr>
                                        <th>Entrega</th>
                                        <th>Cliente / Pedido</th>
                                        <th>Detalle</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody id="table-preorders-body">
                                    <tr><td colspan="4" class="text-center">Cargando pedidos...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- PANEL DERECHO: CONSOLIDADO DE PRODUCCIÓN -->
                    <div class="card glass">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                            <h3 style="margin:0;">🥐 Resumen de Producción</h3>
                            <button id="btn-print-workshop" class="btn btn-outline btn-sm">🖨️ Imprimir Hoja</button>
                        </div>
                        <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:15px;">Totales acumulados para el taller de panadería:</p>
                        
                        <div class="table-container">
                            <table class="erp-table">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th class="text-center">Total Unids</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody id="table-consolidated-body">
                                    <tr><td colspan="3" class="text-center">No hay productos consolidados.</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div id="no-consolidated-msg" style="display:none; text-align:center; padding:40px; opacity:0.6;">
                            <span style="font-size:3rem; display:block; margin-bottom:10px;">✨</span>
                            <p>No hay productos pendientes por procesar.</p>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .preventa-grid {
                    display: grid;
                    grid-template-columns: 1.1fr 0.9fr;
                    gap: 20px;
                    margin-top: 20px;
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

    renderOrders(orders) {
        const tbody = document.getElementById('table-preorders-body');
        const badge = document.getElementById('orders-count-badge');
        if (!tbody) return;

        badge.innerText = `${orders.length} Pedidos`;

        if (orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="padding:40px; opacity:0.5;">No hay pre-ventas pendientes.</td></tr>`;
            return;
        }

        tbody.innerHTML = orders.map(o => {
            const itemsHtml = (o.v2_order_items || []).map(i => `<li>${i.quantity}x ${i.product_name}</li>`).join('');
            const deliveryDate = o.delivery_date ? new Date(o.delivery_date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'S/F';

            // Lógica de colores para entrega
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

    renderConsolidated(items, onBake) {
        const tbody = document.getElementById('table-consolidated-body');
        if (!tbody) return;

        if (items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center" style="padding:40px; opacity:0.5;">No hay productos para consolidar.</td></tr>`;
            return;
        }

        tbody.innerHTML = items.map(i => `
            <tr>
                <td><strong style="font-size:0.95rem;">${i.name}</strong></td>
                <td class="text-center">
                    <span style="font-size:1.2rem; font-weight:bold; color:var(--primary-color);">${i.total_qty}</span>
                </td>
                <td>
                    <button class="btn btn-primary btn-sm btn-action-bake" 
                            data-id="${i.id}" 
                            data-name="${i.name}" 
                            data-qty="${i.total_qty}" 
                            data-orders='${JSON.stringify(i.orderIds)}'>🔥 Hornear</button>
                </td>
            </tr>
        `).join('');

        if (onBake) {
            tbody.querySelectorAll('.btn-action-bake').forEach(btn => {
                btn.onclick = () => {
                    const orderIds = JSON.parse(btn.dataset.orders || '[]');
                    onBake(btn.dataset.id, btn.dataset.name, parseFloat(btn.dataset.qty), orderIds);
                };
            });
        }
    }
};
