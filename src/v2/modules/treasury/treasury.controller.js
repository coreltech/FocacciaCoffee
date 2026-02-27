import { TreasuryView } from './treasury.view.js';
import { TreasuryService } from './treasury.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { Formatter } from '../../core/formatter.js';

let state = {
    currentTab: 'expenses', // 'expenses' o 'contributions'
    expenses: [],
    contributions: [],
    rates: { tasa_usd_ves: 1 }
};

// Categorías para el Select de Gastos
const EXPENSE_CATEGORIES = ['Sueldos y Planilla', 'Servicios Públicos', 'Alquiler', 'Pasajes / Repartos', 'Mantenimiento', 'Insumos de Limpieza', 'Varios'];
const PARTNERS = ['Agustín Lugo Arias', 'Juan Manuel Márquez'];

export async function loadTreasury(container) {
    container.innerHTML = TreasuryView.renderMain();

    // Fechas por defecto: Mes actual
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const currentDate = today.toISOString().split('T')[0];

    document.getElementById('filter-start').value = firstDay;
    document.getElementById('filter-end').value = currentDate;
    document.getElementById('record-date').value = currentDate;

    bindEvents();
    await fetchAndRender();
}

async function fetchAndRender() {
    const start = document.getElementById('filter-start').value;
    const end = document.getElementById('filter-end').value;

    const [res, ratesRes] = await Promise.all([
        TreasuryService.getRecords(start, end),
        SettingsService.getRates()
    ]);

    if (ratesRes) {
        state.rates = ratesRes;
    }

    if (res.success) {
        state.expenses = res.expenses;
        state.contributions = res.contributions;

        // Calcular y actualizar KPIs
        const totalExp = state.expenses.reduce((sum, r) => sum + parseFloat(r.amount), 0);
        const totalCont = state.contributions.reduce((sum, r) => sum + parseFloat(r.amount), 0);
        TreasuryView.updateKPIs(totalExp, totalCont);

        renderCurrentTab();
    } else {
        alert("Error cargando registros de tesorería: " + res.error);
    }
}

function renderCurrentTab() {
    const records = state.currentTab === 'expenses' ? state.expenses : state.contributions;
    TreasuryView.renderTable(records, state.currentTab);

    // Cambiar etiquetas de las columnas de la tabla V2
    const thDynamic = document.getElementById('th-category-partner');
    if (thDynamic) {
        thDynamic.innerText = state.currentTab === 'expenses' ? 'CATEGORÍA' : 'SOCIO INVERSOR';
    }
}

function switchTab(newTab) {
    state.currentTab = newTab;

    // Actualizar clases visuales de los tabs
    document.querySelectorAll('.treasury-tab').forEach(btn => {
        if (btn.dataset.tab === newTab) {
            btn.classList.add('active');
            btn.style.borderBottomColor = newTab === 'expenses' ? 'var(--danger-color)' : 'var(--success-color)';
            btn.style.color = newTab === 'expenses' ? 'var(--danger-color)' : 'var(--success-color)';
        } else {
            btn.classList.remove('active');
            btn.style.borderBottomColor = 'transparent';
            btn.style.color = 'var(--text-muted)';
        }
    });

    renderCurrentTab();
}

function openModal() {
    const isExpense = state.currentTab === 'expenses';

    // Cambiar títulos y estilos
    document.getElementById('modal-treasury-title').innerText = isExpense ? 'Novedad: Gasto Operativo' : 'Novedad: Aporte de Capital';
    document.getElementById('record-type').value = state.currentTab;

    // Poblar el Select Dinámico
    document.getElementById('label-dynamic').innerText = isExpense ? 'Categoría de Gasto' : 'Socio Responsable';
    const selectEl = document.getElementById('record-dynamic');

    const options = isExpense ? EXPENSE_CATEGORIES : PARTNERS;
    selectEl.innerHTML = options.map(opt => `<option value="${opt}">${opt}</option>`).join('');

    // Limpiar campos y fecha actual
    document.getElementById('record-description').value = '';
    document.getElementById('record-beneficiary').value = '';
    document.getElementById('record-amount').value = '';
    document.getElementById('record-amount-bs').value = '';
    document.getElementById('record-date').value = new Date().toISOString().split('T')[0];

    // Mostrar tasa actual
    const tasa = state.rates.usd_to_ves || state.rates.tasa_usd_ves || 1;
    const spanTasa = document.getElementById('span-current-tasa');
    if (spanTasa) spanTasa.innerText = Formatter.formatNumber(tasa);

    document.getElementById('modal-treasury').classList.add('active');
}

