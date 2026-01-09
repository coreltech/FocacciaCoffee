import { supabase } from '../supabase.js';
import { getGlobalRates } from './settings.js';

let isEditing = null;

export async function loadIngredients() {
    const rates = await getGlobalRates();
    const container = document.getElementById('app-content');
    
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
        .ing-layout { display: grid; grid-template-columns: 1fr 1.5fr; gap: 25px; }
        .ing-tabs { display: none; margin-bottom: 20px; gap: 10px; }
        .ing-header { display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 20px; }
        
        /* Control de visibilidad de listas */
        .mobile-list { display: none; }
        .desktop-table { display: block; }

        @media (max-width: 850px) {
            .ing-layout { grid-template-columns: 1fr; }
            .ing-tabs { display: flex; }
            .section-panel { display: none; }
            .section-panel.active { display: block; }
            .ing-header { flex-direction: column; gap: 15px; text-align: center; }
            .rates-container { width: 100%; justify-content: center; }
            .ing-card { background: #fff; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 10px; }
            
            /* En móvil, ocultamos tabla y mostramos tarjetas */
            .desktop-table { display: none; }
            .mobile-list { display: block; }
        }
    `;
    document.head.appendChild(styleTag);
    
    container.innerHTML = `
        <div class="main-container">
            <header class="ing-header">
                <div>
                    <h1 style="margin:0;">📦 Gestión de Insumos</h1>
                    <p style="margin:5px 0 0; color:#64748b;">Materia prima y Preparados</p>
                </div>
                <div style="display:flex; gap:10px;" class="rates-container">
                    <div class="stat-card" style="padding:5px 12px; margin:0; border:1px solid #bae6fd;">
                        <small style="color:#0369a1; font-weight:bold;">USD: Bs ${rates.tasa_usd_ves.toFixed(2)}</small>
                    </div>
                    <div class="stat-card" style="padding:5px 12px; margin:0; border:1px solid #ddd6fe;">
                        <small style="color:#5b21b6; font-weight:bold;">EUR: Bs ${rates.tasa_eur_ves.toFixed(2)}</small>
                    </div>
                </div>
            </header>

            <div class="ing-tabs">
                <button class="tab-btn active" id="tab-ing-form" onclick="switchIngTab('form')">➕ Nuevo</button>
                <button class="tab-btn" id="tab-ing-list" onclick="switchIngTab('list')">📋 Lista</button>
            </div>

            <div class="ing-layout">
                <div id="panel-ing-form" class="stat-card section-panel active">
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
                                    <option value="preparado">Preparado</option>
                                    <option value="empaque">Empaque</option>
                                </select>
                            </div>
                            <div class="input-group">
                                <label>Categoría</label>
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
                                <label>Unidad Compra</label>
                                <select id="i-unit-fact" class="input-field"></select>
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px;">
                            <div class="input-group">
                                <label>Monto Factura</label>
                                <input type="number" id="i-costo-total" step="0.01" class="input-field" required>
                            </div>
                            <div class="input-group">
                                <label>Cantidad</label>
                                <input type="number" id="i-cantidad" step="0.001" class="input-field" required>
                            </div>
                        </div>
                        
                        <div id="preview-calc" style="margin-top:20px; padding:15px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px;">
                            <span style="font-size:0.8rem; color:#166534; display:block; font-weight:bold;">Costo convertido a USD:</span>
                            <div id="res-val" style="font-size:1.5rem; font-weight:bold; color:#14532d;">$0.00</div>
                        </div>

                        <div style="display:flex; gap:10px; margin-top:20px;">
                            <button type="submit" id="btn-save" class="btn-primary" style="flex:2; height: 45px;">💾 Guardar Insumo</button>
                            <button type="button" id="btn-cancel" style="flex:1; display:none; background:#94a3b8; color:white; border:none; border-radius:8px; cursor:pointer;">Cancelar</button>
                        </div>
                    </form>
                </div>

                <div id="panel-ing-list" class="stat-card section-panel">
                    <h3 style="margin-top:0; border-bottom:1px solid #f1f5f9; padding-bottom:10px;">Lista de Insumos</h3>
                    <div id="ing-list-container"></div>
                </div>
            </div>
        </div>
    `;

    window.switchIngTab = (target) => {
        const pForm = document.getElementById('panel-ing-form');
        const pList = document.getElementById('panel-ing-list');
        const tForm = document.getElementById('tab-ing-form');
        const tList = document.getElementById('tab-ing-list');
        if(target === 'form') {
            pForm.classList.add('active'); pList.classList.remove('active');
            tForm.classList.add('active'); tList.classList.remove('active');
        } else {
            pForm.classList.remove('active'); pList.classList.add('active');
            tForm.classList.remove('active'); tList.classList.add('active');
        }
    };

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
        
        let label = ""; let precioMostrado = 0;
        if (cat === 'masa' || cat === 'volumen') {
            label = cat === 'masa' ? "/ kg" : "/ Litro";
            precioMostrado = costoBaseMin * 1000;
        } else {
            label = "/ Unid"; precioMostrado = costoBaseMin;
        }
        document.getElementById('res-val').innerText = `$${precioMostrado.toFixed(4)} ${label}`;
        return costoBaseMin;
    };

    form.oninput = calculate;

    btnCancel.onclick = () => {
        isEditing = null; form.reset();
        document.getElementById('form-title').innerText = "Nuevo Insumo";
        btnCancel.style.display = "none"; updateUnits();
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

        const { error } = isEditing 
            ? await supabase.from('ingredients').update(payload).eq('id', isEditing)
            : await supabase.from('ingredients').insert([payload]);

        if (!error) {
            alert(isEditing ? "✅ Actualizado" : "✅ Guardado");
            btnCancel.click(); renderList();
            if(window.innerWidth <= 850) switchIngTab('list');
        }
    };
}

async function renderList() {
    const { data } = await supabase.from('ingredients').select('*').order('name');
    const container = document.getElementById('ing-list-container');
    if (!data) return;

    let htmlTable = `
        <div class="desktop-table">
            <table style="width:100%; border-collapse:collapse;">
                <tr style="text-align:left; border-bottom:2px solid #f1f5f9; color:#64748b; font-size:0.75rem;">
                    <th style="padding:10px;">INSUMO / MARCA</th>
                    <th>TIPO</th>
                    <th>PRECIO REF.</th>
                    <th style="text-align:right;">ACCIONES</th>
                </tr>
                ${data.map(i => {
                    let label = i.categoria === 'masa' ? 'kg' : (i.categoria === 'volumen' ? 'Litro' : 'Unid');
                    let refPrice = (i.categoria === 'masa' || i.categoria === 'volumen') ? i.costo_base_usd_unidad_minima * 1000 : i.costo_base_usd_unidad_minima;
                    return `
                    <tr style="border-bottom:1px solid #f1f5f9; font-size:0.85rem;">
                        <td style="padding:10px;"><strong>${i.name}</strong><br><small style="color:#64748b;">${i.brand || 'Sin marca'}</small></td>
                        <td><span style="font-size:0.7rem; background:#f1f5f9; padding:2px 6px; border-radius:4px;">${i.tipo}</span></td>
                        <td style="font-weight:bold;">$${refPrice.toFixed(3)} <small style="color:#94a3b8;">/${label}</small></td>
                        <td style="text-align:right;">
                            <button onclick="editIng('${i.id}')" style="border:none; background:none; cursor:pointer; font-size:1.1rem; margin-right:10px;">✏️</button>
                            <button onclick="deleteIng('${i.id}')" style="border:none; background:none; cursor:pointer; font-size:1.1rem;">🗑️</button>
                        </td>
                    </tr>`;
                }).join('')}
            </table>
        </div>`;

    let htmlCards = `<div class="mobile-list">`;
    data.forEach(i => {
        let label = i.categoria === 'masa' ? 'kg' : (i.categoria === 'volumen' ? 'Litro' : 'Unid');
        let refPrice = (i.categoria === 'masa' || i.categoria === 'volumen') ? i.costo_base_usd_unidad_minima * 1000 : i.costo_base_usd_unidad_minima;
        htmlCards += `
            <div class="ing-card">
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <div>
                        <strong style="font-size:1rem; display:block;">${i.name}</strong>
                        <small style="color:#64748b;">${i.brand || 'Sin marca'} • ${i.tipo}</small>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:bold; color:#10b981; font-size:1.1rem;">$${refPrice.toFixed(3)}</div>
                        <small style="color:#94a3b8;">por ${label}</small>
                    </div>
                </div>
                <div style="display:flex; gap:10px; margin-top:15px; border-top:1px solid #f1f5f9; padding-top:10px;">
                    <button onclick="editIng('${i.id}')" style="flex:1; padding:10px; border-radius:8px; border:1px solid #e2e8f0; background:#f8fafc; cursor:pointer;">✏️ Editar</button>
                    <button onclick="deleteIng('${i.id}')" style="flex:1; padding:10px; border-radius:8px; border:1px solid #fee2e2; background:#fff1f2; color:#b91c1c; cursor:pointer;">🗑️ Borrar</button>
                </div>
            </div>`;
    });
    htmlCards += `</div>`;
    
    container.innerHTML = htmlTable + htmlCards;
}

window.editIng = async (id) => {
    const { data } = await supabase.from('ingredients').select('*').eq('id', id).single();
    if (data) {
        isEditing = id;
        document.getElementById('form-title').innerText = "📝 Editando Insumo";
        document.getElementById('btn-cancel').style.display = "block";
        document.getElementById('i-name').value = data.name;
        document.getElementById('i-brand').value = data.brand || '';
        document.getElementById('i-type').value = data.tipo;
        document.getElementById('i-cat').value = data.categoria;
        
        const iUnitFact = document.getElementById('i-unit-fact');
        if (data.categoria === 'masa') iUnitFact.innerHTML = '<option value="kg">Kilogramos (kg)</option><option value="g">Gramos (g)</option>';
        else if (data.categoria === 'volumen') iUnitFact.innerHTML = '<option value="l">Litros (L)</option><option value="ml">Mililitros (ml)</option>';
        else iUnitFact.innerHTML = '<option value="unid">Unidades</option>';
        
        document.getElementById('i-unit-fact').value = data.unidad_compra;
        document.getElementById('i-moneda').value = data.moneda_compra;
        document.getElementById('i-costo-total').value = data.costo_compra_total;
        document.getElementById('i-cantidad').value = data.cantidad_compra;
        
        if(window.innerWidth <= 850) switchIngTab('form');
        document.getElementById('form-title').scrollIntoView({ behavior: 'smooth' });
    }
};

window.deleteIng = async (id) => {
    if (confirm('¿Eliminar este insumo definitivamente?')) {
        await supabase.from('ingredients').delete().eq('id', id);
        renderList();
    }
};