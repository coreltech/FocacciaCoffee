import { SalesService } from './sales.service.js';
import { SalesView } from './sales.view.v2.js';
import { Toast } from '../../ui/toast.js';
import { getCurrentRole, getCurrentUserId, getCurrentUserName } from '../../core/supabase.js';

let cart = [];
let currentRates = { tasa_usd_ves: 0, tasa_eur_ves: 0 };
let salesSubscription = null;
let viewMode = 'sales'; // 'sales', 'delivery_date', 'receivables'
let currentPage = 0;
const PAGE_SIZE = 50;

export async function loadSales(startDate = new Date().toISOString().split('T')[0], endDate = null, append = false) {
    const container = document.getElementById('app-content');

    // Check Role
    const role = getCurrentRole();
    const isVendor = role === 'vendedor';

    if (!append) {
        currentPage = 0;
    }

    if (isVendor) {
        // Enforce today if vendor, or respect passed date if we decide to allow it later, 
        // but for now strict today for safety or keep passed args if logic sends them.
        // Let's rely on args but maybe default empty ones to today.
        if (!startDate) startDate = new Date().toISOString().split('T')[0];
    }

    // 1. Load Data
    try {
        if (viewMode === 'receivables') {
            await loadReceivables(append, startDate, endDate);
            return;
        }

        const data = await SalesService.getData(startDate, endDate, currentPage, PAGE_SIZE, viewMode);
        currentRates = data.rates;

        // 2. Render Layout (Only if it's the first load, otherwise we just append)
        if (!append) {
            SalesView.renderLayout(container, startDate, endDate, data.rates);
            SalesView.populateCatalog(data.catalog);
            SalesView.populateCustomers(data.customers);
            SalesView.renderCart(cart, data.rates);

            // Apply Restrictions
            if (isVendor) {
                SalesView.applyVendorRestrictions();
            }

            // Set Date Inputs
            const startInput = document.getElementById('filter-date-start');
            if (startInput) startInput.value = startDate;

            const endInput = document.getElementById('filter-date-end');
            if (endInput) endInput.value = endDate || startDate;
        }

        // 3. Render History & Summary
        renderHistoryAndSummary(data.sales, data.dailyStats, append, data.totalCount);

        // 4. Bind Events (Only on initial load)
        if (!append) {
            bindEvents(data.rates);
            setupRealtime(startDate);

            // Set Active Tab
            updateTabState();

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

async function loadReceivables(append = false, startDate = null, endDate = null) {
    const container = document.getElementById('app-content');

    // Default to today if not provided, or keep existing logic logic
    if (!startDate) startDate = new Date().toISOString().split('T')[0];

    try {
        if (!append) {
            // We need rates/catalog/customers even in receivables for the form (if we keep form visible)
            // Ideally we should keep the layout and just swap the history part?
            // But existing renderLayout wipes everything.
            // To avoid flickering, we should probably stick to renderLayout but changing the "History" part.
            // Let's re-use getData but maybe we need a separate "Initial Load" for receivables?
            const rates = await SalesService.getGlobalRates || ((await SalesService.getData(new Date().toISOString().split('T')[0])).rates); // Hacky fallback
            // Better: Just fetch rates + Receivables
            const [r, c, cust, rec] = await Promise.all([
                SalesService.getData(startDate, null, 0, 1), // Fetch with relevant date to get rates? actually rates are global usually
                Promise.resolve([]), // Catalog?
                SalesService.getData(startDate).then(d => d.customers),
                SalesService.getReceivables(currentPage, PAGE_SIZE, startDate, endDate)
            ]);

            SalesView.renderLayout(container, startDate, endDate, r.rates);
            SalesView.populateCatalog(r.catalog);
            SalesView.populateCustomers(cust);
            SalesView.renderCart(cart, r.rates);
        }

        const data = await SalesService.getReceivables(currentPage, PAGE_SIZE, startDate, endDate);
        // Render Receivables specific view with rates
        // Ensure currentRates is populated if we came straight to receivables
        if (!currentRates.tasa_usd_ves && !append) {
            const { rates } = await SalesService.getData(new Date().toISOString().split('T')[0], null, 0, 1);
            currentRates = rates;
        }
        SalesView.renderReceivables(data.sales, data.totalCount, currentRates);

        if (!append) {
            bindEvents(currentRates || { tasa_usd_ves: 0 }); // We might miss rates if we didn't store them
            updateTabState();
        }

        // Pagination logic for receivables? 
        const displayedCount = (currentPage + 1) * PAGE_SIZE;
        SalesView.toggleLoadMore(data.totalCount > displayedCount);
        bindDynamicEvents();

    } catch (err) {
        console.error("Error loading receivables:", err);
        container.innerHTML = `<p style="color:red">Error cargando Cuentas por Cobrar: ${err.message}</p>`;
    }
}

function updateTabState() {
    const btnCatalog = document.getElementById('btn-view-catalog');
    const btnSales = document.getElementById('btn-view-sales');
    const btnRec = document.getElementById('btn-view-receivables');
    const btnRes = document.getElementById('btn-view-reservations');

    // Reset all
    [btnCatalog, btnSales, btnRec, btnRes].forEach(btn => {
        if (btn) {
            btn.classList.remove('active');
            btn.style.background = '#f1f5f9';
            btn.style.color = '#64748b';
        }
    });

    if (viewMode === 'receivables') {
        if (btnRec) {
            btnRec.classList.add('active');
            btnRec.style.background = '#2563eb';
            btnRec.style.color = 'white';
        }
    } else if (viewMode === 'sale_date') {
        if (btnSales) {
            btnSales.classList.add('active');
            btnSales.style.background = '#2563eb';
            btnSales.style.color = 'white';
        }
    } else if (viewMode === 'reservations') {
        if (btnRes) {
            btnRes.classList.add('active');
            btnRes.style.background = '#2563eb';
            btnRes.style.color = 'white';
        }
    } else {
        // Default SALES (Catalog)
        if (btnCatalog) {
            btnCatalog.classList.add('active');
            btnCatalog.style.background = '#2563eb';
            btnCatalog.style.color = 'white';
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
    // 1. Delete Sale
    document.querySelectorAll('.btn-delete-sale').forEach(btn => {
        btn.onclick = async () => {
            if (confirm("¿Eliminar registro?")) {
                await SalesService.deleteSale(btn.dataset.id);
                if (viewMode === 'receivables') {
                    loadReceivables();
                } else {
                    const start = document.getElementById('filter-date-start').value;
                    const end = document.getElementById('filter-date-end').value;
                    loadSales(start, end);
                }
            }
        };
    });

    // 2. Confirm Payment
    document.querySelectorAll('.btn-confirm-pay').forEach(btn => {
        btn.onclick = async () => {
            const amt = parseFloat(btn.dataset.amount);
            if (!confirm(`¿Registrar cobro de $${amt.toFixed(2)}?`)) return;
            await SalesService.confirmPendingPayment(btn.dataset.id, amt);

            if (viewMode === 'receivables') {
                loadReceivables();
            } else {
                const start = document.getElementById('filter-date-start').value;
                const end = document.getElementById('filter-date-end').value;
                loadSales(start, end);
            }
        };
    });

    // 3. Cart Actions
    document.querySelectorAll('.cart-remove-btn').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.dataset.index);
            cart.splice(idx, 1);
            SalesView.renderCart(cart, currentRates);
            bindDynamicEvents();
        };
    });

    document.querySelectorAll('.btn-plus').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.dataset.idx);
            cart[idx].quantity++;
            cart[idx].total_amount = cart[idx].quantity * cart[idx].price;
            SalesView.renderCart(cart, currentRates);
            bindDynamicEvents();
        };
    });

    document.querySelectorAll('.btn-minus').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.dataset.idx);
            if (cart[idx].quantity > 1) {
                cart[idx].quantity--;
                cart[idx].total_amount = cart[idx].quantity * cart[idx].price;
                SalesView.renderCart(cart, currentRates);
                bindDynamicEvents();
            }
        };
    });

    // 4. Partial Payment
    document.querySelectorAll('.input-partial-pay').forEach(inp => {
        inp.oninput = (e) => {
            const val = parseFloat(e.target.value) || 0;
            const rate = parseFloat(e.target.dataset.rate) || 0;
            const vesDisplay = document.getElementById(`calc-${e.target.dataset.id}`);
            if (vesDisplay) vesDisplay.textContent = (val * rate).toFixed(2) + ' Bs';
        };
    });

    document.querySelectorAll('.btn-register-partial').forEach(btn => {
        btn.onclick = async () => {
            const id = btn.dataset.id;
            const input = document.querySelector(`.input-partial-pay[data-id="${id}"]`);
            const amountVal = parseFloat(input.value);

            if (!amountVal || amountVal <= 0) return alert("Ingrese un monto válido");
            if (!confirm(`¿Registrar abono de $${amountVal.toFixed(2)}?`)) return;

            try {
                btn.disabled = true;
                btn.textContent = "...";
                await SalesService.registerPartialPayment(id, amountVal, currentRates.tasa_usd_ves);
                alert("✅ Abono registrado");
                loadReceivables();
            } catch (e) {
                console.error(e);
                alert("Error: " + e.message);
                btn.disabled = false;
                btn.textContent = "Registrar";
            }
        };
    });
}

