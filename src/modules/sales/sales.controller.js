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

        if (!opt.value) return Toast.error("Selecciona un producto");
        if (opt.value === 'manual' && !manualDesc) return Toast.error("Describe la venta manual");
        if (price <= 0) return Toast.error("Precio inválido");
        if (qty <= 0) return Toast.error("Cantidad inválida");

        // Disable button if stock warning is visible? Already handled by toggleStockWarning

        cart.push({
            product_id: opt.value === 'manual' ? null : opt.value,
            product_name: opt.value === 'manual' ? manualDesc : opt.text.split(' (')[0],
            quantity: qty,
            price: price,
            total_amount: price * qty,
            delivery_date: deliveryDate
        });

        Toast.success("Producto agregado al carrito");
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
                }
            });

            // Loop and Send
            for (const item of cart) {
                // Item Ratio
                const itemRatio = item.total_amount / totalCartUSD;

                // Construct proportional payment details for this item
                const itemPaymentDetails = {
                    tasa_bcv: rates.tasa_usd_ves,
                    items: paymentMethods.map(pm => ({
                        method: pm.method,
                        currency: pm.currency,
                        amount_native: pm.amount_native * itemRatio, // Proportional part of the native money
                        amount_usd: pm.amount_usd_eq * itemRatio
                    }))
                };

                const itemAmountPaid = paidUSD * itemRatio;
                const itemBalance = item.total_amount - itemAmountPaid;

                const saleData = {
                    product_id: item.product_id,
                    product_name: item.product_name,
                    quantity: item.quantity,
                    total_amount: item.total_amount,
                    amount_paid: itemAmountPaid,
                    payment_status: itemBalance <= 0.01 ? 'Pagado' : 'Pendiente',
                    payment_details: itemPaymentDetails,
                    customer_id: custId || null,
                    delivery_date: item.delivery_date
                };

                await SalesService.registerSale(saleData);
            }

            Toast.success("✅ Venta registrada exitosamente");
            cart = []; // Clear
            SalesView.renderCart(cart, rates);
            loadSales(filterDate.value); // Reload

            // Reset Payment inputs
            document.getElementById('payment-container').innerHTML = '';
            SalesView.addPaymentRow();

        } catch (err) {
            console.error("Error submitting cart:", err);
            alert("Error: " + err.message);
        } finally {
            btnSubmitSale.disabled = false;
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

    // Add Customer Logic
    const formNewCust = document.getElementById('new-customer-form');
    const inputName = document.getElementById('new-cust-name');
    const inputPhone = document.getElementById('new-cust-phone');
    const inputEmail = document.getElementById('new-cust-email');
    const btnSaveCust = document.getElementById('btn-save-customer');
    const btnCancelCust = document.getElementById('btn-cancel-customer');

    if (btnAddCustomer && formNewCust) {
        btnAddCustomer.onclick = () => {
            formNewCust.style.display = 'block';
            inputName.focus();
        };

        btnCancelCust.onclick = () => {
            formNewCust.style.display = 'none';
        };

        btnSaveCust.onclick = async () => {
            const name = inputName.value.trim();
            const phone = inputPhone.value.trim();
            const email = inputEmail.value.trim();

            if (!name) return alert("El nombre es obligatorio");

            btnSaveCust.disabled = true;
            btnSaveCust.innerText = "..";

            try {
                const newCustomer = await SalesService.registerCustomer({ name, phone, email });
                Toast.success(`Cliente ${name} creado`);

                // Manually append to selection and select it
                // We reload the whole catalog of customers to be safe and consistent
                // Or just append locally to avoid reload flicker
                inputName.value = '';
                inputPhone.value = '';
                inputEmail.value = '';
                formNewCust.style.display = 'none';

                // Reload sales (which reloads customers)
                loadSales(filterDate.value);

                // Ideally we should auto-select the new one, but reload might wipe it?
                // loadSales follows: populateCustomers. 
                // Let's rely on PopulateCustomers rendering the list. 
                // To select it, we can store it in a temp global or pass it?
                // For now, let's just let user select it (it will be at top or alphabetical).
            } catch (err) {
                console.error("Error creating customer:", err);
                alert("Error al crear cliente: " + err.message);
            } finally {
                btnSaveCust.disabled = false;
                btnSaveCust.innerText = "Guardar";
            }
        };
    }
}
