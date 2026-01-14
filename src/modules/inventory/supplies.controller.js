import { InventoryService } from './inventory.service.js';
import { SuppliesView } from './supplies.view.js';
import { SettingsService } from '../settings/settings.service.js';

let supplies = [];
let currentRates = null;

export async function loadSupplies() {
    const container = document.getElementById('app-content');
    SuppliesView.renderLayout(container);

    currentRates = await SettingsService.getGlobalRates();
    await loadData();
    bindEvents();
}

async function loadData() {
    try {
        supplies = await InventoryService.getSupplies();
        SuppliesView.renderTable(supplies, handleEdit, handleDelete);
    } catch (err) {
        console.error(err);
        alert("Error cargando suministros: " + err.message);
    }
}

function bindEvents() {
    const btnNew = document.getElementById('btn-new-supply');
    const btnClose = document.getElementById('btn-close-form');
    const btnSave = document.getElementById('btn-save-supply');
    const searchInput = document.getElementById('search-supply');

    // Inputs for cost preview
    const priceInput = document.getElementById('supply-last-price');
    const currencySelect = document.getElementById('supply-currency');
    const qtyInput = document.getElementById('supply-qty-input');
    const unitSelector = document.getElementById('supply-unit-selector');

    btnNew.onclick = () => {
        SuppliesView.resetForm();
        SuppliesView.showForm(true);
    };

    btnClose.onclick = () => {
        SuppliesView.showForm(false);
    };

    btnSave.onclick = async () => {
        // Trigger one last update to ensures hidden fields are ready
        const finalPriceUsd = SuppliesView.updateCostPreview(currentRates);

        const payload = {
            name: document.getElementById('supply-name').value.trim(),
            brand: document.getElementById('supply-brand').value.trim(),
            category: document.getElementById('supply-category').value,
            purchase_unit: document.getElementById('supply-purchase-unit').value.trim(),
            min_unit: document.getElementById('supply-min-unit').value,
            equivalence: parseFloat(document.getElementById('supply-equivalence').value),
            last_purchase_price: finalPriceUsd, // SAVED IN USD ALWAYS
            min_stock_threshold: parseFloat(document.getElementById('supply-threshold').value) || 0,
            stock_min_units: parseFloat(document.getElementById('supply-stock').value) || 0,
        };

        const id = document.getElementById('supply-id').value;
        if (id) payload.id = id;

        if (!payload.name || !payload.purchase_unit || !payload.min_unit || isNaN(payload.equivalence)) {
            return alert("Por favor complete los campos obligatorios y asegúrese que la equivalencia sea un número.");
        }

        try {
            await InventoryService.saveSupply(payload);
            SuppliesView.showForm(false);
            await loadData();
        } catch (err) {
            alert("Error al guardar: " + err.message);
        }
    };

    const updatePreview = () => SuppliesView.updateCostPreview(currentRates);
    priceInput.oninput = updatePreview;
    currencySelect.onchange = updatePreview;
    qtyInput.oninput = updatePreview;
    unitSelector.onchange = updatePreview;

    searchInput.onkeyup = (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = supplies.filter(s =>
            s.name.toLowerCase().includes(term) ||
            (s.brand && s.brand.toLowerCase().includes(term))
        );
        SuppliesView.renderTable(filtered, handleEdit, handleDelete);
    };
}

function handleEdit(id) {
    const supply = supplies.find(s => s.id === id);
    if (supply) {
        SuppliesView.fillForm(supply);
    }
}

async function handleDelete(id) {
    if (confirm("¿Está seguro de eliminar este suministro? Esta acción no se puede deshacer.")) {
        try {
            await InventoryService.deleteSupply(id);
            await loadData();
        } catch (err) {
            alert("Error al eliminar: " + err.message);
        }
    }
}
