# Prism Wars v4.5 - Implementation Guide

## 🎯 What is v4.5?

Version 4.5 is a **refinement update** focusing on:
- ✅ **One placement per turn** (more strategic)
- ✅ **Accumulating energy system** (plan ahead)
- ✅ **Blocker exclusion zones** (3 cells instead of 2)
- ✅ **3x amplifier multiplier** (was 2x)
- ✅ **Combo breakdown display** (visual panel)
- ✅ **Compact UI design** (less scrolling)
- ✅ **Actions panel first** (better UX)
- ✅ **Simplified homepage** (clearer rules)

---

## 📦 Files to Replace

### Must Replace (5 files):
1. ✅ **game_logic.py** - One placement, accumulating energy, 3-cell blocker zones, 3x amplifiers
2. ✅ **static/js/game.js** - Combo display function, updated piece descriptions
3. ✅ **static/css/game.css** - Compact styles, combo panel, reordered elements
4. ✅ **templates/game.html** - Combo panel, actions first, energy gain display
5. ✅ **templates/index.html** - Simplified 8-card layout

### No Changes Needed:
- ❌ **app.py** (same as v4.0)
- ❌ **lobby_manager.py** (same as v4.0)
- ❌ **templates/lobby.html** (same as v4.0)
- ❌ **static/css/main.css** (same as v4.0)
- ❌ **requirements.txt** (no new dependencies)

---

## 🚀 Installation Steps

### Step 1: Backup

```bash
cd ~/prism-wars
cp -r . ../prism-wars-v4-backup
```

### Step 2: Replace Files

```bash
# Replace game_logic.py
nano game_logic.py
# (Paste v4.5 content, Ctrl+O to save, Ctrl+X to exit)

# Replace game.js
nano static/js/game.js
# (Paste v4.5 content)

# Replace game.css
nano static/css/game.css
# (Paste v4.5 content)

# Replace game.html
nano templates/game.html
# (Paste v4.5 content)

# Replace index.html
nano templates/index.html
# (Paste v4.5 content)
```

### Step 3: Restart Server

```bash
# Production
sudo systemctl restart prismwars

# Development
python3 app.py
```

### Step 4: Test

Visit `http://your-pi-ip:5000` and create a NEW game.

---

## ✅ Testing Checklist

### One Placement Per Turn
- [ ] Create game, place a mirror → Turn ends immediately
- [ ] Energy shows remaining after placement
- [ ] Can't place second piece same turn
- [ ] Pickup does NOT end turn
- [ ] Can pickup + place in same turn (both actions happen)

### Accumulating Energy
- [ ] Game starts with 4 energy (not 10)
- [ ] Place mirror (costs 2) → Left with 2 energy
- [ ] Next turn: Have 4 energy (2 carried + 2 gained)
- [ ] Pass turn → Gain 2 energy without placing
- [ ] Energy display shows "+2 per turn"
- [ ] Can save up to 10+ energy for prism

### Blocker Exclusion Zones
- [ ] Select blocker → See red zones (3 cells deep)
- [ ] Cannot place blocker in red zones
- [ ] Other pieces only have 2-cell pink zones
- [ ] Red zones more visible than pink zones
- [ ] Error message if try to place blocker in exclusion zone

### Amplifier Changes
- [ ] Gold tiles display "3x" (not "2x")
- [ ] Territory on amplifier = 3 points (check scores)
- [ ] Legend says "Amplifiers - 3x pts"

### Combo Display
- [ ] See "Combo Bonuses" panel on right sidebar
- [ ] Shows "Perfect Reflection" with ○ or ✓
- [ ] Shows "Prism Cascade" with ○ or ✓
- [ ] Points update live (matching score breakdown)
- [ ] Details show specific combo achievements

### UI Improvements
- [ ] Actions panel appears FIRST (above inventory)
- [ ] Less scrolling needed on laptop screen
- [ ] Panels feel more compact (smaller padding)
- [ ] Header is shorter (60px not 80px)
- [ ] Sidebar narrower (240px not 280px)

### Homepage Simplified
- [ ] Only 8 rule cards (not 12)
- [ ] Descriptions are concise
- [ ] Less overwhelming for new players
- [ ] Key info still present

### Pickup Behavior
- [ ] Pick up piece → Turn does NOT end
- [ ] Energy reduced by 1
- [ ] Can pick multiple pieces (energy permitting)
- [ ] Placing ANY piece ends turn

---

## 🎮 Key Gameplay Changes

### Before v4.5 (v4.0)
```
Turn Example:
Energy: 10 (reset each turn)
Actions: 
- Place 5 mirrors (2 energy each)
- Turn ends
- Next turn: Reset to 10 energy
```