function bindEvents() {
    // Sincronización de divisas en tiempo real
    const inputUsd = document.getElementById('record-amount');
    const inputBs = document.getElementById('record-amount-bs');

    if (inputUsd && inputBs) {
        inputUsd.oninput = () => {
            const val = parseFloat(inputUsd.value);
            const tasa = state.rates.usd_to_ves || state.rates.tasa_usd_ves || 1;
            if (!isNaN(val)) {
                inputBs.value = (val * tasa).toFixed(2);
            } else {
                inputBs.value = '';
            }
        };

        inputBs.oninput = () => {
            const val = parseFloat(inputBs.value);
            const tasa = state.rates.usd_to_ves || state.rates.tasa_usd_ves || 1;
            if (!isNaN(val)) {
                inputUsd.value = (val / tasa).toFixed(4);
            } else {
                inputUsd.value = '';
            }
        };
    }

    // Pestañas
    document.querySelectorAll('.treasury-tab').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.currentTarget.dataset.tab));
    });

    // Filtros
    document.getElementById('btn-filter-treasury')?.addEventListener('click', fetchAndRender);

    // Modal Buttons Event Delegation - Scoped to container if possible, but keeping consistency with V2
    const container = document.getElementById('app-workspace') || document;

    // Remove previous listeners if possible or use a more specific selector
    // In V2 SPA, we should be careful with global listeners.

    const openBtn = document.getElementById('btn-new-record');
    if (openBtn) {
        openBtn.onclick = () => openModal();
    }

    const closeBtnX = document.getElementById('btn-close-treasury-modal');
    if (closeBtnX) {
        closeBtnX.onclick = () => document.getElementById('modal-treasury').classList.remove('active');
    }

    const cancelBtn = document.getElementById('btn-cancel-treasury');
    if (cancelBtn) {
        cancelBtn.onclick = () => document.getElementById('modal-treasury').classList.remove('active');
    }

    // Guardar (Submit)
    document.getElementById('form-treasury-record')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const type = document.getElementById('record-type').value;
        const btnSave = document.getElementById('btn-save-treasury');

        btnSave.disabled = true;
        btnSave.innerText = 'Cargando...';

        let result;
        const currentRate = state.rates.usd_to_ves || state.rates.tasa_usd_ves || 1;

        if (type === 'expenses') {
            result = await TreasuryService.createExpense({
                date: document.getElementById('record-date').value,
                category: document.getElementById('record-dynamic').value,
                description: document.getElementById('record-description').value,
                beneficiary: document.getElementById('record-beneficiary').value,
                amount: document.getElementById('record-amount').value,
                rate: currentRate
            });
        } else {
            result = await TreasuryService.createContribution({
                date: document.getElementById('record-date').value,
                partner_name: document.getElementById('record-dynamic').value,
                description: document.getElementById('record-description').value,
                beneficiary: document.getElementById('record-beneficiary').value,
                amount: document.getElementById('record-amount').value,
                rate: currentRate
            });
        }

        btnSave.disabled = false;
        btnSave.innerText = 'Guardar Registro';

        if (result.success) {
            document.getElementById('modal-treasury').classList.remove('active');
            await fetchAndRender(); // Recargar grilla
        } else {
            alert("Error guardando registro: " + result.error);
        }
    });

    // Delegación de eventos para Eliminar
    const tbody = document.getElementById('treasury-table-body');
    if (tbody) {
        tbody.addEventListener('click', async (e) => {
            const btnDelete = e.target.closest('.btn-delete-record');
            if (btnDelete) {
                const id = btnDelete.dataset.id;
                const typeToDel = state.currentTab === 'expenses' ? 'EXPENSE' : 'CONTRIBUTION';

                if (confirm(`¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer.`)) {
                    btnDelete.disabled = true;
                    btnDelete.innerText = '⏳';

                    const res = await TreasuryService.deleteRecord(id, typeToDel);
                    if (res.success) {
                        await fetchAndRender();
                    } else {
                        alert(res.error);
                        btnDelete.disabled = false;
                        btnDelete.innerText = '🗑️';
                    }
                }
            }
        });
    }
}
