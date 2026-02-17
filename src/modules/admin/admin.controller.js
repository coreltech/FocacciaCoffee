import { AdminService } from './admin.service.js';
import { AdminView } from './admin.view.js';
import { APP_CONFIG } from '../../core/config.js';
import { DebugUtils } from '../../core/debug.utils.js';

export async function loadAdmin() {
    const container = document.getElementById('app-content');

    try {
        const rates = await AdminService.getRates();
        AdminView.renderLayout(container, rates, APP_CONFIG.IS_DEBUG);

        await loadLists();
        bindEvents(rates);

    } catch (err) {
        console.error(err);
        container.innerHTML = `<p class="text-red-500">Error: ${err.message}</p>`;
    }
}

// State
let currentExpenses = [];

async function loadLists() {
    const [assets, expenses] = await Promise.all([
        AdminService.getAssets(),
        AdminService.getExpenses()
    ]);
    currentExpenses = expenses;
    AdminView.renderAssets(assets);
    AdminView.renderExpenses(expenses);
}

function bindEvents(rates) {
    // Tabs
    const tabs = {
        'tab-assets': 'panel-assets',
        'tab-expenses': 'panel-expenses',
        'tab-debug': 'panel-debug'
    };

    Object.keys(tabs).forEach(tabId => {
        const btn = document.getElementById(tabId);
        btn.onclick = () => {
            if (tabId === 'tab-debug' && !APP_CONFIG.IS_DEBUG) return; // Prevent click if disabled

            // Toggle Active Classes
            Object.keys(tabs).forEach(t => document.getElementById(t).classList.remove('active'));
            Object.values(tabs).forEach(p => document.getElementById(p).style.display = 'none');

            btn.classList.add('active');
            document.getElementById(tabs[tabId]).style.display = 'block';
        };
    });

    // Helper for currency conversion
    const toUSD = (amt, curr) => {
        if (curr === 'USD') return amt;
        if (curr === 'VES') return amt / rates.tasa_usd_ves;
        return amt; // Simplification
    };

    // Save Asset
    document.getElementById('btn-save-asset').onclick = async () => {
        const name = document.getElementById('a-name').value;
        const cost = parseFloat(document.getElementById('a-cost').value);
        const curr = document.getElementById('a-currency').value;

        if (!name || isNaN(cost)) return alert("Datos incompletos");

        try {
            await AdminService.saveAsset({
                name,
                cost_usd: toUSD(cost, curr)
            });
            alert("✅ Equipo guardado");
            loadLists();
        } catch (e) { alert(e.message); }
    };

    // Save Expense
    document.getElementById('btn-save-expense').onclick = async () => {
        const desc = document.getElementById('e-desc').value;
        const amount = parseFloat(document.getElementById('e-amount').value);
        const curr = document.getElementById('e-currency').value;
        const date = document.getElementById('e-date').value;

        if (!desc || isNaN(amount) || !date) return alert("Datos incompletos");

        try {
            await AdminService.saveExpense({
                description: desc,
                category: document.getElementById('e-cat').value,
                amount_usd: toUSD(amount, curr),
                expense_date: date
            });
            alert("✅ Gasto guardado");
            // Clear form
            document.getElementById('e-desc').value = '';
            document.getElementById('e-amount').value = '';
            loadLists();
        } catch (e) { alert(e.message); }
    };

    // Filter & Search Logic
    const filterExpenses = () => {
        const term = document.getElementById('search-expenses').value.toLowerCase();
        const cat = document.getElementById('filter-category').value;

        const filtered = currentExpenses.filter(e => {
            const matchesTerm = (e.description || '').toLowerCase().includes(term);
            const matchesCat = cat === 'all' || e.category === cat;
            return matchesTerm && matchesCat;
        });
        AdminView.renderExpenses(filtered);
    };

    document.getElementById('search-expenses').oninput = filterExpenses;
    document.getElementById('filter-category').onchange = filterExpenses;

    // Delete Expense (Delegation)
    document.getElementById('expenses-list').addEventListener('click', async (e) => {
        const btn = e.target.closest('.btn-delete-expense');
        if (!btn) return;

        if (!confirm("¿Eliminar este gasto?")) return;

        const id = btn.dataset.id;
        try {
            await AdminService.deleteExpense(id);
            loadLists(); // Reload to refresh list and state
        } catch (err) {
            console.error(err);
            alert("Error al eliminar");
        }
    });

    // Debug Actions
    if (APP_CONFIG.IS_DEBUG) {
        const btnWipe = document.getElementById('btn-wipe-db');
        if (btnWipe) btnWipe.onclick = DebugUtils.resetDatabase;
    }
}
