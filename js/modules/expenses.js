import { supabase } from '../supabase.js';
import { convert, getLatestRates } from '../core/currency.js';

export async function loadExpenses() {
    const container = document.getElementById('app-content');
    const rates = await getLatestRates();

    container.innerHTML = `
        <div class="main-container">
            <header class="header-flex">
                <div>
                    <h1>💸 Control de Gastos</h1>
                    <p style="color: #64748b;">Registra egresos operativos y fijos</p>
                </div>
                <button class="btn-primary" id="btn-nuevo-gasto">+ Registrar Gasto</button>
            </header>

            <div class="main-grid">
                <div class="stat-card" style="grid-column: 1 / -1; display: flex; justify-content: space-around; background: #f1f5f9;">
                    <div class="text-center">
                        <small>GASTOS MES ACTUAL</small>
                        <div id="total-month-expenses" class="stat-value" style="color:#e11d48;">$0.00</div>
                    </div>
                    <div class="text-center">
                        <small>TASA APLICADA</small>
                        <div style="font-weight:bold;">1 $ = ${rates.ves_per_usd} Bs.</div>
                    </div>
                </div>

                <div class="stat-card" style="grid-column: 1 / -1;">
                    <h3>Historial de Egresos</h3>
                    <div id="expenses-list" style="margin-top:15px;">
                        </div>
                </div>
            </div>
        </div>

        <div id="modal-expense" class="modal-overlay" style="display:none;">
            <div class="modal-card">
                <h3>📝 Registrar Egreso</h3>
                <form id="expense-form">
                    <div class="input-group">
                        <label>Descripción / Concepto</label>
                        <input type="text" id="ex-desc" class="input-field" placeholder="Ej: Pago de Electricidad" required>
                    </div>
                    
                    <div class="input-group">
                        <label>Categoría</label>
                        <select id="ex-cat" class="input-field">
                            <option value="Servicios">Servicios (Luz, Agua, Internet)</option>
                            <option value="Alquiler">Alquiler</option>
                            <option value="Nomina">Nómina / Sueldos</option>
                            <option value="Mantenimiento">Mantenimiento</option>
                            <option value="Otros">Otros</option>
                        </select>
                    </div>

                    <div style="display:grid; grid-template-columns: 2fr 1fr; gap:10px;">
                        <div class="input-group">
                            <label>Monto</label>
                            <input type="number" id="ex-amount" step="0.01" class="input-field" required>
                        </div>
                        <div class="input-group">
                            <label>Moneda</label>
                            <select id="ex-curr" class="input-field">
                                <option value="USD">USD ($)</option>
                                <option value="VES">VES (Bs.)</option>
                                <option value="EUR">EUR (€)</option>
                            </select>
                        </div>
                    </div>

                    <div style="display:flex; gap:10px; margin-top:20px;">
                        <button type="button" class="btn-primary" id="close-modal-ex" style="background:#64748b;">Cancelar</button>
                        <button type="submit" class="btn-primary" style="flex:1;">Guardar Gasto</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    setupEvents();
    renderExpenses();
}

async function renderExpenses() {
    const { data: expenses, error } = await supabase
        .from('expenses')
        .select('*')
        .order('fecha_gasto', { ascending: false });

    const listContainer = document.getElementById('expenses-list');
    const totalLabel = document.getElementById('total-month-expenses');

    if (error) return console.error(error);

    let totalUSD = 0;
    listContainer.innerHTML = expenses.map(ex => {
        totalUSD += parseFloat(ex.monto_usd);
        return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #eee;">
                <div style="flex: 1;">
                    <div style="font-weight:bold;">${ex.descripcion}</div>
                    <small style="color:#64748b;">${ex.categoria} | ${ex.fecha_gasto}</small>
                </div>
                <div style="text-align:right; display:flex; align-items:center; gap:15px;">
                    <div>
                        <div style="color:#e11d48; font-weight:bold;">-$${parseFloat(ex.monto_usd).toFixed(2)}</div>
                        <small>${ex.monto_original} ${ex.moneda}</small>
                    </div>
                    <div style="display:flex; gap:5px;">
                        <button onclick="editExpense('${ex.id}', '${ex.descripcion}', ${ex.monto_usd})" style="border:none; background:none; cursor:pointer; font-size:1.1rem;">✏️</button>
                        <button onclick="deleteExpense('${ex.id}')" style="border:none; background:none; cursor:pointer; font-size:1.1rem;">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    totalLabel.innerText = `$${totalUSD.toFixed(2)}`;
}

async function saveExpense(e) {
    e.preventDefault();
    const desc = document.getElementById('ex-desc').value;
    const cat = document.getElementById('ex-cat').value;
    const amount = parseFloat(document.getElementById('ex-amount').value);
    const curr = document.getElementById('ex-curr').value;

    const amountUSD = await convert(amount, curr, 'USD');

    const { error } = await supabase.from('expenses').insert([{
        descripcion: desc,
        categoria: cat,
        monto_original: amount,
        moneda: curr,
        monto_usd: amountUSD
    }]);

    if (!error) {
        document.getElementById('modal-expense').style.display = 'none';
        loadExpenses();
    }
}

function setupEvents() {
    document.getElementById('btn-nuevo-gasto').onclick = () => document.getElementById('modal-expense').style.display = 'flex';
    document.getElementById('close-modal-ex').onclick = () => document.getElementById('modal-expense').style.display = 'none';
    document.getElementById('expense-form').onsubmit = saveExpense;
}

// --- NUEVAS FUNCIONES DE GESTIÓN ---

window.deleteExpense = async (id) => {
    if (confirm("¿Estás seguro de eliminar este gasto? Esta acción no se puede deshacer.")) {
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (error) alert("Error al eliminar: " + error.message);
        else renderExpenses(); // Refrescar solo la lista y el total
    }
};

window.editExpense = async (id, currentDesc, currentUSD) => {
    const newDesc = prompt("Editar concepto del gasto:", currentDesc);
    if (newDesc === null) return; // Cancelado

    const newAmountUSD = prompt("Editar monto total en USD (solo números):", currentUSD);
    if (newAmountUSD === null || isNaN(newAmountUSD)) return; // Cancelado o inválido

    const { error } = await supabase.from('expenses').update({
        descripcion: newDesc,
        monto_usd: parseFloat(newAmountUSD)
    }).eq('id', id);

    if (error) alert("Error al actualizar: " + error.message);
    else renderExpenses();
};