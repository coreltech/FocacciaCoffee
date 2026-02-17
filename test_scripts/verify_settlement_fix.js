
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tjikujrwabmbazvjsdmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaWt1anJ3YWJtYmF6dmpzZG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTkxOTQsImV4cCI6MjA4MjI3NTE5NH0.N-yNlmAcVr0-XxV-v-Xc67obYD7ethmLlHZNM4AIBW8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySettlementLogic() {
    const startDate = '2026-01-01';
    const endDate = '2026-02-28';

    console.log(`🔎 Verifying Settlement Logic for ${startDate} to ${endDate}...`);

    // 1. Purchases (Insumos)
    const { data: purchases, error: errP } = await supabase
        .from('purchases')
        .select('total_usd')
        .gte('purchase_date', startDate)
        .lte('purchase_date', endDate);

    if (errP) { console.error("Error Purchases:", errP); return; }
    const totalPurchases = purchases.reduce((sum, p) => sum + (p.total_usd || 0), 0);
    console.log(`✅ Total Purchases (Insumos): $${totalPurchases.toFixed(2)}`);

    // 2. Operational Expenses (Gastos Operativos - NEW SOURCE)
    const { data: expenses, error: errE } = await supabase
        .from('operational_expenses')
        .select('amount_usd')
        .gte('expense_date', startDate)
        .lte('expense_date', endDate);

    if (errE) { console.error("Error Expenses:", errE); return; }
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount_usd || 0), 0);
    console.log(`✅ Total Operational Expenses (Admin): $${totalExpenses.toFixed(2)} (Count: ${expenses.length})`);

    // 3. Investment Expenses (OLD SOURCE - Should be ignored or empty if migration happened)
    const { data: oldExp } = await supabase
        .from('investment_expenses')
        .select('total_amount')
        .gte('date', startDate)
        .lte('date', endDate);

    const totalOld = oldExp ? oldExp.reduce((sum, e) => sum + (e.total_amount || 0), 0) : 0;
    console.log(`ℹ️ (Ref) Total Investment Expenses (Old Source): $${totalOld.toFixed(2)} - THIS SHOULD NOT BE INCLUDED IN SETTLEMENT`);

    // 4. Grand Total Outcome
    const totalOutcome = totalPurchases + totalExpenses;
    console.log(`\n💰 CALCULATED TOTAL OUTCOME: $${totalOutcome.toFixed(2)}`);
}

verifySettlementLogic();
