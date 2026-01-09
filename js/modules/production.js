import { supabase } from '../supabase.js';

export async function loadProduction() {
    const { data: recipes } = await supabase.from('recipes').select('*, recipe_ingredients(*, ingredients(*))');
    const { data: ingredients } = await supabase.from('ingredients').select('*');
    const container = document.getElementById('app-content');

    const style = document.createElement('style');
    style.innerHTML = `
        .production-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 25px; }
        .input-group { margin-bottom: 15px; width: 100%; box-sizing: border-box; }
        .input-group label { display: block; margin-bottom: 5px; font-weight: bold; font-size: 0.9rem; color: #475569; }
        .input-field { 
            width: 100% !important; box-sizing: border-box !important; padding: 10px; 
            border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem;
        }
        .dual-input { display: grid; grid-template-columns: 2fr 1fr; gap: 10px; width: 100%; }
        .btn-calc-black {
            width: 100%; background: #0f172a; color: white; padding: 18px;
            border-radius: 12px; font-weight: bold; border: none; cursor: pointer;
            font-size: 1rem; display: flex; justify-content: center; align-items: center; gap: 10px;
            transition: background 0.2s;
        }
        .btn-calc-black:hover { background: #1e293b; }
        .item-tag {
            display: flex; justify-content: space-between; align-items: center;
            padding: 8px 12px; background: #f1f5f9; border-radius: 6px; 
            margin-bottom: 6px; font-size: 0.85rem; border: 1px solid #e2e8f0;
        }
        .delete-icon { color: #ef4444; cursor: pointer; font-weight: bold; padding: 0 5px; }
        @media (max-width: 850px) { .production-grid { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(style);

    container.innerHTML = `
        <div class="main-container">
            <header style="margin-bottom: 25px;">
                <h1>🚀 Panel de Producción</h1>
                <p>Masa base + Toppings múltiples + Empaque completo.</p>
            </header>

            <div class="production-grid">
                <div class="stat-card">
                    <h3>Configurar Tanda</h3>
                    
                    <div class="input-group">
                        <label>1. Masa Base (Gramos por unidad)</label>
                        <div class="dual-input">
                            <select id="p-masa-id" class="input-field">
                                ${recipes.filter(r => r.tipo_receta === 'panadera').map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
                            </select>
                            <input type="number" id="p-masa-g" class="input-field" value="250">
                        </div>
                    </div>

                    <div class="input-group">
                        <label>2. Añadir Toppings (Múltiples)</label>
                        <select id="p-top-id" class="input-field">
                            <option value="">-- Seleccionar Topping --</option>
                            ${recipes.filter(r => r.tipo_receta === 'estandar').map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
                        </select>
                        <div id="p-top-list" style="margin-top:10px;"></div>
                    </div>

                    <div class="input-group">
                        <label>3. Empaque e Insumos (Envase, Papel, Etiqueta)</label>
                        <select id="p-item-id" class="input-field">
                            <option value="">-- Seleccionar Empaque --</option>
                            ${ingredients
                                .filter(i => {
                                    const cat = (i.categoria || "").toLowerCase();
                                    const nom = (i.name || "").toLowerCase();
                                    // Filtro robusto que busca la palabra "empaque" o nombres clave
                                    return cat.includes('empaque') || 
                                           cat.includes('varios') || 
                                           nom.includes('envase') || 
                                           nom.includes('etiqueta') || 
                                           nom.includes('papel') || 
                                           nom.includes('caja') || 
                                           nom.includes('bolsa');
                                })
                                .map(i => `<option value="${i.id}">${i.name}</option>`).join('')}
                        </select>
                        <div id="p-pkg-list" style="margin-top:10px;"></div>
                    </div>

                    <div class="input-group">
                        <label style="color:#0284c7;">4. Unidades a Producir</label>
                        <input type="number" id="p-unidades" class="input-field" value="6" style="border: 2px solid #0284c7; font-weight:bold; text-align:center;">
                    </div>

                    <button id="btn-calc-prod" class="btn-calc-black">📊 CALCULAR HOJA DE COSTOS</button>
                    
                    <div id="production-history" style="margin-top:30px;">Cargando historial...</div>
                </div>

                <div id="p-results" class="stat-card" style="display:none; border-top: 6px solid #10b981; position: sticky; top: 20px;">
                    <h3>📋 Resumen de Inversión</h3>
                    <div id="p-breakdown-unit" style="margin-bottom:15px; padding:12px; background:#f8fafc; border-radius:8px; font-size:0.9rem;"></div>
                    <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
                        <tbody id="p-table-body"></tbody>
                    </table>
                    <div style="margin-top:20px; padding:25px; background:#0f172a; color:#fff; border-radius:15px; text-align:center;">
                        <span style="opacity:0.7;">INVERSIÓN TOTAL TANDA:</span>
                        <div id="p-grand-total" style="font-size:2.8rem; font-weight:bold; color:#4ade80;">$0.00</div>
                        <div id="p-unit-cost-final" style="font-size:1rem; opacity:0.8;"></div>
                    </div>
                    <button id="btn-save-log" class="btn-primary" style="width:100%; margin-top:20px; background:#10b981; padding: 15px; border:none; border-radius:10px; color:white; font-weight:bold; cursor:pointer;">✅ Confirmar y Guardar</button>
                </div>
            </div>
        </div>
    `;

    setupProductionLogic(recipes, ingredients);
    renderProductionHistory();
}

function setupProductionLogic(recipes, ingredients) {
    let selectedToppings = [];
    let pkgItems = [];
    let currentCalcData = null;

    // Lógica Toppings
    document.getElementById('p-top-id').onchange = (e) => {
        const topping = recipes.find(r => r.id === e.target.value);
        if(topping && !selectedToppings.find(t => t.id === topping.id)) {
            const gramos = prompt(`¿Cuántos gramos de ${topping.name} por unidad?`, "38");
            if (gramos) {
                selectedToppings.push({ ...topping, gramos: parseFloat(gramos) });
                renderToppings();
            }
        }
        e.target.value = "";
    };

    // Lógica Empaques
    document.getElementById('p-item-id').onchange = (e) => {
        const item = ingredients.find(i => i.id === e.target.value);
        if(item && !pkgItems.find(p => p.id === item.id)) { 
            pkgItems.push(item); 
            renderPkg(); 
        }
        e.target.value = "";
    };

    function renderToppings() {
        document.getElementById('p-top-list').innerHTML = selectedToppings.map((t, idx) => `
            <div class="item-tag" style="background: #fff7ed; border-color: #ffedd5;">
                <span>🌿 ${t.name} (${t.gramos}g)</span>
                <span class="delete-icon" onclick="removeTopping(${idx})">✕</span>
            </div>
        `).join('');
    }

    function renderPkg() {
        document.getElementById('p-pkg-list').innerHTML = pkgItems.map((item, idx) => `
            <div class="item-tag" style="background: #f0fdf4; border-color: #dcfce7;">
                <span>📦 ${item.name}</span>
                <span class="delete-icon" onclick="removePkgItem(${idx})">✕</span>
            </div>
        `).join('');
    }

    // Funciones globales para los clics de eliminar
    window.removeTopping = (idx) => { selectedToppings.splice(idx, 1); renderToppings(); };
    window.removePkgItem = (idx) => { pkgItems.splice(idx, 1); renderPkg(); };

    // Botón Calcular
    document.getElementById('btn-calc-prod').onclick = () => {
        const masaId = document.getElementById('p-masa-id').value;
        const masaG = parseFloat(document.getElementById('p-masa-g').value);
        const numUnits = parseFloat(document.getElementById('p-unidades').value) || 1;
        const recipeMasa = recipes.find(r => r.id === masaId);

        if(!recipeMasa) return alert("Por favor selecciona una masa base.");

        // Cálculo Masa
        let costMasa = 0, pesoMasaTotal = 0;
        recipeMasa.recipe_ingredients.forEach(ri => {
            costMasa += ri.cantidad_o_porcentaje * 10 * ri.ingredients.costo_base_usd_unidad_minima;
            pesoMasaTotal += ri.cantidad_o_porcentaje * 10;
        });
        const cUnitMasa = (costMasa / pesoMasaTotal) * masaG;

        // Cálculo Toppings
        let cTotalToppingsUnit = 0;
        selectedToppings.forEach(t => {
            let costT = 0;
            t.recipe_ingredients.forEach(ri => {
                costT += ri.cantidad_o_porcentaje * ri.ingredients.costo_base_usd_unidad_minima;
            });
            const pesoT = t.peso_final_esperado || t.recipe_ingredients.reduce((a,b) => a + b.cantidad_o_porcentaje, 0);
            cTotalToppingsUnit += (costT / pesoT) * t.gramos;
        });

        // Cálculo Empaques
        const cUnitPkg = pkgItems.reduce((acc, i) => acc + parseFloat(i.costo_base_usd_unidad_minima), 0);

        const totalPerUnit = cUnitMasa + cTotalToppingsUnit + cUnitPkg;
        const costTotalTanda = totalPerUnit * numUnits;

        // Renderizar tabla de resultados
        document.getElementById('p-grand-total').innerText = `$${costTotalTanda.toFixed(2)}`;
        document.getElementById('p-unit-cost-final').innerText = `Unitario: $${totalPerUnit.toFixed(2)}`;
        document.getElementById('p-table-body').innerHTML = `
            <tr><td style="padding:10px; border-bottom:1px solid #f1f5f9;">Masa Base (${recipeMasa.name})</td><td align="right">$${(cUnitMasa * numUnits).toFixed(2)}</td></tr>
            <tr><td style="padding:10px; border-bottom:1px solid #f1f5f9;">Toppings (${selectedToppings.length})</td><td align="right">$${(cTotalToppingsUnit * numUnits).toFixed(2)}</td></tr>
            <tr><td style="padding:10px; border-bottom:1px solid #f1f5f9;">Empaques (${pkgItems.length})</td><td align="right">$${(cUnitPkg * numUnits).toFixed(2)}</td></tr>
        `;
        
        currentCalcData = {
            recipe_name: recipeMasa.name,
            cantidad_unidades: numUnits,
            costo_total_tanda: costTotalTanda,
            fecha_produccion: new Date().toISOString()
        };
        document.getElementById('p-results').style.display = 'block';
    };

    // Botón Guardar
    document.getElementById('btn-save-log').onclick = async () => {
        if(!currentCalcData) return;
        const { error } = await supabase.from('production_logs').insert([currentCalcData]);
        if(!error) { 
            alert("✅ Registro guardado en el historial"); 
            loadProduction(); 
        } else {
            alert("Error al guardar: " + error.message);
        }
    };
}

async function renderProductionHistory() {
    const { data: logs } = await supabase.from('production_logs').select('*').order('fecha_produccion', { ascending: false }).limit(5);
    const historyDiv = document.getElementById('production-history');
    if (!logs || logs.length === 0) { historyDiv.innerHTML = "<p>Sin historial de producción.</p>"; return; }

    historyDiv.innerHTML = `
        <h3 style="margin-bottom:10px;">Últimos Reportes</h3>
        <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
            ${logs.map(log => `
                <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:10px 0;"><b>${new Date(log.fecha_produccion).toLocaleDateString()}</b><br>${log.recipe_name}</td>
                    <td align="center">${log.cantidad_unidades}u</td>
                    <td align="right"><b>$${log.costo_total_tanda.toFixed(2)}</b></td>
                </tr>
            `).join('')}
        </table>
    `;
}