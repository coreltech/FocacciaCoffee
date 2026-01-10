import { supabase } from '../supabase.js';

let selectedExtras = [];
let allInputsCache = [];

export async function loadProduction() {
    // 1. CARGA DE DATOS: Recetas, Insumos y ahora el Catálogo (Producto Terminado)
    const { data: recipes } = await supabase.from('recipes').select('*').order('name');
    const { data: allInputs } = await supabase.from('v_unified_inputs').select('*').order('name');
    const { data: catalog } = await supabase.from('sales_prices').select('*').eq('esta_activo', true).order('product_name');
    
    allInputsCache = allInputs || [];
    
    const container = document.getElementById('app-content');

    const style = document.createElement('style');
    style.innerHTML = `
        .prod-container { display: grid; grid-template-columns: 1fr 1.2fr; gap: 30px; padding: 10px; }
        .setup-panel, .results-panel { background: white; padding: 25px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .setup-panel { border-top: 6px solid #0284c7; }
        .results-panel { border-top: 6px solid #10b981; position: sticky; top: 20px; height: fit-content; }
        .section-title { font-size: 0.8rem; font-weight: 800; color: #64748b; text-transform: uppercase; margin: 25px 0 10px 0; display: flex; align-items: center; gap: 8px; }
        .section-title::after { content: ""; flex: 1; height: 1px; background: #e2e8f0; }
        .input-field { width: 100%; padding: 12px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 1rem; box-sizing: border-box; }
        .item-list { margin: 15px 0; background: #f8fafc; border-radius: 12px; padding: 12px; border: 1px dashed #cbd5e1; min-height: 50px; }
        .added-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; background: white; border-radius: 8px; margin-bottom: 8px; border: 1px solid #e2e8f0; font-size: 0.9rem; }
        .badge { font-size: 0.6rem; padding: 3px 8px; border-radius: 4px; font-weight: 800; margin-right: 8px; }
        .badge-topping { background: #dcfce7; color: #166534; }
        .badge-envase { background: #e0f2fe; color: #075985; }
        .btn-calc { width: 100%; background: #0f172a; color: white; padding: 18px; border-radius: 12px; font-weight: 700; border: none; cursor: pointer; margin-top: 15px; }
        .total-display { background: #0f172a; color: white; padding: 30px; border-radius: 20px; text-align: center; margin-top: 20px; }
        .history-item { background: #fff; border: 1px solid #e2e8f0; padding: 12px; border-radius: 10px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
        .btn-delete-hist { color: #ef4444; cursor: pointer; font-size: 1.2rem; border: none; background: none; }
        .stock-alert { background: #fff7ed; color: #9a3412; padding: 10px; border-radius: 8px; font-size: 0.8rem; border: 1px solid #ffedd5; margin-top: 10px; }
    `;
    document.head.appendChild(style);

    container.innerHTML = `
        <div class="main-container">
            <header style="margin-bottom: 30px;">
                <h1>🚀 Producción y Almacén</h1>
                <p>Transforma tus recetas en stock para la venta.</p>
            </header>

            <div class="prod-container">
                <div class="setup-panel">
                    <h3>Nueva Tanda de Horneo</h3>
                    <input type="text" id="p-batch-name" class="input-field" placeholder="Nombre interno (ej. Tanda Mañana - Ajo)">
                    
                    <div class="section-title">1. Masa Base (g por unidad)</div>
                    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 10px;">
                        <select id="p-masa-id" class="input-field">
                            <option value="">-- Seleccionar Masa --</option>
                            ${recipes?.filter(r => r.tipo_receta === 'panadera').map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
                        </select>
                        <input type="number" id="p-masa-g" class="input-field" value="250">
                    </div>

                    <div class="section-title">2. Toppings (g por unidad)</div>
                    <select id="p-sel-topping" class="input-field">
                        <option value="">-- Seleccionar Topping --</option>
                        ${allInputsCache.filter(i => i.tipo === 'receta').map(i => `<option value="${i.id}">${i.name}</option>`).join('')}
                    </select>

                    <div class="section-title">3. Empaque / Etiquetas (u por unidad)</div>
                    <select id="p-sel-envase" class="input-field">
                        <option value="">-- Seleccionar Insumo --</option>
                        ${allInputsCache.filter(i => i.tipo === 'ingrediente' && (i.name.toLowerCase().includes('envase') || i.name.toLowerCase().includes('bolsa') || i.name.toLowerCase().includes('caja') || i.name.toLowerCase().includes('etiqueta'))).map(i => `<option value="${i.id}">${i.name}</option>`).join('')}
                    </select>

                    <div id="p-added-items" class="item-list">
                        <p style="color:#94a3b8; font-size:0.8rem; text-align:center; margin:0;">Ensambla los componentes...</p>
                    </div>

                    <div class="section-title">4. Cantidad a Producir</div>
                    <input type="number" id="p-unidades" class="input-field" value="1" style="font-weight:bold; border-color:#0284c7;">

                    <div class="section-title">5. Destino (Producto en Catálogo)</div>
                    <select id="p-catalog-id" class="input-field" style="border-color: #10b981; font-weight: bold;">
                        <option value="">-- Seleccionar Producto del Catálogo --</option>
                        ${catalog?.map(p => `<option value="${p.id}">${p.product_name} (Stock: ${p.stock_disponible || 0})</option>`).join('')}
                    </select>
                    <div class="stock-alert">⚠️ Al finalizar, estas unidades se sumarán al stock disponible en el Catálogo de Venta.</div>

                    <button id="btn-calculate" class="btn-calc">📊 CALCULAR Y PREVISUALIZAR</button>
                    <button id="btn-reset-form" style="width:100%; background:none; color:#64748b; border:none; margin-top:10px; cursor:pointer;">✕ Limpiar Formulario</button>

                    <div style="margin-top:40px;">
                        <h4>Historial de Producción</h4>
                        <div id="p-history-content">Cargando historial...</div>
                    </div>
                </div>

                <div id="p-results-area" class="results-panel" style="display:none;">
                    <h3>📋 Reporte de Producción</h3>
                    <div id="p-breakdown"></div>
                    <div class="total-display">
                        <div id="res-grand-total" style="font-size:3.5rem; font-weight:800; color:#4ade80;">$0.00</div>
                        <div id="res-unit-cost" style="border-top: 1px solid #334155; padding-top:15px;"></div>
                    </div>
                    <button id="btn-save-production" class="btn-calc" style="background:#10b981;">✅ FINALIZAR Y ENVIAR A ALMACÉN</button>
                </div>
            </div>
        </div>
    `;

    setupProductionLogic(recipes);
    renderProductionHistory();
}

