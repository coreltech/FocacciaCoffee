import { PurchasesService } from './purchases.service.js';
import { PurchasesView } from './purchases.view.js';
import { SettingsService } from '../settings/settings.service.js';
import { Formatter } from '../../core/formatter.js';

let state = {
    purchases: [],
    suppliers: [],
    supplies: [], // Para llenar el select de items
    rates: { tasa_usd_ves: 40.0 }, // Fallback
    cart: [],
    cartTotalUsd: 0,
    cartTotalBs: 0
};

export async function loadPurchases() {
    const container = document.getElementById('app-workspace');
    if (!container) return;

    // Inyectar UI principal
    container.innerHTML = PurchasesView.renderMain();

    await refreshData();
    bindEvents();
}

async function refreshData() {
    // Cargar datos en paralelo
    const [purchasesData, suppliersData, suppliesRes, ratesRes] = await Promise.all([
        PurchasesService.getPurchases(),
        PurchasesService.getSuppliers(),
        PurchasesService.getSupplies(),
        SettingsService.getRates()
    ]);

    state.purchases = purchasesData;
    state.suppliers = suppliersData;
    state.supplies = suppliesRes || [];
    if (ratesRes) {
        state.rates = ratesRes;
    }

    // Actualizar UI
    PurchasesView.renderPurchasesTable(state.purchases);
    PurchasesView.renderSuppliersOptions('pur-supplier-id', state.suppliers);
    PurchasesView.renderSuppliesOptions('pur-item-supply', state.supplies);

    // Configurar tasa actual en el modal
    const rateInput = document.getElementById('pur-bcv-rate');
    const tasa = state.rates.usd_to_ves || state.rates.tasa_usd_ves || 1;
    if (rateInput) rateInput.value = tasa;
}

