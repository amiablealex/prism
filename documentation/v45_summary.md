# Prism Wars v4.5 - Changes Summary

## 🎯 What Changed in v4.5

### ⚡ Core Gameplay Changes

**1. One Placement Per Turn**
- **Before:** Could place multiple pieces per turn (limited by energy)
- **After:** Placing ANY piece immediately ends your turn
- **Impact:** More strategic, forces planning ahead
- **Note:** Picking up pieces does NOT end turn

**2. Accumulating Energy System**
- **Before:** Reset to 10 energy every turn
- **After:** Gain +2 energy per turn (accumulating)
- **Start:** Begin with 4 energy
- **Strategy:** Pass turns to save up for expensive pieces
- **Max:** No maximum (can save indefinitely)

**3. Blocker Exclusion Zones**
- **Before:** Blockers can't be placed within 2 cells of light sources
- **After:** Blockers can't be placed within 3 cells of light sources
- **Impact:** Prevents completely snuffing out light sources
- **Visual:** Red zones show when blocker selected

**4. Amplifier Multiplier**
- **Before:** Gold squares worth 2x points
- **After:** Gold squares worth 3x points
- **Display:** Shows "3x" instead of "2x"
- **Terminology:** Now called "Amplifiers" everywhere

### 🎨 UI/UX Improvements

**5. Combo Breakdown Display**
- **New Panel:** "Combo Bonuses" section added
- **Shows:** Perfect Reflection and Prism Cascade
- **Live:** Updates with ✓/○ indicators like objectives
- **Detail:** Shows specific combo achievements

**6. Actions Panel First**
- **Before:** Actions at bottom of right sidebar
- **After:** Actions appear FIRST (above inventory)
- **Reason:** Most frequently used controls

**7. Compact Design**
- **Padding:** Reduced from 20px → 12px in panels
- **Margins:** Reduced from 15px → 8-10px
- **Font sizes:** Slightly smaller (0.85-0.9rem)
- **Sidebar width:** 280px → 240px
- **Header height:** 80px → 60px
- **Goal:** Minimize scrolling on laptop screens

**8. Simplified Homepage**
- **Before:** 12 large rule cards
- **After:** 8 condensed rule cards
- **Content:** More concise descriptions
- **Focus:** Key information only

### 📝 Terminology Updates

- "Gold squares" → "Amplifiers"
- "2x points" → "3x points"
- Energy display shows "+2 per turn" (not reset info)

---

## 📦 Files Changed

### Must Replace (6 files):
1. ✅ **game_logic.py** - One placement per turn, accumulating energy, 3-cell blocker zones, 3x amplifiers
2. ✅ **static/js/game.js** - Combo display, cleaner piece info
3. ✅ **static/css/game.css** - Compact design, combo styles, reordered panels
4. ✅ **templates/game.html** - Combo panel, reordered actions, energy gain display
5. ✅ **templates/index.html** - Simplified, condensed rules
6. ❌ **app.py** - NO CHANGES from v4.0

### No Changes:
- lobby_manager.py (same as v4.0)
- templates/lobby.html (same as v4.0)
- static/css/main.css (same as v4.0)

---

## 🎮 Gameplay Impact

### Energy Management

**v4.0 Strategy:**
```
Turn 1: 10 energy → place 5 mirrors (2 each)
Turn 2: 10 energy → place 5 mirrors
Turn 3: 10 energy → place 2 blockers + 2 mirrors
```

**v4.5 Strategy:**
```
Turn 1: 4 energy → place 2 mirrors (turn ends)
Turn 2: 6 energy → place 1 splitter (turn ends)
Turn 3: 8 energy → PASS to save up
Turn 4: 10 energy → place prism! (turn ends)
```

### Tactical Depth