// ... (getLivePrice se mantiene igual)
async function getLivePrice(id, tipo) {
    if (tipo === 'ingrediente') {
        const { data } = await supabase.from('ingredients').select('costo_base_usd_unidad_minima').eq('id', id).single();
        return data?.costo_base_usd_unidad_minima || 0;
    } else {
        const { data: items } = await supabase.from('recipe_items').select('*, ingredients(*)').eq('recipe_id', id);
        if (!items) return 0;
        let cost = 0, weight = 0;
        items.forEach(i => {
            const p = i.ingredients?.costo_base_usd_unidad_minima || 0;
            const g = i.quantity * 10;
            cost += (g * p); weight += g;
        });
        return weight > 0 ? (cost / weight) : 0;
    }
}

function setupProductionLogic(recipes) {
    const listDiv = document.getElementById('p-added-items');
    
    const resetForm = () => {
        selectedExtras = [];
        document.getElementById('p-batch-name').value = "";
        document.getElementById('p-masa-id').value = "";
        document.getElementById('p-catalog-id').value = "";
        document.getElementById('p-unidades').value = "1";
        document.getElementById('p-results-area').style.display = "none";
        renderList();
    };

    document.getElementById('btn-reset-form').onclick = resetForm;

    const handleAdd = async (sel, tipo) => {
        const opt = sel.options[sel.selectedIndex];
        if(!opt.value) return;
        const precio = await getLivePrice(opt.value, tipo);
        const promptMsg = tipo === 'receta' ? `¿Gramos de "${opt.text}" por unidad?` : `¿Unidades de "${opt.text}" por focaccia?`;
        const cant = prompt(promptMsg, tipo === 'receta' ? "50" : "1");
        
        if (cant && !isNaN(cant)) {
            selectedExtras.push({ id: opt.value, name: opt.text, precio, cantidadPorUnidad: parseFloat(cant), tipo });
            renderList();
        }
        sel.value = "";
    };

    document.getElementById('p-sel-topping').onchange = (e) => handleAdd(e.target, 'receta');
    document.getElementById('p-sel-envase').onchange = (e) => handleAdd(e.target, 'ingrediente');

    function renderList() {
        if(selectedExtras.length === 0) {
            listDiv.innerHTML = '<p style="color:#94a3b8; font-size:0.8rem; text-align:center; margin:0;">Ensambla los componentes...</p>';
            return;
        }
        listDiv.innerHTML = selectedExtras.map((item, idx) => `
            <div class="added-item">
                <span><span class="badge ${item.tipo === 'receta' ? 'badge-topping' : 'badge-envase'}">${item.tipo.toUpperCase()}</span> ${item.name}</span>
                <span><strong>${item.cantidadPorUnidad}${item.tipo === 'receta' ? 'g' : 'u'}</strong> <button onclick="removeExtraProd(${idx})" style="border:none; background:none; color:red; cursor:pointer; margin-left:10px;">✕</button></span>
            </div>
        `).join('');
    }

    window.removeExtraProd = (idx) => { selectedExtras.splice(idx, 1); renderList(); };

    document.getElementById('btn-calculate').onclick = async () => {
        const masaId = document.getElementById('p-masa-id').value;
        const masaG = parseFloat(document.getElementById('p-masa-g').value) || 0;
        const units = parseFloat(document.getElementById('p-unidades').value) || 1;
        const catalogId = document.getElementById('p-catalog-id').value;

        if(!masaId) return alert("Selecciona la masa base");
        if(!catalogId) return alert("Debes seleccionar el producto del catálogo para actualizar el stock.");

        const costMasaGramo = await getLivePrice(masaId, 'receta');
        const costMasaTotal = costMasaGramo * masaG * units;
        const costExtrasTotal = selectedExtras.reduce((acc, x) => acc + (x.precio * x.cantidadPorUnidad * units), 0);
        const total = costMasaTotal + costExtrasTotal;

        document.getElementById('p-results-area').style.display = 'block';
        document.getElementById('res-grand-total').innerText = `$${total.toFixed(2)}`;
        document.getElementById('res-unit-cost').innerText = `Costo Real Unitario: $${(total/units).toFixed(2)}`;
        document.getElementById('p-breakdown').innerHTML = `
            <div class="added-item"><span>Masa Base (${masaG}g x ${units})</span> <strong>$${costMasaTotal.toFixed(2)}</strong></div>
            ${selectedExtras.map(x => `
                <div class="added-item">
                    <span>${x.name} (${x.cantidadPorUnidad}${x.tipo === 'receta' ? 'g' : 'u'} x ${units})</span>
                    <strong>$${(x.precio * x.cantidadPorUnidad * units).toFixed(2)}</strong>
                </div>
            `).join('')}
        `;

        document.getElementById('btn-save-production').onclick = async () => {
            // 1. Guardar Log de Producción
            const { error: logError } = await supabase.from('production_logs').insert([{
                recipe_name: document.getElementById('p-batch-name').value || "Producción General",
                cantidad_unidades: units,
                costo_total_tanda: total,
                fecha_produccion: new Date().toISOString()
            }]);

            if(logError) return alert("Error al guardar log: " + logError.message);

            // 2. ACTUALIZAR STOCK EN CATÁLOGO (Conexión Crítica)
            const { data: currentProd } = await supabase.from('sales_prices').select('stock_disponible').eq('id', catalogId).single();
            const nuevoStock = (currentProd.stock_disponible || 0) + units;

            const { error: stockError } = await supabase.from('sales_prices').update({ 
                stock_disponible: nuevoStock 
            }).eq('id', catalogId);

            if(!stockError) {
                alert(`✅ Producción registrada. Almacén actualizado: ${nuevoStock} unidades.`);
                loadProduction(); // Recargamos todo el módulo para ver stock actualizado
            } else {
                alert("Error al actualizar stock: " + stockError.message);
            }
        };
    };
}

// ... (renderProductionHistory se mantiene igual)
async function renderProductionHistory() {
    const { data: logs } = await supabase.from('production_logs').select('*').order('fecha_produccion', { ascending: false }).limit(10);
    const histDiv = document.getElementById('p-history-content');
    
    window.deleteProdLog = async (id) => {
        if(confirm("¿Seguro que quieres borrar este registro?")) {
            const { error } = await supabase.from('production_logs').delete().eq('id', id);
            if(!error) renderProductionHistory();
        }
    };

    histDiv.innerHTML = logs?.map(l => `
        <div class="history-item">
            <div>
                <strong>${l.recipe_name}</strong><br>
                <small>${new Date(l.fecha_produccion).toLocaleDateString()} - ${l.cantidad_unidades} und.</small>
            </div>
            <div style="display:flex; align-items:center; gap:15px;">
                <span style="color:#10b981; font-weight:800;">$${l.costo_total_tanda.toFixed(2)}</span>
                <button class="btn-delete-hist" onclick="deleteProdLog('${l.id}')">🗑️</button>
            </div>
        </div>
    `).join('') || '<small>No hay registros.</small>';
}