export const RecipesProView = {
    renderLayout(container, supplies, subRecipes) {
        container.innerHTML = `
        <div class="main-container fade-in">
            <header style="margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h1 style="font-size: 1.8rem; margin-bottom: 5px;">👩‍🍳 Recetas Profesionales</h1>
                    <p style="color: #64748b; font-size: 0.95rem;">Manejo de fórmulas panaderas, porcentajes y márgenes de contribución.</p>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button id="btn-export-recipes" class="btn-primary" style="padding: 12px 20px; background-color: #10b981; border: none; color: white; border-radius: 6px; cursor: pointer;">⬇️ Exportar CSV</button>
                    <button id="btn-new-recipe" class="btn-primary" style="padding: 12px 20px;">+ Nueva Receta</button>
                </div>
            </header>

            <div style="display: grid; grid-template-columns: 1fr; gap: 30px;" id="recipe-workspace">
                <!-- LISTADO (Default) -->
                <div id="recipe-list-container" class="stat-card" style="padding: 25px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                        <h3 style="margin: 0; font-size: 1.1rem;">Catálogo de Recetas</h3>
                        <input type="text" id="search-recipe" placeholder="🔎 Buscar receta..." class="input-field" 
                            style="width: 250px; padding: 10px; box-sizing: border-box; border: 2px solid #e2e8f0; border-radius: 6px;">
                    </div>
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Receta</th>
                                    <th>Tipo</th>
                                    <th>Costo Est. ($)</th>
                                    <th>Margen (BCV)</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="recipe-table-body">
                                <tr><td colspan="5" style="text-align: center;">Cargando...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- FORMULARIO (Hidden by default) -->
                <div id="recipe-form-container" class="stat-card" style="display: none; padding: 30px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px;">
                        <h2 id="form-title" style="margin: 0; font-size: 1.3rem;">Nueva Receta</h2>
                        <button id="btn-close-form" style="background:none; border:none; cursor:pointer; font-size:1.5rem; color: #64748b;">✕</button>
                    </div>

                    <input type="hidden" id="recipe-id">
                    
                    <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 18px;">
                        <div class="input-group">
                            <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 8px;">Nombre de la Receta</label>
                            <input type="text" id="recipe-name" class="input-field" placeholder="Ej. Masa Focaccia Base" 
                                style="width: 100%; box-sizing: border-box; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px;">
                        </div>
                        <div class="input-group">
                            <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 8px;">Tipo de Estructura</label>
                            <select id="recipe-type" class="input-field" 
                                style="width: 100%; box-sizing: border-box; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px;">
                                <option value="MASA">Fórmula Panadera (%)</option>
                                <option value="TRADICIONAL">Tradicional (Fija)</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 8px;">Peso Final Esperado (g)</label>
                            <input type="number" id="recipe-expected-weight" class="input-field" placeholder="Ej. 5000" 
                                style="width: 100%; box-sizing: border-box; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px;">
                        </div>
                    </div>

                    <div id="bakers-base-section" style="margin-top: 25px; padding: 18px; background: #f0f9ff; border-radius: 10px; border: 2px solid #bae6fd;">
                        <div style="display: flex; align-items: center; gap: 18px; flex-wrap: wrap;">
                            <div style="font-size: 1.3rem;">⚖️</div>
                            <div style="flex: 1; min-width: 250px;">
                                <label style="font-weight: 600; color: #0369a1; font-size: 0.9rem; display: block; margin-bottom: 8px;">Peso de Harina Base (100%) para el cálculo</label>
                                <div style="display: flex; gap: 12px; align-items: center;">
                                    <input type="number" id="base-flour-weight" class="input-field" value="1000" 
                                        style="width: 150px; box-sizing: border-box; padding: 10px; border: 2px solid #7dd3fc; border-radius: 6px; background: white;">
                                    <span style="font-weight: 600; color: #0369a1;">gramos</span>
                                </div>
                            </div>
                            <div style="text-align: right; min-width: 150px;">
                                <div style="font-size: 0.8rem; color: #0369a1; margin-bottom: 4px;">Peso Total de Mezcla:</div>
                                <div id="total-mix-weight" style="font-size: 1.2rem; font-weight: bold; color: #0c4a6e;">0 g</div>
                            </div>
                        </div>
                    </div>

                    <div style="margin-top: 30px;">
                        <h3 style="margin-bottom: 18px; font-size: 1.1rem;">Ingredientes y Porcentajes</h3>
                        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 12px; align-items: end;">
                            <div class="input-group">
                                <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 8px;">Insumo / Sub-Receta</label>
                                <select id="item-selector" class="input-field" 
                                    style="width: 100%; box-sizing: border-box; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px;">
                                    <option value="">-- Seleccionar --</option>
                                    <optgroup label="Suministros">
                                        ${supplies.map(s => `<option value="S|${s.id}" data-cost="${s.last_purchase_price / s.equivalence}" data-unit="${s.min_unit}">${s.name} (${s.brand || 'N/A'})</option>`).join('')}
                                    </optgroup>
                                    <optgroup label="Sub-Recetas">
                                        ${subRecipes.map(r => `<option value="R|${r.id}" data-cost="0" data-unit="g">${r.name}</option>`).join('')}
                                    </optgroup>
                                </select>
                            </div>
                            <div class="input-group">
                                <label id="qty-label" style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 8px;">Cantidad / %</label>
                                <input type="number" id="item-qty" class="input-field" placeholder="Ej. 65" 
                                    style="width: 100%; box-sizing: border-box; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px;">
                            </div>
                            <div class="input-group">
                                <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 8px;">Unidad</label>
                                <select id="item-unit" class="input-field" 
                                    style="width: 100%; box-sizing: border-box; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px;">
                                    <option value="%">% (Panadero)</option>
                                    <option value="g">Gramos (g)</option>
                                    <option value="ml">Mililitros (ml)</option>
                                    <option value="unid">Unidades</option>
                                </select>
                            </div>
                            <div style="display: flex; align-items: center; padding-bottom: 8px;">
                                <input type="checkbox" id="item-is-base" style="margin-right: 8px; cursor: pointer;"> 
                                <label for="item-is-base" style="font-size: 0.85rem; cursor: pointer; white-space: nowrap;">Es Base (100%)</label>
                            </div>
                            <button id="btn-add-item" class="btn-primary" 
                                style="height: 42px; padding: 0 20px; border-radius: 6px; border: none; background: #2563eb; color: white; font-weight: bold; cursor: pointer;">
                                +
                            </button>
                        </div>

                        <div class="table-responsive" style="margin-top: 20px;">
                            <table class="data-table" style="background: white;">
                                <thead>
                                    <tr>
                                        <th>Ingrediente</th>
                                        <th>Unidad/Tipo</th>
                                        <th>Valor Ingresado</th>
                                        <th>Gramos Reales</th>
                                        <th>Costo ($)</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="ingredients-table-body">
                                    <!-- Items added dynamically -->
                                </tbody>
                                <tfoot>
                                    <tr style="background: #f8fafc; font-weight: bold;">
                                        <td colspan="3" style="text-align: right;">TOTALES</td>
                                        <td id="calc-total-weight">0 g</td>
                                        <td id="calc-total-cost">$0.0000</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    <div style="margin-top: 30px;">
                        <div class="input-group" style="margin-bottom: 25px;">
                            <label style="font-weight: 600; font-size: 1rem; display: block; margin-bottom: 12px; color: #1e293b;">📖 Pasos de Preparación</label>
                            <textarea id="recipe-steps" class="input-field" placeholder="Describe el proceso detallado paso a paso..." 
                                style="min-height: 400px; width: 100%; box-sizing: border-box; padding: 20px; border: 2px solid #cbd5e1; border-radius: 8px; resize: vertical; font-size: 1rem; line-height: 1.6;"></textarea>
                        </div>

                        <div class="stat-card" style="background: #fdf2f8; border: 2px solid #fbcfe8; padding: 20px; border-radius: 10px; max-width: 500px; padding: 20px;">
                            <h4 style="color: #9d174d; margin-top: 0; margin-bottom: 15px; font-size: 1rem;">Análisis Financiero</h4>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding-bottom: 8px;">
                                <span style="font-size: 0.9rem;">Costo de Producción:</span>
                                <span id="summary-total-cost" style="font-weight: bold; font-size: 0.95rem;">$0.0000</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px;">
                                <span style="font-size: 0.9rem;">Tasa BCV del día:</span>
                                <span id="summary-bcv-rate" style="color: #64748b; font-size: 0.9rem;">0.00 Bs</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 2px dashed #f9a8d4;">
                                <span style="font-weight: bold; font-size: 0.95rem;">Margen Sugerido (30%):</span>
                                <span id="summary-suggested-price" style="font-weight: bold; color: #be185d; font-size: 1.05rem;">$0.00</span>
                            </div>
                        </div>
                    </div>

                    <div style="margin-top: 30px; display: flex; gap: 15px;">
                        <button id="btn-save-recipe" class="btn-primary" 
                            style="flex: 2; padding: 14px; font-weight: bold; border-radius: 8px; border: none; background: #2563eb; color: white; cursor: pointer;">
                            Guardar Receta Profesional
                        </button>
                        <button id="btn-cancel-form" class="btn-primary" 
                            style="flex: 1; padding: 14px; font-weight: bold; border-radius: 8px; border: none; background: #64748b; color: white; cursor: pointer;">
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <style>
            #btn-add-item:hover {
                background: #1d4ed8 !important;
            }
            
            #btn-save-recipe:hover {
                background: #1d4ed8 !important;
            }
            
            #btn-cancel-form:hover {
                background: #475569 !important;
            }
            
            .input-field:focus {
                outline: none;
                border-color: #2563eb !important;
                box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
            }
            
            @media (max-width: 1024px) {
                #recipe-form-container > div:first-of-type {
                    grid-template-columns: 1fr !important;
                }
            }
        </style>
        `;
    },

    renderList(recipes, bcvRate, onEdit, onDelete) {
        const tbody = document.getElementById('recipe-table-body');
        if (!tbody) return;

        if (recipes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">No hay recetas registradas.</td></tr>';
            return;
        }

        tbody.innerHTML = recipes.map(r => {
            // Estimate total cost for summary
            const totalCost = (r.items || []).reduce((acc, it) => {
                // For direct items, it's easy. For %, we assume 1000g base for estimation
                if (it.unit_type === '%') {
                    return acc + (it.percentage * 10 * it.cost_per_unit_min);
                }
                return acc + (it.quantity * it.cost_per_unit_min);
            }, 0);

            return `
            <tr>
                <td>
                    <div style="font-weight:bold;">${r.name}</div>
                    <div style="font-size:0.75rem; color:#64748b;">${r.items?.length || 0} ingredientes</div>
                </td>
                <td><span class="badge ${r.tipo_receta === 'MASA' ? 'info' : 'success'}">${r.tipo_receta}</span></td>
                <td>
                    <div style="font-weight:bold;">$${totalCost.toFixed(2)}</div>
                    <div style="font-size:0.7rem; color:#64748b;">(Estimado p/ 1kg base)</div>
                </td>
                <td>
                    <div style="color:#16a34a; font-weight:bold;">Análisis Disp.</div>
                </td>
                <td>
                    <button class="btn-edit-recipe" data-id="${r.id}" style="background:none; border:none; cursor:pointer;">✏️</button>
                    <button class="btn-del-recipe" data-id="${r.id}" style="background:none; border:none; cursor:pointer; color:#ef4444;">🗑️</button>
                </td>
            </tr>
        `}).join('');

        tbody.querySelectorAll('.btn-edit-recipe').forEach(btn => btn.onclick = () => onEdit(btn.dataset.id));
        tbody.querySelectorAll('.btn-del-recipe').forEach(btn => btn.onclick = () => onDelete(btn.dataset.id));
    },

    renderIngredientsTable(items, recipeType, baseWeight, onDelete) {
        const tbody = document.getElementById('ingredients-table-body');
        if (!tbody) return;

        let totalWeight = 0;
        let totalCost = 0;

        tbody.innerHTML = items.map((it, idx) => {
            let realGrams = it.quantity;
            if (recipeType === 'MASA' && it.unit_type === '%') {
                realGrams = (it.percentage / 100) * baseWeight;
            }

            const itemCost = realGrams * (it.cost_per_unit_min || 0);
            totalWeight += realGrams;
            totalCost += itemCost;

            return `
            <tr>
                <td>
                    <div style="font-weight:bold;">${it.is_base ? '⭐ ' : ''}${it.name}</div>
                </td>
                <td>${it.unit_type === '%' ? 'Fórmula (%)' : 'Fijo (' + it.unit_type + ')'}</td>
                <td>${it.unit_type === '%' ? it.percentage + '%' : it.quantity + ' ' + it.unit_type}</td>
                <td style="color: #0369a1; font-weight: bold;">${realGrams.toFixed(1)} g</td>
                <td>$${itemCost.toFixed(4)}</td>
                <td>
                    <button class="btn-remove-item" data-idx="${idx}" style="background:none; border:none; cursor:pointer; color:#ef4444;">✕</button>
                </td>
            </tr>
        `}).join('');

        document.getElementById('calc-total-weight').innerText = `${totalWeight.toFixed(0)} g`;
        document.getElementById('calc-total-cost').innerText = `$${totalCost.toFixed(4)}`;
        document.getElementById('summary-total-cost').innerText = `$${totalCost.toFixed(4)}`;
        document.getElementById('summary-suggested-price').innerText = `$${(totalCost * 1.3).toFixed(2)}`;
        document.getElementById('total-mix-weight').innerText = `${totalWeight.toFixed(0)} g`;

        tbody.querySelectorAll('.btn-remove-item').forEach(btn => {
            btn.onclick = () => onDelete(parseInt(btn.dataset.idx));
        });
    },

    showForm(show = true) {
        document.getElementById('recipe-list-container').style.display = show ? 'none' : 'block';
        document.getElementById('recipe-form-container').style.display = show ? 'block' : 'none';
        if (show) window.scrollTo(0, 0);
    },

    fillForm(r) {
        document.getElementById('recipe-id').value = r.id;
        document.getElementById('recipe-name').value = r.name;
        document.getElementById('recipe-type').value = r.tipo_receta;
        document.getElementById('recipe-expected-weight').value = r.expected_weight;
        document.getElementById('recipe-steps').value = r.pasos_preparacion || "";

        document.getElementById('form-title').innerText = "Editar Receta Profesional";
        document.getElementById('btn-save-recipe').innerText = "Actualizar Receta";
    },

    resetForm() {
        document.getElementById('recipe-id').value = "";
        document.getElementById('recipe-name').value = "";
        document.getElementById('recipe-type').value = "MASA";
        document.getElementById('recipe-expected-weight').value = "";
        document.getElementById('recipe-steps').value = "";
        document.getElementById('base-flour-weight').value = "1000";
        document.getElementById('ingredients-table-body').innerHTML = "";

        document.getElementById('form-title').innerText = "Nueva Receta Profesional";
        document.getElementById('btn-save-recipe').innerText = "Guardar Receta Profesional";
    }
}
