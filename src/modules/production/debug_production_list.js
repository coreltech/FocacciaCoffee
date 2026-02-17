import { createClient } from '@supabase/supabase-js';

// Hardcoded based on previous success
const supabaseUrl = 'https://tjikujrwabmbazvjsdmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaWt1anJ3YWJtYmF6dmpzZG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTkxOTQsImV4cCI6MjA4MjI3NTE5NH0.N-yNlmAcVr0-XxV-v-Xc67obYD7ethmLlHZNM4AIBW8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugProduction() {
    console.log("🔍 Debugging Production Shopping List...");

    // 1. Get Pending Orders (No Join)
    const { data: orders, error: errOrders } = await supabase
        .from('sales_orders')
        .select('id, product_id, quantity')
        .eq('fulfillment_status', 'pendiente');

    if (errOrders) {
        console.error("❌ Error fetching orders:", errOrders);
        return;
    }

    // Manual Join for Product Names
    const pidsToFetch = [...new Set(orders.map(o => o.product_id))];
    const { data: products } = await supabase.from('products').select('id, name').in('id', pidsToFetch);
    const productMap = {};
    (products || []).forEach(p => productMap[p.id] = p.name);

    console.log(`\n📦 Pending Orders: ${orders.length}`);
    const productCounts = {};
    orders.forEach(o => {
        const pname = productMap[o.product_id] || 'Unknown';
        const pid = o.product_id;
        console.log(` - Order: ${o.id.substring(0, 6)} | Product: ${pname} (${pid}) | Qty: ${o.quantity}`);

        if (!productCounts[pid]) productCounts[pid] = { name: pname, qty: 0 };
        productCounts[pid].qty += o.quantity;
    });

    // 2. Check Composition for these products
    const pids = Object.keys(productCounts);
    if (pids.length === 0) {
        console.log("✅ No pending orders. List should be empty.");
        return;
    }

    const { data: compositions, error: errComp } = await supabase
        .from('catalog_composition')
        .select('catalog_id, supply_id, recipe_id')
        .in('catalog_id', pids);

    if (errComp) {
        console.error("❌ Error fetching composition:", errComp);
        return;
    }

    console.log(`\n🧩 Catalog Composition Found: ${compositions.length} entries`);
    pids.forEach(pid => {
        const hasComp = compositions.some(c => c.catalog_id === pid);
        const status = hasComp ? "✅ Has Recipe/Supply" : "❌ MISSING COMPOSITION (Won't show in list)";
        console.log(` - Product: ${productCounts[pid].name} -> ${status}`);
    });

    // 3. Fetch Final View Result
    const { data: shoppingList, error: errView } = await supabase
        .from('v_shopping_list')
        .select('*');

    if (errView) {
        console.error("❌ Error fetching view:", errView);
        return;
    }

    console.log(`\n🛒 Final Shopping List (${shoppingList.length} items):`);
    shoppingList.forEach(item => {
        console.log(` - ${item.insumo_nombre}: ${item.cantidad_total_necesaria} ${item.unidad_medida}`);
    });
}

debugProduction();
