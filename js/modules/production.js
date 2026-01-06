import { supabase } from '../supabase.js';

export async function loadProduction() {
    const container = document.getElementById('app-content');
    
    container.innerHTML = `
        <div class="main-container">
            <header class="header-flex">
                <div>
                    <h1>🥖 Producción Profesional</h1>
                    <p style="color: #64748b;">Cálculo basado en Fórmula Panadera (Harina 100%)</p>
                </div>
            </header>

            <div style="display:grid; grid-template-columns: 1fr 1.3fr; gap:25px;">
                <div class="stat-card">
                    <h3>⚙️ Parámetros del Lote</h3>
                    <div class="input-group">
                        <label>Receta de Focaccia</label>
                        <select id="p-recipe" class="input-field"></select>
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-top:15px;">
                        <div class="input-group">
                            <label>Cantidad (Unidades)</label>
                            <input type="number" id="p-qty" value="20" class="input-field">
                        </div>
                        <div class="input-group">
                            <label>Peso/Envase (g)</label>
                            <input type="number" id="p-weight" value="180" class="input-field">
                        </div>
                    </div>

                    <div style="margin-top:20px; padding:15px; background:#f0f9ff; border-radius:10px; border:1px solid #bae6fd;">
                        <p style="margin:0; font-size:0.9rem; color:#0369a1;">Masa Total a Amasar:</p>
                        <h2 id="total-mass-display" style="margin:5px 0; color:#0c4a6e;">0g</h2>
                    </div>

                    <div style="margin-top:20px;">
                        <label><b>📦 Empaque y Toppings Extra</b></label>
                        <div id="extra-rows" style="margin-top:10px;"></div>
                        <button type="button" id="add-extra" class="btn-secondary" style="width:100%; margin-top:10px;">+ Añadir Envase o Topping</button>
                    </div>

                    <button id="btn-save-prod" class="btn-primary" style="width:100%; margin-top:25px; padding:15px;">
                        ✅ Registrar en Bitácora de Producción
                    </button>
                </div>

                <div class="stat-card" id="weighing-sheet">
                    <div style="text-align:center; padding:50px; color:#94a3b8;">
                        <p>Selecciona una receta para ver la fórmula panadera desglosada.</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    setupProductionLogic();
}

async function setupProductionLogic() {
    const recipeSelect = document.getElementById('p-recipe');
    const qtyInput = document.getElementById('p-qty');
    const weightInput = document.getElementById('p-weight');
    const massDisplay = document.getElementById('total-mass-display');
    const weighingSheet = document.getElementById('weighing-sheet');
    const extraRowsContainer = document.getElementById('extra-rows');
    const btnAddExtra = document.getElementById('add-extra');
    const btnSaveProd = document.getElementById('btn-save-prod');

    // Cargar datos de Supabase
    const { data: recipes } = await supabase.from('recipes').select('*, recipe_ingredients(*, ingredients(*))');
    const { data: allIngs } = await supabase.from('ingredients').select('*').order('name');

    // Llenar select de recetas
    recipes.forEach(r => {
        recipeSelect.innerHTML += `<option value="${r.id}">${r.nombre}</option>`;
    });

    const calculateFormula = () => {
        const recipe = recipes.find(r => r.id === recipeSelect.value);
        if (!recipe) return;

        const qty = parseInt(qtyInput.value) || 0;
        const weightPerUnit = parseFloat(weightInput.value) || 0;
        const totalMassRequired = qty * weightPerUnit;

        massDisplay.innerText = `${(totalMassRequired / 1000).toFixed(2)} kg`;

        const totalPercentage = recipe.recipe_ingredients.reduce((acc, ri) => acc + parseFloat(ri.porcentaje_panadero || 0), 0);
        const harinaBaseWeight = totalMassRequired / (totalPercentage / 100);

        let html = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h3>📋 Hoja de Pesaje: ${recipe.nombre}</h3>
                <span style="background:#fef3c7; color:#92400e; padding:4px 8px; border-radius:5px; font-size:0.8rem; font-weight:bold;">Fermentación sugerida: 24h</span>
            </div>
            <table style="width:100%; margin-top:15px; border-collapse: collapse;">
                <thead>
                    <tr style="text-align:left; border-bottom:2px solid #e2e8f0; color:#64748b;">
                        <th style="padding:10px 0;">Ingrediente</th>
                        <th>%</th>
                        <th style="text-align:right;">Peso</th>
                    </tr>
                </thead>
                <tbody>
        `;

        recipe.recipe_ingredients.forEach(ri => {
            const ingredientWeight = (harinaBaseWeight * ri.porcentaje_panadero) / 100;
            html += `
                <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:12px 0;"><b>${ri.ingredients.name}</b></td>
                    <td>${ri.porcentaje_panadero}%</td>
                    <td style="text-align:right;"><b>${ingredientWeight.toFixed(1)}g</b></td>
                </tr>
            `;
        });

        const extraRows = document.querySelectorAll('.extra-item-row');
        if(extraRows.length > 0) {
            html += `<tr style="background:#f8fafc;"><td colspan="3" style="padding:10px; font-weight:bold; color:#8b5cf6;">Extras / Toppings</td></tr>`;
            extraRows.forEach(row => {
                const ingId = row.querySelector('.extra-select').value;
                const cant = row.querySelector('.extra-qty').value;
                const ing = allIngs.find(i => i.id === ingId);
                if(ing) {
                    html += `<tr><td style="padding:10px 0;">${ing.name}</td><td>-</td><td style="text-align:right;"><b>${cant} ${ing.unit_type === 'peso' ? 'g' : 'u'}</b></td></tr>`;
                }
            });
        }

        html += `</tbody></table>`;
        weighingSheet.innerHTML = html;
    };

    btnAddExtra.onclick = () => {
        const row = document.createElement('div');
        row.className = 'extra-item-row';
        row.style = "display:grid; grid-template-columns: 1fr 80px 40px; gap:10px; margin-bottom:10px; background:#f8fafc; padding:8px; border-radius:8px; border-left:4px solid #8b5cf6;";
        
        const elaborados = allIngs.filter(i => i.tipo_suministro === 'elaborado');
        const materias = allIngs.filter(i => i.tipo_suministro !== 'elaborado');

        row.innerHTML = `
            <select class="input-field extra-select">
                <option value="">-- Seleccionar --</option>
                <optgroup label="⭐ ELABORADOS">
                    ${elaborados.map(i => `<option value="${i.id}">${i.name}</option>`).join('')}
                </optgroup>
                <optgroup label="📦 MATERIAS/ENVASES">
                    ${materias.map(i => `<option value="${i.id}">${i.name}</option>`).join('')}
                </optgroup>
            </select>
            <input type="number" class="input-field extra-qty" placeholder="Cant.">
            <button class="btn-danger remove-extra">×</button>
        `;

        row.querySelector('.remove-extra').onclick = () => { row.remove(); calculateFormula(); };
        row.querySelectorAll('input, select').forEach(el => el.oninput = calculateFormula);
        extraRowsContainer.appendChild(row);
    };

    // LÓGICA DE GUARDADO EN BITÁCORA
    btnSaveProd.onclick = async () => {
        const recipeSelect = document.getElementById('p-recipe');
        const qty = parseInt(qtyInput.value);
        const weight = parseFloat(weightInput.value);

        if (!recipeSelect.value || isNaN(qty) || qty <= 0) {
            alert("Por favor, selecciona una receta y cantidad válida.");
            return;
        }

        const logData = {
            receta_nombre: recipeSelect.options[recipeSelect.selectedIndex].text,
            unidades_producidas: qty,
            peso_por_unidad: weight,
            masa_total_kg: (qty * weight) / 1000,
            toppings_detalles: []
        };

        const extraRows = document.querySelectorAll('.extra-item-row');
        extraRows.forEach(row => {
            const select = row.querySelector('.extra-select');
            const cant = row.querySelector('.extra-qty').value;
            if (select.value && cant) {
                logData.toppings_detalles.push({
                    nombre: select.options[select.selectedIndex].text,
                    cantidad: cant
                });
            }
        });

        btnSaveProd.disabled = true;
        btnSaveProd.innerText = "💾 Guardando...";

        try {
            const { error } = await supabase.from('production_logs').insert([logData]);
            if (error) throw error;

            alert(`✅ Bitácora guardada con éxito para ${logData.unidades_producidas} unidades de ${logData.receta_nombre}.`);
            extraRowsContainer.innerHTML = '';
            calculateFormula();
        } catch (err) {
            alert("Error al guardar bitácora: " + err.message);
        } finally {
            btnSaveProd.disabled = false;
            btnSaveProd.innerText = "✅ Registrar en Bitácora de Producción";
        }
    };

    recipeSelect.onchange = calculateFormula;
    qtyInput.oninput = calculateFormula;
    weightInput.oninput = calculateFormula;
    calculateFormula();
}