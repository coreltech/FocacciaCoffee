
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tjikujrwabmbazvjsdmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaWt1anJ3YWJtYmF6dmpzZG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTkxOTQsImV4cCI6MjA4MjI3NTE5NH0.N-yNlmAcVr0-XxV-v-Xc67obYD7ethmLlHZNM4AIBW8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSales() {
    console.log("🔍 Checking sales_orders...");

    // Get first 5 sales
    const { data: sales, error } = await supabase
        .from('sales_orders')
        .select('id, payment_status, payment_date, sale_date')
        .limit(10);

    if (error) {
        console.error("❌ Error:", error);
        return;
    }

    console.table(sales);
    console.log(`Total visible: ${sales.length}`);
}

checkSales();
