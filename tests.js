
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
    }
};
