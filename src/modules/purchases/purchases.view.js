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
     * Renderiza el formulario de nueva compra con Diseño Radical (Fase 2)
     */
    renderPurchaseForm(suppliers, supplies, bcvRate) {
        return `
            <div class="modal-overlay purchase-modal-backdrop" id="purchase-modal" style="display:flex; align-items:center; justify-content:center;">
                <div class="purchase-modal-content">
                    
                    <!-- Header con Gradiente y Patrón -->
                    <div class="purchase-header-bar">
                        <h3 id="modal-title">📦 Nueva Compra</h3>
                        <button class="btn-close" id="close-purchase-modal" title="Cerrar">✕</button>
                    </div>
                    
                    <form id="purchase-form" class="purchase-body">
                        
                        <!-- SECCIÓN 1: DATOS (Card) -->
                        <div class="purchase-section">
                            <h4 class="purchase-section-title">📄 Datos del Documento</h4>
                            <div class="grid-header">
                                <div class="modern-input-group">
                                    <label class="modern-label">Proveedor</label>
                                    <select id="purchase-supplier" name="supplier_id" class="modern-input" required>
                                        <option value="">Seleccione...</option>
                                        ${suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                                    </select>
                                    <button type="button" id="btn-load-last-purchase" style="display:none; margin-top:5px; font-size:0.75rem; border:none; background:transparent; color:#2563eb; cursor:pointer; text-align:left; padding-left:0;">
                                        🔄 Cargar items anteriores
                                    </button>
                                </div>

                                <div class="modern-input-group">
                                    <label class="modern-label">Ubicación</label>
                                    <select id="purchase-location" name="location_id" class="modern-input" required disabled>
                                        <option value="">Seleccione proveedor...</option>
                                    </select>
                                </div>

                                <div class="modern-input-group">
                                    <label class="modern-label">Fecha</label>
                                    <input type="date" id="purchase-date" name="purchase_date" class="modern-input" 
                                           value="${new Date().toLocaleDateString('en-CA')}" required />
                                </div>

                                <div class="modern-input-group">
                                    <label class="modern-label">Documento</label>
                                    <div style="display:flex; gap:8px;">
                                        <select id="purchase-doc-type" name="document_type" class="modern-input" style="width:90px;">
                                            <option value="Factura">Fact</option>
                                            <option value="Nota de Entrega">NE</option>
                                        </select>
                                        <input type="text" id="purchase-doc-number" name="document_number" class="modern-input" placeholder="000-000" style="flex:1;" />
                                    </div>
                                </div>
                            </div>
                            <!-- Tasa BCV flotante o integrada -->
                            <div style="margin-top:15px; display:flex; align-items:center; gap:10px; background:#f0fdf4; padding:8px 15px; border-radius:8px; width:fit-content; border:1px solid #bbf7d0;">
                                <span style="font-size:1.2rem;">💵</span>
                                <label class="modern-label" style="margin:0;">Tasa BCV:</label>
                                <input type="number" id="purchase-bcv-rate" name="bcv_rate" class="modern-input input-currency" step="0.01" value="${bcvRate}" style="width:100px; padding:5px 10px; border:none; background:transparent; font-size:1.1rem; color:#166534;" required />
                                <span style="font-size:0.8rem; color:#166534; font-weight:600;">Bs/USD</span>
                            </div>
                        </div>

                        <!-- SECCIÓN 2: ITEMS (Floating Panel + Cards) -->
                        <div style="position:relative;">
                            
                            <!-- FLOATING ADD PANEL -->
                            <div class="add-item-panel">
                                <div class="grid-inputs-modern">
                                    <div class="modern-input-group">
                                        <label class="modern-label">Producto</label>
                                        <select id="item-supply" class="modern-input">
                                            <option value="">Buscar producto...</option>
                                            ${supplies.map(s => `
                                                <option value="${s.id}" 
                                                    data-unit="${s.unit}" 
                                                    data-equivalence="${s.equivalence || 0}" 
                                                    data-purchase-unit="${s.purchase_unit || ''}">
                                                    ${s.name} (${s.unit})
                                                </option>
                                            `).join('')}
                                        </select>
                                        <label style="font-size: 0.75rem; cursor: pointer; color: var(--olive); display: none; margin-top:4px;" id="lbl-use-presentation">
                                            <input type="checkbox" id="item-use-presentation"> 
                                            <span style="margin-left:4px; font-weight:600;">Usar Presentación</span>
                                        </label>
                                    </div>

                                    <div class="modern-input-group">
                                        <label class="modern-label">Marca</label>
                                        <input type="text" id="item-brand" class="modern-input" placeholder="Opcional" />
                                    </div>

                                    <div class="modern-input-group">
                                        <label class="modern-label" id="lbl-item-quantity">Cant.</label>
                                        <input type="number" id="item-quantity" step="0.01" class="modern-input input-currency" placeholder="0" />
                                    </div>

                                    <div class="modern-input-group">
                                        <label class="modern-label">Total $</label>
                                        <input type="number" id="item-total" step="0.01" class="modern-input input-currency" placeholder="0.00" style="color:#15803d;" />
                                    </div>

                                    <div class="modern-input-group">
                                        <label class="modern-label">Total Bs</label>
                                        <input type="number" id="item-total-bs" step="0.01" class="modern-input input-currency" placeholder="0.00" style="color:#ea580c;" />
                                    </div>

                                    <!-- FAB Button -->
                                    <button type="button" id="btn-add-item" class="btn-fab-add" title="Agregar (Enter)">
                                        ＋
                                    </button>
                                    
                                    <input type="hidden" id="item-price" />
                                </div>
                            </div>

                            <!-- ITEMS GRID (Cards) -->
                            <h4 class="purchase-section-title" style="margin-bottom:10px;">
                                🛒 Carrito de Compras 
                                <span id="items-count-badge" class="badge badge-info" style="margin-left:10px; display:none;">0 items</span>
                            </h4>
                            
                            <div id="items-card-container" class="items-card-grid">
                                <!-- Empty State -->
                                <div id="empty-cart-state" style="grid-column: 1 / -1; text-align:center; padding:40px; color:#94a3b8; border: 2px dashed #e2e8f0; border-radius:16px;">
                                    <div style="font-size:3rem; margin-bottom:10px; opacity:0.5;">🛍️</div>
                                    <p>El carrito está vacío</p>
                                    <small>Agrega productos usando el panel superior</small>
                                </div>
                            </div>

                        </div>

                        <!-- FOOTER MODERN -->
                        <div class="purchase-footer-modern">
                            <div style="flex:1; max-width:400px;">
                                <div class="modern-input-group">
                                    <label class="modern-label">Notas</label>
                                    <textarea id="purchase-notes" name="notes" rows="2" class="modern-input" placeholder="Observaciones..."></textarea>
                                </div>
                            </div>

                            <div class="totals-modern">
                                <div class="total-label">Total a Pagar</div>
                                <div class="grand-total-display" id="total-usd">$0.00</div>
                                <div style="color:#64748b; font-size:1.1rem; font-weight:500;" id="total-bs">Bs 0.00</div>
                            </div>
                        </div>

                        <!-- ACTIONS -->
                        <div style="margin-top:30px; display:flex; justify-content:flex-end; gap:20px;">
                            <button type="button" class="btn-ghost" id="cancel-purchase">Cancelar</button>
                            <button type="submit" class="btn-giant-primary" id="submit-purchase">
                                ✅ Procesar Compra
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        `;
    },

    /**
     * Renderiza la lista de items como tarjetas (Fase 2 - Radical)
     */
    renderPurchaseItemsCards(items) {
        if (!items || items.length === 0) {
            return `
                <div id="empty-cart-state" style="grid-column: 1 / -1; text-align:center; padding:40px; color:#94a3b8; border: 2px dashed #e2e8f0; border-radius:16px;">
                    <div style="font-size:3rem; margin-bottom:10px; opacity:0.5; animation: float 3s ease-in-out infinite;">🛍️</div>
                    <p style="font-weight:600; color:#64748b;">El carrito está vacío</p>
                    <small style="color:#94a3b8;">Agrega productos usando el panel superior</small>
                </div>
            `;
        }

        return items.map((item, index) => `
            <div class="item-card" style="animation: slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s both;">
                <button type="button" class="btn-remove-card" onclick="window.removePurchaseItem(${index})" title="Eliminar">✕</button>
                
                <div class="item-card-header">
                    <div style="flex:1; padding-right:10px;">
                        <div class="item-name">${item.supply_name}</div>
                        <div class="item-brand">${item.brand_description || 'Sin marca'}</div>
                    </div>
                    <div class="item-total-badge">
                        $${parseFloat(item.subtotal).toFixed(2)}
                    </div>
                </div>

                <div class="item-meta">
                    <div class="item-row-detail">
                        <span>Cant:</span>
                        <strong style="color:#334155;">${parseFloat(item.quantity).toFixed(2)} ${item.supply_unit}</strong>
                    </div>
                    <div class="item-row-detail">
                        <span>P. Unit:</span>
                        <span>$${parseFloat(item.unit_price_usd).toFixed(4)}</span>
                    </div>
                </div>
            </div>
        `).join('');
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
