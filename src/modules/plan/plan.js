import { supabase } from '../../core/supabase.js';

export async function loadPlan() {
    const container = document.getElementById('app-content');

    // 1. Obtención de datos para proyecciones dinámicas
    const { data: sales } = await supabase.from('sales_orders').select('total_amount');
    const ventasTotales = sales?.reduce((acc, v) => acc + (parseFloat(v.total_amount) || 0), 0) || 0;

    // Suponemos que las ventas actuales son el rendimiento base
    const baseMensual = ventasTotales > 0 ? ventasTotales : 500; // 500 como fallback simbólico

    container.innerHTML = `
        <div class="main-container" style="padding: 15px;">
            <header style="margin-bottom: 25px;">
                <h1 style="font-size: 1.8rem; margin: 0;">🚀 Plan de Crecimiento Estratégico</h1>
                <p style="color: #64748b; margin-top: 5px;">Rendimiento base detectado: <b style="color: #0f172a;">$${baseMensual.toFixed(2)}</b></p>
            </header>

            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:20px;">
                
                <div class="stat-card" style="border-top: 5px solid #f59e0b; position: relative;">
                    <span style="position: absolute; top: 15px; right: 15px; background:#fef3c7; color:#92400e; padding:2px 10px; border-radius:12px; font-size:0.65rem; font-weight:800;">MES 1-3</span>
                    <h3 style="margin: 0 0 15px 0; color: #1e293b;">🎯 Optimización</h3>
                    <ul style="padding-left: 18px; font-size: 0.85rem; color: #475569; line-height:1.7;">
                        <li>Estandarizar **Fichas Técnicas** en la Biblioteca.</li>
                        <li>Reducir mermas mediante control de inventario.</li>
                        <li style="margin-top:10px; color: #b45309;"><b>Meta de Venta:</b> $${(baseMensual * 1.25).toFixed(2)}</li>
                    </ul>
                </div>

                <div class="stat-card" style="border-top: 5px solid #10b981; position: relative;">
                    <span style="position: absolute; top: 15px; right: 15px; background:#dcfce7; color:#166534; padding:2px 10px; border-radius:12px; font-size:0.65rem; font-weight:800;">MES 4-6</span>
                    <h3 style="margin: 0 0 15px 0; color: #1e293b;">📈 Escalabilidad</h3>
                    <ul style="padding-left: 18px; font-size: 0.85rem; color: #475569; line-height:1.7;">
                        <li>Lanzar línea de focaccias pre-cocidas/congeladas.</li>
                        <li>Establecer 2 puntos de distribución (Aliados).</li>
                        <li style="margin-top:10px; color: #15803d;"><b>Meta de Venta:</b> $${(baseMensual * 1.6).toFixed(2)}</li>
                    </ul>
                </div>

                <div class="stat-card" style="border-top: 5px solid #3b82f6; position: relative;">
                    <span style="position: absolute; top: 15px; right: 15px; background:#dbeafe; color:#1e40af; padding:2px 10px; border-radius:12px; font-size:0.65rem; font-weight:800;">MES 7-12</span>
                    <h3 style="margin: 0 0 15px 0; color: #1e293b;">🏭 Consolidación</h3>
                    <ul style="padding-left: 18px; font-size: 0.85rem; color: #475569; line-height:1.7;">
                        <li>Inversión en equipamiento profesional.</li>
                        <li>Primer local físico o "Dark Kitchen" propia.</li>
                        <li style="margin-top:10px; color: #1d4ed8;"><b>Inversión estimada:</b> $2,000 - $4,000</li>
                    </ul>
                </div>
            </div>

            <div class="stat-card" style="margin-top: 30px; background: #0f172a; color: white; padding: 25px;">
                <h3 style="color: #fbbf24; margin-top: 0; display: flex; align-items: center; gap: 10px;">
                    ⚖️ Simulador de Punto de Equilibrio
                </h3>
                <p style="font-size:0.85rem; color:#94a3b8; margin-bottom:25px;">Calcula cuánto necesitas vender para cubrir tus costos fijos según tu margen actual.</p>
                
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:25px;">
                    <div>
                        <label style="font-size:0.75rem; color: #fbbf24; font-weight: bold; display:block; margin-bottom:8px;">GASTOS FIJOS (MENSUAL USD)</label>
                        <input type="number" id="fix-expenses" class="input-field" value="800" step="10" 
                            style="color:white; background:#1e293b; border:1px solid #334155; padding: 12px;">
                        <small style="color:#64748b; display:block; margin-top:5px;">(Local, sueldos, servicios)</small>
                    </div>
                    <div>
                        <label style="font-size:0.75rem; color: #fbbf24; font-weight: bold; display:block; margin-bottom:8px;">MARGEN BRUTO (%)</label>
                        <input type="number" id="avg-margin" class="input-field" value="60" 
                            style="color:white; background:#1e293b; border:1px solid #334155; padding: 12px;">
                        <small style="color:#64748b; display:block; margin-top:5px;">(Ganancia tras pagar ingredientes)</small>
                    </div>
                    <div style="display:flex; align-items:flex-start; padding-top:24px;">
                        <button id="btn-calc-growth" class="btn-primary" style="width:100%; background:#fbbf24; color:#0f172a; border:none; padding:15px; font-weight:bold; cursor:pointer;">
                            CALCULAR META REAL
                        </button>
                    </div>
                </div>

                <div id="growth-result" style="margin-top: 30px; padding:25px; background:rgba(255,255,255,0.05); border-radius:12px; text-align: center; border: 1px dashed #334155;">
                    <div style="font-size:1rem; color:#94a3b8;">Facturación mínima requerida:</div>
                    <div style="font-size:2.2rem; font-weight:bold; color:#fbbf24; margin:10px 0;">$1,333.33</div>
                    <div style="font-size:0.9rem; color:#4ade80;">Debes vender aprox. <b>296</b> unidades de $4.50 al mes</div>
                </div>
            </div>
        </div>
    `;

    // Lógica del Simulador
    document.getElementById('btn-calc-growth').onclick = () => {
        const gastos = parseFloat(document.getElementById('fix-expenses').value) || 0;
        const margenPorcentaje = parseFloat(document.getElementById('avg-margin').value) || 1;

        // Fórmula del Punto de Equilibrio
        const margenDecimal = margenPorcentaje / 100;
        const puntoEquilibrio = gastos / margenDecimal;

        const resultDiv = document.getElementById('growth-result');
        resultDiv.innerHTML = `
            <div style="font-size:1rem; color:#94a3b8;">Para cubrir gastos y no perder dinero, debes vender:</div>
            <div style="font-size:2.5rem; font-weight:bold; color:#fbbf24; margin:10px 0;">$${puntoEquilibrio.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div style="font-size:0.9rem; color:#4ade80;">O lo que es igual: <b>$${(puntoEquilibrio / 30).toFixed(2)} por día</b></div>
            <div style="margin-top:15px; font-size:0.8rem; color:#94a3b8; border-top: 1px solid #334155; pt:15px;">
                Cualquier dólar por encima de esta cifra es <b>utilidad neta</b>.
            </div>
        `;
    };
}