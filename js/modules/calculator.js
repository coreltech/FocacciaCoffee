import { supabase } from '../supabase.js';
import { getGlobalRates } from './settings.js';

export async function loadCalculator() {
    const rates = await getGlobalRates();
    const { data: logs } = await supabase.from('production_logs').select('*').order('fecha_produccion', { ascending: false });
    const container = document.getElementById('app-content');

    // CSS para adaptabilidad y controles táctiles
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
        .calc-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 20px; }
        .price-card { background: #f0f9ff; padding: 20px; border-radius: 12px; border: 2px solid #bae6fd; margin-top: 15px; }
        .currency-badge { background: white; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; }
        input[type=range] { height: 30px; -webkit-appearance: none; width: 100%; margin: 10px 0; background: transparent; }
        input[type=range]:focus { outline: none; }
        input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 8px; cursor: pointer; background: #e2e8f0; border-radius: 4px; }
        input[type=range]::-webkit-slider-thumb { height: 24px; width: 24px; border-radius: 50%; background: #0284c7; cursor: pointer; -webkit-appearance: none; margin-top: -8px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        
        @media (max-width: 850px) {
            .calc-grid { grid-template-columns: 1fr; }
            .header-rates { flex-direction: column; align-items: stretch !important; gap: 8px !important; }
            .price-input-big { font-size: 1.8rem !important; }
        }
    `;
    document.head.appendChild(styleTag);

    container.innerHTML = `
        <div class="main-container" style="max-width: 1000px; margin: 0 auto; padding: 10px;">
            <header class="header-rates" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                <div>
                    <h1 style="margin:0;">🧮 Calculadora de Precios</h1>
                    <p style="margin:5px 0 0; color:#64748b;">Margen de ganancia vs. Costos reales</p>
                </div>
                <div style="display:flex; gap:10px;">
                    <div style="background:#f1f5f9; padding:8px 12px; border-radius:8px; border:1px solid #cbd5e1;">
                        <small style="display:block; font-size:0.65rem; color:#64748b; font-weight:bold;">USD/VES</small>
                        <span style="font-weight:bold;">Bs ${rates.tasa_usd_ves.toFixed(2)}</span>
                    </div>
                    <div style="background:#f5f3ff; padding:8px 12px; border-radius:8px; border:1px solid #ddd6fe;">
                        <small style="display:block; font-size:0.65rem; color:#5b21b6; font-weight:bold;">EUR/VES</small>
                        <span style="font-weight:bold; color:#4c1d95;">Bs ${rates.tasa_eur_ves.toFixed(2)}</span>
                    </div>
                </div>
            </header>

            <div class="calc-grid">
                <div class="stat-card" style="margin:0;">
                    <h3 style="margin-top:0;">🔍 Selección de Costo</h3>
                    <div class="input-group">
                        <label>Tanda de Producción Reciente</label>
                        <select id="calc-production-select" class="input-field" style="padding:12px;">
                            <option value="">-- Seleccionar Tanda --</option>
                            ${logs?.map(l => `
                                <option value="${l.costo_total_tanda / l.cantidad_unidades}" data-name="${l.recipe_name}">
                                    ${l.recipe_name} (${new Date(l.fecha_produccion).toLocaleDateString()})
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <div id="calc-details" style="display:none; margin-top:20px; border-top:2px dashed #f1f5f9; padding-top:20px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; background:#f8fafc; padding:15px; border-radius:10px;">
                            <span style="color:#64748b;">Costo Unitario Real:</span>
                            <strong id="txt-unit-cost" style="font-size:1.2rem; color:#0f172a;">$0.00</strong>
                        </div>
                        
                        <div class="input-group">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                                <label style="margin:0;">Margen de Ganancia</label>
                                <span id="txt-margin-pct" style="background:#0284c7; color:white; padding:4px 12px; border-radius:20px; font-weight:bold; font-size:0.9rem;">60%</span>
                            </div>
                            <input type="range" id="input-margin-range" min="0" max="400" value="60">
                        </div>

                        <div class="price-card">
                            <label style="display:block; text-align:center; color:#0369a1; font-weight:bold; margin-bottom:10px;">PRECIO DE VENTA (USD)</label>
                            <input type="number" id="res-price-usd" step="0.01" class="price-input-big" 
                                style="font-size:2.2rem; font-weight:bold; color:#0369a1; width:100%; text-align:center; background:transparent; border:none; outline:none;">
                            
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:20px;">
                                <div class="currency-badge">
                                    <small style="display:block; color:#64748b; margin-bottom:4px;">Euros</small>
                                    <div id="res-price-eur" style="font-weight:bold; color:#4c1d95; font-size:1.1rem;">€ 0.00</div>
                                </div>
                                <div class="currency-badge">
                                    <small style="display:block; color:#64748b; margin-bottom:4px;">Bolívares</small>
                                    <div id="res-price-bs" style="font-weight:bold; color:#1e293b; font-size:1.1rem;">Bs 0</div>
                                </div>
                            </div>
                        </div>

                        <button id="btn-save-to-catalog" class="btn-primary" style="width:100%; margin-top:20px; padding:18px; font-size:1rem; display:flex; align-items:center; justify-content:center; gap:10px;">
                            <span>📥 Actualizar Catálogo Vigente</span>
                        </button>
                    </div>
                </div>

                <div class="stat-card" style="margin:0; background:#f8fafc;">
                    <h3 style="margin-top:0;">📋 Precios de Venta Actuales</h3>
                    <div id="catalog-list" style="margin-top:15px;">Cargando catálogo...</div>
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

        document.getElementById('res-price-bs').innerText = `Bs ${priceInBs.toLocaleString('es-VE', {minimumFractionDigits:0, maximumFractionDigits:2})}`;
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
            if (newMargin >= 0 && newMargin <= 400) range.value = newMargin;
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
            costo_unitario_referencia: currentUnitCost,
            updated_at: new Date().toISOString()
        }, { onConflict: 'product_name' });

        if(!error) {
            alert("✅ ¡Catálogo actualizado!");
            renderCatalogPreview();
        }
    };
}

async function renderCatalogPreview() {
    const { data } = await supabase.from('sales_prices').select('*').order('product_name');
    const div = document.getElementById('catalog-list');
    
    if(!data || data.length === 0) {
        div.innerHTML = "<p style='text-align:center; color:#94a3b8; padding:20px;'>No hay productos con precio asignado.</p>";
        return;
    }

    div.innerHTML = data.map(p => `
        <div style="background:white; padding:15px; border-radius:10px; margin-bottom:10px; border:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <strong style="display:block; color:#0f172a;">${p.product_name}</strong>
                <small style="color:#94a3b8;">Costo Ref: $${p.costo_unitario_referencia?.toFixed(2) || '0.00'}</small>
            </div>
            <div style="text-align:right;">
                <div style="font-size:1.2rem; font-weight:bold; color:#0284c7;">$${p.precio_venta_final.toFixed(2)}</div>
                <small style="color:#10b981; font-weight:bold;">+${Math.round(((p.precio_venta_final / p.costo_unitario_referencia) - 1) * 100)}%</small>
            </div>
        </div>
    `).join('');
}