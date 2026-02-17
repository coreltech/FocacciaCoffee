
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tjikujrwabmbazvjsdmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaWt1anJ3YWJtYmF6dmpzZG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTkxOTQsImV4cCI6MjA4MjI3NTE5NH0.N-yNlmAcVr0-XxV-v-Xc67obYD7ethmLlHZNM4AIBW8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDebug() {
    console.log("🔍 Checking Sales Orders...");
    const { data: sales, error: salesError } = await supabase
        .from('sales_orders')
        .select('id, sale_date, product_name, product_id, amount_paid_usd, total_amount')
        .order('id', { ascending: false })
        .limit(5);

    if (salesError) {
        console.error("❌ Error fetching sales:", salesError);
        return;
    }
    console.log(`✅ Found ${sales.length} recent sales.`);
    console.table(sales);

    if (sales.length === 0) {
        console.log("⚠️ No sales found to check.");
        return;
    }

    const productIds = sales.map(s => s.product_id).filter(id => id); // Filter nulls
    console.log("\n🔍 Checking Sales Prices for Product IDs:", productIds);

    const { data: products, error: prodError } = await supabase
        .from('sales_prices')
        .select('id, product_name, costo_unitario_referencia, esta_activo')
        .in('id', productIds);

    if (prodError) {
        console.error("❌ Error fetching products:", prodError);
        return;
    }

    console.log(`✅ Found ${products.length} matching products.`);
    console.table(products);

    // Cross check
    console.log("\n🕵️ MATCHING ANALYSIS:");
    sales.forEach(sale => {
        const product = products.find(p => p.id === sale.product_id);
        if (!product) {
            console.log(`❌ Sale ${sale.id} (${sale.product_name}) - Product ID ${sale.product_id} NOT FOUND in sales_prices.`);
        } else {
            const cost = product.costo_unitario_referencia;
            const status = product.esta_activo ? 'Active' : 'Inactive';
            if (cost === 0 || cost === null || cost === undefined) {
                console.log(`⚠️ Sale ${sale.id} (${sale.product_name}) - Found Product but Cost is ZERO/NULL (${cost}). Status: ${status}`);
            } else {
                console.log(`✅ Sale ${sale.id} (${sale.product_name}) - Cost: ${cost}. Status: ${status}`);
            }
        }
    });
}

runDebug();
