
/** Unit Tests **/
const Tests = {
    testAchievementModal: function() {
        console.log("Running Achievement Modal Test...");
        // Mock Data
        game.startTime = Date.now() - 1000 * 60 * 15; // 15 mins
        game.totalRevenue = 3200;
        game.targetRevenue = 3000;
        game.served = 120;
        game.totalErrors = 3;
        game.dailyQualitySum = 100;
        game.dailyDishCount = 120;
        game.history = [
            {day:1, revenue:500, rate:80},
            {day:2, revenue:800, rate:85},
            {day:3, revenue:1200, rate:90},
            {day:4, revenue:1500, rate:88},
            {day:5, revenue:2000, rate:92},
            {day:6, revenue:2800, rate:95},
            {day:7, revenue:3200, rate:96}
        ];
        
        showAchievementDetails();
        console.log("Test completed. Achievement modal should be visible with S rank and Chart.");
    },

    testLocationFlow: function() {
        console.log("Testing Location Flow...");
        showLocationSelection();
        
        const mapNodes = document.querySelectorAll('.map-node');
        if(mapNodes.length > 0) {
            // Test selection logic
            selectMapNode(mapNodes[1], 'bh'); // Select Beach
            if(selectedLocationId !== 'bh') {
                console.error("FAIL: Map selection failed. Expected 'bh', got " + selectedLocationId);
            } else {
                console.log("PASS: Map selection verified (Beach)");
            }
            
            // Test default selection (Downtown is usually first/default)
            selectMapNode(mapNodes[0], 'dt');
            if(selectedLocationId !== 'dt') {
                console.error("FAIL: Map selection failed. Expected 'dt', got " + selectedLocationId);
            } else {
                console.log("PASS: Map selection verified (Downtown)");
            }

        } else {
            console.error("FAIL: No map nodes found in DOM");
        }
        
        console.log("Location flow test complete. (Skipping confirmNewJourney to avoid reload)");
    }
};
