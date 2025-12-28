import { supabase } from '../supabase.js';
import { getLatestRates } from '../core/currency.js';

export async function loadSales() {
    const container = document.getElementById('app-content');
    const rates = await getLatestRates();

    container.innerHTML = `
        <div class="main-container">
            <header class="header-flex">
                <h1>🥖 Punto de Venta</h1>
                <div class="badge" style="background:var(--dark); color:white; padding:10px;">
                    Tasa BCV: <b>${rates.ves_per_usd} Bs.</b>
                </div>
            </header>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                <div class="stat-card">
                    <h3>Registrar Pedido</h3>
                    <form id="venta-form">
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
                        
                        <div id="price-display" style="margin:20px 0; padding:15px; background:#f8fafc; border-radius:10px; display:none;">
                            <p style="margin:5px 0;">Total USD: <b id="t-usd">$0.00</b></p>
                            <p style="margin:5px 0; color:var(--primary);">Total VES: <b id="t-ves">0.00 Bs.</b></p>
                            <p style="margin:5px 0; color:#1e40af;">Total EUR: <b id="t-eur">0.00 €</b></p>
                        </div>

                        <button type="submit" id="btn-finalizar" class="btn-primary" style="width:100%; padding:15px;">
                            Finalizar y Descontar Stock
                        </button>
                    </form>
                </div>

                <div class="stat-card">
                    <h3>Ventas de Hoy</h3>
                    <div id="sales-today-list" style="max-height:400px; overflow-y:auto;">
                        <p>Cargando ventas...</p>
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
        btn.disabled = true;
        btn.innerText = "Procesando...";

        const recipeId = select.value;
        const qty = parseInt(qtyInput.value);
        const totalUSD = parseFloat(select.selectedOptions[0].dataset.price) * qty;

        try {
            // CORRECCIÓN AQUÍ: Quitamos el campo "nombre" de la subconsulta para evitar el error ingredients_1.nombre
            const { data: formula, error: formError } = await supabase.from('recipe_ingredients')
                .select(`
                    ingredient_id, 
                    cantidad_necesaria, 
                    ingredients (
                        stock_actual, 
                        unit_type
                    )
                `)
                .eq('recipe_id', recipeId);

            if (formError) throw formError;
            
            if (formula && formula.length > 0) {
                for (const item of formula) {
                    let descuento = item.cantidad_necesaria * qty;
                    // Ajuste de unidades
                    if (item.ingredients.unit_type === 'kg' || item.ingredients.unit_type === 'lt') {
                        descuento = descuento / 1000;
                    }
                    const nuevoStock = (item.ingredients.stock_actual || 0) - descuento;
                    
                    await supabase.from('ingredients')
                        .update({ stock_actual: nuevoStock })
                        .eq('id', item.ingredient_id);
                }
            }

            await supabase.from('sales').insert([{
                recipe_id: recipeId,
                cantidad: qty,
                total_usd: totalUSD,
                total_ves: totalUSD * rates.ves_per_usd,
                fecha: new Date().toISOString().split('T')[0]
            }]);

            alert("Venta registrada con éxito.");
            loadSales();

        } catch (err) {
            console.error("Error completo:", err);
            alert("Error al procesar: " + (err.message || "Error desconocido"));
            btn.disabled = false;
            btn.innerText = "Finalizar y Descontar Stock";
        }
    };
}

async function renderTodaySales() {
    const { data: sales } = await supabase.from('sales')
        .select('*, recipes(nombre)')
        .eq('fecha', new Date().toISOString().split('T')[0])
        .order('id', {ascending: false});

    const list = document.getElementById('sales-today-list');
    if (!sales || sales.length === 0) {
        list.innerHTML = "<p>No hay ventas registradas hoy.</p>";
        return;
    }

    list.innerHTML = sales.map(s => `
        <div style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <b>${s.recipes?.nombre || 'Producto'}</b> x${s.cantidad}<br>
                <small style="color:#64748b;">$${s.total_usd.toFixed(2)} | ${s.total_ves.toFixed(2)} Bs.</small>
            </div>
            <div style="display:flex; gap:10px;">
                <button onclick="editSale('${s.id}', ${s.total_usd})" style="border:none; background:none; cursor:pointer; font-size:1rem;">✏️</button>
                <button onclick="deleteSale('${s.id}')" style="border:none; background:none; cursor:pointer; font-size:1rem;">🗑️</button>
            </div>
        </div>
    `).join('');
}

window.deleteSale = async (id) => {
    if (confirm("¿Anular esta venta?")) {
        const { error } = await supabase.from('sales').delete().eq('id', id);
        if (error) alert("Error: " + error.message);
        else loadSales();
    }
};

window.editSale = async (id, currentTotal) => {
    const newTotal = prompt("Modificar el monto total (USD):", currentTotal);
    if (newTotal !== null && !isNaN(newTotal)) {
        const { error } = await supabase.from('sales').update({ total_usd: parseFloat(newTotal) }).eq('id', id);
        if (error) alert("Error: " + error.message);
        else loadSales();
    }
};