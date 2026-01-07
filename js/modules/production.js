import { supabase } from '../supabase.js';

export async function loadProduction() {
    const { data: recipes } = await supabase.from('recipes').select('*, recipe_ingredients(*, ingredients(*))');
    const { data: ingredients } = await supabase.from('ingredients').select('*');
    const container = document.getElementById('app-content');

    container.innerHTML = `
        <div class="main-container">
            <header>
                <h1>🚀 Panel de Producción</h1>
                <p>Planifica tu tanda y consulta el historial de inversión.</p>
            </header>

            <div style="display:grid; grid-template-columns: 1fr 1.2fr; gap:25px;">
                <div class="stat-card">
                    <h3>Configurar Tanda de Venta</h3>
                    <div class="input-group">
                        <label>1. Masa Base</label>
                        <div style="display:grid; grid-template-columns: 2fr 1fr; gap:10px;">
                            <select id="p-masa-id" class="input-field">
                                ${recipes.filter(r => r.tipo_receta === 'panadera').map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
                            </select>
                            <input type="number" id="p-masa-g" class="input-field" value="250">
                        </div>
                    </div>

                    <div class="input-group">
                        <label>2. Topping</label>
                        <div style="display:grid; grid-template-columns: 2fr 1fr; gap:10px;">
                            <select id="p-top-id" class="input-field">
                                <option value="">-- Sin Topping --</option>
                                ${recipes.filter(r => r.tipo_receta === 'estandar').map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
                            </select>
                            <input type="number" id="p-top-g" class="input-field" value="38">
                        </div>
                    </div>

                    <div class="input-group">
                        <label>3. Empaque</label>
                        <select id="p-item-id" class="input-field">
                            <option value="">-- Añadir Envase, Etiqueta, Papel --</option>
                            ${ingredients.filter(i => i.categoria === 'Materia Prima Base' || i.categoria === 'Varios').map(i => `<option value="${i.id}">${i.name}</option>`).join('')}
                        </select>
                        <div id="p-pkg-list" style="margin-top:10px; font-size:0.85rem; color:#64748b;"></div>
                    </div>

                    <div class="input-group">
                        <label style="color:#0284c7; font-weight:bold;">4. Unidades a Producir</label>
                        <input type="number" id="p-unidades" class="input-field" value="6" style="border: 2px solid #0284c7;">
                    </div>

                    <button id="btn-calc-prod" class="btn-primary" style="width:100%; background:#0f172a; margin-top:10px; cursor:pointer;">📊 Calcular Hoja de Costos</button>
                    
                    <hr style="opacity:0.1; margin:30px 0;">
                    
                    <h3>📋 Historial Reciente</h3>
                    <div id="production-history" style="font-size:0.85rem;">
                        Cargando historial...
                    </div>
                </div>

                <div id="p-results" class="stat-card" style="display:none; border-top: 5px solid #10b981; height: fit-content;">
                    <h3>📋 Resumen de Inversión</h3>
                    <div id="p-breakdown-unit" style="margin-bottom:15px; padding:10px; background:#f8fafc; border-radius:8px; font-size:0.9rem;"></div>
                    
                    <table style="width:100%; margin-top:15px; border-collapse:collapse; font-size:0.9rem;">
                        <thead style="background:#f1f5f9;">
                            <tr><th align="left" style="padding:8px;">Detalle Inversión</th><th align="right">Monto</th></tr>
                        </thead>
                        <tbody id="p-table-body"></tbody>
                    </table>

                    <div style="margin-top:20px; padding:20px; background:#0f172a; color:#fff; border-radius:12px; text-align:center;">
                        <span style="opacity:0.7; font-size:0.9rem;">INVERSIÓN TOTAL TANDA:</span>
                        <div id="p-grand-total" style="font-size:2.5rem; font-weight:bold; color:#4ade80;">$0.00</div>
                        <div id="p-unit-cost-final" style="font-size:1rem; opacity:0.8; margin-top:5px;"></div>
                    </div>

                    <button id="btn-save-log" class="btn-primary" style="width:100%; margin-top:20px; background:#10b981; cursor:pointer;">✅ Confirmar y Guardar en Reporte</button>
                </div>
            </div>
        </div>
    `;

    setupProductionLogic(recipes, ingredients);
    renderProductionHistory();
}

