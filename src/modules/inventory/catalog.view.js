export const CatalogView = {
    renderLayout(container, rates, products, recentLogs, isDirector = false, showInactive = false, costsData = []) {
        container.innerHTML = `
        <div class="main-container">
            <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px; flex-wrap:wrap; gap:15px;">
                <div>
                    <h1 style="font-size: 1.8rem; margin:0 0 5px 0;">📋 Catálogo de Productos</h1>
                    <p style="color: #64748b; margin:0; font-size:0.95rem;">Gestión de precios, fotos y stock disponible.</p>
                </div>
                <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
                    <div id="low-stock-summary" style="display:none; background:#fff1f2; color:#991b1b; padding:8px 14px; border-radius:8px; border:2px solid #fecaca; font-size:0.75rem; font-weight:800;">
                        ⚠️ <span id="low-stock-count">0</span> PRODUCTOS POR AGOTAR
                    </div>
                    ${isDirector ? `
                    <label style="display:flex; align-items:center; gap:6px; background:#fef3c7; color:#92400e; padding:8px 14px; border-radius:8px; border:2px solid #fbbf24; font-size:0.75rem; font-weight:600; cursor:pointer;">
                        <input type="checkbox" id="toggle-inactive" ${showInactive ? 'checked' : ''} style="cursor:pointer;">
                        👁️ Ver Inactivos
                    </label>
                    ` : ''}
                    <div style="font-size:0.8rem; background:#f8fafc; padding:10px 14px; border-radius:8px; border:2px solid #e2e8f0;">
                        <b>BCV:</b> $1 = ${rates.tasa_usd_ves} | €1 = ${rates.tasa_eur_ves}
                    </div>
                    <button onclick="CatalogView.toggleForm()" class="btn-primary" style="background:#2563eb; padding:12px 20px; border-radius:8px; border:none; color:white; font-weight:bold; cursor:pointer;">+ Nuevo Producto</button>
                </div>
            </header>

            <div style="display:grid; grid-template-columns: 1fr; gap:25px;">
                <div id="catalog-form-container" class="stat-card" style="padding:30px; display:none; border-left: 5px solid #2563eb;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:2px solid #e2e8f0; padding-bottom:15px;">
                        <h3 id="form-title" style="margin:0; font-size:1.2rem;">Añadir Nuevo Producto</h3>
                        <button onclick="CatalogView.toggleForm()" style="background:none; border:none; color:#64748b; cursor:pointer; font-size:1.3rem;">✕</button>
                    </div>
                    <form id="catalog-form">
                        
                        <input type="hidden" id="c-id">
                        
                        <div class="input-group">
                            <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">Nombre del Producto</label>
                            <input type="text" id="c-name" class="input-field" placeholder="Ej: Focaccia de Romero" required 
                                style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                        </div>
                        
                        <div class="input-group" style="margin-top:18px;">
                            <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">Descripción del Producto</label>
                            <textarea id="c-description" class="input-field" rows="3" placeholder="Describe el producto, sus ingredientes destacados, sabor, etc..." 
                                style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px; resize:vertical; font-family:inherit;"></textarea>
                            <small style="color: #64748b; font-size: 0.75rem; display:block; margin-top:6px;">Opcional - Se mostrará en el catálogo web</small>
                        </div>
                        
                        <!-- NEW: COST CALCULATOR SECTION -->
                        <div style="background: #f1f5f9; padding: 18px; border-radius: 10px; border: 2px solid #cbd5e1; margin-top: 20px;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:12px; align-items:center;">
                                <h4 style="margin:0; color: #334155; font-size:1rem;">🧮 Calculadora de Costos</h4>
                                <label style="font-size:0.85rem; cursor:pointer; display:flex; align-items:center; gap:6px;">
                                    <input type="checkbox" id="enable-calculator" checked style="cursor:pointer;"> Usar Calculadora
                                </label>
                            </div>

                            <div id="calculator-panel">
                                <!-- Base Recipe -->
                                <div class="input-group">
                                    <label style="font-size:0.85rem; font-weight:600; display:block; margin-bottom:6px;">Masa Base (Receta)</label>
                                    <select id="calc-base-recipe" class="input-field" 
                                        style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #cbd5e1; border-radius:6px; background:#fff;">
                                        <option value="">Seleccione una masa...</option>
                                    </select>
                                </div>
                                <div class="input-group" style="margin-top:12px;">
                                    <label style="font-size:0.85rem; font-weight:600; display:block; margin-bottom:6px;">Peso de Masa Usado (g)</label>
                                    <input type="number" id="calc-base-weight" class="input-field" placeholder="Ej: 250" 
                                        style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #cbd5e1; border-radius:6px; background:#fff;">
                                </div>

                                <!-- Toppings -->
                                <div class="input-group" style="margin-top:15px;">
                                    <label style="font-size:0.85rem; font-weight:600; display:block; margin-bottom:6px;">Toppings / Ingredientes Extra</label>
                                    <div style="display:flex; gap:8px;">
                                        <select id="calc-topping-select" class="input-field" 
                                            style="flex:2; box-sizing:border-box; padding:10px; border:2px solid #cbd5e1; border-radius:6px; background:#fff;">
                                            <option value="">Añadir ingrediente...</option>
                                        </select>
                                        <input type="number" id="calc-topping-qty" placeholder="Cant (g/u)" 
                                            style="width:90px; box-sizing:border-box; padding:10px; border:2px solid #cbd5e1; border-radius:6px;">
                                        <button type="button" id="btn-add-topping" 
                                            style="padding:10px 15px; background:#10b981; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">➕</button>
                                    </div>
                                    <div id="calc-toppings-list" style="margin-top:8px; padding:8px; background:#fff; border-radius:6px; border:2px solid #e2e8f0; min-height:40px;">
                                        <!-- Dynamic Items -->
                                    </div>
                                </div>

                                <!-- Packaging -->
                                <div class="input-group" style="margin-top:15px;">
                                    <label style="font-size:0.85rem; font-weight:600; display:block; margin-bottom:6px;">Empaque / Envases</label>
                                    <div style="display:flex; gap:8px;">
                                        <select id="calc-packaging-select" class="input-field" 
                                            style="flex:2; box-sizing:border-box; padding:10px; border:2px solid #cbd5e1; border-radius:6px; background:#fff;">
                                            <option value="">Añadir empaque...</option>
                                        </select>
                                        <input type="number" id="calc-packaging-qty" placeholder="Cant" 
                                            style="width:90px; box-sizing:border-box; padding:10px; border:2px solid #cbd5e1; border-radius:6px;">
                                        <button type="button" id="btn-add-packaging" 
                                            style="padding:10px 15px; background:#10b981; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">➕</button>
                                    </div>
                                    <div id="calc-packaging-list" style="margin-top:8px; padding:8px; background:#fff; border-radius:6px; border:2px solid #e2e8f0; min-height:40px;">
                                        <!-- Dynamic Items -->
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Manual Cost Fallback -->
                            <div id="manual-cost-panel" style="display:none; margin-top:12px;">
                                <label style="font-size:0.85rem; font-weight:600; display:block; margin-bottom:6px;">Costo Manual ($)</label>
                                <input type="number" id="c-manual-cost" class="input-field" step="0.01" 
                                    style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #cbd5e1; border-radius:6px; background:#fff;">
                            </div>
                        </div>
                        
                        <div class="input-group" style="margin-top:20px;">
                            <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">Precio de Venta ($)</label>
                            <input type="number" id="c-price" class="input-field" step="0.01" required 
                                style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                            
                            <div id="calculator-core" style="background: #f8fafc; border: 2px solid #e2e8f0; padding: 15px; border-radius: 10px; margin-top: 12px;">
                                <div style="display:flex; justify-content:space-between; font-size: 0.8rem; font-weight: bold; margin-bottom: 10px;">
                                    <span style="color:#2563eb;">GANANCIA: <span id="lbl-margin">--</span></span>
                                    <span style="color:#64748b;">COSTO: <span id="lbl-cost">$0.00</span></span>
                                </div>
                                <input type="range" id="c-margin-range" min="0" max="300" value="60" style="width:100%; margin-bottom:12px; cursor:pointer;">
                                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; font-size: 0.75rem; color: #475569; border-top: 2px solid #e2e8f0; padding-top: 10px;">
                                    <span>Bs. <b id="val-ves">0.00</b></span>
                                    <span>Eur. <b id="val-eur">0.00</b></span>
                                </div>
                            </div>
                        </div>

                        <div class="input-group" style="margin-top:18px;">
                            <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">Categoría</label>
                            <select id="c-category" class="input-field" 
                                style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                                <option value="Focaccias">Focaccias</option>
                                <option value="Cafetería">Cafetería</option>
                                <option value="Bebidas">Bebidas</option>
                                <option value="Otros">Otros</option>
                            </select>
                        </div>

                        <div class="input-group" id="icon-selector-group" style="margin-top:18px;">
                            <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">Icono (Emoji) 
                                <small style="color:#64748b; font-weight:normal;">- Opcional para Cafetería/Bebidas</small>
                            </label>
                            <div style="display:flex; gap:12px; align-items:center; margin-bottom:12px;">
                                <input type="text" id="c-icon" class="input-field" placeholder="Selecciona o escribe emoji..." maxlength="2" 
                                    style="font-size:2rem; text-align:center; width:120px; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                                <button type="button" id="clear-icon-btn" 
                                    style="padding:10px 15px; background:#ef4444; color:white; border:none; border-radius:6px; cursor:pointer; font-size:0.85rem; font-weight:600;">✕ Limpiar</button>
                            </div>
                            
                            <div id="icon-picker" style="background:#f8fafc; border:2px solid #e2e8f0; border-radius:10px; padding:15px; display:none;">
                                <div style="margin-bottom:12px;">
                                    <strong style="font-size:0.85rem; color:#475569;">☕ Café y Calientes</strong>
                                    <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap;">
                                        <button type="button" class="icon-option" data-icon="☕">☕</button>
                                        <button type="button" class="icon-option" data-icon="🍵">🍵</button>
                                        <button type="button" class="icon-option" data-icon="🫖">🫖</button>
                                        <button type="button" class="icon-option" data-icon="🧋">🧋</button>
                                        <button type="button" class="icon-option" data-icon="🥤">🥤</button>
                                    </div>
                                </div>
                                
                                <div style="margin-bottom:12px;">
                                    <strong style="font-size:0.85rem; color:#475569;">🥤 Refrescos y Sodas</strong>
                                    <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap;">
                                        <button type="button" class="icon-option" data-icon="🥤">🥤</button>
                                        <button type="button" class="icon-option" data-icon="🧃">🧃</button>
                                        <button type="button" class="icon-option" data-icon="🧊">🧊</button>
                                        <button type="button" class="icon-option" data-icon="🥛">🥛</button>
                                    </div>
                                </div>
                                
                                <div style="margin-bottom:12px;">
                                    <strong style="font-size:0.85rem; color:#475569;">💧 Agua y Naturales</strong>
                                    <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap;">
                                        <button type="button" class="icon-option" data-icon="💧">💧</button>
                                        <button type="button" class="icon-option" data-icon="🚰">🚰</button>
                                        <button type="button" class="icon-option" data-icon="🥥">🥥</button>
                                        <button type="button" class="icon-option" data-icon="🍋">🍋</button>
                                    </div>
                                </div>
                                
                                <div>
                                    <strong style="font-size:0.85rem; color:#475569;">🍺 Otros</strong>
                                    <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap;">
                                        <button type="button" class="icon-option" data-icon="🍺">🍺</button>
                                        <button type="button" class="icon-option" data-icon="🍷">🍷</button>
                                        <button type="button" class="icon-option" data-icon="🍹">🍹</button>
                                        <button type="button" class="icon-option" data-icon="🧉">🧉</button>
                                    </div>
                                </div>
                            </div>
                            
                            <small style="color: #64748b; font-size: 0.75rem; display:block; margin-top:10px;">
                                💡 Haz clic en un emoji o escribe/pega uno personalizado. Solo para Cafetería/Bebidas.
                            </small>
                        </div>
                        
                        <style>
                            .icon-option {
                                font-size: 1.8rem;
                                padding: 10px 14px;
                                background: white;
                                border: 2px solid #e2e8f0;
                                border-radius: 8px;
                                cursor: pointer;
                                transition: all 0.2s;
                            }
                            .icon-option:hover {
                                background: #eff6ff;
                                border-color: #3b82f6;
                                transform: scale(1.1);
                            }
                            .icon-option.selected {
                                background: #dbeafe;
                                border-color: #2563eb;
                                box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                            }
                        </style>

                        <div class="input-group" style="margin-top:18px;">
                            <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">Foto del Producto</label>
                            <input type="file" id="c-image" class="input-field" accept="image/*" 
                                style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                            <div id="image-preview-container" style="margin-top:10px; display:none;">
                                <label style="font-size:0.8rem; color:#64748b; display:block; margin-bottom:5px;">Imagen Actual:</label>
                                <img id="c-image-preview" src="" style="width:100px; height:100px; object-fit:cover; border-radius:8px; border:2px solid #cbd5e1;">
                                <input type="hidden" id="c-original-image">
                            </div>
                        </div>

                        <div class="input-group" style="margin-top:18px;">
                            <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">Stock en Mostrador</label>
                            <input type="number" id="c-stock" class="input-field" value="0" min="0" 
                                style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                            <small id="stock-hint" style="color:#64748b; font-size:0.75rem; display:block; margin-top:6px;">Solo editable para Bebidas/Cafetería/Otros.</small>
                        </div>

                        <button type="submit" class="btn-primary" 
                            style="width:100%; margin-top:25px; padding:14px; background:#2563eb; border:none; color:white; font-weight:bold; border-radius:8px; cursor:pointer; font-size:1rem;">
                            💾 Guardar en Catálogo
                        </button>
                    </form>
                </div>

                <div class="stat-card" style="padding:25px;">
                    <h3 style="margin:0 0 20px 0; font-size:1.1rem;">Inventario en Mostrador</h3>
                    <div class="table-responsive">
                        <table style="width:100%; border-collapse: collapse;">
                            <thead>
                                <tr style="text-align:left; border-bottom:2px solid #f1f5f9; color:#64748b; font-size:0.85rem;">
                                    <th style="padding:12px 10px;">FOTO</th>
                                    <th>PRODUCTO</th>
                                    <th>PRECIO</th>
                                    <th>MARGEN</th>
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

        <style>
            .btn-primary:hover {
                background: #1d4ed8 !important;
            }
            
            .input-field:focus, select:focus, textarea:focus {
                outline: none;
                border-color: #2563eb !important;
                box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
            }
            
            #btn-add-topping:hover, #btn-add-packaging:hover {
                background: #059669 !important;
            }
            
            #clear-icon-btn:hover {
                background: #dc2626 !important;
            }
        </style>
        `;
        this.renderTable(products, costsData);
    },

    renderTable(products, costsData = []) {
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
            const isInactive = !p.esta_activo;
            // Umbral: 2 para Focaccias, 5 para el resto
            const threshold = isFocaccia ? 2 : 5;
            const isLowStock = stock <= threshold && !isInactive;

            if (isLowStock) lowStockTotal++;

            return `
                <tr style="border-bottom:1px solid #f1f5f9; ${isInactive ? 'background:#f1f5f9; opacity:0.6;' : (isLowStock ? 'background:#fff7ed;' : '')}">
                    <td style="padding:10px;">
                        <img src="${p.image_url || 'https://via.placeholder.com/50'}" style="width:50px; height:50px; object-fit:cover; border-radius:8px; border:1px solid #e2e8f0; ${isInactive ? 'filter:grayscale(100%);' : ''}">
                    </td>
                    <td>
                        <span style="font-weight:bold; display:block; ${isInactive ? 'text-decoration:line-through; color:#94a3b8;' : ''}">${p.product_name}</span>
                        <small style="color:#94a3b8;">${p.categoria || 'Sin categoría'}</small>
                        ${isInactive ? '<small style="color:#dc2626; font-weight:800; font-size:0.7rem; display:block;">⛔ INACTIVO</small>' : ''}
                    </td>
                    <td style="font-weight:bold; color:${isInactive ? '#94a3b8' : '#0f172a'};">$${p.precio_venta_final.toFixed(2)}</td>
                    <td>
                        ${(() => {
                    if (isInactive) return '<span style="color:#94a3b8">--</span>';
                    const costItem = costsData.find(c => c.catalog_id === p.id);
                    if (!costItem || !costItem.margin_percentage) return '<span style="color:#94a3b8; font-size:0.8rem;">N/A</span>';

                    const margin = parseFloat(costItem.margin_percentage);
                    let color = '#16a34a'; // Green > 30%
                    let bg = '#dcfce7';

                    if (margin < 15) {
                        color = '#dc2626'; bg = '#fee2e2'; // Red
                    } else if (margin <= 30) {
                        color = '#d97706'; bg = '#fef3c7'; // Yellow
                    }

                    return `
                                <div style="display:flex; flex-direction:column; gap:2px;">
                                    <span style="font-weight:bold; color:${color}; background:${bg}; padding:4px 8px; border-radius:6px; font-size:0.85rem; width:fit-content;">
                                        ${margin}%
                                    </span>
                                    <small style="font-size:0.7rem; color:#64748b;">$${costItem.production_cost_usd.toFixed(2)}</small>
                                </div>
                            `;
                })()}
                    </td>
                    <td>
                        <div style="display:flex; flex-direction:column; gap:4px;">
                            <span style="padding:4px 10px; border-radius:15px; font-weight:bold; font-size:0.9rem; width:fit-content;
                                    background:${isInactive ? '#e2e8f0' : (stock > threshold ? '#dcfce7' : '#fee2e2')}; 
                                    color:${isInactive ? '#64748b' : (stock > threshold ? '#166534' : '#991b1b')};">
                                ${stock}
                            </span>
                            ${isLowStock ? `<small style="color:#ea580c; font-weight:800; font-size:0.65rem;">⚠️ ¡REPONER!</small>` : ''}
                        </div>
                    </td>
                    <td>
                        <div style="display:flex; gap:10px;">
                            ${isInactive ? `
                                <button class="btn-reactivate-prod" data-id="${p.id}" style="background:none; border:none; color:#16a34a; cursor:pointer; font-size:1.1rem;" title="Reactivar producto">🔄</button>
                                <button class="btn-force-del-prod" data-id="${p.id}" data-name="${p.product_name}" style="background:none; border:none; color:#dc2626; cursor:pointer; font-size:1.1rem;" title="Eliminar permanentemente">⚠️</button>
                            ` : `
                                <button class="btn-edit-prod" data-item='${JSON.stringify(p).replace(/'/g, "&apos;")}' style="background:none; border:none; color:#2563eb; cursor:pointer; font-size:1.1rem;">✏️</button>
                                <button class="btn-del-prod" data-id="${p.id}" style="background:none; border:none; color:#94a3b8; cursor:pointer; font-size:1.1rem;">🗑️</button>
                            `}
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
