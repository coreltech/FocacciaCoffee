import { supabase } from './src/core/supabase.js';

async function checkPendingOrders() {
    console.log("Checking v2_orders...");
    const { data: orders, error } = await supabase
        .from('v2_orders')
        .select(`id, is_preorder, status, correlative, v2_order_items (product_name, quantity)`)
        .eq('is_preorder', true)
        .neq('status', 'Entregada');

    if (error) {
        console.error("Error fetching orders:", error);
    } else {
        console.log("Pending Pre-orders found:", JSON.stringify(orders, null, 2));
    }
}

checkPendingOrders();
