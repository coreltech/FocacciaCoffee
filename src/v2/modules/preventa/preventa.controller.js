/**
 * Controlador de Preventa y Consolidación (Orchestration Layer)
 */
import { PreventaService } from './preventa.service.js';
import { PreventaView } from './preventa.view.js';

export async function loadPreventa() {
    const container = document.getElementById('app-workspace');
    if (!container) return;

    PreventaView.render(container);
    await refreshData();
    bindEvents();
}

async function refreshData() {
    const orders = await PreventaService.getPendingPreorders();
    const consolidated = await PreventaService.getConsolidatedResume();

    PreventaView.renderOrders(orders);
    PreventaView.renderConsolidated(consolidated, handleBakeAction);
}

function bindEvents() {
    const btnRefresh = document.getElementById('btn-refresh-preventa');
    if (btnRefresh) {
        btnRefresh.onclick = () => refreshData();
    }

    const btnPrint = document.getElementById('btn-print-workshop');
    if (btnPrint) {
        btnPrint.onclick = () => window.print();
    }
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
