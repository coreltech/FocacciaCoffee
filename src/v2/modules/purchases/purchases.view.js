import { Formatter } from '../../core/formatter.js';

export const PurchasesView = {
    renderMain() {
        return `
            <div class="v2-module-container fade-in">
                <!-- CABECERA PREMIUM -->
                <div class="module-header-v2" style="background: linear-gradient(135deg, var(--surface-color) 0%, #f8fafc 100%); padding: 25px; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); border-left: 5px solid var(--primary-color); display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <div>
                        <h2 class="section-title" style="border: none; margin-bottom: 5px; font-size: 1.6rem; display: flex; align-items: center; gap: 10px;">
                            <span style="background: var(--primary-light); padding: 8px; border-radius: 8px;">🛒</span> 
                            Reposición y Compras
                        </h2>
                        <p class="subtitle" style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0;">Gestiona el ingreso de mercancía, facturas de proveedores y Kardex.</p>
                    </div>
                    <div class="header-actions" style="display: flex; gap: 12px;">
                        <button class="btn btn-outline" id="btn-manage-suppliers" style="background: white; shadow: var(--shadow-sm); padding: 10px 18px; font-weight: 600;">👥 Directorio Proveedores</button>
                        <button class="btn btn-primary" id="btn-new-purchase" style="padding: 10px 20px; font-size: 1rem; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); transition: all 0.2s;">➕ Ingresar Mercancía</button>
                    </div>
                </div>

                <!-- CONTENEDOR DE TABLA PREMIUM -->
                <div class="v2-card" style="padding: 0; overflow: hidden; box-shadow: var(--shadow-md);">
                    <div style="padding: 15px 20px; background: #f8fafc; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="font-size: 1.1rem; color: var(--text-main); margin: 0;">Historial de Recepciones</h3>
                    </div>
                    <div class="table-responsive" style="max-height: calc(100vh - 280px); overflow-y: auto;">
                        <table class="v2-table" id="purchases-table" style="margin: 0; border: none;">
                            <thead style="position: sticky; top: 0; z-index: 10; background: var(--surface-color);">
                                <tr>
                                    <th>Fecha de Ingreso</th>
                                    <th>Empresa / Proveedor</th>
                                    <th>Soporte Contable</th>
                                    <th class="text-right">Monto Total (USD)</th>
                                    <th class="text-right">Monto Total (Bs)</th>
                                    <th class="text-center">Estado de Recepción</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td colspan="6" class="text-center text-muted" style="padding: 40px;">Cargando historial de compras...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- MODAL NUEVA COMPRA -->
            <div id="modal-purchase" class="modal-overlay">
                <div class="modal-content glass animate-scale" style="max-width: 800px; width: 95%; border-top: 4px solid var(--success-color);">
                    <div class="modal-header-flex" style="border-bottom: 1px solid var(--border-color); padding-bottom: 15px; margin-bottom: 20px;">
                        <h3 style="color: var(--success-color); display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 1.4rem;">📦</span> Ingreso de Mercancía
                        </h3>
                        <button class="btn-close" onclick="document.getElementById('modal-purchase').classList.remove('active')" style="background: var(--bg-light); border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">✕</button>
                    </div>
                    
                    <form id="form-purchase-v2" class="erp-form mt-15">
                        
                        <div class="form-row">
                            <div class="form-group" style="flex:2;">
                                <label>Proveedor *</label>
                                <select id="pur-supplier-id" required class="form-control">
                                    <option value="">Cargando proveedores...</option>
                                </select>
                            </div>
                            <div class="form-group" style="flex:1;">
                                <label>Fecha *</label>
                                <input type="date" id="pur-date" required class="form-control">
                            </div>
                        </div>

                        <div class="form-row" style="margin-top: 15px;">
                            <div class="form-group">
                                <label>Tipo de Doc.</label>
                                <select id="pur-doc-type" class="form-control">
                                    <option value="Factura">Factura</option>
                                    <option value="Nota de Entrega">Nota de Entrega</option>
                                    <option value="Sin Soporte">Sin Soporte</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Nro. Documento</label>
                                <input type="text" id="pur-doc-number" class="form-control" placeholder="000-000">
                            </div>
                            <div class="form-group">
                                <label>Tasa del Día (Referencia)</label>
                                <input type="number" id="pur-bcv-rate" class="form-control" step="0.01" readonly>
                            </div>
                        </div>

                        <div class="v2-card" style="margin-top: 25px; background: linear-gradient(to right, #ffffff, #f8fafc); border: 1px solid var(--border-color); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm);">
                            <h4 style="margin-bottom: 15px; color: var(--primary-dark); font-size: 1.1rem; border-bottom: 2px solid var(--primary-color); display: inline-block; padding-bottom: 5px;">
                                📝 Detalles de la Factura
                            </h4>
                            
                            <div class="form-row" style="align-items: flex-end; gap: 15px; background: white; padding: 15px; border-radius: 8px; border: 1px dashed var(--border-color);">
                                <div class="form-group" style="flex: 2; margin: 0;">
                                    <label>Buscar Insumo (Materia Prima)</label>
                                    <select id="pur-item-supply" class="form-control" style="background: var(--bg-light);">
                                        <option value="">Seleccione...</option>
                                    </select>
                                </div>
                                <div class="form-group" style="flex: 1; margin: 0;">
                                    <label>Cantidad</label>
                                    <input type="number" id="pur-item-qty" class="form-control" step="0.01" placeholder="Ej: 5">
                                </div>
                                <div class="form-group" style="flex: 1; margin: 0;">
                                    <label>Total ($)</label>
                                    <input type="number" id="pur-item-totalusd" class="form-control" step="0.01" placeholder="Ej: 10.50">
                                </div>
                                <div class="form-group" style="flex: 1; margin: 0;">
                                    <label>Total (Bs)</label>
                                    <input type="number" id="pur-item-totalbs" class="form-control" step="0.01" placeholder="Ej: 420.00">
                                </div>
                                <div class="form-group" style="margin: 0;">
                                    <button type="button" class="btn btn-primary" id="btn-add-line" style="height: 42px; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm);">➕ Añadir</button>
                                </div>
                            </div>
                            <small class="text-muted" id="lbl-unit-helper" style="display: block; margin-top: 8px; font-style: italic;">💡 El precio unitario se calculará automáticamente y actualizará el costo de tus recetas.</small>

                            <div class="table-responsive mt-20" style="border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
                                <table class="v2-table" style="margin: 0; background: white;" id="pur-cart-table">
                                    <thead style="background: var(--surface-color);">
                                        <tr>
                                            <th>Descripción del Insumo</th>
                                            <th class="text-right">Cant. Ingresada</th>
                                            <th class="text-right">Costo Unit. ($)</th>
                                            <th class="text-right">Costo Total ($)</th>
                                            <th class="text-center">Quitar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    </tbody>
                                </table>
                            </div>
                            <div style="text-align: right; padding: 20px 15px 5px 15px; font-size: 1.3rem; font-weight: 800; color: var(--text-main); display: flex; justify-content: flex-end; align-items: center; gap: 15px;">
                                <span>Total Documento:</span> 
                                <span id="pur-grand-total-usd" style="color: var(--success-color); background: #f0fdf4; padding: 5px 15px; border-radius: 8px; border: 1px solid #bbf7d0;">${Formatter.formatCurrency(0)}</span> 
                                <span id="pur-grand-total-bs" style="font-size: 1rem; color: var(--text-muted); font-weight: 500;">(${Formatter.formatNumber(0)} Bs)</span>
                            </div>
                        </div>

                        <div class="modal-actions mt-20" style="display:flex; gap:10px; justify-content:flex-end;">
                            <button type="button" class="btn btn-outline" onclick="document.getElementById('modal-purchase').classList.remove('active')">Cancelar</button>
                            <button type="submit" class="btn btn-success" id="btn-save-purchase">Procesar Ingreso</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- MODAL PROVEEDORES -->
            <div id="modal-suppliers" class="modal-overlay">
                <div class="modal-content glass animate-scale" style="max-width: 650px; border-top: 4px solid var(--primary-color);">
                    <div class="modal-header-flex" style="border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 15px;">
                        <h3 style="color: var(--primary-color);">👥 Directorio de Proveedores</h3>
                        <button class="btn-close" onclick="document.getElementById('modal-suppliers').classList.remove('active')">✕</button>
                    </div>
                    
                    <div class="v2-card" style="background: var(--bg-light); padding: 15px; border-radius: var(--radius-md);">
                        <h4 style="margin-bottom: 10px; color: var(--text-main); font-size: 0.95rem;">✨ Nuevo Proveedor</h4>
                        <div class="form-row" style="align-items:flex-end; gap: 15px;">
                            <input type="hidden" id="sup-id">
                            <div class="form-group" style="flex:2;">
                                <label>Nombre Comercial *</label>
                                <input type="text" id="sup-name" class="form-control" placeholder="Ej: Distribuidora La Esperanza">
                            </div>
                            <div class="form-group" style="flex:2;">
                                <label>Teléfono o Email de Contacto</label>
                                <input type="text" id="sup-contact" class="form-control" placeholder="0414-0000000">
                            </div>
                            <div class="form-group">
                                <button type="button" class="btn btn-primary" id="btn-save-supplier" style="margin-bottom:2px; box-shadow: var(--shadow-sm);">Guardar</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="table-responsive mt-20" style="max-height: 350px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                        <table class="v2-table" id="suppliers-table" style="margin: 0; background: white;">
                            <thead style="position: sticky; top: 0; z-index: 10;">
                                <tr>
                                    <th>Nombre del Proveedor</th>
                                    <th>Info. de Contacto</th>
                                    <th class="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                            </tbody>
                        </table>
                    </div>

                    <div class="modal-actions mt-20" style="display:flex; justify-content:flex-end; padding-top: 15px; border-top: 1px solid var(--border-color);">
                        <button type="button" class="btn btn-outline" style="min-width: 120px;" onclick="document.getElementById('modal-suppliers').classList.remove('active')">Cerrar Ventana</button>
                    </div>
                </div>
            </div>
        `;
    },

    renderPurchasesTable(purchases) {
        const tbody = document.querySelector('#purchases-table tbody');
        if (!tbody) return;

        if (purchases.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Aún no hay compras registradas en el sistema V2.</td></tr>';
            return;
        }

        tbody.innerHTML = purchases.map(p => `
            <tr>
                <td>${p.purchase_date}</td>
                <td style="font-weight:600;">${p.supplier?.name || 'Desconocido'}</td>
                <td>
                    <span class="badge" style="background:var(--bg-light); color:var(--text-main); border:1px solid #e2e8f0;">
                        ${p.document_type} ${p.document_number ? '#' + p.document_number : ''}
                    </span>
                </td>
                <td class="text-right" style="color:var(--success-color); font-weight:bold;">${Formatter.formatCurrency(p.total_usd)}</td>
                <td class="text-right" style="color:var(--text-muted);">${Formatter.formatNumber(p.total_bs)} Bs</td>
                <td>
                    <span class="badge badge-success">Procesada</span>
                </td>
            </tr>
        `).join('');
    },

    renderSuppliersOptions(selectId, suppliers) {
        const select = document.getElementById(selectId);
        if (!select) return;
        select.innerHTML = '<option value="">Seleccione...</option>' +
            suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    },

    renderSuppliesOptions(selectId, supplies) {
        const select = document.getElementById(selectId);
        if (!select) return;
        select.innerHTML = '<option value="">Seleccione o busque...</option>' +
            supplies.map(s => `<option value="${s.id}" data-measure="${s.measurement_unit}">${s.name} (${s.measurement_unit})</option>`).join('');
    },

    renderSuppliersTable(suppliers, onEdit, onDelete) {
        const tbody = document.querySelector('#suppliers-table tbody');
        if (!tbody) return;

        if (suppliers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Directorio vacío. Crea un proveedor arriba.</td></tr>';
            return;
        }

        tbody.innerHTML = suppliers.map(s => `
            <tr>
                <td style="font-weight:600;">${s.name}</td>
                <td>${s.contact_info || '<span class="text-muted">N/D</span>'}</td>
                <td class="text-center">
                    <button class="btn-icon text-primary btn-edit-sup" data-id="${s.id}" data-name="${s.name}" data-contact="${s.contact_info || ''}" title="Editar">✏️</button>
                    <button class="btn-icon text-danger btn-del-sup" data-id="${s.id}" data-name="${s.name}" title="Eliminar">🗑️</button>
                </td>
            </tr>
        `).join('');

        // Attach events
        tbody.querySelectorAll('.btn-edit-sup').forEach(btn => {
            btn.onclick = () => onEdit({
                id: btn.dataset.id,
                name: btn.dataset.name,
                contact: btn.dataset.contact
            });
        });

        tbody.querySelectorAll('.btn-del-sup').forEach(btn => {
            btn.onclick = () => onDelete(btn.dataset.id, btn.dataset.name);
        });
    },

    renderCartTable(cart, onRemove) {
        const tbody = document.querySelector('#pur-cart-table tbody');
        if (!tbody) return;

        if (cart.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Añade insumos a la factura</td></tr>';
            return;
        }

        tbody.innerHTML = cart.map((item, index) => `
            <tr>
                <td>${item.name}</td>
                <td class="text-right">${Formatter.formatNumber(item.qty)} ${item.measure}</td>
                <td class="text-right">${Formatter.formatCurrency(item.price)}</td>
                <td class="text-right" style="font-weight:bold;">${Formatter.formatCurrency(item.total)}</td>
                <td class="text-center">
                    <button class="btn-icon text-danger btn-rem-cart" data-index="${index}">❌</button>
                </td>
            </tr>
        `).join('');

        tbody.querySelectorAll('.btn-rem-cart').forEach(btn => {
            btn.onclick = () => onRemove(parseInt(btn.dataset.index));
        });
    }
};
