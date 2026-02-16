import { FinancesService } from './finances.service.js';
import { FinancesView } from './finances.view.js';
import { ReportGenerator } from './report-generator.js';
import { Toast } from '../../ui/toast.js';
import { getGlobalRates } from '../settings/settings.service.js';

let currentData = { capitalList: [], expensesList: [], totalCapital: 0, totalExpenses: 0, balance: 0 };
let currentRates = { tasa_usd_ves: 1 };
const reportGen = new ReportGenerator();

export async function loadFinances() {
    const container = document.getElementById('app-content');

    // Initial Load Rates
    try {
        currentRates = await getGlobalRates();
    } catch (e) {
        console.error("Error loading rates", e);
    }

    // Render Shell
    FinancesView.renderLayout(container, currentRates);

    // Initial Load Data
    await refreshData();

    // Bindings
    bindEvents();
}

async function refreshData() {
    try {
        const startDate = document.getElementById('filter-date-start')?.value;
        const endDate = document.getElementById('filter-date-end')?.value;

        currentData = await FinancesService.getBalanceSheet(startDate, endDate);
        updateDashboard(currentData);
        FinancesView.renderLists(currentData.expensesList, currentData.capitalList);
    } catch (err) {
        console.error("Error fetching finance data:", err);
        Toast.show("Error actualizando datos financieros", "error");
    }
}

function updateDashboard(data) {
    document.getElementById('summary-capital').innerText = `$${data.totalCapital.toFixed(2)}`;
    // document.getElementById('summary-sales').innerText = `$${(data.totalSalesRevenue || 0).toFixed(2)}`;
    document.getElementById('summary-expenses').innerText = `$${data.totalExpenses.toFixed(2)}`;

    const bal = data.balance;
    const balEl = document.getElementById('summary-balance');
    balEl.innerText = `$${bal.toFixed(2)}`;
    balEl.style.color = bal < 0 ? '#ef4444' : '#2563eb'; // Red if negative
}

function bindEvents() {
    initInvoiceForm();
    initCapitalForm();
    initTabs();
    initReportBtn();
    initFilters();
}

function initFilters() {
    const btnFilter = document.getElementById('btn-apply-filter');
    if (btnFilter) {
        btnFilter.onclick = () => {
            refreshData();
        };
    }
}

function initInvoiceForm() {
    const btnAddItem = document.getElementById('btn-add-item');
    const container = document.getElementById('invoice-items-container');
    const totalDisplay = document.getElementById('inv-total-display');
    const convertedDisplay = document.getElementById('inv-total-converted');
    const currencySelect = document.getElementById('inv-currency');
    const rateHint = document.getElementById('inv-rate-hint');
    const btnSave = document.getElementById('btn-save-expense');

    // Add first row
    FinancesView.addItemRow();

    // Calc Logic
    const calculateTotal = () => {
        let total = 0;
        document.querySelectorAll('.inv-item-row').forEach(row => {
            const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            total += (qty * price);
        });

        const isVES = currencySelect.value === 'VES';
        const rate = currentRates.tasa_usd_ves;
        const symbol = isVES ? 'Bs' : '$';

        totalDisplay.innerText = `${symbol}${total.toFixed(2)}`;

        if (isVES && total > 0) {
            const usdVal = total / rate;
            convertedDisplay.style.display = 'block';
            convertedDisplay.innerText = `Eq. $${usdVal.toFixed(2)}`;
        } else {
            convertedDisplay.style.display = 'none';
        }

        return total;
    };

    // Currency Change
    currencySelect.onchange = () => {
        const isVES = currencySelect.value === 'VES';
        rateHint.style.display = isVES ? 'block' : 'none';
        calculateTotal();

        // Update placeholders potentially?
        document.querySelectorAll('.item-price').forEach(inp => {
            inp.placeholder = isVES ? 'P. Unit (Bs)' : 'P. Unit ($)';
        });
    };

    // Delegation for inputs
    container.addEventListener('input', (e) => {
        if (e.target.classList.contains('item-qty') || e.target.classList.contains('item-price')) {
            calculateTotal();
        }
    });

    // Delegation for remove
    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove-item')) {
            if (document.querySelectorAll('.inv-item-row').length > 1) {
                e.target.closest('.inv-item-row').remove();
                calculateTotal();
            }
        }
    });

    btnAddItem.onclick = () => {
        const row = FinancesView.addItemRow();
        row.querySelector('.item-desc').focus();
    };

    btnSave.onclick = async () => {
        const date = document.getElementById('inv-date').value;
        const provider = document.getElementById('inv-provider').value.trim();
        const invoiceNum = document.getElementById('inv-number').value.trim();
        const rawTotal = calculateTotal();
        const currency = currencySelect.value;
        const rate = currentRates.tasa_usd_ves;

        if (!provider) return Toast.show("Falta el proveedor", "error");
        if (rawTotal <= 0) return Toast.show("El total debe ser mayor a 0", "error");

        const items = [];
        let valid = true;
        document.querySelectorAll('.inv-item-row').forEach(row => {
            const desc = row.querySelector('.item-desc').value.trim();
            const qty = parseFloat(row.querySelector('.item-qty').value);
            const price = parseFloat(row.querySelector('.item-price').value);

            if (!desc) valid = false;

            // Just store raw values here, we note currency later
            items.push({ description: desc, quantity: qty, unit_price: price, total: qty * price });
        });

        if (!valid) return Toast.show("Faltan descripciones en los ítems", "error");

        // Convert to USD for storage if needed
        let finalTotalUSD = rawTotal;
        let invoiceNotes = ""; // We might need a notes field for expense or handle it via Items

        if (currency === 'VES') {
            finalTotalUSD = rawTotal / rate;
            // Append conversion note to first item or handle differently?
            // Let's modify the items description to include (Bs X)
            items.forEach(item => {
                item.description += ` (Bs ${item.unit_price.toFixed(2)})`;
                item.unit_price = item.unit_price / rate; // Store normalized USD
                item.total = item.total / rate;
            });
            // Also append to provider or invoice num?
            // Better: items are now normalised.
        }

        const expenseData = {
            date,
            provider: provider + (currency === 'VES' ? ` (Pagado en Bs: ${rawTotal.toFixed(2)})` : ''),
            invoice_number: invoiceNum,
            total_amount: finalTotalUSD,
            items: items
        };

        if (!confirm(`¿Registrar gasto? Total: $${finalTotalUSD.toFixed(2)}`)) return;

        try {
            await FinancesService.registerExpense(expenseData);
            Toast.show("Gasto registrado correctamente", "success");

            // Clear Form
            document.getElementById('inv-provider').value = "";
            document.getElementById('inv-number').value = "";
            container.innerHTML = "";
            FinancesView.addItemRow();
            calculateTotal();

            refreshData();
        } catch (err) {
            console.error("Error saving expense:", err);
            Toast.show("Error al guardar: " + err.message, "error");
        }
    };
}

