import { supabase } from '../supabase.js';
import { getGlobalRates } from './settings.js';

export async function loadSales(selectedDate = new Date().toISOString().split('T')[0]) {
    const rates = await getGlobalRates();
    
    const { data: catalog } = await supabase.from('sales_prices').select('*').eq('esta_activo', true).order('product_name');
    const { data: customers } = await supabase.from('customers').select('*').order('name');
    
    const { data: sales } = await supabase
        .from('sales_orders')
        .select('*, customers(name)')
        .gte('sale_date', `${selectedDate}T00:00:00`)
        .lte('sale_date', `${selectedDate}T23:59:59`)
        .order('sale_date', {ascending: false});
    
    const container = document.getElementById('app-content');

    const resumen = { total: 0, credito: 0, metodos: {} };
    sales?.forEach(s => {
        const montoTotal = parseFloat(s.total_amount) || 0;
        const status = (s.payment_status || "").trim().toLowerCase();
        const deudaReal = (status === 'pagado') ? 0 : (parseFloat(s.balance_due) || 0);
        resumen.total += montoTotal;
        resumen.credito += deudaReal;

        if (s.payment_details && Array.isArray(s.payment_details)) {
            s.payment_details.forEach(p => {
                const m = p.method || "Otros";
                resumen.metodos[m] = (resumen.metodos[m] || 0) + (parseFloat(p.amount) || 0);
            });
        }
    });

    container.innerHTML = `
        <div class="main-container">
            <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                <div>
                    <h1 id="sales-title" style="font-size: 1.8rem; margin:0;">🛒 Punto de Venta</h1>
                    <div style="display:flex; align-items:center; gap:10px; margin-top:5px;">
                        <input type="date" id="filter-date" value="${selectedDate}" class="input-field" style="padding:4px 8px; width:auto; font-size:0.8rem;">
                        <button id="btn-reset-tests" style="background:#fee2e2; color:#b91c1c; border:none; padding:5px 10px; border-radius:6px; cursor:pointer; font-size:0.7rem; font-weight:bold;">🗑️ BORRAR TODO (PRUEBAS)</button>
                    </div>
                </div>
                <div style="background:#fff; padding:10px; border-radius:12px; border:1px solid #e2e8f0; text-align:right;">
                    <small style="color:#64748b; font-weight:800; font-size:0.6rem;">TASA BCV</small>
                    <b style="display:block;">1$ = ${rates.tasa_usd_ves.toFixed(2)} Bs</b>
                </div>
            </header>

            <div style="display:grid; grid-template-columns: 1fr 1.2fr; gap:30px;">
                <div class="stat-card" style="padding:25px;">
                    <h3 style="margin-bottom:20px; border-bottom: 2px solid #f1f5f9; padding-bottom:10px;">📝 Nueva Venta</h3>
                    
                    <div class="input-group">
                        <label>PRODUCTO</label>
                        <select id="v-catalog-select" class="input-field">
                            <option value="">-- Seleccionar --</option>
                            ${catalog?.map(p => `<option value="${p.id}" data-price="${p.precio_venta_final}" data-stock="${p.stock_disponible || 0}">${p.product_name} (Stock: ${p.stock_disponible || 0})</option>`).join('')}
                            <option value="manual">+ MANUAL (ESPECIFICAR)</option>
                        </select>
                    </div>

                    <div id="manual-desc-container" class="input-group" style="display:none; margin-top:10px;">
                        <label>DESCRIPCIÓN DE VENTA MANUAL</label>
                        <input type="text" id="v-manual-desc" class="input-field" placeholder="Ej: Focaccia especial de ajo...">
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-top:10px;">
                        <div class="input-group"><label>PRECIO $</label><input type="number" id="v-final-price" class="input-field" step="0.01"></div>
                        <div class="input-group"><label>CANTIDAD</label><input type="number" id="v-qty" class="input-field" value="1"></div>
                    </div>

                    <div id="stock-warning" style="display:none; color:#ef4444; font-size:0.75rem; font-weight:bold; margin-top:5px;">⚠️ Cantidad supera el stock disponible</div>

                    <div class="input-group" style="margin-top:10px;">
                        <label>CLIENTE</label>
                        <select id="v-customer-id" class="input-field">
                            <option value="">Cliente Genérico</option>
                            ${customers?.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                        </select>
                    </div>

                    <div style="background:#f8fafc; padding:15px; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:15px; margin-top:10px;">
                        <div id="payment-container">
                            <div class="pay-row" style="display:grid; grid-template-columns: 1fr 1.2fr; gap:10px; margin-bottom:8px;">
                                <input type="number" class="p-amt input-field" placeholder="Monto $">
                                <select class="p-meth input-field">
                                    <option value="Pago Móvil Bs">📲 Pago Móvil</option>
                                    <option value="Efectivo $">💵 Efectivo $</option>
                                    <option value="Zelle $">📱 Zelle $</option>
                                    <option value="Efectivo Bs">💸 Efectivo Bs</option>
                                </select>
                            </div>
                        </div>
                        <button id="add-pay-row" style="width:100%; border:1px dashed #cbd5e1; background:white; padding:5px; border-radius:8px; cursor:pointer; font-size:0.7rem;">+ Método</button>
                    </div>

                    <div style="background:#0f172a; color:white; padding:20px; border-radius:15px;">
                        <div style="display:flex; justify-content:space-between;"><span>TOTAL:</span><b id="txt-total-usd" style="color:#4ade80; font-size:1.4rem;">$0.00</b></div>
                        <div style="display:flex; justify-content:space-between; margin-top:8px; font-size:0.8rem; color:#94a3b8;">
                            <span>EN BS:</span><span id="txt-total-ves">0.00 Bs</span>
                        </div>
                    </div>
                    <button id="btn-submit-sale" class="btn-primary" style="width:100%; padding:15px; margin-top:15px; background:#2563eb; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">🚀 Guardar Venta</button>
                </div>

                <div>
                    <div style="background:#fff; border:1px solid #e2e8f0; border-radius:15px; padding:20px; margin-bottom:20px;">
                        <h4 style="margin:0 0 10px 0;">📊 Cierre del ${selectedDate}</h4>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:15px;">
                            <div style="background:#f0fdf4; padding:10px; border-radius:8px;">
                                <small style="display:block; color:#166534;">ENTRÓ EN CAJA</small>
                                <b style="font-size:1.1rem;">$${(resumen.total - resumen.credito).toFixed(2)}</b>
                            </div>
                            <div style="background:#fff1f2; padding:10px; border-radius:8px;">
                                <small style="display:block; color:#991b1b;">EN CRÉDITO</small>
                                <b style="font-size:1.1rem;">$${resumen.credito.toFixed(2)}</b>
                            </div>
                        </div>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:5px;">
                            ${Object.entries(resumen.metodos).map(([m, val]) => `<div style="font-size:0.7rem; background:#f8fafc; padding:4px 8px; border-radius:4px;">${m}: <b>$${val.toFixed(2)}</b></div>`).join('')}
                        </div>
                    </div>

                    <div id="sales-history">
                        ${sales?.map(s => {
                            const isWeb = s.product_name.startsWith('WEB:');
                            const status = (s.payment_status || "").trim().toLowerCase();
                            const isPending = (status !== 'pagado');
                            let displayCustomer = s.customers?.name || 'Cliente Genérico';
                            
                            if (isWeb) {
                                const match = s.product_name.match(/WEB:\s*(.*?)\s*\(/);
                                if (match && match[1]) displayCustomer = `🌐 ${match[1]}`;
                            }

                            return `
                                <div style="background:white; border:1px solid #f1f5f9; padding:15px; border-radius:10px; margin-bottom:8px; border-left:5px solid ${isPending ? '#f87171' : '#10b981'};">
                                    <div style="display:flex; justify-content:space-between;">
                                        <b style="font-size:0.9rem;">${s.product_name}</b>
                                        <button onclick="window.deleteSale('${s.id}')" style="background:none; border:none; color:#ef4444; cursor:pointer;">🗑️</button>
                                    </div>
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                                        <span style="font-size:0.8rem; color:#64748b;">👤 ${displayCustomer}</span>
                                        <b style="font-size:0.9rem;">$${s.total_amount.toFixed(2)}</b>
                                    </div>
                                    ${isPending ? `
                                        <button onclick="window.confirmarCobroWeb('${s.id}', ${s.total_amount})" 
                                                style="width:100%; margin-top:10px; background:#2563eb; color:white; border:none; padding:8px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:0.75rem;">
                                            ✅ REGISTRAR COBRO TOTAL
                                        </button>
                                    ` : '<div style="text-align:right; margin-top:10px; color:#059669; font-weight:bold; font-size:0.8rem;">✓ PAGADO</div>'}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    setupSalesLogic(rates);
    checkNewOrders();
}