function setupProductionLogic(recipes, ingredients) {
    let pkgItems = [];
    let currentCalcData = null;

    document.getElementById('p-item-id').onchange = (e) => {
        const id = e.target.value;
        if(!id) return;
        const item = ingredients.find(i => i.id === id);
        if(!pkgItems.find(p => p.id === id)) {
            pkgItems.push(item);
            renderPkg();
        }
        e.target.value = "";
    };

    function renderPkg() {
        const div = document.getElementById('p-pkg-list');
        div.innerHTML = pkgItems.map((item, index) => `
            <div style="display:flex; justify-content:space-between; margin-bottom:5px; padding:6px; background:#f1f5f9; border-radius:4px;">
                <span>${item.name}</span>
                <span style="color:#ef4444; cursor:pointer; font-weight:bold;" onclick="removePkgItem(${index})">✕</span>
            </div>
        `).join('');
    }

    window.removePkgItem = (index) => {
        pkgItems.splice(index, 1);
        renderPkg();
    };

    document.getElementById('btn-calc-prod').onclick = () => {
        const masaId = document.getElementById('p-masa-id').value;
        const masaG = parseFloat(document.getElementById('p-masa-g').value);
        const topId = document.getElementById('p-top-id').value;
        const topG = parseFloat(document.getElementById('p-top-g').value) || 0;
        const numUnits = parseFloat(document.getElementById('p-unidades').value) || 1;

        if(!masaId) return alert("Selecciona una masa base.");

        const rMasa = recipes.find(r => r.id === masaId);
        let costMasaSum = 0; let percMasaSum = 0;
        rMasa.recipe_ingredients.forEach(ri => {
            costMasaSum += ri.cantidad_o_porcentaje * 10 * ri.ingredients.costo_base_usd_unidad_minima;
            percMasaSum += ri.cantidad_o_porcentaje;
        });
        const costGramMasa = costMasaSum / (percMasaSum * 10);
        const totalMasaUnidad = costGramMasa * masaG;

        let totalTopUnidad = 0;
        if(topId) {
            const rTop = recipes.find(r => r.id === topId);
            let costTopSum = 0;
            rTop.recipe_ingredients.forEach(ri => {
                costTopSum += ri.cantidad_o_porcentaje * ri.ingredients.costo_base_usd_unidad_minima;
            });
            const pesoTopFinal = rTop.peso_final_esperado || rTop.recipe_ingredients.reduce((a,b) => a + b.cantidad_o_porcentaje, 0);
            totalTopUnidad = (costTopSum / (pesoTopFinal || 1)) * topG;
        }

        const totalPkgUnidad = pkgItems.reduce((acc, i) => acc + parseFloat(i.costo_base_usd_unidad_minima), 0);
        const costUnit = totalMasaUnidad + totalTopUnidad + totalPkgUnidad;
        const grandTotal = costUnit * numUnits;

        const recipeName = document.getElementById('p-masa-id').options[document.getElementById('p-masa-id').selectedIndex].text;
        currentCalcData = {
            recipe_name: recipeName,
            cantidad_unidades: numUnits,
            costo_total_tanda: grandTotal
        };

        document.getElementById('p-breakdown-unit').innerHTML = `<strong>Unidad:</strong> Masa ($${totalMasaUnidad.toFixed(2)}) + Topping ($${totalTopUnidad.toFixed(2)}) + Envase ($${totalPkgUnidad.toFixed(2)})`;
        document.getElementById('p-table-body').innerHTML = `
            <tr><td style="padding:8px;">Masa (${(masaG * numUnits).toFixed(0)}g)</td><td align="right">$${(totalMasaUnidad * numUnits).toFixed(2)}</td></tr>
            <tr><td style="padding:8px;">Topping (${(topG * numUnits).toFixed(0)}g)</td><td align="right">$${(totalTopUnidad * numUnits).toFixed(2)}</td></tr>
            <tr><td style="padding:8px;">Empaques (${numUnits} und)</td><td align="right">$${(totalPkgUnidad * numUnits).toFixed(2)}</td></tr>
        `;
        document.getElementById('p-grand-total').innerText = `$${grandTotal.toFixed(2)}`;
        document.getElementById('p-unit-cost-final').innerText = `Costo Unitario Final: $${costUnit.toFixed(2)}`;
        document.getElementById('p-results').style.display = 'block';
    };

    document.getElementById('btn-save-log').onclick = async () => {
        if(!currentCalcData) return;
        const { error } = await supabase.from('production_logs').insert([currentCalcData]);
        if(!error) {
            alert("✅ Producción registrada exitosamente.");
            document.getElementById('p-results').style.display = 'none';
            pkgItems = [];
            renderPkg();
            renderProductionHistory(); // Refrescamos la lista abajo
        } else {
            alert("Error al guardar: " + error.message);
        }
    };
}

async function renderProductionHistory() {
    const { data: logs } = await supabase.from('production_logs')
        .select('*')
        .order('fecha_produccion', { ascending: false })
        .limit(10);

    const historyDiv = document.getElementById('production-history');
    if (!logs || logs.length === 0) {
        historyDiv.innerHTML = "<p style='color:#64748b;'>No hay registros aún.</p>";
        return;
    }

    historyDiv.innerHTML = `
        <table style="width:100%; border-collapse:collapse; margin-top:10px;">
            <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.75rem;">
                <th align="left" style="padding:5px;">Fecha</th>
                <th align="left">Producto</th>
                <th align="center">Und</th>
                <th align="right">Costo</th>
            </tr>
            ${logs.map(log => {
                const date = new Date(log.fecha_produccion).toLocaleDateString();
                return `
                <tr style="border-bottom:1px solid #f8fafc;">
                    <td style="padding:8px 5px;">${date}</td>
                    <td>${log.recipe_name}</td>
                    <td align="center">${log.cantidad_unidades}</td>
                    <td align="right"><strong>$${log.costo_total_tanda.toFixed(2)}</strong></td>
                </tr>
                `;
            }).join('')}
        </table>
    `;
}