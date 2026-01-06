import { supabase } from '../supabase.js';
import { convert } from '../core/currency.js';

export async function loadIngredients() {
    const container = document.getElementById('app-content');
    
    container.innerHTML = `
        <div class="main-container">
            <header class="header-flex">
                <div>
                    <h1>🥫 Almacén de Insumos</h1>
                    <p style="color: #64748b;">Materia Prima y Toppings Elaborados (Sub-recetas)</p>
                </div>
                <button class="btn-primary" id="btn-nuevo-ingrediente">+ Registrar Compra/Elaborado</button>
            </header>

            <div id="ing-grid" class="main-grid">
                <div class="stat-card">Cargando inventario...</div>
            </div>
        </div>

        <div id="modal-ing" class="modal-overlay" style="display:none;">
            <div class="modal-card" style="width: 550px;">
                <h3>📦 Registro de Insumo</h3>
                <form id="ing-form">
                    <div style="display:grid; grid-template-columns: 2fr 1fr; gap:10px;">
                        <div class="input-group">
                            <label>Nombre del Insumo</label>
                            <input type="text" id="ing-name" class="input-field" placeholder="Ej: Tomates Confitados" required>
                        </div>
                        <div class="input-group">
                            <label>Tipo de Suministro</label>
                            <select id="ing-tipo-suministro" class="input-field" style="border: 2px solid #8b5cf6;">
                                <option value="materia_prima">Materia Prima</option>
                                <option value="elaborado">Topping Elaborado</option>
                            </select>
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                        <div class="input-group">
                            <label>Marca / Origen</label>
                            <input type="text" id="ing-marca" class="input-field" placeholder="Ej: Producción Propia">
                        </div>
                        <div class="input-group">
                            <label>Empaque / Presentación</label>
                            <select id="ing-pres-tipo" class="input-field">
                                <option value="Bolsa">Bolsa</option>
                                <option value="Saco">Saco</option>
                                <option value="Frasco">Frasco</option>
                                <option value="Contenedor">Contenedor</option>
                                <option value="Unidad">Unidad Individual</option>
                            </select>
                        </div>
                    </div>
                    
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                        <div class="input-group">
                            <label>Contenido Neto</label>
                            <div style="display:flex; gap:5px;">
                                <input type="number" id="ing-qty" step="0.01" class="input-field" placeholder="Cant." required>
                                <select id="ing-unit" class="input-field" style="width:90px;">
                                    <option value="g">Gramos</option>
                                    <option value="ml">Mililitros</option>
                                    <option value="unid">Unid.</option>
                                    <option value="kg">Kilos</option>
                                    <option value="L">Litros</option>
                                </select>
                            </div>
                        </div>
                        <div class="input-group">
                            <label>Precio Total o Costo Prod.</label>
                            <div style="display:flex; gap:5px;">
                                <input type="number" id="ing-price" step="0.01" class="input-field" required style="flex:1;">
                                <select id="ing-currency" class="input-field" style="width:80px;">
                                    <option value="USD">USD</option>
                                    <option value="VES">VES</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div style="display:flex; gap:10px; margin-top:20px;">
                        <button type="button" class="btn-primary" id="close-modal" style="background:#64748b;">Cancelar</button>
                        <button type="submit" class="btn-primary" style="flex:1;">Guardar en Inventario</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('btn-nuevo-ingrediente').onclick = () => {
        document.getElementById('ing-form').reset();
        document.getElementById('modal-ing').style.display = 'flex';
    };
    document.getElementById('close-modal').onclick = () => document.getElementById('modal-ing').style.display = 'none';
    document.getElementById('ing-form').onsubmit = saveIngredient;

    renderIngredientsList();
}

async function renderIngredientsList() {
    const grid = document.getElementById('ing-grid');
    const { data, error } = await supabase.from('ingredients').select('*').order('tipo_suministro', { ascending: false }).order('name');

    if (error) {
        grid.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
        return;
    }

    grid.innerHTML = data.map(i => {
        const isElaborado = i.tipo_suministro === 'elaborado';
        const badgeColor = isElaborado ? '#8b5cf6' : '#94a3b8';
        const badgeText = isElaborado ? 'PRODUCCIÓN INTERNA' : 'MATERIA PRIMA';
        const cardBorder = isElaborado ? '4px solid #8b5cf6' : '4px solid #3b82f6';

        let displayStock = i.stock_actual || 0;
        let displayUnit = i.unit_type === 'peso' ? 'kg' : (i.unit_type === 'volumen' ? 'L' : 'unid');
        
        return `
            <div class="stat-card" style="border-top: ${cardBorder}; position:relative;">
                <div style="position:absolute; top:10px; right:10px; display:flex; gap:8px;">
                    <button onclick="editIngredient('${i.id}', '${i.name}', ${i.stock_actual})" style="border:none; background:none; cursor:pointer; font-size:1.1rem;">✏️</button>
                    <button onclick="deleteIngredient('${i.id}')" style="border:none; background:none; cursor:pointer; font-size:1.1rem;">🗑️</button>
                </div>

                <div style="margin-bottom:10px;">
                    <span style="background:${badgeColor}; color:white; padding:2px 6px; border-radius:4px; font-size:0.65rem; font-weight:bold; display:inline-block; margin-bottom:5px;">${badgeText}</span>
                    <div style="font-weight:bold; font-size:1.1rem; color: #0f172a; padding-right:50px;">${i.name}</div>
                    <small style="color:#64748b; font-weight:bold; text-transform:uppercase;">${i.marca || 'Genérico'} | ${i.presentacion_tipo || 'N/A'}</small>
                </div>

                <div style="margin:15px 0;">
                    <div class="stat-value" style="font-size:1.6rem; color:#1e293b;">${displayStock.toFixed(2)} <small style="font-size:0.9rem; color:#64748b;">${displayUnit}</small></div>
                    <small style="color:#64748b;">Contenido Neto: ${i.contenido_neto || 0}${i.unit_type === 'peso' ? 'g' : (i.unit_type === 'volumen' ? 'ml' : 'u')}</small>
                </div>

                <div style="color:#64748b; font-size:0.8rem; border-top:1px solid #f1f5f9; padding-top:10px; display:flex; justify-content:space-between;">
                    <span>Costo por ${i.unit_type === 'peso' ? 'gramo' : 'unidad'}:</span>
                    <b style="color:#10b981;">$${(i.costo_unidad_medida || 0).toFixed(4)}</b>
                </div>
            </div>
        `;
    }).join('');
}

async function saveIngredient(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;

    const name = document.getElementById('ing-name').value;
    const tipoSuministro = document.getElementById('ing-tipo-suministro').value;
    const marca = document.getElementById('ing-marca').value;
    const presTipo = document.getElementById('ing-pres-tipo').value;
    const qtyInput = parseFloat(document.getElementById('ing-qty').value);
    const unitInput = document.getElementById('ing-unit').value;
    const rawPrice = parseFloat(document.getElementById('ing-price').value);
    const currency = document.getElementById('ing-currency').value;

    try {
        const priceInUSD = await convert(rawPrice, currency, 'USD');

        let stockInBaseUnit = 0; 
        let costPerMinUnit = 0;  
        let contenidoNetoGramos = 0;

        if (unitInput === 'kg' || unitInput === 'L') {
            stockInBaseUnit = qtyInput; 
            contenidoNetoGramos = qtyInput * 1000;
            costPerMinUnit = priceInUSD / contenidoNetoGramos;
        } else if (unitInput === 'g' || unitInput === 'ml') {
            stockInBaseUnit = qtyInput / 1000;
            contenidoNetoGramos = qtyInput;
            costPerMinUnit = priceInUSD / qtyInput;
        } else {
            stockInBaseUnit = qtyInput;
            contenidoNetoGramos = qtyInput;
            costPerMinUnit = priceInUSD / qtyInput;
        }

        const { error } = await supabase.from('ingredients').insert([{
            name: name,
            tipo_suministro: tipoSuministro,
            marca: marca,
            presentacion_tipo: presTipo,
            contenido_neto: contenidoNetoGramos,
            costo_presentacion: priceInUSD,
            unit_type: (unitInput === 'kg' || unitInput === 'g') ? 'peso' : ((unitInput === 'L' || unitInput === 'ml') ? 'volumen' : 'unidad'),
            stock_actual: stockInBaseUnit,
            costo_unidad_medida: costPerMinUnit,
            ultima_compra_precio: priceInUSD
        }]);

        if (error) throw error;

        document.getElementById('modal-ing').style.display = 'none';
        renderIngredientsList();
    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        btn.disabled = false;
    }
}

// Ventanas globales de edición y eliminación se mantienen igual...
window.deleteIngredient = async (id) => {
    if (confirm("¿Eliminar este insumo? Si está en una receta, podría causar errores.")) {
        const { error } = await supabase.from('ingredients').delete().eq('id', id);
        if (error) alert("Error: El insumo está siendo usado en una receta activa.");
        else renderIngredientsList();
    }
};

window.editIngredient = async (id, currentName, currentStock) => {
    const newName = prompt("Editar nombre del insumo:", currentName);
    if (newName === null) return;

    const newStock = prompt("Ajustar stock actual (Base: kg/L/unid):", currentStock);
    if (newStock === null || isNaN(newStock)) return;

    const { error } = await supabase.from('ingredients').update({
        name: newName,
        stock_actual: parseFloat(newStock)
    }).eq('id', id);

    if (error) alert("Error al actualizar: " + error.message);
    else renderIngredientsList();
};