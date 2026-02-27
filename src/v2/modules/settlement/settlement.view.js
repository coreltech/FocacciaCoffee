/**
 * Vista de Liquidación V2
 */
import { Formatter } from '../../core/formatter.js';

export const SettlementView = {
    renderMain() {
        return `
            <div class="v2-module-container fade-in">
                <header class="module-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <div>
                        <h2 class="section-title" style="margin-bottom: 4px;">Liquidación de Periodo</h2>
                        <p style="color: var(--text-muted); font-size: 0.9rem;">Cierre de caja, cálculo de utilidad y reparto entre socios</p>
                    </div>
                </header>

                <!-- Filtros de Periodo -->
                <div class="card shadow-sm" style="margin-bottom: 24px; padding: 20px; background: white; border-radius: var(--radius-lg);">
                    <div style="display: flex; gap: 15px; align-items: flex-end; flex-wrap: wrap;">
                        <div class="form-group">
                            <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 6px;">Desde</label>
                            <input type="date" id="settlement-start" class="form-control" style="width: 160px; padding: 8px;">
                        </div>
                        <div class="form-group">
                            <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 6px;">Hasta</label>
                            <input type="date" id="settlement-end" class="form-control" style="width: 160px; padding: 8px;">
                        </div>
                        <button class="btn btn-primary" id="btn-calc-preview" style="padding: 10px 24px;">
                            📊 Calcular Vista Previa
                        </button>
                    </div>
                </div>

                <!-- Preview Area (Hidden initially) -->
                <div id="settlement-preview-area" style="display: none;">
                    
                    <!-- KPI Summary -->
                    <div class="kpi-grid" style="margin-bottom: 24px;">
                        <div class="kpi-card" style="border-left: 4px solid var(--success-color);">
                            <span class="kpi-title">Ingresos Totales (Cobrado)</span>
                            <span class="kpi-value" id="kpi-total-income">$0.00</span>
                        </div>
                        <div class="kpi-card" style="border-left: 4px solid var(--danger-color);">
                            <span class="kpi-title">Egresos Totales (Pagado)</span>
                            <span class="kpi-value" id="kpi-total-outcome" style="color: var(--danger-color);">$0.00</span>
                        </div>
                        <div class="kpi-card" style="border-left: 4px solid var(--primary-color);">
                            <span class="kpi-title">Utilidad Neta</span>
                            <span class="kpi-value" id="kpi-net-utility" style="color: var(--primary-color);">$0.00</span>
                        </div>
                    </div>

                    <!-- Distribution Card -->
                    <div class="card shadow-sm" style="margin-bottom: 24px; padding: 24px; background: #f8fafc; border: 1px dashed var(--primary-color);">
                        <h3 style="margin-bottom: 16px; font-size: 1.1rem; color: var(--text-main);">💰 Propuesta de Distribución</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px;">
                            <div style="text-align: center; padding: 15px; background: white; border-radius: 12px; box-shadow: var(--shadow-sm);">
                                <span style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 5px;">Re-Inversión (20%)</span>
                                <span id="dist-fund" style="font-size: 1.25rem; font-weight: 700; color: #64748b;">$0.00</span>
                            </div>
                            <div style="text-align: center; padding: 15px; background: white; border-radius: 12px; box-shadow: var(--shadow-sm);">
                                <span style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 5px;">Agustín Lugo (40%)</span>
                                <span id="dist-partner-a" style="font-size: 1.25rem; font-weight: 700; color: var(--success-color);">$0.00</span>
                            </div>
                            <div style="text-align: center; padding: 15px; background: white; border-radius: 12px; box-shadow: var(--shadow-sm);">
                                <span style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 5px;">Juan Márquez (40%)</span>
                                <span id="dist-partner-b" style="font-size: 1.25rem; font-weight: 700; color: var(--success-color);">$0.00</span>
                            </div>
                        </div>
                        
                        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                            <p style="font-size: 0.85rem; color: var(--text-muted); max-width: 60%;">Al ejecutar la liquidación, todos los registros del periodo se marcarán como "Liquidados" y no podrán ser editados.</p>
                            <button class="btn btn-primary" id="btn-execute-liquidation" style="background: var(--primary-color); padding: 12px 30px; font-weight: 700; border-radius: 30px;">
                                ✅ Ejecutar Liquidación
                            </button>
                        </div>
                    </div>

                    <!-- Details Tabs -->
                    <div style="display: flex; gap: 1rem; border-bottom: 1px solid var(--border-color); margin-bottom: 20px;">
                        <button class="settlement-tab active" data-tab="sales" style="padding: 10px 20px; border: none; background: none; font-weight: 600; cursor: pointer; border-bottom: 3px solid var(--primary-color);">Ventas</button>
                        <button class="settlement-tab" data-tab="purchases" style="padding: 10px 20px; border: none; background: none; font-weight: 600; cursor: pointer; color: var(--text-muted);">Compras</button>
                        <button class="settlement-tab" data-tab="expenses" style="padding: 10px 20px; border: none; background: none; font-weight: 600; cursor: pointer; color: var(--text-muted);">Gastos</button>
                        <button class="settlement-tab" data-tab="contributions" style="padding: 10px 20px; border: none; background: none; font-weight: 600; cursor: pointer; color: var(--text-muted);">Aportes</button>
                    </div>

                    <div id="settlement-tab-content" style="background: white; border-radius: var(--radius-md); box-shadow: var(--shadow-sm); overflow: hidden;">
                        <!-- Content Injected via JS -->
                    </div>

                </div>

                <div id="settlement-empty-state" style="text-align: center; padding: 60px; color: var(--text-muted);">
                    <div style="font-size: 4rem; opacity: 0.3;">📉</div>
                    <h3>Sin datos seleccionados</h3>
                    <p>Elige un rango de fechas para ver la rentabilidad del negocio.</p>
                </div>
            </div>
        `;
    },

    /**
     * Actualiza la vista con los datos de preview
     */
    updatePreview(data) {
        document.getElementById('settlement-empty-state').style.display = 'none';
        document.getElementById('settlement-preview-area').style.display = 'block';

        // Update KPIs
        document.getElementById('kpi-total-income').innerText = Formatter.formatCurrency(data.totals.incomes);
        document.getElementById('kpi-total-outcome').innerText = Formatter.formatCurrency(data.totals.outcomes);
        document.getElementById('kpi-net-utility').innerText = Formatter.formatCurrency(data.totals.netUtility);

        // Update Distribution
        document.getElementById('dist-fund').innerText = Formatter.formatCurrency(data.distribution.fund);
        document.getElementById('dist-partner-a').innerText = Formatter.formatCurrency(data.distribution.partnerA);
        document.getElementById('dist-partner-b').innerText = Formatter.formatCurrency(data.distribution.partnerB);

        // Render current tab (default sales)
        this.renderTabContent('sales', data.details);
    },

    /**
     * Renderiza el contenido de una pestaña específica
     */
    renderTabContent(tab, details) {
        const container = document.getElementById('settlement-tab-content');
        let html = '';

        if (tab === 'sales') {
            html = this.getTableTemplate(['FECHA', 'CLIENTE', 'MONTO'], details.sales.map(s => [
                new Date(s.sale_date).toLocaleDateString(),
                s.v2_customers?.name || 'Cliente Casual',
                Formatter.formatCurrency(s.amount_paid)
            ]));
        } else if (tab === 'purchases') {
            html = this.getTableTemplate(['FECHA', 'PROVEEDOR', 'DOC', 'TOTAL'], details.purchases.map(p => [
                new Date(p.purchase_date).toLocaleDateString(),
                p.v2_suppliers?.name || '-',
                `${p.document_type} ${p.document_number || ''}`,
                Formatter.formatCurrency(p.total_usd)
            ]));
        } else if (tab === 'expenses') {
            html = this.getTableTemplate(['FECHA', 'CATEGORÍA', 'DESCRIPCIÓN', 'MONTO'], details.expenses.map(e => [
                new Date(e.expense_date).toLocaleDateString(),
                e.category,
                e.description,
                Formatter.formatCurrency(e.amount)
            ]));
        } else if (tab === 'contributions') {
            html = this.getTableTemplate(['FECHA', 'SOCIO', 'DESCRIPCIÓN', 'MONTO'], details.contributions.map(c => [
                new Date(c.contribution_date).toLocaleDateString(),
                c.partner_name,
                c.description,
                Formatter.formatCurrency(c.amount)
            ]));
        }

        container.innerHTML = html;
    },

    getTableTemplate(headers, rows) {
        return `
            <table class="erp-table v2-table" style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f8fafc; text-align: left; font-size: 0.85rem; color: var(--text-muted);">
                        ${headers.map(h => `<th style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${rows.length === 0 ? `<tr><td colspan="${headers.length}" style="text-align:center; padding: 20px;">No hay registros</td></tr>` :
                rows.map(row => `
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                            ${row.map(cell => `<td style="padding: 12px 16px; font-size: 0.9rem;">${cell}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
};
