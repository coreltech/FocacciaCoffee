export const AssemblyModernView = {
    renderLayout(container, products) {
        container.innerHTML = `
        <div class="main-container fade-in">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <div>
                    <h1>⚙️ Configuración de Ensamblaje</h1>
                    <p style="color: #64748b;">Vincula productos terminados con sus recetas y empaques.</p>
                </div>
                <div id="margin-dashboard" class="stat-card" style="margin: 0; padding: 10px 20px; background: #f8fafc; display: none;">
                    <div style="display: flex; gap: 30px; align-items: center;">
                        <div style="text-align: center;">
                            <div style="font-size: 0.75rem; color: #64748b;">Costo Unit.</div>
                            <div id="dash-cost" style="font-weight: bold; font-size: 1.1rem;">$0.00</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 0.75rem; color: #64748b;">Venta PT</div>
                            <div id="dash-sale" style="font-weight: bold; font-size: 1.1rem; color: #16a34a;">$0.00</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 0.75rem; color: #64748b;">Margen %</div>
                            <div id="dash-margin-pct" style="font-weight: bold; font-size: 1.1rem; color: #be185d;">0%</div>
                        </div>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 320px 1fr; gap: 25px;">
                <!-- Sidebar: Products -->
                <div class="stat-card" style="height: fit-content; padding: 15px;">
                    <h3 style="margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Productos PT</h3>
                    <div style="max-height: 550px; overflow-y: auto;">
                        <div id="product-list" style="display: flex; flex-direction: column; gap: 10px;">
                            ${products.map(p => `
                                <div class="product-card clickable" data-id="${p.id}" style="padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                                    <div style="font-weight: bold;">${p.product_name}</div>
                                    <div style="font-size: 0.75rem; color: #64748b;">Venta: $${parseFloat(p.precio_venta_final).toFixed(2)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Main: Composition Workspace -->
                <div id="workspace" style="display: none;">
                    <div class="stat-card" style="padding: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h2 id="current-p-name">Nombre del Producto</h2>
                            <button id="btn-save-assembly" class="btn-primary" style="padding: 10px 25px;">Guardar Cambios</button>
                        </div>

                        <!-- Component Selector with Filters -->
                        <div style="background: #f1f5f9; padding: 15px; border-radius: 12px; margin-bottom: 25px;">
                            <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                                <button class="filter-btn active" data-type="ALL">Todos</button>
                                <button class="filter-btn" data-type="PANADERA">Recetas Panaderas</button>
                                <button class="filter-btn" data-type="TRADICIONAL">Recetas Fijas</button>
                                <button class="filter-btn" data-type="EMPAQUE">Insumos de Empaque</button>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 12px; align-items: end;">
                                <div class="input-group">
                                    <label>Componente a Vincular</label>
                                    <select id="comp-selector" class="input-field">
                                        <option value="">-- Seleccionar --</option>
                                    </select>
                                </div>
                                <div class="input-group">
                                    <label>Cantidad (g/unid)</label>
                                    <input type="number" id="comp-qty" class="input-field" placeholder="0">
                                </div>
                                <div class="input-group">
                                    <label>Costo Estimado</label>
                                    <input type="text" id="comp-cost-preview" class="input-field" disabled placeholder="$0.00">
                                </div>
                                <button id="btn-add-comp" class="btn-primary" style="height: 38px;">Añadir</button>
                            </div>
                        </div>

                        <!-- Current Composition Table -->
                        <div class="table-responsive">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Componente</th>
                                        <th>Tipo</th>
                                        <th>Cant. p/ Unidad</th>
                                        <th>Costo ($)</th>
                                        <th>Subtotal ($)</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="assembly-table-body">
                                    <!-- Items load here -->
                                </tbody>
                                <tfoot>
                                    <tr style="background: #f8fafc; font-weight: bold;">
                                        <td colspan="4" style="text-align: right;">COSTO TOTAL PT</td>
                                        <td id="assembly-total-cost">$0.00</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Initial State Message -->
                <div id="empty-state" class="stat-card" style="display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; height: 300px;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">👈</div>
                    <h3>Selecciona un producto del catálogo</h3>
                    <p>Configura los componentes de costo y stock para tus productos terminados.</p>
                </div>
            </div>
        </div>
        `;
    },

    populateSelector(container, items, typeFilter) {
        const selector = document.getElementById('comp-selector');
        let filtered = items;
        if (typeFilter !== 'ALL') {
            filtered = items.filter(it => it.category === typeFilter);
        }

        if (filtered.length === 0 && typeFilter !== 'ALL') {
            console.warn(`🔍 Búsqueda de [${typeFilter}] resultó vacía en el selector.`);
        }

        selector.innerHTML = '<option value="">-- Seleccionar --</option>' +
            filtered.map(it => `
                <option value="${it.value}" data-cost="${it.cost}" data-unit="${it.unit}">${it.name}</option>
            `).join('');
    },

    renderTable(items, salePrice, onDelete, onUpdateQty) {
        const tbody = document.getElementById('assembly-table-body');
        let totalCost = 0;

        tbody.innerHTML = items.map((it, idx) => {
            const subtotal = it.quantity * it.costPerUnit;
            const hasIncompleteCost = it.recipe_id && (it.costPerUnit === 0 || !it.costPerUnit);
            totalCost += subtotal;

            return `
                <tr style="${hasIncompleteCost ? 'background: #fff1f2;' : ''}">
                    <td>
                        <div style="font-weight:bold;">${it.name}</div>
                        ${hasIncompleteCost ? '<div style="font-size: 0.7rem; color: #e11d48; font-weight: bold;">⚠️ Costo de receta incompleto</div>' : ''}
                    </td>
                    <td><span class="badge ${it.type === 'PANADERA' ? 'info' : it.type === 'EMPAQUE' ? 'warning' : 'success'}">${it.type}</span></td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <input type="number" class="input-field qty-input" data-idx="${idx}" value="${it.quantity}" style="width: 80px; padding: 4px 8px; margin:0;">
                            <span style="font-size: 0.8rem; color: #64748b;">${it.unit}</span>
                        </div>
                    </td>
                    <td>$${it.costPerUnit.toFixed(4)}</td>
                    <td>$${subtotal.toFixed(4)}</td>
                    <td>
                        <button class="btn-del-asm" data-idx="${idx}" style="background:none; border:none; cursor:pointer; color:#ef4444;">✕</button>
                    </td>
                </tr>
            `;
        }).join('');

        document.getElementById('assembly-total-cost').innerText = `$${totalCost.toFixed(2)}`;

        // Update Margin Dashboard
        const dash = document.getElementById('margin-dashboard');
        dash.style.display = 'block';
        document.getElementById('dash-cost').innerText = `$${totalCost.toFixed(2)}`;
        document.getElementById('dash-sale').innerText = `$${salePrice.toFixed(2)}`;

        const margin = salePrice - totalCost;
        const marginPct = salePrice > 0 ? (margin / salePrice) * 100 : 0;
        const marginEl = document.getElementById('dash-margin-pct');
        marginEl.innerText = `${marginPct.toFixed(1)}%`;
        marginEl.style.color = marginPct < 30 ? '#ef4444' : '#16a34a';

        // Event for reactivity
        tbody.querySelectorAll('.qty-input').forEach(input => {
            input.oninput = () => onUpdateQty(parseInt(input.dataset.idx), parseFloat(input.value) || 0);
        });

        tbody.querySelectorAll('.btn-del-asm').forEach(btn => btn.onclick = () => onDelete(btn.dataset.idx));
    },

    renderEmptyCatalog(container) {
        container.innerHTML = `
        <div class="main-container fade-in">
            <div class="stat-card" style="text-align: center; padding: 60px;">
                <div style="font-size: 4rem; margin-bottom: 20px;">📋</div>
                <h2>Tu Catálogo está vacío</h2>
                <p style="color: #64748b; margin-bottom: 25px;">Primero debes crear productos en el Catálogo para poder configurar su ensamblaje.</p>
                <button onclick="document.querySelector('[data-tab=\'catalogo\']').click()" class="btn-primary">Go to Catalog</button>
            </div>
        </div>
        `;
    }
};

window.AssemblyModernView = AssemblyModernView;
