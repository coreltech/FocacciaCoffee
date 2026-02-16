export const ProductionView = {
    renderLayout(container) {
        // Reuse the CSS from the original file, injected into components or just inline for now (cleaned up).
        // The original had a <style> block. We should move that to components.css eventually.
        // For now, we'll keep the structure clean.

        container.innerHTML = `
        <div class="main-container">
            <header style="margin-bottom: 30px;">
                <h1 style="font-size:1.8rem; margin:0 0 8px 0;">🚀 Producción y Almacén</h1>
                <p style="color:#64748b; font-size:0.95rem; margin:0;">Transforma tus recetas en stock para la venta.</p>
            </header>

            <div style="display: grid; grid-template-columns: 1fr; gap: 30px;">
                
                <!-- NEW: SHOPPING LIST SECTION -->
                <div class="stat-card" style="border-top: 5px solid #8b5cf6; padding: 25px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; flex-wrap:wrap; gap:10px;">
                        <div>
                            <h3 style="margin:0; font-size:1.1rem; display:flex; align-items:center; gap:8px;">
                                🛒 Lista de Compras (Planificación Semanal)
                            </h3>
                            <p style="color:#64748b; font-size:0.85rem; margin:4px 0 0 0;">Basado en pedidos "Pendientes".</p>
                        </div>
                        <button id="btn-close-cycle" class="btn-primary" 
                            style="background:#7c3aed; padding:10px 16px; border:none; color:white; border-radius:8px; cursor:pointer; font-weight:bold; font-size:0.9rem; display:flex; align-items:center; gap:6px;">
                            🔒 Cerrar Planificación
                        </button>
                    </div>

                    <div class="table-responsive" style="max-height: 300px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
                        <table style="width:100%; border-collapse: collapse; font-size: 0.85rem;">
                            <thead>
                                <tr style="background:#f8fafc; color:#64748b; text-align:left; position:sticky; top:0;">
                                    <th style="padding:10px;">INSUMO</th>
                                    <th>CANT. TOTAL</th>
                                    <th>A COMPRAR</th>
                                    <th>COSTO EST.</th>
                                </tr>
                            </thead>
                            <tbody id="shopping-list-body">
                                <tr><td colspan="4" style="padding:15px; text-align:center;">Cargando...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="stat-card" style="border-top: 5px solid #0284c7; max-width: 700px; margin: 0 auto; width: 100%; padding:30px;">
                    <h3 style="margin:0 0 15px 0; font-size:1.1rem;">📦 Registrar Producción (PT)</h3>
                    <p style="color: #64748b; font-size: 0.9rem; margin:0 0 20px 0;">Selecciona un producto configurado para sumar stock al mostrador.</p>
                    
                    <div class="input-group">
                        <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">Producto a Producir</label>
                        <select id="p-catalog-id" class="input-field" 
                            style="width:100%; box-sizing:border-box; padding:10px; font-weight:bold; border:2px solid #0284c7; border-radius:6px;">
                            <option value="">-- Seleccionar del Catálogo --</option>
                        </select>
                    </div>

                    <div id="p-assembly-info" style="margin: 20px 0; padding: 18px; background: #f8fafc; border-radius: 10px; border: 2px solid #e2e8f0; display: none;">
                        <!-- Cost and components summary loads here -->
                    </div>

                    <div id="p-no-config" style="margin: 20px 0; padding: 25px; background: #fff1f2; border-radius: 10px; border: 2px solid #fecaca; text-align: center; display: none;">
                        <div style="font-size: 2rem; margin-bottom: 12px;">⚠️</div>
                        <p style="color: #991b1b; font-weight: bold; margin:0 0 18px 0; font-size:1rem;">Este producto no tiene composición.</p>
                        <button onclick="document.querySelector('[data-tab=\'config_productos\']').click()" class="btn-primary" 
                            style="background:#e11d48; padding:12px 24px; border:none; color:white; border-radius:8px; cursor:pointer; font-weight:bold;">⚙️ Ir a Configurar</button>
                    </div>

                    <div class="input-group" id="p-qty-container" style="display:none; margin-top:18px;">
                        <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">Cantidad (Unidades Finales)</label>
                        <input type="number" id="p-unidades" class="input-field" value="1" min="1" 
                            style="width:100%; box-sizing:border-box; padding:12px; font-size: 1.2rem; font-weight: bold; border:2px solid #e2e8f0; border-radius:6px;">
                    </div>

                    <button id="btn-save-production" class="btn-primary" 
                        style="width:100%; margin-top:20px; background: #10b981; padding:16px; border:none; color:white; border-radius:10px; cursor:pointer; font-weight:bold; font-size:1rem; display:none; transition:background 0.2s;">
                        🚀 REGISTRAR Y SUMAR STOCK
                    </button>
                </div>

                <div class="stat-card" style="padding:25px;">
                    <h4 style="margin:0 0 18px 0; font-size:1rem;">Historial Reciente de Producción</h4>
                    <div id="p-history-content">Cargando historial...</div>
                </div>
            </div>
        </div>

        <style>
            #btn-save-production:hover {
                background: #059669 !important;
            }
            
            .input-field:focus, select:focus {
                outline: none;
                border-color: #0284c7 !important;
                box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1);
            }
            
            @media (max-width: 768px) {
                .stat-card {
                    padding: 20px !important;
                }
            }
        </style>
        `;
    },

    populateSelects(recipes, allInputs, catalog) {
        const catalogSelect = document.getElementById('p-catalog-id');
        if (!catalogSelect) return;

        catalogSelect.innerHTML = '<option value="">-- Seleccionar Producto --</option>';
        catalog.forEach(p => {
            catalogSelect.insertAdjacentHTML('beforeend', `<option value="${p.id}">${p.product_name} (Stock: ${p.stock_disponible || 0})</option>`);
        });
    },


    renderAssemblyInfo(container, composition, costPerUnit) {
        if (!composition || composition.length === 0) {
            document.getElementById('p-assembly-info').style.display = 'none';
            document.getElementById('p-no-config').style.display = 'block';
            document.getElementById('p-qty-container').style.display = 'none';
            document.getElementById('btn-save-production').style.display = 'none';
            return;
        }

        document.getElementById('p-no-config').style.display = 'none';
        const info = document.getElementById('p-assembly-info');
        info.style.display = 'block';
        document.getElementById('p-qty-container').style.display = 'block';
        document.getElementById('btn-save-production').style.display = 'block';

        info.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="font-size:0.75rem; color:#64748b;">Costo de Producción (Unit)</div>
                    <div style="font-size:1.5rem; font-weight:bold; color:#10b981;">$${costPerUnit.toFixed(2)}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:0.75rem; color:#64748b;">Versión de Ensamblaje</div>
                    <div style="font-weight:bold;">V1 (Standard)</div>
                </div>
            </div>
            <div style="margin-top:12px; font-size:0.8rem; color:#475569; border-top:1px solid #e2e8f0; padding-top:10px;">
                Incluye: ${composition.map(c => c.recipes?.name || c.supplies?.name).join(', ')}
            </div>
        `;
    },

    renderResults(masaG, units, costMasaTotal, extras, total) {
        const resultsDiv = document.getElementById('p-results-area');
        resultsDiv.style.display = 'block';

        document.getElementById('res-grand-total').innerText = `$${total.toFixed(2)}`;
        document.getElementById('res-unit-cost').innerText = `Costo Real Unitario: $${(total / units).toFixed(2)}`;

        document.getElementById('p-breakdown').innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: white; border-radius: 8px; margin-bottom: 8px; border: 1px solid #e2e8f0; font-size: 0.9rem;">
                <span>Masa Base (${masaG}g x ${units})</span> <strong>$${costMasaTotal.toFixed(2)}</strong>
            </div>
            ${extras.map(x => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: white; border-radius: 8px; margin-bottom: 8px; border: 1px solid #e2e8f0; font-size: 0.9rem;">
                    <span>${x.name} (${x.cantidadPorUnidad}${x.tipo === 'receta' ? 'g' : 'u'} x ${units})</span>
                    <strong>$${(x.precio * x.cantidadPorUnidad * units).toFixed(2)}</strong>
                </div>
            `).join('')}
        `;
    },

    renderHistory(logs, onDeleteLog) {
        const histDiv = document.getElementById('p-history-content');
        histDiv.innerHTML = logs?.map(l => `
            <div style="background: #fff; border: 1px solid #e2e8f0; padding: 12px; border-radius: 10px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${l.recipe_name}</strong><br>
                    <small>${new Date(l.fecha_produccion).toLocaleDateString()} - ${l.cantidad_unidades} und.</small>
                </div>
                <div style="display:flex; align-items:center; gap:15px;">
                    <span style="color:#10b981; font-weight:800;">$${parseFloat(l.costo_total_tanda).toFixed(2)}</span>
                    <button class="btn-del-log" data-id="${l.id}" style="color: #ef4444; cursor: pointer; font-size: 1.2rem; border: none; background: none;">🗑️</button>
                </div>
            </div>
        `).join('') || '<small>No hay registros.</small>';

        histDiv.querySelectorAll('.btn-del-log').forEach(b => {
            b.onclick = () => onDeleteLog(b.dataset.id);
        });
    },

    renderShoppingList(items) {
        const tbody = document.getElementById('shopping-list-body');
        const btnClose = document.getElementById('btn-close-cycle');

        if (!items || items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="padding:20px; text-align:center; color:#64748b;">✅ No hay pedidos pendientes por planificar.</td></tr>';
            if (btnClose) btnClose.disabled = true;
            if (btnClose) btnClose.style.opacity = '0.5';
            return;
        }

        if (btnClose) {
            btnClose.disabled = false;
            btnClose.style.opacity = '1';
        }

        let totalCost = 0;

        tbody.innerHTML = items.map(i => {
            const cost = parseFloat(i.costo_estimado_usd || 0);
            totalCost += cost;
            return `
            <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:10px;">
                    <strong>${i.insumo_nombre}</strong><br>
                    <small style="color:#94a3b8;">${i.categoria}</small>
                </td>
                <td>${i.cantidad_total_necesaria} ${i.unidad_medida}</td>
                <td>
                    <span style="background:#f3e8ff; color:#6b21a8; padding:3px 8px; border-radius:12px; font-weight:bold;">
                        ${i.paquetes_a_comprar} u
                    </span>
                </td>
                <td style="font-weight:bold;">$${i.costo_estimado_usd}</td>
            </tr>
            `;
        }).join('') + `
            <tr style="background:#f8fafc; font-weight:bold; border-top:2px solid #e2e8f0;">
                <td colspan="3" style="padding:10px; text-align:right;">TOTAL ESTIMADO:</td>
                <td style="color:#7c3aed;">$${totalCost.toFixed(2)}</td>
            </tr>
        `;
    },

    resetForm() {
        document.getElementById('p-batch-name').value = "";
        document.getElementById('p-masa-id').value = "";
        document.getElementById('p-catalog-id').value = "";
        document.getElementById('p-unidades').value = "1";
        document.getElementById('p-results-area').style.display = "none";
    }
};

window.ProductionView = ProductionView;
