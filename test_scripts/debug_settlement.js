
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tjikujrwabmbazvjsdmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaWt1anJ3YWJtYmF6dmpzZG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTkxOTQsImV4cCI6MjA4MjI3NTE5NH0.N-yNlmAcVr0-XxV-v-Xc67obYD7ethmLlHZNM4AIBW8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQueries() {
    const startDate = '2026-01-01';
    const endDate = '2026-02-28';

    console.log("--- Testing Sales Query (New Syntax) ---");
    const { data: sales, error: errSales } = await supabase
        .from('sales_orders')
        .select('id, sale_date, customer_id, customers(name), product_name, amount_paid_usd, payment_status, client_name')
        .gte('sale_date', `${startDate}T00:00:00`)
        .lte('sale_date', `${endDate}T23:59:59`)
        .limit(1);

    if (errSales) {
        console.error("❌ Sales Query Failed:", errSales);
    } else {
        console.log("✅ Sales Query Success. Row:", sales[0]);
    }

    console.log("\n--- Testing Purchases Query ---");
    const { data: purchases, error: errPurchases } = await supabase
        .from('purchases')
        .select('purchase_date, supplier_id, total_usd')
        .gte('purchase_date', startDate)
        .lte('purchase_date', endDate)
        .limit(1);

    if (errPurchases) {
        console.error("❌ Purchases Query Failed:", errPurchases);
    } else {
        console.log("✅ Purchases Query Success. Row:", purchases[0]);
    }

    console.log("\n--- Testing Expenses Query ---");
    const { data: expenses, error: errExp } = await supabase
        .from('investment_expenses')
        .select('total_amount, category')
        .gte('date', startDate)
        .lte('date', endDate)
        .limit(1);

    if (errExp) {
        console.error("❌ Expenses Query Failed:", errExp);
    } else {
        console.log("✅ Expenses Query Success. Row:", expenses[0]);
    }
}

testQueries();
