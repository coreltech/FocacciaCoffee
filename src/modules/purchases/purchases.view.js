/**
 * Capa de vista para el módulo de compras
 * Renderiza la interfaz de usuario
 */

export const PurchasesView = {

    /**
     * Renderiza la vista principal del módulo
     */
    renderMain() {
        return `
            <div class="purchases-module">
                <div class="module-header">
                    <h2>📦 Gestión de Compras</h2>
                    <div class="header-actions">
                        <button class="btn-primary" id="btn-new-supplier">
                            👤 Nuevo Proveedor
                        </button>
                        <button class="btn-primary" id="btn-new-purchase">
                            ➕ Nueva Compra
                        </button>
                    </div>
                </div>

                <div class="tabs-container">
                    <div class="tabs">
                        <button class="tab-btn active" data-tab="purchases">Compras</button>
                        <button class="tab-btn" data-tab="suppliers">Proveedores</button>
                    </div>
                </div>

                <div id="tab-content" class="tab-content">
                    <!-- El contenido se cargará dinámicamente -->
                </div>
            </div>
        `;
    },

    /**
     * Renderiza la lista de compras
     */
    renderPurchasesList(purchases) {
        if (!purchases || purchases.length === 0) {
            return `
                <div class="empty-state">
                    <p>📦 No hay compras registradas</p>
                    <button class="btn-primary" id="btn-new-purchase-empty">Nueva Compra</button>
                </div>
            `;
        }

        const rows = purchases.map(purchase => `
            <tr data-id="${purchase.id}">
                <td>${new Date(purchase.purchase_date).toLocaleDateString()}</td>
                <td>${purchase.supplier?.name || 'N/A'}</td>
                <td>
                    <span class="badge badge-${purchase.document_type === 'Factura' ? 'success' : 'info'}">
                        ${purchase.document_type === 'Factura' ? '📄 Factura' : '📋 ' + purchase.document_type}
                    </span>
                </td>
                <td>${purchase.document_number || 'N/A'}</td>
                <td class="text-right">$${parseFloat(purchase.total_usd || 0).toFixed(2)}</td>
                <td class="text-right">Bs ${parseFloat(purchase.total_bs || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                <td class="text-center">
                    <button class="btn-icon" data-action="view" data-id="${purchase.id}" title="Ver detalles">
                        👁️
                    </button>
                </td>
            </tr>
        `).join('');

        return `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Proveedor</th>
                            <th>Tipo</th>
                            <th>Nº Documento</th>
                            <th class="text-right">Total USD</th>
                            <th class="text-right">Total Bs</th>
                            <th class="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    },

    /**
     * Renderiza la lista de proveedores
     */
    renderSuppliersList(suppliers) {
        if (!suppliers || suppliers.length === 0) {
            return `
                <div class="empty-state">
                    <p>👤 No hay proveedores registrados</p>
                    <button class="btn-primary" id="btn-new-supplier-empty">Nuevo Proveedor</button>
                </div>
            `;
        }

        const cards = suppliers.map(supplier => `
            <div class="supplier-card" data-id="${supplier.id}">
                <div class="supplier-header">
                    <h3>${supplier.name}</h3>
                    <span class="supplier-tax-id">RIF: ${supplier.tax_id || 'N/A'}</span>
                </div>
                <div class="supplier-body">
                    <p><strong>Contacto:</strong> ${supplier.contact_name || 'N/A'}</p>
                    <p><strong>Teléfono:</strong> ${supplier.contact_phone || 'N/A'}</p>
                    <p><strong>Email:</strong> ${supplier.contact_email || 'N/A'}</p>
                </div>
                <div class="supplier-actions">
                    <button class="btn-secondary" data-action="edit-supplier" data-id="${supplier.id}">
                        ✏️ Editar
                    </button>
                    <button class="btn-secondary" data-action="manage-locations" data-id="${supplier.id}">
                        📍 Ubicaciones
                    </button>
                </div>
            </div>
        `).join('');

        return `
            <div class="suppliers-grid">
                ${cards}
            </div>
        `;
    },

    /**
     * Renderiza el formulario de nuevo proveedor
     */
    renderSupplierForm(supplier = null) {
        const isEdit = !!supplier;

        return `
            <div class="modal-overlay" id="supplier-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${isEdit ? '✏️ Editar Proveedor' : '👤 Nuevo Proveedor'}</h3>
                        <button class="btn-close" id="close-supplier-modal">✕</button>
                    </div>
                    <form id="supplier-form" class="form-grid">
                        <div class="form-group">
                            <label for="supplier-name">Nombre del Proveedor *</label>
                            <input 
                                type="text" 
                                id="supplier-name" 
                                name="name" 
                                required 
                                value="${supplier?.name || ''}"
                                placeholder="Ej: Distribuidora La Esperanza"
                            />
                        </div>

                        <div class="form-group">
                            <label for="supplier-tax-id">RIF / Cédula *</label>
                            <input 
                                type="text" 
                                id="supplier-tax-id" 
                                name="tax_id" 
                                required 
                                value="${supplier?.tax_id || ''}"
                                placeholder="Ej: J-12345678-9"
                            />
                        </div>

                        <div class="form-group">
                            <label for="supplier-contact-name">Nombre de Contacto</label>
                            <input 
                                type="text" 
                                id="supplier-contact-name" 
                                name="contact_name" 
                                value="${supplier?.contact_name || ''}"
                                placeholder="Ej: Juan Pérez"
                            />
                        </div>

                        <div class="form-group">
                            <label for="supplier-contact-phone">Teléfono</label>
                            <input 
                                type="tel" 
                                id="supplier-contact-phone" 
                                name="contact_phone" 
                                value="${supplier?.contact_phone || ''}"
                                placeholder="Ej: 0414-1234567"
                            />
                        </div>

                        <div class="form-group full-width">
                            <label for="supplier-contact-email">Email</label>
                            <input 
                                type="email" 
                                id="supplier-contact-email" 
                                name="contact_email" 
                                value="${supplier?.contact_email || ''}"
                                placeholder="Ej: contacto@proveedor.com"
                            />
                        </div>

                        <div class="form-group full-width">
                            <label for="supplier-notes">Notas</label>
                            <textarea 
                                id="supplier-notes" 
                                name="notes" 
                                rows="3"
                                placeholder="Información adicional..."
                            >${supplier?.notes || ''}</textarea>
                        </div>

                        <div class="form-actions full-width">
                            <button type="button" class="btn-secondary" id="cancel-supplier">Cancelar</button>
                            <button type="submit" class="btn-primary">
                                ${isEdit ? 'Actualizar' : 'Crear'} Proveedor
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    /**
     * Renderiza el formulario de nueva compra
     */
    renderPurchaseForm(suppliers, supplies, bcvRate) {
        return `
            <div class="modal-overlay" id="purchase-modal">
                <div class="modal-content modal-large" style="max-width: 900px;">
                    <div class="modal-header">
                        <h3 id="modal-title">📦 Nueva Compra</h3>
                        <button class="btn-close" id="close-purchase-modal">✕</button>
                    </div>
                    <form id="purchase-form">
                        <!-- Información del Proveedor -->
                        <div class="form-section">
                            <h4>Información del Proveedor</h4>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="purchase-supplier">Proveedor *</label>
                                    <select id="purchase-supplier" name="supplier_id" required>
                                        <option value="">Seleccione un proveedor</option>
                                        ${suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label for="purchase-location">Ubicación *</label>
                                    <select id="purchase-location" name="location_id" required disabled>
                                        <option value="">Primero seleccione un proveedor</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Información del Documento -->
                        <div class="form-section">
                            <h4>Información del Documento</h4>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="purchase-doc-type">Tipo de Documento *</label>
                                    <select id="purchase-doc-type" name="document_type" required>
                                        <option value="Factura" selected>📄 Factura (Legal)</option>
                                        <option value="Nota de Entrega">📋 Nota de Entrega (Informal)</option>
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label for="purchase-doc-number">Nº de Documento</label>
                                    <input 
                                        type="text" 
                                        id="purchase-doc-number" 
                                        name="document_number"
                                        placeholder="Ej: 001-00123"
                                    />
                                </div>

                                <div class="form-group">
                                    <label for="purchase-date">Fecha de Compra *</label>
                                    <input 
                                        type="date" 
                                        id="purchase-date" 
                                        name="purchase_date" 
                                        value="${new Date().toISOString().split('T')[0]}"
                                        required
                                    />
                                </div>

                                <div class="form-group">
                                    <label for="purchase-bcv-rate">Tasa BCV (Bs/$) *</label>
                                    <input 
                                        type="number" 
                                        id="purchase-bcv-rate" 
                                        name="bcv_rate" 
                                        step="0.01"
                                        value="${bcvRate}"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <!-- Items de la Compra -->
                        <div class="form-section">
                            <h4>Items de la Compra</h4>
                            
                            <div class="items-controls">
                                <div class="form-grid">
                                    <div class="form-group" style="grid-column: span 2;">
                                        <label for="item-supply">Suministro</label>
                                        <select id="item-supply" style="width: 100%;">
                                            <option value="">Seleccione un suministro</option>
                                            ${supplies.map(s => `
                                                <option value="${s.id}" 
                                                    data-unit="${s.unit}" 
                                                    data-equivalence="${s.equivalence || 0}" 
                                                    data-purchase-unit="${s.purchase_unit || ''}">
                                                    ${s.name} (${s.unit})
                                                </option>
                                            `).join('')}
                                        </select>
                                        <div style="margin-top: 5px;">
                                            <label style="font-size: 0.85rem; cursor: pointer; color: #2563eb; display: none;" id="lbl-use-presentation">
                                                <input type="checkbox" id="item-use-presentation"> 
                                                Comprar por Presentación (<span></span>)
                                            </label>
                                        </div>
                                    </div>

                                    <div class="form-group" style="grid-column: span 2;">
                                        <label for="item-brand">Marca / Descripción</label>
                                        <input 
                                            type="text" 
                                            id="item-brand" 
                                            placeholder="Ej: Robin Hood"
                                        />
                                    </div>

                                    <div class="form-group">
                                        <label for="item-quantity" id="lbl-item-quantity">Cantidad</label>
                                        <input 
                                            type="number" 
                                            id="item-quantity" 
                                            step="0.01"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div class="form-group">
                                        <label for="item-total">Total ($)</label>
                                        <input 
                                            type="number" 
                                            id="item-total" 
                                            step="0.01"
                                            placeholder="0.00" 
                                            style="font-weight: bold; color: #166534;"
                                        />
                                    </div>

                                    <div class="form-group">
                                        <label for="item-total-bs">Total (Bs)</label>
                                        <input 
                                            type="number" 
                                            id="item-total-bs" 
                                            step="0.01"
                                            placeholder="0.00" 
                                            style="color: #ea580c;"
                                        />
                                    </div>

                                    <div class="form-group">
                                        <label for="item-price">Costo Unit. Calc.</label>
                                        <input 
                                            type="number" 
                                            id="item-price" 
                                            step="0.0001"
                                            placeholder="0.00"
                                            readonly
                                            style="background: #f1f5f9; color: #64748b;"
                                        />
                                    </div>

                                    <div class="form-group" style="display: flex; align-items: flex-end;">
                                        <button type="button" class="btn-primary" id="btn-add-item" style="width: 100%;">
                                            ➕ Agregar
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div id="items-table-container">
                                <table class="data-table" id="items-table">
                                    <thead>
                                        <tr>
                                            <th>Suministro</th>
                                            <th>Marca</th>
                                            <th class="text-right">Cantidad</th>
                                            <th class="text-right">Precio Unit.</th>
                                            <th class="text-right">Subtotal</th>
                                            <th class="text-center">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody id="items-tbody">
                                        <tr class="empty-row">
                                            <td colspan="6" class="text-center">
                                                No hay items agregados
                                            </td>
                                        </tr>
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colspan="4" class="text-right"><strong>Total USD:</strong></td>
                                            <td class="text-right"><strong id="total-usd">$0.00</strong></td>
                                            <td></td>
                                        </tr>
                                        <tr>
                                            <td colspan="4" class="text-right"><strong>Total Bs:</strong></td>
                                            <td class="text-right"><strong id="total-bs">Bs 0.00</strong></td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        <!-- Notas -->
                        <div class="form-section">
                            <div class="form-group full-width">
                                <label for="purchase-notes">Notas</label>
                                <textarea 
                                    id="purchase-notes" 
                                    name="notes" 
                                    rows="2"
                                    placeholder="Información adicional sobre la compra..."
                                ></textarea>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn-secondary" id="cancel-purchase">Cancelar</button>
                            <button type="submit" class="btn-primary" id="submit-purchase">
                                💾 Guardar Compra
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    /**
     * Renderiza el modal de gestión de ubicaciones
     */
    renderLocationsModal(supplier, locations) {
        const locationsList = locations.map(loc => `
            <div class="location-item" data-id="${loc.id}">
                <div class="location-info">
                    <strong>${loc.address}</strong>
                    <p>${loc.city}, ${loc.state} ${loc.postal_code || ''}</p>
                    ${loc.is_main ? '<span class="badge badge-primary">Principal</span>' : ''}
                </div>
                <div class="location-actions">
                    <button class="btn-icon" data-action="delete-location" data-id="${loc.id}">🗑️</button>
                </div>
            </div>
        `).join('');

        return `
            <div class="modal-overlay" id="locations-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>📍 Ubicaciones de ${supplier.name}</h3>
                        <button class="btn-close" id="close-locations-modal">✕</button>
                    </div>
                    
                    <div class="locations-list">
                        ${locations.length > 0 ? locationsList : '<p class="text-muted">No hay ubicaciones registradas</p>'}
                    </div>

                    <form id="location-form" class="form-grid">
                        <h4>Nueva Ubicación</h4>
                        
                        <div class="form-group full-width">
                            <label for="location-name">Nombre (Alias) *</label>
                            <input type="text" id="location-name" required placeholder="Ej: Galpón Principal, Sucursal Norte" />
                        </div>

                        <div class="form-group full-width">
                            <label for="location-address">Dirección *</label>
                            <input type="text" id="location-address" required placeholder="Ej: Av. Principal, Edificio X, Local 1" />
                        </div>

                        <div class="form-group">
                            <label for="location-city">Ciudad *</label>
                            <input type="text" id="location-city" required placeholder="Ej: Caracas" />
                        </div>

                        <div class="form-group">
                            <label for="location-state">Estado *</label>
                            <input type="text" id="location-state" required placeholder="Ej: Miranda" />
                        </div>

                        <div class="form-group">
                            <label for="location-postal">Código Postal</label>
                            <input type="text" id="location-postal" placeholder="Ej: 1060" />
                        </div>

                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="location-is-main" />
                                Ubicación Principal
                            </label>
                        </div>

                        <div class="form-actions full-width">
                            <button type="submit" class="btn-primary">➕ Agregar Ubicación</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }
};
