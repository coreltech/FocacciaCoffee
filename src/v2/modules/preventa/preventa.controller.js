import { PreventaService } from './preventa.service.js';
import { PreventaView } from './preventa.view.js';
import { PreventaExporter } from './preventa.export.js';

let state = {
    currentTab: 'orders',
    orders: [],
    consolidated: [],
    shoppingList: []
};

export async function loadPreventa() {
    const container = document.getElementById('app-workspace');
    if (!container) return;

    PreventaView.render(container);
    await refreshData();
    renderCurrentTab();
    bindEvents();
}

async function refreshData() {
    state.orders = await PreventaService.getPendingPreorders();
    state.consolidated = await PreventaService.getConsolidatedResume();
    state.shoppingList = await PreventaService.getShoppingList();
}

function renderCurrentTab() {
    const content = document.getElementById('preventa-content');
    if (!content) return;

    if (state.currentTab === 'orders') {
        PreventaView.renderOrdersTab(content, state.orders);
    } else if (state.currentTab === 'production') {
        PreventaView.renderProductionTab(content, state.consolidated, handleBakeAction);
    } else if (state.currentTab === 'market') {
        PreventaView.renderMarketTab(content, state.shoppingList);
    }

    // Al renderizar contenido dinámico, debemos re-bindear eventos de esa pestaña
    bindExportEvents();
}

function bindEvents() {
    const btnRefresh = document.getElementById('btn-refresh-preventa');
    if (btnRefresh) {
        btnRefresh.onclick = async () => {
            await refreshData();
            renderCurrentTab();
        };
    }

    // Manejo de tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentTab = btn.dataset.tab;
            renderCurrentTab();
        };
    });
}

function bindExportEvents() {
    // Órdenes
    const btnExpOrdersExcel = document.getElementById('btn-export-orders-excel');
    if (btnExpOrdersExcel) btnExpOrdersExcel.onclick = () => PreventaExporter.exportToExcel(state.orders, 'orders');

    const btnExpOrdersPdf = document.getElementById('btn-export-orders-pdf');
    if (btnExpOrdersPdf) btnExpOrdersPdf.onclick = () => PreventaExporter.exportToPDF(state.orders, 'orders');

    // Producción
    const btnExpProdExcel = document.getElementById('btn-export-prod-excel');
    if (btnExpProdExcel) btnExpProdExcel.onclick = () => PreventaExporter.exportToExcel(state.consolidated, 'production');

    const btnExpProdPdf = document.getElementById('btn-export-prod-pdf');
    if (btnExpProdPdf) btnExpProdPdf.onclick = () => PreventaExporter.exportToPDF(state.consolidated, 'production');

    // Mercado
    const btnExpMarketExcel = document.getElementById('btn-export-market-excel');
    if (btnExpMarketExcel) btnExpMarketExcel.onclick = () => PreventaExporter.exportToExcel(state.shoppingList, 'market');

    const btnExpMarketPdf = document.getElementById('btn-export-market-pdf');
    if (btnExpMarketPdf) btnExpMarketPdf.onclick = () => PreventaExporter.exportToPDF(state.shoppingList, 'market');
}

/**
 * Cuando se pulsa "Hornear" en el consolidado, redirige a Producción con los datos cargados
 */
function handleBakeAction(id, name, qty, orderIds) {
    // Usamos el router global para navegar a producción
    if (window.v2Router) {
        // Marcamos la intención en el router o Store si fuera necesario, 
        // pero usaremos el mismo método que usa ProductionView.renderPendingOrders (handleBakePending)

        window.v2Router.navigate('produccion', 'Producción V2');

        // Esperamos a que el módulo cargue para inyectar los datos
        setTimeout(() => {
            const select = document.getElementById('prod-target-id');
            const qtyInput = document.getElementById('prod-actual-qty');

            if (select && qtyInput) {
                // Seleccionar por ID o por nombre
                select.value = id || '';
                if (!select.value) {
                    for (let opt of select.options) {
                        if (opt.text.includes(name)) {
                            select.value = opt.value;
                            break;
                        }
                    }
                }

                select.dispatchEvent(new Event('change'));
                qtyInput.value = qty;
                qtyInput.dispatchEvent(new Event('input'));

                // Indicar al controlador de producción que estamos procesando órdenes específicas
                // Esto es un poco "hacky" pero evita duplicar lógica compleja
                console.log(`[Preventa] Inyectando datos en Producción para: ${name} (${qty})`);
            }
        }, 500);
    }
}
