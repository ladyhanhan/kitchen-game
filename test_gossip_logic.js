
const fs = require('fs');

// Mock browser environment
global.window = {};
global.document = {
    createElement: () => ({ style: {}, appendChild: () => {} }),
    getElementById: () => ({ appendChild: () => {} })
};
global.localStorage = {
    getItem: () => null,
    setItem: () => {}
};
global.playSfx = () => {};
global.switchScreen = () => {};

// Load index.html content
const htmlContent = fs.readFileSync('/Users/hannahma/Downloads/my-kitchen-game/index.html', 'utf8');

// Extract JS parts
// Ideally I should extract MARKET_GOSSIP_CONFIG and generateDailyGossip
// But since they are in a script tag in HTML, it's messy to run directly in Node without a proper parser or manual extraction.
// So I will just copy the relevant parts I just modified and the config into this test file to verify logic correctness.

const MARKET_GOSSIP_CONFIG = { 
    // --- 🍖 肉类爆发 (暗示顾客想吃肉/高热量) --- 
    meat: { 
        rush: [ 
            { 
                speakers: ["健身教练", "学员"], 
                lines: ["1", "2", "3", "4"] 
            }
        ] 
    }, 
    // --- 🥬 蔬菜爆发 (暗示顾客想吃素/清淡/解腻) --- 
    vege: { 
        rush: [ 
            { 
                speakers: ["扇扇子的阿姨", "邻居"], 
                lines: ["1", "2", "3", "4"] 
            } 
        ] 
    }, 
    // --- 🦐 海鲜爆发 (暗示顾客想吃鱼虾/脑力/尝鲜) --- 
    seafood: { 
        rush: [ 
            { 
                speakers: ["紧张的妈妈", "淡定的爸爸"], 
                lines: ["1", "2", "3", "4"] 
            } 
        ] 
    }, 
    // --- 🌶️ 口味/调料暗示 (暗示重口味/辣味需求) --- 
    spicy: { 
        rush: [ 
            { 
                speakers: ["湿漉漉的路人", "杂货店老板"], 
                lines: ["1", "2", "3", "4"] 
            } 
        ] 
    }, 
    // --- 😐 平稳/无明显倾向 (General - 正常营业) --- 
    general: { 
        normal: [ 
            { 
                speakers: ["下棋大爷A", "下棋大爷B"], 
                lines: ["1", "2", "3", "4"] 
            } 
        ] 
    } 
};

global.game = {};

function generateDailyGossip() { 
    if (!MARKET_GOSSIP_CONFIG) return; 
    // 1. 简单模拟今日趋势 (实际项目中应读取 game.marketTrend) 
    // 随机决定今天的八卦主题：20% 蔬菜，20% 肉，20% 海鲜，20% 辛辣，20% 闲聊 
    const rand = Math.random(); 
    let category = 'general'; 
    let direction = 'normal'; 
    
    if (rand < 0.2) category = 'vege'; 
    else if (rand < 0.4) category = 'meat'; 
    else if (rand < 0.6) category = 'seafood'; 
    else if (rand < 0.8) category = 'spicy';
    else category = 'general'; 
    
    // 2. 如果不是闲聊，使用 'rush' (热销/需求爆发)
    if (category !== 'general') { 
        direction = 'rush'; 
        // 记录到全局变量，以便稍后在商店里真的调整价格 (可选) 
        // game.todayTrend = { category, direction }; 
    } 
    
    // 3. 从配置中抽取 
    const configGroup = MARKET_GOSSIP_CONFIG[category]; 
    // 容错：如果找不到对应方向，回退到 normal 或 rush
    const list = configGroup[direction] || configGroup['normal'] || configGroup['rush']; 
    
    if (!list || list.length === 0) { // 终极容错 
        game.dailyGossip = { speakers: ["系统"], lines: ["今日集市风平浪静。"], currentLineIndex: 0 }; 
        return; 
    } 
    
    // [核心] 随机抽取一条 
    const dialogueObj = list[Math.floor(Math.random() * list.length)]; 
    // 4. 存入状态 
    game.dailyGossip = { 
        category: category,      // 记录类型 (供后续逻辑使用) 
        direction: direction,    // 记录趋势 (rush / normal)
        speakers: dialogueObj.speakers, 
        lines: dialogueObj.lines, 
        currentLineIndex: 0 
    }; 
    // console.log(`今日集市情报生成: [${category} / ${direction}]`, dialogueObj.lines[0]); 
}

// Run test
console.log("Starting test...");
const stats = { meat: 0, vege: 0, seafood: 0, spicy: 0, general: 0 };
const iterations = 1000;

for (let i = 0; i < iterations; i++) {
    generateDailyGossip();
    const g = game.dailyGossip;
    if (g && g.category) {
        stats[g.category]++;
        if (g.category !== 'general' && g.direction !== 'rush') {
            console.error(`Error: Category ${g.category} should have direction 'rush', got ${g.direction}`);
        }
        if (g.category === 'general' && g.direction !== 'normal') {
            console.error(`Error: Category general should have direction 'normal', got ${g.direction}`);
        }
    } else {
        console.error("Error: Gossip generation failed");
    }
}

console.log("Stats:", stats);
console.log("Test finished.");
