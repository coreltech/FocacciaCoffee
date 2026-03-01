/**
 * Vista de Catálogo de Productos V2
 * Muestra el archivo maestro de productos terminados.
 */
import { Formatter } from '../../core/formatter.js';

export const CatalogView = {

  render(products, rates) {
    const usdRate = rates?.usd_to_ves || 0;

    // Solo mostramos activos por defecto
    const activeProducts = products.filter(p => p.is_active);
    const totalItems = activeProducts.length;

    return `
      <div class="v2-module-container fade-in">
        <h2 class="section-title">Catálogo de Productos (Mostrador/Preventa)</h2>
        
        <div class="kpi-grid">
          <div class="kpi-card">
            <span class="kpi-title">Productos Ofertados</span>
            <span class="kpi-value">${totalItems} Prod.</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-title">Infraestructura V2</span>
            <span class="kpi-value" style="font-size: 1rem; margin-top: 10px; font-weight: 500;">
              Base creada para enlazar <strong>Fórmulas Panaderas</strong>.
            </span>
          </div>
        </div>

        <div style="display:flex; gap: 24px; flex-wrap: wrap-reverse; margin-top:20px;">
          
          <div class="kpi-card" style="flex:2; min-width:550px; padding:0; overflow:hidden;">
            <div style="padding: 20px; border-bottom: 1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
              <h3 style="font-size:1.1rem; margin:0;">Archivo Maestro</h3>
              <input type="text" class="form-control" placeholder="Buscar pan o café..." style="max-width:250px;">
            </div>
            
            <div style="overflow-x: auto;">
              <table id="table-catalog" style="width: 100%; border-collapse: collapse; text-align:left;">
                    <th style="padding: 12px 20px;">Img</th>
                    <th style="padding: 12px 20px;">Producto Final</th>
                    <th style="padding: 12px 20px;">Costo (USD)</th>
                    <th style="padding: 12px 20px;">Precio (USD)</th>
                    <th style="padding: 12px 20px;">Margen</th>
                    <th style="padding: 12px 20px;">Stock Vitrina</th>
                    <th style="padding: 12px 20px;">Acciones</th>
                <tbody style="font-size: 0.95rem;">
                  ${activeProducts.length === 0 ? `<tr><td colspan="6" style="padding:20px; text-align:center; color:var(--text-muted);">El catálogo V2 está vacío.</td></tr>` : ''}
                  ${activeProducts.map(p => `
                    <tr style="border-bottom: 1px solid var(--border-color);">
                      <td style="padding: 16px 20px; width: 60px;">
                        ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}" style="width: 40px; height: 40px; border-radius: var(--radius-sm); object-fit: cover;">` : `<div style="width: 40px; height: 40px; border-radius: var(--radius-sm); background: var(--border-color); display:flex; align-items:center; justify-content:center; font-size: 0.8rem; color: var(--text-muted);">Sin Img</div>`}
                      </td>
                      <td style="padding: 16px 20px;">
                        <strong>${p.name}</strong><br>
                        <span style="font-size:0.75rem; color:var(--text-muted);">${p.category || 'General'}</span>
                      </td>
                      <td style="padding: 16px 20px; color: var(--text-muted);">${Formatter.formatCurrency(p.production_cost || 0)}</td>
                      <td style="padding: 16px 20px; font-weight: 600; color: var(--primary-color);">${Formatter.formatCurrency(p.price)}</td>
                      <td style="padding: 16px 20px;">
                        ${(() => {
        const cost = p.production_cost || 0;
        const price = p.price || 0;
        if (price <= 0) return '<span style="color:var(--text-muted);">-%</span>';
        const margin = ((price - cost) / price) * 100;
        const color = margin > 30 ? 'var(--success-color)' : (margin > 0 ? 'var(--warning-color)' : 'var(--danger-color)');
        return `<span style="font-weight:600; color:${color};">${margin.toFixed(1)}%</span>`;
      })()}
                      </td>
                      <td style="padding: 16px 20px; color:${p.stock <= 0 ? 'var(--warning-color)' : 'var(--success-color)'};">
                        ${p.stock || 0} unds.
                      </td>
                      <td style="padding: 16px 20px;">
                        <div style="display:flex; gap:8px;">
                          <button class="btn btn-outline btn-edit-prod" data-id="${p.id}" style="padding: 4px 8px; font-size: 0.8rem; border-color:var(--primary-color); color:var(--primary-color);">Editar</button>
                          <button class="btn btn-outline btn-disable-prod" data-id="${p.id}" style="padding: 4px 8px; font-size: 0.8rem;">Desactivar</button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Formulario V2 -->
          <div class="kpi-card" style="flex:1; min-width:340px; height: fit-content; border-top: 4px solid var(--success-color);">
            <h3 id="form-title" style="margin-bottom: 20px; font-size:1.1rem;">Añadir al Catálogo</h3>
            
            <form id="form-new-product">
              <input type="hidden" id="cat-id" value="">
              <div class="form-group">
                <label>Nombre Comercial (Mostrador)</label>
                <input type="text" class="form-control" id="cat-name" placeholder="Ej: Focaccia Tradicional" required>
              </div>

              <div class="form-group">
                <label>Categoría POS (Punto Venta)</label>
                <input list="pos-categories" id="cat-category" class="form-control" placeholder="Ej: Pizzería, Cafetería..." required>
                <datalist id="pos-categories">
                  <option value="Panadería">
                  <option value="Cafetería Caliente">
                  <option value="Cafetería Fría">
                  <option value="Bollería">
                  <option value="Mercería">
                </datalist>
              </div>

              <div style="display:flex; gap:10px; flex-wrap: wrap;">
                  <div class="form-group" style="flex:1; min-width: 150px;">
                    <label>Precio PV (USD)</label>
                    <input type="number" step="0.0001" class="form-control" id="cat-price" required>
                  </div>
                  <div class="form-group" style="flex:1; min-width: 150px;">
                    <label>Stock Físico Vitrina</label>
                    <input type="number" step="1" class="form-control" id="cat-stock" value="0">
                  </div>
              </div>

              <div class="form-group">
                 <label>Imagen del Producto</label>
                 <div style="display:flex; gap:10px; align-items:center;">
                    <div id="img-preview-container" style="width:50px; height:50px; border-radius:4px; background:#f1f5f9; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                       <span style="font-size:0.6rem; color:#94a3b8;">Sin Img</span>
                    </div>
                    <input type="file" class="form-control" id="cat-image-file" accept="image/*" style="font-size:0.8rem;">
                 </div>
                 <input type="hidden" id="cat-image-url" value="">
                 <small id="img-status" style="font-size:0.7rem; color:var(--text-muted); margin-top:4px; display:block;">Sube una foto desde tu PC</small>
              </div>

              <!-- Calculadora Matemática Integrada V2 -->
              <div style="background:var(--bg-body); padding:12px; margin-bottom:15px; border-radius:var(--radius-sm); border-left:4px solid var(--primary-color);">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                  <span style="font-size:0.85rem; color:var(--text-muted);">Costo Base Escandallo:</span>
                  <strong id="live-cost-usd" style="color:var(--text-color);">${Formatter.formatCurrency(0)}</strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span style="font-size:0.85rem; color:var(--text-muted);">Margen de Ganancia (Bruto):</span>
                  <strong id="live-margin-pct" style="color:var(--success-color);">0%</strong>
                </div>
              </div>

              <!-- Constructor de Escandallo (BOM) V2 (Sistema de Carrito) -->
              <div style="margin-bottom: 20px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                  <h4 style="margin:0 0 10px 0; font-size: 1rem; color: var(--primary-color);">Composición (Masa + Adornos + Empaque)</h4>
                  
                  <div style="display:flex; gap:10px; align-items:flex-end; margin-bottom: 15px; flex-wrap: wrap;">
                      <div class="form-group" style="flex:3; min-width: 200px; margin-bottom:0;">
                          <label style="font-size:0.8rem; color:var(--text-muted);">Masa o Insumo</label>
                          <select class="form-control" id="comp-selector">
                             <!-- Opciones cargadas vía JS desde el Controller -->
                          </select>
                      </div>
                      <div class="form-group" style="flex:1; min-width: 120px; margin-bottom:0;">
                          <label style="font-size:0.8rem; color:var(--text-muted);">Cantidad</label>
                          <input type="number" step="0.0001" class="form-control" id="comp-quantity" placeholder="Ej. 350">
                      </div>
                      <div class="form-group" style="margin-bottom:0; flex-grow: 1;">
                          <button type="button" class="btn btn-primary" id="btn-add-comp-pill" style="padding: 10px 15px; width: 100%;">➕ Añadir</button>
                      </div>
                  </div>

                  <!-- Lista de Componentes Agregados -->
                  <div id="components-list-container" style="display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto; padding: 5px; border: 1px dashed #cbd5e1; border-radius: 6px; background: white;">
                      <div style="text-align:center; padding: 20px; color: var(--text-muted); font-size: 0.85rem;" id="empty-comp-msg">
                         Agrega la masa cruda y los adornos de este producto.
                      </div>
                  </div>
              </div>

              <span style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom: 10px;">Nota: El stock se inyectará automáticamente desde el Módulo de Producción (Fase 2) usando el escandallo arriba definido.</span>

              <button type="submit" class="btn btn-success" style="width:100%;">Crear Archivo Maestro</button>
            </form>
          </div>

        <!-- Estilos Específicos para Móviles -->
        <style>
          @media (max-width: 768px) {
              .v2-module-container > div[style*="display:flex; gap: 24px;"] {
                  flex-direction: column !important;
              }
              .kpi-card[style*="min-width:550px"], .kpi-card[style*="min-width:340px"] {
                  min-width: 100% !important;
              }
              form#form-new-product div[style*="display:flex"] {
                  flex-direction: column !important;
                  align-items: stretch !important;
              }
              .comp-row {
                  flex-direction: column !important;
                  align-items: stretch !important;
              }
              .comp-row > div {
                  width: 100% !important;
              }
              .comp-row .btn-remove-comp {
                  width: 100%;
                  margin-top: 5px;
              }
              .form-group {
                  width: 100% !important;
              }
              /* Ocultar columnas menos relevantes en móvil para la tabla larga */
              #table-catalog th:nth-child(3),
              #table-catalog td:nth-child(3),
              #table-catalog th:nth-child(5),
              #table-catalog td:nth-child(5) {
                 display: none;
              }
          }
        </style>

      </div>
    `;
  },

  // Generador de Fila Dinámica de Componente JS
  generateComponentRow(optionsHtml) {
    return `
      <div class="comp-row form-group" style="display:flex; gap:10px; align-items:center; margin-bottom:10px; background: var(--bg-main); padding: 10px; border-radius: var(--radius-sm); flex-wrap: wrap;">
          <div style="flex:2; min-width: 180px; margin:0;">
             <select class="form-control row-item" required>
                <option value="">Seleccionar Masa o Insumo...</option>
                ${optionsHtml}
             </select>
          </div>
          <div style="flex:1; min-width: 120px; margin:0; display:flex; align-items:center;">
             <input type="number" step="0.0001" class="form-control row-qty" placeholder="Cantidad" required>
          </div>
          <div>
            <button type="button" class="btn btn-outline btn-remove-comp" style="color:var(--danger-color); border-color:var(--danger-color); padding: 6px;">🗑️</button>
          </div>
      </div>
      `;
  }
};
