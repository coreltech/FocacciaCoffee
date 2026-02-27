/**
 * Vista de Reportes V2
 */
import { Formatter } from '../../core/formatter.js';

export const ReportsView = {
    renderMain() {
        return `
            <div class="v2-module-container fade-in">
                <header class="module-header" style="margin-bottom: 24px;">
                    <h2 class="section-title">Análisis y Reportes</h2>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">Consulta el desempeño financiero de tu negocio</p>
                </header>

                <!-- Filtros -->
                <div class="card shadow-sm" style="margin-bottom: 24px; padding: 20px; background: white; border-radius: var(--radius-lg);">
                    <div style="display: flex; gap: 15px; align-items: flex-end; flex-wrap: wrap;">
                        <div class="form-group">
                            <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 6px;">Desde</label>
                            <input type="date" id="report-start" class="form-control" style="width: 160px;">
                        </div>
                        <div class="form-group">
                            <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 6px;">Hasta</label>
                            <input type="date" id="report-end" class="form-control" style="width: 160px;">
                        </div>
                        <button class="btn btn-primary" id="btn-generate-report" style="padding: 10px 24px;">
                            📈 Generar Reporte
                        </button>
                    </div>
                </div>

                <div id="report-content-area" style="display: none;">
                    <div class="card shadow-sm" style="padding: 30px; background: white; border-radius: var(--radius-lg);">
                        <h3 style="margin-bottom: 24px; color: var(--text-main); border-bottom: 2px solid #f1f5f9; padding-bottom: 15px;">
                            Estado de Resultados Estimado
                        </h3>
                        
                        <table style="width: 100%; border-collapse: collapse;">
                            <tbody>
                                <tr style="font-weight: 700; font-size: 1.1rem; color: var(--text-main);">
                                    <td style="padding: 15px 0;">(+) INGRESOS TOTALES (Ventas Cobradas)</td>
                                    <td id="rep-income" style="text-align: right; padding: 15px 0; color: var(--success-color);">$0.00</td>
                                </tr>
                                <tr style="color: var(--text-muted); border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 12px 20px;">Compras de Insumos</td>
                                    <td id="rep-purchases" style="text-align: right; padding: 12px 0;">$0.00</td>
                                </tr>
                                <tr style="color: var(--text-muted); border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 12px 20px;">Gastos Operativos</td>
                                    <td id="rep-expenses" style="text-align: right; padding: 12px 0;">$0.00</td>
                                </tr>
                                <tr style="font-weight: 700; font-size: 1.1rem; color: var(--danger-color); border-bottom: 2px solid #1e293b;">
                                    <td style="padding: 15px 0;">(-) EGRESOS TOTALES</td>
                                    <td id="rep-outcome" style="text-align: right; padding: 15px 0;">$0.00</td>
                                </tr>
                                <tr style="font-weight: 900; font-size: 1.4rem; background: #f8fafc;">
                                    <td style="padding: 20px;">UTILIDAD NETA ESTIMADA</td>
                                    <td id="rep-utility" style="text-align: right; padding: 20px; color: var(--primary-color);">$0.00</td>
                                </tr>
                            </tbody>
                        </table>

                        <div style="margin-top: 30px; display: flex; justify-content: flex-end; gap: 10px;">
                            <button class="btn btn-outline" style="font-weight: 600;">📥 Exportar PDF</button>
                            <button class="btn btn-success" style="font-weight: 600;">📗 Exportar Excel</button>
                        </div>
                    </div>
                </div>

                <div id="report-empty-state" style="text-align: center; padding: 80px; color: var(--text-muted);">
                    <div style="font-size: 4rem; opacity: 0.2;">📊</div>
                    <h3>Genera un reporte para empezar</h3>
                    <p>Selecciona un rango de fechas y haz clic en "Generar Reporte" para ver el análisis financiero.</p>
                </div>
            </div>
        `;
    },

    updateSummary(data) {
        document.getElementById('report-empty-state').style.display = 'none';
        document.getElementById('report-content-area').style.display = 'block';

        document.getElementById('rep-income').innerText = Formatter.formatCurrency(data.incomes);
        document.getElementById('rep-purchases').innerText = Formatter.formatCurrency(data.purchases);
        document.getElementById('rep-expenses').innerText = Formatter.formatCurrency(data.expenses);
        document.getElementById('rep-outcome').innerText = Formatter.formatCurrency(data.outcomes);
        document.getElementById('rep-utility').innerText = Formatter.formatCurrency(data.netUtility);
    }
};
