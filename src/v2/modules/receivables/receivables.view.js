/**
 * Vista de Cobranzas y Ventas (UI Layer V2)
 */
import { Formatter } from '../../core/formatter.js';

export const ReceivablesView = {
    render(container) {
        container.innerHTML = `
            <div class="v2-module-container animate-fade-in">
                <div class="header-flex mb-20">
                    <h2 class="section-title">Historial de Ventas y Cobranzas</h2>
                    <div class="filter-group">
                        <label class="xs-label" style="align-self: center; margin-bottom: 0;">Desde:</label>
                        <input type="date" id="filter-start-date" class="form-control-sm">
                        <label class="xs-label" style="align-self: center; margin-bottom: 0;">Hasta:</label>
                        <input type="date" id="filter-end-date" class="form-control-sm" style="margin-right: 15px;">
                        
                        <button class="btn btn-outline pos-tab active" data-filter="todas">Todas</button>
                        <button class="btn btn-outline pos-tab" data-filter="cobradas">Cobradas</button>
                        <button class="btn btn-outline pos-tab" data-filter="por_cobrar">Por Cobrar</button>
                        <button class="btn btn-outline pos-tab" data-filter="encargos">Encargos</button>
                    </div>
                </div>

                <div class="kpis-row">
                    <div class="kpi-card success-glass">
                        <div class="kpi-icon">💵</div>
                        <div class="kpi-info">
                            <span class="kpi-label">Total Cobrado</span>
                            <h3 id="receivables-collected-value">${Formatter.formatCurrency(0)}</h3>
                        </div>
                    </div>
                    <div class="kpi-card danger-glass">
                        <span class="kpi-title">Total Cuentas por Cobrar</span>
                        <span class="kpi-value text-danger" id="kpi-total-deuda">${Formatter.formatCurrency(0)}</span>
                    </div>
                    <div class="kpi-card">
                        <span class="kpi-title">Órdenes Pendientes</span>
                        <span class="kpi-value warning" id="kpi-count-pendientes">0</span>
                    </div>
                </div>

                <div class="card glass p-0 overflow-hidden">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Producto</th>
                                <th>Tipo</th>
                                <th>Total ($)</th>
                                <th>Deuda ($)</th>
                                <th>Estatus</th>
                                <th style="width: 100px;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="table-receivables-body">
                            <!-- Filas inyectadas por JS -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Modal de Pagos (Abonos) -->
            <div id="modal-payment" class="modal-overlay">
                <div class="modal-content glass animate-scale" style="max-width: 400px;">
                    <div class="modal-header">
                        <h3 class="modal-title">Registrar Cobro</h3>
                        <button class="modal-close" onclick="document.getElementById('modal-payment').classList.remove('active')">&times;</button>
                    </div>
                    <form id="form-add-payment" class="erp-form">
                        <input type="hidden" id="pay-order-id">
                        
                        <div class="form-group text-center mb-15">
                            <span class="text-muted" style="font-size: 0.85rem;">Deuda Pendiente:</span>
                            <h2 class="text-danger m-0" id="pay-current-debt">${Formatter.formatCurrency(0)}</h2>
                        </div>
                        
                        <div class="form-group">
                            <label>Método de Pago:</label>
                            <select id="pay-method" class="form-control" required>
                                <option value="Efectivo $">💵 Efectivo $</option>
                                <option value="Pago Móvil Bs">📲 Pago Móvil (Bs)</option>
                                <option value="Zelle $">📱 Zelle $</option>
                                <option value="Punto de Venta">💳 Punto de Venta</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label id="label-pay-amount">Monto a Abonar (en USD):</label>
                            <input type="number" id="pay-amount" class="form-control" step="0.0001" required>
                        </div>
                        
                        <button type="submit" class="btn btn-success w-100 mt-15">Procesar Abono</button>
                    </form>
                </div>
            </div>

            <!-- Modal de Historial de Pagos -->
            <div id="modal-payment-history" class="modal-overlay">
                <div class="modal-content glass animate-scale" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3 class="modal-title">Historial de Pagos</h3>
                        <button class="modal-close" onclick="document.getElementById('modal-payment-history').classList.remove('active')">&times;</button>
                    </div>
                    <div class="p-15">
                        <div id="history-order-info" class="mb-15 text-center">
                            <h4 id="history-correlative" class="m-0">---</h4>
                            <span id="history-customer" class="text-muted">---</span>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="erp-table sm">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Método</th>
                                        <th>Monto ($)</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody id="table-history-body">
                                    <!-- Abonos inyectados -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .filter-group { display: flex; gap: 10px; }
                .pos-tab.active { background-color: var(--primary-color); color: white; border-color: var(--primary-color); }
                .text-danger { color: var(--danger-color) !important; font-weight: 700; }
                .text-success { color: var(--success-color) !important; font-weight: 700; }
                .badge { padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
                .badge-pagado { background: rgba(16, 185, 129, 0.1); color: var(--success-color); }
                .badge-pendiente { background: rgba(239, 68, 68, 0.1); color: var(--danger-color); }
                
                .btn-icon { 
                    background: #f1f5f9; 
                    border: 1px solid #e2e8f0; 
                    border-radius: 4px; 
                    padding: 4px 8px; 
                    cursor: pointer; 
                    transition: all 0.2s;
                    font-size: 1.1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 35px;
                    height: 35px;
                }
                .btn-icon:hover { background: #e2e8f0; transform: scale(1.1); }
                .btn-history { color: var(--primary-color); }
            </style>
        `;
    },

    renderTable(orders, onAbonarClick) {
        const tbody = document.getElementById('table-receivables-body');
        if (!tbody) return;

        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-20 text-muted">No se encontraron registros.</td></tr>';
            return;
        }

        tbody.innerHTML = orders.map(o => {
            const isEncargo = o.is_preorder;
            const clienteName = o.v2_customers?.name || o.metadata?.customer_name || 'Cliente Genérico';

            // Build products string
            let productsDesc = 'Productos Varios';
            if (o.v2_order_items && o.v2_order_items.length > 0) {
                productsDesc = o.v2_order_items.map(item => `${item.product_name} x${item.quantity}`).join('<br>');
            }

            const statusClass = (o.payment_status === 'Pagado') ? 'badge-pagado' : 'badge-pendiente';
            const showPayBtn = o.balance_due > 0;

            return `
                <tr>
                    <td>${Formatter.formatLocalDate(o.sale_date)}</td>
                    <td><strong>${clienteName}</strong></td>
                    <td style="font-size: 0.8rem;">${productsDesc}</td>
                    <td>${isEncargo ? '📅 Encargo' : '🛒 Directa'}</td>
                    <td>${Formatter.formatCurrency(o.total_amount)}</td>
                    <td class="${o.balance_due > 0 ? 'text-danger' : 'text-success'}">
                        ${Formatter.formatCurrency(o.balance_due)}
                    </td>
                    <td><span class="badge ${statusClass}">${o.payment_status}</span></td>
                    <td>
                        <div style="display: flex; gap: 8px; align-items: center; justify-content: center;">
                            <button class="btn-icon btn-history" data-id="${o.id}" data-correlative="${o.correlative || 'S/N'}" data-customer="${clienteName}" title="Ver Historial de Pagos">📖</button>
                            ${showPayBtn ? `<button class="btn-icon btn-pay" data-id="${o.id}" data-debt="${o.balance_due}" title="Registrar Abono">💲</button>` : `<span class="text-success" style="width:32px; text-align:center;">✔</span>`}
                            <button class="btn-icon btn-delete text-danger" data-id="${o.id}" title="Eliminar Registro">🗑️</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Agregar eventos a los botones generados dinámicamente
        tbody.querySelectorAll('.btn-history').forEach(btn => {
            btn.onclick = () => {
                window.dispatchEvent(new CustomEvent('Receivables:showHistory', {
                    detail: {
                        orderId: btn.dataset.id,
                        correlative: btn.dataset.correlative,
                        customer: btn.dataset.customer
                    }
                }));
            };
        });
        tbody.querySelectorAll('.btn-pay').forEach(btn => {
            btn.onclick = () => onAbonarClick(btn.dataset.id, btn.dataset.debt);
        });
        tbody.querySelectorAll('.btn-delete').forEach(btn => {
            btn.onclick = () => {
                if (confirm('¿Está seguro de que desea eliminar esta transacción de forma permanente?')) {
                    // We need to trigger an event that the controller can catch
                    window.dispatchEvent(new CustomEvent('Receivables:deleteOrder', { detail: { orderId: btn.dataset.id } }));
                }
            };
        });
    },

    updateKPIs(orders) {
        const totalDeuda = orders.reduce((sum, o) => sum + parseFloat(o.balance_due || 0), 0);
        const totalCobrado = orders.reduce((sum, o) => sum + parseFloat(o.amount_paid || 0), 0);
        const pendientes = orders.filter(o => o.balance_due > 0).length;

        const valObj = document.getElementById('kpi-total-deuda'); // Renamed from kpiDebt
        const collectedObj = document.getElementById('receivables-collected-value');
        const countObj = document.getElementById('kpi-count-pendientes'); // Renamed from kpiCount

        if (valObj) valObj.innerText = Formatter.formatCurrency(totalDeuda);
        if (collectedObj) collectedObj.innerText = Formatter.formatCurrency(totalCobrado);
        if (countObj) countObj.innerText = pendientes;
    }
};
