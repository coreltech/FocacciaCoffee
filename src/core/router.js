// js/core/router.js
import { checkAuth, getCurrentRole, getCurrentUserName } from './supabase.js';

// Definición de permisos por módulo
const modulePermissions = {
    dashboard: ['director', 'gerente', 'asistente'],
    tasas: ['director'], // Solo director puede cambiar tasas
    suministros: ['director'], // Solo director ve costos de suministros
    recetas: ['director', 'gerente'], // Director y gerente pueden ver recetas
    produccion: ['director', 'gerente'], // Director y gerente pueden producir
    catalogo: ['director', 'gerente', 'asistente'], // Todos pueden ver catálogo
    ventas: ['director', 'gerente', 'asistente'], // Todos pueden vender
    administracion: ['director'], // Solo director
    plan: ['director'], // Solo director
    reportes: ['director', 'gerente'], // Director y gerente
    biblioteca: ['director', 'gerente', 'asistente'], // Todos
    mermas: ['director', 'gerente'], // Director y gerente
    config_productos: ['director', 'gerente'], // Director y gerente
    compras: ['director', 'gerente'], // Director y gerente pueden registrar compras
};

const routes = {
    dashboard: () => import('../modules/dashboard/dashboard.js'),
    tasas: () => import('../modules/settings/settings.controller.js'),
    suministros: () => import('../modules/inventory/supplies.controller.js'),
    recetas: () => import('../modules/inventory/recipes_pro.controller.js'),
    produccion: () => import('../modules/production/production.controller.js'),
    catalogo: () => import('../modules/inventory/catalog.controller.js'),
    ventas: () => import('../modules/sales/sales.controller.js'),
    administracion: () => import('../modules/admin/admin.controller.js'),
    plan: () => import('../modules/plan/plan.js'),
    reportes: () => import('../modules/reports/reports.js'),
    biblioteca: () => import('../modules/library/library.js'),
    mermas: () => import('../modules/waste/waste.controller.js'),
    config_productos: () => import('../modules/inventory/assembly_modern.controller.js'),
    compras: () => import('../modules/purchases/purchases.controller.js'),
};

/**
 * Verifica si el usuario tiene permiso para acceder a un módulo
 */
function hasPermission(moduleName) {
    const userRole = getCurrentRole();
    const allowedRoles = modulePermissions[moduleName] || [];
    return allowedRoles.includes(userRole);
}

/**
 * Oculta botones de navegación según el rol del usuario
 */
function updateNavigationByRole() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const userRole = getCurrentRole();

    navButtons.forEach(btn => {
        const tab = btn.dataset.tab;
        const allowedRoles = modulePermissions[tab] || [];

        if (!allowedRoles.includes(userRole)) {
            btn.style.display = 'none';
        } else {
            btn.style.display = '';
        }
    });
}

/**
 * Muestra información del usuario en la barra de navegación
 */
function displayUserInfo() {
    const userName = getCurrentUserName();
    const userRole = getCurrentRole();

    // Traducir roles al español
    const roleNames = {
        director: 'Director',
        gerente: 'Gerente',
        asistente: 'Asistente'
    };

    const header = document.querySelector('.nav-bar');

    // Crear contenedor de usuario si no existe
    let userContainer = document.getElementById('user-info-container');

    // console.log("Mostrando usuario:", userName, userRole);

    if (!userContainer) {
        userContainer = document.createElement('div');
        userContainer.id = 'user-info-container';
        userContainer.className = 'user-profile-section';
        // Remove inline styles to rely on theme.css

        userContainer.innerHTML = `
            <div class="user-info-details">
                <div class="user-name">${userName}</div>
                <div class="user-role">${roleNames[userRole] || userRole}</div>
            </div>
            <button id="logout-btn" class="nav-btn logout-btn">
                🚪 Cerrar Sesión
            </button>
        `;

        header.appendChild(userContainer);

        // Agregar evento al botón de logout
        document.getElementById('logout-btn').addEventListener('click', handleLogout);
    }
}

/**
 * Maneja el cierre de sesión
 */
async function handleLogout() {
    const { logout } = await import('./supabase.js');
    const result = await logout();

    if (result.success) {
        window.location.href = '/login.html';
    } else {
        alert('Error al cerrar sesión: ' + result.error);
    }
}

export async function initRouter() {
    // 1. Verificar autenticación
    const { isAuthenticated } = await checkAuth();

    if (!isAuthenticated) {
        // Redirigir a login si no está autenticado
        window.location.href = '/login.html';
        return;
    }

    // 2. Mostrar información del usuario y botón de logout
    displayUserInfo();

    // 3. Ocultar botones según rol
    updateNavigationByRole();

    // 4. Configurar navegación
    const navButtons = document.querySelectorAll('.nav-btn:not(#logout-btn)');
    const container = document.getElementById('app-content');

    navButtons.forEach(btn => {
        btn.onclick = async () => {
            const tab = btn.dataset.tab;

            // Verificar permisos
            if (!hasPermission(tab)) {
                container.innerHTML = `
                    <div class="stat-card" style="border: 2px solid #ef4444; background: #fef2f2;">
                        <h3 style="color: #dc2626;">🚫 Acceso Denegado</h3>
                        <p>No tienes permisos para acceder a este módulo.</p>
                        <p style="font-size: 0.9rem; color: #666;">Tu rol actual: <b>${getCurrentRole()}</b></p>
                    </div>
                `;
                return;
            }

            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            container.innerHTML = '<div class="stat-card">Cargando...</div>';

            try {
                if (!routes[tab]) {
                    throw new Error(`La ruta "${tab}" no está configurada en el router.`);
                }

                const module = await routes[tab]();

                // Ejecución dinámica según el tab
                if (tab === 'dashboard') await module.loadDashboard();
                if (tab === 'tasas') await module.loadSettings();
                if (tab === 'suministros') await module.loadSupplies();
                if (tab === 'recetas') await module.loadRecipesPro();
                if (tab === 'produccion') await module.loadProduction();
                if (tab === 'catalogo') await module.loadCatalog();
                if (tab === 'ventas') await module.loadSales();
                if (tab === 'config_productos') await module.loadAssemblyModern();
                if (tab === 'mermas') await module.loadWaste();
                if (tab === 'administracion') await module.loadAdmin();
                if (tab === 'plan') await module.loadPlan();
                if (tab === 'reportes') await module.loadReports();
                if (tab === 'biblioteca') await module.loadLibrary();
                if (tab === 'compras') await module.loadPurchases();

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

    // Cargar la primera pestaña visible por defecto
    const firstVisibleButton = Array.from(navButtons).find(btn => btn.style.display !== 'none');
    if (firstVisibleButton) firstVisibleButton.click();
}
