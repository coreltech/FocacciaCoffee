import { supabase } from '../supabase.js';

export async function getGlobalRates() {
    const { data } = await supabase.from('global_config').select('*').eq('id', 'current_rates').single();
    return data || { tasa_usd_ves: 1, tasa_eur_ves: 1 };
}

export async function loadSettings() {
    const rates = await getGlobalRates();
    const container = document.getElementById('app-content');

    // Inyectamos CSS para manejar el grid responsivo
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
        .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 768px) {
            .settings-grid { grid-template-columns: 1fr; }
            .history-table-container { overflow-x: auto; }
            h1 { font-size: 1.5rem; }
        }
    `;
    document.head.appendChild(styleTag);

    container.innerHTML = `
        <div class="main-container" style="max-width: 900px; margin: 0 auto; padding: 10px;">
            <header style="margin-bottom: 25px; text-align: center;">
                <h1 style="margin-bottom:5px;">⚙️ Centro de Control</h1>
                <p style="color: #64748b; margin:0;">Gestión de divisas e historial</p>
            </header>

            <div class="settings-grid">
                <div class="stat-card" style="padding: 20px; border-top: 4px solid #0f172a; margin:0;">
                    <h3 style="margin-top:0;">Actualizar Tasas</h3>
                    <div style="display: flex; flex-direction: column; gap: 15px; margin-top:20px;">
                        <div class="input-group">
                            <label style="font-weight: bold; font-size: 0.8rem; color: #475569;">DÓLAR (USD)</label>
                            <input type="number" id="set-usd" step="0.01" class="input-field" value="${rates.tasa_usd_ves}" style="font-size: 1.3rem; padding: 12px;">
                        </div>
                        <div class="input-group">
                            <label style="font-weight: bold; font-size: 0.8rem; color: #475569;">EURO (EUR)</label>
                            <input type="number" id="set-eur" step="0.01" class="input-field" value="${rates.tasa_eur_ves}" style="font-size: 1.3rem; padding: 12px;">
                        </div>
                        <button id="btn-save-settings" class="btn-primary" style="width: 100%; padding: 15px; font-weight: bold; font-size: 1rem; cursor:pointer;">
                            💾 Actualizar y Registrar
                        </button>
                    </div>
                </div>

                <div class="stat-card" style="padding: 20px; background: #f8fafc; display: flex; flex-direction: column; justify-content: center; align-items: center; margin:0; border: 1px dashed #cbd5e1;">
                    <p style="color: #64748b; margin-bottom: 5px; font-weight: 500;">Relación Actual</p>
                    <h2 style="margin: 0; color: #0f172a; font-size: 1.8rem;">1 € = ${(rates.tasa_eur_ves / rates.tasa_usd_ves).toFixed(4)} $</h2>
                    <div style="margin-top: 15px; text-align: center;">
                        <small style="color: #94a3b8; display: block;">Último cambio:</small>
                        <small style="color: #64748b; font-weight: bold;">${rates.updated_at ? new Date(rates.updated_at).toLocaleString() : 'Sin registros'}</small>
                    </div>
                </div>
            </div>

            <div class="stat-card" style="margin-top: 25px; padding: 20px;">
                <h3 style="margin-top:0; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">📜 Historial de Cambios</h3>
                <div id="history-container" class="history-table-container" style="max-height: 400px; overflow-y: auto; margin-top: 10px;">
                    <p style="text-align:center; color:#94a3b8;">Cargando historial...</p>
                </div>
            </div>
        </div>
    `;

    renderHistory();

    document.getElementById('btn-save-settings').onclick = async () => {
        const u = parseFloat(document.getElementById('set-usd').value);
        const e = parseFloat(document.getElementById('set-eur').value);

        if (isNaN(u) || isNaN(e)) {
            alert("Por favor, ingresa valores válidos.");
            return;
        }

        const now = new Date().toISOString();

        // 1. Actualizar Tasa Global
        const { error: upsertError } = await supabase.from('global_config').upsert({ 
            id: 'current_rates', 
            tasa_usd_ves: u, 
            tasa_eur_ves: e, 
            updated_at: now 
        });

        if (upsertError) {
            alert("Error al actualizar: " + upsertError.message);
            return;
        }

        // 2. Guardar en Historial
        await supabase.from('rates_history').insert([{ tasa_usd: u, tasa_eur: e }]);

        alert("✅ Tasas actualizadas correctamente.");
        loadSettings(); 
    };
}

async function renderHistory() {
    const { data } = await supabase.from('rates_history').select('*').order('created_at', { ascending: false }).limit(10);
    const container = document.getElementById('history-container');

    if (!data || data.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#94a3b8; padding: 20px;'>No hay registros previos.</p>";
        return;
    }

    container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; min-width: 400px;">
            <thead>
                <tr style="text-align: left; color: #64748b; border-bottom: 2px solid #f1f5f9;">
                    <th style="padding: 12px 8px;">Fecha / Hora</th>
                    <th style="padding: 12px 8px;">USD ($)</th>
                    <th style="padding: 12px 8px;">EUR (€)</th>
                    <th style="padding: 12px 8px;">€/$</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(h => `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 12px 8px; color: #64748b;">${new Date(h.created_at).toLocaleDateString()} <br> <small>${new Date(h.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small></td>
                        <td style="padding: 12px 8px; font-weight: bold;">Bs ${h.tasa_usd.toFixed(2)}</td>
                        <td style="padding: 12px 8px; font-weight: bold;">Bs ${h.tasa_eur.toFixed(2)}</td>
                        <td style="padding: 12px 8px; color: #0f172a; font-weight: 500;">${(h.tasa_eur / h.tasa_usd).toFixed(3)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}