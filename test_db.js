import { supabase } from './src/core/supabase.js';

async function check() {
    console.log("Checking V2 Purchases Tables...");
    const { data: s, error: se } = await supabase.from('v2_suppliers').select('count');
    console.log("Suppliers check:", se ? se.message : "OK");

    const { data: p, error: pe } = await supabase.from('v2_purchases').select('count');
    console.log("Purchases check:", pe ? pe.message : "OK");

    const { data: pi, error: pie } = await supabase.from('v2_purchase_items').select('count');
    console.log("Purchase Items check:", pie ? pie.message : "OK");
}

check();
