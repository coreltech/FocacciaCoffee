// ==========================================
// 1. IMPORTACIONES
// ==========================================
import { supabase } from '../supabase.js';
import { getGlobalRates } from './settings.js';

// ==========================================
// 2. FUNCIÓN PRINCIPAL (Interfaz)
// ==========================================
export async function loadCatalog() {
    const rates = await getGlobalRates();
    const container = document.getElementById('app-content');
    
    // Carga de productos y logs de producción para obtener costos automáticos
    const { data: products } = await supabase.from('sales_prices').select('*').order('product_name');
    const { data: recentLogs } = await supabase.from('production_logs').select('*').order('fecha_produccion', { ascending: false });

    container.innerHTML = `
        <div class="main-container">
            <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
                <div>
                    <h1 style="font-size: 1.8rem; margin:0;">📋 Catálogo de Productos</h1>
                    <p style="color: #64748b;">Gestión de precios, fotos y stock disponible.</p>
                </div>
                <div style="text-align:right; font-size:0.8rem; background:#f8fafc; padding:10px; border-radius:10px; border:1px solid #e2e8f0;">
                    <b>BCV:</b> $1 = ${rates.tasa_usd_ves} | €1 = ${rates.tasa_eur_ves}
                </div>
            </header>

            <div style="display:grid; grid-template-columns: 1fr 2fr; gap:25px;">
                <div class="stat-card" style="padding:20px;">
                    <h3 style="margin-bottom:15px; border-bottom:2px solid #f1f5f9; padding-bottom:10px;">Añadir al Catálogo</h3>
                    <form id="catalog-form">
                        
                        <div class="input-group">
                            <label>Nombre del Producto</label>
                            <input type="text" id="c-name" class="input-field" list="recipe-suggestions" placeholder="Ej: Focaccia de Romero" required>
                            <datalist id="recipe-suggestions">
                                ${recentLogs?.map(l => `<option value="${l.recipe_name}" data-cost="${l.costo_total_tanda / l.cantidad_unidades}">`).join('')}
                            </datalist>
                        </div>
                        
                        <div class="input-group">
                            <label>Precio de Venta ($)</label>
                            <input type="number" id="c-price" class="input-field" step="0.01" required>
                            
                            <div id="calculator-core" style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-top: 10px;">
                                <div style="display:flex; justify-content:space-between; font-size: 0.75rem; font-weight: bold; margin-bottom: 8px;">
                                    <span style="color:#2563eb;">GANANCIA: <span id="lbl-margin">--</span></span>
                                    <span style="color:#64748b;">COSTO: <span id="lbl-cost">$0.00</span></span>
                                </div>
                                <input type="range" id="c-margin-range" min="0" max="300" value="60" style="width:100%; margin-bottom:10px;">
                                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size: 0.7rem; color: #475569; border-top: 1px solid #e2e8f0; padding-top: 8px;">
                                    <span>Bs. <b id="val-ves">0.00</b></span>
                                    <span>Eur. <b id="val-eur">0.00</b></span>
                                </div>
                            </div>
                        </div>

                        <div class="input-group">
                            <label>Categoría</label>
                            <select id="c-category" class="input-field">
                                <option value="Focaccias">Focaccias</option>
                                <option value="Cafetería">Cafetería</option>
                                <option value="Bebidas">Bebidas</option>
                                <option value="Otros">Otros</option>
                            </select>
                        </div>

                        <div class="input-group">
                            <label>Foto del Producto</label>
                            <input type="file" id="c-image" class="input-field" accept="image/*" style="padding:8px;">
                        </div>

                        <button type="submit" class="btn-primary" style="width:100%; margin-top:15px; background:#2563eb;">
                            💾 Guardar en Catálogo
                        </button>
                    </form>
                </div>

                <div class="stat-card" style="padding:20px;">
                    <h3 style="margin-bottom:15px;">Inventario en Mostrador</h3>
                    <table style="width:100%; border-collapse: collapse;">
                        <thead>
                            <tr style="text-align:left; border-bottom:2px solid #f1f5f9; color:#64748b; font-size:0.85rem;">
                                <th style="padding:10px;">FOTO</th>
                                <th>PRODUCTO</th>
                                <th>PRECIO</th>
                                <th>STOCK</th>
                                <th>ESTADO</th>
                                <th>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${products?.map(p => `
                                <tr style="border-bottom:1px solid #f1f5f9;">
                                    <td style="padding:10px;">
                                        <img src="${p.image_url || 'https://via.placeholder.com/50'}" style="width:50px; height:50px; object-fit:cover; border-radius:8px; border:1px solid #e2e8f0;">
                                    </td>
                                    <td>
                                        <span style="font-weight:bold; display:block;">${p.product_name}</span>
                                        <small style="color:#94a3b8;">${p.categoria || 'Sin categoría'}</small>
                                    </td>
                                    <td style="font-weight:bold; color:#0f172a;">$${p.precio_venta_final.toFixed(2)}</td>
                                    <td>
                                        <span style="padding:4px 10px; border-radius:15px; font-weight:bold; font-size:0.9rem; 
                                             background:${p.stock_disponible > 0 ? '#dcfce7' : '#fee2e2'}; 
                                             color:${p.stock_disponible > 0 ? '#166534' : '#991b1b'};">
                                            ${p.stock_disponible || 0}
                                        </span>
                                    </td>
                                    <td>
                                        <label class="switch">
                                            <input type="checkbox" ${p.esta_activo ? 'checked' : ''} onclick="window.toggleStatus('${p.id}', ${p.esta_activo})">
                                            <span class="slider round"></span>
                                        </label>
                                    </td>
                                    <td>
                                        <button onclick="window.deleteProduct('${p.id}')" style="background:none; border:none; color:#94a3b8; cursor:pointer;">🗑️</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    setupCatalogLogic(rates, recentLogs);
}

