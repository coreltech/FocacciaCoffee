import { supabase } from '../supabase.js';

export async function loadDashboard() {
    const container = document.getElementById('app-content');
    
    container.innerHTML = `
        <div class="main-container" style="background: #f8fafc; min-height: 100vh;">
            <header style="margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h1 style="color: #0f172a; font-size: 2rem; margin: 0;">🍞 Dashboard Focaccia & Coffee</h1>
                    <p style="color: #64748b; margin: 5px 0 0 0;">Análisis estratégico de tu panadería artesanal.</p>
                </div>
                <div style="background: white; padding: 10px 20px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                    <span style="font-size: 0.8rem; color: #94a3b8; display: block; text-transform: uppercase;">Estado del Horno</span>
                    <span style="color: #10b981; font-weight: bold; display: flex; align-items: center; gap: 5px;">
                        <span style="height: 8px; width: 8px; background: #10b981; border-radius: 50%;"></span> Operativo y Vendiendo
                    </span>
                </div>
            </header>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px;">
                <div class="stat-card" style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; border: none;">
                    <small style="opacity: 0.8;">INGRESOS TOTALES</small>
                    <div id="total-revenue" style="font-size: 2.2rem; font-weight: 800; margin: 10px 0;">$0.00</div>
                    <div style="font-size: 0.8rem; background: rgba(16, 185, 129, 0.2); padding: 4px 8px; border-radius: 6px; width: fit-content;">↑ Tendencia Positiva</div>
                </div>
                
                <div class="stat-card" style="border-left: 6px solid #f59e0b;">
                    <small style="color: #64748b;">COSTO DE OPERACIÓN (USD)</small>
                    <div id="total-expenses-combined" style="font-size: 2.2rem; font-weight: 800; color: #0f172a; margin: 10px 0;">$0.00</div>
                    <small style="color: #94a3b8;">Fijos + Insumos</small>
                </div>

                <div class="stat-card" style="background: #ffffff; border-left: 6px solid #10b981;">
                    <small style="color: #64748b;">UTILIDAD NETA</small>
                    <div id="net-profit" style="font-size: 2.2rem; font-weight: 800; color: #10b981; margin: 10px 0;">$0.00</div>
                    <div id="profit-badge" style="font-size: 0.8rem; color: #64748b;">Calculado en tiempo real</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1.2fr; gap: 20px; margin-top: 25px;">
                <div class="stat-card">
                    <h3 style="margin-bottom: 20px; font-size: 1.1rem; color: #1e293b;">📈 Flujo de Caja (Últimos 7 Días)</h3>
                    <div style="height: 320px;">
                        <canvas id="lineChart"></canvas>
                    </div>
                </div>

                <div class="stat-card">
                    <h3 style="margin-bottom: 20px; font-size: 1.1rem; color: #1e293b;">🍰 Gastos por Categoría</h3>
                    <div style="height: 320px;">
                        <canvas id="pieChart"></canvas>
                    </div>
                </div>
            </div>

            <div class="stat-card" style="margin-top: 25px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="font-size: 1.1rem; color: #1e293b;">🏆 Top Focaccias & Cafés por Rentabilidad</h3>
                    <span style="font-size: 0.8rem; color: #3b82f6; font-weight: bold; cursor: pointer;">Ver todos los productos →</span>
                </div>
                <div style="height: 250px;">
                    <canvas id="barChart"></canvas>
                </div>
            </div>
        </div>
    `;

    renderDashboardData();
}

async function renderDashboardData() {
    // 1. OBTENCIÓN DE DATOS (Usando tus tablas finales)
    const { data: sales } = await supabase.from('sales_orders').select('*');
    const { data: expenses } = await supabase.from('operational_expenses').select('*');
    const { data: recipes } = await supabase.from('recipes').select(`
        id, nombre, precio_venta_usd, 
        recipe_ingredients (cantidad_necesaria, ingredients (costo_unidad_medida))
    `);

    if (!sales || !expenses) return;

    // --- PROCESAMIENTO ---
    const totalRev = sales.reduce((acc, s) => acc + (parseFloat(s.total_amount) || 0), 0);
    const totalExp = expenses.reduce((acc, e) => acc + (parseFloat(e.amount_usd) || 0), 0);
    
    // Calcular Utilidad Real considerando costos de receta
    let productProfitMap = {};
    sales.forEach(s => {
        const recipe = recipes.find(r => r.nombre === s.product_name);
        let costoUnit = 0;
        if (recipe) {
            costoUnit = recipe.recipe_ingredients.reduce((acc, ri) => 
                acc + (ri.cantidad_necesaria * (ri.ingredients?.costo_unidad_medida || 0)), 0);
            
            const utilidad = (s.unit_price - costoUnit) * s.quantity;
            productProfitMap[s.product_name] = (productProfitMap[s.product_name] || 0) + utilidad;
        }
    });

    // --- RENDERIZADO DE KPIs ---
    document.getElementById('total-revenue').innerText = `$${totalRev.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    document.getElementById('total-expenses-combined').innerText = `$${totalExp.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    const profit = totalRev - totalExp;
    const profitEl = document.getElementById('net-profit');
    profitEl.innerText = `$${profit.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    profitEl.style.color = profit >= 0 ? '#10b981' : '#ef4444';

    // --- CHART: LÍNEAS (Ventas Diarias) ---
    const salesByDay = sales.reduce((acc, s) => {
        const date = new Date(s.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        acc[date] = (acc[date] || 0) + s.total_amount;
        return acc;
    }, {});

    new Chart(document.getElementById('lineChart'), {
        type: 'line',
        data: {
            labels: Object.keys(salesByDay),
            datasets: [{
                data: Object.values(salesByDay),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#3b82f6',
                pointRadius: 4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });

    // --- CHART: TORTA (Gastos) ---
    const expenseCats = expenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount_usd;
        return acc;
    }, {});

    new Chart(document.getElementById('pieChart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(expenseCats),
            datasets: [{
                data: Object.values(expenseCats),
                backgroundColor: ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#7c3aed'],
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom' } } }
    });

    // --- CHART: BARRAS (Rentabilidad por producto) ---
    const topData = Object.entries(productProfitMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    new Chart(document.getElementById('barChart'), {
        type: 'bar',
        data: {
            labels: topData.map(d => d[0]),
            datasets: [{
                label: 'Utilidad Real ($)',
                data: topData.map(d => d[1]),
                backgroundColor: '#0f172a',
                borderRadius: 8
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}