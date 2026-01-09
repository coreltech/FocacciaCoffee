import { supabase } from '../supabase.js';
import { getGlobalRates } from './settings.js';

export async function loadAdmin() {
    const rates = await getGlobalRates();
    const container = document.getElementById('app-content');

    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
        .admin-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
        .admin-tabs { display: none; margin-bottom: 20px; gap: 10px; }
        .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        
        /* Estilo para los botones de acción */
        .btn-admin-save { 
            width: 100%; 
            color: white; 
            border: none; 
            border-radius: 8px; 
            font-weight: bold; 
            cursor: pointer; 
            transition: opacity 0.2s;
        }
        .btn-admin-save:hover { opacity: 0.9; }

        @media (max-width: 850px) {
            .admin-layout { grid-template-columns: 1fr; }
            .admin-tabs { display: flex; }
            .admin-panel { display: none; }
            .admin-panel.active { display: block; }
            .admin-header { flex-direction: column; text-align: center; gap: 15px; }
            .list-container { max-height: 400px; overflow-y: auto; }
        }
    `;
    document.head.appendChild(styleTag);

    container.innerHTML = `
        <div class="main-container">
            <header class="admin-header">
                <div>
                    <h1 style="margin:0;">⚙️ Administración</h1>
                    <p style="margin:5px 0 0; color:#64748b;">Equipos y Gastos Operativos</p>
                </div>
                <div style="display:flex; gap:10px;">
                    <div style="background:#f1f5f9; padding:8px 12px; border-radius:8px; border:1px solid #cbd5e1; font-size:0.85rem;">
                        <b style="color:#475569;">USD:</b> Bs ${rates.tasa_usd_ves.toFixed(2)}
                    </div>
                    <div style="background:#f5f3ff; padding:8px 12px; border-radius:8px; border:1px solid #ddd6fe; font-size:0.85rem;">
                        <b style="color:#5b21b6;">EUR:</b> Bs ${rates.tasa_eur_ves.toFixed(2)}
                    </div>
                </div>
            </header>

            <div class="admin-tabs">
                <button class="tab-btn active" id="tab-assets" onclick="switchAdminTab('assets')">🛡️ Equipos</button>
                <button class="tab-btn" id="tab-expenses" onclick="switchAdminTab('expenses')">💸 Gastos</button>
            </div>

            <div class="admin-layout">
                <div id="panel-assets" class="stat-card admin-panel active">
                    <h3 style="margin-top:0; border-bottom:1px solid #f1f5f9; padding-bottom:10px;">🛡️ Inventario de Equipos</h3>
                    <div class="input-group">
                        <label>Nombre del Equipo</label>
                        <input type="text" id="a-name" class="input-field" placeholder="Ej: Horno de Convección">
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px;">
                        <div class="input-group">
                            <label>Marca</label>
                            <input type="text" id="a-brand" class="input-field">
                        </div>
                        <div class="input-group">
                            <label>Modelo</label>
                            <input type="text" id="a-model" class="input-field">
                        </div>
                    </div>
                    
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px;">
                        <div class="input-group">
                            <label>Costo Adquisición</label>
                            <input type="number" id="a-cost" class="input-field" step="0.01">
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
                    <button id="btn-save-asset" class="btn-admin-save" style="background:#0f172a; margin-top:15px; height:45px;">💾 Registrar Equipo</button>
                    
                    <div style="margin-top:25px;">
                        <h4 style="border-bottom:1px solid #f1f5f9; padding-bottom:5px;">Equipos Registrados</h4>
                        <div id="assets-list" class="list-container"></div>
                    </div>
                </div>

                <div id="panel-expenses" class="stat-card admin-panel">
                    <h3 style="margin-top:0; border-bottom:1px solid #f1f5f9; padding-bottom:10px;">💸 Gastos Operativos</h3>
                    <div class="input-group">
                        <label>Descripción del Gasto</label>
                        <input type="text" id="e-desc" class="input-field" placeholder="Ej: Pago de Electricidad">
                    </div>
                    <div class="input-group" style="margin-top:10px;">
                        <label>Categoría</label>
                        <select id="e-cat" class="input-field">
                            <option value="Consumibles">Consumibles (Guantes, limpieza)</option>
                            <option value="Logistica">Logística (Gasolina, Fletes)</option>
                            <option value="Servicios">Servicios (Luz, Agua, Gas)</option>
                            <option value="Mantenimiento">Mantenimiento</option>
                        </select>
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px;">
                        <div class="input-group">
                            <label>Monto Pagado</label>
                            <input type="number" id="e-amount" class="input-field" step="0.01">
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
                    <button id="btn-save-expense" class="btn-admin-save" style="background:#0284c7; margin-top:15px; height:45px;">💸 Registrar Gasto</button>
                    
                    <div style="margin-top:25px;">
                        <h4 style="border-bottom:1px solid #f1f5f9; padding-bottom:5px;">Últimos Gastos (USD)</h4>
                        <div id="expenses-list" class="list-container"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    window.switchAdminTab = (target) => {
        const pAssets = document.getElementById('panel-assets');
        const pExpenses = document.getElementById('panel-expenses');
        const tAssets = document.getElementById('tab-assets');
        const tExpenses = document.getElementById('tab-expenses');

        if(target === 'assets') {
            pAssets.classList.add('active'); pExpenses.classList.remove('active');
            tAssets.classList.add('active'); tExpenses.classList.remove('active');
        } else {
            pAssets.classList.remove('active'); pExpenses.classList.add('active');
            tAssets.classList.remove('active'); tExpenses.classList.add('active');
        }
    };

    setupAdminEvents(rates);
    renderAssets();
    renderExpenses();
}

