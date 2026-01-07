import { supabase } from '../supabase.js';

export async function getGlobalRates() {
    const { data } = await supabase.from('global_config').select('*').eq('id', 'current_rates').single();
    return data || { tasa_usd_ves: 1, tasa_eur_ves: 1 };
}

export async function loadSettings() {
    const rates = await getGlobalRates();
    const container = document.getElementById('app-content');

    container.innerHTML = `
        <div class="main-container" style="max-width: 800px; margin: 0 auto; padding: 20px;">
            <header style="margin-bottom: 30px; text-align: center;">
                <h1>⚙️ Centro de Control</h1>
                <p style="color: #64748b;">Gestión de divisas (USD/EUR) e historial</p>
            </header>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="stat-card" style="padding: 20px; border-top: 4px solid #0f172a;">
                    <h3 style="margin-top:0;">Actualizar Tasas</h3>
                    <div style="display: flex; flex-direction: column; gap: 15px; margin-top:20px;">
                        <div class="input-group">
                            <label style="font-weight: bold; font-size: 0.8rem;">DÓLAR (USD)</label>
                            <input type="number" id="set-usd" step="0.01" class="input-field" value="${rates.tasa_usd_ves}" style="font-size: 1.2rem;">
                        </div>
                        <div class="input-group">
                            <label style="font-weight: bold; font-size: 0.8rem;">EURO (EUR)</label>
                            <input type="number" id="set-eur" step="0.01" class="input-field" value="${rates.tasa_eur_ves}" style="font-size: 1.2rem;">
                        </div>
                        <button id="btn-save-settings" class="btn-primary" style="width: 100%; padding: 12px; font-weight: bold;">
                            💾 Actualizar y Registrar
                        </button>
                    </div>
                </div>

                <div class="stat-card" style="padding: 20px; background: #f8fafc; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <p style="color: #64748b; margin-bottom: 5px;">Relación Actual</p>
                    <h2 style="margin: 0; color: #0f172a;">1 € = ${(rates.tasa_eur_ves / rates.tasa_usd_ves).toFixed(4)} $</h2>
                    <small style="color: #94a3b8; margin-top: 10px;">Último cambio: ${new Date(rates.updated_at).toLocaleString()}</small>
                </div>
            </div>

            <div class="stat-card" style="margin-top: 30px; padding: 20px;">
                <h3 style="margin-top:0; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">📜 Historial de Cambios</h3>
                <div id="history-container" style="max-height: 400px; overflow-y: auto; margin-top: 10px;">
                    <p style="text-align:center; color:#94a3b8;">Cargando historial...</p>
                </div>
            </div>
        </div>
    `;

    renderHistory();

    document.getElementById('btn-save-settings').onclick = async () => {
        const u = parseFloat(document.getElementById('set-usd').value);
        const e = parseFloat(document.getElementById('set-eur').value);

        // 1. Actualizar Tasa Global
        await supabase.from('global_config').upsert({ 
            id: 'current_rates', 
            tasa_usd_ves: u, 
            tasa_eur_ves: e, 
            updated_at: new Date() 
        });

        // 2. Guardar en Historial
        await supabase.from('rates_history').insert([{ tasa_usd: u, tasa_eur: e }]);

        alert("✅ Tasas actualizadas y guardadas en el historial.");
        loadSettings(); // Recargar todo
    };
}

async function renderHistory() {
    const { data } = await supabase.from('rates_history').select('*').order('created_at', { ascending: false }).limit(10);
    const container = document.getElementById('history-container');

    if (!data || data.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#94a3b8;'>No hay registros previos.</p>";
        return;
    }

    container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <thead>
                <tr style="text-align: left; color: #64748b; border-bottom: 2px solid #f1f5f9;">
                    <th style="padding: 10px;">Fecha / Hora</th>
                    <th>USD ($)</th>
                    <th>EUR (€)</th>
                    <th>Diferencia</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(h => `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 10px;">${new Date(h.created_at).toLocaleString()}</td>
                        <td style="font-weight: bold;">Bs ${h.tasa_usd.toFixed(2)}</td>
                        <td style="font-weight: bold;">Bs ${h.tasa_eur.toFixed(2)}</td>
                        <td style="color: #94a3b8;">${(h.tasa_eur / h.tasa_usd).toFixed(3)} €/$</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}