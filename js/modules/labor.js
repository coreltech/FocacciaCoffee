// js/modules/labor.js

import { supabase } from '../supabase.js';

export async function loadLabor() {
  const container = document.getElementById('app-content');
  if (!container) return;

  try {
    const today = new Date().toISOString().split('T')[0];
    
    container.innerHTML = `
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <h2>⏱️ Horas-Hombre</h2>
          <button class="btn-primary" id="open-labor-modal">+ Nueva Entrada</button>
        </div>
        <div id="labor-list-placeholder">
          <p>Cargando registros...</p>
        </div>
      </div>

      <div id="labor-modal" class="modal" style="display:none;">
        <div class="modal-content">
          <h3>Nueva Entrada de Horas</h3>
          <form id="labor-form">
            <div style="margin-bottom:16px;">
              <label>Fecha de las horas</label>
              <input type="date" id="labor-date" value="${today}" required 
                     style="width:100%; padding:10px; margin-top:6px; border:1px solid #ddd; border-radius:8px;" />
            </div>
            <div style="margin-bottom:16px;">
              <label>Actividad</label>
              <input type="text" id="labor-activity" value="Producción" required 
                     style="width:100%; padding:10px; margin-top:6px; border:1px solid #ddd; border-radius:8px;" />
            </div>
            <div style="margin-bottom:16px;">
              <label>Horas (ej: 2.5)</label>
              <input type="number" id="labor-hours" step="0.25" min="0.25" value="1" required 
                     style="width:100%; padding:10px; margin-top:6px; border:1px solid #ddd; border-radius:8px;" />
            </div>
            <div style="margin-bottom:16px;">
              <label>Tarifa por hora (VES)</label>
              <input type="number" id="rate-ves" step="0.01" placeholder="0.00"
                     style="width:100%; padding:10px; margin-top:6px; border:1px solid #ddd; border-radius:8px;" />
            </div>
            <div style="display:flex; gap:12px;">
              <button type="submit" class="btn-primary" style="flex:1;">Registrar Horas</button>
              <button type="button" id="close-labor-modal" class="btn-outline" style="flex:1;">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('open-labor-modal').onclick = () => {
      document.getElementById('labor-modal').style.display = 'block';
      document.getElementById('rate-ves').value = '100.00';
    };
    document.getElementById('close-labor-modal').onclick = () => {
      document.getElementById('labor-modal').style.display = 'none';
    };

    document.getElementById('labor-form').onsubmit = async (e) => {
      e.preventDefault();
      const date = document.getElementById('labor-date').value;
      const activity = document.getElementById('labor-activity').value.trim();
      const hours = parseFloat(document.getElementById('labor-hours').value);
      const rate = parseFloat(document.getElementById('rate-ves').value);
      if (!activity || isNaN(hours) || hours <= 0 || isNaN(rate) || rate <= 0) {
        alert('⚠️ Verifica datos.');
        return;
      }

      try {
        const { error } = await supabase.from('labor').insert({
          date: date,
          hours: hours,
          activity: activity,
          hourly_rate: rate,
          original_hourly_rate: rate,
          original_currency: 'VES'
        });

        if (error) throw error;
        document.getElementById('labor-modal').style.display = 'none';
        loadLaborList();
        alert(`✅ ${hours}h registradas el ${date}`);

      } catch (err) {
        alert('❌ Error: ' + err.message);
      }
    };

    loadLaborList();
  } catch (err) {
    container.innerHTML = `<div class="card"><p>❌ Error: ${err.message}</p></div>`;
  }
}

async function loadLaborList() {
  const container = document.getElementById('labor-list-placeholder');
  if (!container) return;

  try {
    // ✅ CORRECTO: data: labor
    const {  data: labor, error: laborError } = await supabase
      .from('labor')
      .select('*')
      .order('date', { ascending: false })
      .limit(50);
    
    if (laborError) throw laborError;

    let html = '<div style="overflow-x:auto; margin-top:20px;"><table class="data-table">';
    html += '<thead><tr><th>Fecha</th><th>Actividad</th><th>Horas</th><th>Tarifa (VES)</th><th>Costo</th><th>Acciones</th></tr></thead><tbody>';

    for (const l of labor || []) {
      const cost = l.hours * l.hourly_rate;
      html += `
        <tr>
          <td>${l.date}</td>
          <td>${l.activity}</td>
          <td>${l.hours.toFixed(2)}</td>
          <td>Bs.S ${l.hourly_rate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td>Bs.S ${cost.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td>
            <button onclick="editLabor('${l.id}')" class="btn-small">✏️</button>
            <button onclick="deleteLabor('${l.id}')" class="btn-small" style="background:#ef4444;">🗑️</button>
          </td>
        </tr>
      `;
    }
    html += '</tbody></table></div>';
    container.innerHTML = html;

    window.editLabor = (id) => alert('Edición en desarrollo');
    window.deleteLabor = async (id) => {
      if (!confirm('¿Eliminar registro?')) return;
      try {
        const { error } = await supabase.from('labor').delete().eq('id', id);
        if (error) throw error;
        loadLaborList();
        alert('✅ Registro eliminado');
      } catch (err) {
        alert('❌ Error: ' + err.message);
      }
    };

  } catch (err) {
    container.innerHTML = `<p>❌ Error: ${err.message}</p>`;
  }
}