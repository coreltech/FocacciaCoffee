export const AdminView = {
    renderLayout(container, rates, isDebug) {
        container.innerHTML = `
        <div class="main-container">
            <header class="flex-between bg-white p-4 rounded-xl shadow-sm mb-6">
                <div>
                    <h1 class="m-0 text-xl font-bold">⚙️ Administración</h1>
                    <p class="text-muted text-sm m-0">Equipos, Gastos y Herramientas</p>
                </div>
                <div class="flex-gap-10">
                    <div class="bg-light p-2 rounded border border-slate-200 text-sm">
                        <b class="text-slate-600">USD:</b> Bs ${rates.tasa_usd_ves.toFixed(2)}
                    </div>
                </div>
            </header>

            <div class="flex-gap-10 mb-4 overflow-x-auto">
                <button class="nav-btn active" id="tab-assets">🛡️ Equipos</button>
                <button class="nav-btn" id="tab-expenses">💸 Gastos</button>
                <button class="nav-btn" id="tab-debug" style="opacity:${isDebug ? 1 : 0.5}; cursor:${isDebug ? 'pointer' : 'not-allowed'};">🐞 Debug</button>
            </div>

            <!-- ASSETS PANEL -->
            <div id="panel-assets" class="stat-card">
                <h3 class="mt-0 border-b pb-2 mb-4">🛡️ Inventario de Equipos</h3>
                <div class="grid-2-cols mb-4">
                    <div class="flex-col">
                        <label class="text-sm font-bold">Nombre</label>
                        <input id="a-name" class="input-field" placeholder="Nombre del equipo">
                    </div>
                    <div class="flex-col">
                        <label class="text-sm font-bold">Costo</label>
                        <input id="a-cost" type="number" class="input-field">
                    </div>
                </div>
                <div class="grid-2-cols mb-4">
                    <div class="flex-col">
                        <label class="text-sm font-bold">Marca</label>
                        <input id="a-brand" class="input-field">
                    </div>
                    <div class="flex-col">
                        <label class="text-sm font-bold">Moneda</label>
                        <select id="a-currency" class="input-field">
                            <option value="USD">USD</option>
                            <option value="VES">Bs</option>
                        </select>
                    </div>
                </div>
                <button id="btn-save-asset" class="btn-primary w-full">💾 Registrar Equipo</button>
                
                <div class="mt-4">
                    <h4>Registrados</h4>
                    <div id="assets-list"></div>
                </div>
            </div>

            <!-- EXPENSES PANEL -->
            <div id="panel-expenses" class="stat-card" style="display:none;">
                <h3 class="mt-0 border-b pb-2 mb-4">💸 Gastos Operativos</h3>
                <div class="flex-col mb-4">
                    <label class="text-sm font-bold">Descripción</label>
                    <input id="e-desc" class="input-field" placeholder="Pago de luz...">
                </div>
                <div class="grid-2-cols mb-4">
                    <div class="flex-col">
                        <label class="text-sm font-bold">Monto</label>
                        <input id="e-amount" type="number" class="input-field">
                    </div>
                    <div class="flex-col">
                        <label class="text-sm font-bold">Categoría</label>
                        <select id="e-cat" class="input-field">
                            <option value="Servicios">Servicios</option>
                            <option value="Consumibles">Consumibles</option>
                            <option value="Mantenimiento">Mantenimiento</option>
                            <option value="Logistica">Logística</option>
                        </select>
                    </div>
                </div>
                <div class="flex-col mb-4">
                     <label class="text-sm font-bold">Moneda</label>
                     <select id="e-currency" class="input-field">
                        <option value="USD">USD</option>
                        <option value="VES">Bs</option>
                     </select>
                </div>
                <button id="btn-save-expense" class="btn-primary w-full bg-blue-600">💸 Registrar Gasto</button>

                <div class="mt-4">
                    <h4>Últimos Gastos</h4>
                    <div id="expenses-list"></div>
                </div>
            </div>

            <!-- DEBUG PANEL -->
            <div id="panel-debug" class="stat-card" style="display:none; border:2px solid #ef4444;">
                <h3 class="mt-0 border-b pb-2 mb-4 text-red-600">🐞 ZONA DE PELIGRO (DEBUG)</h3>
                
                ${isDebug ? `
                    <p class="mb-4 text-sm">Estas acciones afectan la base de datos permanentemente. Úsalas con extrema precaución.</p>
                    <button id="btn-wipe-db" class="btn-primary w-full" style="background:#ef4444; padding:20px;">
                        💣 BORRAR TODA LA DATA DE PRUEBAS
                    </button>
                ` : `
                    <div class="p-4 bg-slate-100 rounded text-center">
                        <p>El modo Debug está desactivado en la configuración global.</p>
                        <small>Edita <code>src/core/config.js</code> para activar.</small>
                    </div>
                `}
            </div>
        </div>
        `;
    },

    renderAssets(assets) {
        document.getElementById('assets-list').innerHTML = assets.map(a => `
            <div class="flex-between p-2 border-b">
                <div><b>${a.name}</b> <small>${a.brand || ''}</small></div>
                <div class="font-bold">$${a.cost_usd.toFixed(2)}</div>
            </div>
        `).join('');
    },

    renderExpenses(expenses) {
        document.getElementById('expenses-list').innerHTML = expenses.map(e => `
            <div class="flex-between p-2 border-b">
                <div><b>${e.description}</b> <span class="text-sm bg-blue-100 px-2 rounded">${e.category}</span></div>
                <div class="text-red-500 font-bold">-$${e.amount_usd.toFixed(2)}</div>
            </div>
        `).join('');
    }
};
