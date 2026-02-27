import { Formatter } from '../../core/formatter.js';

export const KardexView = {
    renderMain() {
        return `
            <div class="v2-module-container fade-in">
                <!-- CABECERA PREMIUM -->
                <div class="module-header-v2" style="background: linear-gradient(135deg, var(--surface-color) 0%, #f8fafc 100%); padding: 25px; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); border-left: 5px solid var(--primary-color); display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <div>
                        <h2 class="section-title" style="border: none; margin-bottom: 5px; font-size: 1.6rem; display: flex; align-items: center; gap: 10px;">
                            <span style="background: var(--primary-light); padding: 8px; border-radius: 8px;">📋</span> 
                            Kardex e Historial de Inventario
                        </h2>
                        <p class="subtitle" style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0;">Trazabilidad exacta de cada gramo o unidad que entra, sale o se produce.</p>
                    </div>
                    <div class="header-actions" style="display: flex; gap: 12px;">
                        <button class="btn btn-outline" id="btn-export-kardex" style="background: white; shadow: var(--shadow-sm); padding: 10px 18px; font-weight: 600;">📥 Descargar Excel</button>
                    </div>
                </div>

                <!-- FILTROS DINÁMICOS -->
                <div class="v2-card" style="margin-bottom: 20px; background: white; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm);">
                    <h4 style="margin-bottom: 15px; color: var(--primary-dark); font-size: 1.05rem; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
                        🔍 Filtros de Búsqueda
                    </h4>
                    <form id="form-kardex-filters" class="form-row" style="align-items: flex-end; gap: 15px;">
                        <div class="form-group" style="flex: 1; margin: 0;">
                            <label>Desde Fecha</label>
                            <input type="date" id="kdx-filter-start" class="form-control">
                        </div>
                        <div class="form-group" style="flex: 1; margin: 0;">
                            <label>Hasta Fecha</label>
                            <input type="date" id="kdx-filter-end" class="form-control">
                        </div>
                        <div class="form-group" style="flex: 1.5; margin: 0;">
                            <label>Tipo de Ítem</label>
                            <select id="kdx-filter-type" class="form-control">
                                <option value="">Todos los Tipos</option>
                                <option value="SUPPLY_ITEM">Materia Prima (Insumos)</option>
                                <option value="CATALOG_ITEM">Productos Terminados (Catálogo)</option>
                            </select>
                        </div>
                        <div class="form-group" style="flex: 2; margin: 0;">
                            <label>Ítem Específico (Opcional)</label>
                            <select id="kdx-filter-item" class="form-control" disabled data-placeholder="Primero selecciona el Tipo">
                                <option value="">-- Selecciona el Tipo Primero --</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin: 0;">
                            <button type="submit" class="btn btn-primary" style="height: 42px; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm); min-width: 120px;">Filtrar</button>
                        </div>
                        <div class="form-group" style="margin: 0;">
                            <button type="button" id="btn-reset-filters" class="btn btn-outline" title="Limpiar Filtros" style="height: 42px; width: 42px; display: flex; align-items: center; justify-content: center;">🔄</button>
                        </div>
                    </form>
                </div>

                <!-- CONTENEDOR DE TABLA PREMIUM -->
                <div class="v2-card" style="padding: 0; overflow: hidden; box-shadow: var(--shadow-md);">
                    <div style="padding: 15px 20px; background: #f8fafc; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="font-size: 1.1rem; color: var(--text-main); margin: 0;" id="kardex-table-title">Mostrando Últimos 100 Movimientos (Global)</h3>
                        <span class="badge" style="background: var(--bg-light); color: var(--text-muted); padding: 5px 10px;" id="kardex-count-badge">0 registros</span>
                    </div>
                    <div class="table-responsive" style="max-height: calc(100vh - 380px); overflow-y: auto;">
                        <table class="v2-table" id="kardex-table" style="margin: 0; border: none; font-size: 0.9rem;">
                            <thead style="position: sticky; top: 0; z-index: 10; background: var(--surface-color);">
                                <tr>
                                    <th>Fecha y Hora</th>
                                    <th>Concepto de Movimiento</th>
                                    <th>Nombre del Ítem</th>
                                    <th class="text-right">Stock Inicial</th>
                                    <th class="text-right">Variación Cantidad</th>
                                    <th class="text-right">Stock Final</th>
                                    <th>Referencia / Motivo</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td colspan="7" class="text-center text-muted" style="padding: 40px;">Cargando historial del Kardex...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * @param {Array} history - Datos enriquecidos desde el servicio
     */
    renderKardexTable(history) {
        const tbody = document.querySelector('#kardex-table tbody');
        const badgeObj = document.getElementById('kardex-count-badge');

        if (!tbody) return;

        if (badgeObj) badgeObj.textContent = `${history.length} registros`;

        if (!history || history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted" style="padding: 40px;">No se encontraron movimientos en este periodo para los filtros seleccionados.</td></tr>';
            return;
        }

        tbody.innerHTML = history.map(t => {
            // Formatear Fecha
            const dateObj = new Date(t.created_at);
            const formattedDate = dateObj.toLocaleDateString('es-VE', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + dateObj.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });

            // Estilos por tipo de transacción
            let txColor = 'var(--text-main)';
            let txIcon = '🔄';
            let qtyPrefix = '';
            let qtyColor = 'var(--text-main)';

            switch (t.transaction_type) {
                case 'PURCHASE':
                    txColor = 'var(--success-color)'; txIcon = '📦'; qtyPrefix = '+'; qtyColor = 'var(--success-color)'; break;
                case 'SALE':
                    txColor = 'var(--primary-color)'; txIcon = '🛍️'; qtyPrefix = '-'; qtyColor = 'var(--danger-color)'; break;
                case 'PRODUCTION':
                    // Producción es entrada para Catálogo (+), salida para Insumos (-)
                    if (t.item_type === 'CATALOG_ITEM') {
                        txColor = '#10b981'; txIcon = '🔥'; qtyPrefix = '+'; qtyColor = 'var(--success-color)';
                    } else {
                        txColor = '#f59e0b'; txIcon = '🔥'; qtyPrefix = '-'; qtyColor = 'var(--danger-color)';
                    }
                    break;
                case 'ADJUSTMENT':
                    txColor = '#f59e0b'; txIcon = '⚖️';
                    qtyPrefix = parseFloat(t.quantity) >= 0 ? '+' : '';
                    qtyColor = parseFloat(t.quantity) >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
                    break;
            }

            // Traducir Tipo para UI
            const uiType = {
                'PURCHASE': 'Compra/Reposición',
                'SALE': 'Venta Directa',
                'PRODUCTION': t.item_type === 'CATALOG_ITEM' ? 'Producción (Lote fabricado)' : 'Merma Producción (Consumido)',
                'ADJUSTMENT': 'Ajuste Manual'
            }[t.transaction_type] || t.transaction_type;

            // Insignia del tipo de ítem
            const itemBadgeClass = t.item_type === 'CATALOG_ITEM' ? 'badge' : 'badge badge-success';
            const uiItemTypeLabel = t.item_type === 'CATALOG_ITEM' ? 'Terminado' : 'Materia Prima';

            return `
            <tr>
                <td style="color: var(--text-muted); font-size: 0.85rem;">${formattedDate}</td>
                <td>
                    <span style="color: ${txColor}; font-weight: 600; display: flex; align-items: center; gap: 5px;">
                        ${txIcon} ${uiType}
                    </span>
                </td>
                <td>
                    <div style="font-weight: 600; color: var(--text-main);">${t.item_name}</div>
                    <span class="${itemBadgeClass}" style="font-size: 0.7rem; padding: 2px 6px;">${uiItemTypeLabel}</span>
                </td>
                <td class="text-right" style="color: var(--text-muted);">${Formatter.formatNumber(t.old_stock || 0)}</td>
                <td class="text-right" style="color: ${qtyColor}; font-weight: 700; font-size: 1rem;">
                    ${qtyPrefix}${Formatter.formatNumber(Math.abs(parseFloat(t.quantity)))}
                </td>
                <td class="text-right" style="font-weight: 600;">${Formatter.formatNumber(t.new_stock || 0)}</td>
                <td style="color: var(--text-muted); font-size: 0.85rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${t.reason || 'Sin referencia'}">
                    ${t.reason || '-'}
                </td>
            </tr>
            `;
        }).join('');
    }
};