// ==========================================
// 3. LÓGICA Y EVENTOS
// ==========================================
// #region LOGICA
function setupCatalogLogic(rates, logs) {
    const form = document.getElementById('catalog-form');
    const nameInput = document.getElementById('c-name');
    const priceInput = document.getElementById('c-price');
    const marginRange = document.getElementById('c-margin-range');
    
    let currentCost = 0;

    // Sincronización de Costos y Margen
    const syncCalculations = () => {
        const usd = parseFloat(priceInput.value) || 0;
        document.getElementById('val-ves').innerText = (usd * rates.tasa_usd_ves).toFixed(2);
        document.getElementById('val-eur').innerText = (usd * rates.tasa_usd_ves / rates.tasa_eur_ves).toFixed(2);
        
        if (currentCost > 0) {
            const margin = Math.round(((usd / currentCost) - 1) * 100);
            document.getElementById('lbl-margin').innerText = `${margin}%`;
            marginRange.value = margin;
        }
    };

    // Al escribir el nombre, buscamos si hay un costo registrado para esa receta
    nameInput.oninput = (e) => {
        const match = logs?.find(l => l.recipe_name === e.target.value);
        if (match) {
            currentCost = match.costo_total_tanda / match.cantidad_unidades;
            document.getElementById('lbl-cost').innerText = `$${currentCost.toFixed(2)}`;
            syncCalculations();
        }
    };

    priceInput.oninput = syncCalculations;

    marginRange.oninput = (e) => {
        if (currentCost > 0) {
            const marginPct = parseFloat(e.target.value);
            priceInput.value = (currentCost * (1 + marginPct / 100)).toFixed(2);
            document.getElementById('lbl-margin').innerText = `${marginPct}%`;
            syncCalculations();
        }
    };

    form.onsubmit = async (e) => {
        e.preventDefault();
        const file = document.getElementById('c-image').files[0];
        let imageUrl = null;

        try {
            if (file) {
                const fileName = `${Date.now()}.${file.name.split('.').pop()}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('product-photos').upload(`products/${fileName}`, file);
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from('product-photos').getPublicUrl(`products/${fileName}`);
                imageUrl = urlData.publicUrl;
            }

            const productData = {
                product_name: nameInput.value,
                precio_venta_final: parseFloat(priceInput.value),
                costo_unitario_referencia: currentCost,
                categoria: document.getElementById('c-category').value,
                image_url: imageUrl,
                esta_activo: true,
                stock_disponible: 0 
            };

            const { error } = await supabase.from('sales_prices').upsert(productData, { onConflict: 'product_name' });
            if (error) throw error;

            alert("✅ Catálogo actualizado.");
            loadCatalog();
        } catch (err) {
            alert("❌ Error: " + err.message);
        }
    };
}
// #endregion

// ==========================================
// 4. ACCIONES GLOBALES
// ==========================================
// #region ACCIONES
window.deleteProduct = async (id) => {
    if (confirm("¿Eliminar producto?")) {
        const { error } = await supabase.from('sales_prices').delete().eq('id', id);
        if (!error) loadCatalog();
    }
};

window.toggleStatus = async (id, currentStatus) => {
    await supabase.from('sales_prices').update({ esta_activo: !currentStatus }).eq('id', id);
    loadCatalog();
};
// #endregion