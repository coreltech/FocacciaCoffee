import { supabase } from '../supabase.js';

export async function loadPlan() {
    const container = document.getElementById('app-content');
    
    // Obtenemos datos para la proyección
    const { data: recipes } = await supabase.from('recipes').select('nombre, precio_venta_usd');
    const { data: sales } = await supabase.from('sales').select('total_usd');
    
    const ventasMensualesActuales = sales?.reduce((acc, v) => acc + v.total_usd, 0) || 0;

    container.innerHTML = `
        <div class="main-container">
            <header class="header-flex">
                <div>
                    <h1>🚀 Plan de Crecimiento Estratégico</h1>
                    <p style="color: #64748b;">Proyecciones basadas en rendimiento actual: <b>$${ventasMensualesActuales.toFixed(2)}/mes</b></p>
                </div>
            </header>

            <div class="main-grid">
                <div class="stat-card" style="border-left: 5px solid #f59e0b;">
                    <span class="badge" style="background:#fef3c7; color:#92400e;">Fase 1: 3 Meses</span>
                    <h3>Eficiencia Operativa</h3>
                    <ul style="padding-left: 20px; font-size: 0.9rem; color: #475569;">
                        <li>Reducir desperdicio de insumos en un 15%.</li>
                        <li>Estandarizar el 100% de las recetas (Fichas Técnicas).</li>
                        <li><b>Meta de Venta:</b> $${(ventasMensualesActuales * 1.2).toFixed(2)} (+20%)</li>
                    </ul>
                </div>

                <div class="stat-card" style="border-left: 5px solid #10b981;">
                    <span class="badge" style="background:#dcfce7; color:#166534;">Fase 2: 6 Meses</span>
                    <h3>Alcance de Mercado</h3>
                    <ul style="padding-left: 20px; font-size: 0.9rem; color: #475569;">
                        <li>Lanzamiento de línea de productos congelados (Bake-at-home).</li>
                        <li>Implementación de programa de suscripción de café.</li>
                        <li><b>Meta de Venta:</b> $${(ventasMensualesActuales * 1.5).toFixed(2)} (+50%)</li>
                    </ul>
                </div>

                <div class="stat-card" style="border-left: 5px solid #3b82f6;">
                    <span class="badge" style="background:#dbeafe; color:#1e40af;">Fase 3: 9 Meses</span>
                    <h3>Inversión en Activos</h3>
                    <ul style="padding-left: 20px; font-size: 0.9rem; color: #475569;">
                        <li>Adquisición de horno de convección industrial.</li>
                        <li>Contratación de 2 panaderos adicionales.</li>
                        <li><b>Inversión Estimada:</b> $2,500 - $4,000.</li>
                    </ul>
                </div>

                <div class="stat-card" style="border-left: 5px solid #7c3aed;">
                    <span class="badge" style="background:#ede9fe; color:#5b21b6;">Fase 4: 12 Meses</span>
                    <h3>Segunda Ubicación / Franquicia</h3>
                    <ul style="padding-left: 20px; font-size: 0.9rem; color: #475569;">
                        <li>Apertura de "Focaccia & Coffee Point" (Formato Express).</li>
                        <li>Digitalización total de la cadena de suministro.</li>
                        <li><b>Meta Anual:</b> $${(ventasMensualesActuales * 2.5).toFixed(2)}</li>
                    </ul>
                </div>
            </div>

            <div class="stat-card" style="margin-top: 20px; background: #0f172a; color: white;">
                <h3>📊 Calculadora de Punto de Equilibrio</h3>
                <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:15px; margin-top:15px;">
                    <div>
                        <label style="font-size:0.8rem;">Gastos Fijos Mensuales ($)</label>
                        <input type="number" id="fix-expenses" class="input-field" value="800" style="color:black;">
                    </div>
                    <div>
                        <label style="font-size:0.8rem;">Margen Bruto Promedio (%)</label>
                        <input type="number" id="avg-margin" class="input-field" value="60" style="color:black;">
                    </div>
                    <div style="display:flex; align-items:flex-end;">
                        <button class="btn-primary" onclick="window.calcGrowth()" style="width:100%; background:#f59e0b;">Calcular Meta</button>
                    </div>
                </div>
                <div id="growth-result" style="margin-top: 20px; font-size: 1.1rem; text-align: center; color: #fbbf24;">
                    Para cubrir tus gastos, debes vender al menos: <b>$1,333.33 al mes</b>
                </div>
            </div>
        </div>
    `;

    // Función global para la calculadora de crecimiento
    window.calcGrowth = () => {
        const gastos = parseFloat(document.getElementById('fix-expenses').value);
        const margen = parseFloat(document.getElementById('avg-margin').value) / 100;
        const meta = gastos / margen;
        document.getElementById('growth-result').innerHTML = `
            Para cubrir gastos y expandirte, tu venta mínima debe ser: <b>$${meta.toFixed(2)} al mes</b><br>
            <small style="color:white;">(Esto equivale a aprox. ${(meta/5).toFixed(0)} focaccias de $5)</small>
        `;
    };
}