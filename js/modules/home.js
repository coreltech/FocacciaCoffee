import { supabase } from '../supabase.js';

export async function loadDashboard() {
    const container = document.getElementById('app-content');
    
    container.innerHTML = `
        <div class="main-container">
            <header style="margin-bottom:30px;">
                <h1 style="font-size: 2rem; margin:0;">¡Hola de nuevo! 👋</h1>
                <p style="color: #64748b;">Este es el estado de Focaccia & Coffee hoy.</p>
            </header>

            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:15px; margin-bottom:30px;">
                <div class="stat-card" style="text-align:center; border-bottom: 4px solid #10b981;">
                    <small style="color:#64748b; font-weight:bold;">VENTAS HOY</small>
                    <div id="dash-sales-today" style="font-size:1.5rem; font-weight:800; margin-top:5px;">$0.00</div>
                </div>
                <div class="stat-card" style="text-align:center; border-bottom: 4px solid #f87171;">
                    <small style="color:#64748b; font-weight:bold;">POR COBRAR</small>
                    <div id="dash-pending" style="font-size:1.5rem; font-weight:800; margin-top:5px; color:#ef4444;">$0.00</div>
                </div>
                <div class="stat-card" style="text-align:center; border-bottom: 4px solid #3b82f6;">
                    <small style="color:#64748b; font-weight:bold;">PROD. ACTIVA</small>
                    <div id="dash-prod" style="font-size:1.5rem; font-weight:800; margin-top:5px;">0</div>
                </div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                <div class="stat-card">
                    <h3 style="font-size:1rem; margin-bottom:15px; color:#1e293b;">⚠️ Stock Crítico</h3>
                    <div id="dash-low-stock" style="display:flex; flex-direction:column; gap:10px;">
                        <p style="color:#94a3b8; font-size:0.9rem;">Cargando inventario...</p>
                    </div>
                </div>

                <div class="stat-card">
                    <h3 style="font-size:1rem; margin-bottom:15px; color:#1e293b;">🚀 Acciones Rápidas</h3>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                        <button onclick="window.appRouter('sales')" style="padding:15px; border-radius:12px; border:none; background:#f1f5f9; cursor:pointer; font-weight:bold;">🛒 Nueva Venta</button>
                        <button onclick="window.appRouter('production')" style="padding:15px; border-radius:12px; border:none; background:#f1f5f9; cursor:pointer; font-weight:bold;">🍞 Hornear</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    renderDashboardData();
}

async function renderDashboardData() {
    const today = new Date().toISOString().split('T')[0];

    // 1. Ventas de hoy y Pendientes
    const { data: sales } = await supabase.from('sales_orders').select('total_amount, balance_due, payment_status, sale_date');
    
    const salesToday = sales?.filter(s => s.sale_date.startsWith(today))
                            .reduce((acc, curr) => acc + curr.total_amount, 0) || 0;
    const totalPending = sales?.reduce((acc, curr) => acc + curr.balance_due, 0) || 0;

    // 2. Producción activa
    const { count: prodCount } = await supabase.from('production_logs').select('*', { count: 'exact', head: true }).eq('status', 'En Proceso');

    // 3. Stock bajo (Menos de 2 unidades/kg por defecto)
    const { data: lowStock } = await supabase.from('ingredients').select('name, stock_actual, unit').lt('stock_actual', 2);

    // Actualizar UI
    document.getElementById('dash-sales-today').innerText = `$${salesToday.toFixed(2)}`;
    document.getElementById('dash-pending').innerText = `$${totalPending.toFixed(2)}`;
    document.getElementById('dash-prod').innerText = prodCount || 0;

    const lowStockDiv = document.getElementById('dash-low-stock');
    if (lowStock && lowStock.length > 0) {
        lowStockDiv.innerHTML = lowStock.map(i => `
            <div style="display:flex; justify-content:space-between; background:#fff1f2; padding:8px 12px; border-radius:8px; border:1px solid #ffe4e6;">
                <span style="font-weight:bold; font-size:0.85rem;">${i.name}</span>
                <span style="color:#be123c; font-weight:800;">${i.stock_actual} ${i.unit}</span>
            </div>
        `).join('');
    } else {
        lowStockDiv.innerHTML = `<p style="color:#10b981; font-size:0.9rem;">✅ Todo el stock está al día.</p>`;
    }
}