import { SalesService } from './sales.service.js';
import { SalesView } from './sales.view.js';
import { Toast } from '../../ui/toast.js';

let currentPage = 0;
const PAGE_SIZE = 50;
let salesSubscription = null;

export async function loadSales(selectedDate = new Date().toISOString().split('T')[0], append = false) {
    const container = document.getElementById('app-content');

    if (!append) {
        currentPage = 0;
    }

    // 1. Load Data
    try {
        const data = await SalesService.getData(selectedDate, currentPage, PAGE_SIZE);

        // 2. Render Layout (Only if it's the first load, otherwise we just append)
        if (!append) {
            SalesView.renderLayout(container, selectedDate, data.rates);
            SalesView.populateCatalog(data.catalog);
            SalesView.populateCustomers(data.customers);
        }

        // 3. Render History & Summary
        // Note: dailyStats is used for the summary (always correct for the day), sales is for the list (paginated)
        renderHistoryAndSummary(data.sales, data.dailyStats, append, data.totalCount);

        // 4. Bind Events (Only on initial load to avoid duplicate listeners)
        if (!append) {
            bindEvents(data.rates);
            setupRealtime(selectedDate);
        }

    } catch (err) {
        console.error("Error loading sales module:", err);
        if (!append) {
            container.innerHTML = `<p style="color:red">Error cargando ventas: ${err.message}</p>`;
        } else {
            alert("Error cargando más ventas: " + err.message);
        }
    }
}

function renderHistoryAndSummary(sales, dailyStats, append, totalCount) {
    // 1. Calculate Summary based on DAILY STATS (Global for the day, not just paginated)
    const resumen = { total: 0, credito: 0, metodos: {} };

    dailyStats.forEach(s => {
        const montoTotal = parseFloat(s.total_amount) || 0;
        const status = (s.payment_status || "").trim().toLowerCase();
        const deudaReal = (status === 'pagado') ? 0 : (parseFloat(s.balance_due) || 0);
        resumen.total += montoTotal;
        resumen.credito += deudaReal;

        if (s.payment_details && s.payment_details.items && Array.isArray(s.payment_details.items)) {
            s.payment_details.items.forEach(p => {
                const m = p.method || "Otros";
                resumen.metodos[m] = (resumen.metodos[m] || 0) + (parseFloat(p.amount_usd) || 0);
            });
        }
    });

    // Only update summary if it's the first load or if we want to keep it live (it's fast enough)
    SalesView.renderSummary(resumen);

    // 2. Render List
    SalesView.renderHistory(sales, append);

    // 3. Handle Load More Button
    const displayedCount = (currentPage + 1) * PAGE_SIZE;
    SalesView.toggleLoadMore(totalCount > displayedCount);

    // Bind dynamic button events for history items (Delete / Confirm Pay)
    // We re-bind all because innerHTML might have changed or we appended new nodes
    bindDynamicEvents();
}

function bindDynamicEvents() {
    document.querySelectorAll('.btn-delete-sale').forEach(btn => {
        btn.onclick = async () => {
            if (confirm("¿Eliminar registro?")) {
                await SalesService.deleteSale(btn.dataset.id);
                // Reload current view (reset to page 0 to avoid holes)
                const date = document.getElementById('filter-date').value;
                loadSales(date);
            }
        };
    });

    document.querySelectorAll('.btn-confirm-pay').forEach(btn => {
        btn.onclick = async () => {
            const amt = parseFloat(btn.dataset.amount);
            if (!confirm(`¿Registrar cobro de $${amt.toFixed(2)}?`)) return;
            await SalesService.confirmPendingPayment(btn.dataset.id, amt);
            const date = document.getElementById('filter-date').value;
            loadSales(date);
        };
    });
}

function setupRealtime(selectedDate) {
    if (salesSubscription) {
        salesSubscription.unsubscribe();
    }

    salesSubscription = SalesService.subscribeToSales((payload) => {
        console.log("Realtime update received:", payload);
        // Reload currently viewed date if affected
        const activeDate = document.getElementById('filter-date')?.value || new Date().toISOString().split('T')[0];

        // If it's today's date, we always reload for better UX
        // Otherwise, reload only if the date matches exactly
        if (activeDate === selectedDate) {
            loadSales(activeDate);
        }
    });
}

