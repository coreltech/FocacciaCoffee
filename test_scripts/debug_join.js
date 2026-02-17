
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tjikujrwabmbazvjsdmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaWt1anJ3YWJtYmF6dmpzZG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTkxOTQsImV4cCI6MjA4MjI3NTE5NH0.N-yNlmAcVr0-XxV-v-Xc67obYD7ethmLlHZNM4AIBW8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testJoin() {
    console.log("--- Testing Join Sales -> Customers ---");

    // Attempt 1: Standard join assuming FK 'customer_id' -> 'customers.id'
    const { data: sales, error: errSales } = await supabase
        .from('sales_orders')
        .select('id, amount_paid_usd, customer_id, customers(name, email)')
        .limit(1);

    if (errSales) {
        console.error("❌ Join Failed:", errSales);

        // Fallback: Check customers table directly to see if it allows reading
        console.log("Checking customers table access...");
        const { data: cust, error: errCust } = await supabase
            .from('customers')
            .select('*')
            .limit(1);

        if (errCust) console.error("❌ Customers table access failed:", errCust);
        else console.log("✅ Customers table access OK:", cust[0]);

    } else {
        console.log("✅ Join Success. Row:", JSON.stringify(sales[0], null, 2));
    }
}

testJoin();
