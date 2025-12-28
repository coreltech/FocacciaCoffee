import { supabase } from '../supabase.js';
import { convert } from '../core/currency.js';

export async function loadIngredients() {
    const container = document.getElementById('app-content');
    
    container.innerHTML = `
        <div class="main-container">
            <header class="header-flex">
                <div>
                    <h1>🥫 Almacén de Insumos</h1>
                    <p style="color: #64748b;">Control exacto por Gramos, Mililitros o Unidades</p>
                </div>
                <button class="btn-primary" id="btn-nuevo-ingrediente">+ Registrar Compra</button>
            </header>

            <div id="ing-grid" class="main-grid">
                <div class="stat-card">Cargando inventario...</div>
            </div>
        </div>

        <div id="modal-ing" class="modal-overlay" style="display:none;">
            <div class="modal-card">
                <h3>📦 Registro de Insumo</h3>
                <form id="ing-form">
                    <div class="input-group">
                        <label>Nombre del Insumo</label>
                        <input type="text" id="ing-name" class="input-field" placeholder="Ej: Levadura o Harina" required>
                    </div>
                    
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                        <div class="input-group">
                            <label>Cantidad</label>
                            <input type="number" id="ing-qty" step="0.01" class="input-field" required>
                        </div>
                        <div class="input-group">
                            <label>Unidad de Entrada</label>
                            <select id="ing-unit" class="input-field">
                                <optgroup label="Peso">
                                    <option value="kg">Kilogramos (kg)</option>
                                    <option value="g">Gramos (g)</option>
                                </optgroup>
                                <optgroup label="Volumen">
                                    <option value="L">Litros (L)</option>
                                    <option value="ml">Mililitros (ml)</option>
                                </optgroup>
                                <optgroup label="Otros">
                                    <option value="unid">Unidades</option>
                                </optgroup>
                            </select>
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns: 2fr 1fr; gap:10px;">
                        <div class="input-group">
                            <label>Precio Total</label>
                            <input type="number" id="ing-price" step="0.01" class="input-field" required>
                        </div>
                        <div class="input-group">
                            <label>Moneda</label>
                            <select id="ing-currency" class="input-field">
                                <option value="USD">USD ($)</option>
                                <option value="VES">VES (Bs.)</option>
                                <option value="EUR">EUR (€)</option>
                            </select>
                        </div>
                    </div>

                    <div style="display:flex; gap:10px; margin-top:20px;">
                        <button type="button" class="btn-primary" id="close-modal" style="background:#64748b;">Cancelar</button>
                        <button type="submit" class="btn-primary" style="flex:1;">Registrar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('btn-nuevo-ingrediente').onclick = () => document.getElementById('modal-ing').style.display = 'flex';
    document.getElementById('close-modal').onclick = () => document.getElementById('modal-ing').style.display = 'none';
    document.getElementById('ing-form').onsubmit = saveIngredient;

    renderIngredientsList();
}

async function renderIngredientsList() {
    const grid = document.getElementById('ing-grid');
    const { data, error } = await supabase.from('ingredients').select('*').order('name');

    if (error) {
        grid.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
        return;
    }

    grid.innerHTML = data.map(i => {
        let displayStock = i.stock_actual;
        let displayUnit = i.unit_type === 'peso' ? 'kg' : (i.unit_type === 'volumen' ? 'L' : 'unid');
        
        return `
            <div class="stat-card" style="position:relative;">
                <div style="position:absolute; top:10px; right:10px; display:flex; gap:8px;">
                    <button onclick="editIngredient('${i.id}', '${i.name}', ${i.stock_actual})" style="border:none; background:none; cursor:pointer; font-size:1.1rem;">✏️</button>
                    <button onclick="deleteIngredient('${i.id}')" style="border:none; background:none; cursor:pointer; font-size:1.1rem;">🗑️</button>
                </div>
                <div class="stat-value">${displayStock.toFixed(2)} <small>${displayUnit}</small></div>
                <div style="font-weight:bold; color: #0f172a;">${i.name}</div>
                <div style="color:#64748b; font-size:0.85rem; margin-top:10px; border-top:1px solid #f1f5f9; padding-top:10px;">
                    Costo x gramo/ml: <b style="color:#0f172a;">$${(i.costo_unidad_medida || 0).toFixed(4)}</b>
                </div>
            </div>
        `;
    }).join('');
}

async function saveIngredient(e) {
    e.preventDefault();
    const name = document.getElementById('ing-name').value;
    const qty = parseFloat(document.getElementById('ing-qty').value);
    const rawPrice = parseFloat(document.getElementById('ing-price').value);
    const currency = document.getElementById('ing-currency').value;
    const unit = document.getElementById('ing-unit').value;

    const priceInUSD = await convert(rawPrice, currency, 'USD');

    let stockInBaseUnit = qty; 
    let costPerMinUnit = 0;

    if (unit === 'kg' || unit === 'L') {
        stockInBaseUnit = qty; 
        costPerMinUnit = priceInUSD / (qty * 1000); 
    } else if (unit === 'g' || unit === 'ml') {
        stockInBaseUnit = qty / 1000; 
        costPerMinUnit = priceInUSD / qty; 
    } else {
        stockInBaseUnit = qty;
        costPerMinUnit = priceInUSD / qty;
    }

    const { error } = await supabase.from('ingredients').insert([{
        name: name,
        unit_type: (unit === 'kg' || unit === 'g') ? 'peso' : ((unit === 'L' || unit === 'ml') ? 'volumen' : 'unidad'),
        stock_actual: stockInBaseUnit,
        costo_unidad_medida: costPerMinUnit,
        ultima_compra_precio: priceInUSD
    }]);

    if (!error) {
        document.getElementById('modal-ing').style.display = 'none';
        renderIngredientsList();
    }
}

// --- FUNCIONES GLOBALES DE GESTIÓN ---

window.deleteIngredient = async (id) => {
    if (confirm("¿Eliminar este insumo? Si está en una receta, el sistema podría dar error por integridad de datos.")) {
        const { error } = await supabase.from('ingredients').delete().eq('id', id);
        if (error) alert("No se puede eliminar: El insumo está en uso en una receta.");
        else renderIngredientsList();
    }
};

window.editIngredient = async (id, currentName, currentStock) => {
    const newName = prompt("Editar nombre del insumo:", currentName);
    if (newName === null) return;

    const newStock = prompt("Editar stock actual (en kg, L o unid):", currentStock);
    if (newStock === null || isNaN(newStock)) return;

    const { error } = await supabase.from('ingredients').update({
        name: newName,
        stock_actual: parseFloat(newStock)
    }).eq('id', id);

    if (error) alert("Error al actualizar: " + error.message);
    else renderIngredientsList();
};