import { supabase } from '../supabase.js';

let currentItems = [];
let editingRecipeId = null;
let cachedInputs = [];

export async function loadRecipes() {
    // 1. CARGA PRIORITARIA: Traemos insumos y sub-recetas antes de renderizar
    const { data: allInputs, error: inputError } = await supabase
        .from('v_unified_inputs')
        .select('*')
        .order('name');
    
    if (inputError) console.error("Error cargando insumos:", inputError);
    cachedInputs = allInputs || [];
    
    const container = document.getElementById('app-content');

    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
        .recipe-layout { display: grid; grid-template-columns: 1fr 1.2fr; gap: 25px; }
        .stat-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .input-field { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; box-sizing: border-box; }
        .btn-primary { width: 100%; padding: 12px; border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer; transition: 0.3s; }
        .row-item { border-bottom: 1px solid #f1f5f9; }
        .badge-receta { background: #fef9c3; color: #854d0e; padding: 2px 5px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; margin-right: 5px; }
        @media (max-width: 850px) { .recipe-layout { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(styleTag);

    container.innerHTML = `
        <div class="main-container">
            <header style="margin-bottom:20px;">
                <h1>📜 Recetario Maestro</h1>
                <p>Gestiona fórmulas y sub-preparaciones con costos automáticos.</p>
            </header>

            <div class="recipe-layout">
                <div id="panel-form" class="stat-card">
                    <h3 id="form-title">Nueva Fórmula</h3>
                    
                    <div style="margin-bottom:15px;">
                        <label style="display:block; font-size:0.8rem; font-weight:bold; margin-bottom:5px;">Nombre de la preparación</label>
                        <input type="text" id="r-name" class="input-field" placeholder="Ej: Tomates Confitados">
                    </div>
                    
                    <div style="margin-bottom:15px;">
                        <label style="display:block; font-size:0.8rem; font-weight:bold; margin-bottom:5px;">Método de Costeo</label>
                        <select id="r-tipo" class="input-field">
                            <option value="panadera">Fórmula Panadera (%)</option>
                            <option value="estandar">Receta Estándar (g/und)</option>
                        </select>
                    </div>

                    <div id="section-estandar" style="display:none; background:#f0fdf4; padding:12px; border-radius:8px; margin-bottom:15px;">
                        <label style="display:block; font-size:0.8rem; font-weight:bold; color:#166534;">Peso Final Esperado (g)</label>
                        <input type="number" id="r-peso-final" class="input-field" placeholder="Ej: 500">
                    </div>

                    <hr style="opacity:0.1; margin:20px 0;">
                    
                    <div style="display:grid; grid-template-columns: 1.5fr 0.8fr 0.5fr; gap:10px; align-items: end;">
                        <div>
                            <label style="font-size:0.7rem; color:#64748b;">Insumo / Receta</label>
                            <select id="r-select-ing" class="input-field">
                                <option value="">-- Seleccionar --</option>
                                ${cachedInputs.map(i => `
                                    <option value="${i.id}" data-precio="${i.precio}" data-tipo="${i.tipo}">
                                        ${i.tipo === 'receta' ? '⭐ ' : ''}${i.name}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        <div>
                            <label style="font-size:0.7rem; color:#64748b;">Cantidad</label>
                            <input type="number" id="r-valor" class="input-field" placeholder="0">
                        </div>
                        <button id="btn-add-item" class="btn-primary" style="background:#0284c7; height:40px;">+</button>
                    </div>

                    <table style="width:100%; margin-top:20px; font-size:0.85rem; border-collapse:collapse;">
                        <tbody id="recipe-items-body"></tbody>
                    </table>

                    <div id="summary-box" style="margin-top:20px; padding:15px; background:#0f172a; color:#fff; border-radius:10px; display:none;">
                        <div style="display:flex; justify-content:space-between;">
                            <span>Costo Base Estimado:</span>
                            <strong id="total-cost" style="color:#4ade80;">$0.00</strong>
                        </div>
                    </div>

                    <textarea id="r-pasos" class="input-field" style="margin-top:20px; min-height:80px;" placeholder="Instrucciones de preparación..."></textarea>
                    
                    <div style="display:flex; gap:10px; margin-top:20px;">
                        <button id="btn-cancel-edit" class="btn-primary" style="background:#64748b; display:none; flex:1;">Cancelar</button>
                        <button id="btn-save-recipe" class="btn-primary" style="flex:2; background:#10b981; display:none;">💾 Guardar Receta</button>
                    </div>
                </div>

                <div class="stat-card">
                    <h3>Recetas Registradas</h3>
                    <div id="recipes-list" style="margin-top:15px;">Cargando lista...</div>
                </div>
            </div>
        </div>
    `;

    setupRecipeLogic();
    renderRecipesList();
}

function setupRecipeLogic() {
    const rTipo = document.getElementById('r-tipo');
    
    rTipo.onchange = (e) => {
        document.getElementById('section-estandar').style.display = e.target.value === 'estandar' ? 'block' : 'none';
        renderTable();
    };

    document.getElementById('btn-add-item').onclick = () => {
        const select = document.getElementById('r-select-ing');
        const opt = select.options[select.selectedIndex];
        const val = parseFloat(document.getElementById('r-valor').value);
        
        if(!select.value || isNaN(val)) return;

        currentItems.push({
            id: select.value,
            name: opt.text.replace('⭐ ', '').trim(),
            precio: parseFloat(opt.getAttribute('data-precio')),
            tipo: opt.getAttribute('data-tipo'),
            valor: val
        });
        renderTable();
        document.getElementById('r-valor').value = "";
        select.value = "";
    };

    document.getElementById('btn-save-recipe').onclick = async () => {
        const name = document.getElementById('r-name').value;
        if(!name || currentItems.length === 0) return alert("Faltan datos obligatorios.");

        const payload = {
            name,
            tipo_receta: rTipo.value,
            peso_final_esperado: parseFloat(document.getElementById('r-peso-final').value) || 0,
            pasos_preparacion: document.getElementById('r-pasos').value
        };

        try {
            let recipeId = editingRecipeId;
            if(editingRecipeId) {
                await supabase.from('recipes').update(payload).eq('id', editingRecipeId);
                await supabase.from('recipe_items').delete().eq('recipe_id', editingRecipeId);
            } else {
                const { data, error } = await supabase.from('recipes').insert([payload]).select().single();
                if(error) throw error;
                recipeId = data.id;
            }

            const items = currentItems.map(item => ({
                recipe_id: recipeId,
                ingredient_id: item.tipo === 'ingrediente' ? item.id : null,
                sub_recipe_id: item.tipo === 'receta' ? item.id : null,
                quantity: item.valor
            }));

            const { error: itemError } = await supabase.from('recipe_items').insert(items);
            if(itemError) throw itemError;

            alert("✅ Receta guardada correctamente.");
            resetRecipeForm();
            loadRecipes(); 
        } catch (e) {
            alert("Error al guardar: " + e.message);
        }
    };

    document.getElementById('btn-cancel-edit').onclick = resetRecipeForm;
}

function renderTable() {
    const isPan = document.getElementById('r-tipo').value === 'panadera';
    let total = 0;
    const body = document.getElementById('recipe-items-body');

    body.innerHTML = currentItems.map((item, idx) => {
        const costo = isPan ? (item.valor * 10 * item.precio) : (item.valor * item.precio);
        total += costo;
        return `
        <tr class="row-item">
            <td style="padding:10px 0;">
                ${item.tipo === 'receta' ? '<span class="badge-receta">RECETA</span>' : ''}${item.name}
            </td>
            <td align="center">${item.valor}${isPan ? '%' : 'g'}</td>
            <td align="right" style="color:#10b981; font-weight:bold;">$${costo.toFixed(2)}</td>
            <td align="right">
                <button onclick="removeRecipeItem(${idx})" style="border:none; background:none; cursor:pointer; color:#ef4444; font-weight:bold;">✕</button>
            </td>
        </tr>`;
    }).join('');

    document.getElementById('total-cost').innerText = `$${total.toFixed(2)}`;
    document.getElementById('summary-box').style.display = currentItems.length > 0 ? 'block' : 'none';
    document.getElementById('btn-save-recipe').style.display = currentItems.length > 0 ? 'block' : 'none';
}

window.removeRecipeItem = (idx) => {
    currentItems.splice(idx, 1);
    renderTable();
};

async function renderRecipesList() {
    const { data: recipes } = await supabase.from('recipes').select('*').order('name');
    const { data: costs } = await supabase.from('v_production_costs').select('*');
    const listDiv = document.getElementById('recipes-list');

    if(!recipes || recipes.length === 0) {
        listDiv.innerHTML = "<p style='color:#64748b;'>No hay recetas registradas.</p>";
        return;
    }

    listDiv.innerHTML = recipes.map(r => {
        const c = costs?.find(x => x.recipe_id === r.id);
        return `
        <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:15px; border-radius:10px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <b style="color:#0f172a; font-size:1rem;">${r.name}</b><br>
                <small style="color:#64748b;">
                    Costo: $${(c?.basic_ingredients_cost || 0).toFixed(2)} | 
                    BE: $${(c?.breakeven_price || 0).toFixed(2)}
                </small>
            </div>
            <div style="display:flex; gap:8px;">
                <button class="btn-primary" style="padding:8px 12px; background:#e2e8f0; color:#0f172a; width:auto;" onclick="editRecipe('${r.id}')">✏️</button>
                <button class="btn-primary" style="padding:8px 12px; background:#fee2e2; color:#be123c; width:auto;" onclick="deleteRecipe('${r.id}')">🗑️</button>
            </div>
        </div>`;
    }).join('');
}

window.editRecipe = async (id) => {
    try {
        // 1. Cargamos la receta base
        const { data: r, error: rError } = await supabase
            .from('recipes')
            .select('*')
            .eq('id', id)
            .single();
        
        if (rError) throw new Error("No se encontró la receta base.");

        // 2. Cargamos los items de esa receta
        const { data: items, error: iError } = await supabase
            .from('recipe_items')
            .select('*')
            .eq('recipe_id', id);

        if (iError) throw new Error("Error cargando los ingredientes de la receta.");

        // 3. Llenamos el formulario
        editingRecipeId = id;
        document.getElementById('r-name').value = r.name;
        document.getElementById('r-tipo').value = r.tipo_receta;
        document.getElementById('r-pasos').value = r.pasos_preparacion || "";
        document.getElementById('r-peso-final').value = r.peso_final_esperado || "";
        document.getElementById('section-estandar').style.display = r.tipo_receta === 'estandar' ? 'block' : 'none';
        
        document.getElementById('btn-cancel-edit').style.display = "block";
        document.getElementById('form-title').innerText = "📝 Editando: " + r.name;

        // 4. Mapeamos los items usando el caché que ya tenemos
        currentItems = items.map(ri => {
            const inputId = ri.ingredient_id || ri.sub_recipe_id;
            const inp = cachedInputs.find(i => i.id === inputId);
            
            return {
                id: inputId,
                name: inp ? inp.name : "Insumo no encontrado",
                precio: inp ? inp.precio : 0,
                tipo: ri.ingredient_id ? 'ingrediente' : 'receta',
                valor: ri.quantity
            };
        });
        
        renderTable();
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
        console.error("Error completo:", err);
        alert("⚠️ Error: " + err.message + " Revisa la consola para más detalles.");
    }
};

window.deleteRecipe = async (id) => {
    if(confirm("¿Estás seguro? Se eliminarán también los ingredientes asociados a esta receta.")) {
        const { error } = await supabase.from('recipes').delete().eq('id', id);
        if(!error) loadRecipes();
        else alert("Error: " + error.message);
    }
};

function resetRecipeForm() {
    editingRecipeId = null;
    currentItems = [];
    document.getElementById('r-name').value = "";
    document.getElementById('r-pasos').value = "";
    document.getElementById('r-peso-final').value = "";
    document.getElementById('form-title').innerText = "Nueva Fórmula";
    document.getElementById('btn-cancel-edit').style.display = "none";
    document.getElementById('section-estandar').style.display = "none";
    document.getElementById('summary-box').style.display = "none";
    document.getElementById('btn-save-recipe').style.display = "none";
    renderTable();
}