function setupAdminEvents(rates) {
    const convertToUSD = (amount, currency) => {
        if (currency === 'USD') return amount;
        if (currency === 'VES') return amount / rates.tasa_usd_ves;
        if (currency === 'EUR') return (amount * rates.tasa_eur_ves) / rates.tasa_usd_ves;
        return amount;
    };

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
            alert("✅ Equipo registrado.");
            document.getElementById('a-name').value = '';
            document.getElementById('a-cost').value = '';
            document.getElementById('a-brand').value = '';
            document.getElementById('a-model').value = '';
            renderAssets();
        }
    };

    document.getElementById('btn-save-expense').onclick = async () => {
        const description = document.getElementById('e-desc').value;
        const amount = parseFloat(document.getElementById('e-amount').value);
        const currency = document.getElementById('e-currency').value;
        const amount_usd = convertToUSD(amount, currency);

        if(!description || isNaN(amount_usd)) return alert("Descripción y monto son obligatorios");

        const { error } = await supabase.from('operational_expenses').insert([{ 
            description, 
            category: document.getElementById('e-cat').value, 
            amount_usd 
        }]);

        if(!error) {
            alert("✅ Gasto registrado.");
            document.getElementById('e-desc').value = '';
            document.getElementById('e-amount').value = '';
            renderExpenses();
        }
    };
}

async function renderAssets() {
    const { data } = await supabase.from('assets_inventory').select('*').order('purchase_date', { ascending: false });
    const list = document.getElementById('assets-list');
    if(!data) return;
    
    list.innerHTML = data.map(a => `
        <div style="padding:12px; border:1px solid #e2e8f0; background:#f8fafc; border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <strong style="display:block; font-size:0.9rem;">${a.name}</strong>
                <small style="color:#64748b;">${a.brand || ''} ${a.model || ''}</small>
            </div>
            <div style="font-weight:bold; color:#0f172a; background:#fff; padding:4px 8px; border-radius:6px; border:1px solid #e2e8f0;">
                $${a.cost_usd.toFixed(2)}
            </div>
        </div>
    `).join('');
}

async function renderExpenses() {
    const { data } = await supabase.from('operational_expenses').select('*').order('expense_date', { ascending: false }).limit(10);
    const list = document.getElementById('expenses-list');
    if(!data) return;

    list.innerHTML = data.map(e => `
        <div style="padding:12px; border:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; background:white; border-radius:8px; margin-bottom:8px;">
            <div>
                <strong style="display:block; font-size:0.9rem;">${e.description}</strong>
                <span style="font-size:0.7rem; background:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:4px;">${e.category}</span>
            </div>
            <div style="color:#ef4444; font-weight:bold; font-size:0.95rem;">-$${e.amount_usd.toFixed(2)}</div>
        </div>
    `).join('');
}