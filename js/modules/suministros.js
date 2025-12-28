import { supabase } from '../supabase.js';

export async function loadIngredients() {
    const container = document.getElementById('app-content');
    container.innerHTML = `
        <div class="main-container">
            <header class="header-flex">
                <h1>🥫 Almacén de Insumos</h1>
                <button class="btn-primary" id="btn-nueva-compra">+ Registrar Compra</button>
            </header>
            
            <div id="ing-grid" class="main-grid">
                </div>
        </div>

        <div id="modal-ing" class="modal-overlay" style="display:none;">
            <div class="modal-card">
                <h3>📦 Entrada de Mercancía</h3>
                <form id="ing-form">
                    <div class="input-group">
                        <label>Nombre del Insumo</label>
                        <input type="text" id="name" class="input-field" placeholder="Ej: Harina de Trigo" required>
                    </div>
                    <div class="row-flex">
                        <div class="input-group">
                            <label>Cantidad (Peso/Vol)</label>
                            <input type="number" id="qty" step="0.01" class="input-field" required>
                        </div>
                        <div class="input-group">
                            <label>Unidad</label>
                            <select id="unit" class="input-field">
                                <option value="kg">Kilos (kg)</option>
                                <option value="L">Litros (L)</option>
                                <option value="unid">Unidades</option>
                            </select>
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Precio Total Pagado (USD)</label>
                        <input type="number" id="price" step="0.01" class="input-field" placeholder="0.00" required>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" id="close-modal">Cancelar</button>
                        <button type="submit" class="btn-primary">Guardar e Indexar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    setupEvents();
    renderIngs();
}

async function renderIngs() {
    const { data } = await supabase.from('ingredients').select('*').order('name');
    const grid = document.getElementById('ing-grid');
    
    grid.innerHTML = data.map(i => `
        <div class="stat-card">
            <div class="badge">${i.stock_actual > 0 ? 'EN STOCK' : 'AGOTADO'}</div>
            <div class="stat-value">${i.stock_actual} <small>${i.unit_type === 'peso' ? 'kg' : 'unid'}</small></div>
            <div class="stat-label">${i.name}</div>
            <div class="stat-footer">Costo Base: $${i.costo_unidad_medida.toFixed(4)} / unidad min.</div>
        </div>
    `).join('');
}

async function saveIngredient(e) {
    e.preventDefault();
    const qty = parseFloat(document.getElementById('qty').value);
    const price = parseFloat(document.getElementById('price').value);
    const unit = document.getElementById('unit').value;
    
    // Automatización: El sistema rompe el precio al mínimo (gramo/ml/unid)
    const costPerUnit = price / (unit === 'kg' || unit === 'L' ? (qty * 1000) : qty);

    const { error } = await supabase.from('ingredients').insert([{
        name: document.getElementById('name').value,
        unit_type: unit === 'unid' ? 'unidad' : (unit === 'kg' ? 'peso' : 'volumen'),
        stock_actual: qty,
        costo_unidad_medida: costPerUnit,
        ultima_compra_precio: price
    }]);

    if (!error) {
        document.getElementById('modal-ing').style.display = 'none';
        renderIngs();
    }
}

function setupEvents() {
    document.getElementById('btn-nueva-compra').onclick = () => document.getElementById('modal-ing').style.display='flex';
    document.getElementById('close-modal').onclick = () => document.getElementById('modal-ing').style.display='none';
    document.getElementById('ing-form').onsubmit = saveIngredient;
}