export const SettingsView = {
    renderLayout(container, rates) {
        // We can move styles to CSS file, but for now inject if needed or rely on global theme.
        // Assuming theme.css has base styles.

        container.innerHTML = `
        <div class="main-container" style="max-width: 1000px; margin: 0 auto; padding: 20px;">
            <header style="margin-bottom: 30px; text-align: center;">
                <h1 style="margin-bottom:5px; font-size: 1.8rem;">⚙️ Centro de Control</h1>
                <p style="color: #64748b; margin:0; font-size: 0.95rem;">Gestión de divisas e integración web</p>
            </header>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;" class="settings-grid">
                <div class="stat-card" style="padding: 25px; border-top: 4px solid #0f172a;">
                    <h3 style="margin-top:0; margin-bottom: 20px; font-size: 1.1rem;">Actualizar Tasas</h3>
                    <div style="display: flex; flex-direction: column; gap: 18px;">
                        <div class="input-group">
                            <label style="font-weight: 600; font-size: 0.85rem; color: #475569; display: block; margin-bottom: 8px;">DÓLAR (USD)</label>
                            <input type="number" id="set-usd" step="0.01" class="input-field" value="${rates.tasa_usd_ves}" 
                                style="font-size: 1.3rem; padding: 12px; width: 100%; box-sizing: border-box; border: 2px solid #e2e8f0; border-radius: 8px;">
                        </div>
                        <div class="input-group">
                            <label style="font-weight: 600; font-size: 0.85rem; color: #475569; display: block; margin-bottom: 8px;">EURO (EUR)</label>
                            <input type="number" id="set-eur" step="0.01" class="input-field" value="${rates.tasa_eur_ves}" 
                                style="font-size: 1.3rem; padding: 12px; width: 100%; box-sizing: border-box; border: 2px solid #e2e8f0; border-radius: 8px;">
                        </div>
                        <button id="btn-save-settings" class="btn-primary" 
                            style="width: 100%; padding: 15px; font-weight: bold; font-size: 1rem; cursor: pointer; margin-top: 10px; border-radius: 8px; border: none; background: #2563eb; color: white; transition: background 0.2s;">
                            💾 Actualizar y Sincronizar Web
                        </button>
                    </div>
                </div>

                <div class="stat-card" style="padding: 25px; background: #f8fafc; display: flex; flex-direction: column; justify-content: center; align-items: center; border: 2px dashed #cbd5e1; border-radius: 12px; position:relative;">
                    <div style="position:absolute; top:10px; right:10px;">
                        ${rates.is_manual
                ? '<span style="background:#fef2f2; color:#ef4444; padding:4px 8px; border-radius:4px; font-size:0.75rem; border:1px solid #fecaca;">🔒 Manual</span>'
                : '<span style="background:#f0fdf4; color:#16a34a; padding:4px 8px; border-radius:4px; font-size:0.75rem; border:1px solid #bbf7d0;">☁️ BCV Auto</span>'}
                    </div>

                    <p style="color: #64748b; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Tasas de Cambio Actuales</p>
                    
                    <div style="display:flex; gap:20px; align-items:center; margin-bottom:10px;">
                        <div style="text-align:center;">
                            <div style="font-size:0.8rem; color:#64748b;">USD ($)</div>
                            <h2 style="margin: 0; color: #0f172a; font-size: 1.6rem; font-weight: 700;">${rates.tasa_usd_ves.toFixed(2)}</h2>
                        </div>
                        <div style="height:30px; width:1px; background:#cbd5e1;"></div>
                        <div style="text-align:center;">
                            <div style="font-size:0.8rem; color:#64748b;">EUR (€)</div>
                            <h2 style="margin: 0; color: #0f172a; font-size: 1.6rem; font-weight: 700;">${rates.tasa_eur_ves.toFixed(2)}</h2>
                        </div>
                    </div>
                    
                    <div style="background:#f1f5f9; padding:5px 10px; border-radius:6px; font-size:0.85rem; color:#334155;">
                        1 € = ${(rates.tasa_eur_ves / rates.tasa_usd_ves).toFixed(4)} $
                    </div>

                    <div style="margin-top: 20px; text-align: center;">
                        <small style="color: #94a3b8; display: block; font-size: 0.75rem;">Último cambio:</small>
                        <small style="color: #64748b; font-weight: 600; font-size: 0.85rem;">
                            ${rates.updated_at ? new Date(rates.updated_at).toLocaleString() : 'Sin registros'}
                            <br>(${rates.last_update_source || 'MANUAL'})
                        </small>
                    </div>

                    <button id="btn-force-sync" style="margin-top:15px; background:none; border:1px solid #cbd5e1; color:#64748b; cursor:pointer; padding:6px 12px; border-radius:6px; font-size:0.8rem;">
                        🔄 Sincronizar Ahora
                    </button>
                </div>
            </div>

            <div class="stat-card" style="padding: 25px; border-radius: 12px;">
                <h3 style="margin-top:0; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; font-size: 1.1rem;">📜 Historial de Cambios</h3>
                <div id="history-container" class="history-table-container" style="max-height: 400px; overflow-y: auto; overflow-x: auto;">
                    <p style="text-align:center; color:#94a3b8; padding: 20px;">Cargando historial...</p>
                </div>
            </div>

            <!-- MAINTENANCE ZONE -->
            <div class="stat-card" style="padding: 25px; border-radius: 12px; border-top: 4px solid #ef4444; background: #fff1f2;">
                <h3 style="margin-top:0; margin-bottom: 10px; font-size: 1.1rem; color: #b91c1c; display:flex; align-items:center; gap:8px;">
                    🗑️ Zona de Mantenimiento
                </h3>
                <p style="color: #7f1d1d; font-size: 0.9rem; margin-bottom: 20px;">
                    Detecta y elimina pedidos "Pendientes" antiguos (pruebas o errores) que ensucian el sistema.
                </p>
                
                <button id="btn-scan-ghosts" class="btn-primary" 
                    style="background: #ef4444; border: none; padding: 12px 20px; color: white; border-radius: 8px; font-weight: bold; cursor: pointer;">
                    🔍 Escanear Pedidos Fantasma
                </button>

                <div id="cleanup-results" style="margin-top: 20px; display: none;">
                    <!-- Results Injected Here -->
                </div>
            </div>
        </div>

        <style>
            .settings-grid {
                grid-template-columns: 1fr 1fr;
            }
            
            @media (max-width: 768px) {
                .settings-grid {
                    grid-template-columns: 1fr !important;
                }
            }
            
            #btn-save-settings:hover {
                background: #1d4ed8 !important;
            }
            
            #set-usd:focus, #set-eur:focus {
                outline: none;
                border-color: #2563eb;
                box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
            }
        </style>
        `;
    },

    renderHistory(data) {
        const container = document.getElementById('history-container');
        if (!data || data.length === 0) {
            container.innerHTML = "<p style='text-align:center; color:#94a3b8; padding: 20px;'>No hay registros previos.</p>";
            return;
        }

        container.innerHTML = `
            <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; min-width: 400px;">
                <thead>
                    <tr style="text-align: left; color: #64748b; border-bottom: 2px solid #f1f5f9;">
                        <th style="padding: 12px 8px;">Fecha / Hora</th>
                        <th style="padding: 12px 8px;">USD ($)</th>
                        <th style="padding: 12px 8px;">EUR (€)</th>
                        <th style="padding: 12px 8px;">€/$</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(h => `
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 12px 8px; color: #64748b;">${new Date(h.created_at).toLocaleDateString()} <br> <small>${new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></td>
                            <td style="padding: 12px 8px; font-weight: bold;">Bs ${h.tasa_usd.toFixed(2)}</td>
                            <td style="padding: 12px 8px; font-weight: bold;">Bs ${h.tasa_eur.toFixed(2)}</td>
                            <td style="padding: 12px 8px; color: #0f172a; font-weight: 500;">${(h.tasa_eur / h.tasa_usd).toFixed(3)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    renderCleanupList(orders, onDelete) {
        const container = document.getElementById('cleanup-results');
        if (!container) return;

        container.style.display = 'block';

        if (!orders || orders.length === 0) {
            container.innerHTML = `
                <div style="padding: 15px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; color: #166534; text-align: center;">
                    ✅ ¡Sistema limpio! No se encontraron pedidos pendientes antiguos.
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="background: white; border: 1px solid #fecaca; border-radius: 8px; overflow: hidden;">
                <div style="padding: 10px 15px; background: #fef2f2; border-bottom: 1px solid #fecaca; font-weight: bold; color: #991b1b; font-size: 0.9rem;">
                    ⚠️ Se encontraron ${orders.length} pedidos sin completar
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead>
                        <tr style="text-align: left; background: #fff7ed;">
                            <th style="padding: 8px;">Fecha</th>
                            <th style="padding: 8px;">Monto</th>
                            <th style="padding: 8px;">ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.map(o => `
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 8px;">${new Date(o.sale_date).toLocaleDateString()}</td>
                                <td style="padding: 8px;">$${parseFloat(o.total_amount).toFixed(2)}</td>
                                <td style="padding: 8px; font-family: monospace; color: #64748b;">${o.id.substring(0, 6)}...</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div style="padding: 15px; text-align: right; background: #fff;">
                    <button id="btn-confirm-cleanup" style="background: #b91c1c; color: white; border: none; padding: 10px 18px; border-radius: 6px; font-weight: bold; cursor: pointer;">
                        🗑️ Eliminar Definitivamente
                    </button>
                    <p style="font-size: 0.75rem; color: #64748b; margin-top: 5px;">Esta acción no se puede deshacer.</p>
                </div>
            </div>
        `;

        const btnConfirm = document.getElementById('btn-confirm-cleanup');
        if (btnConfirm) {
            btnConfirm.onclick = () => onDelete(orders.map(o => o.id));
        }
    }
};
