import { supabase } from '../supabase.js';

export async function loadExchange() {
    const container = document.getElementById('app-content');
    
    container.innerHTML = `
        <div class="main-container">
            <header class="header-flex">
                <div>
                    <h1>💱 Tasas de Cambio (BCV)</h1>
                    <p style="color: #64748b;">Actualiza los valores oficiales para el cálculo de precios y costos.</p>
                </div>
            </header>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:30px;">
                <div class="stat-card">
                    <h3>Actualizar Tasas de Hoy</h3>
                    <form id="rate-form">
                        <div class="input-group">
                            <label>Tasa Dólar (Bs./$)</label>
                            <input type="number" id="v-usd" step="0.01" class="input-field" placeholder="Ej: 45.50" required>
                        </div>
                        <div class="input-group">
                            <label>Tasa Euro (Bs./€)</label>
                            <input type="number" id="v-eur" step="0.01" class="input-field" placeholder="Ej: 48.20" required>
                        </div>
                        <button type="submit" class="btn-primary" style="width:100%; padding:15px;">
                            Guardar Tasas Oficiales
                        </button>
                    </form>
                </div>

                <div class="stat-card">
                    <h3>Últimas Actualizaciones</h3>
                    <div id="rates-history-list">
                        <p>Cargando historial...</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('rate-form').onsubmit = saveRates;
    renderRatesHistory();
}

async function saveRates(e) {
    e.preventDefault();
    const usd = document.getElementById('v-usd').value;
    const eur = document.getElementById('v-eur').value;

    const { error } = await supabase.from('exchange_rates').insert([{
        ves_per_usd: usd,
        ves_per_eur: eur,
        date: new Date().toISOString().split('T')[0]
    }]);

    if (error) {
        alert("Error al guardar: " + error.message);
    } else {
        alert("Tasas actualizadas correctamente.");
        document.getElementById('rate-form').reset();
        renderRatesHistory();
    }
}

async function renderRatesHistory() {
    const { data: rates } = await supabase
        .from('exchange_rates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    const list = document.getElementById('rates-history-list');
    if (!rates || rates.length === 0) {
        list.innerHTML = "<p>No hay tasas registradas aún.</p>";
        return;
    }

    list.innerHTML = rates.map(r => `
        <div style="padding:10px; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <small style="color:#64748b;">${new Date(r.created_at).toLocaleString()}</small>
                <div style="font-weight:bold;">Tasa Oficial</div>
            </div>
            <div style="text-align:right;">
                <span style="color:var(--primary); font-weight:bold;">$ ${r.ves_per_usd}</span><br>
                <span style="color:#1e40af; font-weight:bold;">€ ${r.ves_per_eur}</span>
            </div>
        </div>
    `).join('');
}