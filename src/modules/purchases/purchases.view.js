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
                <div class="purchase-modal-content" style="max-width: 600px;">
                    <div class="purchase-header-bar">
                        <h3>${isEdit ? '✏️ Editar Proveedor' : '👤 Nuevo Proveedor'}</h3>
                        <button class="btn-close" id="close-supplier-modal" style="color:white;">✕</button>
                    </div>
                    
                    <form id="supplier-form" class="purchase-body">
                        
                        <div class="purchase-section">
                            <h4 class="purchase-section-title">Información Básica</h4>
                            <div style="display:grid; grid-template-columns: 1fr; gap:15px;">
                                <div class="form-control-group">
                                    <label class="form-label">Nombre del Proveedor *</label>
                                    <input type="text" id="supplier-name" name="name" class="form-input-sm" 
                                           required value="${supplier?.name || ''}" placeholder="Ej: Distribuidora La Esperanza" />
                                </div>

                                <div class="form-control-group">
                                    <label class="form-label">RIF / Cédula *</label>
                                    <input type="text" id="supplier-tax-id" name="tax_id" class="form-input-sm" 
                                           required value="${supplier?.tax_id || ''}" placeholder="Ej: J-12345678-9" />
                                </div>
                            </div>
                        </div>

                        <div class="purchase-section">
                            <h4 class="purchase-section-title">Datos de Contacto</h4>
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                                <div class="form-control-group">
                                    <label class="form-label">Nombre de Contacto</label>
                                    <input type="text" id="supplier-contact-name" name="contact_name" class="form-input-sm" 
                                           value="${supplier?.contact_name || ''}" placeholder="Ej: Juan Pérez" />
                                </div>

                                <div class="form-control-group">
                                    <label class="form-label">Teléfono</label>
                                    <input type="tel" id="supplier-contact-phone" name="contact_phone" class="form-input-sm" 
                                           value="${supplier?.contact_phone || ''}" placeholder="Ej: 0414-1234567" />
                                </div>

                                <div class="form-control-group" style="grid-column: span 2;">
                                    <label class="form-label">Email</label>
                                    <input type="email" id="supplier-contact-email" name="contact_email" class="form-input-sm" 
                                           value="${supplier?.contact_email || ''}" placeholder="Ej: contacto@proveedor.com" />
                                </div>
                            </div>
                        </div>

                        <div class="purchase-section">
                            <div class="form-control-group">
                                <label class="form-label">Notas</label>
                                <textarea id="supplier-notes" name="notes" rows="3" class="form-input-sm" 
                                          placeholder="Información adicional...">${supplier?.notes || ''}</textarea>
                            </div>
                        </div>

                        <div style="margin-top:20px; text-align:right; border-top:1px solid var(--border); padding-top:20px;">
                            <button type="button" class="btn-secondary" id="cancel-supplier" style="margin-right:10px;">Cancelar</button>
                            <button type="submit" class="btn-primary">
                                ${isEdit ? '💾 Actualizar' : '💾 Guardar'} Proveedor
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    /**
     * Renderiza el formulario de nueva compra con Diseño Profesional
     */
    renderPurchaseForm(suppliers, supplies, bcvRate) {
        return `
            <div class="modal-overlay" id="purchase-modal" style="display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.4); backdrop-filter:blur(2px);">
                <div class="purchase-modal-content">
                    <div class="purchase-header-bar">
                        <h3>📦 Nueva Compra</h3>
                        <button class="btn-close" id="close-purchase-modal" title="Cerrar">✕</button>
                    </div>
                    
                    <form id="purchase-form" class="purchase-body">
                        
                        <!-- HEADER: DATOS GENERALES -->
                        <div class="purchase-section">
                            <h4 class="purchase-section-title">📄 Datos del Documento</h4>
                            <div class="grid-header">
                                <div class="form-control-group">
                                    <label class="form-label">Proveedor</label>
                                    <select id="purchase-supplier" name="supplier_id" class="form-input-sm" required>
                                        <option value="">Seleccione...</option>
                                        ${suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                                    </select>
                                    <button type="button" id="btn-load-last-purchase" style="display:none; margin-top:5px; font-size:0.75rem; padding:4px 8px; border:1px solid #cbd5e1; background:#f8fafc; border-radius:4px; cursor:pointer; color:#475569;">
                                        🔄 Cargar items anteriores
                                    </button>
                                </div>

                                <div class="form-control-group">
                                    <label class="form-label">Ubicación de Recepción</label>
                                    <select id="purchase-location" name="location_id" class="form-input-sm" required disabled>
                                        <option value="">Seleccione proveedor...</option>
                                    </select>
                                </div>

                                <div class="form-control-group">
                                    <label class="form-label">Fecha de Emisión</label>
                                    <input type="date" id="purchase-date" name="purchase_date" class="form-input-sm" 
                                           value="${new Date().toISOString().split('T')[0]}" required />
                                </div>

                                <div class="form-control-group">
                                    <label class="form-label">Nº Documento</label>
                                    <div style="display:flex; gap:5px;">
                                        <select id="purchase-doc-type" name="document_type" class="form-input-sm" style="width:80px;">
                                            <option value="Factura">Fact</option>
                                            <option value="Nota de Entrega">NE</option>
                                        </select>
                                        <input type="text" id="purchase-doc-number" name="document_number" class="form-input-sm" placeholder="CONTROL-001" style="flex:1;" />
                                    </div>
                                </div>
                            </div>
                            <div style="margin-top:15px; display:flex; align-items:center; gap:10px;">
                                <label class="form-label">Tasa BCV:</label>
                                <input type="number" id="purchase-bcv-rate" name="bcv_rate" class="form-input-sm input-currency" step="0.01" value="${bcvRate}" style="width:120px; font-weight:bold; color:var(--olive);" required />
                                <span style="font-size:0.8rem; color:#64748b;">Bs/USD</span>
                            </div>
                        </div>

                        <!-- BODY: ITEMS -->
                        <div class="purchase-section">
                            <h4 class="purchase-section-title">🛒 Detalle de Productos</h4>
                            
                            <!-- Input Container Highlighted -->
                            <div class="add-item-container">
                                <div class="grid-items-input">
                                    <div class="form-control-group">
                                        <label class="form-label">Producto / Insumo</label>
                                        <select id="item-supply" class="form-input-sm">
                                            <option value="">Seleccione...</option>
                                            ${supplies.map(s => `
                                                <option value="${s.id}" 
                                                    data-unit="${s.unit}" 
                                                    data-equivalence="${s.equivalence || 0}" 
                                                    data-purchase-unit="${s.purchase_unit || ''}">
                                                    ${s.name} (${s.unit})
                                                </option>
                                            `).join('')}
                                        </select>
                                        <label style="font-size: 0.75rem; cursor: pointer; color: #2563eb; display: none; margin-top:4px;" id="lbl-use-presentation">
                                            <input type="checkbox" id="item-use-presentation"> 
                                            <span style="margin-left:4px;">Usar Presentación</span>
                                        </label>
                                    </div>

                                    <div class="form-control-group">
                                        <label class="form-label">Marca / Detalle</label>
                                        <input type="text" id="item-brand" class="form-input-sm" placeholder="Ej: Primor" />
                                    </div>

                                    <div class="form-control-group">
                                        <label class="form-label" id="lbl-item-quantity">Cant.</label>
                                        <input type="number" id="item-quantity" step="0.01" class="form-input-sm text-right" placeholder="0.00" />
                                    </div>

                                    <div class="form-control-group">
                                        <label class="form-label">Total USD ($)</label>
                                        <input type="number" id="item-total" step="0.01" class="form-input-sm input-currency input-total-usd" placeholder="0.00" />
                                    </div>

                                    <div class="form-control-group">
                                        <label class="form-label">Total Bs</label>
                                        <input type="number" id="item-total-bs" step="0.01" class="form-input-sm input-currency input-total-bs" placeholder="0.00" />
                                    </div>

                                    <button type="button" id="btn-add-item" class="btn-add-item" title="Agregar a la lista (Enter)">
                                        ➕ Agregar
                                    </button>
                                    
                                    <!-- Hidden Unit Price Calc -->
                                    <input type="hidden" id="item-price" />
                                </div>
                            </div>

                            <!-- Table -->
                            <div class="purchase-table-container">
                                <table class="purchase-table">
                                    <thead>
                                        <tr>
                                            <th style="width:30%;">Descripción</th>
                                            <th style="width:20%;">Marca</th>
                                            <th class="text-right" style="width:10%;">Cant.</th>
                                            <th class="text-right" style="width:15%;">Precio Unit.</th>
                                            <th class="text-right" style="width:15%;">Total ($)</th>
                                            <th class="text-center" style="width:10%;">...</th>
                                        </tr>
                                    </thead>
                                    <tbody id="items-tbody">
                                        <tr class="empty-row">
                                            <td colspan="6" style="text-align:center; padding:30px; color:#94a3b8; background:#f8fafc;">
                                                <div style="font-size:2rem; margin-bottom:10px;">📋</div>
                                                Agregue items a la lista
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- FOOTER: TOTALES & ACCIONES -->
                        <div class="purchase-footer">
                            <div style="flex:1;">
                                <label class="form-label">📝 Notas / Observaciones</label>
                                <textarea id="purchase-notes" name="notes" rows="3" class="form-input-sm" style="width:100%; margin-top:5px;" placeholder="Comentarios adicionales..."></textarea>
                            </div>

                            <div class="totals-box">
                                <div class="total-row">
                                    <span>Subtotal:</span>
                                    <span id="preview-subtotal">$0.00</span>
                                </div>
                                <div class="total-row grand-total">
                                    <span>TOTAL USD:</span>
                                    <span id="total-usd">$0.00</span>
                                </div>
                                <div class="total-bs-display" id="total-bs">
                                    Bs 0.00
                                </div>
                            </div>
                        </div>

                        <div style="margin-top:25px; text-align:right; border-top:1px solid #e2e8f0; padding-top:20px; display:flex; justify-content:flex-end; gap:15px;">
                            <button type="button" class="btn-secondary" id="cancel-purchase">Cancelar</button>
                            <button type="submit" class="btn-primary" id="submit-purchase" style="min-width:180px; font-size:1.05rem;">
                                💾 Procesar Compra
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
