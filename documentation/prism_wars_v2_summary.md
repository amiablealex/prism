# Prism Wars v2.0 - Upgrade Summary

## 📦 Files to Update

### Must Replace (5 files):
1. ✅ **game_logic.py** - Core game engine with all new features
2. ✅ **static/js/game.js** - Client-side game rendering and logic
3. ✅ **static/css/game.css** - Updated styles for new UI elements
4. ✅ **templates/game.html** - Game view with objectives panel
5. ✅ **templates/index.html** - Landing page with v2.0 info

### No Changes Needed:
- ❌ app.py (keep existing)
- ❌ lobby_manager.py (keep existing)
- ❌ templates/lobby.html (keep existing)
- ❌ static/css/main.css (update only if you want version notice styling - optional)
- ❌ requirements.txt (no new dependencies)

## 🎮 What Changed

### Balance Changes
| Item | Old | New | Change |
|------|-----|-----|--------|
| Mirrors | 15 | 15 | No change |
| Prisms | 8 | **1** | -7 (rare!) |
| Blockers | 10 | **8** | -2 |
| Splitters | 0 | **6** | NEW piece |

### New Mechanics
- ✅ Protected zones (2 cells around light sources)
- ✅ Blocker penetration (first blocker is transparent)
- ✅ Amplifier tiles (5 random 2x multiplier zones)
- ✅ Objectives system (2 per player, 10-15 points each)
- ✅ Combo bonuses (mirror chains, prism cascades)
- ✅ Point-based win (75 points instead of territory-only)

### UI Improvements
- ✅ Score breakdown (Territory + Combos + Objectives)
- ✅ Progress bars to 75 points
- ✅ Objectives panel showing your goals
- ✅ Visual indicators for amplifier tiles
- ✅ Protected zone highlights
- ✅ Improved final score display

## ⚡ Quick Update Command

```bash
cd ~/prism-wars

# Backup first
cp -r . ../prism-wars-backup

# Update the 5 files
# (Copy-paste the new content for each file)

# Restart
sudo systemctl restart prismwars

# Or if using development server:
# python3 app.py
```

## 🎯 Testing Checklist

Start a NEW game and verify:

- [ ] Splitter (✂️) appears in inventory with count of 6
- [ ] Prism (◆) shows count of 1 (not 8)
- [ ] Golden squares with "2x" visible on board
- [ ] Pink protected zones near light sources
- [ ] Objectives panel shows 2 goals on right sidebar
- [ ] Score shows X/75 with progress bar
- [ ] Score breakdown shows Territory | Combos | Objectives
- [ ] Can't place pieces in protected zones
- [ ] Light goes through first blocker but not second
- [ ] Splitter creates 2 perpendicular beams
- [ ] Prism creates 3 beams (straight + left + right)

## 🎲 Gameplay Impact

### Before v2.0:
- Players could instantly block opponent light sources
- Prisms were plentiful (8 each)
- No clear goals beyond "get most territory"
- Defensive/blocking was optimal strategy

### After v2.0:
- Light sources are protected, can't be instablocked
- Prism is precious (1 only) - major strategic decision
- Clear objectives and win condition (75 points)
- Offensive expansion is rewarded (combos, objectives)
- More dynamic and strategic gameplay

## 📊 Expected Game Length

- **Old version:** 15-25 minutes (20 rounds always)
- **New version:** 12-20 minutes (game can end early at 75 points)

## 🏆 Win Condition

### Old:
- Most territory after exactly 20 rounds

### New:
- **First to 75 points** OR
- Highest total points after 20 rounds

### Point Sources:
- **Territory:** 1 point per square (2 points on amplifier tiles)
- **Objectives:** 10-15 points each (2 per player)
- **Combos:** 3-5 points for strategic piece placement

## 💡 Strategy Tips for v2.0

1. **Prism is Precious** - You only get 1, plan carefully where to place it
2. **Control Amplifiers** - Fight for those golden 2x tiles
3. **Know Your Objectives** - Keep your secret goals in mind
4. **Build Combos** - Chain mirrors for bonus points
5. **Don't Over-Block** - Light penetrates first blocker anyway
6. **Splitters for Control** - Use for precise 2-beam splits
7. **Race to 75** - Don't just turtle for 20 rounds, play aggressively

## 🔍 Common Issues & Solutions

### "Objectives not showing"
- Clear browser cache (Ctrl+Shift+R)
- Verify game.html includes objectives panel
- Check browser console for errors

### "Still seeing 8 prisms"
- You're in an old game - start a NEW game
- Old games keep old rules
- Consider clearing data/games/*.json

### "Protected zones not working"
- Verify game_logic.py updated
- Start NEW game (old games don't have protected zones)
- Look for pink overlay near light sources

### "Score seems off"
- Check amplifier tiles are counting 2x
- Verify objectives are triggering
- Combos only count with 3+ connected pieces

## 📞 Rollback Instructions

If you need to revert:

```bash
cd ~
sudo systemctl stop prismwars
rm -rf prism-wars
mv prism-wars-backup prism-wars
sudo systemctl start prismwars
```

## ✨ Success!

You'll know the upgrade worked when you see:
- ✅ Only 1 prism in inventory
- ✅ New splitter piece (✂️)
- ✅ Golden 2x tiles on board
- ✅ Objectives panel on right side
- ✅ Score shows breakdown (Territory 40 | Combos 10 | Objectives 15)
- ✅ Win condition is 75 points
- ✅ Game feels more strategic and less defensive

**Enjoy the refined Prism Wars!** 🎮✨