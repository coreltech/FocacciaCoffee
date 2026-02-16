import { SettingsService } from '../modules/settings/settings.service.js';
import { Toast } from '../ui/toast.js';

export const StateManager = {
    intervalId: null,

    async init() {
        console.log("🔄 Iniciando sincronización de tasas (Polling 5 min)...");

        // Initial Fetch
        await SettingsService.init();

        // Initial Smart Check (Async, non-blocking)
        console.log("🚀 Verificando frescura de tasas...");
        this.runSmartCheck();

        // Poll every 5 minutes (300000 ms)
        this.intervalId = setInterval(() => {
            this.runSmartCheck();
        }, 300000);
    },

    async runSmartCheck() {
        try {
            // First refresh internal state to be sure
            await SettingsService.refreshRates();

            // Run logic
            const result = await SettingsService.checkAutoSync();

            if (result && result.status === 'updated') {
                const diff = result.diffPct || 0;
                // Toast Logic: Show if diff > 1% (Requirement)
                if (diff > 1) {
                    Toast.show(`Tasa actualizada: 1 USD = ${result.new_usd} VES`, 'info');
                } else {
                    console.log("✅ Tasa actualizada silenciosamente (cambio menor al 1%)");
                }
            }
        } catch (e) {
            console.error("Smart Check Error:", e);
        }
    }
};
