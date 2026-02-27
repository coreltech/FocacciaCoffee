/**
 * Controlador de Ventas y Punto de Venta (Orchestration Layer V2)
 */
import { SalesService } from './sales.service.js';
import { SalesView } from './sales.view.js';
import { Formatter } from '../../core/formatter.js';

let state = {
    catalog: [],
    customers: [],
    history: [],
    cart: [],
    rates: { tasa_usd_ves: 1 },
    activeTab: 'pos-direct'
};

export async function loadSales() {
    const container = document.getElementById('app-workspace');
    if (!container) return;

    SalesView.render(container);
    await refreshData();
    bindEvents(container);
}

async function refreshData() {
    try {
        const data = await SalesService.getDailyData();
        const history = await SalesService.getSalesHistory();

        state.catalog = data.catalog || [];
        state.customers = data.customers || [];
        // Mantener tasas previas si las nuevas son nulas
        if (data.rates) {
            state.rates = data.rates;
        }
        state.history = history || [];

        SalesView.renderProducts(state.catalog);
        SalesView.renderCart(state.cart, state.rates);
        SalesView.populateSelects(state.customers, state.catalog);
        SalesView.renderHistory(state.history, handleDeleteOrder);

        // RE-VINCULAR CLICK EN CARDS TRAS RE-RENDER
        bindProductCards();
    } catch (err) {
        console.error("Error refreshing sales data:", err);
    }
}

