# UI Specification: Floating Text System (Optimized)

## 1. Overview
This document outlines the unified UI specifications for the floating text feedback system, specifically focusing on "Order Revenue" (Customer Served) and "Customer Leaving" (Order Failed) events. The goal is to ensure visual consistency and a cohesive user experience across these critical game events.

## 2. Unified Parameters Comparison

| Parameter | Previous State (Standard Feedback) | **Optimized State (Unified)** |
| :--- | :--- | :--- |
| **Trigger Event** | Order Completion / Failure | **Order Completion (Revenue) & Customer Leaving (Penalty)** |
| **Position (Origin)** | `rect.top - 20px` (Above element) | **`rect.bottom + 5px` (Below element)** |
| **Animation Duration** | `2000ms` | **`3500ms`** |
| **Animation Effect** | Standard Fade Up (~50px) | **`floatUpEarnings` (Hold Opacity 80%, TranslateY -150px)** |
| **Font Size** | Default (~16px) | **`24px` (Bold)** |
| **Text Shadow** | None / Default | **`0 2px 0 #fff`** |
| **Z-Index** | Default | **`15` (Behind Ticket)** |
| **Iconography** | Text Only | **Dynamic Coin Icons (32px)** |

## 3. Implementation Details

### 3.1 CSS Class: `.float-text-earnings`
```css
.float-text-earnings {
    position: fixed;
    font-weight: bold;
    font-size: 24px;
    pointer-events: none;
    animation: floatUpEarnings 3.5s forwards;
    z-index: 15;
    text-shadow: 0 2px 0 #fff;
    text-align: center;
    color: #f1c40f; /* Default color, overridden by JS */
    display: flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
}
```

### 3.2 Keyframe Animation: `floatUpEarnings`
```css
@keyframes floatUpEarnings {
    0% { transform: translateY(0); opacity: 1; }
    80% { transform: translateY(-120px); opacity: 1; }
    100% { transform: translateY(-150px); opacity: 0; }
}
```

### 3.3 JavaScript Trigger Logic
The `triggerFeedback` function is used with the following standardized parameters:

```javascript
// Revenue (Order Completed)
triggerFeedback(
    rect.left + rect.width / 2,  // Center X
    rect.bottom + 5,             // Below element Y
    label,                       // HTML Content with Icon
    color,                       // Dynamic Color
    'float-text-earnings',       // Unified Class
    3500                         // Unified Duration
);

// Customer Leaving (Order Failed)
triggerFeedback(
    rect.left + rect.width / 2,  // Center X
    rect.bottom + 5,             // Below element Y
    `顾客离开 <img ...> -¥${penalty}`, // HTML Content with Icon
    "#e74c3c",                   // Red Color
    'float-text-earnings',       // Unified Class
    3500                         // Unified Duration
);
```

### 3.4 Icon Assets
- **High Value (>= ¥100)**: `assets/icons/icon_多硬币.png`
- **Low Value (< ¥100) / Penalty**: `assets/icons/icon_少硬币.png`
- **CSS Class**: `.revenue-icon` (Height: 32px, Vertical Align: text-bottom, Drop Shadow)

## 4. Cross-Device Testing Notes
- **Positioning**: Uses `getBoundingClientRect()` to ensure correct placement relative to the order card regardless of screen size or resolution.
- **Responsiveness**: The fixed positioning combined with viewport-relative coordinates ensures the text appears attached to the UI element even if the layout shifts slightly on different devices.
- **Icon Scaling**: Icons are sized via CSS (`height: 32px`) to provide clear visual feedback, ensuring consistent alignment across resolutions.

## 5. Home Header Components (Wallet Baseline)
This project uses the **wallet button** as the baseline for the home header component style. The player title badge is normalized to the same visual system to avoid divergent UI patterns.

### 5.1 Component: `.icon-btn` (Baseline)
- **Layout**: Vertical stack, icon above label/value
- **Icon**: `55px × 55px`, `object-fit: contain`, drop-shadow
- **Text**: `14px`, `600`, white with text-shadow
- **States**:
  - `:hover` on icon: translateY + scale, brighten shadow
  - `:active` on icon: pressed scale

### 5.2 Component: Player Title Badge (Normalized)
- **Markup**: `#player-title-badge` uses `class="icon-btn title-badge"`
- **Positioning**: `title-badge` only provides top-left absolute positioning (no custom background/border)
- **Icon Asset**: `assets/icons/icon_头衔.png` (same sizing rules as wallet icon via `.icon-btn img`)
- **Disabled**: `aria-disabled="true"` reduces opacity and disables pointer events
