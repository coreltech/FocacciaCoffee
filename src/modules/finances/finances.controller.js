import { FinancesService } from './finances.service.js';
import { FinancesView } from './finances.view.js';
import { ReportGenerator } from './report-generator.js';
import { Toast } from '../../ui/toast.js';

let currentData = { capitalList: [], expensesList: [], totalCapital: 0, totalExpenses: 0, balance: 0 };
const reportGen = new ReportGenerator();

export async function loadFinances() {
    const container = document.getElementById('app-content');

    // Render Shell
    FinancesView.renderLayout(container);

    // Initial Load
    await refreshData();

    // Bindings
    bindEvents();
}

async function refreshData() {
    try {
        currentData = await FinancesService.getBalanceSheet();
        updateDashboard(currentData);
        FinancesView.renderLists(currentData.expensesList, currentData.capitalList);
    } catch (err) {
        console.error("Error fetching finance data:", err);
        Toast.show("Error actualizando datos financieros", "error");
    }
}

function updateDashboard(data) {
    document.getElementById('summary-capital').innerText = `$${data.totalCapital.toFixed(2)}`;
    document.getElementById('summary-expenses').innerText = `$${data.totalExpenses.toFixed(2)}`;
    document.getElementById('summary-balance').innerText = `$${data.balance.toFixed(2)}`;
}

function bindEvents() {
    initInvoiceForm();
    initCapitalForm();
    initTabs();
    initReportBtn();
}

function initInvoiceForm() {
    const btnAddItem = document.getElementById('btn-add-item');
    const container = document.getElementById('invoice-items-container');
    const totalDisplay = document.getElementById('inv-total-display');
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
        totalDisplay.innerText = `$${total.toFixed(2)}`;
        return total;
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
        // focus new desc
        row.querySelector('.item-desc').focus();
    };

    btnSave.onclick = async () => {
        const date = document.getElementById('inv-date').value;
        const provider = document.getElementById('inv-provider').value.trim();
        const invoiceNum = document.getElementById('inv-number').value.trim();
        const total = calculateTotal();

        if (!provider) return Toast.show("Falta el proveedor", "error");
        if (total <= 0) return Toast.show("El total debe ser mayor a 0", "error");

        const items = [];
        let valid = true;
        document.querySelectorAll('.inv-item-row').forEach(row => {
            const desc = row.querySelector('.item-desc').value.trim();
            const qty = parseFloat(row.querySelector('.item-qty').value);
            const price = parseFloat(row.querySelector('.item-price').value);

            if (!desc) valid = false;
            items.push({ description: desc, quantity: qty, unit_price: price, total: qty * price });
        });

        if (!valid) return Toast.show("Faltan descripciones en los ítems", "error");

        const expenseData = {
            date,
            provider,
            invoice_number: invoiceNum,
            total_amount: total,
            items: items
        };

        if (!confirm(`¿Registrar gasto por $${total.toFixed(2)}? Se descontará del capital.`)) return;

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

    btnSave.onclick = async () => {
        const amount = parseFloat(document.getElementById('cap-amount').value);
        const source = document.getElementById('cap-source').value.trim();
        const notes = document.getElementById('cap-notes').value.trim();

        if (!amount || amount <= 0) return Toast.show("Monto inválido", "error");
        if (!source) return Toast.show("Indique la fuente del capital", "error");

        try {
            await FinancesService.addCapitalEntry({
                date: new Date().toISOString().split('T')[0],
                amount,
                source,
                notes
            });
            Toast.show("Capital ingresado correctamente", "success");

            // Clear
            document.getElementById('cap-amount').value = "";
            document.getElementById('cap-source').value = "";
            document.getElementById('cap-notes').value = "";

            refreshData();
        } catch (err) {
            console.error(err);
            Toast.show("Error ingresando capital", "error");
        }
    };
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