function setupRealtime(selectedDate) {
    if (salesSubscription) {
        salesSubscription.unsubscribe();
    }
    salesSubscription = SalesService.subscribeToSales((payload) => {
        console.log("Realtime update received:", payload);
        const start = document.getElementById('filter-date-start')?.value;
        const end = document.getElementById('filter-date-end')?.value;
        if (start && viewMode !== 'receivables') {
            // Reload with current filters
            loadSales(start, end);
        } else if (viewMode === 'receivables') {
            loadReceivables();
        }
    });
}

function bindEvents(rates) {
    const btnSubmitSale = document.getElementById('btn-submit-sale');
    const addPayBtn = document.getElementById('btn-add-pay-method');

    // Manual Entry Logic
    const btnToggleManual = document.getElementById('btn-toggle-manual');
    const manualBox = document.getElementById('manual-entry-box');
    const btnAddManual = document.getElementById('btn-add-manual');

    if (btnToggleManual) {
        btnToggleManual.onclick = () => {
            const isVisible = manualBox.style.display === 'block';
            manualBox.style.display = isVisible ? 'none' : 'block';
            if (!isVisible) document.getElementById('manual-desc').focus();
        };
    }

    if (btnAddManual) {
        btnAddManual.onclick = () => {
            const desc = document.getElementById('manual-desc').value.trim();
            const price = parseFloat(document.getElementById('manual-price').value);

            if (!desc || !price || price <= 0) return Toast.show("Datos inválidos", "error");

            cart.push({
                product_id: null,
                product_name: desc,
                quantity: 1,
                price: price,
                total_amount: price,
                delivery_date: document.getElementById('v-delivery-date')?.value || null
            });

            Toast.show("Item manual agregado", "success");
            SalesView.renderCart(cart, currentRates);
            bindDynamicEvents();

            // Clear inputs
            document.getElementById('manual-desc').value = '';
            document.getElementById('manual-price').value = '';
            manualBox.style.display = 'none';
        };
    }

    // New Grid Interaction
    const appContent = document.getElementById('app-content');
    appContent.addEventListener('add-product', (e) => {
        const product = e.detail;
        const existing = cart.find(i => i.product_id === product.id);

        if (existing) {
            existing.quantity++;
            existing.total_amount = existing.quantity * existing.price;
            Toast.show(`+1 ${product.product_name}`, "success");
        } else {
            cart.push({
                product_id: product.id,
                product_name: product.product_name,
                quantity: 1,
                price: product.precio_venta_final,
                total_amount: product.precio_venta_final,
                delivery_date: document.getElementById('v-delivery-date')?.value || null
            });
            Toast.show("Agregado al carrito", "success");
        }
        SalesView.renderCart(cart, currentRates);
        bindDynamicEvents();
    });

    // Category Filter Pills
    document.querySelectorAll('.cat-pill').forEach(pill => {
        pill.onclick = () => {
            document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');

            const cat = pill.dataset.cat;
            if (cat === 'all') {
                SalesView.populateCatalog(SalesView.fullCatalog);
            } else {
                const filtered = SalesView.fullCatalog.filter(p => {
                    const name = p.product_name.toLowerCase();
                    if (cat === 'focaccia') return name.includes('focaccia') || name.includes('pizza') || name.includes('pan');
                    if (cat === 'drinks') return name.includes('coca') || name.includes('bebida') || name.includes('agua') || name.includes('cafe');
                    if (cat === 'dessert') return name.includes('tiramisu') || name.includes('postre') || name.includes('dulce');
                    return false;
                });
                SalesView._renderGridItems(filtered);
            }
        };
    });

    // Dynamic Category Generation (Quick Fix)
    const catContainer = document.getElementById('category-pills');
    if (catContainer && catContainer.children.length === 1) {
        catContainer.innerHTML += `
            <div class="cat-pill" data-cat="focaccia">🍕 Focaccias</div>
            <div class="cat-pill" data-cat="drinks">🥤 Bebidas/Café</div>
            <div class="cat-pill" data-cat="dessert">🍰 Postres</div>
        `;
        document.querySelectorAll('.cat-pill').forEach(pill => {
            pill.onclick = () => {
                document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                const cat = pill.dataset.cat;
                const all = SalesView.fullCatalog || [];

                if (cat === 'all') SalesView._renderGridItems(all);
                else {
                    const filtered = all.filter(p => {
                        const name = p.product_name.toLowerCase();
                        if (cat === 'focaccia') return name.includes('focaccia') || name.includes('pizza') || name.includes('pan');
                        if (cat === 'drinks') return name.includes('coca') || name.includes('pepsi') || name.includes('agua') || name.includes('cafe') || name.includes('latte');
                        if (cat === 'dessert') return name.includes('tiramisu') || name.includes('torta') || name.includes('dulce') || name.includes('cookie');
                        return false;
                    });
                    SalesView._renderGridItems(filtered);
                }
            };
        });
    }

    // Filters Toggle
    const btnToggleFilters = document.getElementById('btn-toggle-filters');
    if (btnToggleFilters) {
        btnToggleFilters.onclick = () => {
            const drawer = document.getElementById('filters-drawer');
            drawer.style.display = (drawer.style.display === 'none') ? 'block' : 'none';
        }
    }

    const filterStart = document.getElementById('filter-date-start');
    const filterEnd = document.getElementById('filter-date-end');
    const btnRefresh = document.getElementById('btn-refresh-sales');

    if (btnRefresh) {
        btnRefresh.onclick = () => {
            currentPage = 0;
            loadSales(filterStart.value, filterEnd.value);
        }
    }

    if (addPayBtn) {
        addPayBtn.onclick = () => {
            const row = SalesView.addPaymentRow();
            bindPayInputs();
        };
    }

    bindPayInputs();

    if (btnSubmitSale) {
        btnSubmitSale.onclick = handleSubmitSale;
    }

    const btnViewReservations = document.getElementById('btn-view-reservations');
    if (btnViewReservations) {
        btnViewReservations.onclick = async () => {
            document.getElementById('products-grid').style.display = 'none';
            document.getElementById('category-pills').style.display = 'none';
            document.getElementById('sales-history-container').style.display = 'block';
            document.getElementById('catalog-search').style.display = 'none';

            viewMode = 'reservations';
            updateTabState();

            document.getElementById('sales-history-container').innerHTML = '<p style="text-align:center; padding:20px; color:#64748b;">Cargando reservas...</p>';
            try {
                const data = await SalesService.getUpcomingReservations();
                SalesView.renderReservationsList(data);
            } catch (e) {
                console.error(e);
                document.getElementById('sales-history-container').innerHTML = `<p style="color:red; text-align:center;">Error: ${e.message}</p>`;
            }
        };
    }
    if (document.getElementById('btn-close-res-modal')) {
        document.getElementById('btn-close-res-modal').onclick = () => {
            document.getElementById('reservations-modal').style.display = 'none';
        };
    }

    // Tabs
    const btnViewCatalog = document.getElementById('btn-view-catalog');
    const btnViewSales = document.getElementById('btn-view-sales');
    const btnViewReceivables = document.getElementById('btn-view-receivables');

    if (btnViewCatalog) {
        btnViewCatalog.onclick = () => {
            document.getElementById('products-grid').style.display = 'grid';
            document.getElementById('category-pills').style.display = 'flex';
            document.getElementById('sales-history-container').style.display = 'none';
            document.getElementById('catalog-search').style.display = 'block';

            viewMode = 'sales';
            updateTabState();
        };
    }

    if (btnViewSales) {
        btnViewSales.onclick = () => {
            document.getElementById('products-grid').style.display = 'none';
            document.getElementById('category-pills').style.display = 'none';
            document.getElementById('sales-history-container').style.display = 'block';
            document.getElementById('catalog-search').style.display = 'none';

            viewMode = 'sale_date';
            updateTabState();
            const s = document.getElementById('filter-date-start')?.value;
            const e = document.getElementById('filter-date-end')?.value;
            loadSales(s, e);
        };
    }

    if (btnViewReceivables) {
        btnViewReceivables.onclick = () => {
            document.getElementById('products-grid').style.display = 'none';
            document.getElementById('category-pills').style.display = 'none';
            document.getElementById('sales-history-container').style.display = 'block';
            document.getElementById('catalog-search').style.display = 'none';

            viewMode = 'receivables';
            updateTabState();
            const s = document.getElementById('filter-date-start')?.value;
            const e = document.getElementById('filter-date-end')?.value;
            loadSales(s, e);
        };
    }

    initCustomerManagement();
}

