// js/core/router.js

const routes = {
    dashboard:   () => import('../modules/dashboard.js'),
    suministros: () => import('../modules/ingredients.js'),
    produccion:  () => import('../modules/production.js'), 
    gastos:      () => import('../modules/expenses.js'),
    recetas:     () => import('../modules/recipes.js'),
    historial :  () => import('../modules/history.js'),
    ventas:      () => import('../modules/sales.js'),
    exchange:    () => import('../modules/exchange.js'),
    plan:        () => import('../modules/plan.js'),
    reportes:    () => import('../modules/reports.js'),
};

export async function initRouter() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const container = document.getElementById('app-content');

    navButtons.forEach(btn => {
        btn.onclick = async () => {
            const tab = btn.dataset.tab;
            
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            container.innerHTML = '<div class="stat-card">Cargando...</div>';

            try {
                // Verificamos que la ruta exista en nuestro objeto
                if (!routes[tab]) {
                    throw new Error(`La ruta "${tab}" no está configurada en el router.`);
                }

                const module = await routes[tab]();
                
                // Llamada a la función correspondiente según el módulo cargado
                if (tab === 'dashboard')   await module.loadDashboard();
                if (tab === 'suministros') await module.loadIngredients(); 
                if (tab === 'gastos')      await module.loadExpenses();
                if (tab === 'recetas')     await module.loadRecipes();
                if (tab === 'produccion')  await module.loadProduction();
                if (tab === 'historial')     await module.loadHistory();
                if (tab === 'ventas')      await module.loadSales();
                if (tab === 'exchange')    await module.loadExchange();
                if (tab === 'plan')        await module.loadPlan();
                if (tab === 'reportes')    await module.loadReports();

            } catch (err) {
                container.innerHTML = `
                    <div class="stat-card">
                        <h3 style="color:red;">Error al cargar módulo</h3>
                        <p>No se pudo cargar: <b>${tab}</b></p>
                        <p style="font-size:0.8rem; color:#666;">Detalle: ${err.message}</p>
                    </div>`;
                console.error("Error en router:", err);
            }
        };
    });

    // Cargar la primera pestaña por defecto (Dashboard)
    if (navButtons[0]) navButtons[0].click();
}