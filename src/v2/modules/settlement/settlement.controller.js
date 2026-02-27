/**
 * Controlador de Liquidación V2
 */
import { SettlementView } from './settlement.view.js';
import { SettlementService } from './settlement.service.js';

let state = {
    currentTab: 'sales',
    previewData: null
};

export async function loadSettlement(container) {
    container.innerHTML = SettlementView.renderMain();

    // Fechas por defecto: Mes actual
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const currentDate = today.toISOString().split('T')[0];

    document.getElementById('settlement-start').value = firstDay;
    document.getElementById('settlement-end').value = currentDate;

    bindEvents();
}

function bindEvents() {
    // 1. Calcular Vista Previa
    document.getElementById('btn-calc-preview').onclick = async () => {
        const start = document.getElementById('settlement-start').value;
        const end = document.getElementById('settlement-end').value;

        if (!start || !end) {
            alert("Por favor selecciona un rango de fechas.");
            return;
        }

        const btn = document.getElementById('btn-calc-preview');
        btn.disabled = true;
        btn.innerText = "⏳ Calculando...";

        const res = await SettlementService.getPreview(start, end);

        btn.disabled = false;
        btn.innerText = "📊 Calcular Vista Previa";

        if (res.success) {
            state.previewData = res;
            SettlementView.updatePreview(res);
        } else {
            alert("Error calculando liquidación: " + res.error);
        }
    };

    // 2. Cambiar Pestañas
    document.addEventListener('click', (e) => {
        const tabBtn = e.target.closest('.settlement-tab');
        if (tabBtn) {
            const newTab = tabBtn.dataset.tab;
            state.currentTab = newTab;

            // Update UI Active State
            document.querySelectorAll('.settlement-tab').forEach(btn => {
                if (btn === tabBtn) {
                    btn.classList.add('active');
                    btn.style.color = 'var(--text-main)';
                    btn.style.borderBottom = '3px solid var(--primary-color)';
                } else {
                    btn.classList.remove('active');
                    btn.style.color = 'var(--text-muted)';
                    btn.style.borderBottom = '3px solid transparent';
                }
            });

            if (state.previewData) {
                SettlementView.renderTabContent(newTab, state.previewData.details);
            }
        }
    });

    // 3. Ejecutar Liquidación
    document.addEventListener('click', async (e) => {
        if (e.target.id === 'btn-execute-liquidation') {
            if (!state.previewData) return;

            if (!confirm("¿Estás seguro de LIQUIDAR este periodo? Esta acción marcará los registros como cerrados.")) {
                return;
            }

            const btn = e.target;
            btn.disabled = true;
            btn.innerText = "⏳ Procesando...";

            const res = await SettlementService.liquidate(state.previewData);

            btn.disabled = false;
            btn.innerText = "✅ Ejecutar Liquidación";

            if (res.success) {
                alert("Periodo liquidado con éxito.");
                // Limpiar vista o recargar
                document.getElementById('settlement-preview-area').style.display = 'none';
                document.getElementById('settlement-empty-state').style.display = 'block';
                state.previewData = null;
            } else {
                alert("Error al liquidar: " + res.error);
            }
        }
    });
}
