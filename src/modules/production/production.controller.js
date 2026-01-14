import { ProductionService } from './production.service.js';
import { ProductionView } from './production.view.js';
import { InventoryService } from '../inventory/inventory.service.js';

let currentData = {};

export async function loadProduction() {
    const container = document.getElementById('app-content');

    try {
        currentData = await ProductionService.getData();

        ProductionView.renderLayout(container);
        ProductionView.populateSelects(currentData.recipes, currentData.allInputs, currentData.catalog);

        renderHistory();
        bindEvents();

    } catch (err) {
        console.error(err);
        container.innerHTML = `<p>Error: ${err.message}</p>`;
    }
}


function renderHistory() {
    ProductionView.renderHistory(currentData.logs, async (id) => {
        if (confirm("¿Eliminar registro?")) {
            await ProductionService.deleteLog(id);
            // Reload logs
            currentData = await ProductionService.getData();
            renderHistory();
        }
    });
}

function bindEvents() {
    const pSelect = document.getElementById('p-catalog-id');
    const pQty = document.getElementById('p-unidades');
    const btnSave = document.getElementById('btn-save-production');

    pSelect.onchange = async () => {
        const id = pSelect.value;
        if (!id) {
            ProductionView.renderAssemblyInfo(null);
            return;
        }

        try {
            const composition = await InventoryService.getCatalogComposition(id);
            const rCosts = await InventoryService.getRecipeCosts();

            let totalCost = 0;
            composition.forEach(c => {
                let cost = 0;
                if (c.recipe_id) {
                    const r = rCosts.find(rc => rc.recipe_id === c.recipe_id);
                    cost = (parseFloat(r?.total_estimated_cost_1kg_base || 0) / 1000);
                } else if (c.supply_id) {
                    cost = (parseFloat(c.supplies?.last_purchase_price || 0) / parseFloat(c.supplies?.equivalence || 1));
                } else if (c.component_id) {
                    // Cost of a nested product is its sale price or reference cost
                    cost = parseFloat(c.components?.precio_venta_final || 0);
                }
                totalCost += (cost * c.quantity);
            });

            ProductionView.renderAssemblyInfo(null, composition, totalCost);
            // Store totalCost in button for saving
            btnSave.dataset.cost = totalCost;

        } catch (e) {
            console.error(e);
            alert("Error al cargar composición: " + e.message);
        }
    };

    btnSave.onclick = async () => {
        const catalogId = pSelect.value;
        const units = parseFloat(pQty.value);
        const unitCost = parseFloat(btnSave.dataset.cost || 0);

        if (!catalogId || isNaN(units) || units <= 0) return;

        try {
            await ProductionService.registerProduction({
                batchName: pSelect.options[pSelect.selectedIndex].text,
                units,
                totalCost: unitCost * units,
                catalogId
            });
            alert("✅ Producción registrada y stock sumado al Catálogo.");
            loadProduction();
        } catch (e) {
            alert("Error: " + e.message);
        }
    };
}
