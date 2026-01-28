import { supabase } from '../../core/supabase.js';

export const PlansService = {

    async getPlans() {
        const { data, error } = await supabase
            .from('production_plans')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async getPlanById(id) {
        const { data, error } = await supabase
            .from('production_plans')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    async savePlan(plan) {
        // plan: { id? (uuid), name, planned_date, description, items: [{ catalog_id, quantity }] }
        const payload = {
            name: plan.name,
            planned_date: plan.planned_date,
            description: plan.description || null,
            items: plan.items
        };

        if (plan.id) {
            const { data, error } = await supabase
                .from('production_plans')
                .update(payload)
                .eq('id', plan.id)
                .select()
                .single();
            if (error) throw error;
            return data;
        } else {
            const { data, error } = await supabase
                .from('production_plans')
                .insert(payload)
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    },

    async deletePlan(id) {
        const { error } = await supabase.from('production_plans').delete().eq('id', id);
        if (error) throw error;
    },

    // --- LOGICA DE PRODUCION (V5: CALCULADORA PURA) ---

    async calculateSimulation(planItems) {
        // planItems: [{ type: 'recipe'|'supply', id, quantity (is TOTAL weight), unitWeight?, unitCount? }]

        // 🔍 DEBUG LOG ARRAY
        const debugLog = [];
        debugLog.push('🚀 Iniciando simulación de costos...');
        debugLog.push(`📦 Items a procesar: ${planItems.length}`);

        const recipeIds = planItems.filter(i => i.type === 'recipe').map(i => i.id);
        const supplyIds = planItems.filter(i => i.type === 'supply').map(i => i.id);

        // ESTRATEGIA ULTRA-SIMPLE: Consultas planas sin JOINs
        // Evita NetworkError por queries complejas

        let recipes = [];
        let recipeItemsRaw = [];
        let allSupplies = [];

        debugLog.push(`📡 ESTRATEGIA ULTRA-SIMPLE: Consultas planas sin JOINs`);

        // CONSULTA 1: Recetas (solo metadata)
        if (recipeIds.length > 0) {
            debugLog.push(`🔍 Paso 1: Consultando recetas...`);
            const { data: recipesData, error: recipesError } = await supabase
                .from('recipes')
                .select('id, name, expected_weight, tipo_receta')
                .in('id', recipeIds);

            if (recipesError) {
                debugLog.push(`❌ ERROR: ${recipesError.message}`);
            } else {
                recipes = recipesData || [];
                debugLog.push(`✅ ${recipes.length} recetas obtenidas`);
            }

            // CONSULTA 2: Ingredientes (sin JOIN)
            debugLog.push(`🔍 Paso 2: Consultando ingredientes...`);
            const { data: itemsData, error: itemsError } = await supabase
                .from('recipe_items')
                .select('id, recipe_id, supply_id, quantity, percentage, unit_type, is_base')
                .in('recipe_id', recipeIds);

            if (itemsError) {
                debugLog.push(`❌ ERROR: ${itemsError.message}`);
            } else {
                recipeItemsRaw = itemsData || [];
                debugLog.push(`✅ ${recipeItemsRaw.length} ingredientes obtenidos`);
            }
        }

        // CONSULTA 3: Todos los supplies (plana)
        debugLog.push(`🔍 Paso 3: Consultando supplies...`);
        const { data: suppliesData, error: suppliesError } = await supabase
            .from('supplies')
            .select('id, name, unit, last_purchase_price, unit_cost, equivalence, current_stock');

        if (suppliesError) {
            debugLog.push(`❌ ERROR: ${suppliesError.message}`);
        } else {
            allSupplies = suppliesData || [];
            debugLog.push(`✅ ${allSupplies.length} supplies disponibles`);
        }

        // ENRIQUECIMIENTO EN CLIENTE: Crear mapas
        const supplyMap = new Map();
        allSupplies.forEach(s => supplyMap.set(s.id, s));

        // Enriquecer recetas con ingredientes
        recipes.forEach(recipe => {
            const items = recipeItemsRaw.filter(ri => ri.recipe_id.toString() === recipe.id.toString());

            // HARDCODE DE HARINA: Si es MASA y no hay ingrediente base al 100%
            const hasBase = items.some(i => i.is_base && i.percentage === 100);
            if (recipe.tipo_receta === 'MASA' && !hasBase) {
                debugLog.push(`⚠️ Receta MASA sin ingrediente base 100%, buscando harina...`);

                // Buscar harina en supplies
                const harina = allSupplies.find(s => s.name.toLowerCase().includes('harina'));
                if (harina) {
                    items.unshift({
                        id: 'hardcoded-base',
                        recipe_id: recipe.id,
                        supply_id: harina.id,
                        quantity: 0,
                        percentage: 100,
                        unit_type: '%',
                        is_base: true
                    });
                    debugLog.push(`✅ Harina agregada como base: ${harina.name}`);
                }
            }

            // Agregar datos de supply a cada item
            recipe.recipe_items = items.map(item => ({
                ...item,
                supplies: item.supply_id ? supplyMap.get(item.supply_id) : null
            }));

            debugLog.push(`   📌 "${recipe.name}": ${recipe.recipe_items.length} ingredientes`);
        });

        // RESULTS
        let totalInvestment = 0;
        const shoppingListMap = new Map();
        const simulatedItems = [];

        // PROCESS ITEMS
        for (const item of planItems) {
            let itemCost = 0;
            let breakdown = [];
            let warnings = [];

            debugLog.push(`\n--- Procesando: ${item.type} (ID: ${item.id}) ---`);

            if (item.type === 'supply') {
                const supply = supplyMap.get(item.id);
                if (supply) {
                    debugLog.push(`📦 Insumo: ${supply.name}`);

                    const eq = (supply.equivalence && supply.equivalence > 0) ? supply.equivalence : 1;

                    // MULTI-LAYER PRICE FALLBACK
                    let price = supply.last_purchase_price;
                    let priceSource = 'last_purchase_price';

                    if (!price || price === 0) {
                        price = supply.unit_cost;
                        priceSource = 'unit_cost';
                    }

                    if (!price || price === 0) {
                        price = 0.01;
                        priceSource = 'FALLBACK (⚠️ Sin precio en DB)';
                        warnings.push("Sin precio configurado en inventario");
                    }

                    debugLog.push(`💰 Precio: $${price} (fuente: ${priceSource})`);
                    debugLog.push(`📊 Equivalencia: ${eq} | Cantidad: ${item.quantity}`);

                    const cost = (item.quantity / eq) * price;
                    itemCost = cost;

                    debugLog.push(`💵 Costo calculado: $${cost.toFixed(2)}`);

                    addToShoppingList(shoppingListMap, supply, item.quantity);

                    breakdown.push({
                        name: supply.name,
                        qty: item.quantity,
                        unit: supply.unit,
                        cost: cost,
                        hasPrice: priceSource !== 'FALLBACK (⚠️ Sin precio en DB)'
                    });
                } else {
                    warnings.push("Insumo no encontrado");
                    debugLog.push(`❌ ERROR: Insumo no encontrado en DB`);
                }
            }
            else if (item.type === 'dynamic') {
                debugLog.push(`✨ Item Dinámico: ${item.name}`);
                debugLog.push(`💰 Precio Manual: $${item.manualUnitCost} / ${item.unit}`);

                const cost = item.quantity * item.manualUnitCost;
                itemCost = cost;

                debugLog.push(`💵 Costo calculado: ${item.quantity}${item.unit} * $${item.manualUnitCost} = $${cost.toFixed(2)}`);

                breakdown.push({
                    name: item.name,
                    qty: item.quantity,
                    unit: item.unit,
                    cost: cost,
                    hasPrice: true,
                    isDynamic: true
                });

                // Add to shopping list map specific for dynamics to avoid ID collision?
                // Or just use a unique ID. We used 'temp-' timestamp in plan.js so it should be fine.
                // We construct a "fake" supply object.
                const fakeSupply = {
                    id: item.id,
                    name: item.name,
                    unit: item.unit,
                    last_purchase_price: item.manualUnitCost,
                    equivalence: 1
                };
                addToShoppingList(shoppingListMap, fakeSupply, item.quantity);
            }
            else if (item.type === 'recipe') {
                const recipe = recipes.find(r => r.id.toString() === item.id.toString());

                if (recipe) {
                    debugLog.push(`🍳 Receta: ${recipe.name}`);

                    // PESO BASE REAL: Usar expected_weight o calcular suma de ingredientes
                    let baseWeight = recipe.expected_weight;

                    if (!baseWeight || baseWeight <= 0) {
                        // Si no hay expected_weight, calcular suma de ingredientes
                        const tempItems = recipe.recipe_items || [];
                        let calculatedWeight = 0;

                        tempItems.forEach(rItem => {
                            if (rItem.unit_type === '%' && rItem.percentage > 0) {
                                // Para porcentajes, necesitamos una base (asumimos 1000g si no hay base definida)
                                const baseForPercentage = 1000;
                                calculatedWeight += (rItem.percentage / 100) * baseForPercentage;
                            } else {
                                calculatedWeight += rItem.quantity || 0;
                            }
                        });

                        baseWeight = calculatedWeight > 0 ? calculatedWeight : 1;
                        debugLog.push(`⚠️ expected_weight no definido, calculado desde ingredientes: ${baseWeight.toFixed(2)}g`);
                    } else {
                        debugLog.push(`📊 Peso base desde expected_weight: ${baseWeight}g`);
                    }

                    // OBJETIVO: La cantidad que el usuario quiere producir
                    const targetWeight = item.quantity;

                    // FACTOR DE ESCALA CORRECTO: targetWeight / baseWeight
                    // Ejemplo: Usuario pide 500g de una receta de 1300g → factor = 500/1300 = 0.38x
                    const factor = targetWeight / baseWeight;

                    debugLog.push(`📏 Peso base: ${baseWeight}g | Objetivo: ${targetWeight}g | Factor: ${factor.toFixed(4)}x`);

                    // VALIDACIÓN DE SENSATEZ
                    if (factor > 100) {
                        warnings.push(`⚠️ Factor de escala muy alto (${factor.toFixed(0)}x). Verifica las cantidades ingresadas.`);
                        debugLog.push(`⚠️ ALERTA: Factor de escala sospechosamente alto: ${factor.toFixed(2)}x`);
                    }

                    // 4. Ingredientes - USAR ESTRUCTURA ANIDADA
                    const myItems = recipe.recipe_items || [];

                    debugLog.push(`🔍 Buscando ingredientes en recipe.recipe_items... Encontrados: ${myItems.length} ingredientes`);

                    if (myItems.length === 0) {
                        warnings.push("Esta receta no tiene ingredientes configurados");
                        debugLog.push(`⚠️ ADVERTENCIA: Receta sin ingredientes en la estructura anidada`);
                    }

                    for (const rItem of myItems) {
                        const s = rItem.supplies; // nested supply data
                        if (s) {
                            // === FORMULA COMPLETA CON FACTOR DE ESCALA ===
                            // Replicando recipes_pro.view.js línea 230-237

                            // PASO 1: Convertir % a gramos base (si aplica)
                            let baseGrams = rItem.quantity || 0;

                            if (rItem.unit_type === '%' && rItem.percentage > 0) {
                                // Fórmula Panadera: (percentage / 100) * baseWeight
                                baseGrams = (rItem.percentage / 100) * baseWeight;
                                debugLog.push(`     🔄 PORCENTAJE DETECTADO: ${rItem.percentage}%`);
                                debugLog.push(`     📐 Conversión: (${rItem.percentage} / 100) × ${baseWeight}g = ${baseGrams.toFixed(2)}g base`);
                            } else {
                                debugLog.push(`     📏 Cantidad fija: ${baseGrams}${s.unit}`);
                            }

                            // PASO 2: Escalar según factor de producción
                            const reqQty = baseGrams * factor;

                            debugLog.push(`  📌 Ingrediente: ${s.name}`);
                            if (rItem.unit_type === '%') {
                                debugLog.push(`     🎯 Escalado: ${baseGrams.toFixed(2)}g × ${factor.toFixed(4)} = ${reqQty.toFixed(2)}g requeridos`);
                            } else {
                                debugLog.push(`     🎯 Escalado: ${baseGrams}${s.unit} × ${factor.toFixed(4)} = ${reqQty.toFixed(2)}${s.unit}`);
                            }

                            // PASO 3: Calcular precio por unidad mínima
                            // Replicando: cost_per_unit_min = last_purchase_price / equivalence
                            const eq = (s.equivalence && s.equivalence > 0) ? s.equivalence : 1;

                            // MULTI-LAYER PRICE FALLBACK
                            let price = s.last_purchase_price;
                            let priceSource = 'last_purchase_price';

                            if (!price || price === 0) {
                                price = s.unit_cost;
                                priceSource = 'unit_cost';
                            }

                            if (!price || price === 0) {
                                price = 0.01;
                                priceSource = 'FALLBACK';
                                warnings.push(`${s.name}: Sin precio en DB`);
                            }

                            // Costo por gramo/ml
                            const costPerUnitMin = price / eq;

                            debugLog.push(`     💰 Precio: $${price} / ${eq} = $${costPerUnitMin.toFixed(6)} por ${s.unit}`);

                            // PASO 4: Calcular costo total del ingrediente
                            // Replicando: itemCost = realGrams * cost_per_unit_min
                            const cost = reqQty * costPerUnitMin;

                            debugLog.push(`     💵 Costo: ${reqQty.toFixed(2)}${s.unit} × $${costPerUnitMin.toFixed(6)} = $${cost.toFixed(4)}`);

                            if (priceSource === 'FALLBACK') {
                                debugLog.push(`     ⚠️ ADVERTENCIA: Precio no configurado en inventario`);
                            }

                            itemCost += cost;

                            breakdown.push({
                                name: s.name,
                                qty: reqQty,
                                unit: s.unit,
                                cost: cost,
                                hasPrice: priceSource !== 'FALLBACK',
                                isPercentage: rItem.unit_type === '%',
                                percentage: rItem.percentage || 0
                            });

                            addToShoppingList(shoppingListMap, s, reqQty);
                        }
                    }
                    debugLog.push(`✅ Costo total de receta: $${itemCost.toFixed(2)}`);

                    // FILTRO DE SENSATEZ: Alerta si el costo supera $100
                    if (itemCost > 100) {
                        warnings.push(`⚠️ Costo muy alto ($${itemCost.toFixed(2)}). Verifica las cantidades ingresadas.`);
                        debugLog.push(`🚨 ALERTA DE SENSATEZ: Costo de ítem supera $100 ($${itemCost.toFixed(2)})`);
                    }
                } else {
                    warnings.push("Receta no encontrada");
                    debugLog.push(`❌ ERROR: Receta no encontrada en DB`);
                }
            }

            simulatedItems.push({
                ...item,
                calculatedCost: itemCost,
                breakdown: breakdown,
                warnings: warnings
            });
        }

        // GENERATE SHOPPING LIST - CONSOLIDADA (100% de requerimientos, sin validar stock)
        debugLog.push(`\n📋 Generando lista de compras consolidada...`);
        const shoppingList = Array.from(shoppingListMap.values()).map(item => {
            const eq = (item.equivalence && item.equivalence > 0) ? item.equivalence : 1;

            // MULTI-LAYER PRICE FALLBACK
            let price = item.last_purchase_price;
            if (!price || price === 0) price = item.unit_cost;
            if (!price || price === 0) price = 0.01;

            const totalCost = (item.required / eq) * price;
            totalInvestment += totalCost;

            debugLog.push(`   📦 ${item.name}: ${item.required.toFixed(2)}${item.unit} → $${totalCost.toFixed(2)}`);

            return {
                id: item.id,
                name: item.name,
                unit: item.unit,
                required: item.required, // Total requerido (no "missing")
                unitCost: price,
                equivalence: eq,
                costOfRequirement: totalCost
            };
        });

        debugLog.push(`💰 Inversión total calculada: $${totalInvestment.toFixed(2)}`);
        debugLog.push(`✅ Simulación completada`);

        return {
            financials: {
                totalInvestment
            },
            items: simulatedItems,
            shoppingList: shoppingList.sort((a, b) => b.costOfRequirement - a.costOfRequirement),
            debugLog: debugLog // 🔍 Return debug log
        };
    },

    // Selectable Items (Unchanged)
    async getSelectableItems() {
        // Fetch all recipes and supplies
        const [recipes, supplies] = await Promise.all([
            supabase.from('recipes').select('id, name, expected_weight').order('name'),
            supabase.from('supplies').select('id, name, unit').order('name')
        ]);

        const group1 = (recipes.data || []).map(r => ({
            type: 'recipe',
            id: r.id,
            label: `🍳 ${r.name}`,
            base: r.expected_weight
        }));

        const group2 = (supplies.data || []).map(s => ({
            type: 'supply',
            id: s.id,
            label: `📦 ${s.name}`,
            base: 1
        }));

        return [...group1, ...group2];
    }
};

// Helper
function addToShoppingList(map, supply, qty) {
    const existing = map.get(supply.id) || { ...supply, required: 0 };
    existing.required += qty;
    map.set(supply.id, existing);
}
