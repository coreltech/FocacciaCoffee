import { supabase } from '../supabase.js';
import { getGlobalRates } from './settings.js';

export async function loadSales() {
    // 1. CARGA DE DATOS INICIALES
    const rates = await getGlobalRates();
    const { data: catalog } = await supabase.from('sales_prices').select('*').order('product_name');
    const { data: customers } = await supabase.from('customers').select('*').order('name');
    
    const container = document.getElementById('app-content');

    // 2. ESTRUCTURA DEL MÓDULO (HTML)
    container.innerHTML = `
        <div class="main-container">
            <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <div>
                    <h1>🛒 Punto de Venta</h1>
                    <p style="color: #64748b;">Gestión de ventas y cobros</p>
                </div>
                <div style="display:flex; gap:10px;">
                    <div style="background:#fefce8; border:1px solid #facc15; padding:8px 15px; border-radius:10px; text-align:center;">
                        <small style="display:block; font-size:0.6rem; font-weight:bold; color:#854d0e;">USD/VES</small>
                        <span style="font-weight:bold;">${rates.tasa_usd_ves.toFixed(2)}</span>
                    </div>
                    <div style="background:#f5f3ff; border:1px solid #ddd6fe; padding:8px 15px; border-radius:10px; text-align:center;">
                        <small style="display:block; font-size:0.6rem; font-weight:bold; color:#5b21b6;">EUR/VES</small>
                        <span style="font-weight:bold;">${rates.tasa_eur_ves.toFixed(2)}</span>
                    </div>
                </div>
            </header>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:25px;">
                <div class="stat-card">
                    <h3 style="margin-bottom:15px;">📝 Nueva Venta</h3>

                    <div class="input-group" style="margin-bottom:15px;">
                        <label>Producto</label>
                        <select id="v-catalog-select" class="input-field">
                            <option value="">-- Seleccionar del Catálogo --</option>
                            ${catalog?.map(p => `<option value="${p.precio_venta_final}">${p.product_name}</option>`).join('')}
                            <option value="manual">-- ESCRIBIR MANUALMENTE --</option>
                        </select>
                    </div>

                    <div id="manual-product-div" style="display:none;" class="input-group" style="margin-bottom:15px;">
                        <input type="text" id="v-manual-name" class="input-field" placeholder="Nombre del producto">
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:15px;">
                        <div class="input-group">
                            <label>Precio Unitario ($)</label>
                            <input type="number" id="v-final-price" class="input-field" step="0.01" value="0">
                        </div>
                        <div class="input-group">
                            <label>Cantidad</label>
                            <input type="number" id="v-qty" class="input-field" value="1">
                        </div>
                    </div>

                    <div class="input-group" style="margin-bottom:15px;">
                        <label>Cliente</label>
                        <select id="v-customer-id" class="input-field">
                            <option value="">Cliente Genérico</option>
                            ${customers?.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                        </select>
                    </div>

                    <div style="background:#f8fafc; padding:15px; border-radius:10px; border:1px solid #e2e8f0; margin-bottom:15px;">
                        <label style="font-weight:bold; display:block; margin-bottom:10px; font-size:0.9rem;">💳 Registro de Pagos</label>
                        <div id="payment-container">
                            <div class="pay-row" style="display:grid; grid-template-columns: 1fr 1.3fr; gap:8px; margin-bottom:8px;">
                                <input type="number" class="p-amt input-field" placeholder="Monto $" step="0.01">
                                <select class="p-meth input-field">
                                    <option value="Efectivo $">Efectivo $</option>
                                    <option value="Zelle $">Zelle $</option>
                                    <option value="Pago Móvil Bs">Pago Móvil Bs</option>
                                    <option value="Efectivo Bs">Efectivo Bs</option>
                                    <option value="Efectivo €">Efectivo €</option>
                                </select>
                            </div>
                        </div>
                        <button id="add-pay-row" style="width:100%; border:1px dashed #cbd5e1; background:none; padding:8px; cursor:pointer; font-size:0.75rem; color:#64748b; border-radius:8px;">+ Otro medio de pago</button>
                    </div>

                    <div style="background:#0f172a; color:white; padding:20px; border-radius:12px; margin-bottom:20px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <span>Total USD:</span>
                            <span id="txt-total-usd" style="font-weight:bold; color:#4ade80; font-size:1.2rem;">$0.00</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:0.85rem; color:#94a3b8;">
                            <span>Bs: <span id="txt-total-bs">0.00</span></span>
                            <span>€: <span id="txt-total-eur">0.00</span></span>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-top:10px; border-top:1px solid #334155; padding-top:10px; font-size:0.9rem;">
                            <span>Resta cobrar:</span>
                            <span id="txt-balance-usd" style="color:#f87171; font-weight:bold;">$0.00</span>
                        </div>
                    </div>

                    <button id="btn-submit-sale" class="btn-primary" style="width:100%; padding:15px; font-size:1.1rem;">✅ Finalizar Venta</button>
                </div>

                <div class="stat-card">
                    <h3 style="margin-bottom:15px;">📊 Últimas 10 Ventas</h3>
                    <div id="sales-history"></div>
                </div>
            </div>
        </div>
    `;

    setupSalesLogic(rates);
    renderSalesHistory();
}

