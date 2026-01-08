import { supabase } from '../supabase.js';
import { getGlobalRates } from './settings.js';

export async function loadSales() {
    const rates = await getGlobalRates();
    const { data: catalog } = await supabase.from('sales_prices').select('*').order('product_name');
    const { data: customers } = await supabase.from('customers').select('*').order('name');
    
    const container = document.getElementById('app-content');

    container.innerHTML = `
        <div class="main-container">
            <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                <div>
                    <h1 style="font-size: 1.8rem; margin:0;">🛒 Punto de Venta</h1>
                    <p style="color: #64748b;">Registra ventas y gestiona cobros multimoneda</p>
                </div>
                <div style="display:flex; gap:12px;">
                    <div style="background:#fffbeb; border:1px solid #fef3c7; padding:10px 18px; border-radius:12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <small style="display:block; font-size:0.65rem; font-weight:800; color:#b45309; text-transform:uppercase;">Tasa USD</small>
                        <span style="font-weight:800; color:#92400e; font-size:1.1rem;">${rates.tasa_usd_ves.toFixed(2)}</span>
                    </div>
                    <div style="background:#f5f3ff; border:1px solid #ede9fe; padding:10px 18px; border-radius:12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <small style="display:block; font-size:0.65rem; font-weight:800; color:#5b21b6; text-transform:uppercase;">Tasa EUR</small>
                        <span style="font-weight:800; color:#4c1d95; font-size:1.1rem;">${rates.tasa_eur_ves.toFixed(2)}</span>
                    </div>
                </div>
            </header>

            <div style="display:grid; grid-template-columns: 1.2fr 1fr; gap:30px;">
                <div class="stat-card" style="padding:25px;">
                    <h3 style="margin-bottom:20px; font-size:1.1rem; border-bottom: 2px solid #f1f5f9; padding-bottom:10px;">📝 Registrar Operación</h3>

                    <div class="input-group">
                        <label style="font-weight:bold; color:#475569;">PRODUCTO / SERVICIO</label>
                        <select id="v-catalog-select" class="input-field" style="font-size:1rem; padding:12px;">
                            <option value="">-- Seleccionar --</option>
                            ${catalog?.map(p => `<option value="${p.precio_venta_final}">${p.product_name}</option>`).join('')}
                            <option value="manual" style="font-weight:bold; color:#2563eb;">➕ ESCRIBIR MANUALMENTE</option>
                        </select>
                    </div>

                    <div id="manual-product-div" style="display:none;" class="input-group">
                        <input type="text" id="v-manual-name" class="input-field" placeholder="¿Qué estás vendiendo?">
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-top:15px;">
                        <div class="input-group">
                            <label style="font-weight:bold; color:#475569;">PRECIO UNIT ($)</label>
                            <input type="number" id="v-final-price" class="input-field" step="0.01" value="0" style="font-weight:bold;">
                        </div>
                        <div class="input-group">
                            <label style="font-weight:bold; color:#475569;">CANTIDAD</label>
                            <input type="number" id="v-qty" class="input-field" value="1" style="font-weight:bold;">
                        </div>
                    </div>

                    <div class="input-group">
                        <label style="font-weight:bold; color:#475569;">CLIENTE (Opcional)</label>
                        <select id="v-customer-id" class="input-field">
                            <option value="">Cliente Genérico</option>
                            ${customers?.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                        </select>
                    </div>

                    <div style="background:#f1f5f9; padding:20px; border-radius:15px; margin:20px 0;">
                        <label style="font-weight:800; display:block; margin-bottom:12px; font-size:0.85rem; color:#1e293b; text-transform:uppercase;">💳 Desglose de Pago</label>
                        <div id="payment-container">
                            <div class="pay-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:10px;">
                                <input type="number" class="p-amt input-field" placeholder="Monto en $" step="0.01">
                                <select class="p-meth input-field">
                                    <option value="Efectivo $">💵 Efectivo $</option>
                                    <option value="Zelle $">📱 Zelle $</option>
                                    <option value="Pago Móvil Bs">📲 Pago Móvil Bs</option>
                                    <option value="Efectivo Bs">💸 Efectivo Bs</option>
                                    <option value="Efectivo €">💶 Efectivo €</option>
                                </select>
                            </div>
                        </div>
                        <button id="add-pay-row" style="width:100%; border:2px dashed #cbd5e1; background:white; padding:10px; cursor:pointer; font-size:0.8rem; color:#64748b; border-radius:10px; font-weight:bold;">+ Agregar otro método de pago</button>
                    </div>

                    <div style="background:#0f172a; color:white; padding:25px; border-radius:18px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2);">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <span style="opacity:0.8; font-size:0.9rem;">TOTAL A COBRAR:</span>
                            <span id="txt-total-usd" style="font-weight:900; color:#4ade80; font-size:1.8rem;">$0.00</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:0.8rem; border-top:1px solid #334155; padding-top:10px; opacity:0.8;">
                            <span>Bs: <b id="txt-total-bs">0.00</b></span>
                            <span>€: <b id="txt-total-eur">0.00</b></span>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-top:15px; padding-top:10px; border-top:1px dashed #475569;">
                            <span style="color:#f87171; font-weight:bold;">POR COBRAR:</span>
                            <span id="txt-balance-usd" style="color:#f87171; font-weight:900; font-size:1.2rem;">$0.00</span>
                        </div>
                    </div>

                    <button id="btn-submit-sale" class="btn-primary" style="width:100%; padding:18px; font-size:1.2rem; margin-top:20px; background:#2563eb; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);">🚀 Finalizar y Guardar</button>
                </div>

                <div>
                    <h3 style="margin-bottom:20px; font-size:1.1rem; color:#1e293b;">📊 Ventas Recientes</h3>
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
    const manualDiv = document.getElementById('manual-product-div');

    const calculateTotals = () => {
        const totalUsd = (parseFloat(priceInput.value) || 0) * (parseFloat(qtyInput.value) || 0);
        const totalBs = totalUsd * rates.tasa_usd_ves;
        const totalEur = totalBs / rates.tasa_eur_ves;

        let totalPaid = 0;
        document.querySelectorAll('.p-amt').forEach(input => {
            totalPaid += parseFloat(input.value) || 0;
        });

        document.getElementById('txt-total-usd').innerText = `$${totalUsd.toFixed(2)}`;
        document.getElementById('txt-total-bs').innerText = totalBs.toLocaleString('es-VE', {minimumFractionDigits:2});
        document.getElementById('txt-total-eur').innerText = totalEur.toLocaleString('de-DE', {minimumFractionDigits:2});
        document.getElementById('txt-balance-usd').innerText = `$${(totalUsd - totalPaid).toFixed(2)}`;
    };

    catalogSelect.onchange = (e) => {
        if(e.target.value === 'manual') {
            manualDiv.style.display = 'block';
            priceInput.value = 0;
        } else {
            manualDiv.style.display = 'none';
            priceInput.value = e.target.value;
        }
        calculateTotals();
    };

    [priceInput, qtyInput].forEach(el => el.oninput = calculateTotals);

    document.getElementById('add-pay-row').onclick = () => {
        const container = document.getElementById('payment-container');
        const row = document.querySelector('.pay-row').cloneNode(true);
        row.querySelector('input').value = "";
        row.querySelector('input').oninput = calculateTotals;
        container.appendChild(row);
    };

    document.addEventListener('input', (e) => {
        if(e.target.classList.contains('p-amt')) calculateTotals();
    });

    document.getElementById('btn-submit-sale').onclick = async () => {
        const price = parseFloat(priceInput.value);
        const qty = parseFloat(qtyInput.value);
        const totalUsd = price * qty;
        
        if (totalUsd <= 0) return alert("El monto debe ser mayor a 0");

        let paymentRows = [];
        let totalPaid = 0;
        document.querySelectorAll('.pay-row').forEach(row => {
            const amt = parseFloat(row.querySelector('.p-amt').value) || 0;
            const meth = row.querySelector('.p-meth').value;
            if(amt > 0) {
                totalPaid += amt;
                paymentRows.push({ method: meth, amount_usd: amt });
            }
        });

        const saleData = {
            product_name: catalogSelect.value === 'manual' ? document.getElementById('v-manual-name').value : catalogSelect.options[catalogSelect.selectedIndex].text,
            unit_price: price,
            quantity: qty,
            total_amount: totalUsd,
            total_amount_bs: totalUsd * rates.tasa_usd_ves,
            exchange_rate: rates.tasa_usd_ves,
            amount_paid: totalPaid,
            balance_due: totalUsd - totalPaid,
            payment_status: totalPaid >= totalUsd ? 'Pagado' : 'Pendiente',
            payment_details: paymentRows,
            customer_id: document.getElementById('v-customer-id').value || null
        };

        const { error } = await supabase.from('sales_orders').insert([saleData]);

        if(!error) {
            alert("✅ Venta registrada exitosamente");
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
        <div style="padding:15px; border-bottom:1px solid #f1f5f9; margin-bottom:12px; border-left:5px solid ${s.payment_status === 'Pendiente' ? '#f87171' : '#10b981'}; background:#fff; border-radius:12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <div>
                    <strong style="font-size:1rem; display:block; color:#1e293b;">${s.quantity}x ${s.product_name}</strong>
                    <span style="font-size:0.75rem; color:#64748b;">👤 ${s.customers?.name || 'Cliente Genérico'}</span>
                </div>
                <div style="text-align:right;">
                    <span style="display:block; font-weight:800; font-size:1.1rem; color:#0f172a;">$${s.total_amount.toFixed(2)}</span>
                    <span style="font-size:0.65rem; background:${s.payment_status === 'Pendiente' ? '#fef2f2' : '#f0fdf4'}; color:${s.payment_status === 'Pendiente' ? '#ef4444' : '#16a34a'}; padding:2px 8px; border-radius:10px; font-weight:800;">${s.payment_status.toUpperCase()}</span>
                </div>
            </div>
            <div style="margin-top:12px; display:flex; gap:15px; border-top:1px solid #f8fafc; padding-top:10px;">
                ${s.payment_status === 'Pendiente' ? `<button onclick="window.markAsPaid('${s.id}')" style="background:none; border:none; color:#2563eb; cursor:pointer; font-size:0.75rem; font-weight:bold; text-decoration:underline;">✔ COMPLETAR COBRO</button>` : ''}
                <button onclick="window.deleteSale('${s.id}')" style="background:none; border:none; color:#94a3b8; cursor:pointer; font-size:0.75rem;">🗑 Eliminar</button>
            </div>
        </div>
    `).join('');
}

// Global Actions
window.markAsPaid = async (id) => {
    if(confirm("¿Confirmar que esta venta ha sido pagada en su totalidad?")) {
        const { error } = await supabase.from('sales_orders').update({ payment_status: 'Pagado', balance_due: 0, amount_paid: supabase.raw('total_amount') }).eq('id', id);
        if(!error) loadSales();
    }
};

window.deleteSale = async (id) => {
    if(confirm("⚠️ ¿Estás seguro de eliminar este registro de venta?")) {
        const { error } = await supabase.from('sales_orders').delete().eq('id', id);
        if(!error) loadSales();
    }
};