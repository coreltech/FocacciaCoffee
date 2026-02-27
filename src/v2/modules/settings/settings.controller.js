/**
 * Controlador de Tasas (Brain/Bridge V2)
 * Conecta el Store, el Service y la Vista. 
 * Se exporta un objeto con `render()` e `initEvents()` para el Router.
 */
import { SettingsService } from './settings.service.js';
import { SettingsView } from './settings.view.js';
import { Store } from '../../core/store.js';

export const SettingsController = {

    async render() {
        // 1. Pedir datos al Service (o usar caché del Store si existiera, pero vamos a DB por seguridad en Tasas)
        const currentRates = await SettingsService.getRates();

        // 2. Actualizar Store Central de inmediato para que el resto de la App V2 se entere
        if (currentRates) {
            Store.update('rates', currentRates);
        }

        // 3. Renderizar Vista inyectando el estado
        return SettingsView.render(currentRates);
    },

    initEvents() {
        // 4. Aislar la captura de eventos, asegurando que solo escuchamos a los elementos de nuestra Vista
        const form = document.getElementById('form-update-rates');

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const usdVal = parseFloat(document.getElementById('input-usd').value);
                const eurVal = parseFloat(document.getElementById('input-eur').value);

                if (isNaN(usdVal) || isNaN(eurVal)) {
                    alert("Por favor ingrese tasas válidas.");
                    return;
                }

                // UX: Cambiar botón a cargando
                const btn = form.querySelector('button[type="submit"]');
                const oldText = btn.innerText;
                btn.innerText = "Guardando...";
                btn.disabled = true;

                // Mandar a BD
                const result = await SettingsService.updateManualRates(usdVal, eurVal);

                btn.innerText = oldText;
                btn.disabled = false;

                if (result.success) {
                    // Si BD acepta, actualizamos la UI local y el STORE global
                    Store.update('rates', result.data[0] || { usd_to_ves: usdVal, eur_to_usd: eurVal, is_manual: true });

                    document.getElementById('display-usd').innerText = usdVal.toFixed(4);
                    document.getElementById('display-eur').innerText = eurVal.toFixed(4);

                    // Idealmente usaríamos aquí el componente Toast nuevo (alertas no intrusivas)
                    alert("Tasas actualizadas correctamente en toda la V2.");
                } else {
                    alert("Error guardando tasas: " + result.error);
                }
            });
        }

        const btnSync = document.getElementById('btn-sync-bcv');
        if (btnSync) {
            btnSync.addEventListener('click', async () => {
                const oldText = btnSync.innerText;
                btnSync.innerText = '⏳ Sincronizando...';
                btnSync.disabled = true;

                const result = await SettingsService.syncBCVRates();

                if (result.success) {
                    // Cargar valores en los inputs
                    document.getElementById('input-usd').value = result.usdRate;
                    document.getElementById('input-eur').value = result.eurRate;

                    // Disparar el guardado automático en BD y Store
                    const form = document.getElementById('form-update-rates');
                    if (form) {
                        form.dispatchEvent(new Event('submit'));
                    }
                } else {
                    alert('Error al sincronizar con BCV: ' + result.error);
                }

                btnSync.innerText = oldText;
                btnSync.disabled = false;
            });
        }
    }
};
