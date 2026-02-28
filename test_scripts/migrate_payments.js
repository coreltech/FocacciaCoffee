import { createClient } from '@supabase/supabase-js';

// Configuración manual para evitar problemas de ESM e importaciones circulares en scripts standalone
const supabaseUrl = 'https://tjikujrwabmbazvjsdmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaWt1anJ3YWJtYmF6dmpzZG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTkxOTQsImV4cCI6MjA4MjI3NTE5NH0.N-yNlmAcVr0-XxV-v-Xc67obYD7ethmLlHZNM4AIBW8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function migratePayments() {
    console.log("🔄 Iniciando migración de pagos a v2_order_payments...");

    try {
        // 1. Obtener todas las órdenes que tienen métodos de pago
        const { data: orders, error: fetchErr } = await supabase
            .from('v2_orders')
            .select('id, payment_methods, settlement_id')
            .not('payment_methods', 'eq', '[]');

        if (fetchErr) throw fetchErr;

        console.log(`📊 Se encontraron ${orders.length} órdenes con pagos para procesar.`);

        const paymentsToInsert = [];

        for (const order of orders) {
            const methods = Array.isArray(order.payment_methods) ? order.payment_methods : [];

            methods.forEach(method => {
                paymentsToInsert.push({
                    order_id: order.id,
                    amount_usd: parseFloat(method.usd || method.amount || 0),
                    payment_method: method.method || 'Unknown',
                    payment_date: method.date || order.created_at || new Date().toISOString(),
                    settlement_id: order.settlement_id // Preservamos si ya estaba liquidado
                });
            });
        }

        if (paymentsToInsert.length === 0) {
            console.log("✅ No hay pagos para migrar.");
            return;
        }

        console.log(`🚀 Insertando ${paymentsToInsert.length} registros en v2_order_payments...`);

        // Insertar en lotes si es necesario, pero para este volumen debería estar bien
        const { error: insErr } = await supabase
            .from('v2_order_payments')
            .insert(paymentsToInsert);

        if (insErr) throw insErr;

        console.log("✅ Migración completada con éxito.");

    } catch (err) {
        console.error("❌ Error durante la migración:", err.message);
    }
}

migratePayments();
