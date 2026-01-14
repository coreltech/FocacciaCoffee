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

async function loadLists() {
    const [assets, expenses] = await Promise.all([
        AdminService.getAssets(),
        AdminService.getExpenses()
    ]);
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

        if (!desc || isNaN(amount)) return alert("Datos incompletos");

        try {
            await AdminService.saveExpense({
                description: desc,
                category: document.getElementById('e-cat').value,
                amount_usd: toUSD(amount, curr)
            });
            alert("✅ Gasto guardado");
            loadLists();
        } catch (e) { alert(e.message); }
    };

    // Debug Actions
    if (APP_CONFIG.IS_DEBUG) {
        const btnWipe = document.getElementById('btn-wipe-db');
        if (btnWipe) btnWipe.onclick = DebugUtils.resetDatabase;
    }
}
