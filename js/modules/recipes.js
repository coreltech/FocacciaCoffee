import { supabase } from '../supabase.js';

let currentItems = [];
let editingRecipeId = null;

export async function loadRecipes() {
    const { data: allIngredients } = await supabase.from('ingredients').select('*').order('name');
    const container = document.getElementById('app-content');

    // Inyectamos el CSS responsivo directamente para asegurar compatibilidad
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
        .recipe-layout { display: grid; grid-template-columns: 1fr 1.2fr; gap: 25px; }
        .mobile-tabs { display: none; margin-bottom: 20px; gap: 10px; }
        .tab-btn { flex: 1; padding: 15px; border: none; border-radius: 10px; background: #e2e8f0; font-weight: bold; cursor: pointer; color: #64748b; transition: 0.3s; }
        .tab-btn.active { background: #0284c7; color: white; }
        
        @media (max-width: 850px) {
            .recipe-layout { grid-template-columns: 1fr; }
            .mobile-tabs { display: flex; }
            .section-panel { display: none; }
            .section-panel.active { display: block; }
            .ing-input-row { grid-template-columns: 1fr !important; }
            .btn-mobile-full { width: 100% !important; height: 45px !important; margin-top: 10px; }
            .recipe-card-actions { gap: 12px !important; }
            .recipe-card-actions button { padding: 12px !important; font-size: 1.3rem !important; }
        }
    `;
    document.head.appendChild(styleTag);

    container.innerHTML = `
        <div class="main-container">
            <header style="margin-bottom:20px;">
                <h1>📜 Recetario y Procedimientos</h1>
                <p style="color:#64748b;">Administra tus fórmulas panaderas y métodos de preparación.</p>
            </header>

            <div class="mobile-tabs">
                <button class="tab-btn active" id="btn-tab-form" onclick="switchRecipeTab('form')">📝 Cargar</button>
                <button class="tab-btn" id="btn-tab-list" onclick="switchRecipeTab('list')">📂 Lista</button>
            </div>

            <div class="recipe-layout">
                <div id="panel-form" class="stat-card section-panel active">
                    <h3 id="form-title">Crear Nueva Receta</h3>
                    <div class="input-group">
                        <label>Nombre de la preparación</label>
                        <input type="text" id="r-name" class="input-field" placeholder="Ej: Focaccia Tradicional">
                    </div>
                    
                    <div class="input-group">
                        <label>Método de Costeo</label>
                        <select id="r-tipo" class="input-field">
                            <option value="panadera">Fórmula Panadera (% sobre Harina)</option>
                            <option value="estandar">Receta Estándar (Gramos/Unidades)</option>
                        </select>
                    </div>

                    <div id="section-estandar" style="display:none; background:#f0fdf4; padding:12px; border-radius:8px; margin-bottom:15px; border:1px solid #bbf7d0;">
                        <label style="font-size:0.8rem; font-weight:bold; color:#166534;">Peso Final del Proceso (g)</label>
                        <input type="number" id="r-peso-final" class="input-field" placeholder="Ej: 450">
                    </div>

                    <hr style="margin:20px 0; opacity:0.1;">
                    
                    <h4>1. Ingredientes</h4>
                    <div class="ing-input-row" style="display:grid; grid-template-columns: 1.5fr 0.8fr 0.8fr; gap:10px; align-items: end;">
                        <div class="input-group" style="margin:0;">
                            <label style="font-size:0.7rem; color:#64748b;">Insumo</label>
                            <select id="r-select-ing" class="input-field" style="padding: 10px; font-size: 0.85rem;">
                                <option value="">-- Seleccionar --</option>
                                ${allIngredients.map(i => `<option value="${i.id}">${i.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="input-group" style="margin:0;">
                            <label style="font-size:0.7rem; color:#64748b;">Cant.</label>
                            <input type="number" id="r-valor" class="input-field" style="padding: 10px; font-size: 0.85rem;" placeholder="0">
                        </div>
                        <button id="btn-add-item" class="btn-primary btn-mobile-full" style="background:#0284c7; height:34px; font-size:0.8rem; font-weight:bold; display:flex; align-items:center; justify-content:center; gap:5px; cursor:pointer; padding: 0 10px; border-radius: 6px;">
                            <span>➕</span> Añadir
                        </button>
                    </div>

                    <div style="overflow-x: auto;">
                        <table style="width:100%; margin-top:20px; font-size:0.85rem; border-collapse:collapse; min-width:300px;">
                            <thead id="table-head" style="background:#f8fafc; border-bottom:2px solid #e2e8f0;"></thead>
                            <tbody id="recipe-items-body"></tbody>
                        </table>
                    </div>

                    <div id="summary-box" style="margin-top:20px; padding:15px; background:#0f172a; color:#fff; border-radius:10px; display:none;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span id="label-costo" style="font-size:0.9rem; opacity:0.8;">Costo Ref:</span>
                            <span id="total-cost" style="color:#4ade80; font-weight:bold; font-size:1.3rem;">$0.00</span>
                        </div>
                    </div>

                    <h4 style="margin-top:25px;">2. Pasos de Preparación</h4>
                    <textarea id="r-pasos" class="input-field" style="min-height:120px; font-family:sans-serif; padding:10px;" placeholder="Describe el proceso paso a paso..."></textarea>
                    
                    <div style="display:flex; gap:10px; margin-top:20px;">
                        <button id="btn-cancel-edit" class="btn-primary" style="background:#64748b; display:none; cursor:pointer;">Cancelar</button>
                        <button id="btn-save-recipe" class="btn-primary" style="flex:1; background:#10b981; display:none; cursor:pointer;">💾 Guardar Receta</button>
                    </div>
                </div>

                <div id="panel-list" class="stat-card section-panel">
                    <h3>Recetas Guardadas</h3>
                    <div id="recipes-list" style="display:grid; gap:10px;"></div>
                </div>
            </div>
        </div>
    `;

    // Función interna para el cambio de pestañas en móvil
    window.switchRecipeTab = (target) => {
        const pForm = document.getElementById('panel-form');
        const pList = document.getElementById('panel-list');
        const tForm = document.getElementById('btn-tab-form');
        const tList = document.getElementById('btn-tab-list');

        if(target === 'form') {
            pForm.classList.add('active'); pList.classList.remove('active');
            tForm.classList.add('active'); tList.classList.remove('active');
        } else {
            pForm.classList.remove('active'); pList.classList.add('active');
            tForm.classList.remove('active'); tList.classList.add('active');
        }
    };

    setupEvents(allIngredients);
    renderRecipesList();
}

// --- TODA TU LÓGICA ORIGINAL SE MANTIENE INTACTA ---

function setupEvents(allIngredients) {
    const rTipo = document.getElementById('r-tipo');
    const secEst = document.getElementById('section-estandar');
    const btnAdd = document.getElementById('btn-add-item');
    const btnSave = document.getElementById('btn-save-recipe');
    const btnCancel = document.getElementById('btn-cancel-edit');

    rTipo.onchange = () => {
        secEst.style.display = rTipo.value === 'estandar' ? 'block' : 'none';
        if (!editingRecipeId) { currentItems = []; renderTable(); }
    };

    btnAdd.onclick = () => {
        const select = document.getElementById('r-select-ing');
        const id = select.value;
        const valor = parseFloat(document.getElementById('r-valor').value);
        if(!id || !valor) return;
        const ing = allIngredients.find(i => i.id === id);
        currentItems.push({ id: ing.id, name: ing.name, costo_base_usd_unidad_minima: ing.costo_base_usd_unidad_minima, valor });
        renderTable();
        document.getElementById('r-valor').value = "";
        select.value = ""; select.focus();
    };

    btnCancel.onclick = () => { resetForm(); };

    btnSave.onclick = async () => {
        const name = document.getElementById('r-name').value;
        const tipo = rTipo.value;
        const pesoFinal = parseFloat(document.getElementById('r-peso-final').value) || 0;
        const pasos = document.getElementById('r-pasos').value;
        if(!name || currentItems.length === 0) return alert("Faltan datos.");
        let recipeId = editingRecipeId;

        if (editingRecipeId) {
            await supabase.from('recipes').update({ name, tipo_receta: tipo, peso_final_esperado: pesoFinal, pasos_preparacion: pasos }).eq('id', editingRecipeId);
            await supabase.from('recipe_ingredients').delete().eq('recipe_id', editingRecipeId);
        } else {
            const { data, error } = await supabase.from('recipes').insert([{ name, tipo_receta: tipo, peso_final_esperado: pesoFinal, pasos_preparacion: pasos }]).select().single();
            if(error) return alert("Error al crear receta");
            recipeId = data.id;
        }

        const insIngredients = currentItems.map(item => ({ recipe_id: recipeId, ingredient_id: item.id, cantidad_o_porcentaje: item.valor }));
        await supabase.from('recipe_ingredients').insert(insIngredients);
        alert("¡Receta guardada!");
        resetForm();
        renderRecipesList();
        // Si estamos en móvil, lo llevamos a la lista para ver el resultado
        if(window.innerWidth <= 850) switchRecipeTab('list');
    };
}

function renderTable() {
    const body = document.getElementById('recipe-items-body');
    const head = document.getElementById('table-head');
    const summary = document.getElementById('summary-box');
    const btnSave = document.getElementById('btn-save-recipe');
    const tipo = document.getElementById('r-tipo').value;
    const isPan = tipo === 'panadera';

    head.innerHTML = `<tr><th align="left" style="padding:10px;">Insumo</th><th align="center">Cant/%</th><th align="right">Costo</th><th align="right"></th></tr>`;

    let totalCostoTemp = 0;
    let totalPorcentaje = 0;

    body.innerHTML = currentItems.map((i, index) => {
        let costoItem = isPan ? (i.valor * 10 * i.costo_base_usd_unidad_minima) : (i.valor * i.costo_base_usd_unidad_minima);
        totalCostoTemp += costoItem;
        if(isPan) totalPorcentaje += i.valor;
        return `<tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:10px 0;">${i.name}</td>
            <td align="center">${i.valor}${isPan ? '%' : 'g'}</td>
            <td align="right" style="color:#10b981; font-weight:bold;">$${costoItem.toFixed(3)}</td>
            <td align="right"><button onclick="removeItem(${index})" style="background:none; border:none; cursor:pointer; font-size:1.1rem;">🗑️</button></td>
        </tr>`;
    }).join('');

    if (currentItems.length > 0) {
        summary.style.display = 'block'; btnSave.style.display = 'block';
        const costDisp = document.getElementById('total-cost');
        const label = document.getElementById('label-costo');
        if (isPan && totalPorcentaje > 0) {
            const costKg = (totalCostoTemp / totalPorcentaje) * 1000;
            label.innerText = "Costo/Kg Masa:"; costDisp.innerText = `$${costKg.toFixed(2)}`;
        } else {
            label.innerText = "Costo Total:"; costDisp.innerText = `$${totalCostoTemp.toFixed(2)}`;
        }
    } else { summary.style.display = 'none'; btnSave.style.display = 'none'; }
}

window.removeItem = (index) => { currentItems.splice(index, 1); renderTable(); };

async function renderRecipesList() {
    const { data: recipes } = await supabase.from('recipes').select(`*, recipe_ingredients (cantidad_o_porcentaje, ingredients (*))`);
    const list = document.getElementById('recipes-list');
    if(!recipes || recipes.length === 0) return list.innerHTML = "No hay recetas.";

    list.innerHTML = recipes.map(r => {
        let totalCosto = 0; let totalCantidad = 0;
        const isPan = r.tipo_receta === 'panadera';
        r.recipe_ingredients.forEach(ri => {
            const cant = ri.cantidad_o_porcentaje;
            const costoItem = isPan ? (cant * 10 * ri.ingredients.costo_base_usd_unidad_minima) : (cant * ri.ingredients.costo_base_usd_unidad_minima);
            totalCosto += costoItem; totalCantidad += cant;
        });
        const unidad = isPan ? '%' : 'g';

        return `
        <div style="background:#fff; border:1px solid #e2e8f0; padding:15px; border-radius:12px; margin-bottom:12px; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <div style="cursor:pointer; flex:1;" onclick="viewRecipeDetail('${r.id}')">
                    <strong style="font-size:1.1rem; color:#0f172a; display:block;">${r.name} 👁️</strong>
                    <div style="margin-top:5px;">
                        <span style="font-size:0.7rem; background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:10px; font-weight:bold; text-transform:uppercase; margin-right:8px;">${r.tipo_receta}</span>
                        <span style="font-size:0.8rem; color:#64748b;">Rendimiento: <b>${totalCantidad.toFixed(0)}${unidad}</b></span>
                    </div>
                </div>
                <div style="text-align:right; margin-right:15px;" class="desktop-only">
                    <div style="font-size:0.7rem; color:#64748b; text-transform:uppercase;">Costo Total</div>
                    <div style="font-size:1.2rem; font-weight:bold; color:#10b981;">$${totalCosto.toFixed(2)}</div>
                </div>
                <div style="display:flex; gap:5px;" class="recipe-card-actions">
                    <button onclick="duplicateRecipe('${r.id}')" title="Duplicar" style="background:#f0f9ff; border:none; border-radius:8px; padding:8px; cursor:pointer;">👯</button>
                    <button onclick="editRecipe('${r.id}')" title="Editar" style="background:#f1f5f9; border:none; border-radius:8px; padding:8px; cursor:pointer;">✏️</button>
                    <button onclick="deleteRecipe('${r.id}')" title="Eliminar" style="background:#fff1f2; border:none; border-radius:8px; padding:8px; cursor:pointer;">🗑️</button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

window.duplicateRecipe = async (id) => {
    const { data: r } = await supabase.from('recipes').select('*, recipe_ingredients(*)').eq('id', id).single();
    if(!r) return;
    const newName = prompt("Nombre para la copia:", r.name + " (Copia)");
    if(!newName) return;
    const { data: newRec } = await supabase.from('recipes').insert([{ name: newName, tipo_receta: r.tipo_receta, peso_final_esperado: r.peso_final_esperado, pasos_preparacion: r.pasos_preparacion }]).select().single();
    const newIngs = r.recipe_ingredients.map(ri => ({ recipe_id: newRec.id, ingredient_id: ri.ingredient_id, cantidad_o_porcentaje: ri.cantidad_o_porcentaje }));
    await supabase.from('recipe_ingredients').insert(newIngs);
    renderRecipesList();
};

window.editRecipe = async (id) => {
    const { data: r } = await supabase.from('recipes').select('*, recipe_ingredients(*, ingredients(*))').eq('id', id).single();
    editingRecipeId = id;
    document.getElementById('form-title').innerText = "Editando: " + r.name;
    document.getElementById('r-name').value = r.name;
    document.getElementById('r-tipo').value = r.tipo_receta;
    document.getElementById('r-pasos').value = r.pasos_preparacion || "";
    document.getElementById('r-peso-final').value = r.peso_final_esperado || "";
    document.getElementById('section-estandar').style.display = r.tipo_receta === 'estandar' ? 'block' : 'none';
    document.getElementById('btn-cancel-edit').style.display = "block";
    currentItems = r.recipe_ingredients.map(ri => ({ id: ri.ingredient_id, name: ri.ingredients.name, costo_base_usd_unidad_minima: ri.ingredients.costo_base_usd_unidad_minima, valor: ri.cantidad_o_porcentaje }));
    renderTable();
    if(window.innerWidth <= 850) switchRecipeTab('form');
};

window.deleteRecipe = async (id) => {
    if (confirm("¿Seguro que quieres borrar esta receta?")) {
        await supabase.from('recipes').delete().eq('id', id);
        renderRecipesList();
    }
};

function resetForm() {
    editingRecipeId = null; currentItems = [];
    document.getElementById('r-name').value = ""; document.getElementById('r-pasos').value = ""; document.getElementById('r-peso-final').value = "";
    document.getElementById('form-title').innerText = "Crear Nueva Receta";
    document.getElementById('btn-cancel-edit').style.display = "none";
    document.getElementById('section-estandar').style.display = "none";
    renderTable();
}

window.viewRecipeDetail = async (id) => {
    const { data: r } = await supabase.from('recipes').select('*, recipe_ingredients(*, ingredients(*))').eq('id', id).single();
    const overlay = document.createElement('div');
    overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:1000; padding:15px;";
    let totalCosto = 0;
    const modal = document.createElement('div');
    modal.style = "background:#fff; width:100%; max-width:600px; max-height:90vh; border-radius:15px; overflow-y:auto; padding:20px; position:relative;";
    const ingHtml = r.recipe_ingredients.map(ri => {
        const itemCost = (r.tipo_receta === 'panadera') ? (ri.cantidad_o_porcentaje * 10 * ri.ingredients.costo_base_usd_unidad_minima) : (ri.cantidad_o_porcentaje * ri.ingredients.costo_base_usd_unidad_minima);
        totalCosto += itemCost;
        return `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f1f5f9; font-size:0.9rem;"><span>${ri.ingredients.name} (${ri.cantidad_o_porcentaje}${r.tipo_receta === 'panadera' ? '%' : 'g'})</span><b>$${itemCost.toFixed(3)}</b></div>`;
    }).join('');

    modal.innerHTML = `
        <button onclick="this.parentElement.parentElement.remove()" style="position:absolute; top:15px; right:15px; border:none; background:none; font-size:1.5rem; cursor:pointer;">✕</button>
        <h3>${r.name}</h3>
        <div style="margin-bottom:20px;">${ingHtml}</div>
        <div style="background:#f8fafc; padding:15px; border-radius:10px; display:flex; justify-content:space-between; align-items:center;">
            <b>TOTAL</b><b style="color:#10b981; font-size:1.3rem;">$${totalCosto.toFixed(2)}</b>
        </div>
        <h4 style="margin-top:20px;">Procedimiento:</h4>
        <div style="white-space:pre-wrap; color:#334155; font-size:0.9rem; background:#fffbeb; padding:15px; border-radius:8px;">${r.pasos_preparacion || "Sin instrucciones."}</div>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
};