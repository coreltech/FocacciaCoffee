import { supabase } from '../supabase.js';

let currentRecipeId = null;

export async function loadRecipes() {
    const container = document.getElementById('app-content');
    container.innerHTML = `
        <div class="main-container">
            <header class="header-flex">
                <div>
                    <h1>👩‍🍳 Fórmulas de Producción</h1>
                    <p style="color: #64748b;">Costeo y manual de elaboración</p>
                </div>
                <button class="btn-primary" id="btn-nueva-receta">+ Crear Nueva Receta</button>
            </header>
            
            <div id="recipes-grid" class="main-grid"></div>
        </div>

        <div id="modal-recipe" class="modal-overlay" style="display:none;">
            <div class="modal-card" style="width: 700px; max-height: 95vh; overflow-y: auto;">
                <h3 id="modal-title">🛠️ Configurar Ficha Técnica</h3>
                <form id="recipe-form">
                    <div class="input-group">
                        <label>Nombre de la Variedad</label>
                        <input type="text" id="r-nombre" class="input-field" placeholder="Ej: Focaccia de Romero" required>
                    </div>
                    
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                        <div class="input-group">
                            <label>Precio de Venta (USD $)</label>
                            <input type="number" id="r-precio" step="0.01" class="input-field" required>
                        </div>
                        <div class="input-group" style="background: #f0f9ff; padding: 5px 10px; border-radius: 8px; border: 1px solid #bae6fd;">
                            <label style="color: #0369a1;"><b>Rendimiento (Unid.)</b></label>
                            <input type="number" id="r-rendimiento" class="input-field" value="1" required>
                        </div>
                    </div>

                    <div style="margin-top:15px; padding: 15px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <label><b>📝 Instrucciones de Elaboración</b></label>
                        <textarea id="r-instrucciones" class="input-field" style="height: 100px; margin-top:8px; font-family: inherit; resize: vertical;" placeholder="1. Mezclar harina con agua... 2. Dejar fermentar 24h..."></textarea>
                    </div>

                    <div style="margin-top:20px; padding: 15px; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <label><b>🧂 Ingredientes para el LOTE</b></label>
                        <div id="ingredients-rows" style="margin-top:10px;"></div>
                        <button type="button" id="add-row" class="btn-secondary" style="width:100%; margin-top:10px;">+ Vincular Insumo</button>
                    </div>

                    <div class="modal-footer" style="margin-top:25px; display:flex; gap:10px;">
                        <button type="button" class="btn-primary" id="close-modal-r" style="background:#64748b;">Cancelar</button>
                        <button type="submit" class="btn-primary" style="flex:1;">Guardar Ficha Técnica</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    setupEvents();
    renderRecipes();
}

async function renderRecipes() {
    const { data: recipes, error } = await supabase.from('recipes').select(`
        *,
        recipe_ingredients (
            ingredient_id,
            cantidad_necesaria,
            ingredients (name, costo_unidad_medida, unit_type)
        )
    `).order('nombre');

    if (error) return;

    const grid = document.getElementById('recipes-grid');
    grid.innerHTML = recipes.map(r => {
        const costoLote = r.recipe_ingredients.reduce((acc, ri) => acc + (ri.cantidad_necesaria * (ri.ingredients?.costo_unidad_medida || 0)), 0);
        const costoUnit = costoLote / (r.rendimiento || 1);
        const margen = r.precio_venta_usd > 0 ? ((r.precio_venta_usd - costoUnit) / r.precio_venta_usd * 100).toFixed(1) : 0;

        const listaIng = r.recipe_ingredients.map(ri => `• ${ri.ingredients?.name}: ${ri.cantidad_necesaria} ${ri.ingredients?.unit_type === 'peso' ? 'g' : 'ml'}`).join('<br>');

        return `
            <div class="stat-card">
                <div style="display:flex; justify-content:space-between;">
                    <div>
                        <h3 style="margin:0;">${r.nombre}</h3>
                        <span class="badge" style="background:#e0f2fe; color:#0369a1; margin-top:5px;">Rinde: ${r.rendimiento} u.</span>
                    </div>
                    <div>
                        <button onclick='editRecipe(${JSON.stringify(r)})' style="border:none; background:none; cursor:pointer;">✏️</button>
                        <button onclick="deleteRecipe('${r.id}')" style="border:none; background:none; cursor:pointer;">🗑️</button>
                    </div>
                </div>
                
                <div style="margin:15px 0; border-left: 4px solid #ef4444; padding-left:10px;">
                    <small>COSTO UNITARIO</small>
                    <div style="font-size:1.4rem; font-weight:bold; color:#b91c1c;">$${costoUnit.toFixed(2)}</div>
                </div>

                <details style="margin-bottom: 10px; background:#f1f5f9; padding:8px; border-radius:8px;">
                    <summary style="font-size: 0.85rem; font-weight: bold; cursor:pointer;">📖 Ver Ingredientes e Instrucciones</summary>
                    <div style="font-size: 0.8rem; padding-top:10px;">
                        <strong>Insumos:</strong><br>${listaIng || 'Ninguno'}<br><br>
                        <strong>Pasos:</strong><br>${r.instrucciones || '<i>No hay instrucciones registradas.</i>'}
                    </div>
                </details>

                <div style="display:flex; justify-content:space-between; font-size:0.8rem; padding-top:10px; border-top:1px solid #eee;">
                    <span>Utilidad: <b>$${(r.precio_venta_usd - costoUnit).toFixed(2)}</b></span>
                    <span style="color:#10b981;"><b>${margen}% Margen</b></span>
                </div>
            </div>
        `;
    }).join('');
}

window.editRecipe = async (recipe) => {
    currentRecipeId = recipe.id;
    document.getElementById('modal-title').innerText = "✏️ Editar Ficha";
    document.getElementById('r-nombre').value = recipe.nombre;
    document.getElementById('r-precio').value = recipe.precio_venta_usd;
    document.getElementById('r-rendimiento').value = recipe.rendimiento;
    document.getElementById('r-instrucciones').value = recipe.instrucciones || '';
    
    const container = document.getElementById('ingredients-rows');
    container.innerHTML = '';
    for (const ri of recipe.recipe_ingredients) {
        await addRow(ri.ingredient_id, ri.cantidad_necesaria);
    }
    document.getElementById('modal-recipe').style.display = 'flex';
};

async function addRow(selectedId = '', quantity = '') {
    const { data: ings } = await supabase.from('ingredients').select('id, name, unit_type');
    const container = document.getElementById('ingredients-rows');
    const div = document.createElement('div');
    div.className = 'ingredient-row';
    div.style = "display:grid; grid-template-columns: 2fr 1fr 40px; gap:8px; margin-bottom:5px;";
    div.innerHTML = `
        <select class="ing-select input-field">
            ${ings.map(i => `<option value="${i.id}" ${i.id === selectedId ? 'selected' : ''}>${i.name}</option>`).join('')}
        </select>
        <input type="number" step="0.001" class="ing-qty input-field" value="${quantity}" placeholder="Cant.">
        <button type="button" onclick="this.parentElement.remove()" style="border:none; background:none; cursor:pointer;">❌</button>
    `;
    container.appendChild(div);
}

async function saveRecipe(e) {
    e.preventDefault();
    const recipeData = {
        nombre: document.getElementById('r-nombre').value,
        precio_venta_usd: document.getElementById('r-precio').value,
        rendimiento: parseInt(document.getElementById('r-rendimiento').value),
        instrucciones: document.getElementById('r-instrucciones').value
    };

    let recipeId = currentRecipeId;
    if (currentRecipeId) {
        await supabase.from('recipes').update(recipeData).eq('id', currentRecipeId);
        await supabase.from('recipe_ingredients').delete().eq('recipe_id', currentRecipeId);
    } else {
        const { data } = await supabase.from('recipes').insert([recipeData]).select();
        recipeId = data[0].id;
    }

    const rows = document.querySelectorAll('.ingredient-row');
    const links = Array.from(rows).map(row => ({
        recipe_id: recipeId,
        ingredient_id: row.querySelector('.ing-select').value,
        cantidad_necesaria: parseFloat(row.querySelector('.ing-qty').value)
    }));

    if (links.length > 0) await supabase.from('recipe_ingredients').insert(links);
    
    document.getElementById('modal-recipe').style.display = 'none';
    currentRecipeId = null;
    renderRecipes();
}

function setupEvents() {
    document.getElementById('btn-nueva-receta').onclick = () => {
        currentRecipeId = null;
        document.getElementById('recipe-form').reset();
        document.getElementById('ingredients-rows').innerHTML = '';
        document.getElementById('modal-recipe').style.display='flex';
    };
    document.getElementById('close-modal-r').onclick = () => document.getElementById('modal-recipe').style.display='none';
    document.getElementById('add-row').onclick = () => addRow();
    document.getElementById('recipe-form').onsubmit = saveRecipe;
}