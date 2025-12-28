// js/core/router.js

const routes = {
    // El nombre de la izquierda debe coincidir con el data-tab del HTML
    // El nombre de la derecha debe coincidir con el nombre REAL de tu archivo .js
    dashboard:   () => import('../modules/dashboard.js'),
    suministros: () => import('../modules/ingredients.js'), // <-- Busca ingredients.js
    gastos:      () => import('../modules/expenses.js'),
    recetas:     () => import('../modules/recipes.js'),
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
                const module = await routes[tab]();
                
                // IMPORTANTE: Aquí llamamos a la función interna del archivo
                if (tab === 'dashboard')   await module.loadDashboard();
                if (tab === 'suministros') await module.loadIngredients(); // Llama a loadIngredients
                if (tab === 'gastos')      await module.loadExpenses();
                if (tab === 'recetas')     await module.loadRecipes();
                if (tab === 'ventas')      await module.loadSales();
                if (tab === 'exchange')    await module.loadExchange();
                if (tab === 'plan')        await module.loadPlan();
                if (tab === 'reportes')    await module.loadReports();

            } catch (err) {
                container.innerHTML = `
                    <div class="stat-card">
                        <h3 style="color:red;">Error al cargar módulo</h3>
                        <p>No se pudo cargar: <b>${tab}</b></p>
                        <small>${err.message}</small>
                    </div>`;
                console.error(err);
            }
        };
    });

    if (navButtons[0]) navButtons[0].click();
}