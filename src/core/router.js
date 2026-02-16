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
    ventas: ['director', 'gerente', 'asistente', 'vendedor'], // Vendedor agregado
    administracion: ['director'], // Solo director
    laboratorio: ['director'], // Solo director
    reportes: ['director', 'gerente'], // Director y gerente
    cierre_semanal: ['director', 'gerente'], // Director y gerente
    biblioteca: ['director', 'gerente', 'asistente'], // Todos
    mermas: ['director', 'gerente'], // Director y gerente
    config_productos: ['director', 'gerente'], // Director y gerente
    compras: ['director', 'gerente'], // Director y gerente pueden registrar compras
    finanzas: ['director', 'gerente'], // Director y Gerente
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
    laboratorio: () => import('../modules/laboratorio/laboratorio.js'),
    reportes: () => import('../modules/reports/reports.js'),
    cierre_semanal: () => import('../modules/reports/weekly_closure.controller.js'),
    biblioteca: () => import('../modules/library/library.js'),
    mermas: () => import('../modules/waste/waste.controller.js'),
    config_productos: () => import('../modules/inventory/assembly_modern.controller.js'),
    compras: () => import('../modules/purchases/purchases.controller.js'),
    finanzas: () => import('../modules/finances/finances.controller.js'),
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
    const navButtons = document.querySelectorAll('.nav-btn:not(#logout-btn)');
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

/**
 * Mantiene el estado de los módulos cargados
 */
const loadedModules = {};

