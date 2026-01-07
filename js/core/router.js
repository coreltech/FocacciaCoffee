// js/core/router.js

const routes = {
    dashboard:      () => import('../modules/dashboard.js'),
    tasas:          () => import('../modules/settings.js'),
    suministros:    () => import('../modules/ingredients.js'),
    recetas:        () => import('../modules/recipes.js'),
    produccion:     () => import('../modules/production.js'), 
    ventas:         () => import('../modules/sales.js'),
    administracion: () => import('../modules/admin.js'),
    plan:           () => import('../modules/plan.js'),
    reportes:       () => import('../modules/reports.js'),
    calculadora:    () => import('../modules/calculator.js'),
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
                if (!routes[tab]) {
                    throw new Error(`La ruta "${tab}" no está configurada en el router.`);
                }

                const module = await routes[tab]();
                
                // Ejecución dinámica según el tab
                if (tab === 'dashboard')      await module.loadDashboard();
                if (tab === 'tasas')          await module.loadSettings();
                if (tab === 'suministros')    await module.loadIngredients(); 
                if (tab === 'recetas')        await module.loadRecipes();
                if (tab === 'produccion')     await module.loadProduction();
                if (tab === 'ventas')         await module.loadSales();
                if (tab === 'administracion') await module.loadAdmin();
                if (tab === 'plan')           await module.loadPlan();
                if (tab === 'reportes')       await module.loadReports();
                if (tab === 'calculadora')    await module.loadCalculator();

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

    // Cargar la primera pestaña por defecto
    if (navButtons[0]) navButtons[0].click();
}