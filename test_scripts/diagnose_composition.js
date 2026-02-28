import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tjikujrwabmbazvjsdmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaWt1anJ3YWJtYmF6dmpzZG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTkxOTQsImV4cCI6MjA4MjI3NTE5NH0.N-yNlmAcVr0-XxV-v-Xc67obYD7ethmLlHZNM4AIBW8';

async function diagnoseFocaccia() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("--- Diagnóstico de Focaccia ---");

    // 1. Buscar producto Focaccia
    const { data: catalog, error: catErr } = await supabase
        .from('v2_catalog')
        .select('id, name')
        .ilike('name', '%focaccia%');

    if (catErr) {
        console.error("Error catálogo:", catErr);
        return;
    }

    if (catalog.length === 0) {
        console.log("No se encontró producto con nombre 'focaccia'");
        return;
    }

    console.log("Productos encontrados:", catalog.map(p => p.name));

    for (const prod of catalog) {
        console.log(`\n--- Analizando: ${prod.name} (ID: ${prod.id}) ---`);

        const { data: comp, error: compErr } = await supabase
            .from('v2_catalog_composition')
            .select('*')
            .eq('catalog_id', prod.id);

        if (compErr) { console.error("Error comp:", compErr); continue; }

        console.log("Composición primaria (BOM):", JSON.stringify(comp, null, 2));

        for (const c of comp) {
            if (c.supply_id) {
                const { data: supply } = await supabase.from('v2_supplies').select('name').eq('id', c.supply_id).single();
                console.log(`  [Insumo] ${supply?.name || c.supply_id} x ${c.quantity}`);
            }
            if (c.recipe_id) {
                const { data: recipe } = await supabase
                    .from('v2_recipes')
                    .select('id, name, expected_weight')
                    .eq('id', c.recipe_id)
                    .single();

                console.log(`  [Receta] ${recipe?.name || c.recipe_id} (Peso: ${recipe?.expected_weight}) - Cant: ${c.quantity}`);

                const { data: items, error: itemErr } = await supabase
                    .from('v2_recipe_items')
                    .select('*')
                    .eq('recipe_id', c.recipe_id);

                if (itemErr) { console.error("Error items:", itemErr); continue; }

                console.log(`    Items de la receta (${items.length}):`);
                for (const ri of items) {
                    if (ri.supply_id) {
                        const { data: s } = await supabase.from('v2_supplies').select('name').eq('id', ri.supply_id).single();
                        console.log(`      * Insumo: ${s?.name || ri.supply_id} x ${ri.quantity}`);
                    } else if (ri.sub_recipe_id) {
                        console.log(`      * Sub-receta ID: ${ri.sub_recipe_id} x ${ri.quantity}`);
                    }
                }
            }
        }
    }
}

diagnoseFocaccia();
