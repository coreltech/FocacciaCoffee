import { SettingsService } from './settings.service.js';
import { SettingsView } from './settings.view.js';

export async function loadSettings() {
    const container = document.getElementById('app-content');

    try {
        const rates = await SettingsService.getGlobalRates();
        SettingsView.renderLayout(container, rates);

        await loadHistory();
        bindEvents();
    } catch (err) {
        container.innerHTML = `<p style="color:red">Error: ${err.message}</p>`;
    }
}

async function loadHistory() {
    const history = await SettingsService.getHistory();
    SettingsView.renderHistory(history);
}

function bindEvents() {
    document.getElementById('btn-save-settings').onclick = async () => {
        const u = parseFloat(document.getElementById('set-usd').value);
        const e = parseFloat(document.getElementById('set-eur').value);

        if (isNaN(u) || isNaN(e)) return alert("Valores inválidos");

        try {
            await SettingsService.updateRates(u, e);
            alert("✅ Tasas actualizadas.");
            loadSettings(); // Reload to refresh view/cache
        } catch (err) {
            alert("Error: " + err.message);
        }
    };
}
