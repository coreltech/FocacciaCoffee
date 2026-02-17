
import { supabase } from '../src/core/supabase.js';

async function checkTable() {
    console.log("Checking capital_contributions table...");
    const { data, error } = await supabase.from('capital_contributions').select('*').limit(1);

    if (error) {
        console.error("❌ Error accessing table:", error);
    } else {
        console.log("✅ Table exists. Rows found:", data.length);
    }
}

checkTable();
