
import { createClient } from '@supabase/supabase-js';

// Credentials from src/core/supabase.js
const supabaseUrl = 'https://tjikujrwabmbazvjsdmv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaWt1anJ3YWJtYmF6dmpzZG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTkxOTQsImV4cCI6MjA4MjI3NTE5NH0.N-yNlmAcVr0-XxV-v-Xc67obYD7ethmLlHZNM4AIBW8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSales() {
    console.log('Checking recent sales (last 30)...');

    const { data: sales, error } = await supabase
        .from('sales_orders')
        .select(`
            id, 
            sale_date, 
            payment_status, 
            payment_method, 
            total_amount, 
            amount_paid_usd
        `)
        .order('sale_date', { ascending: false })
        .limit(30);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (sales.length === 0) {
        console.log('No sales found.');
        return;
    }

    console.table(sales.map(s => ({
        id: s.id, // ID
        date: new Date(s.sale_date).toLocaleDateString(),
        status: s.payment_status,
        method: s.payment_method,
        total: s.total_amount, // Original Total
        paid: s.amount_paid_usd, // The field we are using
        DISCREPANCY: (s.amount_paid_usd === 0 && (s.payment_status === 'paid' || s.payment_status === 'completed')) ? 'XXX PROBLEM XXX' : 'OK'
    })));
}

checkSales();
