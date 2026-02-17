import { createClient } from '@supabase/supabase-js';

// Hardcoded based on previous success
const supabaseUrl = 'https://tjikujrwabmbazvjsdmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaWt1anJ3YWJtYmF6dmpzZG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTkxOTQsImV4cCI6MjA4MjI3NTE5NH0.N-yNlmAcVr0-XxV-v-Xc67obYD7ethmLlHZNM4AIBW8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrders() {
    console.log("🔍 Checking specific pending orders...");

    const { data: orders, error } = await supabase
        .from('sales_orders')
        .select(`
            id, 
            sale_date, 
            customer_id, 
            total_amount,
            product_id,
            quantity
        `)
        .eq('fulfillment_status', 'pendiente');

    if (error) {
        console.error(error);
        return;
    }

    // Fetch customer names manually to avoid join issues
    const custIds = [...new Set(orders.map(o => o.customer_id))];
    const { data: customers } = await supabase.from('customers').select('id, name').in('id', custIds);
    const custMap = {};
    (customers || []).forEach(c => custMap[c.id] = c.name);

    // Fetch product names
    const prodIds = [...new Set(orders.map(o => o.product_id))];
    const { data: products } = await supabase.from('products').select('id, name').in('id', prodIds);
    const prodMap = {};
    (products || []).forEach(p => prodMap[p.id] = p.name);

    console.log(`\n📋 Found ${orders.length} pending orders:`);
    orders.forEach(o => {
        const cName = custMap[o.customer_id] || 'Unknown Customer';
        const pName = prodMap[o.product_id] || 'Unknown Product';
        console.log(`- Order #${o.id.substring(0, 6)} | ${new Date(o.sale_date).toLocaleString()} | ${cName} | ${o.quantity} x ${pName} ($${o.total_amount})`);
    });
}

checkOrders();
