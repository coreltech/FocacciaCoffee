import { SalesService } from './sales.service.js';
import { SalesView } from './sales.view.js';
import { Toast } from '../../ui/toast.js';

let currentPage = 0;
const PAGE_SIZE = 50;
let salesSubscription = null;
let currentRates = null;

// STATE
let cart = [];
let viewMode = 'sale_date'; // 'sale_date' or 'delivery_date'

export async function loadSales(selectedDate = new Date().toISOString().split('T')[0], append = false) {
    const container = document.getElementById('app-content');

    if (!append) {
        currentPage = 0;
    }

    // 1. Load Data
    try {
        const data = await SalesService.getData(selectedDate, currentPage, PAGE_SIZE, viewMode);
        currentRates = data.rates;

        // 2. Render Layout (Only if it's the first load, otherwise we just append)
        if (!append) {
            SalesView.renderLayout(container, selectedDate, data.rates);
            SalesView.populateCatalog(data.catalog);
            SalesView.populateCustomers(data.customers);

            // Restore cart check? (Optional, skipping for simplicity)
            SalesView.renderCart(cart, data.rates);
        }

        // 3. Render History & Summary
        renderHistoryAndSummary(data.sales, data.dailyStats, append, data.totalCount);

        // 4. Bind Events (Only on initial load)
        if (!append) {
            bindEvents(data.rates);
            setupRealtime(selectedDate);

            // Set checkbox state if needed based on viewMode
            const chk = document.getElementById('chk-view-delivery');
            if (chk) chk.checked = (viewMode === 'delivery_date');
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

    if (!append) SalesView.renderSummary(resumen);
    SalesView.renderHistory(sales, append);

    const displayedCount = (currentPage + 1) * PAGE_SIZE;
    SalesView.toggleLoadMore(totalCount > displayedCount);

    bindDynamicEvents();
}

function bindDynamicEvents() {
    document.querySelectorAll('.btn-delete-sale').forEach(btn => {
        btn.onclick = async () => {
            if (confirm("¿Eliminar registro?")) {
                await SalesService.deleteSale(btn.dataset.id);
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

    // Remove from cart buttons
    document.querySelectorAll('.cart-remove-btn').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.dataset.index);
            cart.splice(idx, 1);
            SalesView.renderCart(cart, currentRates);
        };
    });
}

function setupRealtime(selectedDate) {
    if (salesSubscription) {
        salesSubscription.unsubscribe();
    }

    salesSubscription = SalesService.subscribeToSales((payload) => {
        console.log("Realtime update received:", payload);
        const activeDate = document.getElementById('filter-date')?.value || new Date().toISOString().split('T')[0];
        if (activeDate === selectedDate) {
            loadSales(activeDate);
        }
    });
}

function bindEvents(rates) {
    const priceInput = document.getElementById('v-final-price');
    const qtyInput = document.getElementById('v-qty');
    const catalogSelect = document.getElementById('v-catalog-select');
    const btnAddToCart = document.getElementById('btn-add-to-cart'); // CHANGED from submit
    const btnSubmitSale = document.getElementById('btn-submit-sale'); // NEW
    const addPayBtn = document.getElementById('add-pay-row');
    const filterDate = document.getElementById('filter-date');
    const chkViewDelivery = document.getElementById('chk-view-delivery');
    const paymentContainer = document.getElementById('payment-container');
    const btnLoadMore = document.getElementById('btn-load-more');
    const btnAddCustomer = document.getElementById('btn-add-customer');
    const deliveryDateInput = document.getElementById('v-delivery-date');

    // Helper: Calculate current line item total
    const calculateLineItem = () => {
        const qty = parseFloat(qtyInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        // Check Stock
        const opt = catalogSelect.options[catalogSelect.selectedIndex];
        const deliveryDate = deliveryDateInput.value;
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const isPreorder = deliveryDate && (deliveryDate > todayStr);

        if (opt && opt.value && opt.value !== 'manual' && !isPreorder) {
            const stockDisp = parseFloat(opt.dataset.stock) || 0;
            SalesView.toggleStockWarning(qty > stockDisp);
        } else {
            SalesView.toggleStockWarning(false);
        }
        return qty * price;
    };

    // Catalog Change
    catalogSelect.onchange = (e) => {
        const opt = e.target.options[e.target.selectedIndex];
        const isManual = opt.value === 'manual';
        const price = opt.dataset.price || "";
        SalesView.toggleManualMode(isManual, price);
        calculateLineItem();
    };

    // Inputs
    priceInput.oninput = calculateLineItem;
    qtyInput.oninput = calculateLineItem;
    deliveryDateInput.onchange = calculateLineItem;

    // --- CART LOGIC ---
    btnAddToCart.onclick = () => {
        const opt = catalogSelect.options[catalogSelect.selectedIndex];
        const qty = parseFloat(qtyInput.value) || 1;
        const price = parseFloat(priceInput.value) || 0;
        const manualDesc = document.getElementById('v-manual-desc').value;
        const deliveryDate = deliveryDateInput.value || null;

        if (!opt.value) return Toast.show("Selecciona un producto", "error");
        if (opt.value === 'manual' && !manualDesc) return Toast.show("Describe la venta manual", "error");
        if (price <= 0) return Toast.show("Precio inválido", "error");
        if (qty <= 0) return Toast.show("Cantidad inválida", "error");

        // Disable button if stock warning is visible? Already handled by toggleStockWarning

        cart.push({
            product_id: opt.value === 'manual' ? null : opt.value,
            product_name: opt.value === 'manual' ? manualDesc : opt.text.split(' (')[0],
            quantity: qty,
            price: price,
            total_amount: price * qty,
            delivery_date: deliveryDate
        });

        Toast.show("Producto agregado al carrito", "success");
        SalesView.renderCart(cart, rates);
        bindDynamicEvents(); // Rebind delete cart buttons

        // Reset Inputs (keep date?)
        qtyInput.value = 1;
        catalogSelect.value = "";
        SalesView.toggleManualMode(false, "");
    };

    // --- PAYMENT CALCULATOR ---
    const updatePaymentCalc = () => {
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
        return paidUsd;
    };

    // Bind payment inputs
    const bindPayInputs = () => {
        document.querySelectorAll('.p-amt').forEach(inp => inp.oninput = updatePaymentCalc);
    };

    // Add Payment Row
    addPayBtn.onclick = () => {
        const row = SalesView.addPaymentRow();
        row.querySelector('.p-amt').oninput = updatePaymentCalc;
    };

    // Auto-fill first payment row with Cart Total
    SalesView.addPaymentRow(); // Init one
    bindPayInputs();

    // --- SUBMIT CART ---
    btnSubmitSale.onclick = async () => {
        if (cart.length === 0) return;

        const custId = document.getElementById('v-customer-id').value;
        const totalCartUSD = cart.reduce((acc, item) => acc + item.total_amount, 0);
        const paidUSD = updatePaymentCalc();
        const balance = totalCartUSD - paidUSD;

        // Validation
        if (balance > 0.01 && !custId) return alert("⚠️ Para ventas a crédito (deuda pendiente), debes seleccionar un CLIENTE.");

        const isPaid = balance <= 0.01;

        // Distribute payment across items (Proportional or Sequential? - Lets do Proportional for simplicity in reporting, or just flag them all as paid)
        // Actually, if it's a single transaction "globally", and we split it into DB rows...
        // We need to split the payment details too.
        // STRATEGY: 
        // 1. Calculate ratio of each item to total.
        // 2. Assign proportional payment to each item.
        // 3. This ensures individual item balances are correct.

        if (!confirm(`¿Procesar venta por $${totalCartUSD.toFixed(2)}?`)) return;

        btnSubmitSale.disabled = true;
        btnSubmitSale.innerText = "Procesando...";

        try {
            // Collect Payment Details GLOBAL
            const paymentMethods = [];
            document.querySelectorAll('.pay-row').forEach(row => {
                const rawVal = parseFloat(row.querySelector('.p-amt').value) || 0;
                const meth = row.querySelector('.p-meth').value;
                if (rawVal > 0) {
                    paymentMethods.push({
                        amount_native: rawVal,
                        method: meth,
                        // storing USD eq for logic
                        amount_usd_eq: meth.includes('Bs') ? rawVal / rates.tasa_usd_ves : (meth.includes('EUR') ? (rawVal * rates.tasa_eur_ves) / rates.tasa_usd_ves : rawVal),
                        currency: meth.includes('Bs') ? 'VES' : (meth.includes('EUR') ? 'EUR' : 'USD')
                    });
                    console.log("Enviando venta:", saleData);
                    await SalesService.registerSale(saleData);
                    Toast.show("✅ Venta registrada correctamente", "success");
                    loadSales(filterDate.value); // Reload from scratch
                } catch (err) {
                    console.error("Error en registro:", err);
                    Toast.show("Error: " + err.message, "error");
                }
            };

            // Filter Changes
            filterDate.onchange = (e) => loadSales(e.target.value);

            chkViewDelivery.onchange = (e) => {
                viewMode = e.target.checked ? 'delivery_date' : 'sale_date';
                loadSales(filterDate.value);
            };

            // Load More
            if (btnLoadMore) {
                btnLoadMore.onclick = () => {
                    currentPage++;
                    loadSales(filterDate.value, true);
                };
            }

            // --- CUSTOMER MANAGEMENT ---
            const formNewCust = document.getElementById('new-customer-form');
            const inputName = document.getElementById('new-cust-name');
            const inputPhone = document.getElementById('new-cust-phone');
            const inputEmail = document.getElementById('new-cust-email');
            const inputId = document.getElementById('edit-cust-id'); // Hidden ID
            const lblFormTitle = document.getElementById('lbl-cust-form-title');
            const btnSaveCust = document.getElementById('btn-save-customer');
            const btnCancelCust = document.getElementById('btn-cancel-customer');
            const btnEditCust = document.getElementById('btn-edit-customer');
            const btnDelCust = document.getElementById('btn-del-customer');
            const selectCust = document.getElementById('v-customer-id');

            if (btnAddCustomer && formNewCust) {
                // Open Add
                btnAddCustomer.onclick = () => {
                    inputId.value = ""; // Clear ID -> Create Mode
                    lblFormTitle.textContent = "REGISTRAR NUEVO CLIENTE";
                    inputName.value = "";
                    inputPhone.value = "";
                    inputEmail.value = "";
                    formNewCust.style.display = 'block';
                    inputName.focus();
                };

                // Open Edit
                btnEditCust.onclick = () => {
                    const custId = selectCust.value;
                    if (!custId) return Toast.show("Seleccione un cliente para editar", "error");

                    const opt = selectCust.options[selectCust.selectedIndex];
                    const text = opt.text; // Name (Phone) usually

                    // Fetch details? Ideally we have them in customers array.
                    // For simplicity, we parse or we just get them from service if needed.
                    // Assuming we reload customers on loadSales, let's just find in DOM or fetch unique.
                    // Quick hack: Parse from text or just set name.
                    // Better: find in loaded customer list? currently not verifying list in controller scope.

                    // Let's assume we can set what we have
                    inputId.value = custId;
                    lblFormTitle.textContent = "EDITAR CLIENTE";
                    inputName.value = text.split(' (')[0].trim();
                    // inputPhone... we don't have it easily accessible unless we stored it in dataset.
                    // Let's rely on user re-entering or fetching.
                    // Suggestion: store full customer obj in memory or dataset.

                    formNewCust.style.display = 'block';
                    inputName.focus();
                };

                // Delete
                btnDelCust.onclick = async () => {
                    const custId = selectCust.value;
                    if (!custId) return Toast.show("Seleccione un cliente", "error");

                    if (!confirm("¿Eliminar este cliente? Se mantendrán sus ventas históricas.")) return;

                    try {
                        await SalesService.deleteCustomer(custId);
                        Toast.show("Cliente eliminado", "success");
                        loadSales(filterDate.value);
                    } catch (err) {
                        Toast.show("Error eliminando: " + err.message, "error");
                    }
                };

                // Cancel
                btnCancelCust.onclick = () => {
                    formNewCust.style.display = 'none';
                };

                // Save (Create or Update)
                btnSaveCust.onclick = async () => {
                    const name = inputName.value.trim();
                    const phone = inputPhone.value.trim();
                    const email = inputEmail.value.trim();
                    const id = inputId.value;

                    if (!name) return alert("El nombre es obligatorio");

                    try {
                        if (id) {
                            await SalesService.updateCustomer(id, { name, phone, email });
                            Toast.show(`Cliente actualizado`, "success");
                        } else {
                            await SalesService.registerCustomer({ name, phone, email });
                            Toast.show(`Cliente creado`, "success");
                        }

                        // Clear and Hide
                        inputName.value = '';
                        inputPhone.value = '';
                        inputEmail.value = '';
                        inputId.value = '';
                        formNewCust.style.display = 'none';

                        // Reload data to show new customer in select
                        loadSales(filterDate.value);
                    } catch (err) {
                        console.error("Error saving customer:", err);
                        alert("Error: " + err.message);
                    }
                };
            }
        }
