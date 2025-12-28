import { supabase } from '../supabase.js';

export async function loadDashboard() {
    const container = document.getElementById('app-content');
    container.innerHTML = `
        <div class="main-container">
            <header class="header-flex">
                <h1>📊 Inteligencia de Negocio</h1>
                <div class="badge" style="background:#0f172a; color:white;">Datos en Tiempo Real</div>
            </header>

            <div class="main-grid">
                <div class="stat-card" style="border-left: 5px solid #10b981;">
                    <small>INGRESOS TOTALES (USD)</small>
                    <div id="total-revenue" class="stat-value">$0.00</div>
                </div>
                <div class="stat-card" style="border-left: 5px solid #ef4444;">
                    <small>EGRESOS (FIJOS + INSUMOS)</small>
                    <div id="total-expenses-combined" class="stat-value">$0.00</div>
                </div>
                <div class="stat-card" style="border-left: 5px solid #f59e0b;">
                    <small>UTILIDAD NETA ESTIMADA</small>
                    <div id="net-profit" class="stat-value">$0.00</div>
                </div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-top:20px;">
                <div class="stat-card">
                    <h3>📈 Tendencia de Ingresos (Últimos registros)</h3>
                    <div style="height: 300px;">
                        <canvas id="lineChart"></canvas>
                    </div>
                </div>

                <div class="stat-card">
                    <h3>🍰 Distribución de Gastos Fijos</h3>
                    <div style="height: 300px;">
                        <canvas id="pieChart"></canvas>
                    </div>
                </div>
            </div>

            <div class="stat-card" style="margin-top:20px;">
                <h3>🏆 Top 5 Productos por Utilidad Neta</h3>
                <div style="height: 300px;">
                    <canvas id="barChart"></canvas>
                </div>
            </div>
        </div>
    `;

    renderCharts();
}

async function renderCharts() {
    // 1. Obtener datos
    const { data: sales } = await supabase.from('sales').select('total_usd, created_at, fecha, recipe_id, cantidad, recipes(nombre, precio_venta_usd)');
    const { data: expenses } = await supabase.from('expenses').select('monto_usd, categoria, created_at');
    
    // Para COGS y Utilidad Neta por producto, necesitamos la info completa de recetas e ingredientes
    const { data: recipesWithIngredients } = await supabase.from('recipes').select(`
        id,
        nombre,
        precio_venta_usd,
        recipe_ingredients (
            cantidad_necesaria,
            ingredients (costo_unidad_medida)
        )
    `);

    // --- PROCESAMIENTO PARA GRÁFICA DE LÍNEAS (Tendencia de Ingresos) ---
    const salesByDay = {};
    sales?.forEach(s => {
        const date = s.fecha || new Date(s.created_at).toLocaleDateString();
        salesByDay[date] = (salesByDay[date] || 0) + parseFloat(s.total_usd);
    });

    const lineLabels = Object.keys(salesByDay);
    const lineSalesData = Object.values(salesByDay);

    // --- PROCESAMIENTO PARA GRÁFICA DE TORTA (Gastos Fijos por Categoría) ---
    const expenseCats = {};
    expenses?.forEach(ex => {
        expenseCats[ex.categoria] = (expenseCats[ex.categoria] || 0) + parseFloat(ex.monto_usd);
    });

    // --- PROCESAMIENTO PARA GRÁFICA DE BARRAS (Top Productos por Utilidad) ---
    const productProfitMap = {}; // {recipe_id: {nombre: 'Pan', utilidad: 10.50}}

    if (recipesWithIngredients && sales) {
        recipesWithIngredients.forEach(recipe => {
            const costoProduccionUnitario = recipe.recipe_ingredients.reduce((acc, ri) => {
                const costoBase = ri.ingredients?.costo_unidad_medida || 0;
                return acc + (ri.cantidad_necesaria * costoBase);
            }, 0);

            // Sumar la utilidad total de cada producto vendido
            sales.filter(s => s.recipe_id === recipe.id).forEach(s => {
                const utilidadUnit = parseFloat(recipe.precio_venta_usd) - costoProduccionUnitario;
                productProfitMap[recipe.id] = productProfitMap[recipe.id] || { nombre: recipe.nombre, utilidadTotal: 0 };
                productProfitMap[recipe.id].utilidadTotal += (utilidadUnit * s.cantidad);
            });
        });
    }

    // Convertir a array y ordenar para el Top 5
    const topProducts = Object.values(productProfitMap)
        .sort((a, b) => b.utilidadTotal - a.utilidadTotal)
        .slice(0, 5); // Tomar solo los 5 más rentables

    const barLabels = topProducts.map(p => p.nombre);
    const barData = topProducts.map(p => p.utilidadTotal.toFixed(2));

    // 2. Renderizar Gráfica de Líneas
    const ctxLine = document.getElementById('lineChart').getContext('2d');
    new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: lineLabels,
            datasets: [{
                label: 'Ventas Diarias ($)',
                data: lineSalesData,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 5
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });

    // 3. Renderizar Gráfica de Torta
    const ctxPie = document.getElementById('pieChart').getContext('2d');
    new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: Object.keys(expenseCats),
            datasets: [{
                data: Object.values(expenseCats),
                backgroundColor: ['#3b82f6', '#ef4444', '#f59e0b', '#7c3aed', '#10b981', '#64748b']
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } } 
        }
    });

    // 4. Renderizar Gráfica de Barras (Top Productos)
    const ctxBar = document.getElementById('barChart').getContext('2d');
    new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: barLabels,
            datasets: [{
                label: 'Utilidad Neta ($)',
                data: barData,
                backgroundColor: '#0f172a', // Un color neutro para la barra
                borderColor: '#0f172a',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true },
                x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 } } // Evita superposición de nombres largos
            }
        }
    });

    updateSummaryCards(sales, expenses, recipesWithIngredients); // Ahora pasamos recipesWithIngredients para el COGS
}

function updateSummaryCards(sales, expenses, recipesWithIngredients) {
    const totalRev = sales?.reduce((acc, s) => acc + parseFloat(s.total_usd), 0) || 0;
    const totalFixed = expenses?.reduce((acc, e) => acc + parseFloat(e.monto_usd), 0) || 0;
    
    let totalCogs = 0;
    if (sales && recipesWithIngredients) {
        sales.forEach(s => {
            const recipe = recipesWithIngredients.find(r => r.id === s.recipe_id);
            if (recipe && recipe.recipe_ingredients) {
                const costoUnitarioReceta = recipe.recipe_ingredients.reduce((accRI, ri) => {
                    const costoBase = ri.ingredients?.costo_unidad_medida || 0;
                    return accRI + (ri.cantidad_necesaria * costoBase);
                }, 0);
                totalCogs += (costoUnitarioReceta * s.cantidad);
            }
        });
    }

    const totalExp = totalFixed + totalCogs;
    const profit = totalRev - totalExp;

    document.getElementById('total-revenue').innerText = `$${totalRev.toFixed(2)}`;
    document.getElementById('total-expenses-combined').innerText = `$${totalExp.toFixed(2)}`;
    document.getElementById('net-profit').innerText = `$${profit.toFixed(2)}`;
    document.getElementById('net-profit').style.color = profit >= 0 ? '#10b981' : '#ef4444';
}