// --- FUNCIONES GLOBALES ---
window.confirmarCobroWeb = async (saleId, amount) => {
    if (!confirm(`¿Registrar cobro de $${amount.toFixed(2)}?`)) return;
    try {
        const { error } = await supabase.from('sales_orders')
            .update({ payment_status: 'Pagado', amount_paid: amount, balance_due: 0 })
            .eq('id', saleId);
        if (error) throw error;
        loadSales(document.getElementById('filter-date').value);
    } catch (err) { alert("Error al cobrar"); }
};

window.deleteSale = async (id) => {
    if(confirm("¿Eliminar registro?")) {
        await supabase.from('sales_orders').delete().eq('id', id);
        loadSales(document.getElementById('filter-date').value);
    }
};

async function resetAllSales() {
    const fecha = document.getElementById('filter-date').value;
    if (!confirm(`⚠️ BORRADO TOTAL: ¿Seguro que quieres borrar todas las ventas del ${fecha}?`)) return;
    try {
        await supabase.from('sales_orders').delete().gte('sale_date', `${fecha}T00:00:00`).lte('sale_date', `${fecha}T23:59:59`);
        alert("Limpieza completada.");
        loadSales(fecha);
    } catch (err) { alert("Error al limpiar"); }
}

function setupSalesLogic(rates) {
    const priceInput = document.getElementById('v-final-price');
    const qtyInput = document.getElementById('v-qty');
    const catalogSelect = document.getElementById('v-catalog-select');
    const manualContainer = document.getElementById('manual-desc-container');
    const manualDesc = document.getElementById('v-manual-desc');
    const btnSubmit = document.getElementById('btn-submit-sale');
    const stockWarning = document.getElementById('stock-warning');
    
    const calculate = () => {
        const opt = catalogSelect.options[catalogSelect.selectedIndex];
        const qty = parseFloat(qtyInput.value) || 0;
        const total = (parseFloat(priceInput.value) || 0) * qty;
        
        let paid = 0;
        document.querySelectorAll('.p-amt').forEach(i => paid += parseFloat(i.value) || 0);
        
        document.getElementById('txt-total-usd').innerText = `$${total.toFixed(2)}`;
        document.getElementById('txt-total-ves').innerText = `${(total * rates.tasa_usd_ves).toFixed(2)} Bs`;

        // LÓGICA DE BLOQUEO POR STOCK
        if (opt.value && opt.value !== 'manual') {
            const stockDisp = parseFloat(opt.dataset.stock) || 0;
            if (qty > stockDisp) {
                btnSubmit.disabled = true;
                btnSubmit.style.opacity = "0.5";
                btnSubmit.style.cursor = "not-allowed";
                stockWarning.style.display = "block";
            } else {
                btnSubmit.disabled = false;
                btnSubmit.style.opacity = "1";
                btnSubmit.style.cursor = "pointer";
                stockWarning.style.display = "none";
            }
        } else {
            btnSubmit.disabled = false;
            btnSubmit.style.opacity = "1";
            stockWarning.style.display = "none";
        }

        return { total, paid, balance: total - paid };
    };

    catalogSelect.onchange = (e) => {
        const opt = e.target.options[e.target.selectedIndex];
        
        if (opt.value === 'manual') {
            manualContainer.style.display = 'block';
            priceInput.value = "";
            priceInput.readOnly = false;
            priceInput.style.backgroundColor = "#fff";
            manualDesc.focus();
        } else if (opt.value) {
            manualContainer.style.display = 'none';
            manualDesc.value = "";
            priceInput.value = opt.dataset.price;
            priceInput.readOnly = true;
            priceInput.style.backgroundColor = "#f1f5f9";
            qtyInput.focus();
        } else {
            manualContainer.style.display = 'none';
        }
        calculate();
    };

    [priceInput, qtyInput].forEach(el => el.oninput = calculate);

    document.getElementById('add-pay-row').onclick = () => {
        const row = document.createElement('div');
        row.className = 'pay-row';
        row.style = 'display:grid; grid-template-columns: 1fr 1.2fr; gap:10px; margin-bottom:8px;';
        row.innerHTML = `<input type="number" class="p-amt input-field" placeholder="Monto $"><select class="p-meth input-field"><option value="Pago Móvil Bs">📲 Pago Móvil</option><option value="Efectivo $">💵 Efectivo $</option><option value="Zelle $">📱 Zelle $</option><option value="Efectivo Bs">💸 Efectivo Bs</option></select>`;
        document.getElementById('payment-container').appendChild(row);
        row.querySelector('.p-amt').oninput = calculate;
    };

    btnSubmit.onclick = async () => {
        const { total, paid, balance } = calculate();
        const opt = catalogSelect.options[catalogSelect.selectedIndex];
        const custId = document.getElementById('v-customer-id').value;

        if(!opt.value) return alert("Selecciona producto");
        if(opt.value === 'manual' && !manualDesc.value) return alert("Escribe qué estás vendiendo en la descripción manual");
        if(balance > 0.01 && !custId) return alert("Selecciona cliente para crédito");

        let pDetails = [];
        document.querySelectorAll('.pay-row').forEach(row => {
            const a = parseFloat(row.querySelector('.p-amt').value) || 0;
            if(a > 0) pDetails.push({ method: row.querySelector('.p-meth').value, amount: a });
        });

        const prodName = opt.value === 'manual' ? `MANUAL: ${manualDesc.value}` : opt.text.split(' (Stock')[0];

        const { error } = await supabase.from('sales_orders').insert([{
            product_name: prodName,
            unit_price: parseFloat(priceInput.value),
            quantity: parseFloat(qtyInput.value),
            total_amount: total,
            amount_paid: paid,
            balance_due: balance,
            payment_status: balance <= 0.01 ? 'Pagado' : 'Pendiente',
            payment_details: pDetails,
            customer_id: custId || null
        }]);

        if(!error) {
            if(opt.value !== 'manual') {
                const stock = parseFloat(opt.dataset.stock);
                await supabase.from('sales_prices').update({ stock_disponible: stock - parseFloat(qtyInput.value) }).eq('id', opt.value);
            }
            loadSales(document.getElementById('filter-date').value);
        }
    };

    document.getElementById('btn-reset-tests').onclick = resetAllSales;
    document.getElementById('filter-date').onchange = (e) => loadSales(e.target.value);
}

const checkNewOrders = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase.from('sales_orders').select('*', { count: 'exact', head: true })
        .gte('sale_date', `${today}T00:00:00`).ilike('product_name', 'WEB:%').eq('payment_status', 'Pendiente');
    const h = document.getElementById('sales-title');
    if (count > 0 && h) h.innerHTML = `🛒 Punto de Venta <span style="background:#ef4444; color:white; font-size:0.7rem; padding:2px 8px; border-radius:50px; margin-left:10px;">${count} WEB</span>`;
};