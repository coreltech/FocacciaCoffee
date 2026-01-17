export const SuppliesView = {
    renderLayout(container) {
        container.innerHTML = `
        <div class="main-container fade-in">
            <header style="margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h1 style="font-size: 1.8rem; margin-bottom: 5px;">📦 Módulo de Suministros</h1>
                    <p style="color: #64748b; font-size: 0.95rem;">Gestión profesional de insumos, conversiones y costos dinámicos.</p>
                </div>
                <button id="btn-new-supply" class="btn-primary" style="padding: 12px 20px;">+ Nuevo Suministro</button>
            </header>

            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 25px;" class="supplies-grid">
                <!-- FORMULARIO DE SUMINISTRO -->
                <div id="supply-form-container" class="stat-card" style="height: fit-content; display: none; padding: 25px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px;">
                        <h3 id="form-title" style="margin: 0; font-size: 1.1rem;">Nuevo Suministro</h3>
                        <button id="btn-close-form" style="background:none; border:none; cursor:pointer; font-size:1.3rem; color: #64748b;">✕</button>
                    </div>
                    
                    <input type="hidden" id="supply-id">
                    
                    <div class="input-group">
                        <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 6px;">Nombre del Insumo</label>
                        <input type="text" id="supply-name" class="input-field" placeholder="Ej. Harina 000" 
                            style="width: 100%; box-sizing: border-box; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px;">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 15px;">
                        <div class="input-group">
                            <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 6px;">Marca</label>
                            <input type="text" id="supply-brand" class="input-field" placeholder="Ej. Primor" 
                                style="width: 100%; box-sizing: border-box; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px;">
                        </div>
                        <div class="input-group">
                            <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 6px;">Categoría</label>
                            <select id="supply-category" class="input-field" 
                                style="width: 100%; box-sizing: border-box; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px;">
                                <option value="Secos">Secos</option>
                                <option value="Líquidos">Líquidos</option>
                                <option value="Empaquetados">Empaquetados</option>
                            </select>
                        </div>
                    </div>

                    <hr style="margin: 20px 0; border: 0; border-top: 2px solid #e2e8f0;">
                    <h4 style="margin-bottom: 12px; color: #1e293b; font-size: 1rem;">Presentación de Compra</h4>

                    <div class="input-group">
                        <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 6px;">Nombre de la Presentación (Opcional)</label>
                        <input type="text" id="supply-purchase-unit" class="input-field" placeholder="Ej. Bulto, Caja, Botella" 
                            style="width: 100%; box-sizing: border-box; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px;">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 15px;">
                        <div class="input-group">
                            <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 6px;">Cantidad de Compra</label>
                            <input type="number" id="supply-qty-input" class="input-field" step="0.01" placeholder="Ej. 20, 0.5, 500" 
                                style="width: 100%; box-sizing: border-box; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px;">
                        </div>
                        <div class="input-group">
                            <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 6px;">Unidad</label>
                            <select id="supply-unit-selector" class="input-field" 
                                style="width: 100%; box-sizing: border-box; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px;">
                                <option value="g">Gramos (g)</option>
                                <option value="Kg">Kilogramos (Kg)</option>
                                <option value="ml">Mililitros (ml)</option>
                                <option value="L">Litros (L)</option>
                                <option value="Unidad">Unidad (Unid)</option>
                            </select>
                        </div>
                    </div>

                    <!-- Campos ocultos para la DB -->
                    <input type="hidden" id="supply-equivalence">
                    <input type="hidden" id="supply-min-unit">

                    <div class="input-group" style="margin-top: 15px; background: #fff7ed; padding: 12px; border-radius: 8px; border: 2px solid #ffedd5;">
                        <label style="color: #c2410c; font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 6px;">📦 Existencias Actuales (en Unid. Mínimas)</label>
                        <input type="number" id="supply-stock" class="input-field" step="0.01" placeholder="Ej. 5000 para 5kg" 
                            style="width: 100%; box-sizing: border-box; padding: 10px; border: 2px solid #fed7aa; border-radius: 6px; background: white;">
                        <small style="color: #9a3412; font-size: 0.75rem; display: block; margin-top: 6px;">Carga aquí tu inventario inicial o ajusta las existencias actuales.</small>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 12px; margin-top: 15px;">
                        <div class="input-group">
                            <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 6px;">Moneda de Pago</label>
                            <select id="supply-currency" class="input-field" 
                                style="width: 100%; box-sizing: border-box; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px;">
                                <option value="USD">USD ($)</option>
                                <option value="VES">VES (Bs)</option>
                                <option value="EUR">EUR (€)</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 6px;">Precio Pagado</label>
                            <input type="number" id="supply-last-price" class="input-field" step="0.01" placeholder="0.00" 
                                style="width: 100%; box-sizing: border-box; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px;">
                        </div>
                    </div>

                    <div id="cost-preview" class="stat-card" style="margin-top: 15px; background: #f8fafc; border: 2px dashed #cbd5e1; padding: 12px; text-align: center; border-radius: 8px;">
                        <span id="label-conv-usd" style="font-size: 0.75rem; color: #64748b; display: block; margin-bottom: 5px;">Costo Base (USD): $0.00</span>
                        <div id="calculated-cost" style="font-size: 1.1rem; font-weight: bold; color: #0284c7;">$0.0000 / unid minima</div>
                    </div>

                    <div class="input-group" style="margin-top: 15px;">
                        <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 6px;">Alerta de Stock Mínimo (Unid. Mínimas)</label>
                        <input type="number" id="supply-threshold" class="input-field" placeholder="Ej. 2000 para 2kg" 
                            style="width: 100%; box-sizing: border-box; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px;">
                        <small style="color: #64748b; font-size: 0.75rem; display: block; margin-top: 6px;">El sistema avisará cuando las existencias bajen de este valor.</small>
                    </div>

                    <div style="margin-top: 20px;">
                        <button id="btn-save-supply" class="btn-primary" 
                            style="width: 100%; padding: 14px; font-weight: bold; border-radius: 8px; border: none; background: #2563eb; color: white; cursor: pointer;">
                            Guardar Insumo
                        </button>
                    </div>
                </div>

                <!-- LISTADO DE SUMINISTROS -->
                <div class="stat-card" style="padding: 25px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                        <h3 style="margin: 0; font-size: 1.1rem;">Suministros Registrados</h3>
                        <input type="text" id="search-supply" placeholder="🔎 Buscar..." class="input-field" 
                            style="width: 250px; padding: 10px; box-sizing: border-box; border: 2px solid #e2e8f0; border-radius: 6px;">
                    </div>
                    
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Insumo</th>
                                    <th>Categoría</th>
                                    <th>Existencias</th>
                                    <th>Costo / Unid. Mín.</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="supply-table-body">
                                <tr><td colspan="5" style="text-align: center;">Cargando suministros...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <style>
            .supplies-grid {
                grid-template-columns: 1fr 2fr;
            }
            
            @media (max-width: 1024px) {
                .supplies-grid {
                    grid-template-columns: 1fr !important;
                }
            }
            
            #btn-save-supply:hover {
                background: #1d4ed8 !important;
            }
            
            .input-field:focus {
                outline: none;
                border-color: #2563eb !important;
                box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
            }
        </style>
        `;
    },

    renderTable(supplies, onEdit, onDelete) {
        const tbody = document.getElementById('supply-table-body');
        if (!tbody) return;

        if (supplies.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No hay suministros registrados.</td></tr>';
            return;
        }

        tbody.innerHTML = supplies.map(s => {
            const costPerMin = s.equivalence > 0 ? (s.last_purchase_price / s.equivalence).toFixed(4) : "0.0000";
            // stock_min_units is the live column updated by production/consumption
            const stock = parseFloat(s.stock_min_units || 0);
            const threshold = parseFloat(s.min_stock_threshold || 1000);
            const isCritical = stock <= threshold;
            const isEmpty = stock <= 0;

            const stockColor = isEmpty ? '#ef4444' : (isCritical ? '#f59e0b' : '#10b981');
            const stockLabel = isEmpty ? 'SIN STOCK' : (isCritical ? 'CRÍTICO' : 'OK');

            return `
            <tr>
                <td>
                    <div style="font-weight: bold;">${s.name}</div>
                    <div style="font-size: 0.75rem; color: #64748b;">${s.brand || 'Sin marca'}</div>
                </td>
                <td><span class="badge ${s.category?.toLowerCase() || ''}">${s.category || 'N/A'}</span></td>
                <td>
                    <div style="font-weight: 800; color: ${stockColor}; font-size: 1.1rem;">
                        ${stock.toFixed(1)} <small style="font-size: 0.7rem; color: #64748b;">${s.min_unit}</small>
                    </div>
                    <div style="font-size: 0.65rem; color: #94a3b8; font-weight: bold;">
                        ESTADO: <span style="color: ${stockColor};">${stockLabel}</span>
                    </div>
                    <div style="font-size: 0.6rem; color: #94a3b8;">Umbral: ${threshold}</div>
                </td>
                <td>
                    <div style="font-weight: bold;">$${costPerMin}</div>
                    <div style="font-size: 0.7rem; color: #64748b;">(1 ${s.purchase_unit} = ${s.equivalence}${s.min_unit})</div>
                </td>
                <td>
                    <button class="btn-edit-supply" data-id="${s.id}" style="background:none; border:none; cursor:pointer;">✏️</button>
                    <button class="btn-del-supply" data-id="${s.id}" style="background:none; border:none; cursor:pointer; color:#ef4444;">🗑️</button>
                </td>
            </tr>
        `}).join('');

        tbody.querySelectorAll('.btn-edit-supply').forEach(btn => {
            btn.onclick = () => onEdit(btn.dataset.id);
        });

        tbody.querySelectorAll('.btn-del-supply').forEach(btn => {
            btn.onclick = () => onDelete(btn.dataset.id);
        });
    },

    showForm(show = true) {
        const form = document.getElementById('supply-form-container');
        if (form) form.style.display = show ? 'block' : 'none';
        if (show) {
            document.getElementById('supply-name').focus();
        }
    },

    fillForm(s) {
        this.showForm(true);
        document.getElementById('supply-id').value = s.id;
        document.getElementById('supply-name').value = s.name;
        document.getElementById('supply-brand').value = s.brand || "";
        document.getElementById('supply-category').value = s.category || "Secos";
        document.getElementById('supply-purchase-unit').value = s.purchase_unit || "";

        // Reverse conversion for the UI
        let qty = s.equivalence;
        let unit = s.min_unit;

        if (s.min_unit === 'g' && s.equivalence >= 1000 && (s.equivalence % 1000 === 0)) {
            qty = s.equivalence / 1000;
            unit = 'Kg';
        } else if (s.min_unit === 'ml' && s.equivalence >= 1000 && (s.equivalence % 1000 === 0)) {
            qty = s.equivalence / 1000;
            unit = 'L';
        } else if (s.min_unit === 'Unid') {
            unit = 'Unidad';
        }

        document.getElementById('supply-qty-input').value = qty;
        document.getElementById('supply-unit-selector').value = unit;
        document.getElementById('supply-currency').value = "USD"; // Saved value is USD
        document.getElementById('supply-last-price').value = s.last_purchase_price;
        document.getElementById('supply-threshold').value = s.min_stock_threshold || 1000;
        document.getElementById('supply-stock').value = s.stock_min_units || 0;

        document.getElementById('form-title').innerText = "Editar Suministro";
        document.getElementById('btn-save-supply').innerText = "Actualizar Suministro";
        this.updateCostPreview();
    },

    resetForm() {
        document.getElementById('supply-id').value = "";
        document.getElementById('supply-name').value = "";
        document.getElementById('supply-brand').value = "";
        document.getElementById('supply-category').value = "Secos";
        document.getElementById('supply-purchase-unit').value = "";
        document.getElementById('supply-qty-input').value = "";
        document.getElementById('supply-unit-selector').value = "g";
        document.getElementById('supply-currency').value = "USD";
        document.getElementById('supply-last-price').value = "";
        document.getElementById('supply-threshold').value = "1000";
        document.getElementById('supply-stock').value = "";

        document.getElementById('form-title').innerText = "Nuevo Suministro";
        document.getElementById('btn-save-supply').innerText = "Guardar Suministro";
        document.getElementById('calculated-cost').innerText = "$0.0000";
        if (document.getElementById('label-conv-usd')) {
            document.getElementById('label-conv-usd').innerText = "Costo Base (USD): $0.00";
        }
    },

    updateCostPreview(rates = null) {
        const inputPrice = parseFloat(document.getElementById('supply-last-price').value) || 0;
        const currency = document.getElementById('supply-currency').value;
        const inputQty = parseFloat(document.getElementById('supply-qty-input').value) || 0;
        const unit = document.getElementById('supply-unit-selector').value;

        let priceInUsd = inputPrice;
        if (rates && currency !== 'USD') {
            if (currency === 'VES') {
                // Direct conversion BS to USD
                priceInUsd = inputPrice / rates.tasa_usd_ves;
            } else if (currency === 'EUR') {
                // Direct conversion EUR -> BS then BS -> USD (Cross Rate)
                // Lógica: (Monto en EUR * Tasa EUR) / Tasa USD
                priceInUsd = (inputPrice * rates.tasa_eur_ves) / rates.tasa_usd_ves;
            }
        }

        let equivalence = inputQty;
        // Map 'Unidad' UI value to 'Unid' DB value
        let minUnit = unit === 'Kg' ? 'g' : (unit === 'L' ? 'ml' : (unit === 'Unidad' ? 'Unid' : unit));

        if (unit === 'Kg' || unit === 'L') {
            equivalence = inputQty * 1000;
        }

        const labelUsd = document.getElementById('label-conv-usd');
        if (labelUsd) {
            labelUsd.innerText = `Costo Base (USD): $${priceInUsd.toFixed(2)}`;
        }

        if (equivalence > 0) {
            const cost = priceInUsd / equivalence;
            document.getElementById('calculated-cost').innerText = `$${cost.toFixed(4)} / ${minUnit}`;
            // Store results in hidden fields for the controller to pick up easily
            document.getElementById('supply-equivalence').value = equivalence;
            document.getElementById('supply-min-unit').value = minUnit;
            // The controller will use priceInUsd for saving
            return priceInUsd;
        } else {
            document.getElementById('calculated-cost').innerText = "$0.0000";
            document.getElementById('supply-equivalence').value = 0;
            return 0;
        }
    }
};