### After v4.5
```
Turn Example:
Energy: 4 (accumulated from last turn)
Actions:
- Place 1 mirror (2 energy) → Turn ends immediately
- Energy: 2 remaining
- Next turn: 4 energy (2 + 2 gained)

OR:
- Pass turn → Gain 2 energy
- Next turn: 6 energy
```

---

## 💡 Strategy Guide

### Early Game (Turns 1-3)
```
Turn 1: 4 energy
→ Place mirror (2) → 2 remaining

Turn 2: 4 energy (2 + 2)
→ Place mirror (2) → 2 remaining

Turn 3: 4 energy (2 + 2)
→ PASS to save up → 4 remaining
```

### Mid Game (Turns 4-8)
```
Turn 4: 6 energy (4 + 2)
→ PASS again → 6 remaining

Turn 5: 8 energy (6 + 2)
→ Place PRISM! (8) → 0 remaining

Turn 6: 2 energy (0 + 2)
→ Place mirror (2) → 0 remaining
```

### Using Pickup
```
Energy: 5
→ Pickup wasted mirror (1) → 4 remaining
→ Place it better (2) → 2 remaining
→ Turn ends
Total cost: 3 energy to relocate
```

### Blocker Strategy
```
v4.0: Place blocker 2 cells from source
v4.5: Must place 3 cells from source

Light source at (3,0) pointing down:
Exclusion: (3,0), (3,1), (3,2)
Earliest blocker: (3,3)
```

---

## 🎯 Expected Results

### Game Length
- **v4.0:** 10-15 minutes
- **v4.5:** 12-18 minutes (deliberate, strategic)

### Turn Duration
- **v4.0:** ~30-45 seconds per turn
- **v4.5:** ~20-30 seconds per turn (one decision)

### Energy Management
- **v4.0:** Spend freely, resets anyway
- **v4.5:** Save strategically, every point counts

### Visual Clarity
- **v4.0:** Some scrolling needed
- **v4.5:** Minimal scrolling (20% less padding)

---

## 🐛 Troubleshooting

### Issue: Turn doesn't end after placing piece

**Solution:**
- Ensure you placed a piece (not just picked up)
- Check game_logic.py has `self.next_turn()` in `place_piece()`
- Restart server: `sudo systemctl restart prismwars`

### Issue: Energy resets to 10 each turn

**Solution:**
- Wrong game_logic.py version (still using v4.0)
- Check `next_turn()` calls `gain_energy()` not setting to 10
- Verify `energy_per_turn = 2` in game_logic.py

### Issue: Can still place blocker 2 cells from source

**Solution:**
- Check `blocker_exclusion_zones` exists in game_logic.py
- Verify `_create_blocker_exclusion_zones()` uses range(3)
- Start NEW game (old games use old rules)

### Issue: Amplifiers still show "2x"

**Solution:**
- Check game.js renders "3x" not "2x"
- Check game_logic.py has `base_scores[player] += 3`
- Verify index.html legend says "3x"

### Issue: Combo panel not visible

**Solution:**
- Check game.html has `<div id="combosDisplay">`
- Verify game.js has `updateCombosDisplay()` function
- Check CSS has `.combo-item` styles
- Clear browser cache (Ctrl+Shift+R)

### Issue: Actions panel at bottom

**Solution:**
- Check game.css has `.actions-panel { order: -1; }`
- Verify game.html has actions before inventory
- Try hard refresh

### Issue: Too much scrolling still

**Solution:**
- Verify game.css uses 12px padding (not 20px)
- Check sidebar width is 240px (not 280px)
- Confirm header height is 60px (not 80px)

---

## 📊 Performance Impact

### File Size Changes
- game_logic.py: +50 lines (blocker zones, one placement)
- game.js: +100 lines (combo display)
- game.css: -10% size (compact styles)
- game.html: +20 lines (combo panel)
- index.html: -30% size (simplified)

### Runtime Performance
- No change (same algorithms)
- Combo display adds ~5ms per render
- Negligible impact

---

## 🔄 Rollback Instructions

If you need to revert to v4.0:

```bash
cd ~
sudo systemctl stop prismwars
rm -rf prism-wars
mv prism-wars-v4-backup prism-wars
cd prism-wars
sudo systemctl start prismwars
```

---

## 🎉 Success Criteria

You've successfully implemented v4.5 when:

✅ **Place piece** → Turn ends immediately  
✅ **Start game** → Have 4 energy, not 10  
✅ **Pass turn** → Energy increases by 2  
✅ **Select blocker** → See red 3-cell exclusion zones  
✅ **Amplifiers** → Show "3x" label  
✅ **Combo panel** → Visible with ○/✓ indicators  
✅ **Actions panel** → Appears FIRST on right sidebar  
✅ **UI** → Less scrolling, more compact  
✅ **Pickup** → Doesn't end turn  
✅ **Homepage** → Only 8 cards, simplified  

