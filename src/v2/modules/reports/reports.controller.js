/**
 * Controlador de Reportes V2
 */
import { ReportsView } from './reports.view.js';
import { ReportsService } from './reports.service.js';

export async function loadReports() {
    // Buscar el contenedor desde el router (this.workspace pasaba acá)
    // En V2 el workspace es constante, lo buscamos directo
    const container = document.getElementById('app-workspace');
    if (!container) return;

    container.innerHTML = ReportsView.renderMain();

    // Fechas por defecto (Mes actual)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const currentDate = today.toISOString().split('T')[0];

    document.getElementById('report-start').value = firstDay;
    document.getElementById('report-end').value = currentDate;

    bindEvents();
}

function bindEvents() {
    const btn = document.getElementById('btn-generate-report');
    if (!btn) return;

    btn.onclick = async () => {
        const start = document.getElementById('report-start').value;
        const end = document.getElementById('report-end').value;

        if (!start || !end) {
            alert("Por favor selecciona un rango de fechas.");
            return;
        }

        btn.disabled = true;
        btn.innerText = "⏳ Generando...";

        try {
            const data = await ReportsService.getFinancialSummary(start, end);
            ReportsView.updateSummary(data);
        } catch (error) {
            alert("Error al generar reporte: " + error.message);
        } finally {
            btn.disabled = false;
            btn.innerText = "📈 Generar Reporte";
        }
    };
}