function bindEvents(rates) {
    const priceInput = document.getElementById('v-final-price');
    const qtyInput = document.getElementById('v-qty');
    const catalogSelect = document.getElementById('v-catalog-select');
    const btnSubmit = document.getElementById('btn-submit-sale');
    const addPayBtn = document.getElementById('add-pay-row');
    const filterDate = document.getElementById('filter-date');
    const paymentContainer = document.getElementById('payment-container');
    const btnLoadMore = document.getElementById('btn-load-more');
    const btnAddCustomer = document.getElementById('btn-add-customer');

    const calculate = () => {
        const opt = catalogSelect.options[catalogSelect.selectedIndex];
        const qty = parseFloat(qtyInput.value) || 0;
        const total = (parseFloat(priceInput.value) || 0) * qty;

        let paidUsd = 0;
        document.querySelectorAll('.pay-row').forEach(row => {
            const val = parseFloat(row.querySelector('.p-amt').value) || 0;
            const meth = row.querySelector('.p-meth').value;

            if (meth.includes('Bs')) {
                paidUsd += val / rates.tasa_usd_ves;
            } else if (meth.includes('EUR')) {
                paidUsd += (val * rates.tasa_eur_ves) / rates.tasa_usd_ves;
            } else {
                paidUsd += val;
            }
        });

        SalesView.updateTotals(total, total * rates.tasa_usd_ves);

        // Stock Logic
        if (opt && opt.value && opt.value !== 'manual') {
            const stockDisp = parseFloat(opt.dataset.stock) || 0;
            SalesView.toggleStockWarning(qty > stockDisp);
        } else {
            SalesView.toggleStockWarning(false);
        }

        return { total, paid: paidUsd, balance: total - paidUsd };
    };

    // Catalog Change
    catalogSelect.onchange = (e) => {
        const opt = e.target.options[e.target.selectedIndex];
        const isManual = opt.value === 'manual';
        const price = opt.dataset.price || "";
        SalesView.toggleManualMode(isManual, price);
        calculate();
    };

    // Inputs
    priceInput.oninput = calculate;
    qtyInput.oninput = calculate;

    // Add Payment Row
    addPayBtn.onclick = () => {
        const row = SalesView.addPaymentRow();
        row.querySelector('.p-amt').oninput = calculate;
    };

    // Initial listener for the first payment row
    const firstPay = paymentContainer.querySelector('.p-amt');
    if (firstPay) firstPay.oninput = calculate;

    // Submit Sale
    btnSubmit.onclick = async () => {
        const { total, paid, balance } = calculate();
        const opt = catalogSelect.options[catalogSelect.selectedIndex];
        const custId = document.getElementById('v-customer-id').value;
        const manualDesc = document.getElementById('v-manual-desc').value;

        if (!opt.value) return alert("Selecciona producto");
        if (opt.value === 'manual' && !manualDesc) return alert("Escribe qué estás vendiendo");
        if (balance > 0.01 && !custId) return alert("Selecciona cliente para crédito");

        const qty = parseFloat(qtyInput.value) || 0;
        const paymentDetails = {
            tasa_bcv: rates.tasa_usd_ves,
            items: []
        };

        document.querySelectorAll('.pay-row').forEach(row => {
            const rawVal = parseFloat(row.querySelector('.p-amt').value) || 0;
            const meth = row.querySelector('.p-meth').value;
            if (rawVal > 0) {
                let usdVal = rawVal;
                if (meth.includes('Bs')) {
                    usdVal = rawVal / rates.tasa_usd_ves;
                } else if (meth.includes('EUR')) {
                    usdVal = (rawVal * rates.tasa_eur_ves) / rates.tasa_usd_ves;
                }

                paymentDetails.items.push({
                    amount_usd: usdVal,
                    amount_native: rawVal,
                    method: meth,
                    currency: meth.includes('Bs') ? 'VES' : (meth.includes('EUR') ? 'EUR' : 'USD')
                });
            }
        });

        const saleData = {
            product_id: opt.value === 'manual' ? null : opt.value,
            product_name: opt.value === 'manual' ? manualDesc : opt.text.split(' (')[0],
            quantity: qty,
            total_amount: total,
            amount_paid: paid,
            payment_status: balance <= 0.01 ? 'Pagado' : 'Pendiente',
            payment_details: paymentDetails,
            customer_id: custId || null,
            delivery_date: document.getElementById('v-delivery-date').value || null // New Field
        };

        try {
            console.log("Enviando venta:", saleData);
            await SalesService.registerSale(saleData);
            alert("✅ Venta registrada correctamente");
            loadSales(filterDate.value); // Reload from scratch
        } catch (err) {
            console.error("Error en registro:", err);
            alert("Error: " + err.message);
        }
    };

    // Date Filter
    filterDate.onchange = (e) => loadSales(e.target.value);

    // Load More
    if (btnLoadMore) {
        btnLoadMore.onclick = () => {
            currentPage++;
            loadSales(filterDate.value, true);
        };
    }

    // Add Customer
    // Add Customer Logic
    const formNewCust = document.getElementById('new-customer-form');
    const inputName = document.getElementById('new-cust-name');
    const inputPhone = document.getElementById('new-cust-phone');
    const inputEmail = document.getElementById('new-cust-email');
    const btnSaveCust = document.getElementById('btn-save-customer');
    const btnCancelCust = document.getElementById('btn-cancel-customer');

    if (btnAddCustomer && formNewCust) {
        // Toggle Form
        btnAddCustomer.onclick = () => {
            formNewCust.style.display = 'block';
            inputName.focus();
        };

        // Cancel
        btnCancelCust.onclick = () => {
            formNewCust.style.display = 'none';
        };

        // Save
        btnSaveCust.onclick = async () => {
            const name = inputName.value.trim();
            const phone = inputPhone.value.trim();
            const email = inputEmail.value.trim();

            if (!name) return alert("El nombre es obligatorio");

            try {
                await SalesService.registerCustomer({ name, phone, email });
                Toast.success(`Cliente ${name} creado`);

                // Clear and Hide
                inputName.value = '';
                inputPhone.value = '';
                inputEmail.value = '';
                formNewCust.style.display = 'none';

                // Reload data to show new customer in select
                loadSales(filterDate.value);
            } catch (err) {
                console.error("Error creating customer:", err);
                alert("Error al crear cliente: " + err.message);
            }
        };
    }
}
