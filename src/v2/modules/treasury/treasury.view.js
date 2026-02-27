import { Formatter } from '../../core/formatter.js';

export const TreasuryView = {
    renderMain() {
        return `
            <div class="v2-module-container fade-in">
                <header class="module-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <div>
                        <h2 class="section-title" style="margin-bottom: 4px;">Tesorería</h2>
                        <p style="color: var(--text-muted); font-size: 0.9rem;">Gestión de Gastos Operativos y Aportes de Socios</p>
                    </div>
                </header>

                <!-- KPI Cards -->
                <div class="kpi-grid" style="margin-bottom: 24px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                    <div class="kpi-card" style="border-left: 4px solid var(--danger-color);">
                        <span class="kpi-title">Total Gastos (Mes)</span>
                        <span class="kpi-value" style="color: var(--danger-color);">$<span id="kpi-total-expenses">0.00</span></span>
                    </div>
                    <div class="kpi-card" style="border-left: 4px solid var(--success-color);">
                        <span class="kpi-title">Total Aportes (Mes)</span>
                        <span class="kpi-value" style="color: var(--success-color);">$<span id="kpi-total-contributions">0.00</span></span>
                    </div>
                </div>

                <!-- Tabs Navigation -->
                <div style="display: flex; gap: 1rem; border-bottom: 1px solid var(--border-color); margin-bottom: 20px;">
                    <button class="treasury-tab active" data-tab="expenses" style="padding: 10px 20px; border: none; background: none; font-weight: 600; color: var(--danger-color); border-bottom: 3px solid var(--danger-color); cursor: pointer;">
                        🔴 Gastos Operativos
                    </button>
                    <button class="treasury-tab" data-tab="contributions" style="padding: 10px 20px; border: none; background: none; font-weight: 600; color: var(--text-muted); border-bottom: 3px solid transparent; cursor: pointer;">
                        🟢 Aportes de Capital
                    </button>
                </div>

                <!-- Action Bar -->
                <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
                    <div class="filters-group" style="display: flex; gap: 10px;">
                        <input type="date" id="filter-start" class="form-control" style="width: 150px;">
                        <input type="date" id="filter-end" class="form-control" style="width: 150px;">
                        <button class="btn btn-outline" id="btn-filter-treasury">Filtrar</button>
                    </div>
                    <button class="btn btn-primary" id="btn-new-record">+ Nuevo Registro</button>
                </div>

                <!-- Data Table -->
                <div class="table-container" style="background: white; border-radius: var(--radius-md); box-shadow: var(--shadow-sm); overflow-x: auto;">
                    <table class="erp-table v2-table" style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f8fafc; text-align: left; font-size: 0.85rem; color: var(--text-muted);">
                                <th style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">FECHA</th>
                                <th style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);" id="th-category-partner">CATEGORÍA</th>
                                <th style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">DESCRIPCIÓN</th>
                                <th style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">BENEFICIARIO</th>
                                <th style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); text-align: right;">MONTO (USD)</th>
                                <th style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); text-align: center;">TASA BCV</th>
                                <th style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); text-align: center;">ESTADO</th>
                                <th style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); text-align: center;">ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody id="treasury-table-body">
                            <tr><td colspan="7" style="text-align:center; padding: 20px;">Cargando registros...</td></tr>
                        </tbody>
                    </table>
                </div>

                ${this.renderModal()}
            </div>
        `;
    },

    renderModal() {
        return `
            <div id="modal-treasury" class="modal-overlay glass animate-scale">
                <div class="modal-content" style="background: white; width: 450px; max-height: 90vh; overflow-y: auto; border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);">
                    
                    <div class="modal-header" style="padding: 16px 24px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: #f8fafc;">
                        <h3 id="modal-treasury-title" style="margin: 0; font-size: 1.1rem; color: var(--text-main);">Nuevo Gasto Operativo</h3>
                        <button type="button" class="btn-close-modal" id="btn-close-treasury-modal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted);">&times;</button>
                    </div>
                    
                    <form id="form-treasury-record" style="padding: 24px;">
                        <input type="hidden" id="record-type" value="expense">

                        <div class="form-group" style="margin-bottom: 16px;">
                            <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 8px; color: var(--text-main);">Fecha</label>
                            <input type="date" id="record-date" class="form-control" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: var(--radius-md);" required>
                        </div>
                        
                        <!-- Dynamic Field: Category (Expenses) or Partner (Contributions) -->
                        <div class="form-group" style="margin-bottom: 16px;" id="group-dynamic-field">
                            <label id="label-dynamic" style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 8px; color: var(--text-main);">Categoría</label>
                            <select id="record-dynamic" class="form-control" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: var(--radius-md);" required>
                                <!-- Injected via JS -->
                            </select>
                        </div>

                        <div class="form-group" style="margin-bottom: 16px;">
                            <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 8px; color: var(--text-main);">Descripción Breve / Motivo</label>
                            <input type="text" id="record-description" class="form-control" placeholder="Ej: Pago quincenita, Harina, etc." style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: var(--radius-md);" required autocomplete="off">
                        </div>

                        <div class="form-group" style="margin-bottom: 16px;">
                            <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 8px; color: var(--text-main);">Beneficiario / Destino (Opcional)</label>
                            <input type="text" id="record-beneficiary" class="form-control" placeholder="Ej: Supermercado X, Juan Pérez, etc." style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: var(--radius-md);" autocomplete="off">
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 24px;">
                            <div class="form-group">
                                <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 8px; color: var(--text-main);">Monto en USD ($)</label>
                                <input type="number" step="0.01" min="0.01" id="record-amount" class="form-control" placeholder="0.00" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 1rem; font-weight: bold; color: var(--primary-color);" required>
                            </div>
                            <div class="form-group">
                                <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 8px; color: var(--text-main);">Monto en Bs. (BCV)</label>
                                <input type="number" step="0.01" min="0.01" id="record-amount-bs" class="form-control" placeholder="0.00" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 1rem; font-weight: bold; color: var(--text-muted);">
                            </div>
                        </div>
                        
                        <div id="rate-info-container" style="font-size: 0.75rem; color: var(--text-muted); margin-top: -15px; margin-bottom: 20px; font-style: italic;">
                            💡 Tasa referencial: <span id="span-current-tasa">...</span> Bs/$
                        </div>
                        
                        <div style="display: flex; gap: 12px; justify-content: flex-end;">
                            <button type="button" class="btn btn-outline" id="btn-cancel-treasury" style="padding: 10px 20px;">Cancelar</button>
                            <button type="submit" class="btn btn-primary" id="btn-save-treasury" style="padding: 10px 24px; font-weight: 600;">Guardar Registro</button>
                        </div>
                    </form>

                </div>
            </div>
        `;
    },

    renderTable(records, currentTab) {
        const tbody = document.getElementById('treasury-table-body');
        if (!tbody) return;

        if (!records || records.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 30px; color: var(--text-muted); font-style: italic;">No se encontraron registros para este periodo.</td></tr>`;
            return;
        }

        let html = '';
        records.forEach(r => {
            const dateStr = new Date(r.expense_date || r.contribution_date).toLocaleDateString();
            const dynamicName = r.category || r.partner_name; // Categoría (Gasto) o Socio (Aporte)
            const amount = Formatter.formatCurrency(r.amount);
            const rate = r.reference_rate ? Formatter.formatNumber(r.reference_rate) : '-';

            // Estado de Liquidación
            let statusBadge = '';
            let deleteBtn = '';
            if (r.settlement_id) {
                statusBadge = `<span style="background: #e2e8f0; color: #475569; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">🔒 Liquidado</span>`;
                deleteBtn = `<span title="Liquidado. No se puede borrar." style="opacity: 0.5; cursor: not-allowed;">🗑️</span>`;
            } else {
                statusBadge = `<span style="background: #fef3c7; color: #b45309; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">🕒 Pendiente</span>`;
                deleteBtn = `<button class="btn-delete-record" data-id="${r.id}" style="background: none; border: none; cursor: pointer; color: var(--danger-color); font-size: 1.1rem;" title="Eliminar registro">🗑️</button>`;
            }

            const amountColor = currentTab === 'expenses' ? 'var(--danger-color)' : 'var(--success-color)';
            const prefix = currentTab === 'expenses' ? '-' : '+';

            html += `
                <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;">
                    <td style="padding: 12px 16px; font-size: 0.9rem;">${dateStr}</td>
                    <td style="padding: 12px 16px; font-weight: 500;">${dynamicName}</td>
                    <td style="padding: 12px 16px; color: var(--text-muted); font-size: 0.9rem;">${r.description}</td>
                    <td style="padding: 12px 16px; font-size: 0.85rem; color: #475569;">${r.beneficiary || '-'}</td>
                    <td style="padding: 12px 16px; text-align: right; font-weight: 700; color: ${amountColor};">${prefix} ${amount}</td>
                    <td style="padding: 12px 16px; text-align: center; font-size: 0.85rem; color: #64748b;">Bs. ${rate}</td>
                    <td style="padding: 12px 16px; text-align: center;">${statusBadge}</td>
                    <td style="padding: 12px 16px; text-align: center;">${deleteBtn}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    },

    updateKPIs(expensesTotal, contributionsTotal) {
        document.getElementById('kpi-total-expenses').innerText = Formatter.formatNumber(expensesTotal);
        document.getElementById('kpi-total-contributions').innerText = Formatter.formatNumber(contributionsTotal);
    }
};