function bindEvents(container) {
    // 1. Manejo de Tabs
    document.querySelectorAll('.pos-tab').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.pos-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const target = tab.dataset.tab;
            document.getElementById(`tab-${target}`).classList.add('active');
            state.activeTab = target;
        };
    });

    // 2. Búsqueda de Productos
    const searchInput = document.getElementById('pos-search');
    if (searchInput) {
        searchInput.oninput = () => {
            const query = searchInput.value.toLowerCase();
            const filtered = state.catalog.filter(p => p.name.toLowerCase().includes(query));
            SalesView.renderProducts(filtered);
            bindProductCards(); // Re-vincular cards filtradas
        };
    }

    // 3. Eventos del Carrito (Delegación)
    const cartList = document.getElementById('pos-cart-list');
    if (cartList) {
        cartList.onclick = (e) => {
            const btn = e.target.closest('.btn-qty-sm'); // Actualizado a clase compacta
            if (!btn) return;

            const idx = parseInt(btn.dataset.idx);
            const action = btn.dataset.action;

            if (action === 'plus') {
                state.cart[idx].qty++;
                state.cart[idx].total = state.cart[idx].qty * state.cart[idx].price;
            } else {
                state.cart[idx].qty--;
                if (state.cart[idx].qty <= 0) {
                    state.cart.splice(idx, 1);
                } else {
                    state.cart[idx].total = state.cart[idx].qty * state.cart[idx].price;
                }
            }
            SalesView.renderCart(state.cart, state.rates);
        };

        // Escuchar cambios en el tipo de orden/entrega (Delegado)
        cartList.onchange = (e) => {
            if (e.target.id === 'pos-order-type') {
                const dateContainer = document.getElementById('pos-delivery-date-container');
                if (dateContainer) {
                    dateContainer.style.display = (e.target.value === 'encargo') ? 'block' : 'none';
                }
            } else if (e.target.id === 'pos-fulfillment') {
                const addrContainer = document.getElementById('pos-delivery-address-container');
                if (addrContainer) {
                    addrContainer.style.display = (e.target.value === 'delivery') ? 'block' : 'none';
                    // Auto-fill address if customer selected has one
                    if (e.target.value === 'delivery' && state.customers) {
                        const custId = document.getElementById('pos-customer-id').value;
                        if (custId) {
                            const c = state.customers.find(x => x.id == custId);
                            if (c && c.address) {
                                document.getElementById('pos-delivery-address').value = c.address;
                            }
                        }
                    }
                }
            }
        };
    }

    document.getElementById('btn-clear-cart').onclick = () => {
        if (confirm('¿Vaciar carrito?')) {
            state.cart = [];
            SalesView.renderCart(state.cart, state.rates);
        }
    };

    // 4. Pagos
    document.getElementById('btn-add-payment').onclick = () => SalesView.addPaymentRow(state.rates);
    // Primera fila por defecto
    if (document.getElementById('pos-payments').children.length === 0) {
        SalesView.addPaymentRow(state.rates);
    }

    // 5. Procesar Venta
    document.getElementById('btn-process-sale').onclick = processSale;

    // 6. Formulario Histórico
    const formHist = document.getElementById('form-historical-sales');
    if (formHist) {
        formHist.onsubmit = async (e) => {
            e.preventDefault();
            const prodId = document.getElementById('sale-catalog-id').value;
            const qty = parseFloat(document.getElementById('sale-qty').value);
            const total = parseFloat(document.getElementById('sale-total').value);
            const dateStr = document.getElementById('sale-date').value;

            // Para histórico, forzamos formato YYYY-MM-DD 12:00:00 para evitar salto UTC en BD
            const finalDate = `${dateStr} 12:00:00`;

            const res = await SalesService.createHistoricalOrder({ productId: prodId, quantity: qty, totalPrice: total, saleDate: finalDate });
            if (res.success) {
                alert('✅ Venta histórica registrada.');
                formHist.reset();
                await refreshData();
            } else {
                alert(`❌ Error: ${res.error}`);
            }
        };
    }

    // 7. Modal de Cliente Rápido
    const btnQuickCust = document.getElementById('btn-quick-add-customer');
    if (btnQuickCust) {
        btnQuickCust.onclick = () => {
            const qModal = document.getElementById('modal-quick-customer');
            const qForm = document.getElementById('form-quick-customer');
            if (qForm) qForm.reset();
            if (qModal) {
                qModal.classList.add('active');
                const input = document.getElementById('q-cust-name');
                if (input) setTimeout(() => input.focus(), 100);
            }
        };
    }

    // El submit del modal sí lo manejamos con id directo del form para evitar duplicados
    const qForm = document.getElementById('form-quick-customer');
    if (qForm) {
        qForm.onsubmit = async (e) => {
            e.preventDefault();
            const qModal = document.getElementById('modal-quick-customer');
            const name = document.getElementById('q-cust-name').value;
            const phone = document.getElementById('q-cust-phone').value;

            const res = await SalesService.createCustomer({ name, phone });
            if (res.success) {
                if (qModal) qModal.classList.remove('active');
                await refreshData();
                const sel = document.getElementById('pos-customer-id');
                if (sel) sel.value = res.data.id;
            } else {
                alert('Error: ' + res.error);
            }
        };
    }

    bindProductCards();
}

function bindProductCards() {
    document.querySelectorAll('.product-card').forEach(card => {
        card.onclick = () => {
            const id = card.dataset.id;
            const prod = state.catalog.find(p => p.id === id);
            addToCart(prod);
        };
    });
}

function addToCart(product) {
    const existing = state.cart.find(item => item.id === product.id);
    if (existing) {
        existing.qty++;
        existing.total = existing.qty * existing.price;
    } else {
        state.cart.push({
            id: product.id,
            name: product.name,
            qty: 1,
            price: product.price,
            total: product.price
        });
    }
    SalesView.renderCart(state.cart, state.rates);
}

