import { WeeklyClosureService } from './weekly_closure.service.js';
import { WeeklyClosureView } from './weekly_closure.view.js';

export async function loadWeeklyClosure() {
    const container = document.getElementById('app-content');
    WeeklyClosureView.renderLayout(container);

    // Default Dates: Current Sunday to Next Sunday (or Today if mid-week)
    // Actually "Ciclo actual (domingo a domingo)" usually means the current week starting Sunday.
    const today = new Date();
    const day = today.getDay(); // 0 (Sun) - 6 (Sat)

    // Calculate last Sunday (Start of week)
    const diffToSunday = day === 0 ? 0 : day; // If 0 (Sun), diff is 0. If 1 (Mon), diff is 1.
    // Wait, if today is Monday (1), last Sunday was 1 day ago.
    // timestamp - (day * 24h)

    const lastSunday = new Date(today);
    lastSunday.setDate(today.getDate() - day);

    // End date is today? Or next Sunday? Report usually implies "Current Progress".
    // So Start=Last Sunday, End=Today.

    const formatDate = (d) => d.toISOString().split('T')[0];

    const startInput = document.getElementById('report-start');
    const endInput = document.getElementById('report-end');
    const btnRefresh = document.getElementById('btn-refresh-report');

    startInput.value = formatDate(lastSunday);
    endInput.value = formatDate(today);

    const fetchData = async () => {
        try {
            // Show loading state in table or overlay? View handles partial updates? 
            // For now, simple visual feedback on button
            btnRefresh.textContent = "⏳";
            btnRefresh.disabled = true;

            const data = await WeeklyClosureService.getReportData(startInput.value, endInput.value);
            WeeklyClosureView.renderData(data);

        } catch (err) {
            console.error("Error generating report:", err);
            alert("Error al generar reporte: " + err.message);
        } finally {
            btnRefresh.textContent = "🔄";
            btnRefresh.disabled = false;
        }
    };

    // Bind Events
    btnRefresh.onclick = fetchData;
    startInput.onchange = fetchData;
    endInput.onchange = fetchData;

    // Initial Load
    await fetchData();
}
