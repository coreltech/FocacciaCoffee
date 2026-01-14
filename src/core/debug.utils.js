import { supabase } from './supabase.js';
import { APP_CONFIG } from './config.js';

export const DebugUtils = {
    async resetDatabase() {
        if (!APP_CONFIG.IS_DEBUG) {
            alert("⚠️ Modo Debug Desactivado. Operación bloqueada.");
            return;
        }

        const confirm1 = confirm("🛑 PELIGRO: ESTO BORRARÁ TODAS LAS VENTAS, PRODUCCIÓN Y MOVIMIENTOS DE INVENTARIO.");
        if (!confirm1) return;

        const confirm2 = prompt("Escribe 'BORRAR-TODO' para confirmar:");
        if (confirm2 !== 'BORRAR-TODO') return alert("Cancelado.");

        try {
            // Delete in order to avoid FK constraints if possible, or Cascade.
            // inventory_transactions depends on sales_orders (maybe?) and production_logs.
            // Actually inventory_transactions links to nothing in terms of ON DELETE CASCADE unless defined.
            // We defined: `reference_id` generic.

            // 1. Clear Inventory Transactions
            const { error: e1 } = await supabase.from('inventory_transactions').delete().neq('id', 0);
            if (e1) throw e1;

            // 2. Clear Sales Items (if separate table) - we have sales_orders
            // If sales_orders has detail items in another table, delete them first.
            // Current schema: sales_orders stores JSON or text? `payment_details` is JSON.
            // Do we have `sales_items`? Migration 01 didn't show it. `sales.js` logic inserted into `sales_orders` directly.

            const { error: e2 } = await supabase.from('sales_orders').delete().neq('id', 0);
            if (e2) throw e2;

            // 3. Clear Production Logs
            const { error: e3 } = await supabase.from('production_logs').delete().neq('id', 0);
            if (e3) throw e3;

            // 4. Reset Stock?
            // If we deleted transactions, the stock remains at last value?
            // No, `sales_prices.stock_disponible` is persistent. 
            // If we wipe history, we should zero out stock? 
            // Or "Reset" means wiping transactions.
            // Let's offer to Zero stock too.
            const confirmZero = confirm("¿Resetear stock de productos a 0 también?");
            if (confirmZero) {
                await supabase.from('sales_prices').update({ stock_disponible: 0 }).neq('id', 0);
            }

            alert("✅ Base de datos (transaccional) limpiada.");
            window.location.reload();

        } catch (err) {
            console.error(err);
            alert("Error: " + err.message);
        }
    }
};
