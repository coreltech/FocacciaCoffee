
import { supabase } from '../../core/supabase.js';

async function auditAndFix() {
    console.log("🕵️ Starting Data Audit for Settlement Module...");

    // 1. Sales Orders (amount_paid_usd)
    const { data: sales, error: errSales } = await supabase
        .from('sales_orders')
        .select('id, amount_paid_usd')
        .is('amount_paid_usd', null);

    if (errSales) console.error("Error checking sales:", errSales);
    else {
        console.log(`Found ${sales.length} sales with NULL amount_paid_usd.`);
        if (sales.length > 0) {
            const { error: fixSales } = await supabase
                .from('sales_orders')
                .update({ amount_paid_usd: 0 })
                .is('amount_paid_usd', null);
            console.log(fixSales ? "Error fixing sales" : "✅ Fixed NULL sales.");
        }
    }

    // 2. Purchases (total_usd)
    const { data: purchases, error: errPurchases } = await supabase
        .from('purchases')
        .select('id, total_usd')
        .is('total_usd', null);

    if (errPurchases) console.error("Error checking purchases:", errPurchases);
    else {
        console.log(`Found ${purchases.length} purchases with NULL total_usd.`);
        if (purchases.length > 0) {
            const { error: fixPurchases } = await supabase
                .from('purchases')
                .update({ total_usd: 0 })
                .is('total_usd', null);
            console.log(fixPurchases ? "Error fixing purchases" : "✅ Fixed NULL purchases.");
        }
    }

    // 3. Expenses (total_amount) - Assuming USD or mixed? Finances module treats total_amount as USD usually.
    // Check finances.service.js -> registers 'total_amount'.
    const { data: expenses, error: errExp } = await supabase
        .from('investment_expenses')
        .select('id, total_amount')
        .is('total_amount', null);

    if (errExp) console.error("Error checking expenses:", errExp);
    else {
        console.log(`Found ${expenses.length} expenses with NULL total_amount.`);
        if (expenses.length > 0) {
            const { error: fixExp } = await supabase
                .from('investment_expenses')
                .update({ total_amount: 0 })
                .is('total_amount', null);
            console.log(fixExp ? "Error fixing expenses" : "✅ Fixed NULL expenses.");
        }
    }

    console.log("🏁 Audit Complete.");
}

auditAndFix();
