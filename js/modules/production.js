import { supabase } from '../supabase.js';

export async function loadProduction() {
    const { data: recipes } = await supabase.from('recipes').select('*, recipe_ingredients(*, ingredients(*))');
    const { data: ingredients } = await supabase.from('ingredients').select('*');
    const container = document.getElementById('app-content');

    const style = document.createElement('style');
    style.innerHTML = `
        .production-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 25px; }
        
        /* Ajuste de Simetría Total */
        .input-group { margin-bottom: 15px; width: 100%; box-sizing: border-box; }
        .input-group label { display: block; margin-bottom: 5px; font-weight: bold; font-size: 0.9rem; color: #475569; }
        
        /* Forzamos que todos los campos midan lo mismo */
        .input-field, .select-field { 
            width: 100% !important; 
            box-sizing: border-box !important; 
            padding: 10px; 
            border: 1px solid #cbd5e1; 
            border-radius: 8px; 
            font-size: 1rem;
        }

        /* Contenedores de dos columnas alineados */
        .dual-input { 
            display: grid; 
            grid-template-columns: 2fr 1fr; 
            gap: 10px; 
            width: 100%; 
            box-sizing: border-box; 
        }

        .btn-calc-black {
            width: 100%; background: #0f172a; color: white; padding: 18px;
            border-radius: 12px; font-weight: bold; border: none; cursor: pointer;
            font-size: 1rem; display: flex; justify-content: center; align-items: center; gap: 10px;
            box-sizing: border-box;
        }

        .btn-download {
            background: #f1f5f9; border: 1px solid #e2e8f0; padding: 8px 12px;
            border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: bold;
            display: flex; align-items: center; gap: 5px;
        }

        .delete-icon { color: #ef4444; cursor: pointer; opacity: 0.6; }
        
        @media (max-width: 850px) { .production-grid { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(style);

    container.innerHTML = `
        <div class="main-container">
            <header style="margin-bottom: 25px;">
                <h1>🚀 Panel de Producción</h1>
                <p>Planifica tu tanda y consulta el historial de inversión.</p>
            </header>

            <div class="production-grid">
                <div class="stat-card" style="box-sizing: border-box;">
                    <h3 style="margin-bottom: 20px;">Configurar Tanda de Venta</h3>
                    
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
                        <label>2. Topping (Gramos por unidad)</label>
                        <div class="dual-input">
                            <select id="p-top-id" class="input-field">
                                <option value="">-- Sin Topping --</option>
                                ${recipes.filter(r => r.tipo_receta === 'estandar').map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
                            </select>
                            <input type="number" id="p-top-g" class="input-field" value="38">
                        </div>
                    </div>

                    <div class="input-group">
                        <label>3. Empaque / Insumos</label>
                        <select id="p-item-id" class="input-field">
                            <option value="">-- Añadir Envase, Etiqueta, Papel --</option>
                            ${ingredients.filter(i => i.categoria === 'Materia Prima Base' || i.categoria === 'Varios').map(i => `<option value="${i.id}">${i.name}</option>`).join('')}
                        </select>
                        <div id="p-pkg-list" style="margin-top:10px;"></div>
                    </div>

                    <div class="input-group">
                        <label style="color:#0284c7;">4. Unidades a Producir</label>
                        <input type="number" id="p-unidades" class="input-field" value="6" style="border: 2px solid #0284c7; font-weight:bold; text-align:center;">
                    </div>

                    <div class="input-group">
                        <label>📝 Notas del Maestro</label>
                        <textarea id="p-batch-notes" class="input-field" style="height: 70px; background: #fffbeb; resize:none;" placeholder="Ej: Harina nueva..."></textarea>
                    </div>

                    <button id="btn-calc-prod" class="btn-calc-black">📊 CALCULAR HOJA DE COSTOS</button>
                    
                    <hr style="opacity:0.1; margin:30px 0;">
                    
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <h3 style="margin:0;">📋 Historial</h3>
                        <button id="btn-export-csv" class="btn-download">📥 Descargar CSV</button>
                    </div>
                    <div id="production-history">Cargando historial...</div>
                </div>

                <div id="p-results" class="stat-card" style="display:none; border-top: 6px solid #10b981; height: fit-content; position: sticky; top: 20px;">
                    <h3>📋 Resumen de Inversión</h3>
                    <div id="p-breakdown-unit" style="margin-bottom:15px; padding:12px; background:#f8fafc; border-radius:8px; font-size:0.9rem; border: 1px solid #e2e8f0;"></div>
                    <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
                        <tbody id="p-table-body"></tbody>
                    </table>
                    <div style="margin-top:20px; padding:25px; background:#0f172a; color:#fff; border-radius:15px; text-align:center;">
                        <span style="opacity:0.7;">INVERSIÓN TOTAL TANDA:</span>
                        <div id="p-grand-total" style="font-size:2.8rem; font-weight:bold; color:#4ade80;">$0.00</div>
                        <div id="p-unit-cost-final" style="font-size:1rem; opacity:0.8;"></div>
                    </div>
                    <button id="btn-save-log" class="btn-primary" style="width:100%; margin-top:20px; background:#10b981; padding: 15px;">✅ Confirmar y Guardar Reporte</button>
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

    document.getElementById('btn-export-csv').onclick = async () => {
        const { data } = await supabase.from('production_logs').select('*').order('fecha_produccion', { ascending: false });
        if(!data) return;
        const csvContent = "data:text/csv;charset=utf-8,Fecha,Producto,Unidades,Costo Total,Notas\n" 
            + data.map(r => `${new Date(r.fecha_produccion).toLocaleDateString()},${r.recipe_name},${r.cantidad_unidades},${r.costo_total_tanda},"${r.batch_notes || ''}"`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Produccion_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    document.getElementById('p-item-id').onchange = (e) => {
        const item = ingredients.find(i => i.id === e.target.value);
        if(item && !pkgItems.find(p => p.id === item.id)) { pkgItems.push(item); renderPkg(); }
        e.target.value = "";
    };

    function renderPkg() {
        document.getElementById('p-pkg-list').innerHTML = pkgItems.map((item, index) => `
            <div style="display:flex; justify-content:space-between; margin-bottom:6px; padding:10px; background:#f1f5f9; border-radius:6px; font-size:0.85rem; border: 1px solid #e2e8f0;">
                <span>📦 ${item.name}</span>
                <span style="color:#ef4444; cursor:pointer; font-weight:bold;" onclick="window.removePkgItem(${index})">✕</span>
            </div>
        `).join('');
    }

    window.removePkgItem = (index) => { pkgItems.splice(index, 1); renderPkg(); };

    window.deleteLog = async (id) => {
        if(!confirm("¿Eliminar este registro?")) return;
        const { error } = await supabase.from('production_logs').delete().eq('id', id);
        if(!error) renderProductionHistory();
    };

    document.getElementById('btn-calc-prod').onclick = () => {
        const masaId = document.getElementById('p-masa-id').value;
        const masaG = parseFloat(document.getElementById('p-masa-g').value);
        const topId = document.getElementById('p-top-id').value;
        const topG = parseFloat(document.getElementById('p-top-g').value) || 0;
        const numUnits = parseFloat(document.getElementById('p-unidades').value) || 1;
        const recipe = recipes.find(r => r.id === masaId);

        let costMasa = 0, percMasa = 0;
        recipe.recipe_ingredients.forEach(ri => {
            costMasa += ri.cantidad_o_porcentaje * 10 * ri.ingredients.costo_base_usd_unidad_minima;
            percMasa += ri.cantidad_o_porcentaje;
        });
        const cUnitMasa = (costMasa / (percMasa * 10)) * masaG;

        let cUnitTop = 0;
        if(topId) {
            const rTop = recipes.find(r => r.id === topId);
            let costT = 0;
            rTop.recipe_ingredients.forEach(ri => costT += ri.cantidad_o_porcentaje * ri.ingredients.costo_base_usd_unidad_minima);
            const pesoT = rTop.peso_final_esperado || rTop.recipe_ingredients.reduce((a,b) => a + b.cantidad_o_porcentaje, 0);
            cUnitTop = (costT / (pesoT || 1)) * topG;
        }

        const cUnitPkg = pkgItems.reduce((acc, i) => acc + parseFloat(i.costo_base_usd_unidad_minima), 0);
        const costTotal = (cUnitMasa + cUnitTop + cUnitPkg) * numUnits;

        currentCalcData = {
            recipe_name: document.getElementById('p-masa-id').options[document.getElementById('p-masa-id').selectedIndex].text,
            cantidad_unidades: numUnits,
            costo_total_tanda: costTotal,
            batch_notes: document.getElementById('p-batch-notes').value,
            fecha_produccion: new Date().toISOString()
        };

        document.getElementById('p-grand-total').innerText = `$${costTotal.toFixed(2)}`;
        document.getElementById('p-unit-cost-final').innerText = `Unitario: $${(costTotal/numUnits).toFixed(2)}`;
        document.getElementById('p-table-body').innerHTML = `
            <tr><td style="padding:10px;">Masa Base</td><td align="right">$${(cUnitMasa * numUnits).toFixed(2)}</td></tr>
            ${topId ? `<tr><td style="padding:10px;">Topping</td><td align="right">$${(cUnitTop * numUnits).toFixed(2)}</td></tr>` : ''}
            <tr><td style="padding:10px;">Empaques</td><td align="right">$${(cUnitPkg * numUnits).toFixed(2)}</td></tr>
        `;
        document.getElementById('p-results').style.display = 'block';
    };

    document.getElementById('btn-save-log').onclick = async () => {
        const { error } = await supabase.from('production_logs').insert([currentCalcData]);
        if(!error) { alert("✅ Guardado"); loadProduction(); }
    };
}

async function renderProductionHistory() {
    const { data: logs } = await supabase.from('production_logs').select('*').order('fecha_produccion', { ascending: false }).limit(10);
    const historyDiv = document.getElementById('production-history');
    if (!logs || logs.length === 0) { historyDiv.innerHTML = "<p>Sin registros.</p>"; return; }

    historyDiv.innerHTML = `
        <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
            ${logs.map(log => `
                <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:10px 5px;">
                        <b>${new Date(log.fecha_produccion).toLocaleDateString()}</b><br>
                        <small style="color:#b45309;">${log.batch_notes || ''}</small>
                    </td>
                    <td>${log.recipe_name}</td>
                    <td align="center">${log.cantidad_unidades}u</td>
                    <td align="right"><b>$${log.costo_total_tanda.toFixed(2)}</b></td>
                    <td align="right" style="padding-left:10px;">
                        <span class="delete-icon" onclick="deleteLog('${log.id}')">🗑️</span>
                    </td>
                </tr>
            `).join('')}
        </table>
    `;
}