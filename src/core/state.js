import { SettingsService } from '../modules/settings/settings.service.js';

export const StateManager = {
    intervalId: null,

    async init() {
        console.log("🔄 Iniciando sincronización de tasas (Polling 5 min)...");

        // Initial Fetch (using guard)
        await SettingsService.init();

        // Poll every 5 minutes (300000 ms)
        this.intervalId = setInterval(async () => {
            console.log("🔄 Sincronizando tasas...");
            await SettingsService.refreshRates();
        }, 300000);
    }
};
