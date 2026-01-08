import { supabase } from '../supabase.js';
import { getGlobalRates } from './settings.js';

let isEditing = null; // Variable para controlar si estamos editando

export async function loadIngredients() {
    const rates = await getGlobalRates();
    const container = document.getElementById('app-content');
    
    container.innerHTML = `
        <div class="main-container">
            <header style="display:flex; justify-content:space-between; align-items:center; background:#fff; padding:20px; border-radius:12px; box-shadow:0 2px 4px rgba(0,0,0,0.05); margin-bottom:20px;">
                <div>
                    <h1 style="margin:0;">📦 Gestión de Insumos</h1>
                    <p style="margin:5px 0 0; color:#64748b;">Materia prima, Preparados y Empaques</p>
                </div>
                <div style="display:flex; gap:15px;">
                    <div class="stat-card" style="padding:5px 15px; margin:0; border:1px solid #bae6fd;">
                        <small style="color:#0369a1; font-weight:bold;">USD: Bs ${rates.tasa_usd_ves.toFixed(2)}</small>
                    </div>
                    <div class="stat-card" style="padding:5px 15px; margin:0; border:1px solid #ddd6fe;">
                        <small style="color:#5b21b6; font-weight:bold;">EUR: Bs ${rates.tasa_eur_ves.toFixed(2)}</small>
                    </div>
                </div>
            </header>

            <div style="display:grid; grid-template-columns: 1fr 1.5fr; gap:25px;">
                <div class="stat-card">
                    <h3 id="form-title" style="margin-top:0; border-bottom:1px solid #f1f5f9; padding-bottom:10px;">Nuevo Insumo</h3>
                    <form id="ing-form">
                        <div class="input-group">
                            <label>Nombre del Insumo</label>
                            <input type="text" id="i-name" class="input-field" placeholder="Ej: Harina de Trigo" required>
                        </div>

                        <div class="input-group" style="margin-top:10px;">
                            <label>Marca / Fabricante</label>
                            <input type="text" id="i-brand" class="input-field" placeholder="Ej: Polar, Mavesa...">
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px;">
                            <div class="input-group">
                                <label>Tipo</label>
                                <select id="i-type" class="input-field">
                                    <option value="materia_prima">Materia Prima</option>
                                    <option value="preparado">Preparado (Focaccia, Crema...)</option>
                                    <option value="empaque">Empaque / Desechable</option>
                                </select>
                            </div>
                            <div class="input-group">
                                <label>Categoría Medida</label>
                                <select id="i-cat" class="input-field">
                                    <option value="masa">Sólidos (kg/g)</option>
                                    <option value="volumen">Líquidos (L/ml)</option>
                                    <option value="conteo">Unidades (pz)</option>
                                </select>
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px;">
                            <div class="input-group">
                                <label>Moneda Pago</label>
                                <select id="i-moneda" class="input-field">
                                    <option value="USD">Dólares ($)</option>
                                    <option value="EUR">Euros (€)</option>
                                    <option value="VES">Bolívares (Bs.)</option>
                                </select>
                            </div>
                            <div class="input-group">
                                <label>Unidad de Compra</label>
                                <select id="i-unit-fact" class="input-field"></select>
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px;">
                            <div class="input-group">
                                <label>Monto Factura</label>
                                <input type="number" id="i-costo-total" step="0.01" class="input-field" required>
                            </div>
                            <div class="input-group">
                                <label>Cantidad en Factura</label>
                                <input type="number" id="i-cantidad" step="0.001" class="input-field" required>
                            </div>
                        </div>
                        
                        <div id="preview-calc" style="margin-top:20px; padding:15px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px;">
                            <span style="font-size:0.8rem; color:#166534; display:block; font-weight:bold;">Costo convertido a USD:</span>
                            <div id="res-val" style="font-size:1.5rem; font-weight:bold; color:#14532d;">$0.00</div>
                        </div>

                        <div style="display:flex; gap:10px; margin-top:20px;">
                            <button type="submit" id="btn-save" class="btn-primary" style="flex:2;">💾 Guardar Insumo</button>
                            <button type="button" id="btn-cancel" style="flex:1; display:none; background:#94a3b8; color:white; border:none; border-radius:8px; cursor:pointer;">Cancelar</button>
                        </div>
                    </form>
                </div>

                <div class="stat-card">
                    <h3 style="margin-top:0; border-bottom:1px solid #f1f5f9; padding-bottom:10px;">Lista de Insumos</h3>
                    <div id="ing-list-container" style="max-height: 600px; overflow-y: auto;"></div>
                </div>
            </div>
        </div>
    `;

    setupEvents(rates);
    renderList();
}

