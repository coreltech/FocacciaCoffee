/**
 * Vista de Tasas (UI Layer V2)
 * Se prohíbe lógica pesada aquí, puras plantillas de renderizado basadas en estado.
 */

export const SettingsView = {

  render(state) {
    const isManual = state?.is_manual || false;
    const usd = state?.usd_to_ves || '0.00';
    const eur = state?.eur_to_usd || '0.00';
    const bcvDate = state?.bcv_updated_at ? new Date(state.bcv_updated_at).toLocaleString() : 'N/A';

    return `
      <div class="v2-module-container fade-in">
        <h2 class="section-title">Configuración de Tasas (V2)</h2>
        
        <div style="display:flex; gap: 24px; flex-wrap: wrap; margin-top:20px;">
          
          <!-- Card Tasa Actual -->
          <div class="kpi-card" style="flex:1; min-width:300px; border-top: 4px solid var(--primary-color);">
            <h3 style="margin-bottom: 20px; font-size:1.1rem;">Tasa de Cambio Activa</h3>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
              <div style="background: var(--bg-main); padding: 16px; border-radius: var(--radius-md); text-align:center;">
                <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">1 USD ($)</div>
                <div style="font-size:1.5rem; font-weight:700; margin:10px 0;">Bs. <span id="display-usd">${usd}</span></div>
              </div>
              <div style="background: var(--bg-main); padding: 16px; border-radius: var(--radius-md); text-align:center;">
                <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">1 EUR (€)</div>
                <div style="font-size:1.5rem; font-weight:700; margin:10px 0;">$ <span id="display-eur">${eur}</span></div>
              </div>
            </div>

            <div style="margin-top: 16px; font-size: 0.85rem; color: var(--text-muted); text-align:center;">
              <p>Fuente: <strong>${isManual ? 'Manual / Personalizada' : 'Banco Central (BCV)'}</strong></p>
              ${!isManual ? `<p>Última actualización BCV: ${bcvDate}</p>` : ''}
            </div>
          </div>

          <!-- Card Formulario de Actualización -->
          <div class="kpi-card" style="flex:1; min-width:300px;">
            <h3 style="margin-bottom: 20px; font-size:1.1rem;">Actualización Manual</h3>
            
            <form id="form-update-rates">
              <div class="form-group">
                <label for="input-usd">Tasa USD/VES (Bs.)</label>
                <input type="number" step="0.0001" class="form-control" id="input-usd" value="${usd}" required>
              </div>
              
              <div class="form-group">
                <label for="input-eur">Tasa EUR/USD ($)</label>
                <input type="number" step="0.0001" class="form-control" id="input-eur" value="${eur}" required>
              </div>

              <div style="display:flex; gap: 10px; margin-top: 24px;">
                <button type="submit" class="btn btn-primary" style="flex:1;">Guardar Nueva Tasa</button>
                <button type="button" class="btn btn-outline" id="btn-sync-bcv">🔄 Sincronizar BCV</button>
              </div>
            </form>
          </div>

        </div>

        <div style="margin-top: 40px; padding: 20px; background: #fffcf0; border-left: 4px solid var(--warning-color); border-radius: var(--radius-md);">
          <h4 style="color: #b45309; margin-bottom: 8px;">ℹ️ Arquitectura V2</h4>
          <p style="font-size:0.9rem; color: #78350f;">Al guardar esta tasa, se inyectará automáticamente en el <strong>Store Central V2</strong>. Todos los módulos como Ventas o Producción, que lean la tasa del Store, recalcularán automáticamente sus precios sin necesidad de recargar la página ni hacer nuevas peticiones a base de datos. Esto elimina dependencias cruzadas y el efecto dominó de la versión anterior.</p>
        </div>
      </div>
    `;
  }
};
