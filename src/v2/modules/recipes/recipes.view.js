/**
 * Vista de Recetas V2 (Fórmula Panadera)
 * Interfaz dividida: Maestro de Masas (Izquierda) y Constructor de Fórmulas (Derecha).
 */
import { Formatter } from '../../core/formatter.js';

export const RecipesView = {

  render(recipes, supplies, rates) {
    const usdRate = rates?.usd_to_ves || 0;
    const totalRecipes = recipes.length;

    return `
      <div class="v2-module-container fade-in">
        <h2 class="section-title">Fórmulas Panaderas (Recetario V2)</h2>
        
        <div class="kpi-grid">
          <div class="kpi-card">
            <span class="kpi-title">Masas / Preparaciones</span>
            <span class="kpi-value">${totalRecipes} Activas</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-title">Motor Matemático</span>
            <span class="kpi-value" style="font-size: 1rem; margin-top: 10px; color:var(--info-color);">
              Basado en <strong>Ingrediente Ancla (100%)</strong>
            </span>
          </div>
        </div>

        <div style="display:flex; gap: 24px; flex-wrap: wrap; margin-top:20px;">
          
          <!-- Lista de Recetas (Izquierda en Desktop, Arriba en Mobile) -->
          <div class="kpi-card" style="flex: 1 1 400px; padding:0; overflow:hidden; max-height:85vh; overflow-y:auto; border-top: 4px solid var(--info-color);">
            <div style="padding: 20px; border-bottom: 1px solid var(--border-color); background: var(--bg-main); display:flex; justify-content:space-between; align-items:center;">
              <h3 style="font-size:1.1rem; margin:0;">Archivo Maestro de Masas</h3>
              <span class="small-text" style="color:var(--text-muted);">Stock actual en cámara</span>
            </div>
            
            <div style="padding: 10px;">
                ${recipes.length === 0 ? `<p style="padding:20px; text-align:center; color:var(--text-muted);">Sin recetas. Crea tu primera fórmula a la derecha.</p>` : ''}
                ${recipes.map(r => `
                  <div class="recipe-card" style="border: 1px solid var(--border-color); padding: 15px; border-radius: var(--radius-md); margin-bottom: 10px; cursor:pointer; position:relative;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong>🍽️ ${r.name}</strong>
                        <span style="font-size: 0.8rem; background: var(--border-color); padding: 3px 8px; border-radius: 10px;">${r.expected_weight}g/ml</span>
                    </div>

                    <div style="margin-top: 8px; display:flex; align-items:center; gap:10px;">
                        <div style="background: rgba(16, 185, 129, 0.1); color: var(--success-color); padding: 4px 10px; border-radius: 6px; font-size: 0.9rem; font-weight: bold; border: 1px solid rgba(16, 185, 129, 0.2);">
                           📦 ${Formatter.formatNumber(r.stock || 0)} g/ml
                        </div>
                        <span style="font-size: 0.75rem; color:var(--text-muted);">Disponible para producción</span>
                    </div>
                    
                    <!-- Integración Costo Vivo V2 -->
                    <div style="margin-top: 12px; display:flex; justify-content:space-between; align-items:flex-end; background: var(--bg-main); padding: 10px; border-radius: 8px;">
                        <div style="font-size: 0.85rem; color: var(--text-muted);">
                           ${r.ingredient_count || 0} Componentes<br>
                           <strong style="color:var(--text-color);">Costo (1 Kg): ${Formatter.formatCurrency(r.calculated_cost_1kg || 0)}</strong>
                        </div>
                        <div style="text-align:right;">
                           <span style="font-size: 0.75rem; color:var(--text-muted); display:block;">Costo x Gramo</span>
                           <strong style="color:var(--success-color); font-size:1.1rem;">${Formatter.formatCurrency(Number(r.calculated_cost_1kg || 0) / 1000, 5)}</strong>
                        </div>
                    </div>
                    
                    <div style="margin-top: 10px; display:flex; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--border-color); padding-top:10px;">
                       <button class="btn btn-outline btn-view-instructions" data-id="${r.id}" data-instructions="${(r.instructions || "").replace(/"/g, '&quot;').replace(/'/g, '&#39;')}" style="padding: 4px 10px; color:var(--info-color); border-color:var(--info-color); font-size:0.8rem;">📖 Ver</button>
                       <button class="btn btn-outline btn-edit-recipe" data-id="${r.id}" style="padding: 4px 10px; color:var(--primary-color); border-color:var(--primary-color); font-size:0.8rem;">✏️ Editar</button>
                       <button class="btn btn-outline btn-del-recipe" data-id="${r.id}" style="padding: 4px 10px; color:var(--danger-color); border-color:var(--danger-color); font-size:0.8rem;">🗑️ Borrar</button>
                    </div>
                  </div>
                `).join('')}
            </div>
          </div>

          <!-- Constructor de Fórmula (Derecha) -->
          <div class="kpi-card" style="flex:2; min-width:550px; height: fit-content; border-top: 4px solid var(--primary-color);">
            <h3 style="margin-bottom: 20px; font-size:1.1rem;">Calculadora de Fórmula Panadera</h3>
            
            <form id="form-new-recipe">
              
              <div style="display:flex; gap:10px; margin-bottom: 20px;">
                  <div class="form-group" style="flex:2;">
                    <label>Nombre de la Masa o Preparación</label>
                    <input type="text" class="form-control" id="rec-name" placeholder="Ej: Masa Madre Blanca 70% Hidrat." required>
                  </div>
                  <div class="form-group" style="flex:1;">
                    <label>Tipo</label>
                    <select class="form-control" id="rec-type" required>
                      <option value="MASA">Masa / Mezcla</option>
                      <option value="RELLENO">Relleno / Salsa</option>
                      <option value="BEBIDA">Bebida</option>
                    </select>
                  </div>
              </div>

              <!-- Ancla Base -->
              <div style="background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); padding: 15px; border-radius: var(--radius-md); margin-bottom: 20px;">
                  <h4 style="margin: 0 0 10px 0; color: var(--primary-color);">1. Ingrediente Ancla (El 100%)</h4>
                  <div style="display:flex; gap:10px; align-items: end;">
                      <div class="form-group" style="flex:2; margin:0;">
                         <label>Materia Prima Base</label>
                         <select class="form-control" id="rec-base-supply" required>
                            <option value="">Selecciona ingrediente (Harina, etc)...</option>
                            ${supplies.map(s => `<option value="${s.id}">${s.name} (${s.measurement_unit})</option>`).join('')}
                         </select>
                      </div>
                      <div class="form-group" style="flex:1; margin:0;">
                         <label>Peso de Prueba (g/ml)</label>
                         <input type="number" step="1" class="form-control" id="rec-base-weight" placeholder="Ej: 1000" required>
                      </div>
                      <div class="form-group" style="flex:0.5; margin:0;">
                         <label>% Base</label>
                         <input type="text" class="form-control" value="100%" disabled style="text-align:center; font-weight:bold; color:var(--primary-color);">
                      </div>
                  </div>
              </div>

              <!-- Ingredientes Relativos (Nuevo Sistema de Carrito) -->
              <div style="margin-bottom: 20px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                  <h4 style="margin:0 0 10px 0; font-size: 1rem;">2. Agregar Ingredientes Relativos (%)</h4>
                  
                  <div style="display:flex; gap:10px; align-items:flex-end; margin-bottom: 15px;">
                      <div class="form-group" style="flex:3; margin-bottom:0;">
                          <label style="font-size:0.8rem; color:var(--text-muted);">Selecciona Insumo o Sub-Receta</label>
                          <select class="form-control" id="supply-selector">
                             <!-- Opciones cargadas vía JS: Grupos de Insumos y Grupos de Recetas -->
                          </select>
                      </div>
                      <div class="form-group" style="flex:1; margin-bottom:0;">
                          <label style="font-size:0.8rem; color:var(--text-muted);">Porcentaje (%)</label>
                          <input type="number" class="form-control" id="supply-percentage" placeholder="Ej. 2.5" step="0.01">
                      </div>
                      <div class="form-group" style="margin-bottom:0;">
                          <button type="button" class="btn btn-primary" id="btn-add-ingredient" style="padding: 10px 20px;">➕ Añadir</button>
                      </div>
                  </div>

                  <!-- Lista Visual (Área donde se dibujarán las píldoras / filas guardadas) -->
                  <h5 style="margin: 0 0 10px 0; font-size: 0.9rem; color: #475569;">Lista de Ingredientes en Fórmula:</h5>
                  <div id="ingredients-list-container" style="display: flex; flex-direction: column; gap: 8px; max-height: 250px; overflow-y: auto; padding: 5px; border: 1px dashed #cbd5e1; border-radius: 6px;">
                      <div style="text-align:center; padding: 20px; color: var(--text-muted); font-size: 0.85rem;" id="empty-rows-msg">
                         Agrega sal, levadura, agua o incluso otras masas/rellenos arriba.
                      </div>
                  </div>
              </div>

              <!-- Totales Dinámicos -->
              <div style="border-top: 2px dashed var(--border-color); padding-top: 20px; margin-bottom: 20px; display:flex; justify-content: space-between; align-items:center;">
                  <div>
                      <span style="display:block; font-size:0.8rem; color:var(--text-muted);">Sumatoria de Porcentajes</span>
                      <strong style="font-size:1.2rem;" id="total-percent">100%</strong>
                  </div>
                  <div style="text-align:center;">
                      <span style="display:block; font-size:0.8rem; color:var(--text-muted);">Rendimiento Total Esperado</span>
                      <strong style="font-size:1.5rem; color:var(--success-color);" id="total-grams">0 g</strong>
                  </div>
                  <div style="text-align:right;">
                      <span style="display:block; font-size:0.8rem; color:var(--text-muted);">Costo Total de F. Panadera</span>
                      <strong style="font-size:1.5rem; color:var(--text-color);" id="total-cost-usd">${Formatter.formatCurrency(0)}</strong>
                      <span style="display:block; font-size:0.8rem; color:var(--success-color); margin-top:2px;" id="cost-per-gram">(${Formatter.formatCurrency(0, 5)} / gramo o ml)</span>
                  </div>
              </div>

              <div class="form-group" style="margin-bottom: 20px;">
                  <label>Instrucciones de Preparación (Opcional)</label>
                  <textarea class="form-control" id="rec-instructions" rows="4" placeholder="Escribe aquí los pasos paso a paso..." style="resize: vertical;"></textarea>
              </div>

              <button type="submit" class="btn btn-primary" style="width:100%; font-size: 1.1rem;">💾 Guardar Fórmula en BD</button>
            </form>
          </div>

        </div>
      </div>

      <!-- Modal de Lectura Cómoda para Instrucciones -->
       <div id="modal-view-instructions" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.85); z-index: 99999; justify-content: center; align-items: center; backdrop-filter: blur(8px);">
          <div style="background: var(--bg-card, #ffffff); padding: 40px; border-radius: 16px; width: 90%; max-width: 700px; max-height: 90vh; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); border: 1px solid var(--border-color); position: relative; overflow-y: auto;">
             <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 25px; border-bottom: 2px solid var(--primary-color); padding-bottom: 15px;">
                <h3 id="view-rec-name-title" style="margin:0; font-size: 1.5rem; color: var(--primary-color);">📖 Preparación</h3>
                <button type="button" class="btn-close-instructions" style="background: var(--danger-color); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold;">&times;</button>
             </div>
             <div id="view-rec-content" style="font-size: 1.1rem; line-height: 1.7; color: var(--text-main); white-space: pre-wrap; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;">
                <!-- Contenido dinámico -->
             </div>
             <div style="margin-top: 30px; text-align: center;">
                <button type="button" class="btn btn-primary btn-close-instructions" style="padding: 10px 30px;">Entendido</button>
             </div>
          </div>
       </div>
    `;
  }
};
