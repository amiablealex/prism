# Prism Wars v4.6 - Implementation Guide

## 📦 Files to Update

### 1. game_logic.py (Complete replacement provided)
- Board size changed to 16
- Center objective cells updated to (7,7), (8,7), (7,8), (8,8)
- Fixed mirror chain detection (follows actual light paths)
- Quadrant detection updated for 16×16

### 2. game.js (Critical updates needed)

**Add these functions/modifications:**

```javascript
// UPDATE: Consolidated scoreboard display
function updateUI() {
    if (!gameState) return;
    
    // ... existing code ...
    
    // Replace scores + players update with consolidated scoreboard
    const scoresList = document.getElementById('scoresList');
    scoresList.innerHTML = '';
    
    gameState.scores.forEach((score, idx) => {
        const scoreItem = document.createElement('div');
        scoreItem.className = 'scoreboard-item';
        
        if (idx === gameState.current_player) {
            scoreItem.classList.add('current-player');
        }
        
        const isDisconnected = gameState.disconnected_players?.includes(idx);
        if (isDisconnected) {
            scoreItem.classList.add('disconnected');
        }
        
        const player = gameState.players[idx];
        const missedTurns = gameState.missed_turns?.[idx] || 0;
        const breakdown = score.breakdown;
        const progressPercent = Math.min(100, (score.score / gameState.win_points) * 100);
        
        let statusText = '';
        if (player.id === playerId) statusText = '(You)';
        if (idx === gameState.current_player) statusText += ' [Active]';
        if (isDisconnected) statusText = '[REMOVED]';
        else if (missedTurns > 0) statusText += ` [${missedTurns}/3]`;
        
        scoreItem.innerHTML = `
            <div class="scoreboard-left">
                <div class="scoreboard-color" style="background-color: ${score.color}"></div>
                <div class="scoreboard-info">
                    <div class="scoreboard-name">
                        ${score.player}
                        ${statusText ? `<span class="scoreboard-status">${statusText}</span>` : ''}
                    </div>
                    <div class="scoreboard-breakdown">
                        T:${breakdown.base_territory} | C:${breakdown.combos.total} | O:${breakdown.objectives.total}
                    </div>
                    <div class="scoreboard-progress">
                        <div class="scoreboard-progress-fill" style="width: ${progressPercent}%; background-color: ${score.color}"></div>
                    </div>
                </div>
            </div>
            <div class="scoreboard-right">
                <span class="scoreboard-score">${score.score}</span>
                <span class="scoreboard-target">/${gameState.win_points}</span>
            </div>
        `;
        
        scoresList.appendChild(scoreItem);
    });
    
    // Continue with inventory and other updates...
}

// UPDATE: Combo display to show potential points
function updateCombosDisplay() {
    const combosDiv = document.getElementById('combosDisplay');
    if (!combosDiv || myPlayerIndex === -1) return;
    
    const myScore = gameState.scores[myPlayerIndex];
    const combos = myScore.breakdown.combos;
    
    combosDiv.innerHTML = '<h4>Combo Bonuses</h4>';
    
    // Mirror Chain - show potential or actual
    const mirrorCombo = document.createElement('div');
    mirrorCombo.className = 'combo-item' + (combos.perfect_reflection > 0 ? ' active' : '');
    const mirrorPoints = combos.perfect_reflection > 0 ? `+${combos.perfect_reflection}` : '+5';
    const mirrorClass = combos.perfect_reflection > 0 ? '' : ' potential';
    
    mirrorCombo.innerHTML = `
        <div class="combo-header">
            <span class="combo-icon">${combos.perfect_reflection > 0 ? '✓' : '○'}</span>
            <span class="combo-name">Perfect Reflection</span>
            <span class="combo-points${mirrorClass}">${mirrorPoints}</span>
        </div>
        <div class="combo-description">Chain 3+ mirrors in a light beam</div>
    `;
    combosDiv.appendChild(mirrorCombo);
    
    // Prism Cascade - show potential or actual
    const prismCombo = document.createElement('div');
    prismCombo.className = 'combo-item' + (combos.prism_cascade > 0 ? ' active' : '');
    const prismPoints = combos.prism_cascade > 0 ? `+${combos.prism_cascade}` : '+3';
    const prismClass = combos.prism_cascade > 0 ? '' : ' potential';
    
    prismCombo.innerHTML = `
        <div class="combo-header">
            <span class="combo-icon">${combos.prism_cascade > 0 ? '✓' : '○'}</span>
            <span class="combo-name">Prism Cascade</span>
            <span class="combo-points${prismClass}">${prismPoints}</span>
        </div>
        <div class="combo-description">Prism/splitter controlling 10+ nearby cells</div>
    `;
    combosDiv.appendChild(prismCombo);
    
    // Details if any combos active
    if (combos.details && combos.details.length > 0) {
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'combo-details';
        detailsDiv.innerHTML = combos.details.map(d => `<div class="combo-detail">• ${d}</div>`).join('');
        combosDiv.appendChild(detailsDiv);
    }
}

// ADD: Draw center zone indicator
function drawCenterZone() {
    if (!gameState) return;
    
    // For 16×16 board, center is (7,7), (8,7), (7,8), (8,8)
    const centerX = 7;
    const centerY = 7;
    const centerSize = 2;
    
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]);
    
    ctx.strokeRect(
        boardOffsetX + centerX * cellSize,
        boardOffsetY + centerY * cellSize,
        centerSize * cellSize,
        centerSize * cellSize
    );
    
    ctx.setLineDash([]);
}

// UPDATE: renderBoard() function
// Add this line after drawing the grid, before drawLightSources():
// drawCenterZone();
```