export async function initRouter() {
    // 1. Verificar autenticación
    const { isAuthenticated } = await checkAuth();

    if (!isAuthenticated) {
        window.location.href = '/login.html';
        return;
    }

    // 2. Mostrar información del usuario
    displayUserInfo();

    // 3. Ocultar botones según rol
    updateNavigationByRole();

    // 4. Configurar navegación SPA Persistente
    const navButtons = document.querySelectorAll('.nav-btn:not(#logout-btn)');
    const mainContainer = document.getElementById('app-content');

    // Limpiar contenedor principal al iniciar (por si acaso hay basura del HTML estático)
    // Pero preservando si ya hay estructura válida (en recargas calientes)
    if (!document.querySelector('.module-container')) {
        mainContainer.innerHTML = '';
    }

    navButtons.forEach(btn => {
        btn.onclick = async () => {
            const tab = btn.dataset.tab;

            // Verificar permisos
            if (!hasPermission(tab)) {
                alert(`🚫 Acceso Denegado: No tienes permisos para el módulo ${tab}.`);
                return;
            }

            // Actualizar estado visual de botones
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Ocultar todos los módulos activos
            document.querySelectorAll('.module-container').forEach(el => {
                el.style.display = 'none';
                el.classList.remove('active-module');
            });

            // Verificar si el módulo ya existe
            let moduleContainer = document.getElementById(`module-${tab}`);

            if (moduleContainer) {
                // Si existe, solo mostrarlo (Estado Preservado)
                moduleContainer.style.display = 'block';
                moduleContainer.classList.add('active-module');

                // Opcional: Notificar al módulo que volvió a ser visible (e.g., para recargar datos frescos si es necesario)
                // if (loadedModules[tab] && typeof loadedModules[tab].onShow === 'function') {
                //     loadedModules[tab].onShow();
                // }
                return;
            }

            // Si NO existe, crearlo y cargarlo
            moduleContainer = document.createElement('div');
            moduleContainer.id = `module-${tab}`;
            moduleContainer.className = 'module-container fade-in';
            mainContainer.appendChild(moduleContainer);

            // Mostrar spinner de carga dentro del nuevo contenedor
            moduleContainer.innerHTML = `
                <div class="loading-state" style="text-align:center; padding:40px; color:#64748b;">
                    <div style="font-size:3rem; margin-bottom:10px;">⏳</div>
                    <h3>Cargando ${btn.innerText}...</h3>
                </div>
            `;

            try {
                if (!routes[tab]) throw new Error(`Ruta ${tab} no configurada.`);

                // Importar dinámicamente
                const module = await routes[tab]();
                loadedModules[tab] = module;

                // Limpiar spinner (El módulo debe encargarse de llenar su contenedor)
                // Hack: Para compatibilidad con módulos viejos que usan document.getElementById('app-content')
                // Vamos a "engañarlos" o modificar la forma en que renderizan.
                // SOLUCIÓN: Los módulos actuales suelen hacer `container = document.getElementById('app-content')`.
                // Esto borraría a los otros módulos.
                // NECESITAMOS que los módulos acepten un contenedor o usar un Proxy si no queremos tocarlos todos.
                // PERO, para hacerlo bien, vamos a pasar el contenedor al método de carga si es posible, 
                // o modificar temporalmente el getElementById (muy arriesgado).

                // MEJOR ESTRATEGIA: La mayoría de los módulos (como vi en dashboard.js y sales.controller.js) hacen:
                // const container = document.getElementById('app-content');
                // container.innerHTML = ...

                // Para que esto funcione sin refactorizar 15 archivos AHORA MISMO:
                // Vamos a limpiar el mainContainer SOLO VISUALMENTE (display:none a los otros), 
                // pero el problema es que si el módulo hace `innerHTML = ''` al app-content, BORRA TODO.

                // REVISION DE EMERGENCIA:
                // No puedo cambiar `app-content` en 15 archivos en un solo paso de manera segura.
                // ESTRATEGIA "INTEGRACIÓN FLUIDA LITE":
                // 1. Crear el `moduleContainer` dentro de `app-content`.
                // 2. Antes de llamar al `loadX`, parchear `document.getElementById` temporalmente para que cuando pidan 'app-content',
                //    devuelvan ESTE `moduleContainer`.

                const originalGetElement = document.getElementById.bind(document);

                // Monkey patch seguro solo para este tick
                document.getElementById = (id) => {
                    if (id === 'app-content') return moduleContainer;
                    return originalGetElement(id);
                };

                try {
                    // Ejecución dinámica
                    if (tab === 'dashboard') await module.loadDashboard();
                    else if (tab === 'tasas') await module.loadSettings();
                    else if (tab === 'suministros') await module.loadSupplies();
                    else if (tab === 'recetas') await module.loadRecipesPro();
                    else if (tab === 'produccion') await module.loadProduction();
                    else if (tab === 'catalogo') await module.loadCatalog();
                    else if (tab === 'ventas') await module.loadSales();
                    else if (tab === 'config_productos') await module.loadAssemblyModern();
                    else if (tab === 'mermas') await module.loadWaste();
                    else if (tab === 'administracion') await module.loadAdmin();
                    else if (tab === 'laboratorio') await module.loadPlan();
                    else if (tab === 'reportes') await module.loadReports();
                    else if (tab === 'cierre_semanal') await module.loadWeeklyClosure();
                    else if (tab === 'biblioteca') await module.loadLibrary();
                    else if (tab === 'compras') await module.loadPurchases();
                    else if (tab === 'finanzas') await module.loadFinances();

                    // Restaurar
                    document.getElementById = originalGetElement;
                } catch (e) {
                    document.getElementById = originalGetElement; // Restaurar en error
                    throw e;
                }

                moduleContainer.classList.add('active-module');

            } catch (err) {
                console.error("Error loading module:", err);
                moduleContainer.innerHTML = `
                    <div style="color:red; text-align:center; padding:20px;">
                        <h3>Error cargando ${tab}</h3>
                        <p>${err.message}</p>
                    </div>
                `;
            }
        };
    });

    // Cargar dashboard por defecto o la pestaña activa
    const activeBtn = document.querySelector('.nav-btn.active') || document.querySelector('.nav-btn[data-tab="dashboard"]');
    if (activeBtn && activeBtn.style.display !== 'none') {
        activeBtn.click();
    }
}
