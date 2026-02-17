
export const SettlementView = {
    render(container) {
        container.innerHTML = `
        <div class="settlement-container">
            <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h1 style="font-size:1.8rem; margin:0;">🤝 Liquidación de Periodo</h1>
                <div style="display:flex; gap:10px;">
                    <button id="btn-quick-expense" class="btn-secondary" style="background:#fefce8; color:#a16207; border:1px solid #fde047;">⚡ Gasto Rápido</button>
                    <!-- <button id="btn-history" class="btn-secondary">📜 Historial</button> -->
                </div>
            </header>

            <!-- FILTERS -->
            <div style="background:white; padding:15px; border-radius:8px; border:1px solid #e2e8f0; display:flex; gap:15px; align-items:center; margin-bottom:20px;">
                <div>
                    <label style="font-size:0.8rem; font-weight:bold; color:#64748b;">Desde</label>
                    <input type="date" id="settlement-start" class="input-field" value="${this.getFirstDayOfMonth()}">
                </div>
                <div>
                    <label style="font-size:0.8rem; font-weight:bold; color:#64748b;">Hasta</label>
                    <input type="date" id="settlement-end" class="input-field" value="${(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })()}">
                </div>
                <button id="btn-calc-preview" class="btn-primary" style="height:42px;">📊 Calcular Vista Previa</button>
                <button id="btn-download-pdf" class="btn-secondary" style="height:42px; background:white; color:#0f172a; border:1px solid #cbd5e1; margin-left:10px; display:none;">📄 PDF</button>
                <button id="btn-download-excel" class="btn-secondary" style="height:42px; background:#f0fdf4; color:#166534; border:1px solid #bbf7d0; margin-left:10px; display:none;">📊 Excel</button>
            </div>

            <!-- PREVIEW DASHBOARD -->
            <div id="preview-area" style="display:none;">
                
                <!-- CARDS -->
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:20px; margin-bottom:30px;">
                    
                    <!-- INGRESOS -->
                    <div class="metric-card" style="background:#f0fdf4; border-color:#bbf7d0;">
                        <h3>💰 Entradas (Cobradas)</h3>
                        <div class="value" id="val-incomes" style="color:#166534;">$0.00</div>
                        <small id="count-sales" style="color:#15803d;">0 ventas cobradas</small>
                        <button id="btn-view-sales" class="btn-xs" style="display:block; margin:5px auto; font-size:0.7rem; background:none; border:1px solid #166534; color:#166534; padding:2px 8px; border-radius:4px; cursor:pointer;">👁️ Ver Ventas</button>
                    </div>

                    <!-- EGRESOS -->
                    <div class="metric-card" style="background:#fef2f2; border-color:#fecaca;">
                        <h3>💸 Salidas (Compras + Gastos)</h3>
                        <div class="value" id="val-outcomes" style="color:#991b1b;">$0.00</div>
                        <small id="detail-outcomes" style="color:#b91c1c;">Compras: $0 | Gastos: $0</small>
                        <div style="display:flex; justify-content:center; gap:5px; margin-top:5px;">
                            <button id="btn-view-purchases" class="btn-xs" style="font-size:0.7rem; background:none; border:1px solid #991b1b; color:#991b1b; padding:2px 8px; border-radius:4px; cursor:pointer;">👁️ Ver Compras</button>
                            <button id="btn-view-expenses" class="btn-xs" style="font-size:0.7rem; background:none; border:1px solid #991b1b; color:#991b1b; padding:2px 8px; border-radius:4px; cursor:pointer;">👁️ Ver Gastos</button>
                        </div>
                    </div>

                    <!-- UTILIDAD NETA -->
                    <div class="metric-card" style="background:#eff6ff; border-color:#bfdbfe;">
                        <h3>⚖️ Utilidad Neta</h3>
                        <div class="value" id="val-utility" style="color:#1e40af;">$0.00</div>
                        <small>Flujo de Caja Real</small>
                    </div>
                </div>
                
                <!-- ESTADO DE RESULTADOS DETALLADO (TRANSPARENCIA) -->
                <div style="background:white; border:1px solid #e2e8f0; border-radius:12px; padding:25px; margin-bottom:30px; box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.05);">
                    <h3 style="margin:0 0 20px 0; color:#334155; border-bottom:1px solid #e2e8f0; padding-bottom:10px;">📉 Desglose de Operación (Flujo de Caja)</h3>
                    
                    <div style="display:flex; flex-direction:column; gap:10px; font-size:1rem;">
                        
                        <!-- + INGRESOS -->
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:#f0fdf4; border-radius:6px; border-left:4px solid #166534;">
                            <div>
                                <strong style="color:#166534;">(+) Ventas Totales Cobradas</strong>
                                <div style="font-size:0.8rem; color:#15803d;">Ingresos reales por ventas</div>
                            </div>
                            <strong style="color:#166534; font-size:1.1rem;" id="flow-incomes">$0.00</strong>
                        </div>

                        <div style="text-align:center; color:#94a3b8; font-size:1.2rem; line-height:0.5;">⬇️</div>

                        <!-- - COMPRAS -->
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:#fff1f2; border-radius:6px; border-left:4px solid #be123c;">
                            <div>
                                <strong style="color:#9f1239;">(-) Compras de Insumos</strong>
                                <div style="font-size:0.8rem; color:#be123c;">Reposición de inventario y materia prima</div>
                            </div>
                            <strong style="color:#9f1239; font-size:1.1rem;" id="flow-purchases">$0.00</strong>
                        </div>

                        <!-- - GASTOS -->
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:#fff1f2; border-radius:6px; border-left:4px solid #be123c;">
                            <div>
                                <strong style="color:#9f1239;">(-) Gastos Operativos</strong>
                                <div style="font-size:0.8rem; color:#be123c;">Nómina, servicios, mantenimiento, etc.</div>
                            </div>
                            <strong style="color:#9f1239; font-size:1.1rem;" id="flow-expenses">$0.00</strong>
                        </div>

                        <div style="border-top:2px dashed #cbd5e1; margin:10px 0;"></div>

                        <!-- = UTILIDAD OPERATIVA -->
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:15px; background:#eff6ff; border-radius:8px; border:1px solid #bfdbfe;">
                            <div>
                                <strong style="color:#1e40af; font-size:1.1rem;">(=) Utilidad Operativa</strong>
                                <div style="font-size:0.85rem; color:#3b82f6;">Resultado del Negocio (Antes de Aportes)</div>
                            </div>
                            <strong style="color:#1e40af; font-size:1.4rem;" id="flow-utility">$0.00</strong>
                        </div>
                        
                        <!-- FINANCIAMIENTO (APORTES) -->
                        <div style="text-align:center; color:#94a3b8; font-size:1.2rem; line-height:0.5; margin:10px 0;">⬇️</div>

                        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:#f0fdf4; border-radius:6px; border-left:4px solid #16a34a;">
                            <div>
                                <strong style="color:#15803d;">(+) Aportes de Capital (Socios)</strong>
                                <div style="font-size:0.8rem; color:#166534;">Ingresos por financiamiento (No es venta)</div>
                            </div>
                            <strong style="color:#15803d; font-size:1.1rem;" id="flow-contributions">$0.00</strong>
                        </div>

                        <div style="border-top:2px dashed #cbd5e1; margin:10px 0;"></div>

                         <!-- = SALDO DE CAJA FINAL -->
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:15px; background:#f8fafc; border-radius:8px; border:2px solid #64748b;">
                            <div>
                                <strong style="color:#334155; font-size:1.1rem;">(=) Saldo Final en Caja</strong>
                                <div style="font-size:0.85rem; color:#64748b;">Dinero real disponible</div>
                            </div>
                            <strong style="color:#334155; font-size:1.4rem;" id="flow-cash-balance">$0.00</strong>
                        </div>

                    </div>
                </div>

                <!-- DISTRIBUTION REPORT TEMPLATE -->
                <div style="background:white; border:1px solid #e2e8f0; border-radius:12px; padding:30px; margin-bottom:30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    
                    <!-- HEADER INFORME -->
                    <div style="text-align:center; margin-bottom:25px; border-bottom:2px solid #0f172a; padding-bottom:15px;">
                        <h2 style="margin:0; text-transform:uppercase; letter-spacing:1px; color:#0f172a;">Informe de Liquidación de Periodo</h2>
                        <p style="margin:5px 0 0 0; color:#64748b; font-size:0.9rem;">Unidad de Negocio: <strong>Focaccia & Coffee</strong></p>
                    </div>

                    <!-- ROLES -->
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:25px; font-size:0.9rem;">
                        <div style="background:#f8fafc; padding:15px; border-radius:8px;">
                            <label style="display:block; color:#64748b; font-size:0.8rem; text-transform:uppercase;">Responsable Administrativo</label>
                            <b style="color:#334155; font-size:1rem;">Agustín Lugo Arias</b>
                        </div>
                        <div style="background:#f8fafc; padding:15px; border-radius:8px;">
                            <label style="display:block; color:#64748b; font-size:0.8rem; text-transform:uppercase;">Socio Operativo / Inversionista</label>
                            <b style="color:#334155; font-size:1rem;">Juan Manuel Márquez</b>
                        </div>
                        </div>
                    </div>

                    <!-- DETALLE DE COSTOS (Nuevo Requerimiento) -->
                    <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 25px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        <h3 style="margin-top: 0; color: #334155; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; font-size: 1.1rem;">
                            🧾 Desglose de Costos de Receta (Teórico)
                        </h3>
                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="background-color: #f8fafc; color: #64748b; font-size: 0.85rem; text-align: left;">
                                        <th style="padding: 10px;">Producto Vendido</th>
                                        <th style="padding: 10px; text-align: center;">Cantidad</th>
                                        <th style="padding: 10px; text-align: right;">Costo Unit.</th>
                                        <th style="padding: 10px; text-align: right;">Costo Total</th>
                                    </tr>
                                </thead>
                                <tbody id="prof-breakdown-body">
                                    <tr><td colspan="4" style="padding:20px; text-align:center; color:#94a3b8;">Calcula una vista previa para ver el detalle.</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- ANALISIS DE RENTABILIDAD -->
                    <h3 style="margin-bottom:15px; color:#334155; border-left:4px solid #8b5cf6; padding-left:10px;">📊 Análisis Comp: Receta vs Caja</h3>
                    
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:15px; margin-bottom:25px;">
                        <!-- Teórico -->
                        <div style="background:#f5f3ff; padding:15px; border-radius:8px; border:1px solid #ddd6fe;">
                            <h4 style="margin:0 0 10px 0; color:#5b21b6; font-size:0.95rem;">Estándar (Según Recetas)</h4>
                            <div style="font-size:0.9rem; color:#334155; margin-bottom:4px;">Ventas Totales: <b style="float:right;" id="prof-total-sales">$0.00</b></div>
                            <div style="font-size:0.9rem; color:#dc2626; margin-bottom:4px;">Costo de Receta: <b style="float:right;" id="prof-theo-cost">-$0.00</b></div>
                            <div style="margin-top:8px; border-top:1px solid #ddd6fe; padding-top:6px; font-weight:bold; color:#5b21b6;">
                                Ganancia Teórica: <span style="float:right;" id="prof-theo-profit">$0.00</span>
                            </div>
                        </div>
                        
                        <!-- Comparativa -->
                        <div style="background:#fff1f2; padding:15px; border-radius:8px; border:1px solid #fecdd3;">
                             <h4 style="margin:0 0 10px 0; color:#be123c; font-size:0.95rem;">Eficiencia de Gasto</h4>
                             <div style="font-size:0.9rem; color:#334155; margin-bottom:4px;">Salidas Reales (Caja): <b style="float:right;" id="prof-real-out">$0.00</b></div>
                             <div style="font-size:0.9rem; color:#334155; margin-bottom:4px;">Costo Teórico (Receta): <b style="float:right;" id="prof-theo-cost-2">$0.00</b></div>
                             <div style="margin-top:8px; border-top:1px solid #fecdd3; padding-top:6px; font-weight:bold;">
                                 Diferencia (Gap): <span style="float:right;" id="prof-gap">$0.00</span>
                             </div>
                             <small style="display:block; margin-top:6px; color:#64748b; font-style:italic;" id="prof-gap-msg">
                                Comparativa de gastos reales vs ideales.
                             </small>
                        </div>
                    </div>

                    <!-- RESUMEN REPARTICION -->
                    <h3 style="margin-bottom:15px; color:#334155; border-left:4px solid #2563eb; padding-left:10px;">🗠 Resumen de Repartición (Algoritmo de Socios)</h3>
                    
                    <div style="background:#f8fafc; padding:10px 15px; border-radius:6px; margin-bottom:15px; border:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:bold; color:#64748b; text-transform:uppercase; font-size:0.85rem;">Monto Total a Repartir (Utilidad Neta):</span>
                        <span style="font-weight:bold; color:#1e40af; font-size:1.1rem;" id="dist-base-amount">$0.00</span>
                    </div>

                    <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
                        <thead>
                            <tr style="background:#0f172a; color:white; text-align:left;">
                                <th style="padding:12px; border-radius:6px 0 0 6px;">Entidad / Socio</th>
                                <th style="padding:12px;">Rol</th>
                                <th style="padding:12px;">Participación</th>
                                <th style="padding:12px; text-align:right; border-radius:0 6px 6px 0;">Monto a Liquidar</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- FONDO -->
                            <tr style="border-bottom:1px solid #e2e8f0; background:#f0fdf4;">
                                <td style="padding:12px; font-weight:bold; color:#166534;">Fondo de Inversión</td>
                                <td style="padding:12px; color:#15803d;">Fondo de Capitalización</td>
                                <td style="padding:12px; font-weight:bold;">20%</td>
                                <td style="padding:12px; text-align:right; font-weight:bold; color:#166534; font-size:1.1rem;" id="dist-fund">$0.00</td>
                            </tr>
                            <!-- SOCIOS -->
                            <tr style="border-bottom:1px solid #e2e8f0;">
                                <td style="padding:12px;">Agustín Lugo Arias</td>
                                <td style="padding:12px; color:#64748b;">Gestión y Operación</td>
                                <td style="padding:12px; font-weight:bold;">40%</td>
                                <td style="padding:12px; text-align:right; font-weight:bold; color:#1e40af; font-size:1.1rem;" id="dist-partner-a">$0.00</td>
                            </tr>
                            <tr>
                                <td style="padding:12px;">Juan Manuel Márquez</td>
                                <td style="padding:12px; color:#64748b;">Socio</td>
                                <td style="padding:12px; font-weight:bold;">40%</td>
                                <td style="padding:12px; text-align:right; font-weight:bold; color:#1e40af; font-size:1.1rem;" id="dist-partner-b">$0.00</td>
                            </tr>
                        </tbody>
                    </table>

                    <div style="background:#fff7ed; border:1px solid #fdba74; padding:15px; border-radius:8px; display:flex; gap:10px; align-items:center;">
                         <span style="font-size:1.5rem;">💡</span>
                         <p style="margin:0; font-size:0.9rem; color:#9a3412;">
                            <strong>Recomendación del Sistema:</strong> 
                            <span id="sys-recommendation">El flujo de caja es positivo. Se recomienda mantener el fondo de inversión para imprevistos.</span>
                         </p>
                    </div>

                </div>

                <!-- ACTIONS -->
                <div style="text-align:right;">
                    <button id="btn-execute-liquidation" class="btn-primary" style="background:#0f172a; padding:15px 30px; font-size:1.1rem;">
                        ✅ CONFIRMAR Y LIQUIDAR PERIODO
                    </button>
                    <p style="margin-top:10px; color:#64748b; font-size:0.9rem;">
                        ⚠️ Al confirmar, se marcarán las ventas y gastos como "Liquidados" y no se podrán incluir en futuros cierres.
                    </p>
                </div>

            </div>

            <!-- MODAL QUICK EXPENSE -->
            <div id="modal-quick-expense" class="modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1000; justify-content:center; align-items:center;">
                <div style="background:white; padding:25px; border-radius:12px; width:400px; max-width:90%;">
                    <h3 style="margin-top:0;">⚡ Registrar Gasto Rápido</h3>
                    
                    <label style="display:block; margin-bottom:5px; font-weight:bold;">Concepto</label>
                    <input type="text" id="qe-desc" class="input-field" placeholder="Ej: Taxis, Comida personal..." style="width:100%; margin-bottom:15px;">

                    <label style="display:block; margin-bottom:5px; font-weight:bold;">Monto ($)</label>
                    <input type="number" id="qe-amount" class="input-field" placeholder="0.00" style="width:100%; margin-bottom:15px;">

                    <label style="display:block; margin-bottom:5px; font-weight:bold;">Fecha</label>
                    <input type="date" id="qe-date" class="input-field" value="${new Date().toISOString().split('T')[0]}" style="width:100%; margin-bottom:20px;">

                    <div style="display:flex; justify-content:flex-end; gap:10px;">
                        <button id="btn-cancel-qe" style="background:#f1f5f9; border:none; padding:10px 20px; border-radius:6px; cursor:pointer;">Cancelar</button>
                        <button id="btn-save-qe" style="background:#ef4444; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:bold;">Guardar Gasto</button>
                    </div>
                </div>
            </div>

            <style>
                .input-field { padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; }
                .metric-card { padding: 20px; border-radius: 12px; border: 1px solid #ddd; text-align: center; }
                .metric-card h3 { margin: 0; font-size: 0.9rem; text-transform: uppercase; color: #64748b; }
                .metric-card .value { font-size: 2rem; font-weight: bold; margin: 10px 0; }
                .btn-primary { background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; padding: 0 20px; }
            </style>
        </div>
        `;
    },

    getFirstDayOfMonth() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}-01`;
    },

    updatePreview(data) {
        if (!data) return;
        const { incomes, outcomes, balance, details } = data;

        // Show preview area
        const previewArea = document.getElementById('preview-area');
        if (previewArea) previewArea.style.display = 'block';

        // 1. FINANCIAL FLOW (Detailed)
        try {
            // Incomes
            document.getElementById('flow-incomes').innerText = `$${incomes.total.toFixed(2)}`;

            // Outcomes
            document.getElementById('flow-purchases').innerText = `-$${outcomes.purchases.toFixed(2)}`;
            document.getElementById('flow-expenses').innerText = `-$${outcomes.expenses.toFixed(2)}`;

            // Utility
            const util = balance.netUtility;
            const flowUtility = document.getElementById('flow-utility');
            if (flowUtility) {
                flowUtility.innerText = `$${util.toFixed(2)}`;
                flowUtility.style.color = util >= 0 ? '#1e40af' : '#ef4444';
            }

            // Contributions
            // Calculate total contributions on the fly or use data if available
            // Service returns 'details.contributions' or similar? 
            // In previous service code, 'contributions' was NOT in the root return, but implicitly needed.
            // Let's check Service return again. It had: period, incomes, outcomes, balance, details.
            // It did NOT return 'contributions' array at top level. 
            // BUT it calculated 'balance' using it? No, balance is netUtility.
            // Service Logic: user added 'contributions' to return object?
            // Checking Service:
            // return { period, incomes, outcomes, balance, details: { ..., contributions? } }
            // In the file view I saw: details: { expensesBreakdown, sales, purchasesBreakdown }
            // It seems 'contributions' is MISSING from the return object in Service!
            // I must add it to Service first. 
            // But for now, let's assume it might be missing and handle it.

            // RE-READING SERVICE:
            // I need to add 'contributions' to the returned object in SettlementService.

            // Back to View:
            // I will use a default [] if not present.

            // Cash Balance calculation in View (or better in Service)
            // Service calculates 'netUtility'. 
            // Cash Balance = Net Utility + Contributions.

            // Let's fix the View assuming data is coming (I will fix Service next).
            const totalContribs = (details.contributions || []).reduce((sum, c) => sum + parseFloat(c.amount), 0);
            const elContrib = document.getElementById('flow-contributions');
            if (elContrib) elContrib.innerText = `+$${totalContribs.toFixed(2)}`;

            const cashBal = util + totalContribs;
            const elCash = document.getElementById('flow-cash-balance');
            if (elCash) {
                elCash.innerText = `$${cashBal.toFixed(2)}`;
                elCash.style.color = cashBal >= 0 ? '#334155' : '#ef4444';
            }

        } catch (e) {
            console.error('Error updating flow:', e);
        }

        // 2. CARDS (Summary)
        document.getElementById('val-incomes').innerText = `$${incomes.total.toFixed(2)}`;
        document.getElementById('count-sales').innerText = `${incomes.count} ventas cobradas`;

        document.getElementById('val-outcomes').innerText = `$${outcomes.total.toFixed(2)}`;
        // detail-outcomes might not exist in some templates, check ID
        const detailOut = document.getElementById('detail-outcomes');
        if (detailOut) detailOut.innerText = `Compras: $${outcomes.purchases.toFixed(2)} | Gastos: $${outcomes.expenses.toFixed(2)}`;

        const utilCard = document.getElementById('val-utility');
        if (utilCard) {
            utilCard.innerText = `$${balance.netUtility.toFixed(2)}`;
            utilCard.style.color = balance.netUtility >= 0 ? '#1e40af' : '#ef4444';
        }

        // 3. DISTRIBUTION
        document.getElementById('dist-base-amount').innerText = `$${balance.netUtility.toFixed(2)}`;
        document.getElementById('dist-fund').innerText = `$${balance.fund.toFixed(2)}`;
        document.getElementById('dist-partner-a').innerText = `$${balance.partnerA.toFixed(2)}`;
        document.getElementById('dist-partner-b').innerText = `$${balance.partnerB.toFixed(2)}`;

        // 3.5. PROFITABILITY ANALYSIS
        if (data.profitability) {
            const p = data.profitability;
            document.getElementById('prof-total-sales').innerText = `$${p.totalSales.toFixed(2)}`;
            document.getElementById('prof-theo-cost').innerText = `-$${p.theoreticalCost.toFixed(2)}`;
            document.getElementById('prof-theo-cost-2').innerText = `$${p.theoreticalCost.toFixed(2)}`; // Positive for comparison
            document.getElementById('prof-theo-profit').innerText = `$${p.theoreticalProfit.toFixed(2)}`;

            document.getElementById('prof-real-out').innerText = `$${p.actualCost.toFixed(2)}`;

            const gap = p.gap; // Actual - Theoretical
            const gapEl = document.getElementById('prof-gap');
            const gapMsg = document.getElementById('prof-gap-msg');

            // Logic:
            // Gap > 0: Real Expenses > Theoretical Cost. (Spent more than recipe says).
            // Gap < 0: Real Expenses < Theoretical Cost. (Spent less, high efficiency or using stock).

            if (gap > 0) {
                gapEl.innerText = `+$${gap.toFixed(2)} (Exceso)`;
                gapEl.style.color = '#dc2626'; // Red
                gapMsg.innerText = "Gastaste MÁS de lo que indica la receta. Posible: Compra de Stock, Desperdicio o Robo.";
            } else {
                gapEl.innerText = `${gap.toFixed(2)} (Ahorro)`;
                gapEl.style.color = '#16a34a'; // Green
                gapMsg.innerText = "Gastaste MENOS de lo que indica la receta. Estás consumiendo stock existente o siendo muy eficiente.";
            }
        }

        // 4. RECOMMENDATION
        const recEl = document.getElementById('sys-recommendation');
        if (recEl) {
            const card = recEl.closest('div'); // The container div
            const text = recEl.closest('p');   // The paragraph containing text
            const netUtil = balance.netUtility;

            if (netUtil > 0) {
                if (data.balance.partnerA === 0 && data.balance.fund > 0 && netUtil > 0) {
                    // Caso Umbral Minimo
                    recEl.innerText = "La utilidad es baja (<$20). Se destina todo al Fondo de Inversión.";
                    if (card) {
                        card.style.background = '#fefce8'; // Yellow background
                        card.style.borderColor = '#fde047';
                    }
                    if (text) text.style.color = '#854d0e';
                } else {
                    recEl.innerText = "El flujo es positivo. Se aplica 20% al Fondo y 80% a Socios.";
                    if (card) {
                        card.style.background = '#fff7ed';
                        card.style.borderColor = '#fdba74';
                    }
                    if (text) text.style.color = '#9a3412';
                }
            } else {
                recEl.innerText = "El flujo de caja es negativo o neutro. No hay utilidades para repartir en este periodo. Se recomienda revisar gastos operativos.";
                if (card) {
                    card.style.background = '#fef2f2';
                    card.style.borderColor = '#fecaca';
                }
                if (text) text.style.color = '#991b1b';
            }
        }

    },

    toggleQuickExpenseModal(show) {
        document.getElementById('modal-quick-expense').style.display = show ? 'flex' : 'none';
        if (show) {
            document.getElementById('qe-desc').focus();
        } else {
            document.getElementById('qe-desc').value = '';
            document.getElementById('qe-amount').value = '';
        }
    },

    renderDetailsModal(title, items, type) {
        // type: 'purchase' | 'expense' | 'sale'

        const headers = type === 'purchase'
            ? ['Fecha', 'Proveedor', 'Documento', 'Monto ($)']
            : type === 'expense'
                ? ['Fecha', 'Descripción', 'Categoría', 'Monto ($)']
                : ['Fecha', 'Cliente', 'Estado', 'Monto ($)']; // Updated Sales Headers

        const rows = items.map(item => {
            if (type === 'purchase') {
                return `
                    <tr>
                        <td>${new Date(item.purchase_date).toLocaleDateString()}</td>
                        <td>${item.supplier?.name || '-'}</td>
                        <td>${item.document_number || '-'}</td>
                        <td class="text-right">$${parseFloat(item.total_usd || 0).toFixed(2)}</td>
                    </tr>`;
            } else if (type === 'expense') {
                return `
                    <tr>
                        <td>${new Date(item.expense_date).toLocaleDateString()}</td>
                        <td>${item.description}</td>
                        <td>${item.category}</td>
                        <td class="text-right">$${parseFloat(item.amount_usd || 0).toFixed(2)}</td>
                    </tr>`;
            } else { // Sales
                return `
                    <tr>
                        <td>${new Date(item.sale_date).toLocaleDateString()}</td>
                        <td>${item.customer_name || 'Cliente Casual'}</td>
                        <td>${item.payment_status}</td>
                        <td class="text-right">$${parseFloat(item.amount_paid_usd || 0).toFixed(2)}</td>
                    </tr>`;
            }
        }).join('');

        const modalHtml = `
            <div id="modal-details" class="modal-overlay" style="display:flex; align-items:center; justify-content:center;">
                <div class="purchase-modal-content" style="max-height:80vh; max-width:800px;">
                    <div class="purchase-header-bar">
                        <h3>${title}</h3>
                        <button class="btn-close" id="close-details-modal" style="color:white;">✕</button>
                    </div>
                    <div class="purchase-body">
                        <div class="purchase-table-container">
                            <table class="purchase-table">
                                <thead>
                                    <tr>
                                        ${headers.map(h => `<th>${h}</th>`).join('')}
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rows.length > 0 ? rows : '<tr><td colspan="4" class="text-center">No hay registros</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div style="padding:15px; text-align:right; border-top:1px solid #e2e8f0;">
                         <button class="btn-primary" id="close-modal-btn">Cerrar</button>
                    </div>
                </div>
            </div>
        `;

        // Remove existing if any
        document.getElementById('modal-details')?.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const close = () => document.getElementById('modal-details').remove();
        document.getElementById('close-details-modal').onclick = close;
        document.getElementById('close-modal-btn').onclick = close;
    }
};
