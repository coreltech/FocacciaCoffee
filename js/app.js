import { supabase } from './supabase.js';

// === CACHÉ DE TASAS ===
let cachedRates = null;
let cachedDate = null;

// === OBTENER TASAS BCV ===
async function getBCVRates() {
  const today = new Date().toISOString().split('T')[0];
  if (cachedRates && cachedDate === today) return cachedRates;

  const { data } = await supabase
    .from('exchange_rates')
    .select('ves_per_usd, ves_per_eur')
    .eq('date', today)
    .single();

  if (data) {
    cachedRates = data;
    cachedDate = today;
    return data;
  }

  const {  latest } = await supabase
    .from('exchange_rates')
    .select('ves_per_usd, ves_per_eur')
    .order('date', { ascending: false })
    .limit(1)
    .single();

  cachedRates = latest || { ves_per_usd: 36.5, ves_per_eur: 42.0 };
  cachedDate = today;
  return cachedRates;
}

// === CONVERSIÓN A VES ===
async function toVES(amount, fromCurrency) {
  if (fromCurrency === 'VES') return amount;
  const rates = await getBCVRates();
  if (fromCurrency === 'USD') return amount * rates.ves_per_usd;
  if (fromCurrency === 'EUR') return amount * rates.ves_per_eur;
  return amount;
}

// === CONVERSIÓN DESDE VES ===
async function fromVES(vesAmount, toCurrency) {
  if (toCurrency === 'VES') return vesAmount;
  const rates = await getBCVRates();
  if (toCurrency === 'USD') return vesAmount / rates.ves_per_usd;
  if (toCurrency === 'EUR') return vesAmount / rates.ves_per_eur;
  return vesAmount;
}

