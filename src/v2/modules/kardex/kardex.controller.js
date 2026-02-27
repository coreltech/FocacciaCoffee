import { KardexView } from './kardex.view.js';
import { KardexService } from './kardex.service.js';
import { CatalogService } from '../catalog/catalog.service.js';
import { PurchasesService } from '../purchases/purchases.service.js';

let state = {
    history: [],
    catalog: [],
    supplies: []
};

export async function loadKardex(container) {
    container.innerHTML = KardexView.renderMain();

    // Inyectar fechas por defecto (Mes actual)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const currentDate = today.toISOString().split('T')[0];

    document.getElementById('kdx-filter-start').value = firstDay;
    document.getElementById('kdx-filter-end').value = currentDate;

    await fetchDictionaries();
    bindEvents();

    // Autocargar con los filtros por defecto
    await filterKardexData();
}

async function fetchDictionaries() {
    const [cat, sup] = await Promise.all([
        CatalogService.getCatalog(),
        PurchasesService.getSupplies()
    ]);
    state.catalog = cat || [];
    state.supplies = sup || [];
}

function updateItemSelector() {
    const typeSelect = document.getElementById('kdx-filter-type');
    const itemSelect = document.getElementById('kdx-filter-item');

    const selectedType = typeSelect.value;

    if (!selectedType) {
        itemSelect.innerHTML = '<option value="">-- Selecciona el Tipo Primero --</option>';
        itemSelect.disabled = true;
        return;
    }

    itemSelect.disabled = false;
    let optionsHtml = '<option value="">Todos los Ítems</option>';

    if (selectedType === 'CATALOG_ITEM') {
        const sorted = [...state.catalog].sort((a, b) => a.name.localeCompare(b.name));
        sorted.forEach(item => {
            optionsHtml += `<option value="${item.id}">${item.name}</option>`;
        });
    } else if (selectedType === 'SUPPLY_ITEM') {
        const sorted = [...state.supplies].sort((a, b) => a.name.localeCompare(b.name));
        sorted.forEach(item => {
            optionsHtml += `<option value="${item.id}">${item.name} (${item.measurement_unit})</option>`;
        });
    }

    itemSelect.innerHTML = optionsHtml;
}

async function filterKardexData() {
    const formFilters = document.getElementById('form-kardex-filters');
    if (!formFilters) return;

    const btnSubmit = formFilters.querySelector('button[type="submit"]');
    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '⏳ Filtrando...';
    }

    const filters = {
        startDate: document.getElementById('kdx-filter-start').value,
        endDate: document.getElementById('kdx-filter-end').value,
        itemType: document.getElementById('kdx-filter-type').value,
        itemId: document.getElementById('kdx-filter-item').value
    };

    const history = await KardexService.getKardexHistory(filters);
    KardexView.renderKardexTable(history);

    if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = 'Filtrar';
    }
}

function bindEvents() {
    const typeSelect = document.getElementById('kdx-filter-type');
    if (typeSelect) {
        typeSelect.addEventListener('change', updateItemSelector);
    }

    const formFilters = document.getElementById('form-kardex-filters');
    if (formFilters) {
        formFilters.addEventListener('submit', async (e) => {
            e.preventDefault();
            await filterKardexData();
        });
    }

    const btnReset = document.getElementById('btn-reset-filters');
    if (btnReset) {
        btnReset.addEventListener('click', async () => {
            document.getElementById('kdx-filter-start').value = '';
            document.getElementById('kdx-filter-end').value = '';
            document.getElementById('kdx-filter-type').value = '';
            updateItemSelector(); // deshabilitará el selector de items
            await filterKardexData();
        });
    }
}