function initCapitalForm() {
    const btnSave = document.getElementById('btn-save-capital');
    const currencySelect = document.getElementById('cap-currency');
    const rateHint = document.getElementById('cap-rate-hint');
    const customRateInput = document.getElementById('cap-custom-rate');

    currencySelect.onchange = () => {
        const isVES = currencySelect.value === 'VES';
        rateHint.style.display = isVES ? 'block' : 'none';
        customRateInput.style.display = isVES ? 'block' : 'none'; // Show/Hide Tasa input
        const input = document.getElementById('cap-amount');
        input.placeholder = isVES ? 'Monto (Bs)' : 'Monto ($)';
    };

    btnSave.onclick = async () => {
        const rawAmount = parseFloat(document.getElementById('cap-amount').value);
        const source = document.getElementById('cap-source').value.trim();
        let notes = document.getElementById('cap-notes').value.trim();
        const currency = currencySelect.value;
        const customRate = parseFloat(customRateInput.value) || 0;

        // Priority: Custom Rate > System Rate
        const rate = (customRate > 0) ? customRate : currentRates.tasa_usd_ves;

        if (!rawAmount || rawAmount <= 0) return Toast.show("Monto inválido", "error");
        if (!source) return Toast.show("Indique la fuente del capital", "error");

        let finalAmountUSD = rawAmount;
        if (currency === 'VES') {
            finalAmountUSD = rawAmount / rate;
            notes = `${notes} [Origen: ${rawAmount.toFixed(2)} Bs @ ${rate.toFixed(2)}]`.trim();
        }

        try {
            await FinancesService.addCapitalEntry({
                date: document.getElementById('cap-date').value || new Date().toISOString().split('T')[0],
                amount: finalAmountUSD,
                source,
                notes
            });
            Toast.show("Capital ingresado correctamente", "success");

            // Clear
            document.getElementById('cap-amount').value = "";
            document.getElementById('cap-source').value = "";
            document.getElementById('cap-notes').value = "";
            customRateInput.value = ""; // Clear rate

            refreshData();
        } catch (err) {
            console.error(err);
            Toast.show("Error ingresando capital", "error");
        }
    };

    // --- DELETE HANDLER (Delegation) ---
    document.getElementById('tab-capital').addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-del-cap')) {
            if (!confirm("¿Eliminar este ingreso de capital?")) return;
            try {
                await FinancesService.deleteCapitalEntry(e.target.dataset.id);
                Toast.show("Eliminado", "success");
                refreshData(); // Refresh list/totals
            } catch (error) {
                console.error(error);
                Toast.show("Error eliminando", "error");
            }
        }
    });

    document.getElementById('tab-expenses').addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-del-exp')) {
            if (!confirm("¿Eliminar este gasto?")) return;
            try {
                await FinancesService.deleteExpense(e.target.dataset.id);
                Toast.show("Eliminado", "success");
                refreshData();
            } catch (error) {
                console.error(error);
                Toast.show("Error eliminando", "error");
            }
        }
    });
}

function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            // UI Toggle
            document.querySelectorAll('.tab-btn').forEach(b => {
                b.style.borderBottom = 'none';
                b.style.background = '#f1f5f9';
                b.style.color = '#64748b';
            });
            btn.style.borderBottom = '2px solid #ef4444';
            btn.style.background = 'white';
            btn.style.color = 'black';

            // Content Toggle
            document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
            document.getElementById(btn.dataset.tab).style.display = 'block';
        };
    });
}

function initReportBtn() {
    const btn = document.getElementById('btn-download-report');
    btn.onclick = async () => {
        btn.innerText = "Generando...";
        btn.disabled = true;
        try {
            await reportGen.generateFullReport(currentData);
            Toast.show("PDF generado", "success");
        } catch (err) {
            console.error(err);
            Toast.show("Error generando PDF", "error");
        } finally {
            btn.innerText = "📄 Descargar Reporte PDF";
            btn.disabled = false;
        }
    };
}
