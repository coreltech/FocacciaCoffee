import { WasteService } from './waste.service.js';
import { WasteView } from './waste.view.js';

export async function loadWaste() {
    const container = document.getElementById('app-content');

    try {
        WasteView.renderLayout(container);

        // Load Data
        const items = await WasteService.getInventoryItems();
        WasteView.populateProducts(items.products); // Currently only products supported

        await refreshHistory();
        bindEvents();

    } catch (err) {
        console.error("Error loading waste module:", err);
        container.innerHTML = `<p style="color:red">Error cargando módulo: ${err.message}</p>`;
    }
}

async function refreshHistory() {
    const history = await WasteService.getWasteHistory();
    WasteView.renderHistory(history);
}

function bindEvents() {
    const reasonSelect = document.getElementById('w-reason');
    const manualReasonGroup = document.getElementById('w-reason-manual-group');

    reasonSelect.onchange = (e) => {
        manualReasonGroup.style.display = e.target.value === 'Otro' ? 'block' : 'none';
    };

    document.getElementById('btn-submit-waste').onclick = async () => {
        const productId = document.getElementById('w-product-select').value;
        const qty = parseFloat(document.getElementById('w-qty').value);
        let reason = reasonSelect.value;

        if (reason === 'Otro') {
            reason = document.getElementById('w-reason-manual').value;
        }

        if (!productId || isNaN(qty) || qty <= 0 || !reason) {
            return alert("Por favor completa todos los campos correctamente.");
        }

        if (!confirm(`¿Registrar MERMA de ${qty} unidades? Esto descontará del inventario.`)) return;

        try {
            await WasteService.registerWaste({
                itemId: productId,
                itemType: 'product',
                quantity: qty,
                reason: reason
            });

            alert("✅ Merma registrada.");
            WasteView.resetForm();
            refreshHistory();
            // Re-fetch products to update stock display in select? 
            // Ideally yes, but minor UX.
        } catch (err) {
            alert("Error: " + err.message);
        }
    };
}
