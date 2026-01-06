import { supabase } from '../supabase.js';
import { getLatestRates } from '../core/currency.js';

export async function loadSales() {
    const container = document.getElementById('app-content');
    const rates = await getLatestRates();

    container.innerHTML = `
        <div class="main-container">
            <header class="header-flex">
                <div>
                    <h1>🥖 Punto de Venta</h1>
                    <p style="color: #64748b;">Registro detallado de pedidos y cobranza</p>
                </div>
                <div class="badge" style="background:var(--dark); color:white; padding:10px;">
                    Tasa BCV: <b>${rates.ves_per_usd} Bs.</b>
                </div>
            </header>

            <div style="display:grid; grid-template-columns: 1.2fr 0.8fr; gap:20px;">
                <div class="stat-card">
                    <h3>🛒 Nueva Venta</h3>
                    <form id="venta-form" style="margin-top:15px;">
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                            <div class="input-group">
                                <label>Nombre del Cliente</label>
                                <input type="text" id="v-cliente" class="input-field" placeholder="Ej: Juan Pérez" value="Cliente Eventual">
                            </div>
                            <div class="input-group">
                                <label>Método de Pago</label>
                                <select id="v-metodo" class="input-field" required>
                                    <option value="Efectivo USD">💵 Efectivo USD</option>
                                    <option value="Pago Móvil">📱 Pago Móvil</option>
                                    <option value="Zelle">💳 Zelle</option>
                                    <option value="Efectivo BS">💸 Efectivo Bs.</option>
                                    <option value="Punto de Venta">🏧 Punto de Venta</option>
                                </select>
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns: 2fr 1fr; gap:15px; margin-top:10px;">
                            <div class="input-group">
                                <label>Producto / Receta</label>
                                <select id="v-recipe" class="input-field" required>
                                    <option value="">Seleccione un producto...</option>
                                </select>
                            </div>
                            <div class="input-group">
                                <label>Cantidad</label>
                                <input type="number" id="v-qty" value="1" min="1" class="input-field" required>
                            </div>
                        </div>
                        
                        <div id="price-display" style="margin:20px 0; padding:15px; background:#f0f9ff; border: 1px solid #bae6fd; border-radius:12px; display:none;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <div>
                                    <p style="margin:5px 0; color:#0369a1;">Total a Cobrar:</p>
                                    <h2 id="t-usd" style="margin:0; color:#0c4a6e;">$0.00</h2>
                                </div>
                                <div style="text-align:right;">
                                    <p style="margin:5px 0; font-weight:bold; color:#059669;" id="t-ves">0.00 Bs.</p>
                                    <p style="margin:5px 0; color:#1e40af; font-size:0.9rem;" id="t-eur">0.00 €</p>
                                </div>
                            </div>
                        </div>

                        <button type="submit" id="btn-finalizar" class="btn-primary" style="width:100%; padding:15px; font-weight:bold; font-size:1rem;">
                            ✅ Confirmar Venta y Bajar Stock
                        </button>
                    </form>
                </div>

                <div class="stat-card">
                    <h3>📅 Ventas de Hoy</h3>
                    <div id="sales-today-list" style="max-height:500px; overflow-y:auto; margin-top:15px;">
                        <p>Cargando transacciones...</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    setupSalesEvents(rates);
    renderTodaySales();
}

async function setupSalesEvents(rates) {
    const select = document.getElementById('v-recipe');
    const qtyInput = document.getElementById('v-qty');
    const display = document.getElementById('price-display');

    const { data: recipes } = await supabase.from('recipes').select('id, nombre, precio_venta_usd');
    if (recipes) {
        recipes.forEach(r => {
            select.innerHTML += `<option value="${r.id}" data-price="${r.precio_venta_usd}">${r.nombre}</option>`;
        });
    }

    const updatePrices = () => {
        const option = select.selectedOptions[0];
        if (!option || !option.value) { display.style.display = 'none'; return; }
        
        display.style.display = 'block';
        const priceUSD = parseFloat(option.dataset.price);
        const qty = parseInt(qtyInput.value) || 0;
        const totalUSD = priceUSD * qty;

        document.getElementById('t-usd').innerText = `$${totalUSD.toFixed(2)}`;
        document.getElementById('t-ves').innerText = `${(totalUSD * rates.ves_per_usd).toFixed(2)} Bs.`;
        document.getElementById('t-eur').innerText = `${((totalUSD * rates.ves_per_usd) / rates.ves_per_eur).toFixed(2)} €`;
    };

    select.onchange = updatePrices;
    qtyInput.oninput = updatePrices;

    document.getElementById('venta-form').onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-finalizar');
        const cliente = document.getElementById('v-cliente').value;
        const metodo = document.getElementById('v-metodo').value;
        
        btn.disabled = true;
        btn.innerText = "Registrando...";

        const recipeId = select.value;
        const qty = parseInt(qtyInput.value);
        const totalUSD = parseFloat(select.selectedOptions[0].dataset.price) * qty;

        try {
            // 1. DESCONTAR STOCK (Se mantiene tu lógica corregida)
            const { data: formula } = await supabase.from('recipe_ingredients')
                .select('ingredient_id, cantidad_necesaria, ingredients(stock_actual, unit_type)')
                .eq('recipe_id', recipeId);

            if (formula) {
                for (const item of formula) {
                    let descuento = item.cantidad_necesaria * qty;
                    // Tu lógica de unidades base (kg/L)
                    if (item.ingredients.unit_type === 'peso' || item.ingredients.unit_type === 'volumen') {
                        // Si guardamos en kg/L pero la receta pide g/ml, dividimos entre 1000
                        descuento = descuento / 1000;
                    }
                    const nuevoStock = (item.ingredients.stock_actual || 0) - descuento;
                    await supabase.from('ingredients').update({ stock_actual: nuevoStock }).eq('id', item.ingredient_id);
                }
            }

            // 2. INSERTAR VENTA CON NUEVOS CAMPOS
            await supabase.from('sales').insert([{
                recipe_id: recipeId,
                cantidad: qty,
                total_usd: totalUSD,
                total_ves: totalUSD * rates.ves_per_usd,
                cliente_nombre: cliente,
                metodo_pago: metodo,
                fecha: new Date().toISOString().split('T')[0]
            }]);

            alert("✅ ¡Venta registrada!");
            loadSales();

        } catch (err) {
            alert("Error: " + err.message);
            btn.disabled = false;
            btn.innerText = "Finalizar y Descontar Stock";
        }
    };
}

async function renderTodaySales() {
    const { data: sales } = await supabase.from('sales')
        .select('*, recipes(nombre)')
        .eq('fecha', new Date().toISOString().split('T')[0])
        .order('created_at', {ascending: false});

    const list = document.getElementById('sales-today-list');
    if (!sales || sales.length === 0) {
        list.innerHTML = "<p style='color:#64748b; text-align:center;'>No hay ventas hoy.</p>";
        return;
    }

    list.innerHTML = sales.map(s => `
        <div style="padding:12px; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center; background:white;">
            <div>
                <div style="font-weight:bold; color:#0f172a;">${s.recipes?.nombre} (x${s.cantidad})</div>
                <div style="font-size:0.8rem; color:#64748b;">👤 ${s.cliente_nombre || 'Cliente Eventual'}</div>
                <div style="font-size:0.8rem; margin-top:4px;">
                    <span class="badge" style="background:#f1f5f9; color:#475569; font-size:0.7rem;">${s.metodo_pago}</span>
                    <b style="color:#10b981; margin-left:5px;">$${s.total_usd.toFixed(2)}</b>
                </div>
            </div>
            <div style="display:flex; gap:5px;">
                <button onclick="deleteSale('${s.id}')" style="border:none; background:none; cursor:pointer; opacity:0.6;">🗑️</button>
            </div>
        </div>
    `).join('');
}

// Se mantienen las funciones globales deleteSale y editSale del usuario...
window.deleteSale = async (id) => {
    if (confirm("¿Anular esta venta? El stock NO se recuperará automáticamente.")) {
        await supabase.from('sales').delete().eq('id', id);
        loadSales();
    }
};