// === FORMATO POR MONEDA ===
function formatByCurrency(amount, currency) {
  const opts = {
    VES: { style: 'currency', currency: 'VES', minimumFractionDigits: 2 },
    USD: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 },
    EUR: { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }
  };
  try {
    const locale = currency === 'VES' ? 'es-VE' : 'es-ES';
    return new Intl.NumberFormat(locale, opts[currency]).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

// === OBTENER MONEDA DE VISUALIZACIÓN ===
async function getDisplayCurrency() {
  const {  setting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'preferred_display_currency')
    .single();
  return setting?.value || 'VES';
}

// === ACTUALIZAR MONEDA DE VISUALIZACIÓN ===
async function setDisplayCurrency(currency) {
  await supabase
    .from('settings')
    .update({ value: currency })
    .eq('key', 'preferred_display_currency');
  renderSection(currentSection);
}

// === ALERTA DE TASA BCV FALTANTE ===
async function checkBCVRateAlert() {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('exchange_rates')
    .select('id')
    .eq('date', today);

  if (data.length === 0) {
    const confirmed = confirm('⚠️ No hay tasa BCV para hoy. ¿Deseas ingresarla ahora?');
    if (confirmed) {
      renderSection('exchange');
    }
  }
}

// === NAVEGACIÓN ===
let currentSection = 'dashboard';

async function renderSection(sectionId) {
  currentSection = sectionId;
  document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
  document.querySelector(`.sidebar a[href="#${sectionId}"]`)?.classList.add('active');

  const content = document.getElementById('content');
  content.innerHTML = '<div class="card"><p>Cargando...</p></div>';

  switch(sectionId) {
    case 'dashboard':
      content.innerHTML = await loadDashboardHTML();
      initDashboard();
      break;
    case 'sales':
      content.innerHTML = await loadSalesHTML();
      initSales();
      break;
    case 'expenses':
      content.innerHTML = await loadExpensesHTML();
      initExpenses();
      break;
    case 'labor':
      content.innerHTML = await loadLaborHTML();
      initLabor();
      break;
    case 'ingredients':
      content.innerHTML = await loadIngredientsHTML();
      initIngredients();
      break;
    case 'recipes':
      content.innerHTML = await loadRecipesHTML();
      initRecipes();
      break;
    case 'exchange':
      content.innerHTML = await loadExchangeHTML();
      initExchange();
      break;
    case 'plan':
      content.innerHTML = await loadPlanHTML();
      initPlan();
      break;
    case 'reports':
      content.innerHTML = await loadReportsHTML();
      initReports();
      break;
    default:
      content.innerHTML = `<div class="card"><h2>${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}</h2><p>Sección en desarrollo.</p></div>`;
  }
}

// === HTML: DASHBOARD ===
async function loadDashboardHTML() {
  const displayCurrency = await getDisplayCurrency();
  return `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h2>📊 Dashboard</h2>
        <div>
          <label>
            Mostrar en: 
            <select id="display-currency" style="padding:4px; margin-left:6px;">
              <option value="VES" ${displayCurrency==='VES'?'selected':''}>VES</option>
              <option value="USD" ${displayCurrency==='USD'?'selected':''}>USD</option>
              <option value="EUR" ${displayCurrency==='EUR'?'selected':''}>EUR</option>
            </select>
          </label>
        </div>
      </div>
      <div class="today-summary">
        <h3>Hoy • <span id="current-date">${new Date().toLocaleDateString('es-VE')}</span></h3>
        <div class="metrics-grid" id="today-metrics"></div>
      </div>
      <div class="quick-actions" style="margin-top:20px;">
        <button class="btn-primary" onclick="quickSale()">🥖 + Venta Rápida</button>
        <button class="btn-outline" onclick="quickExpense()">💸 + Gasto Rápido</button>
        <button class="btn-outline" onclick="quickLabor()">⏱️ + Horas</button>
      </div>
    </div>
  `;
}

// === HTML: VENTAS ===
async function loadSalesHTML() {
  return `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h2>🥖 Ventas</h2>
        <button class="btn-primary" onclick="openAddSaleModal()" style="padding:6px 12px; font-size:0.9rem;">+ Nueva</button>
      </div>
      <div id="sales-list"></div>
    </div>

    <div id="sale-modal" class="modal" style="display:none;">
      <div class="modal-content">
        <h3>Nueva Venta</h3>
        <form id="sale-form">
          <div><label>Unidades</label><input type="number" id="sale-units" value="1" min="1" required /></div>
          <div><label>Variedad</label>
            <select id="sale-variety" required></select>
          </div>
          <div style="display:flex; gap:10px; margin:10px 0;">
            <div style="flex:3;"><label>Precio unitario</label><input type="number" id="sale-price" step="0.01" required /></div>
            <div style="flex:2;"><label>Moneda</label>
              <select id="sale-currency" style="width:100%; padding:8px;">
                <option value="VES">VES</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <div style="display:flex; gap:10px; margin-top:20px;">
            <button type="submit" class="btn-primary" style="flex:1;">Registrar</button>
            <button type="button" onclick="closeSaleModal()" class="btn-outline" style="flex:1;">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// === HTML: GASTOS ===
async function loadExpensesHTML() {
  return `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h2>💸 Gastos</h2>
        <button class="btn-primary" onclick="openAddExpenseModal()" style="padding:6px 12px; font-size:0.9rem;">+ Nuevo</button>
      </div>
      <div id="expenses-list"></div>
    </div>

    <div id="expense-modal" class="modal" style="display:none;">
      <div class="modal-content">
        <h3>Nuevo Gasto</h3>
        <form id="expense-form">
          <div><label>Categoría</label><input type="text" id="expense-category" required /></div>
          <div style="display:flex; gap:10px; margin:10px 0;">
            <div style="flex:3;"><label>Monto</label><input type="number" id="expense-amount" step="0.01" required /></div>
            <div style="flex:2;"><label>Moneda</label>
              <select id="expense-currency" style="width:100%; padding:8px;">
                <option value="VES">VES</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <div><label>Notas (opcional)</label><input type="text" id="expense-notes" /></div>
          <div style="display:flex; gap:10px; margin-top:20px;">
            <button type="submit" class="btn-primary" style="flex:1;">Guardar</button>
            <button type="button" onclick="closeExpenseModal()" class="btn-outline" style="flex:1;">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// === HTML: HORAS-HOMBRE ===
async function loadLaborHTML() {
  return `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h2>⏱️ Horas-Hombre</h2>
        <button class="btn-primary" onclick="openAddLaborModal()" style="padding:6px 12px; font-size:0.9rem;">+ Nueva</button>
      </div>
      <div id="labor-list"></div>
    </div>

    <div id="labor-modal" class="modal" style="display:none;">
      <div class="modal-content">
        <h3>Nueva Entrada de Horas</h3>
        <form id="labor-form">
          <div><label>Actividad</label><input type="text" id="labor-activity" value="producción" required /></div>
          <div><label>Horas (ej. 2.5 = 2h30m)</label><input type="number" id="labor-hours" step="0.25" min="0.25" value="1" required /></div>
          <div><label>Tarifa por hora (VES)</label><input type="number" id="labor-rate" step="0.01" value="100" required /></div>
          <div style="display:flex; gap:10px; margin-top:20px;">
            <button type="submit" class="btn-primary" style="flex:1;">Guardar</button>
            <button type="button" onclick="closeLaborModal()" class="btn-outline" style="flex:1;">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// === HTML: INGREDIENTES ===
async function loadIngredientsHTML() {
  return `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h2>🥫 Ingredientes</h2>
        <button class="btn-primary" onclick="openAddIngredientModal()" style="padding:6px 12px; font-size:0.9rem;">+ Nuevo</button>
      </div>
      <div id="ingredients-list"></div>
    </div>

    <div id="ingredient-modal" class="modal" style="display:none;">
      <div class="modal-content">
        <h3 id="modal-title">Nuevo Ingrediente</h3>
        <form id="ingredient-form">
          <input type="hidden" id="edit-id" />
          <div><label>Nombre</label><input type="text" id="ingredient-name" required /></div>
          <div><label>Unidad</label><input type="text" id="ingredient-unit" required /></div>
          <div style="display:flex; gap:10px; margin:10px 0;">
            <div style="flex:3;"><label>Costo</label><input type="number" id="ingredient-cost" step="0.01" required /></div>
            <div style="flex:2;"><label>Moneda</label>
              <select id="ingredient-currency" style="width:100%; padding:8px;">
                <option value="VES">VES</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <div><label>Stock actual</label><input type="number" id="ingredient-stock" step="0.001" required /></div>
          <div><label>Alerta mínima</label><input type="number" id="ingredient-min" step="0.001" /></div>
          <div style="display:flex; gap:10px; margin-top:20px;">
            <button type="submit" class="btn-primary" style="flex:1;">Guardar</button>
            <button type="button" onclick="closeModal()" class="btn-outline" style="flex:1;">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// === HTML: RECETAS ===
async function loadRecipesHTML() {
  return `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h2>👩‍🍳 Recetas</h2>
        <button class="btn-primary" onclick="openAddRecipeModal()" style="padding:6px 12px; font-size:0.9rem;">+ Nueva</button>
      </div>
      <div id="recipes-list"></div>
    </div>

    <div id="recipe-modal" class="modal" style="display:none;">
      <div class="modal-content">
        <h3 id="recipe-modal-title">Nueva Receta</h3>
        <form id="recipe-form">
          <input type="hidden" id="edit-recipe-id" />
          <div><label>Nombre de la variedad</label><input type="text" id="recipe-variety" required /></div>
          <div><label>Minutos de mano de obra</label><input type="number" id="recipe-labor" required /></div>
          <div><label>Costo de empaque (VES)</label><input type="number" id="recipe-packaging" step="0.01" value="5.00" required /></div>
          <h4 style="margin:16px 0 8px;">Ingredientes</h4>
          <div id="recipe-ingredients-list"></div>
          <button type="button" onclick="addRecipeIngredientField()" class="btn-outline" style="margin:10px 0;">+ Agregar ingrediente</button>
          <div style="display:flex; gap:10px; margin-top:20px;">
            <button type="submit" class="btn-primary" style="flex:1;">Guardar</button>
            <button type="button" onclick="closeRecipeModal()" class="btn-outline" style="flex:1;">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// === HTML: TASAS BCV ===
async function loadExchangeHTML() {
  return `
    <div class="card">
      <h2>💱 Tasa BCV del Día</h2>
      <p style="margin-bottom:16px;">Ingresa las tasas oficiales de hoy:</p>
      <form id="exchange-form">
        <div style="display:flex; gap:12px; margin-bottom:12px;">
          <div style="flex:1;">
            <label>VES por USD</label>
            <input type="number" step="0.0001" id="ves-usd" required style="width:100%; padding:8px;" />
          </div>
          <div style="flex:1;">
            <label>VES por EUR</label>
            <input type="number" step="0.0001" id="ves-eur" required style="width:100%; padding:8px;" />
          </div>
        </div>
        <button type="submit" class="btn-primary">Guardar Tasa de Hoy</button>
      </form>
      <div id="last-rates" style="margin-top:20px;"></div>
    </div>
  `;
}

// === HTML: PLAN ===
async function loadPlanHTML() {
  return `
    <div class="card">
      <h2>🚀 Plan 3/6/9/12 Meses</h2>
      <div id="milestones-list">
        <p>Cargando progreso...</p>
      </div>
    </div>
  `;
}

// === HTML: REPORTES ===
async function loadReportsHTML() {
  return `
    <div class="card">
      <h2>📈 Reportes</h2>
      <div style="margin-bottom:16px;">
        <label>Periodo: 
          <select id="report-period">
            <option value="today">Hoy</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
          </select>
        </label>
      </div>
      <div id="report-content">
        <p>Selecciona un periodo para ver el reporte.</p>
      </div>
    </div>
  `;
}

// === INICIALIZADORES ===
async function initDashboard() {
  document.getElementById('current-date').textContent = 
    new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' });
  
  document.getElementById('display-currency').onchange = (e) => {
    setDisplayCurrency(e.target.value);
  };
  
  await checkBCVRateAlert();
  await loadTodayMetrics();
}

async function initSales() {
  await loadSalesList();
  loadVarietiesForSale();

  const form = document.getElementById('sale-form');
  if (!form) return;

  form.onsubmit = async (e) => {
    e.preventDefault();
    
    // Obtener valores
    const units = parseInt(document.getElementById('sale-units').value) || 0;
    const variety = document.getElementById('sale-variety').value;
    const price = parseFloat(document.getElementById('sale-price').value);
    const currency = document.getElementById('sale-currency').value;

    // Validaciones
    if (units <= 0 || !price || price <= 0) {
      alert('⚠️ Unidades y precio deben ser mayores que cero.');
      return;
    }
    if (!variety) {
      alert('⚠️ Selecciona una variedad.');
      return;
    }

    try {
      // Convertir a VES
      const priceVES = await toVES(price, currency);
      const revenueVES = units * priceVES;

      // Calcular COGS (usa valores en VES)
      const {  recipe } = await supabase.from('recipes').select('*').eq('variety', variety).single();
      const {  ingredients } = await supabase.from('ingredients').select('name, cost_per_unit');
      const ingredientMap = {};
      ingredients.forEach(i => ingredientMap[i.name] = i.cost_per_unit);

      let cogsVES = 0;
      for (const [name, qtyPerUnit] of Object.entries(recipe.ingredients)) {
        cogsVES += (ingredientMap[name] || 0) * qtyPerUnit * units;
      }
      cogsVES += (recipe.labor_minutes / 60) * 100.00 * units;
      cogsVES += recipe.packaging_cost * units;

      // ✅ INSERTAR en sales
      const { error } = await supabase.from('sales').insert({
        units_sold: units,
        revenue_ves: revenueVES,
        cogs_ves: cogsVES,
        variety: variety,
        original_price: price,
        original_currency: currency,
        date: new Date().toISOString().split('T')[0]
      });

      if (error) {
        console.error('Error Supabase:', error);
        alert('❌ Error al guardar: ' + (error.message || 'Desconocido'));
      } else {
        closeSaleModal();
        await loadSalesList();
        await loadTodayMetrics();
        alert(`✅ Venta registrada: ${units} x ${variety}`);
      }
    } catch (err) {
      console.error('Error inesperado:', err);
      alert('💥 Error crítico: revisa la consola (F12 > Console)');
    }
  };
}

async function initExpenses() {
  await loadExpensesList();
  document.getElementById('expense-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const currency = document.getElementById('expense-currency').value;
    const amountVES = await toVES(amount, currency);
    
    await supabase.from('expenses').insert({
      category: document.getElementById('expense-category').value,
      amount_ves: amountVES,
      original_amount: amount,
      original_currency: currency,
      notes: document.getElementById('expense-notes').value || null,
      date: new Date().toISOString().split('T')[0]
    });

    closeExpenseModal();
    loadExpensesList();
    alert('Gasto registrado');
  });
}

async function initLabor() {
  await loadLaborList();
  document.getElementById('labor-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await supabase.from('labor').insert({
      date: new Date().toISOString().split('T')[0],
      hours: parseFloat(document.getElementById('labor-hours').value),
      activity: document.getElementById('labor-activity').value,
      hourly_rate_ves: parseFloat(document.getElementById('labor-rate').value)
    });
    closeLaborModal();
    loadLaborList();
    alert('Horas registradas');
  });
}

async function initIngredients() {
  await loadIngredientsList();
  const form = document.getElementById('ingredient-form');
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-id').value;
      const cost = parseFloat(document.getElementById('ingredient-cost').value);
      const currency = document.getElementById('ingredient-currency').value;
      const costVES = await toVES(cost, currency);
      
      const data = {
        name: document.getElementById('ingredient-name').value,
        unit: document.getElementById('ingredient-unit').value,
        cost_per_unit: costVES,
        original_amount: cost,
        original_currency: currency,
        current_stock: parseFloat(document.getElementById('ingredient-stock').value),
        min_stock_alert: document.getElementById('ingredient-min').value ? 
                         parseFloat(document.getElementById('ingredient-min').value) : null
      };

      if (id) {
        await supabase.from('ingredients').update(data).eq('id', id);
      } else {
        await supabase.from('ingredients').insert(data);
      }
      closeModal();
      loadIngredientsList();
      alert(id ? 'Ingrediente actualizado' : 'Ingrediente agregado');
    };
  }
}

async function initRecipes() {
  await loadRecipesList();
  loadIngredientsForRecipe();
  document.getElementById('recipe-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-recipe-id').value;
    const packaging = parseFloat(document.getElementById('recipe-packaging').value);
    const ingredients = {};
    document.querySelectorAll('#recipe-ingredients-list > div').forEach(div => {
      const name = div.querySelector('select').value;
      const qty = parseFloat(div.querySelector('input').value);
      if (name && qty) ingredients[name] = qty;
    });
    if (Object.keys(ingredients).length === 0) {
      alert('Agrega al menos un ingrediente');
      return;
    }
    const data = {
      variety: document.getElementById('recipe-variety').value,
      labor_minutes: parseInt(document.getElementById('recipe-labor').value),
      packaging_cost: packaging,
      ingredients
    };
    if (id) {
      await supabase.from('recipes').update(data).eq('id', id);
    } else {
      await supabase.from('recipes').insert(data);
    }
    closeRecipeModal();
    initRecipes();
    alert(id ? 'Receta actualizada' : 'Receta creada');
  });
}

async function initExchange() {
  const today = new Date().toISOString().split('T')[0];
  const {  rate } = await supabase
    .from('exchange_rates')
    .select('*')
    .eq('date', today)
    .single();

  if (rate) {
    document.getElementById('ves-usd').value = rate.ves_per_usd;
    document.getElementById('ves-eur').value = rate.ves_per_eur;
  }

  document.getElementById('exchange-form').onsubmit = async (e) => {
  e.preventDefault();
  
  const today = new Date().toISOString().split('T')[0];
  const vesUsd = parseFloat(document.getElementById('ves-usd').value);
  const vesEur = parseFloat(document.getElementById('ves-eur').value);

  const { error } = await supabase
    .from('exchange_rates')
    .upsert(
      { date: today, ves_per_usd: vesUsd, ves_per_eur: vesEur },
      { onConflict: 'date' }
    );

  if (error) {
    alert('❌ Error al guardar la tasa. Verifica que los números tengan punto decimal (ej: 36.5000)');
  } else {
    alert('✅ Tasa BCV guardada para hoy');
    location.reload();
  }
};

  const {  last } = await supabase
    .from('exchange_rates')
    .select('*')
    .order('date', { ascending: false })
    .limit(3);
  document.getElementById('last-rates').innerHTML = `
    <h4>Últimas tasas registradas:</h4>
    <ul>${last.map(r => `<li>${r.date}: USD=${r.ves_per_usd}, EUR=${r.ves_per_eur}</li>`).join('')}</ul>
  `;
}

async function initPlan() {
  const {  start } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'business_start_date')
    .single();

  const startDate = new Date(start.value);
  const today = new Date();
  const monthsActive = Math.floor((today - startDate) / (1000 * 60 * 60 * 24 * 30));

  let targetPhase = 3;
  if (monthsActive >= 12) targetPhase = 12;
  else if (monthsActive >= 9) targetPhase = 9;
  else if (monthsActive >= 6) targetPhase = 6;
  else targetPhase = 3;

  const {  milestones } = await supabase
    .from('milestones')
    .select('*')
    .lte('month_target', targetPhase)
    .order('month_target', { ascending: true });

  const progress = await calculateRealProgress();

  let html = `<p style="margin-bottom:16px;">⏱️ Mes ${monthsActive} de operación. Fase actual: <strong>${targetPhase} meses</strong></p>`;
  
  milestones.forEach(m => {
    const done = m.completed || progress[m.goal] === true;
    html += `<p style="${done ? 'color:green;' : ''}">
      ${done ? '✅' : '⚪'} ${m.goal}
      ${!done && progress[m.goal] ? ` (${progress[m.goal]})` : ''}
    </p>`;
  });

  document.getElementById('milestones-list').innerHTML = html;
}

async function initReports() {
  document.getElementById('report-period').onchange = loadReportData;
  loadReportData();
}

// === FUNCIONES DEL DASHBOARD ===
async function loadTodayMetrics() {
  const today = new Date().toISOString().split('T')[0];
  const displayCurrency = await getDisplayCurrency();
  
  const { data: sales } = await supabase.from('sales').select('revenue_ves, cogs_ves').eq('date', today);
  const {  labor } = await supabase.from('labor').select('hours').eq('date', today);
  const {  expenses } = await supabase.from('expenses').select('amount_ves').eq('date', today);

  const revenueVES = sales?.reduce((sum, s) => sum + s.revenue_ves, 0) || 0;
  const cogsVES = sales?.reduce((sum, s) => sum + s.cogs_ves, 0) || 0;
  const expensesVES = expenses?.reduce((sum, e) => sum + e.amount_ves, 0) || 0;
  const units = sales?.reduce((sum, s) => sum + s.units_sold, 0) || 0;
  const hours = labor?.reduce((sum, l) => sum + l.hours, 0) || 0;

  const revenueDisplay = await fromVES(revenueVES, displayCurrency);
  const cogsDisplay = await fromVES(cogsVES, displayCurrency);
  const expensesDisplay = await fromVES(expensesVES, displayCurrency);
  const profitDisplay = await fromVES(revenueVES - cogsVES - expensesVES, displayCurrency);

  const metrics = document.getElementById('today-metrics');
  if (metrics) {
    metrics.innerHTML = `
      <div>🥖 <strong>${units}</strong> vendidas</div>
      <div>💶 Ingresos: <strong>${formatByCurrency(revenueDisplay, displayCurrency)}</strong></div>
      <div>📊 Costo real: <strong>${formatByCurrency(cogsDisplay, displayCurrency)}</strong></div>
      <div>💸 Gastos: <strong>${formatByCurrency(expensesDisplay, displayCurrency)}</strong></div>
      <div>⏱️ Horas: <strong>${hours.toFixed(1)}h</strong></div>
      <div>📈 Utilidad: <strong>${formatByCurrency(profitDisplay, displayCurrency)}</strong></div>
    `;
  }
}

async function quickSale() {
  const units = prompt('¿Cuántas focaccias vendiste?', '1');
  if (!units || parseInt(units) <= 0) return;
  
  const qty = parseInt(units);
  const variety = 'Clásica';
  const price = 3.00; // Precio base en EUR (ajusta si usas otro)
  const currency = 'EUR'; // ← Cambia a 'VES' o 'USD' si vendes en otra moneda

  // ✅ Conversión a VES
  const priceVES = await toVES(price, currency);
  const revenueVES = qty * priceVES;

  // ✅ Calcular COGS
  const {  recipe } = await supabase.from('recipes').select('*').eq('variety', variety).single();
  const {  ingredients } = await supabase.from('ingredients').select('name, cost_per_unit');
  const map = {};
  ingredients.forEach(i => map[i.name] = i.cost_per_unit);

  let cogsVES = 0;
  for (const [name, qtyPerUnit] of Object.entries(recipe.ingredients)) {
    cogsVES += (map[name] || 0) * qtyPerUnit * qty;
  }
  cogsVES += (recipe.labor_minutes / 60) * 100.00 * qty;
  cogsVES += recipe.packaging_cost * qty;

  // ✅ Guardar
  await supabase.from('sales').insert({
    units_sold: qty,
    revenue_ves: revenueVES,
    cogs_ves: cogsVES,
    variety: variety,
    original_price: price,
    original_currency: currency,
    date: new Date().toISOString().split('T')[0]
  });

  loadTodayMetrics();
  alert(`✅ Venta rápida registrada: ${qty} unidades (${currency})`);
}

async function quickExpense() {
  const amount = prompt('Monto del gasto en VES:', '50');
  if (!amount) return;
  await supabase.from('expenses').insert({
    category: 'general',
    amount_ves: parseFloat(amount),
    original_amount: parseFloat(amount),
    original_currency: 'VES',
    date: new Date().toISOString().split('T')[0]
  });
  loadTodayMetrics();
  alert('Gasto registrado');
}

async function quickLabor() {
  const hours = prompt('Horas trabajadas hoy:', '2.5');
  if (!hours) return;
  await supabase.from('labor').insert({
    date: new Date().toISOString().split('T')[0],
    hours: parseFloat(hours),
    activity: 'producción',
    hourly_rate_ves: 100.00
  });
  loadTodayMetrics();
  alert('Horas registradas');
}

// === FUNCIONES DE VENTAS ===
async function loadSalesList() {
  const { data } = await supabase.from('sales').select('*').order('date', { ascending: false }).limit(20);
  const container = document.getElementById('sales-list');
  if (!container) return;
  
  const displayCurrency = await getDisplayCurrency();
  let html = '<div style="overflow-x:auto;"><table class="data-table"><thead><tr><th>Fecha</th><th>Variedad</th><th>Unid.</th><th>Ingreso</th></tr></thead><tbody>';
  
  for (const s of data) {
    const displayRevenue = await fromVES(s.revenue_ves, displayCurrency);
    html += `
      <tr>
        <td>${s.date}</td>
        <td>${s.variety}</td>
        <td>${s.units_sold}</td>
        <td>${formatByCurrency(displayRevenue, displayCurrency)}</td>
      </tr>
    `;
  }
  html += '</tbody></table></div>';
  container.innerHTML = html || '<p>No hay ventas.</p>';
}

async function loadVarietiesForSale() {
  const {  data } = await supabase.from('recipes').select('variety');
  const select = document.getElementById('sale-variety');
  if (select) {
    select.innerHTML = data.map(r => `<option value="${r.variety}">${r.variety}</option>`).join('');
  }
}

function openAddSaleModal() {
  loadVarietiesForSale();
  document.getElementById('sale-modal').style.display = 'block';
}

function closeSaleModal() {
  document.getElementById('sale-modal').style.display = 'none';
}

// === FUNCIONES DE GASTOS ===
async function loadExpensesList() {
  const { data } = await supabase.from('expenses').select('*').order('date', { ascending: false }).limit(20);
  const container = document.getElementById('expenses-list');
  if (!container) return;
  
  const displayCurrency = await getDisplayCurrency();
  let html = '<div style="overflow-x:auto;"><table class="data-table"><thead><tr><th>Fecha</th><th>Categoría</th><th>Monto</th><th>Notas</th></tr></thead><tbody>';
  
  for (const e of data) {
    const displayAmount = await fromVES(e.amount_ves, displayCurrency);
    html += `
      <tr>
        <td>${e.date}</td>
        <td>${e.category}</td>
        <td>${formatByCurrency(displayAmount, displayCurrency)}</td>
        <td>${e.notes || ''}</td>
      </tr>
    `;
  }
  html += '</tbody></table></div>';
  container.innerHTML = html || '<p>No hay gastos.</p>';
}

function openAddExpenseModal() {
  document.getElementById('expense-modal').style.display = 'block';
}

function closeExpenseModal() {
  document.getElementById('expense-modal').style.display = 'none';
}

// === FUNCIONES DE HORAS ===
async function loadLaborList() {
  const { data } = await supabase.from('labor').select('*').order('date', { ascending: false }).limit(20);
  const container = document.getElementById('labor-list');
  if (!container) return;
  
  let html = '<div style="overflow-x:auto;"><table class="data-table"><thead><tr><th>Fecha</th><th>Actividad</th><th>Horas</th><th>Tarifa (VES)</th></tr></thead><tbody>';
  
  for (const l of data) {
    html += `
      <tr>
        <td>${l.date}</td>
        <td>${l.activity}</td>
        <td>${l.hours}</td>
        <td>${formatByCurrency(l.hourly_rate_ves, 'VES')}</td>
      </tr>
    `;
  }
  html += '</tbody></table></div>';
  container.innerHTML = html || '<p>No hay registros.</p>';
}

function openAddLaborModal() {
  document.getElementById('labor-modal').style.display = 'block';
}

function closeLaborModal() {
  document.getElementById('labor-modal').style.display = 'none';
}

// === FUNCIONES DE INGREDIENTES ===
async function loadIngredientsList() {
  const { data } = await supabase.from('ingredients').select('*').order('name', { ascending: true });
  const container = document.getElementById('ingredients-list');
  if (!container) return;

  const displayCurrency = await getDisplayCurrency();
  let html = '<div style="overflow-x:auto;"><table class="data-table"><thead><tr><th>Ingrediente</th><th>Unidad</th><th>Costo</th><th>Stock</th><th>Acciones</th></tr></thead><tbody>';

  for (const ing of data) {
    const displayCost = await fromVES(ing.cost_per_unit, displayCurrency);
    const isLow = ing.current_stock < (ing.min_stock_alert || 0);
    html += `
      <tr>
        <td><strong>${ing.name}</strong></td>
        <td>${ing.unit}</td>
        <td>${formatByCurrency(displayCost, displayCurrency)}</td>
        <td ${isLow ? 'class="stock-low"' : ''}>
          ${ing.current_stock} ${isLow ? '<span>⚠️</span>' : ''}
        </td>
        <td>
          <button onclick="editIngredient('${ing.id}')" class="btn-outline">✏️</button>
          <button onclick="deleteIngredient('${ing.id}')" class="btn-outline" style="background:#fee2e2;color:#b91c1c;">🗑️</button>
        </td>
      </tr>
    `;
  }
  html += '</tbody></table></div>';
  container.innerHTML = html || '<p>No hay ingredientes.</p>';
}

function openAddIngredientModal() {
  document.getElementById('modal-title').textContent = 'Nuevo Ingrediente';
  document.getElementById('edit-id').value = '';
  ['ingredient-name','ingredient-unit','ingredient-cost','ingredient-stock','ingredient-min']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('ingredient-currency').value = 'VES';
  document.getElementById('ingredient-modal').style.display = 'block';
}

function closeModal() {
  document.getElementById('ingredient-modal').style.display = 'none';
}

window.editIngredient = async (id) => {
  const { data: ing, error } = await supabase.from('ingredients').select('*').eq('id', id).single();
  if (error) {
    alert('Error al cargar el ingrediente');
    return;
  }

  document.getElementById('modal-title').textContent = 'Editar Ingrediente';
  document.getElementById('edit-id').value = ing.id;
  document.getElementById('ingredient-name').value = ing.name;
  document.getElementById('ingredient-unit').value = ing.unit;
  document.getElementById('ingredient-stock').value = ing.current_stock;
  document.getElementById('ingredient-min').value = ing.min_stock_alert || '';

  // Cargar el valor y moneda originales SI EXISTEN
  if (ing.original_amount !== null && ing.original_currency) {
    document.getElementById('ingredient-cost').value = ing.original_amount;
    document.getElementById('ingredient-currency').value = ing.original_currency;
  } else {
    // Si no hay original, mostrar en VES (valor convertido para visualización)
    document.getElementById('ingredient-cost').value = ing.cost_per_unit;
    document.getElementById('ingredient-currency').value = 'VES';
  }

  document.getElementById('ingredient-modal').style.display = 'block';
};

window.deleteIngredient = async (id) => {
  if (!confirm('¿Eliminar este ingrediente?')) return;
  await supabase.from('ingredients').delete().eq('id', id);
  loadIngredientsList();
  alert('Ingrediente eliminado');
};

// === FUNCIONES DE RECETAS ===
async function loadRecipesList() {
  const {  recipes } = await supabase.from('recipes').select('*');
  const {  ingredients } = await supabase.from('ingredients').select('name, cost_per_unit');
  const ingredientMap = {};
  ingredients.forEach(i => ingredientMap[i.name] = i.cost_per_unit);

  const container = document.getElementById('recipes-list');
  if (!container) return;

  const displayCurrency = await getDisplayCurrency();
  let html = '';

  for (const r of recipes) {
    let totalCostVES = 0;
    let details = '';
    for (const [name, qty] of Object.entries(r.ingredients)) {
      const cost = (ingredientMap[name] || 0) * qty;
      totalCostVES += cost;
      const displayCost = await fromVES(cost, displayCurrency);
      details += `<div>${name}: ${qty} → ${formatByCurrency(displayCost, displayCurrency)}</div>`;
    }
    const laborCostVES = (r.labor_minutes / 60) * 100.00;
    const packagingCostVES = r.packaging_cost;
    totalCostVES += laborCostVES + packagingCostVES;

    const totalDisplay = await fromVES(totalCostVES, displayCurrency);
    const revenueVES = 120.00;
    const revenueDisplay = await fromVES(revenueVES, displayCurrency);
    const margin = ((revenueVES - totalCostVES) / revenueVES * 100).toFixed(1);

    html += `
      <div class="card" style="margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:start;">
          <div>
            <h3>${r.variety}</h3>
            <div style="font-size:0.9rem; margin:8px 0;">${details}</div>
            <div>Mano de obra (${r.labor_minutes} min): ${formatByCurrency(await fromVES(laborCostVES, displayCurrency), displayCurrency)}</div>
            <div>Empaque: ${formatByCurrency(await fromVES(packagingCostVES, displayCurrency), displayCurrency)}</div>
            <div><strong>Total costo: ${formatByCurrency(totalDisplay, displayCurrency)}</strong></div>
            <div style="color:${margin >= 60 ? 'green' : '#e02d2d'};">
              Margen: ${margin}% ${margin >= 60 ? '✅' : '⚠️'}
            </div>
          </div>
          <div>
            <button onclick="editRecipe('${r.id}')" class="btn-outline" style="margin-bottom:6px;">✏️</button>
            <button onclick="deleteRecipe('${r.id}')" class="btn-outline" style="background:#fee2e2;color:#b91c1c;">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }
  container.innerHTML = html || '<p>No hay recetas.</p>';
}

async function loadIngredientsForRecipe() {
  const {  data } = await supabase.from('ingredients').select('name').order('name');
  window.recipeIngredients = data.map(i => i.name);
}

function addRecipeIngredientField(name = '', qty = '') {
  const container = document.getElementById('recipe-ingredients-list');
  const id = 'ing_' + Date.now();
  container.innerHTML += `
    <div style="display:flex; gap:8px; margin:6px 0;">
      <select id="${id}_name" style="flex:2; padding:6px;">
        <option value="">Selecciona...</option>
        ${window.recipeIngredients.map(n => `<option value="${n}" ${n===name?'selected':''}>${n}</option>`).join('')}
      </select>
      <input type="number" id="${id}_qty" placeholder="Cantidad" value="${qty}" step="0.001" style="flex:1; padding:6px;" />
      <button type="button" onclick="this.parentElement.remove()" style="background:#fee2e2; border:none; width:30px;">x</button>
    </div>
  `;
}

function openAddRecipeModal() {
  document.getElementById('recipe-modal-title').textContent = 'Nueva Receta';
  document.getElementById('edit-recipe-id').value = '';
  document.getElementById('recipe-variety').value = '';
  document.getElementById('recipe-labor').value = '8';
  document.getElementById('recipe-packaging').value = '5.00';
  document.getElementById('recipe-ingredients-list').innerHTML = '';
  document.getElementById('recipe-modal').style.display = 'block';
  loadIngredientsForRecipe();
}

function closeRecipeModal() {
  document.getElementById('recipe-modal').style.display = 'none';
}

window.editRecipe = async (id) => {
  const {  r } = await supabase.from('recipes').select('*').eq('id', id).single();
  document.getElementById('recipe-modal-title').textContent = 'Editar Receta';
  document.getElementById('edit-recipe-id').value = r.id;
  document.getElementById('recipe-variety').value = r.variety;
  document.getElementById('recipe-labor').value = r.labor_minutes;
  document.getElementById('recipe-packaging').value = r.packaging_cost;
  document.getElementById('recipe-ingredients-list').innerHTML = '';
  for (const [name, qty] of Object.entries(r.ingredients)) {
    addRecipeIngredientField(name, qty);
  }
  document.getElementById('recipe-modal').style.display = 'block';
  loadIngredientsForRecipe();
};

window.deleteRecipe = async (id) => {
  if (!confirm('¿Eliminar esta receta?')) return;
  await supabase.from('recipes').delete().eq('id', id);
  initRecipes();
  alert('Receta eliminada');
};

// === PLAN: CÁLCULO DE PROGRESO REAL ===
async function calculateRealProgress() {
  const progress = {};
  
  // Clientes recurrentes: simplificado como ventas en los últimos 30 días
  const monthAgo = new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0];
  const {  sales } = await supabase
    .from('sales')
    .select('id')
    .gte('date', monthAgo);
  progress['Tener 15 clientes recurrentes'] = `${sales?.length || 0}/15`;

  // Unidades/semana
  const weekAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0];
  const {  units } = await supabase
    .from('sales')
    .select('units_sold')
    .gte('date', weekAgo);
  const totalUnits = units?.reduce((a,b) => a + b.units_sold, 0) || 0;
  progress['Alcanzar 100 unidades/semana'] = `${totalUnits}/100`;

  // Margen ≥60%
  if (sales?.length > 0) {
    const {  allSales } = await supabase
      .from('sales')
      .select('revenue_ves, cogs_ves')
      .gte('date', weekAgo);
    const revenue = allSales?.reduce((a,s) => a + s.revenue_ves, 0) || 1;
    const cogs = allSales?.reduce((a,s) => a + s.cogs_ves, 0) || 0;
    const margin = ((revenue - cogs) / revenue * 100).toFixed(1);
    progress['Definir receta base y margen ≥60%'] = `${margin}%`;
  }

  return progress;
}

