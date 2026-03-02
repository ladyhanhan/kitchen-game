
// Dump KMES Debug Info
console.log("=== KMES DEBUG START ===");

// 1. Check Recipes Names
if (typeof RECIPES !== 'undefined') {
    console.log("RECIPES Names:", RECIPES.map(r => r.name));
} else {
    console.log("RECIPES is undefined!");
}

// 2. Check Active Orders & Sorting
if (typeof game !== 'undefined' && game.activeOrders) {
    console.log("Active Orders (Raw):", JSON.stringify(game.activeOrders.map(o => ({ dishes: o.dishes.map(d => d.name || d.n), patience: o.patience }))));
    
    // Simulate Sorting
    const sorted = [...game.activeOrders].sort((a, b) => (a.patience || 0) - (b.patience || 0));
    console.log("Active Orders (Sorted by Patience):", JSON.stringify(sorted.map(o => ({ dishes: o.dishes.map(d => d.name || d.n), patience: o.patience }))));
} else {
    console.log("No active orders");
}

// 3. Check Inventory
if (typeof game !== 'undefined' && game.dailyInventory) {
    console.log("Inventory:", JSON.stringify(game.dailyInventory));
}

// 4. Simulate KMES Logic Step-by-Step
if (typeof game !== 'undefined' && typeof stations !== 'undefined' && typeof RECIPES !== 'undefined') {
    console.log("--- Simulation ---");
    
    // Step 1: Needed
    const needed = {};
    game.activeOrders.forEach(order => {
        order.dishes.forEach(d => {
            const name = d.name || d.n;
            needed[name] = (needed[name] || 0) + 1;
        });
    });
    console.log("Needed:", JSON.stringify(needed));

    // Step 2: InProgress
    const inProgress = {};
    Object.keys(stations).forEach(sid => {
        const s = stations[sid];
        console.log(`Station ${sid}: Stage=${s.stage}`);
        if (s.stage !== 'IDLE') {
            if (s.stage === 'FINISHED' && s.dishResult) {
                console.log(`  -> FINISHED: ${s.dishResult.name}`);
                inProgress[s.dishResult.name] = (inProgress[s.dishResult.name] || 0) + 1;
            } else if (s.stage === 'COOKING' && s.recipe) {
                console.log(`  -> COOKING: ${s.recipe.name}`);
                inProgress[s.recipe.name] = (inProgress[s.recipe.name] || 0) + 1;
            } else if (s.stage === 'PREP_ING') {
                const analysis = analyzeDish(s.currentIngredients);
                console.log(`  -> PREP_ING: Ingredients=${JSON.stringify(s.currentIngredients)}, Analysis=${analysis ? analysis.name : 'null'}`);
                if (analysis && analysis.name !== '黑暗料理') {
                    inProgress[analysis.name] = (inProgress[analysis.name] || 0) + 1;
                }
            }
        }
    });
    console.log("InProgress:", JSON.stringify(inProgress));

    // Step 3: Target
    let targetDishName = null;
    for (const name in needed) {
        if ((inProgress[name] || 0) < needed[name]) {
            targetDishName = name;
            break;
        }
    }
    console.log("Target Dish:", targetDishName);

    if (targetDishName) {
        // Step 4: Recipe
        const recipe = RECIPES.find(r => r.name === targetDishName);
        console.log("Recipe Found:", recipe ? "Yes" : "No");

        if (recipe) {
            // Step 5: Inventory Check
            let stockOK = true;
            if (game.level !== 1 && game.dailyInventory) {
                for (const ingId of recipe.ingredients) {
                    const count = game.dailyInventory[ingId] || 0;
                    console.log(`  Ingredient ${ingId}: Stock=${count}`);
                    if (count <= 0) stockOK = false;
                }
            }
            console.log("Stock OK:", stockOK);
        }
    }
}

console.log("=== KMES DEBUG END ===");
