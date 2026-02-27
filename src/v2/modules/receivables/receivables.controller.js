/**
 * Controlador de Ventas y Cobranzas (Orchestration Layer V2)
 */
import { ReceivablesService } from './receivables.service.js';
import { ReceivablesView } from './receivables.view.js';
import { Formatter } from '../../core/formatter.js';
import { SettingsService } from '../settings/settings.service.js';

let state = {
    allOrders: [],
    filteredOrders: [],
    currentFilter: 'todas', // 'todas', 'cobradas', 'por_cobrar', 'encargos'
    startDate: '',          // 'YYYY-MM-DD'
    endDate: '',             // 'YYYY-MM-DD'
    rates: { tasa_usd_ves: 1 } // Tasa actual
};

export async function loadReceivables() {
    const container = document.getElementById('app-workspace');
    if (!container) return;

    ReceivablesView.render(container);
    await refreshData();
    bindEvents();
}

async function refreshData() {
    const [orders, ratesRes] = await Promise.all([
        ReceivablesService.getOrders(),
        SettingsService.getRates()
    ]);

    state.allOrders = orders;
    if (ratesRes) {
        state.rates = ratesRes;
    }

    applyFilter(state.currentFilter);
}

function applyFilter(filterId) {
    state.currentFilter = filterId;

    // First apply base filter
    let baseFiltered = state.allOrders;

    switch (filterId) {
        case 'cobradas':
            baseFiltered = state.allOrders.filter(o => o.payment_status === 'Pagado');
            break;
        case 'por_cobrar':
            baseFiltered = state.allOrders.filter(o => o.balance_due > 0);
            break;
        case 'encargos':
            baseFiltered = state.allOrders.filter(o => o.is_preorder === true && o.status === 'Pendiente');
            break;
        default: // 'todas'
            break;
    }

    // Then apply date filter if range is selected
    if (state.startDate || state.endDate) {
        baseFiltered = baseFiltered.filter(o => {
            if (!o.sale_date) return false;
            // Extraer solo la parte YYYY-MM-DD del string ISO o similar
            const orderDateOnly = o.sale_date.split('T')[0];
            const orderDate = new Date(orderDateOnly + 'T00:00:00');

            let passStart = true;
            let passEnd = true;

            if (state.startDate) {
                const start = new Date(state.startDate + 'T00:00:00');
                if (orderDate < start) passStart = false;
            }
            if (state.endDate) {
                const end = new Date(state.endDate + 'T00:00:00');
                if (orderDate > end) passEnd = false;
            }

            return passStart && passEnd;
        });
    }

    state.filteredOrders = baseFiltered;

    ReceivablesView.renderTable(state.filteredOrders, handleAbonarClick);

    // Solo calculamos KPIs sobre la data cruda filtrada
    ReceivablesView.updateKPIs(state.filteredOrders);
}

function bindEvents() {
    // Selectores de Fecha (Rango)
    const startDateInput = document.getElementById('filter-start-date');
    const endDateInput = document.getElementById('filter-end-date');

    if (startDateInput) {
        startDateInput.addEventListener('change', (e) => {
            state.startDate = e.target.value;
            applyFilter(state.currentFilter);
        });
    }

    if (endDateInput) {
        endDateInput.addEventListener('change', (e) => {
            state.endDate = e.target.value;
            applyFilter(state.currentFilter);
        });
    }

    // Pestañas (Filtros)
    document.querySelectorAll('.filter-group .pos-tab').forEach(btn => {
        btn.onclick = () => {
            // Actualizar UI
            document.querySelectorAll('.filter-group .pos-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Aplicar Filtro
            applyFilter(btn.dataset.filter);
        };
    });

    // Cambio dinámico de etiqueta de moneda en el modal
    const payMethod = document.getElementById('pay-method');
    const payLabel = document.getElementById('label-pay-amount');
    if (payMethod && payLabel) {
        payMethod.onchange = () => {
            const method = payMethod.value;
            if (method.includes('Bs') || method === 'Punto de Venta') {
                payLabel.innerText = 'Monto a Abonar (en Bs.):';
            } else {
                payLabel.innerText = 'Monto a Abonar (en USD):';
            }
        };
    }

    // Formulario de Pago (Modal)
    const formPay = document.getElementById('form-add-payment');
    if (formPay) {
        formPay.onsubmit = async (e) => {
            e.preventDefault();

            const btnSubmit = formPay.querySelector('button[type="submit"]');
            btnSubmit.disabled = true;
            btnSubmit.innerText = 'Procesando...';

            const orderId = document.getElementById('pay-order-id').value;
            const amount = parseFloat(document.getElementById('pay-amount').value);
            const method = document.getElementById('pay-method').value;

            // Conversión si es en Bs (Igual que en SalesController)
            let usdAmount = amount;
            if (method.includes('Bs') || method === 'Punto de Venta') {
                const tasa = state.rates.usd_to_ves || state.rates.tasa_usd_ves || 1;
                usdAmount = amount / tasa;
            }

            const res = await ReceivablesService.registerPayment(orderId, usdAmount, method, amount);

            if (res.success) {
                document.getElementById('modal-payment').classList.remove('active');
                await refreshData();
                formPay.reset();
            } else {
                alert('Error al registrar abono: ' + res.error);
            }

            btnSubmit.disabled = false;
            btnSubmit.innerText = 'Procesar Abono';
        };
    }
    // Escuchar el evento de borrar transacción desde la vista
    window.removeEventListener('Receivables:deleteOrder', handleDeleteOrder); // Prevenir duplicados
    window.addEventListener('Receivables:deleteOrder', handleDeleteOrder);
}

async function handleDeleteOrder(e) {
    const orderId = e.detail?.orderId;
    if (!orderId) return;

    const res = await ReceivablesService.deleteOrder(orderId);
    if (res.success) {
        // Recargar datos y refrescar la UI
        await refreshData();
    } else {
        alert('Error al intentar eliminar la transacción: ' + res.error);
    }
}

function handleAbonarClick(orderId, currentDebt) {
    const modal = document.getElementById('modal-payment');
    const inputId = document.getElementById('pay-order-id');
    const labelDebt = document.getElementById('pay-current-debt');
    const inputAmount = document.getElementById('pay-amount');

    if (modal && inputId && labelDebt && inputAmount) {
        inputId.value = orderId;
        labelDebt.innerText = Formatter.formatCurrency(currentDebt);

        // Pre-llenar input con deuda máxima, max=deuda para no abonar más de la cuenta
        inputAmount.value = parseFloat(currentDebt).toFixed(4);
        inputAmount.max = parseFloat(currentDebt).toFixed(4);
        inputAmount.step = "0.0001";

        modal.classList.add('active');
    }
}
