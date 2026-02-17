
import { createClient } from '@supabase/supabase-js';

// Configuration - Replace with your actual project URL and Anon Key
const supabaseUrl = 'https://tjikujrwabmbazvjsdmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaWt1anJ3YWJtYmF6dmpzZG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTkxOTQsImV4cCI6MjA4MjI3NTE5NH0.N-yNlmAcVr0-XxV-v-Xc67obYD7ethmLlHZNM4AIBW8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function backfillPaymentDates() {
    console.log("🔄 Starting backfill of payment_date...");

    // 1. Fetch sales that are PAID but have NO payment_date
    const { data: sales, error } = await supabase
        .from('sales_orders')
        .select('id, sale_date')
        .or('payment_status.eq.Pagado,payment_status.eq.paid,payment_status.eq.completed')
        .is('payment_date', null);

    if (error) {
        console.error("❌ Error fetching sales:", error);
        return;
    }

    console.log(`📊 Found ${sales.length} sales to backfill.`);

    let updated = 0;
    let errors = 0;

    for (const sale of sales) {
        // Use sale_date as fallback for payment_date
        const { error: updateError } = await supabase
            .from('sales_orders')
            .update({ payment_date: sale.sale_date }) // Assuming sale_date has time, if not adds T00:00:00 implicitly by DB or keeps formatting
            .eq('id', sale.id);

        if (updateError) {
            console.error(`❌ Failed to update sale ${sale.id}:`, updateError);
            errors++;
        } else {
            updated++;
        }
    }

    console.log(`✅ Backfill complete.`);
    console.log(`Updated: ${updated}`);
    console.log(`Errors: ${errors}`);
}

backfillPaymentDates();
