import { Store } from './store.js';
import { SettingsService } from '../modules/settings/settings.service.js';
import { checkAuth, logout, getCurrentRole, getCurrentUserName } from '../../core/supabase.js';

export class V2Router {
  constructor() {
    this.workspace = document.getElementById('app-workspace');
    this.topbarTitle = document.getElementById('topbar-title');
    this.navItems = document.querySelectorAll('.erp-nav-item');
    this.currentView = null;

    if (!this.workspace || !this.topbarTitle) {
      console.error('CRITICAL: Workspace components not found in DOM.');
      return;
    }

    this.checkAuthentication();
  }

  async checkAuthentication() {
    const { isAuthenticated, user } = await checkAuth();

    if (!isAuthenticated) {
      window.location.href = '/login.html';
      return;
    }

    // Inicializar datos del usuario en el Store
    const userData = {
      id: user.id,
      email: user.email,
      name: getCurrentUserName() || user.email,
      role: getCurrentRole() || 'asistente'
    };
    Store.update('user', userData);

    // Inicializar UI
    this.init();
    this.loadInitialData();
    this.displayGreeting();
    this.setupLogout();
  }

  displayGreeting() {
    const topbarActions = document.querySelector('.erp-topbar-actions');
    if (!topbarActions) return;

    const user = Store.state.user;
    const now = new Date();
    const hour = now.getHours();

    let greeting = "";
    let icon = "";

    if (hour >= 5 && hour < 12) {
      greeting = "¡Buenos días";
      icon = "☀️";
    } else if (hour >= 12 && hour < 18) {
      greeting = "¡Buenas tardes";
      icon = "☕";
    } else {
      greeting = "¡Buenas noches";
      icon = "🌙";
    }

    const motivationalMessages = [
      "Hoy es un gran día para hornear el éxito.",
      "La calidad es nuestra mejor receta.",
      "Cada detalle cuenta en nuestra artesanía.",
      "Pasión por el detalle, sabor inolvidable.",
      "Haciendo que cada bocado cuente."
    ];
    const randomMsg = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

    // Crear contenedor si no existe
    let greetingBox = document.getElementById('v2-greeting-box');
    if (!greetingBox) {
      greetingBox = document.createElement('div');
      greetingBox.id = 'v2-greeting-box';
      greetingBox.style = 'text-align: right; margin-right: 15px;';
      topbarActions.prepend(greetingBox);
    }

    greetingBox.innerHTML = `
        <div style="font-weight: 600; font-size: 0.9rem; color: var(--text-main);">
            ${greeting}, <span style="color: var(--primary-color);">${user.name.split(' ')[0]}</span>! ${icon}
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">
            ${randomMsg}
        </div>
    `;
  }

  setupLogout() {
    // Agregar botón de logout a la sidebar si no existe
    const sidebarContent = document.querySelector('.erp-sidebar');
    if (!sidebarContent) return;

    let logoutBtn = document.getElementById('v2-logout-btn');
    if (!logoutBtn) {
      const navGroup = document.createElement('div');
      navGroup.className = 'erp-nav-group';
      navGroup.style.marginTop = 'auto'; // Mandar al fondo
      navGroup.style.paddingBottom = '20px';

      navGroup.innerHTML = `
            <a href="#" id="v2-logout-btn" class="erp-nav-item" style="color: var(--danger-color);">
                <span>🚪 Cerrar Sesión</span>
            </a>
          `;
      sidebarContent.appendChild(navGroup);
      logoutBtn = document.getElementById('v2-logout-btn');
    }

    logoutBtn.onclick = async (e) => {
      e.preventDefault();
      if (confirm('¿Desea cerrar su sesión?')) {
        const res = await logout();
        if (res.success) window.location.href = '/login.html';
      }
    };
  }

  async loadInitialData() {
    try {
      const rates = await SettingsService.getRates();
      if (rates) {
        Store.update('rates', rates);
        console.log('V2 Global Rates Initialized:', rates);
      }
    } catch (error) {
      console.error('Error loading initial rates:', error);
    }
  }

  init() {
    // Event Delegation para el menú lateral
    this.navItems.forEach(item => {
      item.onclick = (e) => {
        e.preventDefault();

        // Manejo UI Activo
        this.navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // Obtener ruta y título
        const route = item.getAttribute('data-route');
        const span = item.querySelector('span');
        const titleText = span ? span.textContent.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g, '').trim() : "Módulo";

        this.navigate(route, titleText);
      };
    });

