
/** Unit Tests **/
const Tests = {
    testStartButtonDayLine: function() {
        console.log("Running Start Button Day Line Test...");
        const el = document.getElementById('btn-start-dayline');
        if (!el) {
            console.error("FAIL: #btn-start-dayline not found.");
            return;
        }
        const originalGet = window.getOperatedDaysSafe;
        const runCase = (value, expectedText) => {
            window.getOperatedDaysSafe = () => value;
            try { updateStartButtonDayLine(); } catch (e) { console.error("FAIL: updateStartButtonDayLine threw: " + e.message); return; }
            const got = el.textContent;
            if (got !== expectedText) {
                console.error(`FAIL: operatedDays=${value} expected "${expectedText}" got "${got}"`);
            } else {
                console.log(`PASS: operatedDays=${value} -> "${got}"`);
            }
        };
        try {
            runCase(0, 'DAY 1');
            runCase(1, 'DAY 2');
            runCase(99, 'DAY 100');
            runCase(null, 'DAY --');
            runCase(undefined, 'DAY --');
        } finally {
            window.getOperatedDaysSafe = originalGet;
        }
        console.log("Start Button Day Line Test Completed.");
    },
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
    ,
    testGlobalTitleConsistency: function() {
        console.log("Running Global Title Consistency Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof loadStoreContext !== 'function') { console.error("FAIL: loadStoreContext missing."); return; }
        if (typeof reconcilePlayerProfile !== 'function') { console.error("FAIL: reconcilePlayerProfile missing."); return; }
        if (typeof updatePlayerTitle !== 'function') { console.error("FAIL: updatePlayerTitle missing."); return; }
        if (typeof saveGameState !== 'function') { console.error("FAIL: saveGameState missing."); return; }
        if (typeof saveStoreContext !== 'function') { console.error("FAIL: saveStoreContext missing."); return; }

        const backup = {
            activeStoreId: game.activeStoreId,
            stores: JSON.stringify(game.stores || {}),
            inventory: JSON.stringify(game.inventory || {}),
            level: game.level,
            titleLevel: game.titleLevel,
            playerProfile: JSON.stringify(game.playerProfile || null)
        };

        const assertEq = (name, a, b) => {
            if (a === b) console.log("PASS: " + name);
            else console.error(`FAIL: ${name}. Expected ${b}, got ${a}`);
        };

        try {
            game.stores = {
                'cn:main': { level: 1, inventory: { pot: 0, belt: 0, fridge: 0, expansion: 2 }, ingredientAge: {} },
                'jp:shibuya': { level: 1, inventory: { pot: 0, belt: 0, fridge: 0, expansion: 0 }, ingredientAge: {} }
            };

            loadStoreContext('cn:main');
            reconcilePlayerProfile();
            updatePlayerTitle();
            assertEq("title level derived from max expansion (cn=2)", game.playerProfile.titleLevel, 3);

            loadStoreContext('jp:shibuya');
            reconcilePlayerProfile();
            updatePlayerTitle();
            assertEq("title level stays global after switching to jp", game.playerProfile.titleLevel, 3);

            game.inventory.expansion = 4;
            saveStoreContext();
            reconcilePlayerProfile();
            updatePlayerTitle();
            assertEq("title level increases when any store upgrades (jp=4)", game.playerProfile.titleLevel, 5);

            loadStoreContext('cn:main');
            reconcilePlayerProfile();
            updatePlayerTitle();
            assertEq("title level remains after switching back to cn", game.playerProfile.titleLevel, 5);

            const originalSetItem = localStorage.setItem.bind(localStorage);
            try {
                localStorage.setItem = function() { throw new Error("mock storage failure"); };
                saveGameState();
                const pending = window.__pendingGameStateWrites && window.__pendingGameStateWrites['gameState'];
                if (pending && typeof pending.json === 'string' && pending.json.includes('"playerProfile"')) {
                    console.log("PASS: save falls back to pending write cache on storage failure.");
                } else {
                    console.error("FAIL: pending write cache missing or incomplete on storage failure.");
                }
            } finally {
                localStorage.setItem = originalSetItem;
            }
        } catch (e) {
            console.error("FAIL: Global Title Consistency Test crashed:", e);
        } finally {
            try {
                game.activeStoreId = backup.activeStoreId;
                game.stores = JSON.parse(backup.stores || "{}");
                game.inventory = JSON.parse(backup.inventory || "{}");
                game.level = backup.level;
                game.titleLevel = backup.titleLevel;
                game.playerProfile = backup.playerProfile ? JSON.parse(backup.playerProfile) : null;
                if (typeof reconcilePlayerProfile === 'function') reconcilePlayerProfile();
                if (typeof updatePlayerTitle === 'function') updatePlayerTitle();
            } catch (_) {}
        }
        console.log("Global Title Consistency Test Completed.");
    }
    ,
    testSettlementTrendPerStore: function() {
        console.log("Running Settlement Trend Per Store Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof showResult !== 'function') { console.error("FAIL: showResult missing."); return; }
        if (typeof loadStoreContext !== 'function') { console.error("FAIL: loadStoreContext missing."); return; }

        const backup = {
            activeStoreId: game.activeStoreId,
            stores: JSON.stringify(game.stores || {}),
            history: JSON.stringify(game.history || []),
            isLive: game.isLive,
            isPaused: game.isPaused
        };

        const originals = {
            playResultSfx: window.playResultSfx,
            stopKMES: window.stopKMES,
            updateGameBackground: window.updateGameBackground,
            switchScreen: window.switchScreen,
            stopMusic: window.stopMusic
        };

        try {
            window.playResultSfx = () => {};
            window.stopKMES = () => {};
            window.updateGameBackground = () => {};
            window.switchScreen = () => {};
            window.stopMusic = () => {};

            game.history = [
                { day: 1, revenue: 111, rate: 90 },
                { day: 2, revenue: 222, rate: 90 }
            ];
            game.stores = {
                'cn:main': { level: 1, inventory: { expansion: 0 }, ingredientAge: {}, history: [
                    { day: 1, revenue: 100, rate: 90 },
                    { day: 2, revenue: 200, rate: 90 }
                ] },
                'jp:shibuya': { level: 1, inventory: { expansion: 0 }, ingredientAge: {}, history: [
                    { day: 1, revenue: 7777, rate: 90 },
                    { day: 2, revenue: 8888, rate: 90 },
                    { day: 3, revenue: 9999, rate: 90 }
                ] }
            };

            loadStoreContext('jp:shibuya');
            game.isLive = false;
            game.isPaused = false;

            showResult("<b>Test</b><br>");
            const desc = document.getElementById('modal-desc');
            if (!desc) {
                console.error("FAIL: modal-desc not found.");
                return;
            }
            const html = desc.innerHTML || "";
            if (html.includes("营收: ¥9999") && html.includes("营收: ¥7777")) {
                console.log("PASS: Settlement trend uses active store history (jp).");
            } else if (html.includes("营收: ¥222") || html.includes("营收: ¥111")) {
                console.error("FAIL: Settlement trend still uses global history.");
            } else {
                console.error("FAIL: Could not verify settlement trend source.");
            }
        } catch (e) {
            console.error("FAIL: Settlement Trend Per Store Test crashed:", e);
        } finally {
            try {
                game.activeStoreId = backup.activeStoreId;
                game.stores = JSON.parse(backup.stores || "{}");
                game.history = JSON.parse(backup.history || "[]");
                game.isLive = backup.isLive;
                game.isPaused = backup.isPaused;
            } catch (_) {}
            window.playResultSfx = originals.playResultSfx;
            window.stopKMES = originals.stopKMES;
            window.updateGameBackground = originals.updateGameBackground;
            window.switchScreen = originals.switchScreen;
            window.stopMusic = originals.stopMusic;
        }
        console.log("Settlement Trend Per Store Test Completed.");
    }
    ,
    testAutoResetHandOnSettlementModal: function() {
        console.log("Running Auto Reset Hand On Settlement Modal Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof showResult !== 'function') { console.error("FAIL: showResult missing."); return; }

        const backup = {
            holdingThing: window.holdingThing,
            stations: (typeof window.stations === 'object' && window.stations) ? JSON.stringify(window.stations) : null,
            renderStation: window.renderStation,
            playResultSfx: window.playResultSfx,
            stopKMES: window.stopKMES,
            updateGameBackground: window.updateGameBackground,
            updateHomeTopLeftBoardMode: window.updateHomeTopLeftBoardMode,
            getActiveStoreHistory: window.getActiveStoreHistory
        };

        try {
            window.playResultSfx = () => {};
            window.stopKMES = () => {};
            window.updateGameBackground = () => {};
            window.updateHomeTopLeftBoardMode = () => {};
            window.getActiveStoreHistory = () => [];

            if (typeof window.stations !== 'object' || !window.stations) window.stations = {};
            window.stations.s1 = { id: 's1', stage: 'IDLE', currentIngredients: [], dishResult: null, recipe: null, progress: 0, maintenance: 0 };

            let renderCalls = 0;
            window.renderStation = () => { renderCalls += 1; };

            for (let i = 0; i < 3; i++) {
                window.stations.s1.stage = 'IDLE';
                window.stations.s1.dishResult = null;
                window.stations.s1.recipe = null;

                window.holdingThing = { type: 'DISH', val: { name: '测试菜品', price: 10 }, sourceSid: 's1' };
                showResult('');

                const s = window.stations.s1;
                const okDishReturned = (!window.holdingThing) && s && s.stage === 'FINISHED' && s.dishResult && s.dishResult.name === '测试菜品';
                if (okDishReturned) console.log(`PASS: dish auto-reset on settlement (run=${i + 1}).`);
                else console.error(`FAIL: dish not auto-reset on settlement (run=${i + 1}).`);
            }

            for (let i = 0; i < 3; i++) {
                window.holdingThing = { type: 'INGREDIENT', val: { id: 'butter', name: '黄油', icon: '🧈' } };
                showResult('');
                if (!window.holdingThing) console.log(`PASS: ingredient auto-clear on settlement (run=${i + 1}).`);
                else console.error(`FAIL: ingredient not cleared on settlement (run=${i + 1}).`);
            }

            if (renderCalls > 0) console.log("PASS: renderStation called during auto-reset.");
            else console.error("FAIL: renderStation not called; dish may not have been restored.");
        } catch (e) {
            console.error("FAIL: Auto Reset Hand On Settlement Modal Test crashed:", e);
        } finally {
            window.holdingThing = backup.holdingThing;
            window.renderStation = backup.renderStation;
            window.playResultSfx = backup.playResultSfx;
            window.stopKMES = backup.stopKMES;
            window.updateGameBackground = backup.updateGameBackground;
            window.updateHomeTopLeftBoardMode = backup.updateHomeTopLeftBoardMode;
            window.getActiveStoreHistory = backup.getActiveStoreHistory;
            try { window.stations = backup.stations ? JSON.parse(backup.stations) : window.stations; } catch (_) {}
        }
        console.log("Auto Reset Hand On Settlement Modal Test Completed.");
    }
    ,
    testAutoResetHandOnBankruptModal: function() {
        console.log("Running Auto Reset Hand On Bankrupt Modal Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof showBankruptModal !== 'function') { console.error("FAIL: showBankruptModal missing."); return; }

        const backup = {
            holdingThing: window.holdingThing,
            stations: (typeof window.stations === 'object' && window.stations) ? JSON.stringify(window.stations) : null,
            renderStation: window.renderStation,
            playSfx: window.playSfx,
            dailyKPI: game.dailyKPI
        };

        try {
            window.playSfx = () => {};
            game.dailyKPI = 1000;

            if (typeof window.stations !== 'object' || !window.stations) window.stations = {};
            window.stations.s1 = { id: 's1', stage: 'IDLE', currentIngredients: [], dishResult: null, recipe: null, progress: 0, maintenance: 0 };

            let renderCalls = 0;
            window.renderStation = () => { renderCalls += 1; };

            for (let i = 0; i < 3; i++) {
                const existing = document.getElementById('bankrupt-modal');
                if (existing) existing.remove();

                window.stations.s1.stage = 'IDLE';
                window.stations.s1.dishResult = null;
                window.stations.s1.recipe = null;

                window.holdingThing = { type: 'DISH', val: { name: '测试菜品', price: 10 }, sourceSid: 's1' };
                showBankruptModal(0);

                const s = window.stations.s1;
                const okDishReturned = (!window.holdingThing) && s && s.stage === 'FINISHED' && s.dishResult && s.dishResult.name === '测试菜品';
                if (okDishReturned) console.log(`PASS: dish auto-reset on bankrupt (run=${i + 1}).`);
                else console.error(`FAIL: dish not auto-reset on bankrupt (run=${i + 1}).`);
            }

            for (let i = 0; i < 3; i++) {
                const existing = document.getElementById('bankrupt-modal');
                if (existing) existing.remove();

                window.holdingThing = { type: 'INGREDIENT', val: { id: 'butter', name: '黄油', icon: '🧈' } };
                showBankruptModal(0);

                if (!window.holdingThing) console.log(`PASS: ingredient auto-clear on bankrupt (run=${i + 1}).`);
                else console.error(`FAIL: ingredient not cleared on bankrupt (run=${i + 1}).`);
            }

            if (renderCalls > 0) console.log("PASS: renderStation called during auto-reset.");
            else console.error("FAIL: renderStation not called; dish may not have been restored.");
        } catch (e) {
            console.error("FAIL: Auto Reset Hand On Bankrupt Modal Test crashed:", e);
        } finally {
            window.holdingThing = backup.holdingThing;
            window.renderStation = backup.renderStation;
            window.playSfx = backup.playSfx;
            game.dailyKPI = backup.dailyKPI;
            try { window.stations = backup.stations ? JSON.parse(backup.stations) : window.stations; } catch (_) {}
            try { const modal = document.getElementById('bankrupt-modal'); if (modal) modal.remove(); } catch (_) {}
        }
        console.log("Auto Reset Hand On Bankrupt Modal Test Completed.");
    }
    ,
    testPauseButtonIconSync: function() {
        console.log("Running Pause Button Icon Sync Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof updatePauseButtonVisual !== 'function') { console.error("FAIL: updatePauseButtonVisual missing."); return; }

        const btn = document.getElementById('btn-pause');
        if (!btn) { console.error("FAIL: #btn-pause not found."); return; }

        const backup = {
            uiState: (typeof window.uiState !== 'undefined') ? window.uiState : undefined,
            isLive: game.isLive,
            isPaused: game.isPaused,
            src: btn.getAttribute('src'),
            alt: btn.getAttribute('alt')
        };

        try {
            window.uiState = 'GAME';
            game.isLive = true;

            game.isPaused = true;
            updatePauseButtonVisual();
            if ((btn.getAttribute('src') || '').includes('assets/ui/继续.png') && (btn.getAttribute('alt') || '') === '继续') {
                console.log("PASS: paused -> shows 继续.");
            } else {
                console.error(`FAIL: paused icon mismatch (src=${btn.getAttribute('src')}, alt=${btn.getAttribute('alt')}).`);
            }

            game.isPaused = false;
            updatePauseButtonVisual();
            if ((btn.getAttribute('src') || '').includes('assets/ui/暂停.png') && (btn.getAttribute('alt') || '') === '暂停') {
                console.log("PASS: running -> shows 暂停.");
            } else {
                console.error(`FAIL: running icon mismatch (src=${btn.getAttribute('src')}, alt=${btn.getAttribute('alt')}).`);
            }

            game.isLive = false;
            game.isPaused = true;
            updatePauseButtonVisual();
            if ((btn.getAttribute('src') || '').includes('assets/ui/暂停.png')) {
                console.log("PASS: not live -> shows 暂停.");
            } else {
                console.error(`FAIL: not live icon mismatch (src=${btn.getAttribute('src')}).`);
            }
        } catch (e) {
            console.error("FAIL: Pause Button Icon Sync Test crashed:", e);
        } finally {
            if (backup.uiState === undefined) delete window.uiState;
            else window.uiState = backup.uiState;
            game.isLive = backup.isLive;
            game.isPaused = backup.isPaused;
            if (backup.src !== null && backup.src !== undefined) btn.setAttribute('src', backup.src);
            if (backup.alt !== null && backup.alt !== undefined) btn.setAttribute('alt', backup.alt);
        }
        console.log("Pause Button Icon Sync Test Completed.");
    }
    ,
    testBusinessMapEntryNoAutoPanel: function() {
        console.log("Running Business Map Entry No-Auto Panel Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof showLocationSelection !== 'function') { console.error("FAIL: showLocationSelection missing."); return; }
        if (typeof closeLocationSelection !== 'function') { console.error("FAIL: closeLocationSelection missing."); return; }

        const backup = {
            switchScreen: window.switchScreen,
            renderLocationStep1: window.renderLocationStep1,
            closeDistrictPanel: window.closeDistrictPanel,
            stores: game.stores ? JSON.stringify(game.stores) : null,
            activeStoreId: game.activeStoreId
        };

        try {
            window.switchScreen = () => {};

            if (!game.stores || typeof game.stores !== 'object') game.stores = {};
            if (!game.stores['cn:main']) game.stores['cn:main'] = { level: 1, inventory: { expansion: 0 }, ingredientAge: {}, pendingIncome: 0 };
            game.activeStoreId = 'cn:main';

            const panel = document.getElementById('district-panel');
            const dock = document.getElementById('region-dock-container');
            const confirmBtn = document.getElementById('btn-confirm-loc');
            const mapScreen = document.getElementById('map-screen');
            if (!panel || !dock || !confirmBtn || !mapScreen) { console.error("FAIL: map screen DOM missing."); return; }

            panel.classList.add('active');
            dock.classList.add('hidden');

            showLocationSelection();

            if (!panel.classList.contains('active') && !dock.classList.contains('hidden')) console.log("PASS: first entry keeps page silent (panel not auto-open).");
            else console.error(`FAIL: panel/dock state wrong after entry (panelActive=${panel.classList.contains('active')}, dockHidden=${dock.classList.contains('hidden')}).`);

            const bar = document.getElementById('map-bottom-bar');
            if (!bar) console.error("FAIL: map bottom bar not rendered.");
            else {
                const tabs = Array.from(bar.querySelectorAll('.country-tab')).filter(t => !t.classList.contains('waiting') && typeof t.onclick === 'function');
                if (tabs.length > 0) {
                    tabs[0].click();
                    if (panel.classList.contains('active')) console.log("PASS: panel opens only after user clicks a region tab.");
                    else console.error("FAIL: panel did not open after tab click.");
                } else {
                    console.error("FAIL: no clickable country tabs found.");
                }
            }

            closeLocationSelection();
            panel.classList.add('active');
            dock.classList.add('hidden');
            showLocationSelection();
            if (!panel.classList.contains('active') && !dock.classList.contains('hidden')) console.log("PASS: refresh-like re-entry also stays silent.");
            else console.error("FAIL: re-entry still auto-opens panel.");
        } catch (e) {
            console.error("FAIL: Business Map Entry No-Auto Panel Test crashed:", e);
        } finally {
            window.switchScreen = backup.switchScreen;
            window.renderLocationStep1 = backup.renderLocationStep1;
            window.closeDistrictPanel = backup.closeDistrictPanel;
            try { game.stores = backup.stores ? JSON.parse(backup.stores) : game.stores; } catch (_) {}
            game.activeStoreId = backup.activeStoreId;
            try {
                const bar = document.getElementById('map-bottom-bar');
                if (bar) bar.remove();
            } catch (_) {}
            try { if (typeof closeDistrictPanel === 'function') closeDistrictPanel(); } catch (_) {}
        }
        console.log("Business Map Entry No-Auto Panel Test Completed.");
    }
    ,
    testCoinFxInitialScaleAndNoShadow: function() {
        console.log("Running Coin FX Initial Scale + No Shadow Test...");
        const coin = document.createElement('div');
        coin.className = 'coin-fx';
        coin.style.left = '0px';
        coin.style.top = '0px';
        coin.style.animation = 'none';
        document.body.appendChild(coin);

        try {
            const cs = window.getComputedStyle(coin);
            const filter = String(cs.filter || '').trim();
            const boxShadow = String(cs.boxShadow || '').trim();
            if (filter === 'none') console.log("PASS: coin-fx has no filter shadow.");
            else console.error(`FAIL: coin-fx filter should be none, got "${filter}".`);

            if (boxShadow === 'none') console.log("PASS: coin-fx has no box-shadow.");
            else console.error(`FAIL: coin-fx box-shadow should be none, got "${boxShadow}".`);

            const tf = String(cs.transform || '').trim();
            let scaleOk = false;
            if (tf === 'none') {
                scaleOk = false;
            } else if (tf.startsWith('matrix(')) {
                const nums = tf.replace('matrix(', '').replace(')', '').split(',').map(s => parseFloat(s.trim()));
                const a = nums[0];
                const d = nums[3];
                scaleOk = Math.abs(a - 1.4) < 0.05 && Math.abs(d - 1.4) < 0.05;
            } else if (tf.startsWith('matrix3d(')) {
                const nums = tf.replace('matrix3d(', '').replace(')', '').split(',').map(s => parseFloat(s.trim()));
                const a = nums[0];
                const d = nums[5];
                scaleOk = Math.abs(a - 1.4) < 0.05 && Math.abs(d - 1.4) < 0.05;
            }
            if (scaleOk) console.log("PASS: coin-fx initial scale ~1.4 (30% smaller).");
            else console.error(`FAIL: coin-fx initial scale not ~1.4 (transform="${tf}").`);
        } catch (e) {
            console.error("FAIL: Coin FX Initial Scale + No Shadow Test crashed:", e);
        } finally {
            try { coin.remove(); } catch (_) {}
        }
        console.log("Coin FX Initial Scale + No Shadow Test Completed.");
    }
    ,
    testCoinFxThreeStageTiming: function() {
        console.log("Running Coin FX Three-Stage Timing Test...");
        if (typeof window.enqueueCoinFlight !== 'function') { console.error("FAIL: enqueueCoinFlight missing."); return; }

        const backup = { timing: window.__coinFxTiming };
        const fromEl = document.createElement('div');
        const toEl = document.createElement('div');
        fromEl.style.position = 'fixed';
        fromEl.style.left = '100px';
        fromEl.style.top = '120px';
        fromEl.style.width = '10px';
        fromEl.style.height = '10px';
        toEl.style.position = 'fixed';
        toEl.style.left = '420px';
        toEl.style.top = '80px';
        toEl.style.width = '10px';
        toEl.style.height = '10px';
        document.body.appendChild(fromEl);
        document.body.appendChild(toEl);

        window.__coinFxTiming = { burstMin: 220, burstMax: 220, hoverMin: 180, hoverMax: 180, flyMin: 340, flyMax: 340 };

        try {
            const count = 4;
            const start = performance.now ? performance.now() : Date.now();
            let done = false;
            window.enqueueCoinFlight(fromEl, toEl, count, () => { done = true; });

            setTimeout(() => {
                const coins = document.querySelectorAll('.coin-fx');
                if (coins.length > 0) console.log("PASS: coins spawned.");
                else console.error("FAIL: coins not spawned.");
            }, 60);

            const expectedMin = 220 + 180 + 340;
            const expectedMax = expectedMin + 260;
            const poll = () => {
                const now = performance.now ? performance.now() : Date.now();
                const elapsed = now - start;
                if (done) {
                    const remain = document.querySelectorAll('.coin-fx').length;
                    if (remain === 0) console.log("PASS: coins removed on complete.");
                    else console.error("FAIL: coins still present after complete (" + remain + ").");

                    if (elapsed >= expectedMin && elapsed <= expectedMax) console.log("PASS: timing roughly matches three-stage budget (" + Math.round(elapsed) + "ms).");
                    else console.error("FAIL: timing out of expected range (" + Math.round(elapsed) + "ms, expected " + expectedMin + "-" + expectedMax + "ms).");

                    window.__coinFxTiming = backup.timing;
                    try { fromEl.remove(); } catch (_) {}
                    try { toEl.remove(); } catch (_) {}
                    console.log("Coin FX Three-Stage Timing Test Completed.");
                    return;
                }
                if (elapsed > 2500) {
                    console.error("FAIL: coin fx did not complete in time.");
                    window.__coinFxTiming = backup.timing;
                    try { fromEl.remove(); } catch (_) {}
                    try { toEl.remove(); } catch (_) {}
                    console.log("Coin FX Three-Stage Timing Test Completed.");
                    return;
                }
                setTimeout(poll, 60);
            };
            poll();
        } catch (e) {
            console.error("FAIL: Coin FX Three-Stage Timing Test crashed:", e);
            window.__coinFxTiming = backup.timing;
            try { fromEl.remove(); } catch (_) {}
            try { toEl.remove(); } catch (_) {}
        }
    }
    ,
    testPrepDay1GiftAndPaidExtras: function() {
        console.log("Running Prep Day1 Gift + Paid Extras Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof showPrepModal !== 'function') { console.error("FAIL: showPrepModal missing."); return; }
        if (typeof renderPrepUI !== 'function') { console.error("FAIL: renderPrepUI missing."); return; }
        if (typeof window.getIngredientCount !== 'function') { console.error("FAIL: getIngredientCount missing."); return; }

        const backup = {
            level: game.level,
            activeStoreId: game.activeStoreId,
            coins: game.coins,
            dailyInventory: game.dailyInventory ? JSON.stringify(game.dailyInventory) : null,
            stores: game.stores ? JSON.stringify(game.stores) : null,
            showToast: window.showToast,
            playSfx: window.playSfx,
            playButtonSound: window.playButtonSound
        };

        try {
            window.showToast = () => {};
            window.playSfx = () => {};
            window.playButtonSound = () => {};

            if (!game.stores || typeof game.stores !== 'object') game.stores = {};
            if (!game.stores['cn:main']) game.stores['cn:main'] = {};

            game.level = 1;
            game.activeStoreId = 'cn:main';
            game.coins = 100;
            game.dailyInventory = {};

            try { localStorage.setItem('hasSeenPrepGift_cn:main', 'true'); } catch (_) {}

            showPrepModal();

            const base = (window.__prepTutorialGiftBase && typeof window.__prepTutorialGiftBase === 'object') ? window.__prepTutorialGiftBase : null;
            if (!base) { console.error("FAIL: __prepTutorialGiftBase missing."); return; }

            const baseTomato = Math.max(0, Math.floor(Number(base.tomato) || 0));
            const t0 = window.getIngredientCount('__temp__', 'tomato');
            if (t0 >= baseTomato) console.log("PASS: day1 gift baseline applied to tomato.");
            else console.error(`FAIL: day1 gift tomato expected >=${baseTomato}, got ${t0}.`);

            renderPrepUI();

            const cards = Array.from(document.querySelectorAll('#prep-grid .ingredient-card'));
            const tomatoCard = cards.find(c => {
                const n = c.querySelector('.ing-name');
                return n && (n.textContent || '').trim() === ((INGREDIENTS && INGREDIENTS.tomato && INGREDIENTS.tomato.name) ? INGREDIENTS.tomato.name : '番茄');
            });
            if (!tomatoCard) { console.error("FAIL: tomato card not found."); return; }

            const plus1 = tomatoCard.querySelector('.buy-btn[data-qty="1"]');
            const minus1 = tomatoCard.querySelector('.buy-btn[data-qty="-1"]');
            if (!plus1 || !minus1) { console.error("FAIL: buy buttons missing on tomato card."); return; }

            const price = Math.max(0, Math.floor(Number(INGREDIENTS && INGREDIENTS.tomato && INGREDIENTS.tomato.price) || 1));
            const c0 = window.tempCoins;
            plus1.click();
            const c1 = window.tempCoins;
            if (c1 === c0 - price) console.log("PASS: extra purchase costs coins on day1.");
            else console.error(`FAIL: expected coins ${c0 - price}, got ${c1}.`);

            minus1.click();
            const c2 = window.tempCoins;
            if (c2 === c0) console.log("PASS: refund works when removing paid extras (back to baseline).");
            else console.error(`FAIL: expected coins refund back to ${c0}, got ${c2}.`);

            const beforeQty = window.getIngredientCount('__temp__', 'tomato');
            for (let i = 0; i < 10; i++) minus1.click();
            const afterQty = window.getIngredientCount('__temp__', 'tomato');
            if (afterQty >= baseTomato && afterQty === beforeQty) console.log("PASS: cannot reduce below gift baseline.");
            else if (afterQty >= baseTomato) console.log("PASS: tomato qty clamped to gift baseline.");
            else console.error(`FAIL: tomato qty dropped below gift baseline (${afterQty} < ${baseTomato}).`);
        } catch (e) {
            console.error("FAIL: Prep Day1 Gift + Paid Extras Test crashed:", e);
        } finally {
            game.level = backup.level;
            game.activeStoreId = backup.activeStoreId;
            game.coins = backup.coins;
            try { game.dailyInventory = backup.dailyInventory ? JSON.parse(backup.dailyInventory) : game.dailyInventory; } catch (_) {}
            try { game.stores = backup.stores ? JSON.parse(backup.stores) : game.stores; } catch (_) {}
            window.showToast = backup.showToast;
            window.playSfx = backup.playSfx;
            window.playButtonSound = backup.playButtonSound;
        }

        console.log("Prep Day1 Gift + Paid Extras Test Completed.");
    }
    ,
    testPrepDay2NoTutorialGiftBaseline: function() {
        console.log("Running Prep Day2 No Tutorial Gift Baseline Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof showPrepModal !== 'function') { console.error("FAIL: showPrepModal missing."); return; }
        if (typeof renderPrepUI !== 'function') { console.error("FAIL: renderPrepUI missing."); return; }
        if (typeof window.getIngredientCount !== 'function') { console.error("FAIL: getIngredientCount missing."); return; }

        const backup = {
            level: game.level,
            activeStoreId: game.activeStoreId,
            coins: game.coins,
            dailyInventory: game.dailyInventory ? JSON.stringify(game.dailyInventory) : null,
            stores: game.stores ? JSON.stringify(game.stores) : null,
            prepTutorialDayOne: window.__prepTutorialDayOne,
            prepTutorialGiftBase: window.__prepTutorialGiftBase,
            showToast: window.showToast,
            playSfx: window.playSfx,
            playButtonSound: window.playButtonSound
        };

        try {
            window.showToast = () => {};
            window.playSfx = () => {};
            window.playButtonSound = () => {};

            if (!game.stores || typeof game.stores !== 'object') game.stores = {};
            if (!game.stores['cn:main']) game.stores['cn:main'] = {};

            game.level = 2;
            game.activeStoreId = 'cn:main';
            game.coins = 1000;
            game.dailyInventory = {};

            window.__prepTutorialDayOne = true;
            window.__prepTutorialGiftBase = { tomato: 20, egg: 20, onion: 20 };

            showPrepModal();

            if (window.__prepTutorialDayOne) console.error("FAIL: __prepTutorialDayOne should be reset to false on day2.");
            else console.log("PASS: __prepTutorialDayOne reset on day2.");

            renderPrepUI();

            const cards = Array.from(document.querySelectorAll('#prep-grid .ingredient-card'));
            const tomatoName = (INGREDIENTS && INGREDIENTS.tomato && INGREDIENTS.tomato.name) ? INGREDIENTS.tomato.name : '番茄';
            const tomatoCard = cards.find(c => {
                const n = c.querySelector('.ing-name');
                return n && (n.textContent || '').trim() === tomatoName;
            });
            if (!tomatoCard) { console.error("FAIL: tomato card not found."); return; }

            const plus10 = tomatoCard.querySelector('.buy-btn[data-qty="10"]');
            if (!plus10) { console.error("FAIL: +10 button missing on tomato card."); return; }

            const beforeQty = window.getIngredientCount('__temp__', 'tomato');
            const c0 = window.tempCoins;
            plus10.click();
            const afterQty = window.getIngredientCount('__temp__', 'tomato');
            const c1 = window.tempCoins;

            if (afterQty === beforeQty + 10) console.log("PASS: day2 +10 increases stock by 10 (no gift clamp).");
            else console.error(`FAIL: expected tomato qty ${beforeQty + 10}, got ${afterQty}.`);

            if (c1 < c0) console.log("PASS: day2 +10 costs coins.");
            else console.error(`FAIL: expected coins to decrease on day2 (before=${c0}, after=${c1}).`);

            const costEl = document.getElementById('prep-cost-display');
            const costTxt = costEl ? String(costEl.textContent || '') : '';
            if (costEl && costTxt.replace(/\s/g, '') !== '¥0') console.log("PASS: prep cost display updates (not ¥0).");
            else console.error("FAIL: prep cost display did not update (still ¥0 or missing).");
        } catch (e) {
            console.error("FAIL: Prep Day2 No Tutorial Gift Baseline Test crashed:", e);
        } finally {
            game.level = backup.level;
            game.activeStoreId = backup.activeStoreId;
            game.coins = backup.coins;
            try { game.dailyInventory = backup.dailyInventory ? JSON.parse(backup.dailyInventory) : game.dailyInventory; } catch (_) {}
            try { game.stores = backup.stores ? JSON.parse(backup.stores) : game.stores; } catch (_) {}
            window.__prepTutorialDayOne = backup.prepTutorialDayOne;
            window.__prepTutorialGiftBase = backup.prepTutorialGiftBase;
            window.showToast = backup.showToast;
            window.playSfx = backup.playSfx;
            window.playButtonSound = backup.playButtonSound;
            try { const m = document.getElementById('prep-modal'); if (m) m.style.display = 'none'; } catch (_) {}
        }

        console.log("Prep Day2 No Tutorial Gift Baseline Test Completed.");
    }
    ,
    testGossipAvoidsUselessTrendWhenNoMatchingRecipes: function() {
        console.log("Running Gossip Avoids Useless Trend When No Matching Recipes Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof generateDailyGossip !== 'function') { console.error("FAIL: generateDailyGossip missing."); return; }
        if (typeof window.getActiveRecipes !== 'function' && typeof window.getAvailableRecipes !== 'function') { console.error("FAIL: getActiveRecipes/getAvailableRecipes missing."); return; }

        const backup = {
            activeStoreId: game.activeStoreId,
            dailyTrend: game.dailyTrend,
            dailyGossip: game.dailyGossip ? JSON.stringify(game.dailyGossip) : null,
            getActiveRecipes: window.getActiveRecipes,
            getAvailableRecipes: window.getAvailableRecipes
        };

        try {
            game.activeStoreId = 'cn:main';

            const minimalPool = [
                { id: 'r_tomato_egg', name: '番茄炒蛋', ingredients: ['tomato', 'egg'] }
            ];
            window.getAvailableRecipes = () => minimalPool;

            const blocked = new Set(['meat', 'seafood', 'spicy']);
            let bad = 0;
            for (let i = 0; i < 50; i++) {
                generateDailyGossip();
                const t = String(game.dailyTrend || '');
                if (blocked.has(t)) bad += 1;
            }
            if (bad === 0) console.log("PASS: with only vege-capable recipes, gossip never picks meat/seafood/spicy trend.");
            else console.error(`FAIL: gossip picked blocked trend ${bad} times (should be 0).`);
        } catch (e) {
            console.error("FAIL: Gossip Avoids Useless Trend When No Matching Recipes Test crashed:", e);
        } finally {
            game.activeStoreId = backup.activeStoreId;
            game.dailyTrend = backup.dailyTrend;
            try { game.dailyGossip = backup.dailyGossip ? JSON.parse(backup.dailyGossip) : game.dailyGossip; } catch (_) {}
            window.getActiveRecipes = backup.getActiveRecipes;
            window.getAvailableRecipes = backup.getAvailableRecipes;
        }

        console.log("Gossip Avoids Useless Trend When No Matching Recipes Test Completed.");
    }
    ,
    testDay1EndStorySkipsIfPotUpgraded: function() {
        console.log("Running Day1 End Story Skip-If-Upgraded Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof settleDay !== 'function') { console.error("FAIL: settleDay missing."); return; }

        const backup = {
            checkAndTriggerStory: window.checkAndTriggerStory,
            showResult: window.showResult,
            showBankruptModal: window.showBankruptModal,
            pushActiveStoreHistoryEntry: window.pushActiveStoreHistoryEntry,
            updateBalanceDisplay: window.updateBalanceDisplay,
            applyDailyTaskSettlement: window.applyDailyTaskSettlement,
            logSystemEvent: window.logSystemEvent,
            stopKMES: window.stopKMES,
            updatePauseButtonVisual: window.updatePauseButtonVisual,
            stations: (typeof window.stations !== 'undefined') ? JSON.stringify(window.stations) : null,
            game: JSON.stringify(game)
        };

        let storyCalls = 0;
        let settlementCalls = 0;
        try {
            window.checkAndTriggerStory = function() { storyCalls += 1; return false; };
            window.showResult = function() { settlementCalls += 1; };
            window.showBankruptModal = function() {};
            window.pushActiveStoreHistoryEntry = function() {};
            window.updateBalanceDisplay = function() {};
            window.applyDailyTaskSettlement = function() {};
            window.logSystemEvent = function() {};
            window.stopKMES = function() {};
            window.updatePauseButtonVisual = function() {};

            if (typeof window.stations !== 'object' || !window.stations) window.stations = {};
            window.stations.s1 = { id: 's1', stage: 'IDLE', timer: null, audio: null, order: null };

            game.isLive = true;
            game.dayEnded = false;
            game.level = 1;
            game.currentDay = 1;
            game.total = 1;
            game.served = 1;
            game.dailyRevenue = 0;
            game.dailyKPI = 0;
            game.dailyDishCount = 1;
            game.dailyQualitySum = 1;
            game.totalErrors = 0;
            game.totalOrders = 1;

            game.activeStoreId = 'cn:main';
            if (!game.stores || typeof game.stores !== 'object') game.stores = {};
            game.stores['cn:main'] = {
                level: 1,
                inventory: { pot: 1, belt: 0, fridge: 0, expansion: 0, kmes: 0 },
                dailyInventory: {},
                sessionCost: 0,
                ingredientAge: {},
                history: [],
                pendingIncome: 0
            };
            game.inventory = { pot: 1, belt: 0, fridge: 0, expansion: 0, kmes: 0 };
            game.dailyInventory = {};

            settleDay('test');
            if (storyCalls === 0) console.log("PASS: upgraded pot skips DAY1_END story.");
            else console.error("FAIL: story should not trigger when pot upgraded (calls=" + storyCalls + ").");

            storyCalls = 0;
            settlementCalls = 0;
            game.isLive = true;
            game.dayEnded = false;
            game.stores['cn:main'].inventory.pot = 0;
            game.inventory.pot = 0;

            settleDay('test');
            if (storyCalls === 1) console.log("PASS: base pot allows DAY1_END story trigger.");
            else console.error("FAIL: story should trigger when pot not upgraded (calls=" + storyCalls + ").");
        } catch (e) {
            console.error("FAIL: Day1 End Story Skip-If-Upgraded Test crashed:", e);
        } finally {
            window.checkAndTriggerStory = backup.checkAndTriggerStory;
            window.showResult = backup.showResult;
            window.showBankruptModal = backup.showBankruptModal;
            window.pushActiveStoreHistoryEntry = backup.pushActiveStoreHistoryEntry;
            window.updateBalanceDisplay = backup.updateBalanceDisplay;
            window.applyDailyTaskSettlement = backup.applyDailyTaskSettlement;
            window.logSystemEvent = backup.logSystemEvent;
            window.stopKMES = backup.stopKMES;
            window.updatePauseButtonVisual = backup.updatePauseButtonVisual;
            try { window.stations = backup.stations ? JSON.parse(backup.stations) : window.stations; } catch (_) {}
            try {
                const g = backup.game ? JSON.parse(backup.game) : null;
                if (g) Object.keys(g).forEach(k => { game[k] = g[k]; });
            } catch (_) {}
        }
        console.log("Day1 End Story Skip-If-Upgraded Test Completed.");
    }
    ,
    testHideTutorialBubbleOnBankruptModal: function() {
        console.log("Running Hide Tutorial Bubble On Bankrupt Modal Test...");
        if (typeof showBankruptModal !== 'function') { console.error("FAIL: showBankruptModal missing."); return; }
        if (typeof hideTutorialUI !== 'function') { console.error("FAIL: hideTutorialUI missing."); return; }

        const backup = {
            playSfx: window.playSfx,
            executeRollback: window.executeRollback
        };

        try {
            window.playSfx = () => {};
            window.executeRollback = () => {};

            const container = document.getElementById('game-container') || document.body;
            const bubble = document.createElement('div');
            bubble.className = 'tutorial-bubble pos-right';
            bubble.style.opacity = '1';
            bubble.textContent = 'TEST';
            container.appendChild(bubble);

            showBankruptModal(0);

            const remain = document.querySelectorAll('.tutorial-bubble');
            if (remain.length === 0) console.log("PASS: tutorial bubbles removed when bankrupt modal shows.");
            else console.error("FAIL: tutorial bubbles still present (" + remain.length + ").");
        } catch (e) {
            console.error("FAIL: Hide Tutorial Bubble On Bankrupt Modal Test crashed:", e);
        } finally {
            window.playSfx = backup.playSfx;
            window.executeRollback = backup.executeRollback;
            try { const m = document.getElementById('bankrupt-modal'); if (m) m.remove(); } catch (_) {}
            try { hideTutorialUI(); } catch (_) {}
        }
        console.log("Hide Tutorial Bubble On Bankrupt Modal Test Completed.");
    }
    ,
    testBonusCoinStartXAlignsHomeButton: function() {
        console.log("Running Bonus Coin StartX Align Home Button Test...");
        if (typeof updateBonusCoinStartXNow !== 'function') { console.error("FAIL: updateBonusCoinStartXNow missing."); return; }
        if (typeof flyCoins !== 'function') { console.error("FAIL: flyCoins missing."); return; }

        const overlay = document.getElementById('overlay');
        if (!overlay) { console.error("FAIL: #overlay not found."); return; }

        const prev = {
            display: overlay.style.display,
            modalType: overlay.dataset ? overlay.dataset.modalType : undefined,
            html: overlay.innerHTML
        };

        const cleanup = () => {
            overlay.innerHTML = prev.html;
            overlay.style.display = prev.display;
            if (overlay.dataset) {
                if (prev.modalType === undefined) delete overlay.dataset.modalType;
                else overlay.dataset.modalType = prev.modalType;
            }
            try { document.querySelectorAll('img[src="assets/icons/硬币.png"]').forEach(n => n.remove()); } catch (_) {}
        };

        try {
            overlay.style.display = 'flex';
            if (overlay.dataset) overlay.dataset.modalType = 'settlement';
            overlay.innerHTML = `
                <div class="modal-actions">
                    <button id="t_home" style="position:fixed; left:100px; top:100px; width:200px; height:40px;">
                        <img src="assets/ui/结算弹窗_返回首页.png" alt="返回首页">
                    </button>
                </div>
            `;

            const x1 = updateBonusCoinStartXNow();
            if (Math.abs(x1 - 200) < 1) console.log("PASS: startX matches home button center (200).");
            else console.error("FAIL: expected startX≈200, got " + x1);

            const fromEl = document.createElement('div');
            fromEl.style.position = 'fixed';
            fromEl.style.left = '10px';
            fromEl.style.top = '10px';
            fromEl.style.width = '10px';
            fromEl.style.height = '10px';
            document.body.appendChild(fromEl);

            const toEl = document.createElement('div');
            toEl.style.position = 'fixed';
            toEl.style.left = '400px';
            toEl.style.top = '10px';
            toEl.style.width = '10px';
            toEl.style.height = '10px';
            document.body.appendChild(toEl);

            flyCoins(fromEl, toEl, 10, { startX: x1, onMeta: () => {} });
            const coin = document.querySelector('img[src="assets/icons/硬币.png"]');
            if (!coin) console.error("FAIL: no coin spawned.");
            else {
                const leftPx = parseFloat(String(coin.style.left || '').replace('px', ''));
                if (Math.abs(leftPx - 200) < 1) console.log("PASS: spawned coin left equals computed startX.");
                else console.error(`FAIL: coin left expected≈200, got ${leftPx}.`);
            }

            const homeBtn = document.getElementById('t_home');
            homeBtn.style.left = '300px';
            homeBtn.style.width = '100px';
            const x2 = updateBonusCoinStartXNow();
            if (Math.abs(x2 - 350) < 1) console.log("PASS: startX updates after layout change (350).");
            else console.error("FAIL: expected startX≈350, got " + x2);

            fromEl.remove();
            toEl.remove();
        } catch (e) {
            console.error("FAIL: Bonus Coin StartX Align Home Button Test crashed:", e);
        } finally {
            cleanup();
        }
        console.log("Bonus Coin StartX Align Home Button Test Completed.");
    }
    ,
    testHomeProfileCard: function() {
        console.log("Running Home Profile Card Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof updateHomeProfileCard !== 'function') { console.error("FAIL: updateHomeProfileCard missing."); return; }

        const card = document.getElementById('home-profile-card');
        const balance = document.getElementById('home-balance');
        const days = document.getElementById('home-store-days');
        const fill = document.getElementById('title-progress-fill');
        const track = card ? card.querySelector('.title-progress-track') : null;
        const nodes = document.querySelectorAll('#title-progress-nodes .tp-node');
        const titleLevelHeader = card ? card.querySelector('.home-title-level-label') : null;
        const titleIcon = titleLevelHeader ? titleLevelHeader.querySelector('img[alt="头衔"]') : null;
        const walletIcon = card ? card.querySelector('.home-wallet-row img[alt="钱包"]') : null;

        if (!card || !balance || !days || !fill || !track) {
            console.error("FAIL: home profile card DOM missing.");
            return;
        }

        if (titleLevelHeader && titleLevelHeader.textContent.includes('头衔等级')) console.log("PASS: header label is 头衔等级.");
        else console.error("FAIL: header label not updated to 头衔等级.");

        if (titleIcon && walletIcon) {
            const tr = titleIcon.getBoundingClientRect();
            const wr = walletIcon.getBoundingClientRect();
            const ts = Math.min(tr.width, tr.height);
            const ws = Math.min(wr.width, wr.height);
            if (Math.abs(ts - ws) < 1) console.log("PASS: title icon size matches wallet icon.");
            else console.error(`FAIL: title icon size mismatch (title=${ts}, wallet=${ws}).`);
        } else {
            console.error("FAIL: title icon or wallet icon missing in card.");
        }

        if (nodes.length === 6) console.log("PASS: progress bar has 6 nodes.");
        else console.error("FAIL: progress node count expected 6, got " + nodes.length);

        const prev = game.playerProfile ? game.playerProfile.titleLevel : 1;
        if (!game.playerProfile) game.playerProfile = { titleLevel: 1, updatedAt: Date.now(), version: 1 };
        game.playerProfile.titleLevel = 1;
        updateHomeProfileCard();
        const label1 = document.querySelector('#title-progress-nodes .title-node-label.is-active');
        const node1 = document.querySelector('#title-progress-nodes .tp-node[data-lv="1"]');
        if (label1 && (label1.textContent || '').includes('初创店长')) console.log("PASS: active label shows 初创店长 at level 1.");
        else console.error("FAIL: active label not 初创店长 at level 1.");
        if (label1 && node1) {
            const cx = (r) => r.left + r.width / 2;
            const dr = Math.abs(cx(label1.getBoundingClientRect()) - cx(node1.getBoundingClientRect()));
            if (dr < 2) console.log("PASS: label centered under node 1.");
            else console.error("FAIL: label not centered under node 1 (dx=" + dr + ").");
        }

        game.playerProfile.titleLevel = 2;
        updateHomeProfileCard();
        const label2 = document.querySelector('#title-progress-nodes .title-node-label.is-active');
        const node2 = document.querySelector('#title-progress-nodes .tp-node[data-lv="2"]');
        if (label2 && (label2.textContent || '').includes('星级店长')) console.log("PASS: active label shows 星级店长 at level 2.");
        else console.error("FAIL: active label not 星级店长 at level 2.");
        if (label2 && node2) {
            const cx = (r) => r.left + r.width / 2;
            const dr = Math.abs(cx(label2.getBoundingClientRect()) - cx(node2.getBoundingClientRect()));
            if (dr < 2) console.log("PASS: label centered under node 2.");
            else console.error("FAIL: label not centered under node 2 (dx=" + dr + ").");
        }

        const tr = track.getBoundingClientRect();
        const fr = fill.getBoundingClientRect();
        const ratio = tr.width > 0 ? (fr.width / tr.width) : 0;
        if (Math.abs(ratio - 0.2) < 0.06) {
            console.log("PASS: progress fill reaches node 2 at 星级店长 (≈20%).");
        } else {
            console.error(`FAIL: progress fill ratio unexpected (ratio=${ratio}).`);
        }

        if (node2) {
            const cx = (r) => r.left + r.width / 2;
            const endX = fr.left + fr.width;
            const dx = Math.abs(endX - cx(node2.getBoundingClientRect()));
            if (dx < 2) console.log("PASS: progress fill end aligned to node 2 center.");
            else console.error("FAIL: progress fill end not aligned to node 2 center (dx=" + dx + ").");
        }

        const activeNodes = document.querySelectorAll('#title-progress-nodes .tp-node.is-active').length;
        if (activeNodes === 2) console.log("PASS: 2 nodes active at level 2.");
        else console.error("FAIL: active node count expected 2, got " + activeNodes);

        game.playerProfile.titleLevel = 6;
        updateHomeProfileCard();
        const label6 = document.querySelector('#title-progress-nodes .title-node-label.is-active');
        const node6 = document.querySelector('#title-progress-nodes .tp-node[data-lv="6"]');
        if (label6 && (label6.textContent || '').includes('餐饮帝国')) console.log("PASS: active label shows 餐饮帝国 at level 6.");
        else console.error("FAIL: active label not 餐饮帝国 at level 6.");
        if (label6 && node6) {
            const cx = (r) => r.left + r.width / 2;
            const dr = Math.abs(cx(label6.getBoundingClientRect()) - cx(node6.getBoundingClientRect()));
            if (dr < 2) console.log("PASS: label centered under node 6.");
            else console.error("FAIL: label not centered under node 6 (dx=" + dr + ").");
        }

        if (node6) {
            const tr6 = track.getBoundingClientRect();
            const fr6 = fill.getBoundingClientRect();
            const cx = (r) => r.left + r.width / 2;
            const endX = fr6.left + fr6.width;
            const dx = Math.abs(endX - cx(node6.getBoundingClientRect()));
            if (dx < 2) console.log("PASS: progress fill end aligned to node 6 center.");
            else console.error("FAIL: progress fill end not aligned to node 6 center (dx=" + dx + ").");
            if (Math.abs(fr6.width - tr6.width) < 2) console.log("PASS: progress fill fully covers track at level 6.");
            else console.error("FAIL: progress fill does not fully cover track at level 6.");
        }

        game.playerProfile.titleLevel = prev;
        updateHomeProfileCard();
        console.log("Home Profile Card Test Completed.");
    },

    testKMESInitDefaultClosed: function() {
        console.log("Running KMES Init Default Closed Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof initLevel !== 'function') { console.error("FAIL: initLevel missing."); return; }

        const assertEq = (name, a, b) => {
            if (a === b) console.log("PASS: " + name);
            else console.error(`FAIL: ${name}. Expected ${b}, got ${a}`);
        };

        const backup = {
            kmesActive: game.kmesActive,
            hasOpenedPantry: game.hasOpenedPantry,
            level: game.level
        };

        const originals = {
            updatePantryStyle: window.updatePantryStyle,
            resetStations: window.resetStations,
            resetHand: window.resetHand,
            resetDailyStats: window.resetDailyStats,
            generateDailyOrders: window.generateDailyOrders,
            updateHUD: window.updateHUD,
            updateBalanceDisplay: window.updateBalanceDisplay,
            updateKMESCard: window.updateKMESCard,
            startKMES: window.startKMES
        };

        try {
            window.updatePantryStyle = () => {};
            window.resetStations = () => {};
            window.resetHand = () => {};
            window.resetDailyStats = () => {};
            window.generateDailyOrders = () => true;
            window.updateHUD = () => {};
            window.updateBalanceDisplay = () => {};
            window.updateKMESCard = () => {};
            window.startKMES = () => {};

            game.level = (typeof game.level === 'number' && Number.isFinite(game.level)) ? game.level : 1;

            game.kmesActive = true;
            game.hasOpenedPantry = true;
            initLevel(false);
            assertEq("kmesActive forced OFF when previous ON", game.kmesActive, false);
            assertEq("hasOpenedPantry reset to false", game.hasOpenedPantry, false);

            game.kmesActive = false;
            game.hasOpenedPantry = true;
            initLevel(false);
            assertEq("kmesActive stays OFF when previous OFF", game.kmesActive, false);
            assertEq("hasOpenedPantry reset to false (again)", game.hasOpenedPantry, false);
        } catch (e) {
            console.error("FAIL: KMES Init Default Closed Test crashed:", e);
        } finally {
            game.kmesActive = backup.kmesActive;
            game.hasOpenedPantry = backup.hasOpenedPantry;
            game.level = backup.level;

            window.updatePantryStyle = originals.updatePantryStyle;
            window.resetStations = originals.resetStations;
            window.resetHand = originals.resetHand;
            window.resetDailyStats = originals.resetDailyStats;
            window.generateDailyOrders = originals.generateDailyOrders;
            window.updateHUD = originals.updateHUD;
            window.updateBalanceDisplay = originals.updateBalanceDisplay;
            window.updateKMESCard = originals.updateKMESCard;
            window.startKMES = originals.startKMES;
        }

        console.log("KMES Init Default Closed Test Completed.");
    },

    testTitleT5RequiresAutomatedDay: function() {
        console.log("Running Title T5 Requires Automated Day Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof computeGlobalTitleLevel !== 'function') { console.error("FAIL: computeGlobalTitleLevel missing."); return; }

        const backup = JSON.stringify(game.stores || {});

        const assertEq = (name, a, b) => {
            if (a === b) console.log("PASS: " + name);
            else console.error(`FAIL: ${name}. Expected ${b}, got ${a}`);
        };

        try {
            game.stores = {
                'cn:main': { level: 3, inventory: { pot: 3, kmes: 3, expansion: 0 }, ingredientAge: {}, history: [], automatedDaysPlayed: 999 },
                'jp:shibuya': { level: 1, inventory: { pot: 3, kmes: 3, expansion: 0 }, ingredientAge: {}, history: [] }
            };

            assertEq("T4 when JP not completed automated day", computeGlobalTitleLevel(), 4);
            game.stores['jp:shibuya'].automatedDaysPlayed = 1;
            assertEq("T5 when JP completed automated day", computeGlobalTitleLevel(), 5);
        } catch (e) {
            console.error("FAIL: Title T5 Requires Automated Day Test crashed:", e);
        } finally {
            try { game.stores = JSON.parse(backup || "{}"); } catch (_) {}
        }
        console.log("Title T5 Requires Automated Day Test Completed.");
    },

    testFrenchFoilShineSinglePlay: function() {
        console.log("Running French Foil Shine Single Play Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof showFrenchMenuDraftModal !== 'function') { console.error("FAIL: showFrenchMenuDraftModal missing."); return; }

        const backup = {
            activeStoreId: game.activeStoreId,
            level: game.level,
            coins: game.coins,
            unlocked: Array.isArray(window.unlockedRecipeIds) ? window.unlockedRecipeIds.slice() : null
        };

        try {
            game.activeStoreId = 'fr:test';
            game.level = 1;
            game.coins = 999999;
            const frPool = (Array.isArray(window.RECIPES) ? window.RECIPES : []).filter(r => r && String(r.region || '').includes('fr'));
            if (frPool.length > 0) window.unlockedRecipeIds = frPool.slice(0, 12).map(r => String(r.id));

            showFrenchMenuDraftModal(() => {});
            const overlay = document.getElementById('fr-menu-draft-modal');
            if (!overlay) { console.error("FAIL: #fr-menu-draft-modal not found."); return; }

            const startBtn = overlay.querySelector('#btn-fr-start-draw');
            if (!startBtn) { console.error("FAIL: #btn-fr-start-draw not found."); return; }
            startBtn.click();

            setTimeout(() => {
                const scenes = Array.from(overlay.querySelectorAll('.fr-card-scene'));
                if (scenes.length === 0) { console.error("FAIL: no .fr-card-scene found after draw."); return; }
                const anySpread = scenes.some(s => {
                    const v = String((s.style && s.style.getPropertyValue('--deal-x')) || '').trim();
                    return v && v !== '0px' && v !== '0';
                });
                if (anySpread) console.log("PASS: spread sets non-zero --deal-x on at least one card.");
                else console.error("FAIL: spread did not set any non-zero --deal-x.");
            }, 260);

            const waitForAnimDone = (timeoutMs, cb) => {
                const start = Date.now();
                const tick = () => {
                    if (!overlay || !overlay.isConnected) return cb(false);
                    const anim = String(overlay.getAttribute('data-anim') || '');
                    if (anim === 'done') return cb(true);
                    if (Date.now() - start > timeoutMs) return cb(false);
                    setTimeout(tick, 80);
                };
                tick();
            };

            waitForAnimDone(6000, (ok) => {
                if (!ok) { console.error("FAIL: draw animation did not reach data-anim=done in time."); return; }
                const scenes = Array.from(overlay.querySelectorAll('.fr-card-scene'));
                if (scenes.length === 0) { console.error("FAIL: no .fr-card-scene found after draw done."); return; }
                const missingInit = scenes.filter(s => !String((s.dataset && s.dataset.shineToken) || '').startsWith('init:'));
                if (missingInit.length > 0) console.error("FAIL: some cards missing init shine token.", missingInit.map(s => s.id));
                else console.log("PASS: init shine token set for all cards.");

                setTimeout(() => {
                    const stillAnimating = scenes.some(s => s.classList.contains('shine-once'));
                    if (stillAnimating) console.error("FAIL: shine-once still present after animation window.");
                    else console.log("PASS: shine-once removed after single play.");

                    const rerollBtn = overlay.querySelector('#btn-fr-reroll');
                    if (!rerollBtn) { console.error("FAIL: #btn-fr-reroll not found."); return; }
                    rerollBtn.click();

                    setTimeout(() => {
                        const rerollMarked = Array.from(overlay.querySelectorAll('.fr-card-scene')).some(s => String((s.dataset && s.dataset.shineToken) || '').startsWith('reroll:'));
                        if (rerollMarked) console.log("PASS: reroll triggers shine token.");
                        else console.error("FAIL: reroll did not trigger any shine token.");

                        const confirmMenuBtn = overlay.querySelector('#btn-fr-confirm-menu');
                        if (!confirmMenuBtn) { console.error("FAIL: #btn-fr-confirm-menu not found."); return; }
                        confirmMenuBtn.click();

                        setTimeout(() => {
                            const confirmMarked = Array.from(overlay.querySelectorAll('.fr-card-scene')).every(s => String((s.dataset && s.dataset.shineToken) || '').startsWith('confirm:'));
                            if (confirmMarked) console.log("PASS: confirm triggers shine token for all cards.");
                            else console.error("FAIL: confirm did not mark all cards with confirm token.");

                            try { overlay.remove(); } catch (_) {}
                            game.activeStoreId = backup.activeStoreId;
                            game.level = backup.level;
                            game.coins = backup.coins;
                            if (backup.unlocked) window.unlockedRecipeIds = backup.unlocked;
                            console.log("French Foil Shine Single Play Test Completed.");
                        }, 180);
                    }, 2200);
                }, 4600);
            });
        } catch (e) {
            console.error("FAIL: French Foil Shine Single Play Test crashed:", e);
            game.activeStoreId = backup.activeStoreId;
            game.level = backup.level;
            game.coins = backup.coins;
            if (backup.unlocked) window.unlockedRecipeIds = backup.unlocked;
        }
    }
    ,
    testFrenchDraftSpreadCounts: function() {
        console.log("Running French Draft Spread Counts Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof showFrenchMenuDraftModal !== 'function') { console.error("FAIL: showFrenchMenuDraftModal missing."); return; }
        if (typeof window.generateFrenchDailyMenu !== 'function') { console.error("FAIL: generateFrenchDailyMenu missing."); return; }

        const backup = {
            activeStoreId: game.activeStoreId,
            level: game.level,
            generate: window.generateFrenchDailyMenu
        };

        const frPool = (Array.isArray(window.RECIPES) ? window.RECIPES : []).filter(r => r && String(r.region || '').includes('fr'));
        if (frPool.length === 0) { console.error("FAIL: no France recipes in RECIPES for test."); return; }

        const waitForAnimDone = (overlay, timeoutMs, cb) => {
            const start = Date.now();
            const tick = () => {
                if (!overlay || !overlay.isConnected) return cb(false);
                const anim = String(overlay.getAttribute('data-anim') || '');
                if (anim === 'done') return cb(true);
                if (Date.now() - start > timeoutMs) return cb(false);
                setTimeout(tick, 80);
            };
            tick();
        };

        const runOne = (n, next) => {
            try {
                game.activeStoreId = 'fr:test';
                game.level = 1;
                window.generateFrenchDailyMenu = () => frPool.slice(0, n).map(r => JSON.parse(JSON.stringify(r)));
                showFrenchMenuDraftModal(() => {});
                const overlay = document.getElementById('fr-menu-draft-modal');
                if (!overlay) { console.error(`FAIL: overlay not found for n=${n}`); return next(); }
                const startBtn = overlay.querySelector('#btn-fr-start-draw');
                if (!startBtn) { console.error(`FAIL: start button not found for n=${n}`); try { overlay.remove(); } catch (_) {} return next(); }
                startBtn.click();
                waitForAnimDone(overlay, 7000, (ok) => {
                    if (!ok) { console.error(`FAIL: data-anim=done timeout for n=${n}`); try { overlay.remove(); } catch (_) {} return next(); }
                    const scenes = Array.from(overlay.querySelectorAll('.fr-card-scene'));
                    if (scenes.length !== n) console.error(`FAIL: expected ${n} scenes, got ${scenes.length}`);
                    else console.log(`PASS: scene count ok for n=${n}`);

                    const xs = scenes.map(s => Number(String((s.style && s.style.getPropertyValue('--deal-x')) || '0').replace('px', '').trim()));
                    const valid = xs.every(v => Number.isFinite(v));
                    if (!valid) console.error(`FAIL: invalid --deal-x values for n=${n}`, xs);
                    else {
                        const increasing = xs.every((v, i) => i === 0 || v > xs[i - 1]);
                        if (n > 1 && !increasing) console.error(`FAIL: --deal-x not increasing for n=${n}`, xs);
                        else console.log(`PASS: --deal-x layout ok for n=${n}`);
                    }

                    const hasGameContainer = !!overlay.closest('#game-container');
                    if (hasGameContainer) {
                        const scales = scenes.map(s => Number(String((s.style && s.style.getPropertyValue('--deal-scale')) || '1').trim()));
                        const allOne = scales.every(v => Number.isFinite(v) && Math.abs(v - 1) < 1e-6);
                        if (!allOne) console.error(`FAIL: expected --deal-scale=1 for n=${n} when inside #game-container`, scales);
                        else console.log(`PASS: --deal-scale=1 for n=${n}`);
                    }

                    try { overlay.remove(); } catch (_) {}
                    next();
                });
            } catch (e) {
                console.error(`FAIL: Draft spread test crashed for n=${n}`, e);
                const overlay = document.getElementById('fr-menu-draft-modal');
                try { if (overlay) overlay.remove(); } catch (_) {}
                next();
            }
        };

        const counts = [1, 2, 3, 4, 5, 6];
        let idx = 0;
        const step = () => {
            if (idx >= counts.length) {
                game.activeStoreId = backup.activeStoreId;
                game.level = backup.level;
                window.generateFrenchDailyMenu = backup.generate;
                console.log("French Draft Spread Counts Test Completed.");
                return;
            }
            const n = counts[idx++];
            runOne(n, step);
        };
        step();
    }
    ,
    testIntroNotInFrance: function() {
        console.log("Running Intro Not In France Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof startGame !== 'function') { console.error("FAIL: startGame missing."); return; }

        const backup = {
            activeStoreId: game.activeStoreId,
            level: game.level,
            hasPlayedIntro: localStorage.getItem('hasPlayedIntro'),
            pendingT2: localStorage.getItem('pending_story_title_t2')
        };

        const originals = {
            renderStoryModal: window.renderStoryModal,
            showEmpireBlueprint: window.showEmpireBlueprint,
            initGame: window.initGame
        };

        try {
            localStorage.removeItem('hasPlayedIntro');
            localStorage.removeItem('pending_story_title_t2');
            game.activeStoreId = 'fr:test';
            game.level = 20;

            let storyCalled = false;
            let initCalled = false;
            window.renderStoryModal = () => { storyCalled = true; };
            window.showEmpireBlueprint = (cb) => { if (typeof cb === 'function') cb(); };
            window.initGame = () => { initCalled = true; };

            startGame();

            setTimeout(() => {
                if (storyCalled) console.error("FAIL: Intro story should not trigger in France store.");
                else console.log("PASS: Intro story not triggered in France store.");
                if (initCalled) console.log("PASS: initGame called when intro is skipped.");
                else console.error("FAIL: initGame was not called when intro is skipped.");
                const stored = localStorage.getItem('hasPlayedIntro');
                if (stored === 'true') console.log("PASS: hasPlayedIntro is auto-marked true when skipping intro outside CN/day1.");
                else console.error("FAIL: hasPlayedIntro should be set true when skipping intro outside CN/day1.");

                game.activeStoreId = backup.activeStoreId;
                game.level = backup.level;
                if (backup.hasPlayedIntro === null) localStorage.removeItem('hasPlayedIntro');
                else localStorage.setItem('hasPlayedIntro', backup.hasPlayedIntro);
                if (backup.pendingT2 === null) localStorage.removeItem('pending_story_title_t2');
                else localStorage.setItem('pending_story_title_t2', backup.pendingT2);

                window.renderStoryModal = originals.renderStoryModal;
                window.showEmpireBlueprint = originals.showEmpireBlueprint;
                window.initGame = originals.initGame;

                console.log("Intro Not In France Test Completed.");
            }, 700);
        } catch (e) {
            console.error("FAIL: Intro Not In France Test crashed:", e);
            game.activeStoreId = backup.activeStoreId;
            game.level = backup.level;
            if (backup.hasPlayedIntro === null) localStorage.removeItem('hasPlayedIntro');
            else localStorage.setItem('hasPlayedIntro', backup.hasPlayedIntro);
            if (backup.pendingT2 === null) localStorage.removeItem('pending_story_title_t2');
            else localStorage.setItem('pending_story_title_t2', backup.pendingT2);
            window.renderStoryModal = originals.renderStoryModal;
            window.showEmpireBlueprint = originals.showEmpireBlueprint;
            window.initGame = originals.initGame;
        }
    }
    ,
    testFrenchRerollLockedPriceTagNoEntrance: function() {
        console.log("Running French Reroll Locked PriceTag No Entrance Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof showFrenchMenuDraftModal !== 'function') { console.error("FAIL: showFrenchMenuDraftModal missing."); return; }

        const backup = {
            activeStoreId: game.activeStoreId,
            level: game.level,
            coins: game.coins,
            unlocked: Array.isArray(window.unlockedRecipeIds) ? window.unlockedRecipeIds.slice() : null
        };

        const waitForAnimDone = (overlay, timeoutMs, cb) => {
            const start = Date.now();
            const tick = () => {
                if (!overlay || !overlay.isConnected) return cb(false);
                const anim = String(overlay.getAttribute('data-anim') || '');
                if (anim === 'done') return cb(true);
                if (Date.now() - start > timeoutMs) return cb(false);
                setTimeout(tick, 80);
            };
            tick();
        };

        try {
            game.activeStoreId = 'fr:test';
            game.level = 10;
            game.coins = 999999;
            const frPool = (Array.isArray(window.RECIPES) ? window.RECIPES : []).filter(r => r && String(r.region || '').includes('fr'));
            if (frPool.length > 0) window.unlockedRecipeIds = frPool.slice(0, 12).map(r => String(r.id));

            showFrenchMenuDraftModal(() => {});
            const overlay = document.getElementById('fr-menu-draft-modal');
            if (!overlay) { console.error("FAIL: #fr-menu-draft-modal not found."); return; }
            const startBtn = overlay.querySelector('#btn-fr-start-draw');
            if (!startBtn) { console.error("FAIL: #btn-fr-start-draw not found."); return; }
            startBtn.click();

            waitForAnimDone(overlay, 7000, (ok) => {
                if (!ok) { console.error("FAIL: draw did not reach done."); return; }
                const lockBtn0 = overlay.querySelector('#fr-card-0 .fr-lock[data-lock-idx="0"]');
                if (!lockBtn0) { console.error("FAIL: lock button 0 not found."); return; }
                lockBtn0.click();

                const rerollBtn = overlay.querySelector('#btn-fr-reroll');
                if (!rerollBtn) { console.error("FAIL: reroll button not found."); return; }
                rerollBtn.click();

                setTimeout(() => {
                    const scene0 = overlay.querySelector('#fr-card-0');
                    if (!scene0) { console.error("FAIL: scene 0 missing after reroll."); return; }
                    const tag0 = scene0.querySelector('.research-price-tag');
                    if (!tag0) { console.error("FAIL: price tag missing on scene 0."); return; }
                    if (tag0.classList.contains('fr-tag-static')) console.log("PASS: locked card price tag is static on reroll render.");
                    else console.error("FAIL: locked card price tag did not get fr-tag-static.");

                    try { overlay.remove(); } catch (_) {}
                    game.activeStoreId = backup.activeStoreId;
                    game.level = backup.level;
                    game.coins = backup.coins;
                    if (backup.unlocked) window.unlockedRecipeIds = backup.unlocked;
                    console.log("French Reroll Locked PriceTag No Entrance Test Completed.");
                }, 1800);
            });
        } catch (e) {
            console.error("FAIL: French Reroll Locked PriceTag No Entrance Test crashed:", e);
            game.activeStoreId = backup.activeStoreId;
            game.level = backup.level;
            game.coins = backup.coins;
            if (backup.unlocked) window.unlockedRecipeIds = backup.unlocked;
        }
    }
    ,
    testShopPurchasePlaysUpgradeMp3: function() {
        console.log("Running Shop Purchase Upgrade MP3 Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof buyUpgrade !== 'function') { console.error("FAIL: buyUpgrade missing."); return; }
        if (!window.AudioController || typeof AudioController.playSfxMp3 !== 'function') { console.error("FAIL: AudioController.playSfxMp3 missing."); return; }

        const backup = {
            activeStoreId: game.activeStoreId,
            coins: game.coins,
            stores: JSON.stringify(game.stores || {}),
            inventory: JSON.stringify(game.inventory || {})
        };

        const originals = {
            playSfxMp3: AudioController.playSfxMp3,
            renderShop: window.renderShop,
            updateBalanceDisplay: window.updateBalanceDisplay,
            triggerFeedback: window.triggerFeedback,
            playCoin: window.playCoin,
            playSfx: window.playSfx,
            saveGameState: window.saveGameState
        };

        try {
            game.activeStoreId = 'cn:main';
            game.coins = 999999;
            if (!game.stores) game.stores = {};
            if (!game.stores['cn:main']) game.stores['cn:main'] = { inventory: {} };
            if (!game.stores['cn:main'].inventory) game.stores['cn:main'].inventory = {};
            game.stores['cn:main'].inventory.pot = 0;
            if (!game.inventory) game.inventory = {};
            game.inventory.pot = 0;

            window.renderShop = () => {};
            window.updateBalanceDisplay = () => {};
            window.triggerFeedback = () => {};
            window.playCoin = () => {};
            window.playSfx = () => {};
            window.saveGameState = () => {};

            let called = 0;
            let lastSrc = null;
            AudioController.playSfxMp3 = function(src) {
                called += 1;
                lastSrc = src;
                return true;
            };

            const ok = buyUpgrade('pot', 1, 100, 'cn:main');
            if (!ok) {
                console.error("FAIL: buyUpgrade returned false.");
            } else if (called === 1 && String(lastSrc || '').includes('升级音效.mp3')) {
                console.log("PASS: purchase success triggers 升级音效.mp3");
            } else {
                console.error(`FAIL: expected 1 call with 升级音效.mp3, got called=${called}, src=${lastSrc}`);
            }

            AudioController.playSfxMp3 = function() { throw new Error('simulated play error'); };
            const ok2 = buyUpgrade('pot', 2, 100, 'cn:main');
            if (ok2) console.log("PASS: purchase flow stable when mp3 playback throws.");
            else console.error("FAIL: purchase should still succeed even if mp3 throws.");
        } catch (e) {
            console.error("FAIL: Shop Purchase Upgrade MP3 Test crashed:", e);
        } finally {
            try {
                game.activeStoreId = backup.activeStoreId;
                game.coins = backup.coins;
                game.stores = JSON.parse(backup.stores || "{}");
                game.inventory = JSON.parse(backup.inventory || "{}");
            } catch (_) {}
            AudioController.playSfxMp3 = originals.playSfxMp3;
            window.renderShop = originals.renderShop;
            window.updateBalanceDisplay = originals.updateBalanceDisplay;
            window.triggerFeedback = originals.triggerFeedback;
            window.playCoin = originals.playCoin;
            window.playSfx = originals.playSfx;
            window.saveGameState = originals.saveGameState;
        }
        console.log("Shop Purchase Upgrade MP3 Test Completed.");
    }
    ,
    testDailyTargetFailPlaysMp3OncePerDay: function() {
        console.log("Running Daily Target Fail MP3 Once-Per-Day Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof settleDay !== 'function') { console.error("FAIL: settleDay missing."); return; }
        if (!window.AudioController || typeof AudioController.playSfxMp3OncePerDay !== 'function') { console.error("FAIL: AudioController.playSfxMp3OncePerDay missing."); return; }

        const backup = {
            isLive: game.isLive,
            dayEnded: game.dayEnded,
            dailyKPI: game.dailyKPI,
            dailyRevenue: game.dailyRevenue,
            currentDay: game.currentDay,
            level: game.level,
            served: game.served,
            total: game.total,
            dailyDishCount: game.dailyDishCount,
            dailyQualitySum: game.dailyQualitySum,
            dailySfxOnce: game.__dailySfxOnce ? JSON.stringify(game.__dailySfxOnce) : null
        };

        const originals = {
            playMp3: AudioController.playSfxMp3,
            fadeOutAndStopBgm: AudioController.fadeOutAndStopBgm,
            showBankruptModal: window.showBankruptModal,
            stopKMES: window.stopKMES
        };

        try {
            if (typeof stations === 'object' && stations) {
                try {
                    Object.values(stations).forEach(s => {
                        if (!s || typeof s !== 'object') return;
                        s.timer = null;
                        s.audio = null;
                        s.stage = s.stage || 'IDLE';
                    });
                } catch (_) {}
            }

            window.stopKMES = () => {};
            let bankruptShown = 0;
            window.showBankruptModal = () => { bankruptShown += 1; };

            let called = 0;
            let lastSrc = null;
            AudioController.playSfxMp3 = function(src) {
                called += 1;
                lastSrc = src;
                return true;
            };

            AudioController.fadeOutAndStopBgm = function() {
                return new Promise(resolve => setTimeout(() => resolve(true), 10));
            };

            try { delete game.__dailySfxOnce; } catch (_) { game.__dailySfxOnce = null; }

            game.isLive = true;
            game.dayEnded = false;
            game.dailyKPI = 100;
            game.dailyRevenue = 0;
            game.currentDay = 1;
            game.level = 1;
            game.served = 0;
            game.total = 0;
            game.dailyDishCount = 0;
            game.dailyQualitySum = 0;

            settleDay("test");
            setTimeout(() => {
                if (bankruptShown !== 1) console.error("FAIL: showBankruptModal should be called once.");
                else console.log("PASS: showBankruptModal called for KPI fail.");
                if (called === 1 && String(lastSrc || '').includes('未达标音效.mp3')) {
                    console.log("PASS: KPI fail triggers 未达标音效.mp3 (day 1).");
                } else {
                    console.error("FAIL: expected 未达标音效.mp3 once on day 1. called=" + called + " src=" + lastSrc);
                }

                game.isLive = true;
                game.dayEnded = false;
                settleDay("test-again");
                setTimeout(() => {
                    if (called === 1) console.log("PASS: same day does not trigger twice.");
                    else console.error("FAIL: expected no additional trigger on same day; called=" + called);

                    game.isLive = true;
                    game.dayEnded = false;
                    game.currentDay = 2;
                    game.level = 2;
                    settleDay("day2");
                    setTimeout(() => {
                        if (called === 2) console.log("PASS: day 2 triggers again once.");
                        else console.error("FAIL: expected trigger once on day 2; called=" + called);

                        AudioController.playSfxMp3 = function() { throw new Error('simulated mp3 play error'); };
                        game.isLive = true;
                        game.dayEnded = false;
                        game.currentDay = 3;
                        game.level = 3;
                        settleDay("day3");
                        setTimeout(() => {
                            if (bankruptShown >= 3) console.log("PASS: settlement stable when mp3 playback throws.");
                            else console.error("FAIL: settlement should still reach showBankruptModal even if mp3 throws.");
                        }, 30);
                    }, 30);
                }, 30);
            }, 30);
        } catch (e) {
            console.error("FAIL: Daily Target Fail MP3 Once-Per-Day Test crashed:", e);
        } finally {
            game.isLive = backup.isLive;
            game.dayEnded = backup.dayEnded;
            game.dailyKPI = backup.dailyKPI;
            game.dailyRevenue = backup.dailyRevenue;
            game.currentDay = backup.currentDay;
            game.level = backup.level;
            game.served = backup.served;
            game.total = backup.total;
            game.dailyDishCount = backup.dailyDishCount;
            game.dailyQualitySum = backup.dailyQualitySum;
            try {
                if (backup.dailySfxOnce === null) delete game.__dailySfxOnce;
                else game.__dailySfxOnce = JSON.parse(backup.dailySfxOnce);
            } catch (_) {}
            AudioController.playSfxMp3 = originals.playMp3;
            AudioController.fadeOutAndStopBgm = originals.fadeOutAndStopBgm;
            window.showBankruptModal = originals.showBankruptModal;
            window.stopKMES = originals.stopKMES;
        }
        console.log("Daily Target Fail MP3 Once-Per-Day Test Completed.");
    }
    ,
    testDailyTargetFailBgmFadeSequence: function() {
        console.log("Running Daily Target Fail BGM Fade Sequence Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof settleDay !== 'function') { console.error("FAIL: settleDay missing."); return; }
        if (!window.AudioController || typeof AudioController.fadeOutAndStopBgm !== 'function') { console.error("FAIL: AudioController.fadeOutAndStopBgm missing."); return; }

        const backup = {
            isLive: game.isLive,
            dayEnded: game.dayEnded,
            dailyKPI: game.dailyKPI,
            dailyRevenue: game.dailyRevenue,
            currentDay: game.currentDay,
            level: game.level,
            dailySfxOnce: game.__dailySfxOnce ? JSON.stringify(game.__dailySfxOnce) : null
        };

        const originals = {
            fadeOutAndStopBgm: AudioController.fadeOutAndStopBgm,
            playMp3: AudioController.playSfxMp3,
            showBankruptModal: window.showBankruptModal,
            stopKMES: window.stopKMES
        };

        try {
            window.stopKMES = () => {};
            window.showBankruptModal = () => {};
            try { delete game.__dailySfxOnce; } catch (_) { game.__dailySfxOnce = null; }

            let fadeDone = false;
            let fadeDoneAt = 0;
            let playAt = 0;

            AudioController.fadeOutAndStopBgm = function(id, ms) {
                if (String(id) !== 'bgm-game') console.error("FAIL: expected fade bgm-game, got " + id);
                if (Number(ms) !== 300) console.error("FAIL: expected fade 300ms, got " + ms);
                return new Promise(resolve => {
                    setTimeout(() => {
                        fadeDone = true;
                        fadeDoneAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
                        resolve(true);
                    }, 40);
                });
            };

            AudioController.playSfxMp3 = function(src) {
                playAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
                if (!fadeDone) console.error("FAIL: mp3 started before fade completed.");
                if (playAt < fadeDoneAt) console.error("FAIL: mp3 timestamp earlier than fadeDone.");
                if (String(src || '').includes('未达标音效.mp3')) console.log("PASS: mp3 src is 未达标音效.mp3");
                else console.error("FAIL: unexpected mp3 src: " + src);
                return true;
            };

            game.isLive = true;
            game.dayEnded = false;
            game.dailyKPI = 100;
            game.dailyRevenue = 0;
            game.currentDay = 11;
            game.level = 11;

            settleDay("fade-seq");
            setTimeout(() => {
                if (fadeDone && playAt > 0) console.log("PASS: fade completes before mp3 starts.");
                else console.error("FAIL: missing fade/mp3 events. fadeDone=" + fadeDone + " playAt=" + playAt);
                console.log("Daily Target Fail BGM Fade Sequence Test Completed.");
            }, 90);
        } catch (e) {
            console.error("FAIL: Daily Target Fail BGM Fade Sequence Test crashed:", e);
        } finally {
            game.isLive = backup.isLive;
            game.dayEnded = backup.dayEnded;
            game.dailyKPI = backup.dailyKPI;
            game.dailyRevenue = backup.dailyRevenue;
            game.currentDay = backup.currentDay;
            game.level = backup.level;
            try {
                if (backup.dailySfxOnce === null) delete game.__dailySfxOnce;
                else game.__dailySfxOnce = JSON.parse(backup.dailySfxOnce);
            } catch (_) {}
            AudioController.fadeOutAndStopBgm = originals.fadeOutAndStopBgm;
            AudioController.playSfxMp3 = originals.playMp3;
            window.showBankruptModal = originals.showBankruptModal;
            window.stopKMES = originals.stopKMES;
        }
    }
    ,
    testDailyTargetFailNoOverlap10Rounds: function() {
        console.log("Running Daily Target Fail No-Overlap Stress Test (10 Rounds)...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof settleDay !== 'function') { console.error("FAIL: settleDay missing."); return; }
        if (!window.AudioController || typeof AudioController.fadeOutAndStopBgm !== 'function') { console.error("FAIL: AudioController.fadeOutAndStopBgm missing."); return; }

        const backup = {
            isLive: game.isLive,
            dayEnded: game.dayEnded,
            dailyKPI: game.dailyKPI,
            dailyRevenue: game.dailyRevenue,
            currentDay: game.currentDay,
            level: game.level,
            dailySfxOnce: game.__dailySfxOnce ? JSON.stringify(game.__dailySfxOnce) : null
        };

        const originals = {
            fadeOutAndStopBgm: AudioController.fadeOutAndStopBgm,
            playMp3: AudioController.playSfxMp3,
            showBankruptModal: window.showBankruptModal,
            stopKMES: window.stopKMES
        };

        try {
            window.stopKMES = () => {};
            window.showBankruptModal = () => {};
            try { delete game.__dailySfxOnce; } catch (_) { game.__dailySfxOnce = null; }

            let round = 0;
            let totalFail = 0;

            const runRound = () => {
                round += 1;
                if (round > 10) {
                    if (totalFail === 0) console.log("PASS: 10 rounds completed with no overlap ordering issues.");
                    else console.error("FAIL: overlap ordering issues in " + totalFail + " rounds.");
                    console.log("Daily Target Fail No-Overlap Stress Test Completed.");
                    return;
                }

                let fadeDoneAt = 0;
                let playAt = 0;
                let fadePlannedMs = 300;
                const jitter = Math.floor(Math.random() * 180); // simulate device/network jitter
                const extraDelay = (round % 3 === 0) ? jitter : 0; // 1/3 rounds are "slow"
                const shouldThrowPlay = (round % 5 === 0); // some rounds simulate play permission/load failure

                AudioController.fadeOutAndStopBgm = function(id, ms) {
                    fadePlannedMs = Number(ms) || 300;
                    return new Promise(resolve => {
                        setTimeout(() => {
                            fadeDoneAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
                            resolve(true);
                        }, fadePlannedMs + extraDelay);
                    });
                };

                AudioController.playSfxMp3 = function(src) {
                    playAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
                    if (shouldThrowPlay) throw new Error('simulated mp3 play failure');
                    return true;
                };

                game.isLive = true;
                game.dayEnded = false;
                game.dailyKPI = 100;
                game.dailyRevenue = 0;
                game.currentDay = 100 + round;
                game.level = 100 + round;

                settleDay("stress-" + round);
                setTimeout(() => {
                    const hasPlayCall = playAt > 0;
                    const okOrder = (!hasPlayCall) || (fadeDoneAt > 0 && playAt >= fadeDoneAt);
                    if (!okOrder) {
                        totalFail += 1;
                        console.error(`FAIL: Round ${round} mp3 started before fade done. playAt=${playAt} fadeDoneAt=${fadeDoneAt} planned=${fadePlannedMs} extra=${extraDelay}`);
                    } else {
                        console.log(`PASS: Round ${round} order OK (planned=${fadePlannedMs} extra=${extraDelay} throwPlay=${shouldThrowPlay})`);
                    }
                    runRound();
                }, fadePlannedMs + extraDelay + 40);
            };

            runRound();
        } catch (e) {
            console.error("FAIL: Daily Target Fail No-Overlap Stress Test crashed:", e);
        } finally {
            game.isLive = backup.isLive;
            game.dayEnded = backup.dayEnded;
            game.dailyKPI = backup.dailyKPI;
            game.dailyRevenue = backup.dailyRevenue;
            game.currentDay = backup.currentDay;
            game.level = backup.level;
            try {
                if (backup.dailySfxOnce === null) delete game.__dailySfxOnce;
                else game.__dailySfxOnce = JSON.parse(backup.dailySfxOnce);
            } catch (_) {}
            AudioController.fadeOutAndStopBgm = originals.fadeOutAndStopBgm;
            AudioController.playSfxMp3 = originals.playMp3;
            window.showBankruptModal = originals.showBankruptModal;
            window.stopKMES = originals.stopKMES;
        }
    }
    ,
    testBonusClaimTimingAndNoDoubleTrigger: function() {
        console.log("Running Bonus Claim Timing + No Double Trigger Test...");
        const btn = document.getElementById('btn-claim-bonus');
        if (!btn) { console.error("FAIL: #btn-claim-bonus not found."); return; }
        if (typeof window.claimPerfectBonus !== 'function') { console.error("FAIL: claimPerfectBonus missing."); return; }
        if (!window.game) window.game = {};
        if (!Number.isFinite(Number(game.coins))) game.coins = 0;

        const backup = {
            pendingDailyBonus: window.pendingDailyBonus,
            coins: game.coins
        };

        const originals = {
            flyCoins: window.flyCoins,
            playRevenueSound: window.playRevenueSound,
            playCoin: window.playCoin,
            saveGameState: window.saveGameState,
            updateBalanceDisplay: window.updateBalanceDisplay,
            updateHUD: window.updateHUD
        };

        try {
            window.pendingDailyBonus = 100;
            game.coins = 1000;

            const call = { fly: 0, metaAt: 0, completeAt: 0 };
            const schedule = { meta: 80, complete: 240 };
            window.flyCoins = function(fromEl, toEl, gained, opts) {
                call.fly += 1;
                const started = Date.now();
                if (opts && typeof opts.onMeta === 'function') {
                    setTimeout(() => {
                        call.metaAt = Date.now() - started;
                        try { opts.onMeta({ count: 8, totalDurationMs: schedule.complete }); } catch (_) {}
                    }, schedule.meta);
                }
                if (opts && typeof opts.onComplete === 'function') {
                    setTimeout(() => {
                        call.completeAt = Date.now() - started;
                        try { opts.onComplete(); } catch (_) {}
                    }, schedule.complete);
                }
                return 8;
            };
            window.playRevenueSound = () => {};
            window.playCoin = () => {};
            window.saveGameState = () => {};
            window.updateBalanceDisplay = () => {};
            window.updateHUD = () => {};

            btn.disabled = false;
            if (btn.dataset) btn.dataset.claiming = '0';
            btn.classList.remove('is-claiming');
            btn.classList.remove('is-claimed');
            btn.innerHTML = `<span class="bonus-claim-content"><span class="bonus-claim-text"><span class="bonus-claim-plus">+</span> <span class="bonus-claim-amount">¥0</span></span></span>`;

            window.claimPerfectBonus();

            if (btn.classList.contains('is-claiming')) console.log("PASS: is-claiming set immediately.");
            else console.error("FAIL: is-claiming not set immediately.");

            for (let i = 0; i < 6; i++) window.claimPerfectBonus();

            if (call.fly === 1) console.log("PASS: flyCoins called once under repeated clicks.");
            else console.error("FAIL: flyCoins called " + call.fly + " times under repeated clicks.");

            const seenImmediateText = String(btn.textContent || '').includes('奖金已入账');
            if (!seenImmediateText) console.log("PASS: '奖金已入账' not shown immediately.");
            else console.error("FAIL: '奖金已入账' shown too early.");

            setTimeout(() => {
                const seenEarly = String(btn.textContent || '').includes('奖金已入账');
                if (!seenEarly) console.log("PASS: still not showing '奖金已入账' before animations done.");
                else console.error("FAIL: showing '奖金已入账' before animations done.");
            }, schedule.complete - 50);

            setTimeout(() => {
                const okClaimed = btn.classList.contains('is-claimed');
                const okText = String(btn.textContent || '').includes('奖金已入账');
                const okUnlock = !btn.disabled && (!btn.dataset || btn.dataset.claiming === '0');
                if (okClaimed && okText) console.log("PASS: shows '奖金已入账' after both animations complete.");
                else console.error("FAIL: final state wrong (is-claimed=" + okClaimed + ", text=" + okText + ").");
                if (okUnlock) console.log("PASS: button unlocked after finalize.");
                else console.error("FAIL: button not unlocked after finalize (disabled=" + btn.disabled + ", claiming=" + (btn.dataset ? btn.dataset.claiming : 'n/a') + ").");

                window.pendingDailyBonus = backup.pendingDailyBonus;
                game.coins = backup.coins;
                window.flyCoins = originals.flyCoins;
                window.playRevenueSound = originals.playRevenueSound;
                window.playCoin = originals.playCoin;
                window.saveGameState = originals.saveGameState;
                window.updateBalanceDisplay = originals.updateBalanceDisplay;
                window.updateHUD = originals.updateHUD;

                console.log("Bonus Claim Timing + No Double Trigger Test Completed.");
            }, schedule.complete + 40);
        } catch (e) {
            console.error("FAIL: Bonus Claim Timing + No Double Trigger Test crashed:", e);
            window.pendingDailyBonus = backup.pendingDailyBonus;
            game.coins = backup.coins;
            window.flyCoins = originals.flyCoins;
            window.playRevenueSound = originals.playRevenueSound;
            window.playCoin = originals.playCoin;
            window.saveGameState = originals.saveGameState;
            window.updateBalanceDisplay = originals.updateBalanceDisplay;
            window.updateHUD = originals.updateHUD;
        }
    }
    ,
    testShopHotspotCookUpgradeNoOmniFlash: function() {
        console.log("Running Shop Hotspot Cook Upgrade No-Flash Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof renderShop !== 'function') { console.error("FAIL: renderShop missing."); return; }
        if (typeof updateStoreVisuals !== 'function') { console.error("FAIL: updateStoreVisuals missing."); return; }
        const overlay = document.getElementById('shop-overlay');
        if (!overlay) { console.error("FAIL: #shop-overlay not found."); return; }

        const backup = {
            activeStoreId: game.activeStoreId,
            stores: game.stores ? JSON.stringify(game.stores) : null,
            inventory: game.inventory ? JSON.stringify(game.inventory) : null,
            bp: window.__bpLevelAnim,
            raf: window.requestAnimationFrame,
            usv: window.updateStoreVisuals
        };

        try {
            game.activeStoreId = 'cn:main';
            if (!game.stores) game.stores = {};
            if (!game.stores['cn:main']) game.stores['cn:main'] = { inventory: {} };
            if (!game.stores['cn:main'].inventory) game.stores['cn:main'].inventory = {};
            game.stores['cn:main'].inventory.pot = 3;
            if (!game.inventory) game.inventory = {};
            game.inventory.pot = 3;

            window.__bpLevelAnim = {
                category: 'tools',
                from: 3,
                to: 4,
                ts: Date.now(),
                type: 'pot',
                prevLevelIdx: 2,
                newLevelIdx: 3
            };

            const calls = [];
            window.updateStoreVisuals = function(opts) {
                calls.push(opts);
                return backup.usv(opts);
            };
            window.requestAnimationFrame = function(cb) {
                try { cb(performance.now()); } catch (_) { try { cb(Date.now()); } catch (_) {} }
                return 1;
            };

            renderShop();

            const hasBadCall = calls.some(c => c && c.ignoreAnim === true);
            if (!hasBadCall) console.log("PASS: renderShop did not force ignoreAnim=true during active bp anim.");
            else console.error("FAIL: renderShop forced ignoreAnim=true during active bp anim (may cause flash).", calls);

            console.log("Shop Hotspot Cook Upgrade No-Flash Test Completed.");
        } catch (e) {
            console.error("FAIL: Shop Hotspot Cook Upgrade No-Flash Test crashed:", e);
        } finally {
            game.activeStoreId = backup.activeStoreId;
            try { game.stores = backup.stores ? JSON.parse(backup.stores) : game.stores; } catch (_) {}
            try { game.inventory = backup.inventory ? JSON.parse(backup.inventory) : game.inventory; } catch (_) {}
            window.__bpLevelAnim = backup.bp;
            window.requestAnimationFrame = backup.raf;
            window.updateStoreVisuals = backup.usv;
        }
    }
    ,
    testComboVoiceRewardTrigger: function() {
        console.log("Running Combo Voice Reward Trigger Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof tryPlayComboVoiceReward !== 'function') { console.error("FAIL: tryPlayComboVoiceReward missing."); return; }

        const backup = {
            activeStoreId: game.activeStoreId,
            comboCount: game.comboCount,
            lastVoiceTime: game.lastVoiceTime,
            sfxEnabled: (typeof sfxEnabled !== 'undefined') ? sfxEnabled : undefined,
            rand: window.__comboVoiceRand,
            now: Date.now,
            audio: window.Audio
        };

        try {
            game.activeStoreId = 'cn:main';
            game.comboCount = 5;
            game.lastVoiceTime = 0;
            if (typeof sfxEnabled !== 'undefined') sfxEnabled = true;

            let playCount = 0;
            let lastSrc = '';
            window.Audio = function(src) {
                lastSrc = String(src || '');
                this.volume = 1;
                this.play = () => { playCount += 1; return Promise.resolve(true); };
                return this;
            };

            Date.now = () => 10000;
            window.__comboVoiceRand = () => 0.1;

            tryPlayComboVoiceReward();

            if (playCount === 1 && lastSrc.includes('assets/voice/customers/')) console.log("PASS: voice played from customer voice path.");
            else console.error("FAIL: voice did not play as expected (playCount=" + playCount + ", src=" + lastSrc + ").");
            if (game.lastVoiceTime === 10000) console.log("PASS: lastVoiceTime updated.");
            else console.error("FAIL: lastVoiceTime not updated (" + game.lastVoiceTime + ").");

            playCount = 0;
            lastSrc = '';
            game.comboCount = 6;
            game.lastVoiceTime = 5000;
            Date.now = () => 10000;
            window.__comboVoiceRand = () => 0.1;
            tryPlayComboVoiceReward();
            if (playCount === 0) console.log("PASS: cooldown prevents voice.");
            else console.error("FAIL: cooldown did not prevent voice.");

            playCount = 0;
            lastSrc = '';
            game.comboCount = 6;
            game.lastVoiceTime = 0;
            Date.now = () => 20000;
            window.__comboVoiceRand = () => 0.1;
            tryPlayComboVoiceReward();
            if (playCount === 1) console.log("PASS: plays without probability gate.");
            else console.error("FAIL: did not play without probability gate.");

            playCount = 0;
            lastSrc = '';
            game.comboCount = 6;
            game.lastVoiceTime = 0;
            Date.now = () => 30000;
            window.__comboVoiceRand = () => 0.1;
            if (typeof sfxEnabled !== 'undefined') sfxEnabled = false;
            tryPlayComboVoiceReward();
            if (playCount === 0) console.log("PASS: sfx toggle prevents voice.");
            else console.error("FAIL: sfx toggle did not prevent voice.");

            console.log("Combo Voice Reward Trigger Test Completed.");
        } catch (e) {
            console.error("FAIL: Combo Voice Reward Trigger Test crashed:", e);
        } finally {
            game.activeStoreId = backup.activeStoreId;
            game.comboCount = backup.comboCount;
            game.lastVoiceTime = backup.lastVoiceTime;
            if (typeof sfxEnabled !== 'undefined' && backup.sfxEnabled !== undefined) sfxEnabled = backup.sfxEnabled;
            window.__comboVoiceRand = backup.rand;
            Date.now = backup.now;
            window.Audio = backup.audio;
        }
    }
    ,
    testFrenchDraftFlipSfxEachCard: function() {
        console.log("Running French Draft Flip SFX Each-Card Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof showFrenchMenuDraftModal !== 'function') { console.error("FAIL: showFrenchMenuDraftModal missing."); return; }

        const backup = {
            activeStoreId: game.activeStoreId,
            level: game.level,
            coins: game.coins,
            generate: window.generateFrenchDailyMenu,
            hook: window.__frCardFlipSfxHook
        };

        try {
            game.activeStoreId = 'fr:test';
            game.level = 1;
            game.coins = 999999;

            const frPool = (Array.isArray(window.RECIPES) ? window.RECIPES : []).filter(r => r && String(r.region || '').includes('fr'));
            if (frPool.length < 5) { console.error("FAIL: not enough France recipes in RECIPES for test."); return; }
            window.generateFrenchDailyMenu = () => frPool.slice(0, 5).map(r => JSON.parse(JSON.stringify(r)));

            let flipCalls = 0;
            let maxDelta = 0;
            window.__frCardFlipSfxHook = (meta) => {
                flipCalls += 1;
                const d = meta && Number.isFinite(meta.deltaMs) ? meta.deltaMs : 0;
                if (d > maxDelta) maxDelta = d;
            };

            showFrenchMenuDraftModal(() => {});
            const overlay = document.getElementById('fr-menu-draft-modal');
            if (!overlay) { console.error("FAIL: #fr-menu-draft-modal not found."); return; }
            const startBtn = overlay.querySelector('#btn-fr-start-draw');
            if (!startBtn) { console.error("FAIL: #btn-fr-start-draw not found."); return; }
            startBtn.click();

            setTimeout(() => {
                const scenes = Array.from(overlay.querySelectorAll('.fr-card-scene'));
                const expected = scenes.length;
                if (expected <= 0) {
                    console.error("FAIL: no .fr-card-scene found.");
                } else if (flipCalls === expected && maxDelta <= 50) {
                    console.log(`PASS: flip sfx called once per card and synced (expected=${expected}, got=${flipCalls}, maxDelta=${maxDelta.toFixed(2)}ms).`);
                } else {
                    console.error(`FAIL: flip sfx mismatch (expected=${expected}, got=${flipCalls}, maxDelta=${maxDelta.toFixed(2)}ms).`);
                }
                try { overlay.remove(); } catch (_) {}
                game.activeStoreId = backup.activeStoreId;
                game.level = backup.level;
                game.coins = backup.coins;
                window.generateFrenchDailyMenu = backup.generate;
                window.__frCardFlipSfxHook = backup.hook;
                console.log("French Draft Flip SFX Each-Card Test Completed.");
            }, 4200);
        } catch (e) {
            console.error("FAIL: French Draft Flip SFX Each-Card Test crashed:", e);
            game.activeStoreId = backup.activeStoreId;
            game.level = backup.level;
            game.coins = backup.coins;
            window.generateFrenchDailyMenu = backup.generate;
            window.__frCardFlipSfxHook = backup.hook;
        }
    }
    ,
    testFrenchDraftFlipSfxRerollStress10: function() {
        console.log("Running French Draft Flip SFX Reroll Stress x10 Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof showFrenchMenuDraftModal !== 'function') { console.error("FAIL: showFrenchMenuDraftModal missing."); return; }

        const backup = {
            activeStoreId: game.activeStoreId,
            level: game.level,
            coins: game.coins,
            generate: window.generateFrenchDailyMenu,
            hook: window.__frCardFlipSfxHook,
            setTimeout: window.setTimeout
        };

        try {
            game.activeStoreId = 'fr:test';
            game.level = 1;
            game.coins = 9999999;

            const frPool = (Array.isArray(window.RECIPES) ? window.RECIPES : []).filter(r => r && String(r.region || '').includes('fr'));
            if (frPool.length < 5) { console.error("FAIL: not enough France recipes in RECIPES for test."); return; }
            window.generateFrenchDailyMenu = () => frPool.slice(0, 5).map(r => JSON.parse(JSON.stringify(r)));

            const speed = 0.12;
            window.setTimeout = (fn, ms) => backup.setTimeout(fn, Math.max(0, Math.floor((Number(ms) || 0) * speed)));

            let flipCalls = 0;
            window.__frCardFlipSfxHook = () => { flipCalls += 1; };

            showFrenchMenuDraftModal(() => {});
            const overlay = document.getElementById('fr-menu-draft-modal');
            if (!overlay) { console.error("FAIL: #fr-menu-draft-modal not found."); return; }
            const startBtn = overlay.querySelector('#btn-fr-start-draw');
            const rerollBtn = overlay.querySelector('#btn-fr-reroll');
            if (!startBtn) { console.error("FAIL: #btn-fr-start-draw not found."); return; }
            if (!rerollBtn) { console.error("FAIL: #btn-fr-reroll not found."); return; }
            startBtn.click();

            backup.setTimeout(() => {
                const scenes = Array.from(overlay.querySelectorAll('.fr-card-scene'));
                const perRound = scenes.length;
                if (perRound <= 0) { console.error("FAIL: no .fr-card-scene found."); return; }

                let round = 0;
                const doReroll = () => {
                    if (!overlay.isConnected) return;
                    if (round >= 10) return;
                    rerollBtn.click();
                    round += 1;
                    backup.setTimeout(doReroll, 260);
                };
                doReroll();

                backup.setTimeout(() => {
                    const expectedMin = perRound * (1 + 10);
                    if (flipCalls >= expectedMin) {
                        console.log(`PASS: flip sfx stress ok (expected>=${expectedMin}, got=${flipCalls}).`);
                    } else {
                        console.error(`FAIL: flip sfx stress too low (expected>=${expectedMin}, got=${flipCalls}).`);
                    }
                    try { overlay.remove(); } catch (_) {}
                    game.activeStoreId = backup.activeStoreId;
                    game.level = backup.level;
                    game.coins = backup.coins;
                    window.generateFrenchDailyMenu = backup.generate;
                    window.__frCardFlipSfxHook = backup.hook;
                    window.setTimeout = backup.setTimeout;
                    console.log("French Draft Flip SFX Reroll Stress x10 Test Completed.");
                }, 4800);
            }, 4300);
        } catch (e) {
            console.error("FAIL: French Draft Flip SFX Reroll Stress x10 Test crashed:", e);
            game.activeStoreId = backup.activeStoreId;
            game.level = backup.level;
            game.coins = backup.coins;
            window.generateFrenchDailyMenu = backup.generate;
            window.__frCardFlipSfxHook = backup.hook;
            window.setTimeout = backup.setTimeout;
        }
    }
    ,
    testOrderSlotsNoEmptyOver1sAllLevels: function() {
        console.log("Running Order Slots <=1s Empty Window Test (All Expansion Levels)...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof initOrderSlotPerfState !== 'function') { console.error("FAIL: initOrderSlotPerfState missing."); return; }
        if (typeof ensureOrderSlotsFilled !== 'function') { console.error("FAIL: ensureOrderSlotsFilled missing."); return; }
        if (typeof monitorOrderSlotEmptyWindows !== 'function') { console.error("FAIL: monitorOrderSlotEmptyWindows missing."); return; }

        const backup = {
            now: Date.now,
            setTimeout: window.setTimeout,
            clearTimeout: window.clearTimeout,
            spawnOrder: window.spawnOrder,
            getStoreInventory: window.getStoreInventory,
            err: console.error,
            warn: console.warn,
            inv: game.inventory ? JSON.stringify(game.inventory) : null,
            isLive: game.isLive,
            isPaused: game.isPaused
        };

        try {
            let nowMs = 0;
            Date.now = () => nowMs;
            window.setTimeout = (fn, ms) => {
                nowMs += Math.max(0, Math.floor(Number(ms) || 0));
                try { fn(); } catch (e) { backup.err("FAIL: timer fn crashed:", e); }
                return 1;
            };
            window.clearTimeout = () => {};

            game.isLive = true;
            game.isPaused = false;
            if (!game.inventory) game.inventory = {};
            game.inventory.expansion = 0;

            let violationCount = 0;
            console.error = function() { violationCount += 1; return backup.err.apply(console, arguments); };
            console.warn = function() { return backup.warn.apply(console, arguments); };

            const levels = (window.SHOP_CONFIG && SHOP_CONFIG.expansion && Array.isArray(SHOP_CONFIG.expansion.levels)) ? SHOP_CONFIG.expansion.levels : [];
            if (levels.length === 0) { backup.err("FAIL: SHOP_CONFIG.expansion.levels missing."); return; }

            window.getStoreInventory = () => ({ expansion: game.inventory.expansion, pot: 4, kmes: 3 });

            window.spawnOrder = function(slotIdx) {
                if (!game.orderSlots) game.orderSlots = [null, null, null, null, null];
                if (!Array.isArray(game.activeOrders)) game.activeOrders = [];
                if (game.orderSlots[slotIdx] !== null) return true;
                if (!game.__spawnDelayStart) game.__spawnDelayStart = Date.now();
                if (Date.now() - game.__spawnDelayStart < 600) return false;
                const o = { id: 't:' + Date.now() + ':' + slotIdx, dishes: [{ name: 'x', price: 10 }], slotIdx };
                game.orderSlots[slotIdx] = o;
                game.activeOrders.push(o);
                return true;
            };

            let allPass = true;
            for (let lvl = 0; lvl < levels.length; lvl++) {
                nowMs = 0;
                game.__spawnDelayStart = 0;
                game.inventory.expansion = lvl;
                initOrderSlotPerfState();
                game.activeOrders = [];
                game.orderSlots = [null, null, null, null, null];

                ensureOrderSlotsFilled('test');
                monitorOrderSlotEmptyWindows();

                const unlocked = (levels[lvl] && Number.isFinite(levels[lvl].slots)) ? levels[lvl].slots : 2;
                const filled = game.orderSlots.slice(0, unlocked).every(x => x !== null);
                if (!filled || nowMs > 1000) {
                    allPass = false;
                    backup.err(`FAIL: lvl=${lvl} unlocked=${unlocked} filled=${filled} nowMs=${nowMs}`);
                } else {
                    console.log(`PASS: lvl=${lvl} unlocked=${unlocked} fillMs=${nowMs}`);
                }
            }

            if (violationCount > 0) backup.err(`FAIL: violations logged=${violationCount}`);
            else console.log("PASS: no violation logs emitted.");
            if (allPass) console.log("Order Slots <=1s Empty Window Test Completed (PASS).");
            else backup.err("Order Slots <=1s Empty Window Test Completed (FAIL).");
        } catch (e) {
            backup.err("FAIL: Order Slots <=1s Empty Window Test crashed:", e);
        } finally {
            Date.now = backup.now;
            window.setTimeout = backup.setTimeout;
            window.clearTimeout = backup.clearTimeout;
            window.spawnOrder = backup.spawnOrder;
            window.getStoreInventory = backup.getStoreInventory;
            console.error = backup.err;
            console.warn = backup.warn;
            try { game.inventory = backup.inv ? JSON.parse(backup.inv) : game.inventory; } catch (_) {}
            game.isLive = backup.isLive;
            game.isPaused = backup.isPaused;
        }
    }
    ,
    testOrderSlotsPeakStress10: function() {
        console.log("Running Order Slots Peak Stress x10 Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof initOrderSlotPerfState !== 'function') { console.error("FAIL: initOrderSlotPerfState missing."); return; }
        if (typeof ensureOrderSlotsFilled !== 'function') { console.error("FAIL: ensureOrderSlotsFilled missing."); return; }

        const backup = {
            now: Date.now,
            setTimeout: window.setTimeout,
            clearTimeout: window.clearTimeout,
            spawnOrder: window.spawnOrder,
            getStoreInventory: window.getStoreInventory,
            inv: game.inventory ? JSON.stringify(game.inventory) : null,
            isLive: game.isLive,
            isPaused: game.isPaused
        };

        try {
            let nowMs = 0;
            Date.now = () => nowMs;
            window.setTimeout = (fn, ms) => { nowMs += Math.max(0, Math.floor(Number(ms) || 0)); fn(); return 1; };
            window.clearTimeout = () => {};

            game.isLive = true;
            game.isPaused = false;
            if (!game.inventory) game.inventory = {};
            game.inventory.expansion = 0;
            window.getStoreInventory = () => ({ expansion: game.inventory.expansion, pot: 4, kmes: 3 });

            const levels = (window.SHOP_CONFIG && SHOP_CONFIG.expansion && Array.isArray(SHOP_CONFIG.expansion.levels)) ? SHOP_CONFIG.expansion.levels : [];
            if (levels.length === 0) { console.error("FAIL: SHOP_CONFIG.expansion.levels missing."); return; }

            window.spawnOrder = function(slotIdx) {
                if (!game.orderSlots) game.orderSlots = [null, null, null, null, null];
                if (!Array.isArray(game.activeOrders)) game.activeOrders = [];
                if (game.orderSlots[slotIdx] !== null) return true;
                const o = { id: 's:' + Date.now() + ':' + slotIdx, dishes: [{ name: 'x', price: 10 }], slotIdx };
                game.orderSlots[slotIdx] = o;
                game.activeOrders.push(o);
                return true;
            };

            for (let lvl = 0; lvl < levels.length; lvl++) {
                game.inventory.expansion = lvl;
                initOrderSlotPerfState();
                game.activeOrders = [];
                game.orderSlots = [null, null, null, null, null];
                ensureOrderSlotsFilled('stress_init');

                const unlocked = (levels[lvl] && Number.isFinite(levels[lvl].slots)) ? levels[lvl].slots : 2;
                for (let round = 0; round < 10; round++) {
                    const idx = round % unlocked;
                    game.orderSlots[idx] = null;
                    game.activeOrders = (game.activeOrders || []).filter(o => o && o.slotIdx !== idx);
                    ensureOrderSlotsFilled('stress');
                }
                const ok = game.orderSlots.slice(0, unlocked).every(x => x !== null);
                if (ok) console.log(`PASS: lvl=${lvl} stress x10 ok.`);
                else console.error(`FAIL: lvl=${lvl} stress x10 left empty slots.`);
            }

            console.log("Order Slots Peak Stress x10 Test Completed.");
        } catch (e) {
            console.error("FAIL: Order Slots Peak Stress x10 Test crashed:", e);
        } finally {
            Date.now = backup.now;
            window.setTimeout = backup.setTimeout;
            window.clearTimeout = backup.clearTimeout;
            window.spawnOrder = backup.spawnOrder;
            window.getStoreInventory = backup.getStoreInventory;
            try { game.inventory = backup.inv ? JSON.parse(backup.inv) : game.inventory; } catch (_) {}
            game.isLive = backup.isLive;
            game.isPaused = backup.isPaused;
        }
    }
    ,
    testOrderSlotMinDelayButWithin1s: function() {
        console.log("Running Order Slot Min-Delay But <=1s Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof initOrderSlotPerfState !== 'function') { console.error("FAIL: initOrderSlotPerfState missing."); return; }
        if (typeof ensureOrderSlotsFilled !== 'function') { console.error("FAIL: ensureOrderSlotsFilled missing."); return; }

        const backup = {
            now: Date.now,
            setTimeout: window.setTimeout,
            clearTimeout: window.clearTimeout,
            spawnOrder: window.spawnOrder,
            getStoreInventory: window.getStoreInventory,
            inv: game.inventory ? JSON.stringify(game.inventory) : null,
            isLive: game.isLive,
            isPaused: game.isPaused
        };

        try {
            let nowMs = 0;
            Date.now = () => nowMs;
            window.setTimeout = (fn, ms) => { nowMs += Math.max(0, Math.floor(Number(ms) || 0)); fn(); return 1; };
            window.clearTimeout = () => {};

            game.isLive = true;
            game.isPaused = false;
            if (!game.inventory) game.inventory = {};
            game.inventory.expansion = 0;
            window.getStoreInventory = () => ({ expansion: game.inventory.expansion, pot: 4, kmes: 3 });

            initOrderSlotPerfState();
            game.orderSlots = [null, null, null, null, null];
            game.activeOrders = [];
            game.orderSlotNoFillBefore[0] = Date.now() + 780;
            window.spawnOrder = function(slotIdx) {
                if (game.orderSlots[slotIdx] !== null) return true;
                game.orderSlots[slotIdx] = { id: 'd:' + Date.now(), dishes: [{ name: 'x', price: 10 }], slotIdx };
                return true;
            };

            ensureOrderSlotsFilled('delay_test');
            const filled = game.orderSlots[0] !== null;
            if (!filled) console.error(`FAIL: slot not filled after scheduling (nowMs=${nowMs})`);
            else if (nowMs < 780) console.error(`FAIL: filled too early (nowMs=${nowMs})`);
            else if (nowMs > 1000) console.error(`FAIL: filled too late (nowMs=${nowMs})`);
            else console.log(`PASS: filled respecting min delay and <=1s (fillMs=${nowMs}).`);
        } catch (e) {
            console.error("FAIL: Order Slot Min-Delay But <=1s Test crashed:", e);
        } finally {
            Date.now = backup.now;
            window.setTimeout = backup.setTimeout;
            window.clearTimeout = backup.clearTimeout;
            window.spawnOrder = backup.spawnOrder;
            window.getStoreInventory = backup.getStoreInventory;
            try { game.inventory = backup.inv ? JSON.parse(backup.inv) : game.inventory; } catch (_) {}
            game.isLive = backup.isLive;
            game.isPaused = backup.isPaused;
        }
    }
    ,
    testKMESAdvancedPrepKicksWithin100msOnServe: function() {
        console.log("Running KMES Advanced: Prep Kick Within 100ms On Serve Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof takeOrder !== 'function') { console.error("FAIL: takeOrder missing."); return; }
        if (typeof kmesAutoPrep !== 'function') { console.error("FAIL: kmesAutoPrep missing."); return; }

        const backup = {
            now: Date.now,
            setTimeout: window.setTimeout,
            clearTimeout: window.clearTimeout,
            getStoreInventory: window.getStoreInventory,
            getActiveRecipes: window.getActiveRecipes,
            getCurrentPotTier: window.getCurrentPotTier,
            triggerFeedback: window.triggerFeedback,
            playRevenueSound: window.playRevenueSound,
            updateHUD: window.updateHUD,
            refreshCurrentHighlight: window.refreshCurrentHighlight,
            kmesAutoPrep: window.kmesAutoPrep,
            holdingThing: window.holdingThing,
            isLive: game.isLive,
            isPaused: game.isPaused,
            kmesActive: game.kmesActive,
            hasOpenedPantry: game.hasOpenedPantry,
            inventory: game.inventory ? JSON.stringify(game.inventory) : null
        };

        try {
            let nowMs = 0;
            Date.now = () => nowMs;
            window.setTimeout = (fn, ms) => {
                nowMs += Math.max(0, Math.floor(Number(ms) || 0));
                fn();
                return 1;
            };
            window.clearTimeout = () => {};

            game.isLive = true;
            game.isPaused = false;
            game.kmesActive = true;
            game.hasOpenedPantry = true;
            if (!game.inventory) game.inventory = {};
            game.inventory.kmes = 2;
            game.inventory.expansion = 0;
            window.getStoreInventory = () => ({ kmes: 2, expansion: 0, pot: 4 });

            window.triggerFeedback = () => {};
            window.playRevenueSound = () => {};
            window.updateHUD = () => {};
            window.refreshCurrentHighlight = () => {};
            window.getCurrentPotTier = () => 4;
            window.getActiveRecipes = () => ([{ id: 'r1', name: '番茄炒蛋', price: 10, ingredients: ['tomato', 'egg'] }]);

            const dom = document.createElement('div');
            dom.className = 'order-ticket';
            dom.getBoundingClientRect = () => ({ left: 0, top: 0, width: 140, height: 130, bottom: 130 });
            document.body.appendChild(dom);

            const order = { id: 'o1', slotIdx: 0, dishes: [{ id: 'r1', name: '番茄炒蛋', price: 10, ingredients: ['tomato', 'egg'] }], patience: 1000, maxPatience: 2000, dom };
            if (!Array.isArray(game.activeOrders)) game.activeOrders = [];
            game.activeOrders = [order];
            game.orderSlots = [order, null, null, null, null];

            window.holdingThing = { type: 'DISH', val: { name: '番茄炒蛋', price: 10, quality: 1 }, sourceSid: null };

            let fired = 0;
            let delta = 9999;
            window.kmesAutoPrep = () => {
                fired += 1;
                delta = Math.min(delta, nowMs);
            };

            takeOrder(order);

            if (fired >= 1 && delta <= 100) console.log(`PASS: kmesAutoPrep kicked within 100ms (delta=${delta}ms).`);
            else console.error(`FAIL: kmesAutoPrep kick too slow or missing (fired=${fired}, delta=${delta}ms).`);
            try { dom.remove(); } catch (_) {}
        } catch (e) {
            console.error("FAIL: KMES Advanced Prep Kick Test crashed:", e);
        } finally {
            Date.now = backup.now;
            window.setTimeout = backup.setTimeout;
            window.clearTimeout = backup.clearTimeout;
            window.getStoreInventory = backup.getStoreInventory;
            window.getActiveRecipes = backup.getActiveRecipes;
            window.getCurrentPotTier = backup.getCurrentPotTier;
            window.triggerFeedback = backup.triggerFeedback;
            window.playRevenueSound = backup.playRevenueSound;
            window.updateHUD = backup.updateHUD;
            window.refreshCurrentHighlight = backup.refreshCurrentHighlight;
            window.kmesAutoPrep = backup.kmesAutoPrep;
            window.holdingThing = backup.holdingThing;
            game.isLive = backup.isLive;
            game.isPaused = backup.isPaused;
            game.kmesActive = backup.kmesActive;
            game.hasOpenedPantry = backup.hasOpenedPantry;
            try { game.inventory = backup.inventory ? JSON.parse(backup.inventory) : game.inventory; } catch (_) {}
        }
    }
    ,
    testKMESAutoPrepSkipsLockedStations: function() {
        console.log("Running KMES AutoPrep Skips Locked Stations Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof kmesAutoPrep !== 'function') { console.error("FAIL: kmesAutoPrep missing."); return; }
        if (typeof getKMESRecipePool !== 'function') { console.error("FAIL: getKMESRecipePool missing."); return; }

        const backup = {
            getStoreInventory: window.getStoreInventory,
            getActiveRecipes: window.getActiveRecipes,
            RECIPES: window.RECIPES,
            consumeIngredient: window.consumeIngredient,
            initIngredients: window.initIngredients,
            renderStation: window.renderStation,
            showToast: window.showToast,
            triggerPrepStockInsufficientToast: window.triggerPrepStockInsufficientToast,
            dailyInventory: game.dailyInventory,
            isLive: game.isLive,
            isPaused: game.isPaused,
            orderSlots: game.orderSlots ? JSON.stringify(game.orderSlots) : null,
            activeOrders: game.activeOrders ? JSON.stringify(game.activeOrders) : null,
            stations: (typeof window.stations === 'object' && window.stations) ? JSON.stringify(window.stations) : null
        };

        try {
            game.isLive = true;
            game.isPaused = false;
            game.dailyInventory = false;
            window.getStoreInventory = () => ({ kmes: 2, pot: 4, expansion: 0 });
            const r1 = { id: 'r1', name: '番茄炒蛋', price: 10, ingredients: ['tomato', 'egg'] };
            window.getActiveRecipes = () => [r1];
            if (!Array.isArray(window.RECIPES)) window.RECIPES = [];

            const domS1 = document.createElement('div');
            domS1.id = 's_s1';
            domS1.className = 'station';
            document.body.appendChild(domS1);
            const domS2 = document.getElementById('s_s2');
            if (domS2) domS2.remove();

            if (typeof window.stations !== 'object' || !window.stations) window.stations = {};
            window.stations.s1 = { id: 's1', stage: 'COOKING', currentIngredients: [], recipe: r1, progress: 10, maintenance: 0, equipLevel: 4 };
            window.stations.s2 = { id: 's2', stage: 'IDLE', currentIngredients: [], recipe: null, progress: 0, maintenance: 0, equipLevel: 4 };

            game.orderSlots = [{
                id: 'o1',
                dishes: [{ id: 'r1', name: '番茄炒蛋', price: 10, ingredients: ['tomato', 'egg'] }],
                patience: 1000,
                maxPatience: 2000
            }];
            game.activeOrders = game.orderSlots.slice();

            window.consumeIngredient = () => true;
            window.initIngredients = () => {};
            window.showToast = () => {};
            window.triggerPrepStockInsufficientToast = () => {};

            const calls = [];
            window.renderStation = (sid) => { calls.push(String(sid)); };

            kmesAutoPrep();

            if (calls.includes('s2')) console.error("FAIL: kmesAutoPrep should not prep on locked/unrendered station s2.");
            else console.log("PASS: kmesAutoPrep skipped locked/unrendered stations.");

            try { domS1.remove(); } catch (_) {}
        } catch (e) {
            console.error("FAIL: KMES AutoPrep Skips Locked Stations Test crashed:", e);
        } finally {
            window.getStoreInventory = backup.getStoreInventory;
            window.getActiveRecipes = backup.getActiveRecipes;
            window.RECIPES = backup.RECIPES;
            window.consumeIngredient = backup.consumeIngredient;
            window.initIngredients = backup.initIngredients;
            window.renderStation = backup.renderStation;
            window.showToast = backup.showToast;
            window.triggerPrepStockInsufficientToast = backup.triggerPrepStockInsufficientToast;
            game.dailyInventory = backup.dailyInventory;
            game.isLive = backup.isLive;
            game.isPaused = backup.isPaused;
            try { game.orderSlots = backup.orderSlots ? JSON.parse(backup.orderSlots) : game.orderSlots; } catch (_) {}
            try { game.activeOrders = backup.activeOrders ? JSON.parse(backup.activeOrders) : game.activeOrders; } catch (_) {}
            try {
                if (backup.stations) window.stations = JSON.parse(backup.stations);
            } catch (_) {}
        }
    }
    ,
    testTutorialOnlyOnChinaMainDay1: function() {
        console.log("Running Tutorial Only On China Main Day1 Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof updateTutorial !== 'function') { console.error("FAIL: updateTutorial missing."); return; }
        if (typeof hideTutorialUI !== 'function') { console.error("FAIL: hideTutorialUI missing."); return; }

        const backup = {
            activeStoreId: game.activeStoreId,
            stores: game.stores ? JSON.stringify(game.stores) : null,
            currentDay: game.currentDay,
            level: game.level,
            isLive: game.isLive,
            isPaused: game.isPaused,
            uiState: (typeof window.uiState !== 'undefined') ? window.uiState : undefined
        };

        try {
            hideTutorialUI();
            document.querySelectorAll('.tutorial-bubble').forEach(n => { try { n.remove(); } catch (_) {} });

            game.isLive = true;
            game.isPaused = false;
            window.uiState = 'GAME';
            if (!game.stores) game.stores = {};

            game.activeStoreId = 'jp:shibuya';
            game.stores['jp:shibuya'] = game.stores['jp:shibuya'] || { level: 1, inventory: {} };
            game.level = 1;
            game.currentDay = 1;

            updateTutorial();
            const jpHas = document.querySelectorAll('.tutorial-bubble').length > 0;
            if (!jpHas) console.log("PASS: no tutorial bubble on other store day1.");
            else console.error("FAIL: tutorial bubble should not appear on other store day1.");

            hideTutorialUI();
            document.querySelectorAll('.tutorial-bubble').forEach(n => { try { n.remove(); } catch (_) {} });

            game.activeStoreId = 'cn:main';
            game.stores['cn:main'] = game.stores['cn:main'] || { level: 1, inventory: {} };
            game.level = 1;
            game.currentDay = 1;

            updateTutorial();
            const cnHas = document.querySelectorAll('.tutorial-bubble').length > 0;
            if (cnHas) console.log("PASS: tutorial bubble appears on cn:main day1.");
            else console.error("FAIL: tutorial bubble missing on cn:main day1.");
        } catch (e) {
            console.error("FAIL: Tutorial Only On China Main Day1 Test crashed:", e);
        } finally {
            game.activeStoreId = backup.activeStoreId;
            try { game.stores = backup.stores ? JSON.parse(backup.stores) : game.stores; } catch (_) {}
            game.currentDay = backup.currentDay;
            game.level = backup.level;
            game.isLive = backup.isLive;
            game.isPaused = backup.isPaused;
            if (backup.uiState === undefined) { try { delete window.uiState; } catch (_) { window.uiState = backup.uiState; } }
            else window.uiState = backup.uiState;
            hideTutorialUI();
        }
    }
    ,
    testPrepIngredientCategoryAlwaysCorrect: function() {
        console.log("Running Prep Ingredient Category Always Correct Test...");
        if (typeof window.getPrepIngredientCategory !== 'function') { console.error("FAIL: getPrepIngredientCategory missing."); return; }

        const cases = [
            ['black_pepper', 'other'],
            ['avocado', 'veggie'],
            ['cinnamon', 'other'],
            ['foie_gras', 'meat'],
            ['apple', 'veggie']
        ];

        let failed = false;
        cases.forEach(([id, expected]) => {
            const got = window.getPrepIngredientCategory(id);
            if (got !== expected) {
                failed = true;
                console.error(`FAIL: ${id} expected ${expected} got ${got}`);
            } else {
                console.log(`PASS: ${id} -> ${got}`);
            }
        });

        const allIds = (typeof window.INGREDIENTS === 'object' && window.INGREDIENTS) ? Object.keys(window.INGREDIENTS) : [];
        allIds.forEach(id => {
            const got = window.getPrepIngredientCategory(id);
            if (!got) {
                failed = true;
                console.error(`FAIL: missing category for ${id}`);
            }
        });

        if (!failed) console.log("PASS: all ingredient categories resolved.");
    }
    ,
    testCrateOnlyAddsUnlockedIngredients: function() {
        console.log("Running Crate Only Adds Unlocked Ingredients Test...");
        if (typeof window.buyCrate !== 'function') { console.error("FAIL: buyCrate missing."); return; }
        if (!window.game) { console.error("FAIL: game object not found."); return; }

        const backup = {
            activeStoreId: game.activeStoreId,
            stores: game.stores ? JSON.stringify(game.stores) : null,
            level: game.level,
            currentDay: game.currentDay,
            getActiveRecipes: window.getActiveRecipes,
            getStoreFridgeDays: window.getStoreFridgeDays,
            addIngredientBatchToRoot: window.addIngredientBatchToRoot,
            showToast: window.showToast,
            playSfx: window.playSfx,
            tempCoins: window.tempCoins,
            tempInventory: window.tempInventory
        };

        try {
            game.activeStoreId = 'fr:champ';
            if (!game.stores) game.stores = {};
            game.stores['fr:champ'] = game.stores['fr:champ'] || {};
            game.level = 20;
            game.currentDay = 20;

            const allowed = new Set(['beef', 'onion', 'apple', 'butter']);
            window.getActiveRecipes = () => [{ id: 't', ingredients: Array.from(allowed) }];
            window.getStoreFridgeDays = () => 3;
            window.addIngredientBatchToRoot = (inv, id, qty) => { inv[id] = (inv[id] || 0) + qty; };
            window.showToast = () => {};
            window.playSfx = () => {};

            window.tempCoins = 999999;
            window.tempInventory = {};

            buyCrate('meat');

            const addedIds = Object.keys(window.tempInventory || {});
            const bad = addedIds.filter(id => !allowed.has(id));
            if (bad.length > 0) console.error("FAIL: crate added locked ingredients:", bad);
            else console.log("PASS: crate added only unlocked ingredients.");
        } catch (e) {
            console.error("FAIL: Crate Only Adds Unlocked Ingredients Test crashed:", e);
        } finally {
            game.activeStoreId = backup.activeStoreId;
            try { game.stores = backup.stores ? JSON.parse(backup.stores) : game.stores; } catch (_) {}
            game.level = backup.level;
            game.currentDay = backup.currentDay;
            window.getActiveRecipes = backup.getActiveRecipes;
            window.getStoreFridgeDays = backup.getStoreFridgeDays;
            window.addIngredientBatchToRoot = backup.addIngredientBatchToRoot;
            window.showToast = backup.showToast;
            window.playSfx = backup.playSfx;
            window.tempCoins = backup.tempCoins;
            window.tempInventory = backup.tempInventory;
        }
    }
    ,
    testBusinessMapStoreCardRoutingOnDay1OtherStore: function() {
        console.log("Running Business Map Store Card Routing On Day1 Other Store Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof renderLocationStep1 !== 'function') { console.error("FAIL: renderLocationStep1 missing."); return; }

        const backup = {
            activeStoreId: game.activeStoreId,
            stores: game.stores ? JSON.stringify(game.stores) : null,
            level: game.level,
            getActiveStoreDaysOperated: window.getActiveStoreDaysOperated,
            playSfx: window.playSfx,
            closeLocationSelection: window.closeLocationSelection,
            showStoreSwitchConfirmModal: window.showStoreSwitchConfirmModal
        };

        try {
            game.activeStoreId = 'jp:shibuya';
            game.level = 1;
            if (!game.stores) game.stores = {};
            game.stores['cn:main'] = game.stores['cn:main'] || { level: 5, inventory: { expansion: 0 }, pendingIncome: 0 };
            game.stores['jp:shibuya'] = game.stores['jp:shibuya'] || { level: 1, inventory: { expansion: 0 }, pendingIncome: 0 };

            window.getActiveStoreDaysOperated = () => 0;
            window.playSfx = () => {};

            let closed = 0;
            let switchCalls = [];
            window.closeLocationSelection = () => { closed += 1; };
            window.showStoreSwitchConfirmModal = (sid) => { switchCalls.push(String(sid)); };

            renderLocationStep1();

            const cards = Array.from(document.querySelectorAll('.empire-card'));
            if (cards.length < 2) { console.error("FAIL: expected at least 2 empire cards."); return; }

            const findByTitle = (txt) => cards.find(c => {
                const t = c.querySelector('.empire-title-text');
                return t && (t.textContent || '').includes(txt);
            });

            const jpCard = findByTitle('东京') || findByTitle('东京分店');
            const cnCard = findByTitle('总店');
            if (!jpCard || !cnCard) { console.error("FAIL: could not find jp/cn cards."); return; }

            jpCard.click();
            if (closed === 1 && switchCalls.length === 0) console.log("PASS: clicking current store (jp day1) closes selection.");
            else console.error(`FAIL: clicking current store expected close only (closed=${closed}, switchCalls=${switchCalls.length}).`);

            cnCard.click();
            if (switchCalls.includes('cn:main')) console.log("PASS: clicking other store (cn) triggers store switch confirm.");
            else console.error("FAIL: clicking other store did not trigger switch to cn:main (calls=" + JSON.stringify(switchCalls) + ").");
        } catch (e) {
            console.error("FAIL: Business Map Store Card Routing On Day1 Other Store Test crashed:", e);
        } finally {
            game.activeStoreId = backup.activeStoreId;
            try { game.stores = backup.stores ? JSON.parse(backup.stores) : game.stores; } catch (_) {}
            game.level = backup.level;
            window.getActiveStoreDaysOperated = backup.getActiveStoreDaysOperated;
            window.playSfx = backup.playSfx;
            window.closeLocationSelection = backup.closeLocationSelection;
            window.showStoreSwitchConfirmModal = backup.showStoreSwitchConfirmModal;
            try {
                const oldBar = document.getElementById('map-bottom-bar');
                if (oldBar) oldBar.remove();
            } catch (_) {}
            try {
                const oldMap = document.getElementById('blueprint-map-container');
                if (oldMap) oldMap.remove();
            } catch (_) {}
        }
    }
    ,
    testTutorialStep2BubbleMovesToNextIngredient: function() {
        console.log("Running Tutorial Step2 Bubble Moves To Next Ingredient Test...");
        if (!window.game) { console.error("FAIL: game object not found."); return; }
        if (typeof updateTutorial !== 'function') { console.error("FAIL: updateTutorial missing."); return; }
        if (typeof removeIngredientHighlight !== 'function') { console.error("FAIL: removeIngredientHighlight missing."); return; }
        if (typeof switchScreen !== 'function') { console.error("FAIL: switchScreen missing."); return; }
        if (typeof setTutorialStoredStep !== 'function') { console.error("FAIL: setTutorialStoredStep missing."); return; }

        const backup = {
            activeStoreId: game.activeStoreId,
            stores: game.stores ? JSON.stringify(game.stores) : null,
            tutorialDay1Progress: game.tutorialDay1Progress ? JSON.stringify(game.tutorialDay1Progress) : null,
            isLive: game.isLive,
            isPaused: game.isPaused,
            currentGuidedRecipe: window.currentGuidedRecipe,
            pendingGuidedIngredients: Array.isArray(window.pendingGuidedIngredients) ? window.pendingGuidedIngredients.slice() : null,
            refreshCurrentHighlight: window.refreshCurrentHighlight,
            requestAnimationFrame: window.requestAnimationFrame
        };

        const createdIds = [];
        const ensureEl = (id, parent, tag) => {
            let el = document.getElementById(id);
            if (!el) {
                el = document.createElement(tag || 'div');
                el.id = id;
                (parent || document.body).appendChild(el);
                createdIds.push(id);
            }
            return el;
        };

        const drawer = ensureEl('pantry-drawer', document.body, 'div');
        const grid = ensureEl('ingredient-grid', drawer, 'div');
        const playArea = ensureEl('play-area', document.body, 'div');
        const container = ensureEl('game-container', document.body, 'div');

        const oldDrawerClass = drawer.className;
        const oldGridHTML = grid.innerHTML;
        const oldDrawerDisplay = drawer.style.display;
        const oldPlayDisplay = playArea.style.display;
        const oldContainerRect = container.getBoundingClientRect;

        try {
            game.activeStoreId = 'cn:main';
            if (!game.stores || typeof game.stores !== 'object') game.stores = {};
            if (!game.stores['cn:main'] || typeof game.stores['cn:main'] !== 'object') game.stores['cn:main'] = { level: 1, inventory: {} };
            game.stores['cn:main'].level = 1;
            game.isLive = true;
            game.isPaused = false;

            playArea.style.display = 'grid';
            switchScreen('game-container');

            setTutorialStoredStep('cn:main', 2);
            window.currentGuidedRecipe = 'r1';
            window.pendingGuidedIngredients = ['tomato', 'egg'];

            drawer.className = oldDrawerClass;
            drawer.classList.remove('closed');
            drawer.classList.add('open');
            drawer.style.display = 'block';

            grid.innerHTML = '';

            const egg = document.createElement('div');
            egg.className = 'ingredient-item ing-highlight-active';
            egg.dataset.ingId = 'egg';
            egg.getBoundingClientRect = () => ({ left: 300, top: 300, width: 100, height: 100, right: 400, bottom: 400 });

            const tomato = document.createElement('div');
            tomato.className = 'ingredient-item ing-highlight-active';
            tomato.dataset.ingId = 'tomato';
            tomato.getBoundingClientRect = () => ({ left: 100, top: 100, width: 100, height: 100, right: 200, bottom: 200 });

            grid.appendChild(egg);
            grid.appendChild(tomato);

            container.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1920, height: 1080, right: 1920, bottom: 1080 });

            window.refreshCurrentHighlight = () => {
                document.querySelectorAll('.ingredient-item.ing-highlight-active').forEach(el => el.classList.remove('ing-highlight-active'));
                const ids = Array.isArray(window.pendingGuidedIngredients) ? window.pendingGuidedIngredients : [];
                ids.forEach(id => {
                    const el = grid.querySelector(`.ingredient-item[data-ing-id="${id}"]`);
                    if (el) el.classList.add('ing-highlight-active');
                });
            };

            window.requestAnimationFrame = (cb) => { try { cb(); } catch (_) {} return 1; };

            updateTutorial();

            const bubble1 = document.querySelector('.tutorial-bubble');
            if (!bubble1) { console.error("FAIL: tutorial bubble not created."); return; }

            const pos1 = { left: bubble1.style.left, top: bubble1.style.top };
            if (pos1.left === '150px' && pos1.top === '215px') console.log("PASS: step2 bubble targets first pending ingredient (tomato), not DOM-first ingredient.");
            else console.error(`FAIL: expected tomato bubble left=150px top=215px, got left=${pos1.left} top=${pos1.top}.`);

            removeIngredientHighlight('tomato');

            const bubble2 = document.querySelector('.tutorial-bubble');
            if (!bubble2) { console.error("FAIL: tutorial bubble missing after remove."); return; }
            const pos2 = { left: bubble2.style.left, top: bubble2.style.top };
            if (pos2.left === '350px' && pos2.top === '415px') console.log("PASS: bubble moves to next ingredient (egg) immediately after clicking tomato.");
            else console.error(`FAIL: expected egg bubble left=350px top=415px, got left=${pos2.left} top=${pos2.top}.`);
        } catch (e) {
            console.error("FAIL: Tutorial Step2 Bubble Moves To Next Ingredient Test crashed:", e);
        } finally {
            game.activeStoreId = backup.activeStoreId;
            try { game.stores = backup.stores ? JSON.parse(backup.stores) : game.stores; } catch (_) {}
            try { game.tutorialDay1Progress = backup.tutorialDay1Progress ? JSON.parse(backup.tutorialDay1Progress) : game.tutorialDay1Progress; } catch (_) {}
            game.isLive = backup.isLive;
            game.isPaused = backup.isPaused;
            window.currentGuidedRecipe = backup.currentGuidedRecipe;
            if (backup.pendingGuidedIngredients) window.pendingGuidedIngredients = backup.pendingGuidedIngredients.slice();
            window.refreshCurrentHighlight = backup.refreshCurrentHighlight;
            window.requestAnimationFrame = backup.requestAnimationFrame;

            drawer.className = oldDrawerClass;
            grid.innerHTML = oldGridHTML;
            drawer.style.display = oldDrawerDisplay;
            playArea.style.display = oldPlayDisplay;

            try {
                if (oldContainerRect) container.getBoundingClientRect = oldContainerRect;
                else delete container.getBoundingClientRect;
            } catch (_) {}

            try { document.querySelectorAll('.tutorial-bubble').forEach(el => el.remove()); } catch (_) {}

            try {
                createdIds.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.remove();
                });
            } catch (_) {}
        }
        console.log("Tutorial Step2 Bubble Moves To Next Ingredient Test Completed.");
    }
};