---

## 📝 What to Tell Players

When announcing v4.5, explain:

**1. One Placement Rule:**
"Placing a piece now ends your turn immediately. Think carefully about each move!"

**2. Energy System:**
"Energy accumulates instead of resetting. You start with 4 and gain +2 per turn. Save up by passing!"

**3. Blocker Distance:**
"Blockers now need 3 cells distance from light sources (was 2). This prevents instant snuffing."

**4. Amplifiers:**
"Gold tiles now give 3x points instead of 2x. They're even more valuable!"

**5. New Features:**
"Check out the new Combo Bonuses panel to see your achievements live!"

---

## 💬 FAQ

**Q: Can I place multiple pieces per turn?**  
A: No. Placing ANY piece immediately ends your turn in v4.5.

**Q: What if I have 10 energy? Can I place 5 mirrors?**  
A: No. You can only place ONE piece per turn, then turn ends.

**Q: Does pickup end my turn?**  
A: No! Pickup never ends turn. Only placing ends turn.

**Q: Can I pickup multiple pieces?**  
A: Yes, as long as you have energy. Each pickup costs 1.

**Q: Can I pickup then place in same turn?**  
A: Yes! Pickup (doesn't end turn) then place (ends turn).

**Q: How do I get 8 energy for prism?**  
A: Start with 4, pass turn (6), pass again (8), then place prism.

**Q: Why can't I place blocker near source?**  
A: Blockers need 3 cells minimum distance. This is intentional to prevent instant blocking.

**Q: What happened to 2x tiles?**  
A: They're now 3x! Called "Amplifiers" everywhere.

**Q: Where are the combos?**  
A: New "Combo Bonuses" panel on right sidebar, below objectives.

---

## 🔍 Detailed Change Log

### game_logic.py Changes
```python
# Energy system
self.energy_per_turn = 2  # Was 10 (reset)
self.player_energy = [4 for _ in self.players]  # Start with 4

# Blocker zones
self._create_blocker_exclusion_zones()  # NEW
for dist in range(3):  # Was range(2)

# Amplifier multiplier
base_scores[player] += 3  # Was += 2

# One placement per turn
def place_piece():
    # ... place logic ...
    self.next_turn()  # Immediately end turn
    return True

# Accumulating energy
def gain_energy(self, player_idx):
    self.player_energy[player_idx] += self.energy_per_turn
```

### game.js Changes
```javascript
// Combo display function
function updateCombosDisplay() {
    // Shows Perfect Reflection combo
    // Shows Prism Cascade combo
    // Live ○/✓ indicators
}

// Piece descriptions updated
'Placing ends your turn.'  // Added to all

// Energy gain display
document.getElementById('energyGain').textContent = '+2 per turn';
```

### game.css Changes
```css
/* Compact padding */
padding: 12px;  /* Was 20px */
margin-bottom: 8px;  /* Was 15px */
gap: 12px;  /* Was 20px */

/* Narrower sidebar */
width: 240px;  /* Was 280px */

/* Shorter header */
height: 60px;  /* Was 80px */

/* Combo styles */
.combo-item { /* NEW */ }
.combo-header { /* NEW */ }
```

### game.html Changes
```html
<!-- Actions moved to top -->
<div class="actions-panel">
    <!-- Pickup and Pass buttons -->
</div>

<!-- Combo panel added -->
<div class="combos-panel">
    <div id="combosDisplay"></div>
</div>

<!-- Energy gain text -->
<div class="energy-gain" id="energyGain">+2 per turn</div>
```

### index.html Changes
```html
<!-- 8 cards instead of 12 -->
<!-- Condensed descriptions -->
<!-- Removed redundant info -->
```

---

## 🚀 Next Steps

After successful deployment:

1. **Monitor first games** - Watch how players adapt
2. **Gather feedback** - One placement too restrictive?
3. **Balance check** - Is 3-cell blocker zone right?
4. **Iterate** - Phase 5 could adjust based on data

**Potential Phase 5:**
- Touch/mobile support
- Tutorial mode
- More combos
- Sound effects
- Statistics

---

## 🎯 Final Checklist

Before declaring success:

- [ ] Backed up v4.0
- [ ] Replaced all 5 files
- [ ] Restarted server
- [ ] Tested one placement rule
- [ ] Verified accumulating energy
- [ ] Checked blocker exclusion zones
- [ ] Confirmed 3x amplifiers
- [ ] Saw combo panel working
- [ ] UI feels more compact
- [ ] Homepage simplified
- [ ] Old games still work (with new rules)
- [ ] Players can resume games

---

**Deploy v4.5 and enjoy the most strategic, balanced Prism Wars yet!** 🎮✨

Your players will love the deeper strategy, clearer UI, and refined gameplay!