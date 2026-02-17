
import { createClient } from '@supabase/supabase-js';
import { APP_CONFIG } from '../src/core/config.js';

// Since this runs in Node, we need valid imports or env vars.
// Assuming config.js exports SUPABASE_URL and KEY as strings.
// However, I suspect config.js might not be safe for Node if it uses window/document.
// I will copy the config values directly or try to import if safe.
// To be safe, I'll hardcode or read from a mocked config.
// Wait, I cannot know the key easily from here unless I read config.js.
// I'll read config.js first to get the key, or try to import it.
// If the import fails, I'll extract it with regex.

const supabaseUrl = 'https://tjikujrwabmbazvjsdmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaWt1anJ3YWJtYmF6dmpzZG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTkxOTQsImV4cCI6MjA4MjI3NTE5NH0.N-yNlmAcVr0-XxV-v-Xc67obYD7ethmLlHZNM4AIBW8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSettlement() {
    const startDate = '2026-01-01';
    // const startDate = '2026-01-01'; // Removed
    // const endDate = '2026-12-31'; // Removed

    console.log(`\n--- DEBUGGING SETTLEMENT (ALL DATA) ---`); // Updated log message

    try {
        // 1. SALES
        console.log("1. Querying ALL SALES..."); // Updated log message
        const { data: sales, error: errSales } = await supabase
            .from('sales_orders')
            .select('id, total_amount, payment_status, payment_date'); // Updated select fields
        // Removed .eq('payment_status', 'paid')
        // Removed .gte('payment_date', ...)
        // Removed .lte('payment_date', ...)

        if (errSales) console.error("Sales Error:", errSales);
        else {
            console.log(`Total Sales found: ${sales.length}`); // Updated log message
            const paidSales = sales.filter(s => s.payment_status === 'paid'); // Added filter for paid sales
            console.log(`Paid Sales: ${paidSales.length}`); // Added log for paid sales count
            // Removed total amount calculation
            console.log("Sample Sale:", sales[0]);
        }

        // 2. EXPENSES
        console.log("\n2. Querying ALL EXPENSES..."); // Updated log message
        const { data: expenses, error: errExp } = await supabase
            .from('operational_expenses')
            .select('*');
        // Removed .gte('expense_date', startDate)
        // Removed .lte('expense_date', endDate)

        if (errExp) console.error("Expenses Error:", errExp);
        else {
            console.log(`Total Expenses found: ${expenses.length}`); // Updated log message
            // Removed total amount calculation
            console.log("Sample Expense:", expenses[0]);
        }

        // 3. CONTRIBUTIONS
        console.log("\n3. Querying ALL CONTRIBUTIONS..."); // Updated log message
        const { data: contribs, error: errCont } = await supabase
            .from('capital_contributions')
            .gte('contribution_date', startDate)
            .lte('contribution_date', endDate);

        if (errCont) console.error("Contributions Error:", errCont);
        else {
            console.log(`Contributions found: ${contribs.length}`);
            if (contribs.length > 0) {
                console.log("Total Amount:", contribs.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0));
                console.log("Sample Contribution:", contribs[0]);
            }
        }

    } catch (e) {
        console.error("Debug Error:", e);
    }
}

debugSettlement();
