
/** Unit Tests **/
const Tests = {
    testAchievementModal: function() {
        console.log("Running Achievement Modal Test...");
        // Mock Data
        game.startTime = Date.now() - 1000 * 60 * 15; // 15 mins
        game.totalRevenue = 1200;
        game.targetRevenue = 1000;
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
    },

    testEndGameUIState: function() {
        console.log("Running End Game UI State Test...");
        
        // Setup environment
        if (!game) { console.error("Game object not found"); return; }
        
        // Mock setGameBgImage to capture calls
        const originalSetBg = window.setGameBgImage;
        let lastBgImage = null;
        window.setGameBgImage = function(img) {
            lastBgImage = img;
            if (originalSetBg) originalSetBg(img);
        };
        
        try {
            // 1. Set initial state
            game.isLive = true;
            game.isPaused = false;
            
            // 2. Trigger Pause
            console.log("Action: Pausing game...");
            setPaused(true);
            
            // 3. Verify Background
            // Expected: GAME_BG_PLAY (because we want to see the game, not the home screen)
            if (lastBgImage && lastBgImage.includes('家庭厨房')) {
                console.log("PASS: Background preserved as '家庭厨房' during pause.");
            } else {
                console.error("FAIL: Background changed to: " + lastBgImage);
            }
            
            // 4. Trigger End Game Modal
            console.log("Action: Clicking End Game...");
            window.confirmEndGame();
            
            // 5. Verify Modal Visibility
            const modal = document.getElementById('end-game-modal');
            if (modal && getComputedStyle(modal).display !== 'none') {
                console.log("PASS: End Game Modal is visible.");
            } else {
                console.error("FAIL: End Game Modal is NOT visible.");
            }
            
            // Cleanup
            window.hideEndGameModal();
            setPaused(false);
            
        } catch(e) {
            console.error("Test Error: " + e.message);
        } finally {
            // Restore original function
            window.setGameBgImage = originalSetBg;
        }
        console.log("End Game UI State Test Completed.");
    },

    testAngrySoundSystem: function() {
        console.log("Running Angry Sound System Test...");
        
        // 1. Check Resources
        if (typeof ANGRY_SOUNDS === 'undefined' || !Array.isArray(ANGRY_SOUNDS)) {
            console.error("FAIL: ANGRY_SOUNDS constant missing.");
            return;
        }
        if (ANGRY_SOUNDS.length !== 3) {
            console.error("FAIL: Expected 3 angry sounds, found " + ANGRY_SOUNDS.length);
        } else {
            // Verify new english filenames
            const hasEnglish = ANGRY_SOUNDS.some(s => s.includes('angry_man'));
            if(hasEnglish) console.log("PASS: Sound list configured correctly (English filenames).");
            else console.warn("WARN: Sound list might still be using Chinese filenames.");
        }
        
        // 2. Check Buffers & Fallback
            if (typeof angryBuffers === 'undefined') {
                console.error("FAIL: angryBuffers array missing.");
                return;
            }
            if (typeof angryAudioElements === 'undefined') {
                 console.error("FAIL: angryAudioElements array missing.");
            }
            
            console.log(`INFO: Current loaded buffers: ${angryBuffers.length}/3`);
            console.log(`INFO: Current fallback elements: ${angryAudioElements.length}/3`);
            
            // 3. Test Random Selection Logic
            const originalCreateBufferSource = audioCtx.createBufferSource;
            let playCount = 0;
            
            // Mock to capture playback
            audioCtx.createBufferSource = function() {
                playCount++;
                return {
                    buffer: null,
                    connect: function() {},
                    start: function() { console.log("  -> Mock Sound Played (Web Audio)"); }
                };
            };

            // Mock HTML5 Audio play if needed for test
            const originalPlay = Audio.prototype.play;
            Audio.prototype.play = function() {
                playCount++;
                console.log("  -> Mock Sound Played (HTML5 Fallback)");
                return Promise.resolve();
            };
            
            // Force inject a dummy buffer for testing if empty (simulate async load finished)
            const originalBuffers = [...angryBuffers];
            const injected = angryBuffers.length === 0 && angryAudioElements.length === 0; // Only inject if BOTH are empty
            
            if (injected) {
                // Create a dummy AudioBuffer
                try {
                    const dummy = audioCtx.createBuffer(1, 100, 22050);
                    angryBuffers.push(dummy);
                    console.log("INFO: Injected dummy buffer for logic test");
                } catch(e) {
                    console.log("INFO: Could not create dummy buffer");
                }
            }
            
            try {
                console.log("Action: Triggering playRandomAngrySound()...");
                playRandomAngrySound();
                
                if (playCount > 0) {
                    console.log("PASS: Sound playback triggered successfully.");
                } else {
                    console.error("FAIL: Sound playback NOT triggered (check sfxEnabled).");
                }
                
            } catch(e) {
                console.error("FAIL: Error during playback test: " + e.message);
            } finally {
                // Restore
                audioCtx.createBufferSource = originalCreateBufferSource;
                Audio.prototype.play = originalPlay;
                if (injected) angryBuffers.pop(); 
            }
            console.log("Angry Sound System Test Completed.");
    }
};
