/**
 * Controlador V2 de Suministros (Materia Prima)
 * Conecta UI con BD y Maneja Eventos.
 */
import { SuppliesService } from './supplies.service.js';
import { SuppliesView } from './supplies.view.js';
import { Store } from '../../core/store.js';

export const SuppliesController = {

    async render() {
        Store.update('isLoading', true);

        // Obtener datos (Suministros + Tasas del store para pintar USD a Bs)
        const supplies = await SuppliesService.getSupplies();
        const rates = Store.state.rates;

        Store.update('isLoading', false);

        // Renderizar la vista pasándole los suministros y la tasa actual
        return SuppliesView.render(supplies, rates);
    },

    initEvents() {
        const currentRate = Store.state.rates?.usd_to_ves || 1;

        // --- FUNCIÓN PARA MOSTRAR CONVERSIÓN EN VIVO ---
        const updateLiveConversion = (priceId, currencyId, displayId) => {
            const price = parseFloat(document.getElementById(priceId).value) || 0;
            const currency = document.getElementById(currencyId).value;
            const display = document.getElementById(displayId);

            if (currency === 'VES' && currentRate > 0) {
                const converted = price / currentRate;
                display.innerText = `≈ ${converted.toFixed(4)} USD`;
            } else {
                display.innerText = '';
            }
        };

        // Escuchar submit del form nuevo suministro
        const form = document.getElementById('form-new-supply');
        if (form) {
            // Escuchar cambios para conversión en vivo
            ['sup-price', 'sup-currency'].forEach(id => {
                document.getElementById(id).addEventListener('input', () => {
                    updateLiveConversion('sup-price', 'sup-currency', 'sup-price-converted');
                });
            });

            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                let unit = document.getElementById('sup-unit').value;
                let format = parseFloat(document.getElementById('sup-format').value) || 1;
                let stock = parseFloat(document.getElementById('sup-stock').value) || 0;
                let minStock = parseFloat(document.getElementById('sup-min').value) || 0;
                let priceRaw = parseFloat(document.getElementById('sup-price').value) || 0;
                let currency = document.getElementById('sup-currency').value;

                // --- CONVERSIÓN DE MONEDA A USD BASE ---
                let pricePerPurchasedUnit = priceRaw;
                if (currency === 'VES') {
                    pricePerPurchasedUnit = priceRaw / currentRate;
                }

                // --- MOTOR DE CONVERSIÓN (FORMULA PANADERA CORE) ---
                let finalUnit = unit;
                let pricePerBaseUnit = 0;

                if (unit === 'Kg') {
                    finalUnit = 'g';
                    stock = stock * 1000;
                    minStock = minStock * 1000;
                    // Si compro 1 Kg (formato 1) a $10 -> 10 / (1 * 1000) = 0.01 por gramo
                    pricePerBaseUnit = pricePerPurchasedUnit / (format * 1000);
                } else if (unit === 'L') {
                    finalUnit = 'ml';
                    stock = stock * 1000;
                    minStock = minStock * 1000;
                    pricePerBaseUnit = pricePerPurchasedUnit / (format * 1000);
                } else {
                    // g, ml, Unidad. Si compro 200g a $3.22 -> 3.22 / 200 = 0.0161
                    pricePerBaseUnit = pricePerPurchasedUnit / format;
                }

                const formData = {
                    name: document.getElementById('sup-name').value,
                    category: document.getElementById('sup-cat').value,
                    measurement_unit: finalUnit,
                    stock: stock,
                    stock_min_units: minStock,
                    last_purchase_price: pricePerBaseUnit,
                    supplier_name: document.getElementById('sup-supplier').value
                };

                const btn = form.querySelector('button[type="submit"]');
                const ogText = btn.innerText;
                btn.innerText = "Guardando..."; btn.disabled = true;

                const result = await SuppliesService.createSupply(formData);

                btn.innerText = ogText; btn.disabled = false;

                if (result.success) {
                    form.reset();
                    document.getElementById('sup-price-converted').innerText = '';
                    alert("Suministro guardado. Conversión de unidades aplicada para recetas.");
                    window.v2Router.currentView = null;
                    window.v2Router.navigate('suministros', '📦 Mat. Prima (Sum.)');
                } else {
                    alert("Error: " + result.error);
                }
            });
        }

        // Escuchar botones de eliminar (event delegation)
        const table = document.getElementById('table-supplies');
        if (table) {
            table.addEventListener('click', async (e) => {
                const delBtn = e.target.closest('.btn-del-supply');
                if (delBtn) {
                    const id = delBtn.getAttribute('data-id');
                    if (confirm("¿Seguro que deseas eliminar este suministro base?")) {
                        const res = await SuppliesService.deleteSupply(id);
                        if (res.success) {
                            window.v2Router.currentView = null;
                            window.v2Router.navigate('suministros', '📦 Mat. Prima (Sum.)');
                        } else {
                            alert("Error al eliminar: " + res.error);
                        }
                    }
                } else if (e.target.closest('.btn-edit-supply')) {
                    // --- ABRIR MODAL EDITAR ---
                    const editBtn = e.target.closest('.btn-edit-supply');
                    const supplyStr = editBtn.getAttribute('data-supply');
                    if (supplyStr) {
                        const sup = JSON.parse(supplyStr);

                        document.getElementById('edit-sup-id').value = sup.id;
                        document.getElementById('edit-sup-name').value = sup.name;
                        document.getElementById('edit-sup-cat').value = sup.category || '';
                        document.getElementById('edit-sup-unit').value = sup.measurement_unit || 'g';
                        document.getElementById('edit-sup-stock').value = sup.stock || 0;
                        document.getElementById('edit-sup-min').value = sup.min_stock || 0;
                        document.getElementById('edit-sup-price').value = sup.last_price || 0;
                        document.getElementById('edit-sup-format').value = 1; // Por defecto 1 (ya está en unidad base)
                        document.getElementById('edit-sup-currency').value = 'USD';
                        document.getElementById('edit-sup-supplier').value = sup.supplier_name || '';
                        document.getElementById('edit-sup-price-converted').innerText = '';

                        const modal = document.getElementById('modal-edit-supply');
                        modal.style.display = 'flex';
                    }
                }
            });
        }

        // --- CERRAR MODAL ---
        const modalEdit = document.getElementById('modal-edit-supply');
        if (modalEdit) {
            const closeBtns = modalEdit.querySelectorAll('.btn-close-modal');
            closeBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    modalEdit.style.display = 'none';
                });
            });

            // Escuchar cambios para conversión en vivo en modal editar
            ['edit-sup-price', 'edit-sup-currency'].forEach(id => {
                document.getElementById(id).addEventListener('input', () => {
                    updateLiveConversion('edit-sup-price', 'edit-sup-currency', 'edit-sup-price-converted');
                });
            });
        }

        // --- ENVIAR FORMULARIO EDITAR ---
        const formEdit = document.getElementById('form-edit-supply');
        if (formEdit) {
            formEdit.addEventListener('submit', async (e) => {
                e.preventDefault();

                const id = document.getElementById('edit-sup-id').value;
                let unit = document.getElementById('edit-sup-unit').value;
                let format = parseFloat(document.getElementById('edit-sup-format').value) || 1;
                let priceRaw = parseFloat(document.getElementById('edit-sup-price').value) || 0;
                let currency = document.getElementById('edit-sup-currency').value;

                // --- CONVERSIÓN DE MONEDA A USD ---
                let pricePerPurchasedUnit = priceRaw;
                if (currency === 'VES') {
                    pricePerPurchasedUnit = priceRaw / currentRate;
                }

                // Cálculo de costo base real
                let lastPriceUsd = pricePerPurchasedUnit / format;

                // Si la unidad es Kg/L pero el usuario está editando y mantiene la unidad de gramo/ml (que ya se guardó convertida)
                // simplemente dividimos el precio entre el formato.

                const formData = {
                    name: document.getElementById('edit-sup-name').value,
                    category: document.getElementById('edit-sup-cat').value,
                    measurement_unit: document.getElementById('edit-sup-unit').value,
                    stock: parseFloat(document.getElementById('edit-sup-stock').value) || 0,
                    stock_min_units: parseFloat(document.getElementById('edit-sup-min').value) || 0,
                    last_purchase_price: lastPriceUsd,
                    supplier_name: document.getElementById('edit-sup-supplier').value
                };

                const btn = formEdit.querySelector('button[type="submit"]');
                const ogText = btn.innerText;
                btn.innerText = "Guardando..."; btn.disabled = true;

                const result = await SuppliesService.updateSupply(id, formData);

                btn.innerText = ogText; btn.disabled = false;

                if (result.success) {
                    modalEdit.style.display = 'none';
                    window.v2Router.currentView = null;
                    window.v2Router.navigate('suministros', '📦 Mat. Prima (Sum.)');
                } else {
                    alert("Error al editar: " + result.error);
                }
            });
        }
    }
};
