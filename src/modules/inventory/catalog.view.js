export const CatalogView = {
    renderLayout(container, rates, products, recentLogs) {
        container.innerHTML = `
        <div class="main-container">
            <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
                <div>
                    <h1 style="font-size: 1.8rem; margin:0;">📋 Catálogo de Productos</h1>
                    <p style="color: #64748b;">Gestión de precios, fotos y stock disponible.</p>
                </div>
                <div style="text-align:right; display:flex; gap:10px; align-items:center;">
                    <div id="low-stock-summary" style="display:none; background:#fff1f2; color:#991b1b; padding:8px 12px; border-radius:10px; border:1px solid #fecaca; font-size:0.75rem; font-weight:800;">
                        ⚠️ <span id="low-stock-count">0</span> PRODUCTOS POR AGOTAR
                    </div>
                    <div style="text-align:right; font-size:0.8rem; background:#f8fafc; padding:10px; border-radius:10px; border:1px solid #e2e8f0;">
                        <b>BCV:</b> $1 = ${rates.tasa_usd_ves} | €1 = ${rates.tasa_eur_ves}
                    </div>
                    <button onclick="CatalogView.toggleForm()" class="btn-primary" style="background:#2563eb; padding:12px 20px;">+ Nuevo Producto</button>
                </div>
            </header>

            <div style="display:grid; grid-template-columns: 1fr; gap:25px;">
                <div id="catalog-form-container" class="stat-card" style="padding:20px; display:none; border-left: 5px solid #2563eb;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:2px solid #f1f5f9; padding-bottom:10px;">
                        <h3 id="form-title" style="margin:0;">Añadir Nuevo Producto</h3>
                        <button onclick="CatalogView.toggleForm()" style="background:none; border:none; color:#64748b; cursor:pointer; font-size:1.2rem;">✕</button>
                    </div>
                    <form id="catalog-form">
                        
                        <input type="hidden" id="c-id">
                        
                        <div class="input-group">
                            <label>Nombre del Producto</label>
                            <input type="text" id="c-name" class="input-field" placeholder="Ej: Focaccia de Romero" required>
                        </div>
                        
                        <div class="input-group">
                            <label>Descripción del Producto</label>
                            <textarea id="c-description" class="input-field" rows="3" placeholder="Describe el producto, sus ingredientes destacados, sabor, etc..." style="resize: vertical; font-family: inherit;"></textarea>
                            <small style="color: #64748b; font-size: 0.75rem;">Opcional - Se mostrará en el catálogo web</small>
                        </div>
                        
                        <!-- NEW: COST CALCULATOR SECTION -->
                        <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; border: 1px solid #cbd5e1; margin-bottom: 20px;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                                <h4 style="margin:0; color: #334155;">🧮 Calculadora de Costos</h4>
                                <label style="font-size:0.8rem; cursor:pointer;">
                                    <input type="checkbox" id="enable-calculator" checked> Usar Calculadora
                                </label>
                            </div>

                            <div id="calculator-panel">
                                <!-- Base Recipe -->
                                <div class="input-group">
                                    <label style="font-size:0.85rem;">Masa Base (Receta)</label>
                                    <select id="calc-base-recipe" class="input-field" style="background:#fff;">
                                        <option value="">Seleccione una masa...</option>
                                    </select>
                                </div>
                                <div class="input-group">
                                    <label style="font-size:0.85rem;">Peso de Masa Usado (g)</label>
                                    <input type="number" id="calc-base-weight" class="input-field" placeholder="Ej: 250" style="background:#fff;">
                                </div>

                                <!-- Toppings -->
                                <div class="input-group" style="margin-top:10px;">
                                    <label style="font-size:0.85rem;">Toppings / Ingredientes Extra</label>
                                    <div style="display:flex; gap:5px;">
                                        <select id="calc-topping-select" class="input-field" style="background:#fff; flex:2;">
                                            <option value="">Añadir ingrediente...</option>
                                        </select>
                                        <input type="number" id="calc-topping-qty" placeholder="Cant (g/u)" style="width:70px; padding:5px;">
                                        <button type="button" id="btn-add-topping" style="cursor:pointer;">➕</button>
                                    </div>
                                    <div id="calc-toppings-list" style="margin-top:5px; padding:5px; background:#fff; border-radius:5px; border:1px solid #e2e8f0; min-height:30px;">
                                        <!-- Dynamic Items -->
                                    </div>
                                </div>

                                <!-- Packaging -->
                                <div class="input-group" style="margin-top:10px;">
                                    <label style="font-size:0.85rem;">Empaque / Envases</label>
                                    <div style="display:flex; gap:5px;">
                                        <select id="calc-packaging-select" class="input-field" style="background:#fff; flex:2;">
                                            <option value="">Añadir empaque...</option>
                                        </select>
                                        <input type="number" id="calc-packaging-qty" placeholder="Cant" style="width:70px; padding:5px;">
                                        <button type="button" id="btn-add-packaging" style="cursor:pointer;">➕</button>
                                    </div>
                                    <div id="calc-packaging-list" style="margin-top:5px; padding:5px; background:#fff; border-radius:5px; border:1px solid #e2e8f0; min-height:30px;">
                                        <!-- Dynamic Items -->
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Manual Cost Fallback -->
                            <div id="manual-cost-panel" style="display:none; margin-top:10px;">
                                <label style="font-size:0.85rem;">Costo Manual ($)</label>
                                <input type="number" id="c-manual-cost" class="input-field" step="0.01" style="background:#fff;">
                            </div>
                        </div>
                        
                        <div class="input-group">
                            <label>Precio de Venta ($)</label>
                            <input type="number" id="c-price" class="input-field" step="0.01" required>
                            
                            <div id="calculator-core" style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-top: 10px;">
                                <div style="display:flex; justify-content:space-between; font-size: 0.75rem; font-weight: bold; margin-bottom: 8px;">
                                    <span style="color:#2563eb;">GANANCIA: <span id="lbl-margin">--</span></span>
                                    <span style="color:#64748b;">COSTO: <span id="lbl-cost">$0.00</span></span>
                                </div>
                                <input type="range" id="c-margin-range" min="0" max="300" value="60" style="width:100%; margin-bottom:10px;">
                                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size: 0.7rem; color: #475569; border-top: 1px solid #e2e8f0; padding-top: 8px;">
                                    <span>Bs. <b id="val-ves">0.00</b></span>
                                    <span>Eur. <b id="val-eur">0.00</b></span>
                                </div>
                            </div>
                        </div>

                        <div class="input-group">
                            <label>Categoría</label>
                            <select id="c-category" class="input-field">
                                <option value="Focaccias">Focaccias</option>
                                <option value="Cafetería">Cafetería</option>
                                <option value="Bebidas">Bebidas</option>
                                <option value="Otros">Otros</option>
                            </select>
                        </div>

                        <div class="input-group">
                            <label>Foto del Producto</label>
                            <input type="file" id="c-image" class="input-field" accept="image/*" style="padding:8px;">
                        </div>

                        <div class="input-group">
                            <label>Stock en Mostrador</label>
                            <input type="number" id="c-stock" class="input-field" value="0" min="0">
                            <small id="stock-hint" style="color:#64748b; font-size:0.7rem;">Solo editable para Bebidas/Cafetería/Otros.</small>
                        </div>

                        <button type="submit" class="btn-primary" style="width:100%; margin-top:15px; background:#2563eb;">
                            💾 Guardar en Catálogo
                        </button>
                    </form>
                </div>

                <div class="stat-card" style="padding:20px;">
                    <h3 style="margin-bottom:15px;">Inventario en Mostrador</h3>
                    <div class="table-responsive">
                        <table style="width:100%; border-collapse: collapse;">
                            <thead>
                                <tr style="text-align:left; border-bottom:2px solid #f1f5f9; color:#64748b; font-size:0.85rem;">
                                    <th style="padding:10px;">FOTO</th>
                                    <th>PRODUCTO</th>
                                    <th>PRECIO</th>
                                    <th>STOCK</th>
                                    <th>ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody id="catalog-body"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        `;
        this.renderTable(products);
    },

    renderTable(products) {
        const body = document.getElementById('catalog-body');
        const summaryDiv = document.getElementById('low-stock-summary');
        const countSpan = document.getElementById('low-stock-count');

        if (!products || products.length === 0) {
            body.innerHTML = '<tr><td colspan="5">No hay productos.</td></tr>';
            if (summaryDiv) summaryDiv.style.display = 'none';
            return;
        }

        let lowStockTotal = 0;

        body.innerHTML = products.map(p => {
            const stock = p.stock_disponible || 0;
            const isFocaccia = p.categoria === 'Focaccias';
            // Umbral: 2 para Focaccias, 5 para el resto
            const threshold = isFocaccia ? 2 : 5;
            const isLowStock = stock <= threshold;

            if (isLowStock) lowStockTotal++;

            return `
                <tr style="border-bottom:1px solid #f1f5f9; ${isLowStock ? 'background:#fff7ed;' : ''}">
                    <td style="padding:10px;">
                        <img src="${p.image_url || 'https://via.placeholder.com/50'}" style="width:50px; height:50px; object-fit:cover; border-radius:8px; border:1px solid #e2e8f0;">
                    </td>
                    <td>
                        <span style="font-weight:bold; display:block;">${p.product_name}</span>
                        <small style="color:#94a3b8;">${p.categoria || 'Sin categoría'}</small>
                    </td>
                    <td style="font-weight:bold; color:#0f172a;">$${p.precio_venta_final.toFixed(2)}</td>
                    <td>
                        <div style="display:flex; flex-direction:column; gap:4px;">
                            <span style="padding:4px 10px; border-radius:15px; font-weight:bold; font-size:0.9rem; width:fit-content;
                                    background:${stock > threshold ? '#dcfce7' : '#fee2e2'}; 
                                    color:${stock > threshold ? '#166534' : '#991b1b'};">
                                ${stock}
                            </span>
                            ${isLowStock ? `<small style="color:#ea580c; font-weight:800; font-size:0.65rem;">⚠️ ¡REPONER!</small>` : ''}
                        </div>
                    </td>
                    <td>
                        <div style="display:flex; gap:10px;">
                            <button class="btn-edit-prod" data-item='${JSON.stringify(p).replace(/'/g, "&apos;")}' style="background:none; border:none; color:#2563eb; cursor:pointer; font-size:1.1rem;">✏️</button>
                            <button class="btn-del-prod" data-id="${p.id}" style="background:none; border:none; color:#94a3b8; cursor:pointer; font-size:1.1rem;">🗑️</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Actualizar resumen superior
        if (summaryDiv && countSpan) {
            if (lowStockTotal > 0) {
                summaryDiv.style.display = 'block';
                countSpan.innerText = lowStockTotal;
            } else {
                summaryDiv.style.display = 'none';
            }
        }
    },
    toggleForm() {
        const form = document.getElementById('catalog-form-container');
        if (form.style.display === 'none') {
            form.style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            form.style.display = 'none';
        }
    }
};

window.CatalogView = CatalogView;
