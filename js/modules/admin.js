import { supabase } from '../supabase.js';
import { getGlobalRates } from './settings.js'; // Importación de las tasas duales

export async function loadAdmin() {
    const rates = await getGlobalRates();
    const container = document.getElementById('app-content');

    container.innerHTML = `
        <div class="main-container">
            <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <div>
                    <h1>⚙️ Administración y Activos</h1>
                    <p>Gestiona tus equipos y gastos operativos en cualquier moneda.</p>
                </div>
                <div style="display:flex; gap:10px; font-size:0.8rem;">
                    <div style="background:#f1f5f9; padding:5px 10px; border-radius:8px; border:1px solid #cbd5e1;">
                        <b>USD/VES:</b> ${rates.tasa_usd_ves.toFixed(2)}
                    </div>
                    <div style="background:#f5f3ff; padding:5px 10px; border-radius:8px; border:1px solid #ddd6fe;">
                        <b>EUR/VES:</b> ${rates.tasa_eur_ves.toFixed(2)}
                    </div>
                </div>
            </header>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:25px;">
                <div class="stat-card">
                    <h3>🛡️ Inventario de Equipos (Activos)</h3>
                    <div class="input-group">
                        <label>Nombre del Equipo</label>
                        <input type="text" id="a-name" class="input-field" placeholder="Ej: Horno de Convección">
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                        <div class="input-group">
                            <label>Marca</label>
                            <input type="text" id="a-brand" class="input-field">
                        </div>
                        <div class="input-group">
                            <label>Modelo</label>
                            <input type="text" id="a-model" class="input-field">
                        </div>
                    </div>
                    
                    <div style="display:grid; grid-template-columns: 1.5fr 1fr; gap:10px;">
                        <div class="input-group">
                            <label>Costo de Adquisición</label>
                            <input type="number" id="a-cost" class="input-field" step="0.01" placeholder="0.00">
                        </div>
                        <div class="input-group">
                            <label>Moneda</label>
                            <select id="a-currency" class="input-field">
                                <option value="USD">Dólares ($)</option>
                                <option value="VES">Bolívares (Bs)</option>
                                <option value="EUR">Euros (€)</option>
                            </select>
                        </div>
                    </div>
                    <button id="btn-save-asset" class="btn-primary" style="width:100%; background:#0f172a;">💾 Registrar Equipo</button>
                    <div id="assets-list" style="margin-top:20px; font-size:0.85rem;"></div>
                </div>

                <div class="stat-card">
                    <h3>💸 Gastos Operativos</h3>
                    <div class="input-group">
                        <label>Descripción del Gasto</label>
                        <input type="text" id="e-desc" class="input-field" placeholder="Ej: Pago de Electricidad">
                    </div>
                    <div class="input-group">
                        <label>Categoría</label>
                        <select id="e-cat" class="input-field">
                            <option value="Consumibles">Consumibles (Guantes, limpieza)</option>
                            <option value="Logistica">Logística (Gasolina, Fletes)</option>
                            <option value="Servicios">Servicios (Luz, Agua, Gas)</option>
                            <option value="Mantenimiento">Mantenimiento</option>
                        </select>
                    </div>
                    <div style="display:grid; grid-template-columns: 1.5fr 1fr; gap:10px;">
                        <div class="input-group">
                            <label>Monto Pagado</label>
                            <input type="number" id="e-amount" class="input-field" step="0.01" placeholder="0.00">
                        </div>
                        <div class="input-group">
                            <label>Moneda</label>
                            <select id="e-currency" class="input-field">
                                <option value="USD">Dólares ($)</option>
                                <option value="VES">Bolívares (Bs)</option>
                                <option value="EUR">Euros (€)</option>
                            </select>
                        </div>
                    </div>
                    <button id="btn-save-expense" class="btn-primary" style="width:100%; background:#0284c7;">💸 Registrar Gasto</button>
                    <div id="expenses-list" style="margin-top:20px; font-size:0.85rem;"></div>
                </div>
            </div>
        </div>
    `;

    setupAdminEvents(rates);
    renderAssets();
    renderExpenses();
}

function setupAdminEvents(rates) {
    // Función auxiliar para convertir cualquier moneda a USD
    const convertToUSD = (amount, currency) => {
        if (currency === 'USD') return amount;
        if (currency === 'VES') return amount / rates.tasa_usd_ves;
        if (currency === 'EUR') {
            const amountInBs = amount * rates.tasa_eur_ves;
            return amountInBs / rates.tasa_usd_ves;
        }
        return amount;
    };

    // Registro de Activos
    document.getElementById('btn-save-asset').onclick = async () => {
        const name = document.getElementById('a-name').value;
        const amount = parseFloat(document.getElementById('a-cost').value);
        const currency = document.getElementById('a-currency').value;
        const cost_usd = convertToUSD(amount, currency);

        if(!name || isNaN(cost_usd)) return alert("Nombre y costo son obligatorios");

        const { error } = await supabase.from('assets_inventory').insert([{ 
            name, 
            brand: document.getElementById('a-brand').value,
            model: document.getElementById('a-model').value,
            cost_usd: cost_usd 
        }]);

        if(!error) {
            alert("✅ Equipo registrado en el inventario.");
            renderAssets();
        }
    };

    // Registro de Gastos
    document.getElementById('btn-save-expense').onclick = async () => {
        const description = document.getElementById('e-desc').value;
        const category = document.getElementById('e-cat').value;
        const amount = parseFloat(document.getElementById('e-amount').value);
        const currency = document.getElementById('e-currency').value;
        const amount_usd = convertToUSD(amount, currency);

        if(!description || isNaN(amount_usd)) return alert("Descripción y monto son obligatorios");

        const { error } = await supabase.from('operational_expenses').insert([{ 
            description, 
            category, 
            amount_usd 
        }]);

        if(!error) {
            alert("✅ Gasto registrado y convertido a USD.");
            renderExpenses();
        }
    };
}

async function renderAssets() {
    const { data } = await supabase.from('assets_inventory').select('*').order('purchase_date', { ascending: false });
    const list = document.getElementById('assets-list');
    list.innerHTML = `<h4>Tus Equipos (Valor en USD)</h4>` + data.map(a => `
        <div style="padding:10px; border-bottom:1px solid #eee; background:white; border-radius:4px; margin-bottom:5px;">
            <strong>${a.name}</strong><br>
            <small style="color:#64748b;">Costo: $${a.cost_usd.toFixed(2)}</small>
        </div>
    `).join('');
}

async function renderExpenses() {
    const { data } = await supabase.from('operational_expenses').select('*').order('expense_date', { ascending: false }).limit(5);
    const list = document.getElementById('expenses-list');
    list.innerHTML = `<h4>Últimos Gastos (USD)</h4>` + data.map(e => `
        <div style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; background:white; border-radius:4px; margin-bottom:5px;">
            <div><strong>${e.description}</strong><br><small>${e.category}</small></div>
            <div style="color:#ef4444; font-weight:bold;">-$${e.amount_usd.toFixed(2)}</div>
        </div>
    `).join('');
}