export const ProductionView = {
    renderLayout(container) {
        // Reuse the CSS from the original file, injected into components or just inline for now (cleaned up).
        // The original had a <style> block. We should move that to components.css eventually.
        // For now, we'll keep the structure clean.

        container.innerHTML = `
        <div class="main-container">
            <header style="margin-bottom: 30px;">
                <h1>🚀 Producción y Almacén</h1>
                <p>Transforma tus recetas en stock para la venta.</p>
            </header>

            <div style="display: grid; grid-template-columns: 1fr; gap: 30px;">
                <div class="stat-card" style="border-top: 6px solid #0284c7; max-width: 600px; margin: 0 auto; width: 100%;">
                    <h3 style="margin-top:0;">📦 Registrar Producción (PT)</h3>
                    <p style="color: #64748b; font-size: 0.9rem;">Selecciona un producto configurado para sumar stock al mostrador.</p>
                    
                    <div class="input-group">
                        <label>Producto a Producir</label>
                        <select id="p-catalog-id" class="input-field" style="font-weight:bold; border-color:#0284c7;">
                            <option value="">-- Seleccionar del Catálogo --</option>
                        </select>
                    </div>

                    <div id="p-assembly-info" style="margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; display: none;">
                        <!-- Cost and components summary loads here -->
                    </div>

                    <div id="p-no-config" style="margin: 20px 0; padding: 20px; background: #fff1f2; border-radius: 12px; border: 1px solid #fecaca; text-align: center; display: none;">
                        <div style="font-size: 1.5rem; margin-bottom: 10px;">⚠️</div>
                        <p style="color: #991b1b; font-weight: bold; margin-bottom: 15px;">Este producto no tiene composición.</p>
                        <button onclick="document.querySelector('[data-tab=\'config_productos\']').click()" class="btn-primary" style="background:#e11d48;">⚙️ Ir a Configurar</button>
                    </div>

                    <div class="input-group" id="p-qty-container" style="display:none;">
                        <label>Cantidad (Unidades Finales)</label>
                        <input type="number" id="p-unidades" class="input-field" value="1" min="1" style="font-size: 1.2rem; font-weight: bold;">
                    </div>

                    <button id="btn-save-production" class="btn-primary" style="width:100%; margin-top:15px; background: #10b981; display:none;">
                        🚀 REGISTRAR Y SUMAR STOCK
                    </button>
                </div>

                <div class="stat-card" style="padding:20px;">
                    <h4>Historial Reciente de Producción</h4>
                    <div id="p-history-content">Cargando historial...</div>
                </div>
            </div>
        </div>
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

    resetForm() {
        document.getElementById('p-batch-name').value = "";
        document.getElementById('p-masa-id').value = "";
        document.getElementById('p-catalog-id').value = "";
        document.getElementById('p-unidades').value = "1";
        document.getElementById('p-results-area').style.display = "none";
    }
};

window.ProductionView = ProductionView;
