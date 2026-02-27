import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function checkRecentOrders() {
    const code = fs.readFileSync('./src/core/supabase.js', 'utf8');
    const urlMatch = code.match(/supabaseUrl\s*=\s*['"]([^'"]+)['"]/);
    const keyMatch = code.match(/supabaseAnonKey\s*=\s*['"]([^'"]+)['"]/);

    if (urlMatch && keyMatch) {
        const supabase = createClient(urlMatch[1], keyMatch[1]);
        const { data: orders, error } = await supabase
            .from('sales_orders')
            .select('id, sale_date, customer_id, payment_details, customers!sales_orders_customer_id_fkey(id, name, address, phone)')
            .order('sale_date', { ascending: false })
            .limit(5);

        if (error) {
            console.error('Error:', error);
        } else {
            console.log('Recent 5 Orders:', JSON.stringify(orders, null, 2));
        }
    } else {
        console.log('Credentials not found');
    }
}

checkRecentOrders();