async function processSale() {
    const btn = document.getElementById('btn-process-sale');
    if (!btn || btn.disabled) return;

    try {
        const totalUSD = state.cart.reduce((acc, curr) => acc + (curr.total || 0), 0);

        // Recolectar pagos
        const payments = [];
        let totalPaidUSD = 0;
        document.querySelectorAll('.payment-row').forEach(row => {
            const amtInput = row.querySelector('.pay-amount');
            const methInput = row.querySelector('.pay-method');
            if (!amtInput || !methInput) return;

            const amt = parseFloat(amtInput.value || 0);
            const meth = methInput.value;
            if (amt > 0) {
                let usdVal = amt;
                const tasa = state.rates.tasa_usd_ves || state.rates.usd_to_ves || 1;
                if (meth.includes('Bs')) usdVal = amt / tasa;
                totalPaidUSD += usdVal;
                payments.push({ method: meth, amount: amt, usd: usdVal });
            }
        });

        const customerId = document.getElementById('pos-customer-id').value;
        const orderType = document.getElementById('pos-order-type')?.value || 'directa';
        const fulfillment = document.getElementById('pos-fulfillment')?.value || 'pickup';
        const saleDateStr = document.getElementById('pos-sale-date')?.value;
        const deliveryDate = document.getElementById('pos-delivery-date')?.value;
        const deliveryAddress = document.getElementById('pos-delivery-address')?.value || '';

        // Lógica de fecha robusta
        let finalSaleDate;
        const todayStr = new Date().toLocaleDateString('en-CA');
        if (saleDateStr === todayStr || !saleDateStr) {
            finalSaleDate = new Date().toISOString();
        } else {
            finalSaleDate = `${saleDateStr} 12:00:00`;
        }

        const balance = totalUSD - totalPaidUSD;
        const status = (balance <= 0.0005) ? 'Pagado' : 'Pendiente';

        if (status === 'Pendiente' && !customerId) {
            alert('⚠️ Para ventas a crédito (deuda), debes seleccionar un cliente.');
            return;
        }

        if (orderType === 'encargo' && !deliveryDate) {
            alert('⚠️ Por favor selecciona una fecha de entrega para el encargo.');
            return;
        }

        if (!confirm(`¿Confirmar ${orderType === 'encargo' ? 'ENCARGO' : 'VENTA'} (${fulfillment}) por ${Formatter.formatCurrency(totalUSD)}?`)) return;

        btn.disabled = true;
        btn.innerText = 'PROCESANDO...';

        const saleData = {
            items: state.cart,
            payment: {
                methods: payments,
                totalPaidUSD,
                status,
                balance,
                totalCartUSD: totalUSD
            },
            customer: customerId ? { id: customerId, name: document.getElementById('pos-customer-id').options[document.getElementById('pos-customer-id').selectedIndex].text } : null,
            saleDate: finalSaleDate,
            deliveryDate: orderType === 'encargo' ? deliveryDate : null,
            isPreorder: orderType === 'encargo',
            metadata: { fulfillment, deliveryAddress }
        };

        const res = await SalesService.registerSale(saleData);
        if (res.success) {
            alert('✅ Venta procesada exitosamente.');
            state.cart = [];
            await refreshData();
            // Limpiar pagos
            const payBox = document.getElementById('pos-payments');
            if (payBox) {
                payBox.innerHTML = '';
                SalesView.addPaymentRow(state.rates);
            }
        } else {
            alert(`❌ Error al procesar venta: ${res.error}`);
            btn.disabled = false;
            btn.innerText = '🚀 PROCESAR VENTA';
        }

    } catch (err) {
        console.error("Critical error in processSale:", err);
        alert("Ocurrió un error inesperado al procesar la venta.");
        btn.disabled = false;
        btn.innerText = '🚀 PROCESAR VENTA';
    } finally {
        // Solo rehabilitar si el carrito no se vació (si se vació, refreshData ya lo deshabilitó)
        if (state.cart.length > 0) {
            btn.disabled = false;
            btn.innerText = '🚀 PROCESAR VENTA';
        }
    }
}

async function handleDeleteOrder(id) {
    if (confirm('¿Eliminar este registro del historial?')) {
        const res = await SalesService.deleteOrder(id);
        if (res.success) await refreshData();
    }
}