    // Cargar dashboard por defecto si estamos en la raíz
    if (!window.location.hash) {
      const dashboardItem = document.querySelector('[data-route="dashboard"]');
      if (dashboardItem) {
        // Usamos un pequeño delay para asegurar que el navegador procesó los eventos
        setTimeout(() => dashboardItem.click(), 50);
      }
    }
  }

  async navigate(route, title) {
    if (this.currentView === route) return;
    this.currentView = route;

    // Cambiar Título Principal
    this.topbarTitle.textContent = title || "Dashboard";

    // Mostrar loading
    this.workspace.innerHTML = `
      <div style="display:flex; justify-content:center; align-items:center; height:100%; color:var(--text-muted);">
        <p>Cargando módulo ${route}...</p>
      </div>
    `;

    try {
      // Mapa de rutas a sus respectivos controladores dinámicos
      const routes = {
        'dashboard': async () => {
          const { loadDashboard } = await import('../modules/dashboard/dashboard.controller.js');
          await loadDashboard(this.workspace);
        },
        'reportes': async () => {
          const { loadReports } = await import('../modules/reports/reports.controller.js');
          await loadReports();
        },
        'tasas': async () => {
          const { SettingsController } = await import('../modules/settings/settings.controller.js');
          const html = await SettingsController.render();
          this.workspace.innerHTML = html;
          SettingsController.initEvents();
        },
        'suministros': async () => {
          const { SuppliesController } = await import('../modules/supplies/supplies.controller.js');
          const html = await SuppliesController.render();
          this.workspace.innerHTML = html;
          SuppliesController.initEvents();
        },
        'catalogo': async () => {
          const { CatalogController } = await import('../modules/catalog/catalog.controller.js');
          const html = await CatalogController.render();
          this.workspace.innerHTML = html;
          CatalogController.initEvents();
        },
        'recetas': async () => {
          const { RecipesController } = await import('../modules/recipes/recipes.controller.js');
          const html = await RecipesController.render();
          this.workspace.innerHTML = html;
          RecipesController.initEvents();
        },
        'produccion': async () => {
          const { loadProduction } = await import('../modules/production/production.controller.js');
          await loadProduction();
        },
        'ventas': async () => {
          const { loadSales } = await import('../modules/sales/sales.controller.js');
          await loadSales();
        },
        'pos': async () => {
          const { loadSales } = await import('../modules/sales/sales.controller.js');
          await loadSales();
        },
        'cobranzas': async () => {
          const { loadReceivables } = await import('../modules/receivables/receivables.controller.js');
          await loadReceivables();
        },
        'compras': async () => {
          const { loadPurchases } = await import('../modules/purchases/purchases.controller.js');
          await loadPurchases();
        },
        'clientes': async () => {
          const { loadCustomers } = await import('../modules/customers/customers.controller.js');
          await loadCustomers();
        },
        'kardex': async () => {
          const { loadKardex } = await import('../modules/kardex/kardex.controller.js');
          await loadKardex(this.workspace);
        },
        'tesoreria': async () => {
          const { loadTreasury } = await import('../modules/treasury/treasury.controller.js');
          await loadTreasury(this.workspace);
        },
        'preventa': async () => {
          const { loadPreventa } = await import('../modules/preventa/preventa.controller.js');
          await loadPreventa();
        },
        'liquidacion': async () => {
          const { loadSettlement } = await import('../modules/settlement/settlement.controller.js');
          await loadSettlement(this.workspace);
        }
      };

      if (routes[route]) {
        await routes[route]();
      } else {
        this.workspace.innerHTML = `
          <div style="background:var(--surface-color); padding: 30px; border-radius:var(--radius-lg); border: 1px solid var(--border-color); text-align:center;">
            <h2 style="color:var(--text-main); margin-bottom: 10px;">Módulo: ${title}</h2>
            <p style="color:var(--text-muted);">El módulo <strong>${route}</strong> está en desarrollo.</p>
          </div>
        `;
      }

    } catch (error) {
      console.error(`Error cargando ruta: ${route}`, error);
      this.workspace.innerHTML = `
        <div style="color:var(--danger-color); padding:40px; text-align:center; background:white; border-radius:12px; border:1px solid #fee2e2;">
            <h3 style="margin-bottom:10px;">🛑 Error al cargar el módulo</h3>
            <p style="color:#7f1d1d; font-size:0.9rem;">${error.message}</p>
            <button class="btn btn-outline mt-15" onclick="location.reload()">Reintentar Carga</button>
        </div>
      `;
    }
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  if (!window.v2Router) {
    window.v2Router = new V2Router();
  }
});