function bindEvents() {
    // ==========================================
    // NAVEGACIÓN PRINCIPAL
    // ==========================================
    document.getElementById('btn-new-purchase').onclick = () => {
        state.cart = [];
        updateCartTotals();
        document.getElementById('form-purchase-v2').reset();
        document.getElementById('pur-date').value = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local
        document.getElementById('pur-bcv-rate').value = state.rates.tasa_usd_ves;
        document.getElementById('modal-purchase').classList.add('active');
    };

    document.getElementById('btn-manage-suppliers').onclick = () => {
        openSuppliersModal();
    };

    // ==========================================
    // MODAL PROVEEDORES
    // ==========================================
    document.getElementById('btn-save-supplier').onclick = async () => {
        const id = document.getElementById('sup-id').value;
        const name = document.getElementById('sup-name').value.trim();
        const contact_info = document.getElementById('sup-contact').value.trim();

        if (!name) return alert('El nombre es obligatorio');

        const res = await PurchasesService.saveSupplier({ id, name, contact_info, notes: '' });
        if (res.success) {
            document.getElementById('sup-id').value = '';
            document.getElementById('sup-name').value = '';
            document.getElementById('sup-contact').value = '';
            await refreshData();
            openSuppliersModal(); // Refrescar lista de proveedores en el modal
        } else {
            alert('Error guardando proveedor: ' + res.error);
        }
    };

    // ==========================================
    // MODAL COMPRAS - CARRITO
    // ==========================================
    const inputUsd = document.getElementById('pur-item-totalusd');
    const inputBs = document.getElementById('pur-item-totalbs');

    if (inputUsd && inputBs) {
        inputUsd.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            const tasa = state.rates.usd_to_ves || state.rates.tasa_usd_ves || 1;
            if (!isNaN(val)) {
                inputBs.value = (val * tasa).toFixed(4);
            } else {
                inputBs.value = '';
            }
        });

        inputBs.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            const tasa = state.rates.usd_to_ves || state.rates.tasa_usd_ves || 1;
            if (!isNaN(val)) {
                inputUsd.value = (val / tasa).toFixed(4);
            } else {
                inputUsd.value = '';
            }
        });
    }

    const btnAddLine = document.getElementById('btn-add-line');
    if (btnAddLine) {
        btnAddLine.onclick = () => {
            const supplySelect = document.getElementById('pur-item-supply');
            const supplyId = supplySelect.value;
            const supplyName = supplySelect.options[supplySelect.selectedIndex]?.text;
            const measure = supplySelect.options[supplySelect.selectedIndex]?.dataset?.measure;

            const qty = parseFloat(document.getElementById('pur-item-qty').value);
            const total = parseFloat(document.getElementById('pur-item-totalusd').value);

            if (!supplyId || isNaN(qty) || isNaN(total) || qty <= 0) {
                alert('Complete todos los campos del insumo de forma válida.');
                return;
            }

            // El unitario se calcula a partir del total entre la cantidad (Ej: 1 saco 45kg = $45 -> $1/kg)
            const unitPrice = total / qty;

            state.cart.push({
                supply_id: supplyId,
                name: supplyName.split(' (')[0], // Limpiar nombre
                measure: measure,
                qty: qty,
                total: total,
                price: unitPrice
            });

            document.getElementById('pur-item-supply').value = '';
            document.getElementById('pur-item-qty').value = '';
            document.getElementById('pur-item-totalusd').value = '';
            document.getElementById('pur-item-totalbs').value = '';

            updateCartTotals();
        };
    }

    const formPurchase = document.getElementById('form-purchase-v2');
    if (formPurchase) {
        formPurchase.onsubmit = async (e) => {
            e.preventDefault();

            if (state.cart.length === 0) {
                alert('Debes agregar al menos 1 insumo a la factura.');
                return;
            }

            const supplier_id = document.getElementById('pur-supplier-id').value;
            const purchase_date = document.getElementById('pur-date').value;
            const document_type = document.getElementById('pur-doc-type').value;
            const document_number = document.getElementById('pur-doc-number').value.trim();

            if (!confirm(`¿Registrar compra por ${Formatter.formatCurrency(state.cartTotalUsd)} e ingresar stock?`)) return;

            const payload = {
                supplier_id,
                purchase_date,
                document_type,
                document_number,
                total_usd: state.cartTotalUsd,
                total_bs: state.cartTotalBs,
                items: state.cart
            };

            const btnSave = document.getElementById('btn-save-purchase');
            btnSave.disabled = true;
            btnSave.textContent = 'Procesando...';

            const res = await PurchasesService.registerPurchase(payload);

            if (res.success) {
                alert('✅ Compra registrada exitosamente y stock actualizado.');
                document.getElementById('modal-purchase').classList.remove('active');
                await refreshData();
            } else {
                alert('❌ Error: ' + res.error);
            }

            btnSave.disabled = false;
            btnSave.textContent = 'Procesar Ingreso';
        };
    }
}

function openSuppliersModal() {
    PurchasesView.renderSuppliersTable(
        state.suppliers,
        (sup) => {
            document.getElementById('sup-id').value = sup.id;
            document.getElementById('sup-name').value = sup.name;
            document.getElementById('sup-contact').value = sup.contact;
        },
        async (id, name) => {
            if (confirm(`¿Eliminar al proveedor ${name}?`)) {
                await PurchasesService.deleteSupplier(id);
                await refreshData();
                openSuppliersModal();
            }
        }
    );
    document.getElementById('modal-suppliers').classList.add('active');
}

function updateCartTotals() {
    state.cartTotalUsd = state.cart.reduce((acc, current) => acc + current.total, 0);
    const tasa = state.rates.usd_to_ves || state.rates.tasa_usd_ves || 1;
    state.cartTotalBs = state.cartTotalUsd * tasa;

    document.getElementById('pur-grand-total-usd').textContent = Formatter.formatCurrency(state.cartTotalUsd);
    document.getElementById('pur-grand-total-bs').textContent = `(Bs. ${Formatter.formatNumber(state.cartTotalBs)})`;

    PurchasesView.renderCartTable(state.cart, (indexToRemove) => {
        state.cart.splice(indexToRemove, 1);
        updateCartTotals();
    });
}
