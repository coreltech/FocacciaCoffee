import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function testSupabase() {
    const code = fs.readFileSync('./src/core/supabase.js', 'utf8');
    const urlMatch = code.match(/supabaseUrl\s*=\s*['"]([^'"]+)['"]/);
    const keyMatch = code.match(/supabaseAnonKey\s*=\s*['"]([^'"]+)['"]/);

    if (urlMatch && keyMatch) {
        const supabase = createClient(urlMatch[1], keyMatch[1]);

        console.log("--- TEST SALES ORDERS ---");
        const { data: orders, error: oErr } = await supabase
            .from('sales_orders')
            .select('id, sale_date, customer_id, payment_details')
            .order('sale_date', { ascending: false })
            .limit(10);

        console.log("Error:", oErr);
        console.log("Recent Orders:", JSON.stringify(orders, null, 2));
    } else {
        console.log("Credenciales no encontradas en el archivo.");
    }
}

testSupabase();
