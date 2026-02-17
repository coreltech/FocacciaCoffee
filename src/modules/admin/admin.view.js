export const AdminView = {
    renderLayout(container, rates, isDebug) {
        container.innerHTML = `
        <div class="main-container">
            <header style="display:flex; justify-content:space-between; align-items:center; background:white; padding:20px; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.1); margin-bottom:25px; flex-wrap:wrap; gap:15px;">
                <div>
                    <h1 style="margin:0 0 5px 0; font-size:1.8rem; font-weight:bold;">⚙️ Administración</h1>
                    <p style="color:#64748b; font-size:0.95rem; margin:0;">Equipos, Gastos y Herramientas</p>
                </div>
                <div style="display:flex; gap:12px;">
                    <div style="background:#f8fafc; padding:10px 14px; border-radius:8px; border:2px solid #e2e8f0; font-size:0.85rem;">
                        <b style="color:#64748b;">USD:</b> Bs ${rates.tasa_usd_ves.toFixed(2)}
                    </div>
                </div>
            </header>

            <div style="display:flex; gap:12px; margin-bottom:20px; overflow-x:auto; flex-wrap:wrap;">
                <button class="nav-btn active" id="tab-assets" 
                    style="padding:12px 20px; background:#2563eb; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:0.9rem; transition:all 0.2s;">
                    🛡️ Equipos
                </button>
                <button class="nav-btn" id="tab-expenses" 
                    style="padding:12px 20px; background:#f1f5f9; color:#64748b; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:0.9rem; transition:all 0.2s;">
                    💸 Gastos
                </button>
                <button class="nav-btn" id="tab-contributions" 
                    style="padding:12px 20px; background:#f1f5f9; color:#64748b; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:0.9rem; transition:all 0.2s;">
                    💰 Aportes
                </button>
                <button class="nav-btn" id="tab-debug" 
                    style="padding:12px 20px; background:#f1f5f9; color:#64748b; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:0.9rem; opacity:${isDebug ? 1 : 0.5}; cursor:${isDebug ? 'pointer' : 'not-allowed'}; transition:all 0.2s;">
                    🐞 Debug
                </button>
            </div>

            <!-- ASSETS PANEL -->
            <div id="panel-assets" class="stat-card" style="padding:25px;">
                <h3 style="margin:0 0 20px 0; border-bottom:2px solid #e2e8f0; padding-bottom:12px; font-size:1.1rem;">🛡️ Inventario de Equipos</h3>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:18px;">
                    <div>
                        <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">Nombre</label>
                        <input id="a-name" class="input-field" placeholder="Nombre del equipo" 
                            style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                    </div>
                    <div>
                        <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">Costo</label>
                        <input id="a-cost" type="number" class="input-field" 
                            style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                    </div>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:18px;">
                    <div>
                        <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">Marca</label>
                        <input id="a-brand" class="input-field" 
                            style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                    </div>
                    <div>
                        <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">Moneda</label>
                        <select id="a-currency" class="input-field" 
                            style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                            <option value="USD">USD</option>
                            <option value="VES">Bs</option>
                        </select>
                    </div>
                </div>
                <button id="btn-save-asset" class="btn-primary" 
                    style="width:100%; padding:14px; background:#2563eb; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:1rem; transition:background 0.2s;">
                    💾 Registrar Equipo
                </button>
                
                <div style="margin-top:25px;">
                    <h4 style="margin:0 0 15px 0; font-size:1rem;">Registrados</h4>
                    <div id="assets-list"></div>
                </div>
            </div>

            <!-- EXPENSES PANEL -->
            <div id="panel-expenses" class="stat-card" style="display:none; padding:25px;">
                <h3 style="margin:0 0 20px 0; border-bottom:2px solid #e2e8f0; padding-bottom:12px; font-size:1.1rem;">💸 Gastos Operativos</h3>
                
                <!-- New Expense Form -->
                <div style="background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:30px;">
                    <h4 style="margin:0 0 15px 0; color:#475569;">➕ Registrar Nuevo Gasto</h4>
                    <div style="margin-bottom:18px;">
                        <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">Descripción</label>
                        <input id="e-desc" class="input-field" placeholder="Ej: Pago de luz, Artículos de limpieza..." 
                            style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                    </div>
                    
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:15px; margin-bottom:18px;">
                        <div>
                            <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">Monto</label>
                            <input id="e-amount" type="number" class="input-field" placeholder="0.00"
                                style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                        </div>
                        <div>
                            <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">Moneda</label>
                            <select id="e-currency" class="input-field" style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                                <option value="USD">USD</option>
                                <option value="VES">Bs</option>
                            </select>
                        </div>
                        <div>
                            <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">Categoría</label>
                            <select id="e-cat" class="input-field" style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                                <option value="Servicios">Servicios</option>
                                <option value="Consumibles">Consumibles</option>
                                <option value="Mantenimiento">Mantenimiento</option>
                                <option value="Logistica">Logística</option>
                                <option value="Nomina">Nómina</option>
                                <option value="Alquiler">Alquiler</option>
                                <option value="Otros">Otros</option>
                            </select>
                        </div>
                        <div>
                             <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">Fecha</label>
                             <input id="e-date" type="date" class="input-field" value="${new Date().toISOString().split('T')[0]}"
                                style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                        </div>
                    </div>
                    
                    <button id="btn-save-expense" class="btn-primary" 
                        style="width:100%; padding:14px; background:#2563eb; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:1rem; transition:background 0.2s;">
                        💾 Guardar Gasto
                    </button>
                </div>

                <!-- Expenses List & Filters -->
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; flex-wrap:wrap; gap:10px;">
                        <h4 style="margin:0; font-size:1.1rem; color:#334155;">Historial de Gastos</h4>
                        <div style="display:flex; gap:10px;">
                            <input id="search-expenses" type="text" placeholder="🔍 Buscar..." 
                                style="padding:8px 12px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.9rem;">
                            <select id="filter-category" style="padding:8px 12px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.9rem;">
                                <option value="all">Todas las Categorías</option>
                                <option value="Servicios">Servicios</option>
                                <option value="Consumibles">Consumibles</option>
                                <option value="Logistica">Logística</option>
                                <option value="Nomina">Nómina</option>
                            </select>
                        </div>
                    </div>

                    <div style="overflow-x:auto; border-radius:8px; border:1px solid #e2e8f0;">
                         <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
                            <thead style="background:#f8fafc; color:#64748b; font-weight:bold; text-align:left;">
                                <tr>
                                    <th style="padding:12px;">Fecha</th>
                                    <th style="padding:12px;">Descripción</th>
                                    <th style="padding:12px;">Categoría</th>
                                    <th style="padding:12px; text-align:right;">Monto (USD)</th>
                                    <th style="padding:12px; text-align:center;">Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="expenses-list">
                                <!-- Loaded dynamically -->
                            </tbody>
                         </table>
                    </div>
                </div>
            </div>

            <!-- CONTRIBUTIONS PANEL -->
            <div id="panel-contributions" class="stat-card" style="display:none; padding:25px;">
                <h3 style="margin:0 0 20px 0; border-bottom:2px solid #e2e8f0; padding-bottom:12px; font-size:1.1rem;">💰 Aportes de Capital</h3>
                
                <!-- New Contribution Form -->
                <div style="background:#f0fdf4; padding:20px; border-radius:12px; border:1px solid #bbf7d0; margin-bottom:30px;">
                    <h4 style="margin:0 0 15px 0; color:#166534;">➕ Registrar Nuevo Aporte</h4>
                    
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:15px; margin-bottom:18px;">
                         <div>
                             <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">Fecha</label>
                             <input id="contrib-date" type="date" class="input-field" value="${new Date().toISOString().split('T')[0]}"
                                style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                        </div>
                        <div>
                            <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">Socio</label>
                            <select id="contrib-partner" class="input-field" style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                                <option value="Agustín">Agustín Lugo</option>
                                <option value="Juan Manuel">Juan Manuel Márquez</option>
                                <option value="Fondo">Fondo de Inversión</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>
                        <div>
                            <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">Monto (USD)</label>
                            <input id="contrib-amount" type="number" class="input-field" placeholder="0.00"
                                style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                        </div>
                    </div>
                    
                    <div style="margin-bottom:18px;">
                        <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:8px;">Descripción / Notas</label>
                        <input id="contrib-desc" class="input-field" placeholder="Ej: Inyección de capital enero..." 
                            style="width:100%; box-sizing:border-box; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                    </div>
                    
                    <button id="btn-add-contrib" class="btn-primary" 
                        style="width:100%; padding:14px; background:#16a34a; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:1rem; transition:background 0.2s;">
                        💾 Registrar Aporte
                    </button>
                </div>

                <!-- Contributions History -->
                <div>
                     <h4 style="margin:0 0 15px 0; font-size:1.1rem; color:#334155;">Historial de Aportes</h4>
                     <div style="overflow-x:auto; border-radius:8px; border:1px solid #e2e8f0;">
                         <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
                            <thead style="background:#f8fafc; color:#64748b; font-weight:bold; text-align:left;">
                                <tr>
                                    <th style="padding:12px;">Fecha</th>
                                    <th style="padding:12px;">Socio</th>
                                    <th style="padding:12px;">Descripción</th>
                                    <th style="padding:12px;">Monto (USD)</th>
                                    <th style="padding:12px;">Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="contrib-table-body">
                                <tr><td colspan="5" style="text-align:center; padding:20px;">Cargando...</td></tr>
                            </tbody>
                         </table>
                     </div>
                </div>
            </div>

            <!-- DEBUG PANEL -->
            <div id="panel-debug" class="stat-card" style="display:none; border:2px solid #ef4444; padding:25px;">
                <h3 style="margin:0 0 20px 0; border-bottom:2px solid #ef4444; padding-bottom:12px; color:#dc2626; font-size:1.1rem;">🐞 ZONA DE PELIGRO (DEBUG)</h3>
                
                ${isDebug ? `
                    <p style="margin-bottom:20px; font-size:0.9rem; color:#64748b;">Estas acciones afectan la base de datos permanentemente. Úsalas con extrema precaución.</p>
                    <button id="btn-wipe-db" class="btn-primary" 
                        style="width:100%; padding:20px; background:#ef4444; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:1rem; transition:background 0.2s;">
                        💣 BORRAR TODA LA DATA DE PRUEBAS
                    </button>
                ` : `
                    <div style="padding:20px; background:#f1f5f9; border-radius:8px; text-align:center;">
                        <p style="margin:0 0 10px 0;">El modo Debug está desactivado en la configuración global.</p>
                        <small style="color:#64748b;">Edita <code style="background:#e2e8f0; padding:2px 6px; border-radius:4px;">src/core/config.js</code> para activar.</small>
                    </div>
                `}
            </div>
        </div>

        <style>
            .nav-btn.active {
                background: #2563eb !important;
                color: white !important;
            }
            
            .nav-btn:not(.active):hover {
                background: #e2e8f0 !important;
            }
            
            .btn-primary:hover {
                background: #1d4ed8 !important;
            }
            
            #btn-wipe-db:hover {
                background: #dc2626 !important;
            }
            
            .input-field:focus, select:focus {
                outline: none;
                border-color: #2563eb !important;
                box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
            }
            
            @media (max-width: 768px) {
                .stat-card > div[style*="grid-template-columns"] {
                    grid-template-columns: 1fr !important;
                }
            }
        </style>
        `;
    },

    renderContributions(list) {
        const tbody = document.getElementById('contrib-table-body');
        if (!tbody) return;
        tbody.innerHTML = list.map(c => `
            <tr>
                <td>${c.contribution_date}</td>
                <td><b>${c.partner_name}</b></td>
                <td>${c.description || '-'}</td>
                <td style="color:#059669; font-weight:bold;">+$${parseFloat(c.amount).toFixed(2)}</td>
                <td>
                    <button class="btn-delete-contrib" data-id="${c.id}" style="color:red; background:none; border:none; cursor:pointer;">🗑️</button>
                </td>
            </tr>
        `).join('');
    },

    renderAssets(assets) {
        document.getElementById('assets-list').innerHTML = assets.map(a => `
            <div class="flex-between" style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #e2e8f0;">
                <div>
                    <b>${a.name}</b> <small style="color:#64748b;">${a.brand || ''}</small>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span class="font-bold">$${a.cost_usd.toFixed(2)}</span>
                    <button class="btn-delete-asset" data-id="${a.id}" style="color:red; background:none; border:none; cursor:pointer;">🗑️</button>
                </div>
            </div>
        `).join('');
    },

    renderExpenses(expenses) {
        const tbody = document.getElementById('expenses-list');
        if (!expenses || expenses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#64748b;">No hay gastos registrados</td></tr>';
            return;
        }

        tbody.innerHTML = expenses.map(e => `
            <tr style="border-bottom:1px solid #e2e8f0; transition:background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                <td style="padding:12px;">${e.expense_date || 'N/A'}</td>
                <td style="padding:12px; font-weight:500;">${e.description}</td>
                <td style="padding:12px;"><span style="background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:12px; font-size:0.8rem;">${e.category}</span></td>
                <td style="padding:12px; text-align:right; font-weight:bold; color:#ef4444;">-$${e.amount_usd.toFixed(2)}</td>
                <td style="padding:12px; text-align:center;">
                    <button class="btn-delete-expense" data-id="${e.id}" title="Eliminar"
                        style="background:none; border:none; cursor:pointer; font-size:1.1rem; opacity:0.7; transition:opacity 0.2s;">
                        🗑️
                    </button>
                </td>
            </tr>
        `).join('');
    }
};
