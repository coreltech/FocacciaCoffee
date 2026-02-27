/**
 * Servicio de Recetas (Data Access Layer V2)
 * Maneja el corazón de la Fórmula Panadera interactuando con `recipes` y `recipe_items`.
 */
import { supabase } from '../../../core/supabase.js';

export const RecipesService = {

    /**
     * Obtiene todas las recetas y sus dependencias (costos base)
     */
    async getRecipes() {
        try {
            const { data: recipesData, error } = await supabase
                .from('v2_recipes')
                .select(`
                  id, 
                  name, 
                  expected_weight, 
                  recipe_type,
                  instructions,
                  stock,
                  v2_recipe_items!recipe_id (
                      id,
                      quantity,
                      percentage,
                      is_base,
                      supply_id,
                      sub_recipe_id,
                      v2_supplies (
                          id,
                          last_price,
                          measurement_unit
                      )
                  )
                `)
                .order('name', { ascending: true });

            if (error) throw error;

            if (recipesData) {
                // Cálculo de costos dinámicos (Precisión Quirúrgica)
                const costCache = new Map();

                const calculateRecipeCost = (r) => {
                    if (costCache.has(r.id)) return costCache.get(r.id);

                    let totalCost = 0;
                    let totalWeight = 0;

                    if (r.v2_recipe_items) {
                        r.v2_recipe_items.forEach(item => {
                            let itemPricePerGram = 0;

                            if (item.supply_id && item.v2_supplies) {
                                const sup = item.v2_supplies;
                                const unitStr = (sup.measurement_unit || '').toLowerCase().trim();
                                const equiv = (unitStr.includes('kg') || unitStr.includes('kilo') || unitStr === 'l' || unitStr.includes('litro')) ? 1000 : 1;
                                itemPricePerGram = (sup.last_price || 0) / equiv;
                            } else if (item.sub_recipe_id) {
                                const sub = recipesData.find(x => x.id === item.sub_recipe_id);
                                if (sub) {
                                    itemPricePerGram = calculateRecipeCost(sub) / 1000;
                                }
                            }

                            totalCost += itemPricePerGram * item.quantity;
                            totalWeight += item.quantity;
                        });
                    }

                    const cost1kg = totalWeight > 0 ? (totalCost / totalWeight) * 1000 : 0;
                    costCache.set(r.id, cost1kg);
                    return cost1kg;
                };

                recipesData.forEach(r => {
                    r.calculated_cost_1kg = calculateRecipeCost(r);
                    r.ingredient_count = r.v2_recipe_items ? r.v2_recipe_items.length : 0;
                });
            }

            return recipesData || [];
        } catch (err) {
            console.error('Service V2 Error fetching recipes:', err);
            return [];
        }
    },

    /**
     * Carga insumos y otras recetas para los selectores del formulario
     */
    async getSuppliesForDropdown() {
        try {
            const [supplies, recipes] = await Promise.all([
                supabase.from('v2_supplies').select('id, name, measurement_unit, last_price').order('name'),
                supabase.from('v2_recipes').select('id, name').order('name')
            ]);

            return {
                supplies: supplies.data || [],
                recipes: recipes.data || []
            };
        } catch (err) {
            console.error(err);
            return { supplies: [], recipes: [] };
        }
    },

    /**
     * Guarda una Fórmula Panadera completa (Cabecera + Items)
     */
    async saveRecipe(recipeData, itemsData) {
        try {
            // 1. Guardar Cabecera (Receta)
            let recipeId = recipeData.id;

            const payload = {
                name: recipeData.name,
                expected_weight: recipeData.expected_weight,
                recipe_type: recipeData.tipo_receta,
                instructions: recipeData.instructions
            };

            if (recipeId) {
                const { error: updError } = await supabase
                    .from('v2_recipes')
                    .update(payload)
                    .eq('id', recipeId);
                if (updError) throw updError;
            } else {
                const { data: insData, error: insError } = await supabase
                    .from('v2_recipes')
                    .insert([payload])
                    .select();
                if (insError) throw insError;
                recipeId = insData[0].id;
            }

            // 2. Limpiar ingredientes viejos (si es update)
            if (recipeData.id) {
                await supabase.from('v2_recipe_items').delete().eq('recipe_id', recipeId);
            }

            // 3. Insertar nuevos ingredientes (Soporte para sub-recetas)
            const itemsToInsert = itemsData.map(item => ({
                recipe_id: recipeId,
                supply_id: item.type === 'SUPPLY' ? item.id : null,
                sub_recipe_id: item.type === 'RECIPE' ? item.id : null,
                quantity: item.quantity,
                percentage: item.percentage,
                is_base: item.percentage === 100
            }));

            if (itemsToInsert.length > 0) {
                const { error: itemsError } = await supabase
                    .from('v2_recipe_items')
                    .insert(itemsToInsert);
                if (itemsError) throw itemsError;
            }

            return { success: true, recipeId };
        } catch (err) {
            console.error('Service V2 Error saving recipe:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Elimina receta en cascada
     */
    async deleteRecipe(id) {
        try {
            await supabase.from('v2_recipe_items').delete().eq('recipe_id', id);
            const { error } = await supabase.from('v2_recipes').delete().eq('id', id);
            if (error) throw error;
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }
};