function setupSalesLogic(rates) {
    const catalogSelect = document.getElementById('v-catalog-select');
    const priceInput = document.getElementById('v-final-price');
    const qtyInput = document.getElementById('v-qty');

    const calculateTotals = () => {
        const totalUsd = (parseFloat(priceInput.value) || 0) * (parseFloat(qtyInput.value) || 0);
        const totalBs = totalUsd * rates.tasa_usd_ves;
        const totalEur = totalBs / rates.tasa_eur_ves;

        let totalPaid = 0;
        document.querySelectorAll('.p-amt').forEach(input => {
            totalPaid += parseFloat(input.value) || 0;
        });

        document.getElementById('txt-total-usd').innerText = `$${totalUsd.toFixed(2)}`;
        document.getElementById('txt-total-bs').innerText = `${totalBs.toLocaleString('es-VE', {minimumFractionDigits:2})}`;
        document.getElementById('txt-total-eur').innerText = `${totalEur.toLocaleString('de-DE', {minimumFractionDigits:2})}`;
        document.getElementById('txt-balance-usd').innerText = `$${(totalUsd - totalPaid).toFixed(2)}`;
    };

    [priceInput, qtyInput].forEach(el => el.oninput = calculateTotals);

    catalogSelect.onchange = (e) => {
        const manualDiv = document.getElementById('manual-product-div');
        if(e.target.value === 'manual') {
            manualDiv.style.display = 'block';
            priceInput.value = 0;
        } else {
            manualDiv.style.display = 'none';
            priceInput.value = e.target.value;
        }
        calculateTotals();
    };

    document.getElementById('add-pay-row').onclick = () => {
        const container = document.getElementById('payment-container');
        const row = document.querySelector('.pay-row').cloneNode(true);
        row.querySelector('input').value = "";
        row.querySelector('input').oninput = calculateTotals;
        container.appendChild(row);
    };

    document.querySelectorAll('.p-amt').forEach(input => input.oninput = calculateTotals);

    document.getElementById('btn-submit-sale').onclick = async () => {
        const price = parseFloat(priceInput.value);
        const qty = parseFloat(qtyInput.value);
        const totalUsd = price * qty;
        
        let details = [];
        let totalPaid = 0;
        document.querySelectorAll('.pay-row').forEach(row => {
            const amt = parseFloat(row.querySelector('.p-amt').value) || 0;
            const meth = row.querySelector('.p-meth').value;
            if(amt > 0) {
                totalPaid += amt;
                details.push({ 
                    method: meth, 
                    amount_usd: amt,
                    rate_used: meth.includes('€') ? rates.tasa_eur_ves : rates.tasa_usd_ves
                });
            }
        });

        const { error } = await supabase.from('sales_orders').insert([{
            product_name: catalogSelect.value === 'manual' ? document.getElementById('v-manual-name').value : catalogSelect.options[catalogSelect.selectedIndex].text,
            unit_price: price,
            quantity: qty,
            total_amount: totalUsd,
            total_amount_bs: totalUsd * rates.tasa_usd_ves,
            exchange_rate: rates.tasa_usd_ves,
            amount_paid: totalPaid,
            balance_due: totalUsd - totalPaid,
            payment_status: totalPaid >= totalUsd ? 'Pagado' : 'Pendiente',
            payment_details: details,
            payment_method: details[0]?.method || 'Efectivo',
            customer_id: document.getElementById('v-customer-id').value || null
        }]);

        if(!error) {
            alert("✅ Venta registrada");
            loadSales();
        } else {
            alert("❌ Error: " + error.message);
        }
    };
}

async function renderSalesHistory() {
    const { data } = await supabase.from('sales_orders').select('*, customers(name)').order('sale_date', { ascending: false }).limit(10);
    const div = document.getElementById('sales-history');
    if (!div || !data) return;

    div.innerHTML = data.map(s => `
        <div style="padding:12px; border-bottom:1px solid #f1f5f9; margin-bottom:10px; border-left:4px solid ${s.payment_status === 'Pendiente' ? '#f87171' : '#10b981'}; background:#fff; border-radius:8px;">
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <div>
                    <strong style="font-size:0.9rem; display:block;">${s.quantity}x ${s.product_name}</strong>
                    <span style="font-size:0.7rem; color:#64748b;">${s.customers?.name || 'Cliente Genérico'}</span>
                </div>
                <div style="text-align:right;">
                    <span style="display:block; font-weight:bold;">$${s.total_amount.toFixed(2)}</span>
                    <span style="font-size:0.65rem; color:${s.payment_status === 'Pendiente' ? '#ef4444' : '#10b981'}; font-weight:bold;">${s.payment_status.toUpperCase()}</span>
                </div>
            </div>
            <div style="margin-top:8px; display:flex; gap:12px; border-top:1px solid #f8fafc; padding-top:8px;">
                ${s.payment_status === 'Pendiente' ? `<button onclick="window.markAsPaid('${s.id}')" style="background:none; border:none; color:#10b981; cursor:pointer; font-size:0.7rem; font-weight:bold; padding:0;">✔ COBRAR</button>` : ''}
                <button onclick="window.deleteSale('${s.id}')" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:0.7rem; font-weight:bold; padding:0;">🗑 BORRAR</button>
            </div>
        </div>
    `).join('');
}

// FUNCIONES GLOBALES PARA ACCIONES
window.markAsPaid = async (id) => {
    if(confirm("¿Confirmar cobro total de esta venta?")) {
        const { error } = await supabase.from('sales_orders').update({ payment_status: 'Pagado', balance_due: 0 }).eq('id', id);
        if(!error) loadSales();
    }
};

window.deleteSale = async (id) => {
    if(confirm("⚠️ ¿Eliminar este registro de venta definitivamente?")) {
        const { error } = await supabase.from('sales_orders').delete().eq('id', id);
        if(!error) loadSales();
    }
};