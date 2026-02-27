const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tjikujrwabmbazvjsdmv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaWt1anJ3YWJtYmF6dmpzZG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTkxOTQsImV4cCI6MjA4MjI3NTE5NH0.N-yNlmAcVr0-XxV-v-Xc67obYD7ethmLlHZNM4AIBW8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    const { data, error } = await supabase
        .from('recipes')
        .select(`
      id, 
      name, 
      expected_weight, 
      tipo_receta,
      recipe_items!recipe_id (
        id, supply_id, quantity, percentage, unit_type, is_base,
        supplies (name, unit, last_purchase_price, equivalence)
      )
    `)
        .order('name', { ascending: true });

    console.log("ERROR:", error);
    console.log("DATA LENGTH:", data ? data.length : 0);
}

test();
