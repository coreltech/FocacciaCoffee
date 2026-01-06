import { supabase } from '../supabase.js';

export async function loadHistory() {
    const container = document.getElementById('app-content');
    
    container.innerHTML = `
        <div class="main-container">
            <header class="header-flex">
                <div>
                    <h1>📜 Historial de Producción</h1>
                    <p style="color: #64748b;">Registro cronológico de horneos y amasados</p>
                </div>
                <div style="display:flex; gap:10px;">
                    <button id="refresh-history" class="btn-secondary">🔄 Actualizar</button>
                </div>
            </header>

            <div id="history-stats" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:20px; margin-bottom:30px;">
                </div>

            <div class="stat-card">
                <table style="width:100%; border-collapse: collapse;">
                    <thead>
                        <tr style="text-align:left; border-bottom:2px solid #e2e8f0; color:#64748b;">
                            <th style="padding:15px;">Fecha</th>
                            <th>Receta</th>
                            <th>Unidades</th>
                            <th>Masa Total</th>
                            <th>Toppings / Extras</th>
                        </tr>
                    </thead>
                    <tbody id="history-body">
                        <tr><td colspan="5" style="padding:30px; text-align:center; color:#94a3b8;">Cargando registros...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    renderHistory();
    document.getElementById('refresh-history').onclick = renderHistory;
}

async function renderHistory() {
    const tbody = document.getElementById('history-body');
    const statsContainer = document.getElementById('history-stats');

    const { data, error } = await supabase
        .from('production_logs')
        .select('*')
        .order('fecha', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">Error: ${error.message}</td></tr>`;
        return;
    }

    // Calcular estadísticas básicas
    const totalUnits = data.reduce((acc, log) => acc + log.unidades_producidas, 0);
    const totalMass = data.reduce((acc, log) => acc + parseFloat(log.masa_total_kg), 0);
    const totalBatches = data.length;

    statsContainer.innerHTML = `
        <div class="stat-card" style="border-left: 5px solid #3b82f6;">
            <small style="color:#64748b; font-weight:bold;">LOTES TOTALES</small>
            <div style="font-size:1.8rem; font-weight:bold;">${totalBatches}</div>
        </div>
        <div class="stat-card" style="border-left: 5px solid #10b981;">
            <small style="color:#64748b; font-weight:bold;">UNIDADES PRODUCIDAS</small>
            <div style="font-size:1.8rem; font-weight:bold;">${totalUnits}</div>
        </div>
        <div class="stat-card" style="border-left: 5px solid #8b5cf6;">
            <small style="color:#64748b; font-weight:bold;">HARINA ESTIMADA (KG)</small>
            <div style="font-size:1.8rem; font-weight:bold;">${(totalMass * 0.6).toFixed(1)} kg</div>
        </div>
    `;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding:30px; text-align:center; color:#94a3b8;">No hay registros de producción aún.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(log => {
        const fecha = new Date(log.fecha).toLocaleDateString('es-ES', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });

        // Formatear los toppings desde el JSONB
        const toppings = log.toppings_detalles && log.toppings_detalles.length > 0
            ? log.toppings_detalles.map(t => `<span style="background:#f3e8ff; color:#6b21a8; padding:2px 6px; border-radius:4px; font-size:0.75rem; margin-right:4px;">${t.nombre} (${t.cantidad})</span>`).join('')
            : '<small style="color:#cbd5e1;">Sin extras</small>';

        return `
            <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                <td style="padding:15px; color:#64748b; font-size:0.9rem;">${fecha}</td>
                <td style="font-weight:600; color:#1e293b;">${log.receta_nombre}</td>
                <td><span style="background:#dcfce7; color:#166534; padding:4px 10px; border-radius:15px; font-weight:bold; font-size:0.85rem;">${log.unidades_producidas} und</span></td>
                <td style="font-family:monospace; font-weight:bold;">${log.masa_total_kg.toFixed(2)} kg</td>
                <td>${toppings}</td>
            </tr>
        `;
    }).join('');
}