const updatePaymentCalc = () => {
    let paidUsd = 0;
    document.querySelectorAll('.pay-row').forEach(row => {
        const val = parseFloat(row.querySelector('.p-amt').value) || 0;
        const meth = row.querySelector('.p-meth').value;
        if (meth.includes('Bs')) {
            paidUsd += val / currentRates.tasa_usd_ves;
        } else if (meth.includes('EUR')) {
            paidUsd += (val * currentRates.tasa_eur_ves) / currentRates.tasa_usd_ves;
        } else {
            paidUsd += val;
        }
    });
    return paidUsd;
};

const bindPayInputs = () => {
    document.querySelectorAll('.p-amt').forEach(inp => inp.oninput = updatePaymentCalc);
    document.querySelectorAll('.btn-rm-pay-row').forEach(btn => {
        btn.onclick = (e) => {
            e.target.closest('.pay-row').remove();
            updatePaymentCalc();
        };
    });
};

async function handleSubmitSale() {
    const btnSubmitSale = document.getElementById('btn-submit-sale');
    const custId = document.getElementById('v-customer-id').value;
    const totalCartUSD = cart.reduce((acc, item) => acc + item.total_amount, 0);
    const paidUSD = updatePaymentCalc();
    const balance = totalCartUSD - paidUSD;

    const orderType = document.getElementById('v-order-type').value;
    const deliveryAddress = document.getElementById('v-delivery-address').value.trim();
    const saleDate = document.getElementById('filter-date-start').value;

    if (orderType === 'delivery' && !deliveryAddress) {
        document.getElementById('v-delivery-address').style.display = 'block';
        return Toast.show("⚠️ Falta dirección de entrega", "error");
    }

    if (balance > 0.01 && !custId) return alert("⚠️ Para ventas a crédito, selecciona un CLIENTE.");

    if (!confirm(`¿Procesar venta por $${totalCartUSD.toFixed(2)}?`)) return;

    btnSubmitSale.disabled = true;
    btnSubmitSale.innerText = "Procesando...";

    try {
        const paymentMethods = [];
        document.querySelectorAll('.pay-row').forEach(row => {
            const val = parseFloat(row.querySelector('.p-amt').value) || 0;
            if (val > 0) {
                paymentMethods.push({
                    method: row.querySelector('.p-meth').value,
                    amount: val,
                    currency: row.querySelector('.p-meth').value.includes('Bs') ? 'VES' : 'USD'
                });
            }
        });

        for (const item of cart) {
            const itemTotal = item.total_amount;
            const total = totalCartUSD;
            const ratio = (total > 0) ? (itemTotal / total) : 0;
            const itemPayments = paymentMethods.map(pm => ({
                ...pm,
                amount: pm.amount * ratio
            }));

            await SalesService.registerSale({
                customer_id: custId,
                product_id: item.product_id,
                quantity: item.quantity,
                final_unit_price: item.price,
                sale_date: saleDate,
                payment_methods: itemPayments,
                delivery_address: deliveryAddress,
                order_type: orderType,
                is_website: false,
                manual_desc: item.product_name
            });
        }

        Toast.show("✅ Venta registrada", "success");
        cart = [];
        SalesView.renderCart(cart, currentRates);

        const start = document.getElementById('filter-date-start').value;
        const end = document.getElementById('filter-date-end').value;
        loadSales(start, end);

        document.getElementById('payment-methods-container').innerHTML = '';
        SalesView.addPaymentRow();
        bindPayInputs();

    } catch (err) {
        console.error(err);
        alert("Error: " + err.message);
    } finally {
        btnSubmitSale.disabled = false;
        btnSubmitSale.innerText = "✅ COBRAR";
    }
}

