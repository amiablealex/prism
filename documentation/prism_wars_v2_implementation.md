# Prism Wars v2.0 - Implementation Guide

## 🎯 What's New

### Core Balance (Phase 1)
✅ **Protected Zones** - 2-cell buffer around light sources where pieces cannot be placed  
✅ **Blocker Penetration** - Light penetrates the first blocker it encounters  
✅ **Rebalanced Pieces**:
- Mirrors: 15 (unchanged)
- Prisms: 1 (reduced from 8) - now rare and powerful!
- Blockers: 8 (reduced from 10)
- **NEW: Splitters: 6** - splits light into 2 perpendicular beams

✅ **Amplifier Tiles** - 5 random golden tiles worth 2x points

### Strategic Depth (Phase 2)
✅ **Combo System** with bonuses:
- Perfect Reflection: 3+ mirrors in sequence (+5 points per extra mirror)
- Prism Cascade: Effective prism/splitter placement (+3 points each)

✅ **Objectives System** - Each player gets 2 secret objectives:
- Control All 4 Corners (+15 points)
- Dominate Center (+12 points)
- Edge Master: 8+ edge cells (+10 points)
- Power Surge: Control 3+ amplifier tiles (+12 points)
- Expansionist: Territory in all 4 quadrants (+10 points)

✅ **Points-Based Win** - First to 75 points OR highest score after 20 rounds

✅ **Score Breakdown** - Visual display showing: Territory + Combos + Objectives

---

## 📝 Step-by-Step Implementation

### Step 1: Backup Your Current Game

```bash
cd ~/prism-wars
cp -r . ../prism-wars-backup
```

### Step 2: Replace Backend Files

Replace these files with the new versions provided above:

1. **game_logic.py** - Replace entirely with the new version
2. **app.py** - Keep your existing file (no changes needed)
3. **lobby_manager.py** - Keep your existing file (no changes needed)

```bash
# In your prism-wars directory
# Replace game_logic.py with the new content
nano game_logic.py
# (Paste the new game_logic.py content, save with Ctrl+O, exit with Ctrl+X)
```

### Step 3: Replace Frontend Files

Replace these files:

1. **static/js/game.js** - Replace entirely
2. **static/css/game.css** - Replace entirely
3. **templates/game.html** - Replace entirely

```bash
# Replace JavaScript
nano static/js/game.js
# (Paste new content)

# Replace CSS
nano static/css/game.css
# (Paste new content)

# Replace HTML template
nano templates/game.html
# (Paste new content)
```

### Step 4: No Additional Dependencies

Good news! No new Python packages are required. The game uses only the existing dependencies.

### Step 5: Test the Changes

```bash
# If running development server
python3 app.py

# If running production with systemd
sudo systemctl restart prismwars
```

### Step 6: Verify Everything Works

Visit `http://your-pi-ip:5000` and test:

1. ✅ Create a new game
2. ✅ Check that you see the new Splitter piece (✂️) in inventory
3. ✅ Check that Prism count is now 1 (not 8)
4. ✅ Try to place a piece in the pink/red protected zones near light sources - should be blocked
5. ✅ Look for golden 2x amplifier tiles on the board
6. ✅ Check the objectives panel on the right sidebar
7. ✅ Check the score breakdown shows Territory/Combos/Objectives
8. ✅ Place some pieces and verify light penetrates first blocker
9. ✅ Try using the new Splitter piece - should split into 2 perpendicular beams

---

## 🎮 Gameplay Changes Summary

### What Players Will Notice