**In renderBoard() function, find the grid drawing section and add center zone:**

```javascript
function renderBoard() {
    // ... existing grid drawing code ...
    
    // Draw grid
    ctx.strokeStyle = '#2a2a4e';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= boardSize; i++) {
        // ... grid lines ...
    }
    
    // ADD THIS:
    drawCenterZone();
    
    // Then continue with:
    drawLightSources();
    drawPieces();
    // ... rest of rendering ...
}
```

### 3. game.css (Add new styles)

**Add to existing game.css:**

```css
/* Consolidated Scoreboard */
.scoreboard-panel {
    background: var(--card-bg);
    border: 2px solid var(--border-color);
    border-radius: 10px;
    padding: 12px;
}

.scoreboard-panel h3 {
    margin-bottom: 10px;
    color: var(--secondary-color);
    font-size: 1rem;
}

.scoreboard-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px;
    margin-bottom: 10px;
    background: var(--dark-bg);
    border: 2px solid var(--border-color);
    border-radius: 8px;
    transition: all 0.3s ease;
}

.scoreboard-item.current-player {
    border-color: var(--accent-color);
    background: rgba(255, 217, 61, 0.1);
}

.scoreboard-item.disconnected {
    opacity: 0.5;
}

.scoreboard-left {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
}

.scoreboard-color {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2px solid white;
    flex-shrink: 0;
}

.scoreboard-info {
    flex: 1;
    min-width: 0;
}

.scoreboard-name {
    font-weight: 600;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 3px;
}

.scoreboard-status {
    font-size: 0.7rem;
    color: var(--text-dim);
}

.scoreboard-breakdown {
    font-size: 0.7rem;
    color: var(--text-dim);
    margin: 3px 0;
}

.scoreboard-progress {
    width: 100%;
    height: 4px;
    background: var(--border-color);
    border-radius: 2px;
    overflow: hidden;
    margin-top: 4px;
}

.scoreboard-progress-fill {
    height: 100%;
    transition: width 0.5s ease;
    border-radius: 2px;
}

.scoreboard-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex-shrink: 0;
    margin-left: 8px;
}

.scoreboard-score {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--accent-color);
    line-height: 1;
}

.scoreboard-target {
    font-size: 0.75rem;
    color: var(--text-dim);
}

/* Combo potential points styling */
.combo-points.potential {
    color: var(--text-dim);
    opacity: 0.7;
}

.combo-item.active .combo-points {
    color: var(--accent-color);
    opacity: 1;
}
```

### 4. game.html (Complete replacement provided)

---

## 🚀 Quick Deploy

```bash
cd ~/prism-wars
cp -r . ../prism-wars-v45-backup

# Replace files:
# 1. game_logic.py (complete replacement)
# 2. static/js/game.js (modify as shown above)
# 3. static/css/game.css (add new styles)
# 4. templates/game.html (complete replacement)

sudo systemctl restart prismwars
```

---

## ✅ Verification Steps

1. **Start new game** → Board should be 16×16
2. **Look at center** → Gold dashed border around 2×2
3. **Check left sidebar** → Single "Scoreboard" panel
4. **Objectives/Combos** → Both on left sidebar
5. **Place 3 mirrors** in light beam → Combo triggers
6. **Combo display** → Shows "+5" or "+3" when not achieved
7. **Control center** → Objective achievable

---

## 🐛 Troubleshooting

**Board still 15×15:**
- Check game_logic.py has `self.board_size = 16`
- Start NEW game (old games keep old size)

**No center zone indicator:**
- Verify `drawCenterZone()` function added to game.js
- Check it's called in `renderBoard()` after grid
- Clear browser cache (Ctrl+Shift+R)

**Scoreboard not consolidated:**
- Check game.html has `scoreboard-panel` (not scores-panel + players-panel)
- Verify game.js updateUI() uses new scoreboard code
- Check CSS has `.scoreboard-item` styles

**Mirror combo not working:**
- Ensure game_logic.py has new `_find_mirror_chains_in_light_paths()` function
- Place mirrors IN THE LIGHT BEAM PATH (not just adjacent)
- Check they're YOUR mirrors, same player

**Combos show +0:**
- Verify game.js updateCombosDisplay() shows potential points
- Check CSS has `.combo-points.potential` style
- Clear cache and refresh

---

## 🎯 Key Changes Summary

1. **16×16 board** - Perfect center
2. **Consolidated scoreboard** - One panel, all info
3. **Relocated objectives/combos** - Left sidebar
4. **Fixed combos** - Show potential, detect properly
5. **Center indicator** - Visual guide

---

**Deploy v4.6 for the final polished experience!** 🎮✨