function initCustomerManagement() {
    const formNewCust = document.getElementById('new-customer-form');
    const inputName = document.getElementById('new-cust-name');
    const inputPhone = document.getElementById('new-cust-phone');
    const inputEmail = document.getElementById('new-cust-email');
    const inputAddress = document.getElementById('new-cust-address');
    const inputId = document.getElementById('edit-cust-id');
    const lblFormTitle = document.getElementById('lbl-cust-form-title');

    const btnAddCustomer = document.getElementById('btn-add-customer');
    const btnSaveCust = document.getElementById('btn-save-customer');
    const btnCancelCust = document.getElementById('btn-cancel-customer');
    const btnEditCust = document.getElementById('btn-edit-customer');
    const btnDelCust = document.getElementById('btn-del-customer');
    const selectCust = document.getElementById('v-customer-id');
    const deliveryAddrInput = document.getElementById('v-delivery-address');

    if (selectCust) {
        selectCust.onchange = () => {
            const opt = selectCust.options[selectCust.selectedIndex];
            if (opt.dataset && opt.dataset.address) {
                if (deliveryAddrInput) deliveryAddrInput.value = opt.dataset.address;
            }
        };
    }

    if (!formNewCust) return;

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

    if (btnEditCust) {
        btnEditCust.onclick = () => {
            const custId = selectCust.value;
            if (!custId) return Toast.show("Seleccione un cliente para editar", "error");

            const opt = selectCust.options[selectCust.selectedIndex];
            const text = opt.text;

            inputId.value = custId;
            lblFormTitle.textContent = "EDITAR CLIENTE";
            inputName.value = text.split(' (')[0].trim();
            inputAddress.value = opt.dataset.address || "";
            inputPhone.value = "";
            inputEmail.value = "";

            formNewCust.style.display = 'block';
            inputName.focus();
        };
    }

    if (btnDelCust) {
        btnDelCust.onclick = async () => {
            const custId = selectCust.value;
            if (!custId) return Toast.show("Seleccione un cliente", "error");

            if (!confirm("¿Eliminar este cliente? Se mantendrán sus ventas históricas.")) return;

            try {
                await SalesService.deleteCustomer(custId);
                Toast.show("Cliente eliminado", "success");

                const s = document.getElementById('filter-date-start')?.value;
                const e = document.getElementById('filter-date-end')?.value;
                loadSales(s, e);
            } catch (err) {
                Toast.show("Error eliminando: " + err.message, "error");
            }
        };
    }

    if (btnCancelCust) {
        btnCancelCust.onclick = () => {
            formNewCust.style.display = 'none';
        };
    }

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

                const s = document.getElementById('filter-date-start')?.value;
                const e = document.getElementById('filter-date-end')?.value;
                await loadSales(s, e);
            } catch (err) {
                console.error("Error saving customer:", err);
                alert("Error: " + err.message);
            }
        };
    }
}