**Immediate Effects:**
- Can't spam pieces anymore
- Must choose wisely each turn
- Passing becomes strategic (save energy)
- Pickup is more valuable (doesn't end turn!)

**Turn Example:**
```
Energy: 7
Options:
1. Place mirror (2 energy) → turn ends, left with 5
2. Place blocker (3 energy) → turn ends, left with 4  
3. Pick up + place mirror → costs 3 total, turn ends
4. PASS → gain 2 more energy next turn (total 9)
```

### Blocker Changes

**v4.0:**
```
Light source at (3,0)
Protected: (3,0), (3,1)
Can place blocker at: (3,2) ← immediately blocks!
```

**v4.5:**
```
Light source at (3,0)
Blocker exclusion: (3,0), (3,1), (3,2)
Must place blocker at: (3,3) or further
```

---

## ⚖️ Balance Changes Summary

| Change | v4.0 → v4.5 | Impact |
|--------|-------------|--------|
| **Placement** | Multiple per turn → **One per turn** | Slower, more strategic |
| **Energy** | Reset to 10 → **Gain +2 per turn** | Accumulating, save up |
| **Start Energy** | 10 → **4** | Can't place prism turn 1 |
| **Blocker Zone** | 2 cells → **3 cells** | Harder to snuff sources |
| **Amplifier** | 2x → **3x** | More valuable |
| **Pickup** | Ends turn → **Doesn't end turn** | More useful |

---

## 🔧 Quick Install

```bash
cd ~/prism-wars
cp -r . ../prism-wars-v4-backup  # Backup

# Replace 5 files:
# - game_logic.py
# - static/js/game.js
# - static/css/game.css
# - templates/game.html
# - templates/index.html

sudo systemctl restart prismwars
```

---

## ✅ Quick Test

Start a NEW game and verify:

**One Placement Per Turn:**
- [ ] Place a mirror → Turn immediately ends
- [ ] Energy doesn't reset to 10

**Accumulating Energy:**
- [ ] Turn 1: Have 4 energy
- [ ] Place mirror (costs 2) → Left with 2
- [ ] Turn 2: Have 4 energy (2 + 2 gained)
- [ ] Pass turn → Turn 3: Have 6 energy

**Blocker Zones:**
- [ ] Select blocker → See red zones (3 cells deep)
- [ ] Can't place in red zones
- [ ] Other pieces only have 2-cell pink zones

**Amplifiers:**
- [ ] Gold tiles show "3x" (not "2x")
- [ ] Scoring counts 3 points per amplifier tile

**Combo Display:**
- [ ] See "Combo Bonuses" panel
- [ ] Shows Perfect Reflection (○ or ✓)
- [ ] Shows Prism Cascade (○ or ✓)
- [ ] Points update live

**UI Improvements:**
- [ ] Actions panel appears FIRST (above inventory)
- [ ] Less scrolling needed
- [ ] Panels feel more compact
- [ ] Homepage is simpler

**Pickup Behavior:**
- [ ] Pick up a piece → Turn does NOT end
- [ ] Can pick up + place in same turn

---

## 💡 Strategy Tips

### Energy Management
```
Early Game (Rounds 1-3):
- Place cheap pieces (mirrors)
- Save energy when possible

Mid Game (Rounds 4-8):
- Pass turns to save for prism
- Use splitters tactically

Late Game (Rounds 9+):
- Pick up misplaced pieces
- Reposition for objectives
```

### One Placement Rule
```
Think ahead:
❌ "I'll place 3 mirrors this turn"
✓ "Which ONE piece is most impactful?"

Use pickup:
✓ Pick up mirror (1 energy, doesn't end turn)
✓ Place it elsewhere (2 energy, ends turn)
Total: 3 energy to relocate
```

### Blocker Strategy
```
v4.0: Block light sources directly
v4.5: Block at distance, use multiple blockers
```

---

## 📊 Expected Results

### Game Length
- **v4.0:** 10-15 minutes
- **v4.5:** 12-18 minutes (slower, more deliberate)

### Strategic Depth
- **v4.0:** Energy management, visual chaos control
- **v4.5:** + Turn planning, passing strategy, pickup tactics

### Learning Curve
- **v4.0:** Moderate (many systems)
- **v4.5:** Slightly easier (simpler UI, clearer constraints)

---

## 🎯 Key Improvements

### Problem → Solution

**Problem:** Could spam multiple pieces per turn  
**Solution:** One placement per turn (more strategic)

**Problem:** Energy reset encouraged spam  
**Solution:** Accumulating energy (plan ahead)

**Problem:** Light sources too easy to block  
**Solution:** 3-cell blocker exclusion (fairer)

**Problem:** No visual combo breakdown  
**Solution:** Dedicated combo panel with live updates

**Problem:** Too much scrolling  
**Solution:** Compact design (-20% padding/margins)

**Problem:** Actions buried at bottom  
**Solution:** Moved to top of sidebar (easier access)

**Problem:** Amplifiers not valuable enough  
**Solution:** 2x → 3x multiplier (fight for them!)

**Problem:** Homepage overwhelming  
**Solution:** Condensed from 12 → 8 cards, simpler text

---

## 🐛 Common Questions

**Q: Why does my turn end after placing ONE piece?**  
A: This is intentional in v4.5. Forces strategic thinking. Use pickup (doesn't end turn) to reposition multiple pieces.

**Q: Why do I have 4 energy at game start?**  
A: Start small, gain +2 per turn. Can't place prism turn 1 anymore.

**Q: Can I place prism on turn 1?**  
A: No. Start with 4, prism costs 8. Need to pass 2 turns first.

**Q: Does picking up pieces end my turn?**  
A: No! Pickup never ends turn. Only PLACING ends turn.

**Q: Why can't I place blocker here?**  
A: Blockers need 3 cells distance from light sources (red zones).

**Q: Where did the 2x squares go?**  
A: They're now 3x! Called "Amplifiers" now.

**Q: Why can't I see all combos?**  
A: New "Combo Bonuses" panel shows them. Check right sidebar.

---

## 🔄 Rollback to v4.0

If needed:
```bash
cd ~
sudo systemctl stop prismwars
rm -rf prism-wars
mv prism-wars-v4-backup prism-wars
sudo systemctl start prismwars
```

---

## 🎉 Success Indicators

You'll know v4.5 works when:

✅ **Place piece** → Turn ends immediately  
✅ **Start game** → Have 4 energy (not 10)  
✅ **Pass turn** → Energy increases by 2  
✅ **Select blocker** → See red 3-cell zones  
✅ **Amplifiers** → Show "3x" label  
✅ **Combo panel** → Visible with ○/✓ indicators  
✅ **Actions panel** → Appears FIRST (top of right sidebar)  
✅ **UI** → Less scrolling needed  
✅ **Pickup** → Doesn't end turn  

---

## 📝 Detailed Comparison

### Energy Flow Example

**v4.0 Energy Flow:**
```
Turn 1: 10 → place 5 mirrors → end with 0 → reset to 10
Turn 2: 10 → place 2 splitters → end with 2 → reset to 10
Turn 3: 10 → place prism + mirror → end with 0 → reset to 10
```

**v4.5 Energy Flow:**
```
Turn 1: 4 → place mirror → end with 2 → gain +2
Turn 2: 4 → place mirror → end with 2 → gain +2
Turn 3: 4 → PASS → gain +2
Turn 4: 6 → PASS → gain +2
Turn 5: 8 → place prism → end with 0 → gain +2
Turn 6: 2 → pick mirror (1) + place (2) → end with -1... NO!
Turn 6: 2 → pick mirror (1) → have 1 → place mirror (2) → need 2 total → end with 0 if had 3
```

### Strategic Decision Tree

**v4.5 Turn Decision:**
```
Do I have energy for what I want?
├─ YES → Place it (turn ends)
└─ NO → Pass to save up

Alternative:
├─ Pick up wasted piece (1 energy, doesn't end turn)
└─ Place it better (costs energy, ends turn)
```

---

## 🚀 What's Next?

**Potential Phase 5 Features:**
- Touch/mobile optimization
- Sound effects
- Tutorial mode
- More objectives/combos
- Power-ups

**Deploy v4.5 and enjoy refined strategic gameplay!** 🎮✨

---

## 📋 Migration Notes

### From v4.0 to v4.5

**Backend:**
- `game_logic.py`: New methods for blocker zones, one-placement check
- `app.py`: No changes needed

**Frontend:**
- `game.js`: Combo display function, updated descriptions
- `game.css`: Compact styles, combo panel styles
- `game.html`: Combo panel, reordered elements, energy gain text
- `index.html`: Simplified content

**Data:**
- Old save files compatible (will use new rules)
- Players will see immediate differences

**What to Tell Players:**
1. "Placing a piece now ends your turn immediately"
2. "Energy accumulates - save up by passing"
3. "Blockers need more distance from light sources"
4. "Amplifiers now give 3x points instead of 2x"
5. "Check the new Combo Bonuses panel!"

---

**Enjoy the most balanced, strategic Prism Wars yet!** 🎯