import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tjikujrwabmbazvjsdmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaWt1anJ3YWJtYmF6dmpzZG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTkxOTQsImV4cCI6MjA4MjI3NTE5NH0.N-yNlmAcVr0-XxV-v-Xc67obYD7ethmLlHZNM4AIBW8';

async function testShoppingList() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("--- DEBUG getShoppingList ---");

    const { data: orders } = await supabase
        .from('v2_orders')
        .select(`
            id,
            items:v2_order_items!order_id (id, product_id, product_name, quantity)
        `)
        .eq('is_preorder', true)
        .eq('status', 'Pendiente')
        .limit(1);

    if (!orders || orders.length === 0) {
        console.log("No hay órdenes pendientes.");
        return;
    }

    const order = orders[0];
    console.log(`Orden encontrada ID: ${order.id}`);
    console.log(`Items en la orden: ${order.items?.length || 0}`);

    if (!order.items || order.items.length === 0) {
        console.log("La orden no tiene ítems.");
        return;
    }

    const item = order.items[0];
    console.log(`Primer ítem: ${item.product_name} (ID: ${item.product_id}) Qty: ${item.quantity}`);

    const [catalogRes, recipesRes] = await Promise.all([
        supabase.from('v2_catalog').select('id, name, v2_catalog_composition(quantity, supply_id, recipe_id)'),
        supabase.from('v2_recipes').select('id, name, expected_weight, v2_recipe_items!recipe_id(quantity, supply_id, sub_recipe_id)')
    ]);

    const catalogMap = (catalogRes.data || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
    const recipeMap = (recipesRes.data || []).reduce((acc, r) => ({ ...acc, [r.id]: r }), {});

    const product = catalogMap[item.product_id];
    if (!product) {
        console.log(`Producto ${item.product_id} no encontrado en el catálogo.`);
        return;
    }

    console.log(`Composición de ${product.name}: ${product.v2_catalog_composition?.length || 0} elementos.`);

    const totalSupplies = {};
    const addToSupplies = (supplyId, qty) => {
        if (!supplyId) return;
        if (!totalSupplies[supplyId]) totalSupplies[supplyId] = { qty: 0 };
        totalSupplies[supplyId].qty += qty;
    };

    const processRecipe = (recipeId, multiplier) => {
        const recipe = recipeMap[recipeId];
        if (!recipe) { console.log(`  Recipe ID ${recipeId} NOT found in recipeMap`); return; }
        if (!recipe.v2_recipe_items) { console.log(`  Recipe ${recipe.name} HAS NO items`); return; }

        console.log(`  Processing recipe ${recipe.name} with multiplier ${multiplier}`);
        const yieldWeight = recipe.expected_weight || 1;
        const ratio = multiplier / yieldWeight;

        recipe.v2_recipe_items.forEach(ri => {
            if (ri.supply_id) {
                console.log(`    + Supply ${ri.supply_id} qty ${ri.quantity * ratio}`);
                addToSupplies(ri.supply_id, ri.quantity * ratio);
            } else if (ri.sub_recipe_id) {
                processRecipe(ri.sub_recipe_id, ri.quantity * ratio);
            }
        });
    };

    product.v2_catalog_composition.forEach(comp => {
        const totalNeeded = comp.quantity * parseFloat(item.quantity);
        console.log(`Comp: supply=${comp.supply_id}, recipe=${comp.recipe_id}, totalNeeded=${totalNeeded}`);
        if (comp.supply_id) addToSupplies(comp.supply_id, totalNeeded);
        else if (comp.recipe_id) processRecipe(comp.recipe_id, totalNeeded);
    });

    const supplyIds = Object.keys(totalSupplies);
    if (supplyIds.length > 0) {
        const { data: suppliesData } = await supabase.from('v2_supplies').select('id, name').in('id', supplyIds);
        suppliesData.forEach(s => {
            if (totalSupplies[s.id]) totalSupplies[s.id].name = s.name;
        });
        console.log("\nRESULTADO:");
        Object.values(totalSupplies).forEach(s => console.log(`- ${s.name || s.id}: ${s.qty.toFixed(2)}`));
    } else {
        console.log("No supplies consolidated.");
    }
}

testShoppingList();
