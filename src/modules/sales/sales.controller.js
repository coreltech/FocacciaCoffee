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
            SalesView.renderCart(cart, data.rates);
        }

        // 3. Render History & Summary
        renderHistoryAndSummary(data.sales, data.dailyStats, append, data.totalCount);

        // 4. Bind Events (Only on initial load)
        if (!append) {
            bindEvents(data.rates);
            setupRealtime(selectedDate);
            const chk = document.getElementById('chk-view-delivery');
            if (chk) chk.checked = (viewMode === 'delivery_date');
        }

    } catch (err) {
        console.error("Error loading sales module:", err);
        if (!append) {
            container.innerHTML = `<p style="color:red">Error cargando ventas: ${err.message}</p>`;
        } else {
            Toast.show("Error cargando más ventas: " + err.message, "error");
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
    const btnAddToCart = document.getElementById('btn-add-to-cart');
    const btnSubmitSale = document.getElementById('btn-submit-sale');
    const addPayBtn = document.getElementById('add-pay-row');
    const filterDate = document.getElementById('filter-date');
    const chkViewDelivery = document.getElementById('chk-view-delivery');
    const btnLoadMore = document.getElementById('btn-load-more');
    const deliveryDateInput = document.getElementById('v-delivery-date');

    // --- CALCULATOR LOGIC ---
    const calculateLineItem = () => {
        const qty = parseFloat(qtyInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;

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

    catalogSelect.onchange = (e) => {
        const opt = e.target.options[e.target.selectedIndex];
        const isManual = opt.value === 'manual';
        const price = opt.dataset.price || "";
        SalesView.toggleManualMode(isManual, price);
        calculateLineItem();
    };

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
        bindDynamicEvents();

        // Reset Inputs
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

    const bindPayInputs = () => {
        document.querySelectorAll('.p-amt').forEach(inp => inp.oninput = updatePaymentCalc);
    };

    addPayBtn.onclick = () => {
        const row = SalesView.addPaymentRow();
        row.querySelector('.p-amt').oninput = updatePaymentCalc;
    };

    SalesView.addPaymentRow();
    bindPayInputs();

    // --- UI TOGGLES ---
    const orderTypeSelect = document.getElementById('v-order-type');
    const deliveryAddrDiv = document.getElementById('div-delivery-address');

    // Ensure initial state check in case of reload/render quirks, though display:none is default
    if (orderTypeSelect) {
        orderTypeSelect.onchange = () => {
            const isDelivery = orderTypeSelect.value === 'delivery';
            if (deliveryAddrDiv) deliveryAddrDiv.style.display = isDelivery ? 'block' : 'none';
        };
    }

    // --- SUBMIT SALE ---
    btnSubmitSale.onclick = async () => {
        if (cart.length === 0) return Toast.show("El carrito está vacío", "error");

        const custId = document.getElementById('v-customer-id').value;
        const totalCartUSD = cart.reduce((acc, item) => acc + item.total_amount, 0);
        const paidUSD = updatePaymentCalc();
        const balance = totalCartUSD - paidUSD;
        // NEW: Order Type
        const orderType = document.getElementById('v-order-type').value;
        const deliveryAddress = document.getElementById('v-delivery-address').value.trim();

        if (orderType === 'delivery' && !deliveryAddress) {
            return Toast.show("⚠️ Falta la dirección de entrega", "error");
        }

        if (balance > 0.01 && !custId) return alert("⚠️ Para ventas a crédito (deuda pendiente), debes seleccionar un CLIENTE.");

        if (!confirm(`¿Procesar venta por $${totalCartUSD.toFixed(2)}?`)) return;

        btnSubmitSale.disabled = true;
        btnSubmitSale.innerText = "Procesando...";

        try {
            // Collect Payment Methods
            const paymentMethods = [];
            document.querySelectorAll('.pay-row').forEach(row => {
                const rawVal = parseFloat(row.querySelector('.p-amt').value) || 0;
                const meth = row.querySelector('.p-meth').value;
                if (rawVal > 0) {
                    paymentMethods.push({
                        amount_native: rawVal,
                        method: meth,
                        amount_usd_eq: meth.includes('Bs') ? rawVal / rates.tasa_usd_ves : (meth.includes('EUR') ? (rawVal * rates.tasa_eur_ves) / rates.tasa_usd_ves : rawVal),
                        currency: meth.includes('Bs') ? 'VES' : (meth.includes('EUR') ? 'EUR' : 'USD')
                    });
                }
            });

            // Loop and Register Each Item
            for (const item of cart) {
                const itemRatio = item.total_amount / totalCartUSD;

                // Distribute payment proportionally
                const itemPaymentDetails = {
                    tasa_bcv: rates.tasa_usd_ves,
                    order_type: orderType,
                    delivery_address: orderType === 'delivery' ? deliveryAddress : null, // Store Address
                    items: paymentMethods.map(pm => ({
                        method: pm.method,
                        currency: pm.currency,
                        amount_native: pm.amount_native * itemRatio,
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

            Toast.show("✅ Venta registrada exitosamente", "success");
            cart = [];
            SalesView.renderCart(cart, rates);
            loadSales(filterDate.value);

            // Reset Payment inputs
            document.getElementById('payment-container').innerHTML = '';
            SalesView.addPaymentRow();
            bindPayInputs();

        } catch (err) {
            console.error("Error submitting cart:", err);
            SalesView.renderCart(cart, rates); // Re-render to ensure buttons work
            alert("Error: " + err.message);
        } finally {
            btnSubmitSale.disabled = false;
            btnSubmitSale.innerText = "Registrar Venta";
        }
    };

    initCustomerManagement();

    // --- CUSTOMER MANAGEMENT ISOLATED ---
    function initCustomerManagement() {
        const formNewCust = document.getElementById('new-customer-form');
        const inputName = document.getElementById('new-cust-name');
        const inputPhone = document.getElementById('new-cust-phone');
        const inputEmail = document.getElementById('new-cust-email');
        const inputAddress = document.getElementById('new-cust-address'); // New
        const inputId = document.getElementById('edit-cust-id');
        const lblFormTitle = document.getElementById('lbl-cust-form-title');

        const btnAddCustomer = document.getElementById('btn-add-customer'); // top button
        const btnSaveCust = document.getElementById('btn-save-customer');
        const btnCancelCust = document.getElementById('btn-cancel-customer');
        const btnEditCust = document.getElementById('btn-edit-customer');
        const btnDelCust = document.getElementById('btn-del-customer');
        const selectCust = document.getElementById('v-customer-id');
        const filterDate = document.getElementById('filter-date');
        const deliveryAddrInput = document.getElementById('v-delivery-address'); // Main form address input

        // Auto-fill Delivery Address on Customer Select
        if (selectCust) {
            selectCust.onchange = () => {
                const opt = selectCust.options[selectCust.selectedIndex];
                // We need to access the full customer object to get the address.
                // Hack: We can pull it from dataset if we populate it in view.
                // Let's rely on PopulateCustomers to add data-address
                if (opt.dataset && opt.dataset.address) {
                    if (deliveryAddrInput) deliveryAddrInput.value = opt.dataset.address;
                }
            };
        }

        if (!formNewCust) return;

        // Open Add
        if (btnAddCustomer) {
            btnAddCustomer.onclick = () => {
                inputId.value = "";
                lblFormTitle.textContent = "REGISTRAR NUEVO CLIENTE";
                inputName.value = "";
                inputPhone.value = "";
                inputEmail.value = "";
                inputAddress.value = "";
                formNewCust.style.display = 'block';
                inputName.focus();
            };
        }

        // Open Edit
        if (btnEditCust) {
            btnEditCust.onclick = () => {
                const custId = selectCust.value;
                if (!custId) return Toast.show("Seleccione un cliente para editar", "error");

                const opt = selectCust.options[selectCust.selectedIndex];
                const text = opt.text;

                inputId.value = custId;
                lblFormTitle.textContent = "EDITAR CLIENTE";
                inputName.value = text.split(' (')[0].trim();
                // Try to set address from dataset
                inputAddress.value = opt.dataset.address || "";
                inputPhone.value = ""; // Missing unless we store it
                inputEmail.value = "";

                formNewCust.style.display = 'block';
                inputName.focus();
            };
        }

        // Delete
        if (btnDelCust) {
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
        }

        // Cancel
        if (btnCancelCust) {
            btnCancelCust.onclick = () => {
                formNewCust.style.display = 'none';
            };
        }

        // Save
        if (btnSaveCust) {
            btnSaveCust.onclick = async () => {
                const name = inputName.value.trim();
                const phone = inputPhone.value.trim();
                const email = inputEmail.value.trim();
                const address = inputAddress.value.trim();
                const id = inputId.value;

                if (!name) return alert("El nombre es obligatorio");

                try {
                    if (id) {
                        await SalesService.updateCustomer(id, { name, phone, email, address });
                        Toast.show(`Cliente actualizado`, "success");
                    } else {
                        await SalesService.registerCustomer({ name, phone, email, address });
                        Toast.show(`Cliente creado`, "success");
                    }

                    inputName.value = '';
                    inputPhone.value = '';
                    inputEmail.value = '';
                    inputAddress.value = '';
                    inputId.value = '';
                    formNewCust.style.display = 'none';

                    loadSales(filterDate.value);
                } catch (err) {
                    console.error("Error saving customer:", err);
                    alert("Error: " + err.message); // Using alert as requested/used in context
                }
            };
        }
    }
