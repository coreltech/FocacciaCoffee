import { supabase } from '../supabase.js';

export async function loadPlan() {
    const container = document.getElementById('app-content');
    
    // 1. OBTENEMOS DATOS REALES PARA PROYECCIONES
    // Nota: Usamos sales_orders que es tu tabla principal de ventas
    const { data: sales } = await supabase.from('sales_orders').select('total_amount');
    
    const ventasTotalesHistoricas = sales?.reduce((acc, v) => acc + v.total_amount, 0) || 0;
    // Estimación mensual (esto se puede ajustar con filtros de fecha)
    const ventasMensualesActuales = ventasTotalesHistoricas > 0 ? ventasTotalesHistoricas : 0;

    container.innerHTML = `
        <div class="main-container">
            <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <div>
                    <h1>🚀 Plan de Crecimiento Estratégico</h1>
                    <p style="color: #64748b;">Rendimiento base detectado: <b>$${ventasMensualesActuales.toFixed(2)}</b></p>
                </div>
            </header>

            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:20px;">
                <div class="stat-card" style="border-top: 5px solid #f59e0b;">
                    <span style="background:#fef3c7; color:#92400e; padding:2px 8px; border-radius:10px; font-size:0.7rem; font-weight:bold;">FASE 1: 0-3 MESES</span>
                    <h3 style="margin:10px 0;">Eficiencia Operativa</h3>
                    <ul style="padding-left: 15px; font-size: 0.85rem; color: #475569; line-height:1.6;">
                        <li>Estandarizar fichas técnicas al 100%.</li>
                        <li>Reducir merma de harina y café en 15%.</li>
                        <li><b>Meta de Venta:</b> $${(ventasMensualesActuales * 1.25).toFixed(2)} (+25%)</li>
                    </ul>
                </div>

                <div class="stat-card" style="border-top: 5px solid #10b981;">
                    <span style="background:#dcfce7; color:#166534; padding:2px 8px; border-radius:10px; font-size:0.7rem; font-weight:bold;">FASE 2: 3-6 MESES</span>
                    <h3 style="margin:10px 0;">Escalabilidad</h3>
                    <ul style="padding-left: 15px; font-size: 0.85rem; color: #475569; line-height:1.6;">
                        <li>Lanzar línea "Bake-at-home" (congelados).</li>
                        <li>Alianzas con 3 cafeterías aliadas.</li>
                        <li><b>Meta de Venta:</b> $${(ventasMensualesActuales * 1.6).toFixed(2)} (+60%)</li>
                    </ul>
                </div>

                <div class="stat-card" style="border-top: 5px solid #3b82f6;">
                    <span style="background:#dbeafe; color:#1e40af; padding:2px 8px; border-radius:10px; font-size:0.7rem; font-weight:bold;">FASE 3: 6-9 MESES</span>
                    <h3 style="margin:10px 0;">Industrialización</h3>
                    <ul style="padding-left: 15px; font-size: 0.85rem; color: #475569; line-height:1.6;">
                        <li>Inversión en Horno de Convección.</li>
                        <li>Automatización de pedidos por WhatsApp.</li>
                        <li><b>Inversión:</b> $2,500 - $3,500.</li>
                    </ul>
                </div>

                <div class="stat-card" style="border-top: 5px solid #7c3aed;">
                    <span style="background:#ede9fe; color:#5b21b6; padding:2px 8px; border-radius:10px; font-size:0.7rem; font-weight:bold;">FASE 4: 12 MESES</span>
                    <h3 style="margin:10px 0;">Expansión Point</h3>
                    <ul style="padding-left: 15px; font-size: 0.85rem; color: #475569; line-height:1.6;">
                        <li>Apertura de segundo punto express.</li>
                        <li>Venta de kit de franquicia local.</li>
                        <li><b>Meta Anual:</b> $${(ventasMensualesActuales * 2.5).toFixed(2)}</li>
                    </ul>
                </div>
            </div>

            <div class="stat-card" style="margin-top: 30px; background: #0f172a; color: white;">
                <h3 style="color: #fbbf24;">📊 Simulador de Punto de Equilibrio</h3>
                <p style="font-size:0.8rem; color:#94a3b8; margin-bottom:20px;">Determina cuánto necesitas vender para cubrir tus costos fijos según tu margen actual.</p>
                
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:20px;">
                    <div>
                        <label style="font-size:0.75rem; display:block; margin-bottom:5px;">Gastos Fijos Mensuales (USD)</label>
                        <input type="number" id="fix-expenses" class="input-field" value="800" step="0.01" style="color:white; background:#1e293b; border:1px solid #334155;">
                        <small style="color:#64748b;">Alquiler, sueldos, servicios, internet.</small>
                    </div>
                    <div>
                        <label style="font-size:0.75rem; display:block; margin-bottom:5px;">Margen Bruto Promedio (%)</label>
                        <input type="number" id="avg-margin" class="input-field" value="60" style="color:white; background:#1e293b; border:1px solid #334155;">
                        <small style="color:#64748b;">Lo que te queda tras pagar ingredientes.</small>
                    </div>
                    <div style="display:flex; align-items:flex-start; padding-top:22px;">
                        <button id="btn-calc-growth" class="btn-primary" style="width:100%; background:#f59e0b; border:none; padding:12px; font-weight:bold;">CALCULAR META</button>
                    </div>
                </div>

                <div id="growth-result" style="margin-top: 25px; padding:20px; background:rgba(255,255,255,0.05); border-radius:12px; text-align: center; border: 1px dashed #334155;">
                    Para cubrir tus gastos, debes vender al menos: <b style="color:#fbbf24; font-size:1.4rem;">$1,333.33 al mes</b>
                </div>
            </div>
        </div>
    `;

    // Lógica de la calculadora (sin usar window para evitar conflictos)
    document.getElementById('btn-calc-growth').onclick = () => {
        const gastos = parseFloat(document.getElementById('fix-expenses').value) || 0;
        const margen = (parseFloat(document.getElementById('avg-margin').value) || 1) / 100;
        const meta = gastos / margen;
        
        const resultDiv = document.getElementById('growth-result');
        resultDiv.innerHTML = `
            <div style="font-size:0.9rem; color:#94a3b8;">Tu meta de facturación mínima es:</div>
            <div style="font-size:1.8rem; font-weight:bold; color:#fbbf24; margin:10px 0;">$${meta.toLocaleString('en-US', {minimumFractionDigits:2})}</div>
            <div style="font-size:0.85rem; color:#4ade80;">Equivale a vender aprox. <b>${(meta/4.5).toFixed(0)}</b> unidades de $4.50 mensuales</div>
        `;
    };
}