// === REPORTES ===
async function loadReportData() {
  const period = document.getElementById('report-period').value;
  const today = new Date();
  let startDate;

  if (period === 'today') {
    startDate = today.toISOString().split('T')[0];
  } else if (period === 'week') {
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    startDate = weekAgo.toISOString().split('T')[0];
  } else if (period === 'month') {
    const monthAgo = new Date(today);
    monthAgo.setMonth(today.getMonth() - 1);
    startDate = monthAgo.toISOString().split('T')[0];
  }

  const {  sales } = await supabase.from('sales').select('revenue_ves, cogs_ves').gte('date', startDate);
  const {  expenses } = await supabase.from('expenses').select('amount_ves').gte('date', startDate);

  const revenue = sales?.reduce((a,s) => a + s.revenue_ves, 0) || 0;
  const cogs = sales?.reduce((a,s) => a + s.cogs_ves, 0) || 0;
  const exp = expenses?.reduce((a,e) => a + e.amount_ves, 0) || 0;
  const profit = revenue - cogs - exp;
  const margin = revenue > 0 ? ((profit) / revenue * 100).toFixed(1) : 0;

  const displayCurrency = await getDisplayCurrency();
  const revDisplay = await fromVES(revenue, displayCurrency);
  const cogsDisplay = await fromVES(cogs, displayCurrency);
  const expDisplay = await fromVES(exp, displayCurrency);
  const profitDisplay = await fromVES(profit, displayCurrency);

  document.getElementById('report-content').innerHTML = `
    <div class="card" style="margin-top:16px;">
      <h3>Resumen ${period === 'today' ? 'de hoy' : period === 'week' ? 'semanal' : 'mensual'}</h3>
      <div class="metrics-grid">
        <div>Ingresos: ${formatByCurrency(revDisplay, displayCurrency)}</div>
        <div>Costo ventas: ${formatByCurrency(cogsDisplay, displayCurrency)}</div>
        <div>Gastos: ${formatByCurrency(expDisplay, displayCurrency)}</div>
        <div>Utilidad: ${formatByCurrency(profitDisplay, displayCurrency)}</div>
        <div>Margen: ${margin}%</div>
      </div>
    </div>
  `;
}