**Immediate Visual Changes:**
- Golden "2x" squares scattered on the board
- Pink protected zones near light sources (can't place pieces there)
- New Splitter piece in inventory
- Only 1 Prism available (precious!)
- Score display now shows breakdown with progress bars
- Objectives panel showing your 2 secret goals

**Gameplay Feel:**
- **Less Defensive** - Can't instantly block opponents' light sources anymore
- **More Strategic** - Need to carefully use your 1 Prism
- **Goal-Oriented** - Players have secret objectives to work toward
- **Dynamic Scoring** - Territory alone isn't enough, combos and objectives matter
- **Clearer Win Condition** - Race to 75 points instead of vague "most territory"

### Strategy Tips for New Version

1. **Protect Your Light Sources** - The 2-cell buffer helps, but place blockers beyond that
2. **Use Prism Wisely** - You only get 1! Make it count for area control
3. **Splitters for Precision** - Use splitters when you need targeted splits
4. **Hunt Amplifiers** - Those golden 2x tiles are worth fighting for
5. **Watch Objectives** - Keep your secret goals in mind when placing pieces
6. **Build Combos** - Try to chain mirrors for bonus points
7. **First Blocker Is Free** - Your light penetrates one blocker, so don't over-defend

---

## 🐛 Troubleshooting

### Issue: Game won't start after update

**Solution:**
```bash
# Check for Python errors
sudo journalctl -u prismwars -f

# Restart service
sudo systemctl restart prismwars
```

### Issue: Objectives not showing

**Solution:**
- Clear browser cache (Ctrl+Shift+R)
- Check browser console for JavaScript errors (F12)
- Verify static/js/game.js was updated correctly

### Issue: Splitter piece not appearing

**Solution:**
- Verify game_logic.py has the new 'splitter' piece type
- Check that pieces_per_player includes 'splitter': 6
- Start a NEW game (old games won't have splitter)

### Issue: Protected zones not working

**Solution:**
- Verify game_logic.py includes `_create_protected_zones` method
- Check that `protected_zones` is in the game state
- Look for pink zones on the board - if visible but still allowing placement, check the validation in `place_piece`

### Issue: Scores seem wrong

**Solution:**
- Check that `calculate_detailed_scores` is being called
- Verify amplifier tiles are being counted with 2x multiplier
- Ensure objectives are being checked in `_calculate_objectives`

### Issue: Old games still running with old rules

**Solution:**
All active games use the old rules. You need to:
- Finish old games or leave them
- Start NEW games to get the updated rules
- Optional: Clear old game data:
  ```bash
  rm ~/prism-wars/data/games/*.json
  ```

---

## 📊 Testing Checklist

Before declaring success, test these scenarios:

### Basic Functionality
- [ ] Can create a new game
- [ ] Can join a game with the code
- [ ] Game starts when all players ready
- [ ] Can place mirrors
- [ ] Can place splitters (new!)
- [ ] Can place prism (only 1 available)
- [ ] Can place blockers
- [ ] Turn advances correctly
- [ ] Pass turn works

### New Features
- [ ] Protected zones visible near light sources
- [ ] Cannot place pieces in protected zones
- [ ] Amplifier tiles visible (golden squares with "2x")
- [ ] Light penetrates first blocker
- [ ] Light stops at second blocker
- [ ] Splitter creates 2 perpendicular beams
- [ ] Objectives display shows 2 goals
- [ ] Score breakdown shows Territory/Combos/Objectives
- [ ] Progress bar fills toward 75 points
- [ ] Game ends when someone reaches 75 points
- [ ] Game ends after 20 rounds if no one reaches 75

### Combo System
- [ ] Place 3+ mirrors in a row - should get combo bonus
- [ ] Place prism with territory around it - should get cascade bonus
- [ ] Combo scores show in breakdown

### Objectives System
- [ ] Complete "Control 4 Corners" - get 15 points
- [ ] Complete "Dominate Center" - get 12 points
- [ ] Other objectives trigger when completed
- [ ] Completed objectives show checkmark

### Edge Cases
- [ ] 2-player game works
- [ ] 3-player game works
- [ ] 4-player game works
- [ ] Can reconnect if disconnected
- [ ] Game ends properly with winner announcement
- [ ] Final scores show breakdown

---

## 🎨 Visual Guide

### What You Should See

**Amplifier Tiles:**
- Golden yellow squares with "2x" text
- Slightly transparent yellow background
- Yellow border
- 5 tiles randomly placed at game start

**Protected Zones:**
- Pink/red transparent overlay
- 2 cells from each light source entry point
- Pieces cannot be placed here

**Splitter Piece:**
- ✂️ emoji in inventory
- Draws as an "X" shape on the board
- Splits light into left and right perpendicular directions

**Score Display:**
- Shows total score / 75
- Progress bar in player's color
- Small text showing breakdown: "Territory: X | Combos: Y | Objectives: Z"

**Objectives Panel:**
- Located in right sidebar
- Shows 2 objectives per player
- ○ for incomplete, ✓ for completed
- Shows point value (+10, +12, +15)

---

## 🔄 Reverting Changes

If you need to revert to the old version:

```bash
cd ~
rm -rf prism-wars
mv prism-wars-backup prism-wars
cd prism-wars
sudo systemctl restart prismwars
```

---

## 📞 Support

If you encounter issues:

1. Check the browser console (F12) for JavaScript errors
2. Check server logs: `sudo journalctl -u prismwars -f`
3. Verify all files were updated correctly
4. Try starting a completely new game
5. Clear browser cache

---

## 🎉 Success Criteria

You've successfully implemented v2.0 when:

✅ New games show only 1 Prism in inventory  
✅ Splitter piece appears and works  
✅ Golden 2x tiles visible on board  
✅ Protected zones prevent placement near light sources  
✅ Light penetrates first blocker  
✅ Objectives display shows 2 goals  
✅ Score shows breakdown (Territory + Combos + Objectives)  
✅ Win condition is 75 points  
✅ Game feels more strategic and less defensive  

**Enjoy the refined Prism Wars experience!** 🎮✨