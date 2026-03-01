/**
 * Vista de Suministros V2 (Materia Prima)
 * Puros Template Literals. Sin lógica acoplada.
 */
import { Formatter } from '../../core/formatter.js';

export const SuppliesView = {

  render(supplies, rates) {
    const usdRate = rates?.usd_to_ves || 0;

    // Calcular totales para KPIs
    const totalItems = supplies.length;
    let criticalStock = 0;
    const inventoryValuationUsd = supplies.reduce((acc, sum) => {
      if (sum.stock <= sum.min_stock) criticalStock++;
      return acc + (sum.stock * sum.last_price);
    }, 0);

    return `
      <div class="v2-module-container fade-in">
        <h2 class="section-title">Inventario de Suministros (Form. Panadera)</h2>
        
        <!-- KPIs Superiores -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <span class="kpi-title">Total Suministros</span>
            <span class="kpi-value">${totalItems} Items</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-title">Alertas de Stock</span>
            <span class="kpi-value" style="color:${criticalStock > 0 ? 'var(--danger-color)' : 'var(--success-color)'};">
              ${criticalStock} Críticos
            </span>
          </div>
          <div class="kpi-card">
            <span class="kpi-title">Valoración Inv. Bruto</span>
            <span class="kpi-value">${Formatter.formatCurrency(inventoryValuationUsd)}</span>
            <span class="kpi-trend">Bs. ${Formatter.formatNumber(inventoryValuationUsd * usdRate)}</span>
          </div>
        </div>

        <div style="display:flex; gap: 24px; flex-wrap: wrap; margin-top:20px;">
          
          <!-- Formulario de Ingreso Módulo -->
          <div class="kpi-card" style="flex:1; min-width:300px; max-width: 400px; height: fit-content; align-self: flex-start; border-top: 4px solid var(--primary-color);">
            <h3 style="margin-bottom: 20px; font-size:1.1rem;">Nuevo Ingrediente</h3>
            
            <form id="form-new-supply">
              <div class="form-group">
                <label>Nombre (Ej: Tomates, Harina Todo Uso)</label>
                <input type="text" class="form-control" id="sup-name" required>
              </div>

              <div style="display:flex; gap:10px; flex-wrap: wrap;">
                  <div class="form-group" style="flex:1; min-width: 200px;">
                    <label>Categoría (Escribe o Selecciona)</label>
                    <input list="category-options" id="sup-cat" class="form-control" placeholder="Ej: Vegetales..." required>
                    <datalist id="category-options">
                      <option value="Vegetales y Frutas">
                      <option value="Lácteos y Quesos">
                      <option value="Proteínas y Embutidos">
                      <option value="Secos y Despensa">
                      <option value="Harinas y Granos">
                      <option value="Empaques">
                    </datalist>
                  </div>
              </div>

              <div style="display:flex; gap:10px; flex-wrap: wrap;">
                <div class="form-group" style="flex:1; min-width: 120px;">
                  <label>Stock Inicial</label>
                  <input type="number" step="0.0001" class="form-control" id="sup-stock" required>
                </div>
                <div class="form-group" style="flex:1; min-width: 120px;">
                  <label>Alerta Mínima</label>
                  <input type="number" step="0.0001" class="form-control" id="sup-min" required>
                </div>
              </div>

              <div style="display:flex; gap:10px; flex-wrap: wrap;">
                <div class="form-group" style="flex:2; min-width: 200px;">
                  <label>Unidad de Medida (Compra)</label>
                  <select class="form-control" id="sup-unit" required>
                    <option value="Kg">Kilogramos (Kg)</option>
                    <option value="g">Gramos (g)</option>
                    <option value="L">Litros (L)</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="Unidad">Unidad Fija (Piezas)</option>
                  </select>
                </div>
              </div>

               <div style="display:flex; gap:10px; flex-wrap: wrap;">
                <div class="form-group" style="flex:1.5; min-width: 150px;">
                  <label>Precio Compra</label>
                  <input type="number" step="0.0001" class="form-control" id="sup-price" required>
                </div>
                <div class="form-group" style="flex:1; min-width: 120px;">
                    <label>Por (Cant)</label>
                    <input type="number" step="0.01" class="form-control" id="sup-format" placeholder="Ej: 200" required>
                </div>
                <div class="form-group" style="flex:1; min-width: 120px;">
                  <label>Moneda</label>
                  <select class="form-control" id="sup-currency">
                    <option value="USD">USD ($)</option>
                    <option value="VES">Bs (Ves)</option>
                  </select>
                  <div id="sup-price-converted" style="font-size: 0.75rem; color: var(--primary-color); margin-top: 5px; font-weight: 600;"></div>
                </div>
              </div>

              <div class="form-group">
                 <label>Proveedor Frecuente (Opcional)</label>
                 <input type="text" class="form-control" id="sup-supplier" placeholder="Opcional">
              </div>

              <div style="margin: 10px 0; font-size: 0.8rem; color: var(--text-muted); background: var(--bg-main); padding: 10px; border-radius: var(--radius-md);">
                ℹ️ <strong>Magia Panadera:</strong> Si ingresas "10" Kilos a "$15", el sistema calculará internamente 10.000g y dividirá el costo por gramo automáticamente para las Fórmulas.
              </div>

              <button type="submit" class="btn btn-primary" style="width:100%; margin-top: 10px;">➕ Agregar al Inventario</button>
            </form>
          </div>

          <!-- Lista de Suministros (Tabla) -->
          <div class="kpi-card" style="flex:2; min-width:600px; padding:0; overflow:hidden;">
            <div style="padding: 20px; border-bottom: 1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
              <h3 style="font-size:1.1rem; margin:0;">Registro de Materia Prima</h3>
              <input type="text" class="form-control" placeholder="Buscar ingrediente..." style="max-width:250px;">
            </div>
            
            <div style="overflow-x: auto;">
              <table id="table-supplies" style="width: 100%; border-collapse: collapse; text-align:left;">
                <thead style="background: var(--bg-main); color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase;">
                  <tr>
                    <th style="padding: 12px 20px;">Ingrediente</th>
                    <th style="padding: 12px 20px;">Stock / Unidad</th>
                    <th style="padding: 12px 20px;">Costo Unit. ($)</th>
                    <th style="padding: 12px 20px;">Valor (Bs.)</th>
                    <th style="padding: 12px 20px;">Acciones</th>
                  </tr>
                </thead>
                <tbody style="font-size: 0.95rem;">
                  ${supplies.length === 0 ? `<tr><td colspan="5" style="padding:20px; text-align:center; color:var(--text-muted);">Sin suministros registrados en la base de datos.</td></tr>` : ''}
                  ${supplies.map(sup => `
                    <tr style="border-bottom: 1px solid var(--border-color); ${sup.stock <= sup.min_stock ? 'background: #fef2f2;' : ''}">
                      <td style="padding: 16px 20px;">
                        <strong>${sup.name}</strong><br>
                        <span style="font-size:0.75rem; color:var(--text-muted);">${sup.category || 'Sin Cat'}</span>
                      </td>
                      <td style="padding: 16px 20px; color:${sup.stock <= sup.min_stock ? 'var(--danger-color)' : 'var(--text-main)'};">
                        <strong>${Formatter.formatNumber(sup.stock)} ${sup.measurement_unit}</strong>
                         ${sup.stock <= sup.min_stock ? '<br><span style="font-size:0.75rem;">¡Pedir!</span>' : ''}
                      </td>
                      <td style="padding: 16px 20px;">${Formatter.formatCurrency(sup.last_price)}</td>
                      <td style="padding: 16px 20px;">Bs. ${Formatter.formatNumber(sup.last_price * usdRate)}</td>
                      <td style="padding: 16px 20px;">
                        <button class="btn btn-outline btn-edit-supply" data-id="${sup.id}" data-supply='${JSON.stringify(sup).replace(/'/g, "&#39;")}' style="padding: 4px 8px; margin-right: 5px;">✏️</button>
                        <button class="btn btn-outline btn-del-supply" data-id="${sup.id}" style="padding: 4px 8px; color:var(--danger-color); border-color:var(--danger-color);">🗑️</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Modal Editar Suministro -->
        <div id="modal-edit-supply" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.8); z-index: 9999; justify-content: center; align-items: center; backdrop-filter: blur(5px);">
          <div style="background: var(--bg-card, #ffffff); padding: 30px; border-radius: 12px; width: 90%; max-width: 500px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid var(--border-color); position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 15px;">
              <h3 style="margin: 0; font-size: 1.25rem;">✏️ Editar Suministro</h3>
              <button type="button" class="btn-close-modal" style="background: var(--danger-color, #ef4444); color: white; border: none; border-radius: 50%; width: 30px; height: 30px; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1;">&times;</button>
            </div>
            
            <form id="form-edit-supply">
              <input type="hidden" id="edit-sup-id">
              
              <div class="form-group">
                <label>Nombre</label>
                <input type="text" class="form-control" id="edit-sup-name" required>
              </div>

              <div style="display:flex; gap:10px; flex-wrap: wrap;">
                <div class="form-group" style="flex:1; min-width: 200px;">
                  <label>Categoría</label>
                  <input type="text" id="edit-sup-cat" class="form-control" required>
                </div>
                <div class="form-group" style="flex:1; min-width: 200px;">
                  <label>Unidad de Medida</label>
                  <select class="form-control" id="edit-sup-unit" required>
                    <option value="g">Gramos (g)</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="Unidad">Unidad Fija (Piezas)</option>
                  </select>
                </div>
              </div>

              <div style="display:flex; gap:10px; flex-wrap: wrap;">
                <div class="form-group" style="flex:1; min-width: 120px;">
                  <label>Stock Actual</label>
                  <input type="number" step="0.0001" class="form-control" id="edit-sup-stock" required>
                </div>
                <div class="form-group" style="flex:1; min-width: 120px;">
                  <label>Alerta Mínima</label>
                  <input type="number" step="0.0001" class="form-control" id="edit-sup-min" required>
                </div>
              </div>

               <div style="display:flex; gap:10px; flex-wrap: wrap;">
                <div class="form-group" style="flex:1.5; min-width: 200px;">
                  <label>Costo Pago</label>
                  <div style="display: flex; gap: 5px;">
                    <input type="number" step="0.0001" class="form-control" id="edit-sup-price" required style="flex: 2;">
                    <select class="form-control" id="edit-sup-currency" style="flex: 1;">
                      <option value="USD">$</option>
                      <option value="VES">Bs</option>
                    </select>
                  </div>
                  <div id="edit-sup-price-converted" style="font-size: 0.75rem; color: var(--primary-color); margin-top: 5px; font-weight: 600;"></div>
                </div>
                <div class="form-group" style="flex:1; min-width: 120px;">
                    <label>Formato (Cant)</label>
                    <input type="number" step="0.01" class="form-control" id="edit-sup-format" placeholder="Ej: 200" required>
                </div>
                <div class="form-group" style="flex:1; min-width: 150px;">
                  <label>Proveedor Favorito</label>
                  <input type="text" class="form-control" id="edit-sup-supplier">
                </div>
              </div>

              <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button type="button" class="btn btn-outline btn-close-modal" style="flex: 1;">Cancelar</button>
                <button type="submit" class="btn btn-primary" style="flex: 1;">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Estilos Específicos para Móviles -->
        <style>
          @media (max-width: 768px) {
              .v2-module-container > div[style*="display:flex; gap: 24px;"] {
                  flex-direction: column !important;
              }
              .kpi-card[style*="min-width:600px"], .kpi-card[style*="min-width:300px"] {
                  min-width: 100% !important;
              }
              form#form-new-supply div[style*="display:flex"],
              form#form-edit-supply div[style*="display:flex"] {
                  flex-direction: column !important;
              }
              .form-group {
                  width: 100% !important;
              }
              /* Ocultar columnas menos relevantes en móvil para la tabla larga */
              #table-supplies th:nth-child(3),
              #table-supplies td:nth-child(3),
              #table-supplies th:nth-child(4),
              #table-supplies td:nth-child(4) {
                 display: none;
              }
          }
        </style>

      </div>
    `;
  }
};
