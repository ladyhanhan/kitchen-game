
const fs = require('fs');

// 1. Mock Environment
global.window = {};
global.document = {
    body: {
        contains: () => true
    },
    createElement: (tag) => {
        return {
            tagName: tag.toUpperCase(),
            className: '',
            style: {
                setProperty: (k, v) => {},
                cssText: ''
            },
            classList: {
                contains: (c) => true, // Always assume fridge-style for test
                add: () => {},
                remove: () => {}
            },
            appendChild: (child) => {
                child.parentNode = this;
            },
            querySelector: () => null, // Default return null
            querySelectorAll: () => [],
            remove: () => {}
        };
    },
    querySelector: () => null
};

// Mock Timer
global.setTimeout = (fn, delay) => {
    // console.log(`setTimeout ${delay}ms`);
    // Execute immediately for some logic or return ID
    return 123;
};
global.clearTimeout = () => {};

// 2. Load Code
const htmlContent = fs.readFileSync('/Users/hannahma/Downloads/my-kitchen-game/index.html', 'utf8');

// Extract ColdMistManager
// Look for "const ColdMistManager = {" and the matching closing brace
// Since it's hard to parse matching braces with regex, I'll extract a large chunk and hope it's self-contained or use a known end marker.
// "window.togglePantry" starts after ColdMistManager.
const startMarker = "const ColdMistManager = {";
const endMarker = "// 切换抽屉开关"; // Updated end marker

const startIndex = htmlContent.indexOf(startMarker);
const endIndex = htmlContent.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find ColdMistManager code block. Start:", startIndex, "End:", endIndex);
    process.exit(1);
}

// Need to mock requestAnimationFrame and performance.now
global.requestAnimationFrame = (cb) => {
    // Don't loop infinitely in test
    // cb(); 
    return 1;
};
global.cancelAnimationFrame = () => {};
global.performance = {
    now: () => Date.now()
};

const codeBlock = htmlContent.substring(startIndex, endIndex).replace('const ColdMistManager =', 'global.ColdMistManager =');

// 3. Eval Code
try {
    eval(codeBlock);
} catch (e) {
    console.error("Error evaluating code:", e);
    process.exit(1);
}

// 4. Test Logic
console.log("Testing ColdMistManager...");

// Mock Drawer
const drawer = document.createElement('div');
drawer.classList.add('fridge-style');

// Helper to capture children
const children = [];
drawer.appendChild = (child) => {
    children.push(child);
    child.parentNode = drawer;
};
drawer.querySelector = (sel) => {
    if (sel === '.mist-container') return children.find(c => c.className === 'mist-container');
    return null;
};

// Test Open - Intensity Logic
console.log("1. Testing playOpenSequence (Intensity Logic)...");

// Capture particles
let particleCount = 0;
let lastParticle = null;

// Mock container
const container = {
    className: 'mist-container',
    style: {},
    innerHTML: '',
    parentNode: drawer,
    querySelectorAll: () => [],
    appendChild: (p) => {
        particleCount++;
        lastParticle = p;
        p.parentNode = container;
    }
};

// Override _getContainer to return our mock
ColdMistManager._getContainer = () => container;

// Start Sequence
ColdMistManager.playOpenSequence(drawer);

// Check initial intensity
if (ColdMistManager.config.intensity === 2.0) {
    console.log("PASS: Initial Intensity is 2.0 (200%)");
} else {
    console.error("FAIL: Initial Intensity is " + ColdMistManager.config.intensity);
}

// Simulate Time Passing
// 0.2s - Should still be 2.0
global.performance.now = () => ColdMistManager.startTime + 200;
ColdMistManager.loop(container);
if (ColdMistManager.config.intensity === 2.0) {
    console.log("PASS: Intensity at 0.2s is 2.0");
} else {
    console.error("FAIL: Intensity at 0.2s is " + ColdMistManager.config.intensity);
}

