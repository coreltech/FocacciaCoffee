/**
 * Vista de Producción V2 (Centro de Control Quirúrgico)
 * Soporta registro de vitrina, preparaciones intermedias y ajustes manuales (overrides).
 */
import { Formatter } from '../../core/formatter.js';

export const ProductionView = {
    render(container) {
        container.innerHTML = `
            <div class="production-container animate-fade-in">
                <header class="module-header glass" style="display:flex; justify-content:space-between; align-items:center;">
                    <div class="header-info">
                        <h1>🍞 Centro de Producción V2 <small style="font-size:0.6rem; opacity:0.5;">v2.3-surgical</small></h1>
                        <p>Gestión de preparaciones, horneado y precisión de inventarios.</p>
                    </div>
                </header>

                <!-- KPIs DE PRODUCCIÓN -->
                <div class="kpi-grid">
                    <div class="kpi-card">
                        <span class="kpi-title">Estatus Hoy</span>
                        <span class="kpi-value">Precisión Quirúrgica</span>
                    </div>
                    <div class="kpi-card">
                        <span class="kpi-title">Modo</span>
                        <span class="kpi-value" style="color:var(--success-color);">Optimizado</span>
                    </div>
                </div>

                <div class="production-main-grid">
                    
                    <!-- COLUMNA IZQUIERDA: REGISTRO Y TALLER -->
                    <div class="prod-column">
                        
                        <!-- PESTAÑAS DE CATEGORÍA -->
                        <div class="card glass no-padding" style="margin-bottom: 20px; overflow:hidden;">
                            <div class="tab-header" style="display:flex; background: rgba(0,0,0,0.1);">
                                <button class="tab-btn active" data-tab="vitrina">🏪 Vitrina (Venta)</button>
                                <button class="tab-btn" data-tab="preparaciones">🥣 Preparaciones (Masas)</button>
                            </div>

                            <div class="tab-content" style="padding: 20px;">
                                <form id="form-production" class="erp-form">
                                    <input type="hidden" id="prod-source-type" value="vitrina">
                                    
                                    <div class="form-row">
                                        <div class="form-group" style="flex:2;">
                                            <label id="label-prod-target">Producto a Hornear:</label>
                                            <select id="prod-target-id" required class="form-control">
                                                <option value="">Selecciona...</option>
                                            </select>
                                        </div>
                                        <div class="form-group" style="flex:1;">
                                            <label id="label-prod-qty">Cant. Esperada:</label>
                                            <input type="number" id="prod-expected-qty" step="0.01" class="form-control" placeholder="Ej: 10" readonly>
                                        </div>
                                    </div>

                                    <!-- MODO QUIRÚRGICO: AJUSTE DE INGREDIENTES -->
                                    <div id="surgical-panel" style="display:none; margin-top:20px; border-top:1px solid var(--border-color); padding-top:15px;">
                                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                                            <h4 style="margin:0; font-size:0.95rem; color:var(--primary-color);">🔍 Ajuste Manual de Insumos (Opcional)</h4>
                                            <div class="export-tools" style="display:flex; gap:8px;">
                                                <button type="button" class="btn btn-outline btn-sm" id="btn-export-excel" title="Exportar a Excel" style="padding:2px 8px; font-size:0.75rem;">📊 Excel</button>
                                                <button type="button" class="btn btn-outline btn-sm" id="btn-export-pdf" title="Imprimir Receta" style="padding:2px 8px; font-size:0.75rem;">🖨️ PDF</button>
                                                <button type="button" class="btn btn-outline btn-sm" id="btn-reset-overrides" style="padding:2px 8px; font-size:0.75rem;">Resetear</button>
                                            </div>
                                        </div>
                                        <p class="small-text" style="margin-bottom:12px;">El sistema descontará las cantidades que indiques aquí. Por defecto usa la receta.</p>
                                        
                                        <div id="ingredients-overrides-list" style="display:flex; flex-direction:column; gap:8px; max-height:300px; overflow-y:auto; padding-right:5px;">
                                            <!-- Inyectado vía JS -->
                                        </div>
                                    </div>

                                    <!-- RENDIMIENTO FINAL -->
                                    <div style="margin-top:20px; background: rgba(16, 185, 129, 0.1); padding: 20px; border-radius: 12px; border: 2px solid var(--success-color);">
                                        <div class="form-row" style="align-items: center; gap:20px;">
                                            <div class="form-group" style="flex:1; margin-bottom:0;">
                                                <label id="label-actual-qty" style="color:var(--success-color); font-weight:bold; font-size:1.1rem; display:block; margin-bottom:8px;">✨ Cantidad Final Obtenida (Real):</label>
                                                <input type="number" id="prod-actual-qty" step="0.01" class="form-control" placeholder="Peso o Unids reales" required style="border: 2px solid var(--success-color); font-size:1.5rem; font-weight:bold; height:auto; padding:10px;">
                                            </div>
                                            <div id="yield-stats" style="flex:1; padding:10px; background:rgba(0,0,0,0.2); border-radius:8px; min-height:60px; display:flex; align-items:center; justify-content:center;">
                                                <!-- Cálculo de eficiencia en tiempo real -->
                                            </div>
                                        </div>
                                    </div>

                                    <button type="submit" class="btn-primary w-100 mt-20" style="padding:15px; font-size:1.1rem; border-radius:10px; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);">
                                        🚀 Registrar Producción y Ajustar Stock
                                    </button>
                                </form>
                            </div>
                        </div>


                    </div>

                    <!-- COLUMNA DERECHA: HISTORIAL Y ESTADÍSTICA -->
                    <div class="prod-column sidebar">
                        
                        <div class="card glass no-padding" style="overflow:hidden;">
                            <div style="padding: 20px; border-bottom: 1px solid var(--border-color);">
                                <h3 style="margin:0;">🕒 Registro Histórico</h3>
                            </div>
                            <div style="max-height: 80vh; overflow-y:auto;">
                                <table class="erp-table small-table">
                                    <thead style="position:sticky; top:0; background: var(--bg-card); z-index:10;">
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Tanda / Producto</th>
                                            <th>Rendimiento</th>
                                            <th>Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody id="table-prod-logs">
                                        <tr><td colspan="4" class="text-center">Consultando Kardex...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>

                </div>
            </div>

            <style>
                .production-main-grid {
                    display: grid;
                    grid-template-columns: 1.2fr 0.8fr;
                    gap: 24px;
                    padding: 0 20px;
                }
                .tab-btn {
                    flex: 1;
                    padding: 12px;
                    border: none;
                    background: transparent;
                    color: var(--text-muted);
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s;
                    border-bottom: 2px solid transparent;
                }
                .tab-btn.active {
                    color: var(--primary-color);
                    background: rgba(59, 130, 246, 0.05);
                    border-bottom: 2px solid var(--primary-color);
                }
                .pending-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .pending-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px;
                    background: rgba(255,255,255,0.03);
                    border-radius: 10px;
                    border-left: 4px solid var(--warning-color);
                }
                .override-row {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr;
                    gap: 10px;
                    align-items: center;
                    background: rgba(0,0,0,0.1);
                    padding: 8px 12px;
                    border-radius: 6px;
                }
                .override-row span { font-size:0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .override-row input { 
                    background: rgba(0, 0, 0, 0.3); 
                    border: 1px solid var(--border-color); 
                    color: white; 
                    padding: 4px 8px; 
                    border-radius: 4px; 
                    text-align:right; 
                    width: 100%; 
                    transition: all 0.2s;
                }
                .override-row input:focus {
                    border-color: var(--primary-color);
                    background: rgba(0, 0, 0, 0.5);
                    outline: none;
                    box-shadow: 0 0 5px rgba(59, 130, 246, 0.3);
                }
                .form-control {
                    background: rgba(0, 0, 0, 0.2) !important;
                    color: white !important;
                    border: 1px solid var(--border-color) !important;
                }
                .form-control:focus {
                    background: rgba(0, 0, 0, 0.4) !important;
                    border-color: var(--primary-color) !important;
                }

                /* ESTILOS DE IMPRESIÓN (HOJA DE TALLER) */
                @media print {
                    @page { margin: 1cm; }
                    
                    /* Reset Universal para Impresión */
                    * { 
                        color: #000 !important; 
                        text-shadow: none !important; 
                        background: transparent !important; 
                        box-shadow: none !important; 
                        opacity: 1 !important;
                        filter: none !important;
                    }

                    body { background: white !important; }
                    body * { visibility: hidden; }
                    
                    #form-production, #form-production * { visibility: visible; }
                    
                    #form-production { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%; 
                        background: white !important; 
                        padding: 0; 
                        border: none !important;
                    }

                    /* Ocultar elementos web */
                    header, .module-header, .kpi-grid, .sidebar, 
                    .btn-primary, #btn-reset-overrides, .export-tools, 
                    .tab-header, .small-text, #btn-reset-overrides { 
                        display: none !important; 
                    }

                    /* Títulos */
                    h1, h3, h4 { 
                        font-weight: bold !important; 
                        margin-bottom: 15px !important;
                        font-size: 1.4rem !important;
                        border-bottom: 2px solid #000 !important;
                        padding-bottom: 5px !important;
                    }

                    /* Campos de Formulario */
                    .form-group { margin-bottom: 15px !important; }
                    label { font-size: 0.9rem !important; margin-bottom: 4px !important; display: block; }
                    
                    .form-control, .override-input { 
                        border: none !important; 
                        font-size: 1.1rem !important;
                        font-weight: bold !important;
                        text-align: left !important;
                        padding: 0 !important;
                        height: auto !important;
                    }

                    /* Panel de Ingredientes */
                    #surgical-panel { border-top: 2px solid #000 !important; margin-top: 30px !important; }
                    
                    .override-row { 
                        display: grid !important;
                        grid-template-columns: 2fr 1fr 1fr !important;
                        border-bottom: 1px solid #ccc !important; 
                        padding: 8px 0 !important;
                        background: transparent !important;
                    }

                    .base-ingredient-row { 
                        border: 2px solid #000 !important; 
                        padding: 10px !important; 
                        margin: 5px 0 !important;
                    }

                    .ideal-label { font-weight: normal !important; color: #333 !important; }
                    
                    /* Rendimiento Final (Destacar en impresión) */
                    div[style*="background: rgba(16, 185, 129, 0.1)"] {
                        background: #f0f0f0 !important;
                        border: 2px solid #000 !important;
                        padding: 15px !important;
                        margin-top: 30px !important;
                    }
                    
                    #prod-actual-qty { font-size: 1.5rem !important; }
                }
            </style>
        `;
    },


    populateSelects(catalog, recipes) {
        const targetSelect = document.getElementById('prod-target-id');
        if (!targetSelect) return;

        const type = document.getElementById('prod-source-type').value;

        if (type === 'vitrina') {
            targetSelect.innerHTML = '<option value="">Selecciona producto de Vitrina...</option>' +
                (catalog || []).map(p => `<option value="${p.id}" data-type="vitrina">${p.name}</option>`).join('');
            document.getElementById('label-prod-target').innerText = "Producto a Hornear:";
            document.getElementById('label-prod-qty').innerText = "Unidades Esperadas:";
        } else {
            console.log(`[Diagnostic] Preparaciones encontradas: ${(recipes || []).length}`);
            targetSelect.innerHTML = '<option value="">Selecciona Preparación / Masa...</option>' +
                (recipes || []).map(r => `<option value="${r.id}" data-type="preparaciones">${r.name}</option>`).join('');
            document.getElementById('label-prod-target').innerText = "Masa o Relleno a producir:";
            document.getElementById('label-prod-qty').innerText = "Rendimiento Teórico (g/ml):";
        }
    },

    /**
     * Renderiza la lista de insumos para ajuste manual
     */
    renderSurgicalPanel(ingredients) {
        const panel = document.getElementById('surgical-panel');
        const list = document.getElementById('ingredients-overrides-list');
        if (!panel || !list) return;

        if (!ingredients || ingredients.length === 0) {
            panel.style.display = 'none';
            return;
        }

        panel.style.display = 'block';
        list.innerHTML = ingredients.map(ing => {
            const isBase = ing.percentage === 100 || ing.is_base;
            return `
                <div class="override-row ${isBase ? 'base-ingredient-row' : ''}" 
                     data-id="${ing.id}" 
                     data-type="${ing.type}" 
                     data-base="${ing.quantity}"
                     data-is-base="${isBase}">
                    <span style="${isBase ? 'font-weight:bold; color:var(--primary-color);' : ''}">
                        ${isBase ? '⚓ ' : ''}${ing.name}
                    </span>
                    <span style="opacity:0.6; text-align:right;" class="ideal-label">Ideal: ${Formatter.formatNumber(ing.quantity)}</span>
                    <input type="number" step="0.01" value="${ing.quantity.toFixed(2)}" class="override-input" ${isBase ? 'style="border: 2px solid var(--primary-color);"' : ''}>
                </div>
            `;
        }).join('');
    },

    renderHistory(logs, onDelete) {
        const tbody = document.getElementById('table-prod-logs');
        if (!tbody) return;

        if (logs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="padding:40px; opacity:0.5;">Aún no hay registros de producción V2.</td></tr>`;
            return;
        }

        tbody.innerHTML = logs.map(l => {
            const { date, time } = Formatter.formatDateTime(l.production_date);
            const yieldPercent = l.expected_quantity > 0 ? (l.actual_quantity / l.expected_quantity) * 100 : 100;
            const yieldColor = yieldPercent < 90 ? 'var(--danger-color)' : (yieldPercent > 105 ? 'var(--warning-color)' : 'var(--success-color)');

            return `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding:12px;">
                        <span style="display:block; font-size:0.85rem;">${date}</span>
                        <span style="font-size:0.75rem; opacity:0.5;">${time}</span>
                    </td>
                    <td>
                        <strong style="display:block;">${l.recipe_name || 'Tanda Producción'}</strong>
                        <span style="font-size:0.75rem; color:var(--text-muted);">${l.recipe_id ? '🥣 Prep. Intermedia' : '🏪 Producto Final'}</span>
                    </td>
                    <td>
                        <strong style="color:var(--text-color);">${Formatter.formatNumber(l.actual_quantity)}</strong>
                        <span style="display:block; font-size:0.75rem; color:${yieldColor}; font-weight:bold;">Ef: ${yieldPercent.toFixed(1)}%</span>
                    </td>
                    <td>
                        <button class="btn-icon btn-delete-log" data-id="${l.id}" style="opacity:0.5;">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.btn-delete-log').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                onDelete(btn.dataset.id);
            };
        });
    }
};