// === INICIAR APP ===
document.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash.substring(1) || 'dashboard';
  renderSection(hash);

  document.querySelectorAll('.sidebar a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      renderSection(e.currentTarget.getAttribute('href').substring(1));
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('overlay').classList.remove('active');
    });
  });

  document.getElementById('menu-toggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('overlay').classList.add('active');
  });

  document.getElementById('overlay')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
  });
});

// === EXPOSICIÓN DE FUNCIONES GLOBALES ===
window.setDisplayCurrency = setDisplayCurrency;
window.quickSale = quickSale;
window.quickExpense = quickExpense;
window.quickLabor = quickLabor;
window.openAddSaleModal = openAddSaleModal;
window.closeSaleModal = closeSaleModal;
window.openAddExpenseModal = openAddExpenseModal;
window.closeExpenseModal = closeExpenseModal;
window.openAddLaborModal = openAddLaborModal;
window.closeLaborModal = closeLaborModal;
window.openAddIngredientModal = openAddIngredientModal;
window.closeModal = closeModal;
window.editIngredient = editIngredient;
window.deleteIngredient = deleteIngredient;
window.openAddRecipeModal = openAddRecipeModal;
window.closeRecipeModal = closeRecipeModal;
window.addRecipeIngredientField = addRecipeIngredientField;
window.editRecipe = editRecipe;
window.deleteRecipe = deleteRecipe;
window.loadReportData = loadReportData;