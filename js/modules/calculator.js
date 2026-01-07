import { supabase } from '../supabase.js';
import { getGlobalRates } from './settings.js';

export async function loadCalculator() {
    const rates = await getGlobalRates();
    const { data: logs } = await supabase.from('production_logs').select('*').order('fecha_produccion', { ascending: false });
    const container = document.getElementById('app-content');

    container.innerHTML = `
        <div class="main-container">
            <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <div>
                    <h1>🧮 Calculadora de Precios</h1>
                    <p>Ajusta tus márgenes basándote en costos reales.</p>
                </div>
                <div style="display:flex; gap:10px;">
                    <div style="background:#f1f5f9; padding:10px; border-radius:8px; border:1px solid #cbd5e1; text-align:right;">
                        <small style="display:block; color:#64748b; font-weight:bold;">TASA USD</small>
                        <span style="font-weight:bold; color:#0f172a;">Bs ${rates.tasa_usd_ves.toFixed(2)}</span>
                    </div>
                    <div style="background:#f5f3ff; padding:10px; border-radius:8px; border:1px solid #ddd6fe; text-align:right;">
                        <small style="display:block; color:#5b21b6; font-weight:bold;">TASA EUR</small>
                        <span style="font-weight:bold; color:#4c1d95;">Bs ${rates.tasa_eur_ves.toFixed(2)}</span>
                    </div>
                </div>
            </header>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:25px;">
                <div class="stat-card">
                    <h3>🔍 Análisis de Costo</h3>
                    <div class="input-group">
                        <select id="calc-production-select" class="input-field">
                            <option value="">-- Seleccionar Tanda de Producción --</option>
                            ${logs?.map(l => `
                                <option value="${l.costo_total_tanda / l.cantidad_unidades}" data-name="${l.recipe_name}">
                                    ${l.recipe_name} (${new Date(l.fecha_produccion).toLocaleDateString()})
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <div id="calc-details" style="display:none; margin-top:20px; padding-top:20px; border-top:2px dashed #e2e8f0;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:15px; background:#f8fafc; padding:10px; border-radius:8px;">
                            <span>Costo Unitario Real:</span>
                            <strong id="txt-unit-cost">$0.00</strong>
                        </div>
                        
                        <div class="input-group">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <label>Margen de Ganancia (%)</label>
                                <span id="txt-margin-pct" style="background:#0284c7; color:white; padding:2px 8px; border-radius:12px; font-weight:bold;">60%</span>
                            </div>
                            <input type="range" id="input-margin-range" min="0" max="500" value="60" style="width:100%;">
                        </div>

                        <div style="background:#f0f9ff; padding:20px; border-radius:12px; border:1px solid #bae6fd;">
                            <label>Definir Precio de Venta (USD)</label>
                            <input type="number" id="res-price-usd" step="0.01" min="0" 
                                style="font-size:1.6rem; font-weight:bold; color:#0369a1; width:100%; border-radius:8px; padding:8px; border:2px solid #bae6fd;">
                            
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:15px;">
                                <div style="background:white; padding:8px; border-radius:8px; border:1px solid #e2e8f0;">
                                    <small>Euros (€)</small>
                                    <div id="res-price-eur" style="font-weight:bold; color:#4c1d95;">€ 0.00</div>
                                </div>
                                <div style="background:white; padding:8px; border-radius:8px; border:1px solid #e2e8f0;">
                                    <small>Bolívares (Bs)</small>
                                    <div id="res-price-bs" style="font-weight:bold; color:#64748b;">Bs 0.00</div>
                                </div>
                            </div>
                        </div>

                        <button id="btn-save-to-catalog" class="btn-primary" style="width:100%; margin-top:20px; padding:15px;">
                            📥 Actualizar Catálogo
                        </button>
                    </div>
                </div>

                <div class="stat-card">
                    <h3>📋 Catálogo Vigente</h3>
                    <div id="catalog-list">Cargando catálogo...</div>
                </div>
            </div>
        </div>
    `;

    setupCalculatorLogic(rates);
    renderCatalogPreview();
}

function setupCalculatorLogic(rates) {
    const select = document.getElementById('calc-production-select');
    const range = document.getElementById('input-margin-range');
    const priceInput = document.getElementById('res-price-usd');
    const details = document.getElementById('calc-details');
    
    let currentUnitCost = 0;
    let currentProductName = "";

    const updateDisplay = (usdValue) => {
        const val = parseFloat(usdValue) || 0;
        const priceInBs = val * rates.tasa_usd_ves;
        const priceInEur = priceInBs / rates.tasa_eur_ves;

        document.getElementById('res-price-bs').innerText = `Bs ${priceInBs.toLocaleString('es-VE', {minimumFractionDigits:2})}`;
        document.getElementById('res-price-eur').innerText = `€ ${priceInEur.toLocaleString('de-DE', {minimumFractionDigits:2})}`;
    };

    const updateFromMargin = () => {
        const marginPct = parseFloat(range.value);
        const suggestedUsd = currentUnitCost * (1 + (marginPct / 100));
        document.getElementById('txt-margin-pct').innerText = `${marginPct}%`;
        priceInput.value = suggestedUsd.toFixed(2);
        updateDisplay(suggestedUsd);
    };

    const updateFromPrice = () => {
        const price = parseFloat(priceInput.value) || 0;
        if (currentUnitCost > 0) {
            const newMargin = ((price / currentUnitCost) - 1) * 100;
            if (newMargin >= 0 && newMargin <= 500) range.value = newMargin;
            document.getElementById('txt-margin-pct').innerText = `${Math.round(newMargin)}%`;
            updateDisplay(price);
        }
    };

    select.onchange = (e) => {
        if(!e.target.value) {
            details.style.display = 'none';
            return;
        }
        currentUnitCost = parseFloat(e.target.value);
        currentProductName = select.options[select.selectedIndex].getAttribute('data-name');
        document.getElementById('txt-unit-cost').innerText = `$${currentUnitCost.toFixed(2)}`;
        details.style.display = 'block';
        updateFromMargin();
    };

    range.oninput = updateFromMargin;
    priceInput.oninput = updateFromPrice;

    document.getElementById('btn-save-to-catalog').onclick = async () => {
        const finalPrice = parseFloat(priceInput.value);
        if(!finalPrice || finalPrice <= 0) return alert("❌ Precio no válido.");

        const { error } = await supabase.from('sales_prices').upsert({
            product_name: currentProductName,
            precio_venta_final: finalPrice,
            costo_unitario_referencia: currentUnitCost
        }, { onConflict: 'product_name' });

        if(!error) {
            alert("✅ Catálogo Actualizado");
            renderCatalogPreview();
        }
    };
}

async function renderCatalogPreview() {
    const { data } = await supabase.from('sales_prices').select('*').order('product_name');
    const div = document.getElementById('catalog-list');
    
    if(!data || data.length === 0) {
        div.innerHTML = "<p style='text-align:center;'>Catálogo vacío.</p>";
        return;
    }

    div.innerHTML = `
        <table style="width:100%; border-collapse: collapse;">
            <thead>
                <tr style="text-align:left; border-bottom:2px solid #e2e8f0;">
                    <th style="padding:10px;">Producto</th>
                    <th style="padding:10px; text-align:right;">USD</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(p => `
                    <tr style="border-bottom:1px solid #f1f5f9;">
                        <td style="padding:10px;">${p.product_name}</td>
                        <td style="padding:10px; text-align:right; font-weight:bold;">$${p.precio_venta_final.toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}