function setupEvents(rates) {
    const form = document.getElementById('ing-form');
    const iCat = document.getElementById('i-cat');
    const iUnitFact = document.getElementById('i-unit-fact');
    const btnCancel = document.getElementById('btn-cancel');

    const updateUnits = () => {
        const cat = iCat.value;
        if (cat === 'masa') iUnitFact.innerHTML = '<option value="kg">Kilogramos (kg)</option><option value="g">Gramos (g)</option>';
        else if (cat === 'volumen') iUnitFact.innerHTML = '<option value="l">Litros (L)</option><option value="ml">Mililitros (ml)</option>';
        else iUnitFact.innerHTML = '<option value="unid">Unidades</option>';
    };

    iCat.onchange = updateUnits;
    updateUnits();

    const calculate = () => {
        const monto = parseFloat(document.getElementById('i-costo-total').value) || 0;
        const cant = parseFloat(document.getElementById('i-cantidad').value) || 1;
        const moneda = document.getElementById('i-moneda').value;
        const unit = iUnitFact.value;
        const cat = iCat.value;
        
        let costoUSD = monto;
        if (moneda === 'VES') costoUSD = monto / rates.tasa_usd_ves;
        else if (moneda === 'EUR') costoUSD = (monto * rates.tasa_eur_ves) / rates.tasa_usd_ves;
        
        const costoBaseMin = (unit === 'kg' || unit === 'l') ? (costoUSD / (cant * 1000)) : (costoUSD / cant);
        
        // --- Lógica de etiquetas personalizada ---
        let label = "";
        let precioMostrado = 0;

        if (cat === 'masa') {
            label = "/ kg";
            precioMostrado = costoBaseMin * 1000;
        } else if (cat === 'volumen') {
            label = "/ Litro";
            precioMostrado = costoBaseMin * 1000;
        } else {
            label = "/ Unid";
            precioMostrado = costoBaseMin;
        }

        document.getElementById('res-val').innerText = `$${precioMostrado.toFixed(4)} ${label}`;
        
        return costoBaseMin;
    };

    form.oninput = calculate;

    btnCancel.onclick = () => {
        isEditing = null;
        form.reset();
        document.getElementById('form-title').innerText = "Nuevo Insumo";
        btnCancel.style.display = "none";
        updateUnits();
    };

    form.onsubmit = async (e) => {
        e.preventDefault();
        const base = calculate();
        const payload = {
            name: document.getElementById('i-name').value,
            brand: document.getElementById('i-brand').value,
            tipo: document.getElementById('i-type').value,
            categoria: iCat.value,
            costo_base_usd_unidad_minima: base,
            moneda_compra: document.getElementById('i-moneda').value,
            costo_compra_total: parseFloat(document.getElementById('i-costo-total').value),
            cantidad_compra: parseFloat(document.getElementById('i-cantidad').value),
            unidad_compra: iUnitFact.value
        };

        let error;
        if (isEditing) {
            const result = await supabase.from('ingredients').update(payload).eq('id', isEditing);
            error = result.error;
        } else {
            const result = await supabase.from('ingredients').insert([payload]);
            error = result.error;
        }

        if (!error) {
            alert(isEditing ? "✅ Actualizado" : "✅ Guardado");
            btnCancel.click();
            renderList();
        }
    };
}

async function renderList() {
    const { data } = await supabase.from('ingredients').select('*').order('name');
    const container = document.getElementById('ing-list-container');
    
    if (!data) return;

    container.innerHTML = `
        <table style="width:100%; border-collapse:collapse;">
            <tr style="text-align:left; border-bottom:2px solid #f1f5f9; color:#64748b; font-size:0.75rem;">
                <th style="padding:10px;">INSUMO / MARCA</th>
                <th>TIPO</th>
                <th>PRECIO REF.</th>
                <th style="text-align:right;">ACCIONES</th>
            </tr>
            ${data.map(i => {
                let label = "";
                let refPrice = 0;

                if (i.categoria === 'masa') {
                    label = "kg";
                    refPrice = i.costo_base_usd_unidad_minima * 1000;
                } else if (i.categoria === 'volumen') {
                    label = "Litro";
                    refPrice = i.costo_base_usd_unidad_minima * 1000;
                } else {
                    label = "Unid";
                    refPrice = i.costo_base_usd_unidad_minima;
                }

                return `
                <tr style="border-bottom:1px solid #f1f5f9; font-size:0.85rem;">
                    <td style="padding:10px;">
                        <strong style="display:block;">${i.name}</strong>
                        <small style="color:#64748b;">${i.brand || 'Sin marca'}</small>
                    </td>
                    <td><span style="font-size:0.7rem; background:#f1f5f9; padding:2px 6px; border-radius:4px;">${i.tipo || 'materia_prima'}</span></td>
                    <td style="font-weight:bold;">$${refPrice.toFixed(3)} <small style="color:#94a3b8; font-weight:normal;">/${label}</small></td>
                    <td style="text-align:right;">
                        <button onclick="editIng('${i.id}')" style="border:none; background:none; cursor:pointer; font-size:1rem; margin-right:10px;">✏️</button>
                        <button onclick="deleteIng('${i.id}')" style="border:none; background:none; cursor:pointer; font-size:1rem;">🗑️</button>
                    </td>
                </tr>`;
            }).join('')}
        </table>
    `;
}

window.editIng = async (id) => {
    const { data } = await supabase.from('ingredients').select('*').eq('id', id).single();
    if (data) {
        isEditing = id;
        document.getElementById('form-title').innerText = "📝 Editando Insumo";
        document.getElementById('btn-cancel').style.display = "block";
        
        document.getElementById('i-name').value = data.name;
        document.getElementById('i-brand').value = data.brand || '';
        document.getElementById('i-type').value = data.tipo || 'materia_prima';
        document.getElementById('i-cat').value = data.categoria;
        
        const iUnitFact = document.getElementById('i-unit-fact');
        if (data.categoria === 'masa') iUnitFact.innerHTML = '<option value="kg">Kilogramos (kg)</option><option value="g">Gramos (g)</option>';
        else if (data.categoria === 'volumen') iUnitFact.innerHTML = '<option value="l">Litros (L)</option><option value="ml">Mililitros (ml)</option>';
        else iUnitFact.innerHTML = '<option value="unid">Unidades</option>';
        
        document.getElementById('i-unit-fact').value = data.unidad_compra;
        document.getElementById('i-moneda').value = data.moneda_compra;
        document.getElementById('i-costo-total').value = data.costo_compra_total;
        document.getElementById('i-cantidad').value = data.cantidad_compra;
        
        document.getElementById('form-title').scrollIntoView({ behavior: 'smooth' });
    }
};

window.deleteIng = async (id) => {
    if (confirm('¿Eliminar este insumo definitivamente?')) {
        await supabase.from('ingredients').delete().eq('id', id);
        renderList();
    }
};