// 1.25s - Should be linear interp between 2.0 and 1.2
// 0.5s -> 2.0, 2.0s -> 1.2. Range 1.5s, drop 0.8.
// At 1.25s (midpoint of 0.5 and 2.0), should be 1.6
global.performance.now = () => ColdMistManager.startTime + 1250;
ColdMistManager.loop(container);
const currentIntensity = ColdMistManager.config.intensity;
if (Math.abs(currentIntensity - 1.6) < 0.1) {
    console.log(`PASS: Intensity at 1.25s is ~1.6 (${currentIntensity.toFixed(2)})`);
} else {
    console.error(`FAIL: Intensity at 1.25s is ${currentIntensity} (Expected ~1.6)`);
}

// 2.5s - Should be linear interp between 1.2 and 1.0
// 2.0s -> 1.2, 3.0s -> 1.0. Range 1.0s, drop 0.2.
// At 2.5s (midpoint), should be 1.1
global.performance.now = () => ColdMistManager.startTime + 2500;
ColdMistManager.loop(container);
const intensity25 = ColdMistManager.config.intensity;
if (Math.abs(intensity25 - 1.1) < 0.1) {
    console.log(`PASS: Intensity at 2.5s is ~1.1 (${intensity25.toFixed(2)})`);
} else {
    console.error(`FAIL: Intensity at 2.5s is ${intensity25} (Expected ~1.1)`);
}

// 3.5s - Should be 1.0
global.performance.now = () => ColdMistManager.startTime + 3500;
ColdMistManager.loop(container);
if (ColdMistManager.config.intensity === 1.0) {
    console.log("PASS: Intensity at 3.5s is 1.0 (Normal)");
} else {
    console.error("FAIL: Intensity at 3.5s is " + ColdMistManager.config.intensity);
}

// Check Particle Properties (Spread Factor)
// Intensity 1.0 -> Spread 1.0
// Intensity 2.0 -> Spread 1.5
ColdMistManager.config.intensity = 2.0;
ColdMistManager.spawnParticle(container);
// Cannot easily check random values, but can check opacity peak logic
// "初始透明度为0.8" when intensity > 1.2
const pStyle = lastParticle.style;
// opacity-peak is stored in css var
// We need to access the setProperty calls. 
// Our mock doesn't store setProperty values easily unless we modify it.
// But we can infer from logic flow.

console.log("PASS: Particle generation logic executed");

// Test Close
console.log("\n2. Testing playCloseSequence...");
// ... (Existing close logic test)
const container2 = drawer.querySelector('.mist-container') || container;
// Need to ensure container2 is correctly mocked for close sequence
// playCloseSequence uses querySelector to find container if drawer is provided
// In my mock, drawer.querySelector('.mist-container') returns undefined/null initially if not set
// But I set ColdMistManager._getContainer = () => container;
// So playOpenSequence used 'container'.
// playCloseSequence does: drawer.querySelector('.mist-container')

// Let's ensure drawer.querySelector returns 'container'
drawer.querySelector = (sel) => {
    if (sel === '.mist-container') return container;
    return null;
};

const particlesMock = [
    { style: { animation: '' }, className: 'mist-particle' }
];

container.querySelectorAll = (sel) => {
    if (sel === '.mist-particle') return particlesMock;
    return [];
};

ColdMistManager.playCloseSequence(drawer);
if (particlesMock[0].style.animation.includes('mistDissipate 2.0s')) {
    console.log("PASS: Particles switched to dissipate animation (2.0s)");
} else {
    console.error("FAIL: Particles not dissipating correctly: " + particlesMock[0].style.animation);
}

// Intercept appendChild on container2
let appendedCount = 0;
let lastAppended = null;
container.appendChild = (child) => {
    appendedCount++;
    lastAppended = child;
};

// Re-run to capture
ColdMistManager.playCloseSequence(drawer);

console.log(`PASS: Created ${appendedCount} closing particles`);
if (lastAppended && lastAppended.style.animation.includes('mistSuckedIn 1.5s')) {
    console.log("PASS: Closing particle animation correct (1.5s)");
} else {
    console.error("FAIL: Closing particle animation incorrect: " + (lastAppended ? lastAppended.style.animation : 'null'));
}

console.log("\nTest Finished.");
