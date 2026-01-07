import { supabase } from '../supabase.js';
import { getGlobalRates } from './settings.js';

export async function loadIngredients() {
    // 1. Obtener el objeto con ambas tasas (USD y EUR)
    const rates = await getGlobalRates();

    const container = document.getElementById('app-content');
    container.innerHTML = `
        <div class="main-container">
            <header style="display:flex; justify-content:space-between; align-items:center; background:#fff; padding:20px; border-radius:12px; box-shadow:0 2px 4px rgba(0,0,0,0.05); margin-bottom:20px;">
                <div>
                    <h1 style="margin:0;">📦 Gestión de Insumos</h1>
                    <p style="margin:5px 0 0; color:#64748b;">Materia prima y empaques (Multimoneda)</p>
                </div>
                
                <div style="display:flex; gap:15px;">
                    <div style="background:#f0f9ff; padding:10px 15px; border-radius:10px; border:1px solid #bae6fd; text-align:right;">
                        <small style="display:block; font-size:0.6rem; font-weight:bold; color:#0369a1; text-transform:uppercase;">Tasa USD</small>
                        <span style="font-size:1.1rem; font-weight:bold; color:#0c4a6e;">Bs ${rates.tasa_usd_ves.toFixed(2)}</span>
                    </div>
                    <div style="background:#f5f3ff; padding:10px 15px; border-radius:10px; border:1px solid #ddd6fe; text-align:right;">
                        <small style="display:block; font-size:0.6rem; font-weight:bold; color:#5b21b6; text-transform:uppercase;">Tasa EUR</small>
                        <span style="font-size:1.1rem; font-weight:bold; color:#4c1d95;">Bs ${rates.tasa_eur_ves.toFixed(2)}</span>
                    </div>
                </div>
            </header>

            <div style="display:grid; grid-template-columns: 1fr 1.5fr; gap:25px;">
                <div class="stat-card">
                    <h3 style="margin-top:0; border-bottom:1px solid #f1f5f9; padding-bottom:10px;">Nuevo Insumo</h3>
                    <form id="ing-form">
                        <div class="input-group">
                            <label>Nombre del Insumo</label>
                            <input type="text" id="i-name" class="input-field" placeholder="Ej: Harina de Trigo" required>
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px;">
                            <div class="input-group">
                                <label>Categoría</label>
                                <select id="i-cat" class="input-field">
                                    <option value="masa">Sólidos (kg/g)</option>
                                    <option value="volumen">Líquidos (L/ml)</option>
                                    <option value="conteo">Unidades</option>
                                    <option value="empaque">Empaque</option>
                                </select>
                            </div>
                            <div class="input-group">
                                <label>Moneda Pago</label>
                                <select id="i-moneda" class="input-field" style="background:#fff9f0; font-weight:bold;">
                                    <option value="USD">Dólares ($)</option>
                                    <option value="EUR">Euros (€)</option>
                                    <option value="VES">Bolívares (Bs.)</option>
                                </select>
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

                        <div class="input-group" style="margin-top:10px;">
                            <label>Unidad de la Factura</label>
                            <select id="i-unit-fact" class="input-field"></select>
                        </div>
                        
                        <div id="preview-calc" style="margin-top:20px; padding:15px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px;">
                            <span style="font-size:0.8rem; color:#166534; display:block; font-weight:bold;">Costo convertido a USD:</span>
                            <div id="res-val" style="font-size:1.5rem; font-weight:bold; color:#14532d;">$0.00</div>
                            <small id="res-detail" style="color:#166534; font-size:0.75rem; display:block; margin-top:5px;"></small>
                        </div>

                        <button type="submit" class="btn-primary" style="width:100%; margin-top:20px; padding:15px; font-weight:bold;">💾 Guardar Insumo</button>
                    </form>
                </div>

                <div class="stat-card">
                    <h3 style="margin-top:0; border-bottom:1px solid #f1f5f9; padding-bottom:10px;">Maestro de Precios (USD)</h3>
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
    const preview = document.getElementById('res-val');
    const previewDetail = document.getElementById('res-detail');

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
        const cant = parseFloat(document.getElementById('i-cantidad').value) || 0;
        const moneda = document.getElementById('i-moneda').value;
        const unit = iUnitFact.value;
        
        // LÓGICA DE CONVERSIÓN MULTIMONEDA
        let costoUSD = monto;
        let infoTasa = "Valor directo en USD";

        if (moneda === 'VES') {
            costoUSD = monto / rates.tasa_usd_ves;
            infoTasa = `Tasa: Bs ${rates.tasa_usd_ves}`;
        } else if (moneda === 'EUR') {
            // Convertimos EUR a VES y luego a USD (o directo si tienes la relación)
            const montoEnVES = monto * rates.tasa_eur_ves;
            costoUSD = montoEnVES / rates.tasa_usd_ves;
            infoTasa = `Tasa EUR/USD: ${(rates.tasa_eur_ves / rates.tasa_usd_ves).toFixed(3)}`;
        }
        
        const costoBaseMin = (unit === 'kg' || unit === 'l') ? (costoUSD / (cant * 1000)) : (costoUSD / cant);

        if (costoBaseMin > 0) {
            const esUnid = (iCat.value === 'conteo' || (iCat.value === 'empaque' && unit === 'unid'));
            preview.innerText = esUnid ? `$${costoBaseMin.toFixed(4)} / Unid` : `$${(costoBaseMin * 1000).toFixed(4)} / Kg-L`;
            previewDetail.innerText = infoTasa;
        }
        return costoBaseMin;
    };

    form.oninput = calculate;

    form.onsubmit = async (e) => {
        e.preventDefault();
        const base = calculate();
        
        const { error } = await supabase.from('ingredients').insert([{
            name: document.getElementById('i-name').value,
            categoria: iCat.value,
            costo_base_usd_unidad_minima: base,
            moneda_compra: document.getElementById('i-moneda').value,
            costo_compra_total: parseFloat(document.getElementById('i-costo-total').value),
            cantidad_compra: parseFloat(document.getElementById('i-cantidad').value),
            unidad_compra: iUnitFact.value
        }]);

        if (!error) { 
            form.reset(); 
            updateUnits(); 
            renderList();
            alert("✅ Guardado con éxito.");
        }
    };
}

async function renderList() {
    const { data } = await supabase.from('ingredients').select('*').order('name');
    const container = document.getElementById('ing-list-container');
    
    if (!data || data.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#94a3b8;'>No hay datos.</p>";
        return;
    }

    container.innerHTML = `
        <table style="width:100%; border-collapse:collapse;">
            <tr style="text-align:left; border-bottom:2px solid #f1f5f9; color:#64748b; font-size:0.75rem;">
                <th style="padding:10px;">INSUMO</th>
                <th>REF. KG/L/U</th>
                <th>ELIMINAR</th>
            </tr>
            ${data.map(i => {
                const esUnid = (i.categoria === 'conteo' || i.unidad_compra === 'unid');
                const refPrice = esUnid ? i.costo_base_usd_unidad_minima : i.costo_base_usd_unidad_minima * 1000;
                return `
                <tr style="border-bottom:1px solid #f1f5f9; font-size:0.85rem;">
                    <td style="padding:10px;"><strong>${i.name}</strong></td>
                    <td style="font-weight:bold;">$${refPrice.toFixed(3)}</td>
                    <td><button onclick="deleteIng('${i.id}')" style="border:none; background:none; cursor:pointer;">🗑️</button></td>
                </tr>`;
            }).join('')}
        </table>
    `;
}

window.deleteIng = async (id) => {
    if (confirm('¿Eliminar?')) {
        await supabase.from('ingredients').delete().eq('id', id);
        renderList();
    }
};