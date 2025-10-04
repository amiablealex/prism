# Prism Wars v3.0 - Phase 3 Implementation Guide

## 🎯 What's New in v3.0

### Visual Polish
✅ **Animated Light Beams** - Flowing particle effects along all light paths  
✅ **Light Beam Lines** - Semi-transparent lines showing complete light paths  
✅ **Preview Mode** - Ghost preview of light path changes when hovering  
✅ **Smooth Animations** - Continuous animation loop with requestAnimationFrame  

### Turn Timer System
✅ **60-second turn timer** - Visible countdown in header  
✅ **Auto-pass on timeout** - Turn automatically passes if time expires  
✅ **Disconnect tracking** - 3 consecutive timeouts = player removed  
✅ **Visual warnings** - Timer turns yellow at 30s, red and pulsing at 15s  
✅ **Game continuation** - Game continues with remaining players  

---

## 📝 Step-by-Step Implementation

### Step 1: Backup Your Current Game

```bash
cd ~/prism-wars
cp -r . ../prism-wars-v2-backup
```

### Step 2: Replace Backend Files

Replace these files:

1. **game_logic.py** - Complete rewrite with turn timer and preview support
2. **app.py** - Updated with turn timer thread and preview endpoint

```bash
# Replace game_logic.py
nano game_logic.py
# (Paste the new v3.0 content)

# Replace app.py
nano app.py
# (Paste the new v3.0 content)
```

### Step 3: Replace Frontend Files

Replace these files:

1. **static/js/game.js** - Complete rewrite with animations and preview
2. **templates/game.html** - Updated with timer display
3. **static/css/game.css** - Updated with timer and animation styles

```bash
# Replace JavaScript
nano static/js/game.js
# (Paste new content)

# Replace HTML template
nano templates/game.html
# (Paste new content)

# Replace CSS
nano static/css/game.css
# (Paste new content)
```

### Step 4: No New Dependencies

Good news! No new Python packages required. Uses existing dependencies.

### Step 5: Restart the Server

```bash
# If running production with systemd
sudo systemctl restart prismwars

# If running development server
python3 app.py
```

### Step 6: Test the New Features

Visit `http://your-pi-ip:5000` and verify:

1. ✅ Create a new game
2. ✅ See animated light particles flowing along light beams
3. ✅ See semi-transparent light beam lines
4. ✅ Turn timer displays in header (starts at 1:00)
5. ✅ Timer turns yellow at 30 seconds
6. ✅ Timer turns red and pulses at 15 seconds
7. ✅ Hover over empty cells with a piece selected - see preview territory glow
8. ✅ Wait for timer to hit 0:00 - turn auto-passes
9. ✅ Let a player timeout 3 times - they get removed, game continues

---

## 🎮 New Features in Detail

### Animated Light Beams

**What You'll See:**
- Semi-transparent colored lines along all light paths
- 3-5 glowing particles per beam segment
- Particles flow continuously in the direction of light
- Smooth 60fps animation

**Technical Details:**
- Uses `requestAnimationFrame` for smooth animation
- Particles have randomized starting positions
- Each particle has slight speed variation (0.02-0.03 progress per frame)
- Glow effect using `ctx.shadowBlur`

### Light Path Preview

**How It Works:**
1. Select a piece from inventory
2. Hover over any empty valid cell
3. Ghost preview of the piece appears
4. Territory that WOULD be controlled glows brighter
5. Real-time update as you move mouse

**Behind the Scenes:**
- Client sends `request_preview` socket event on hover
- Server temporarily places piece and calculates light paths
- Server restores original board state
- Preview territory sent back to client
- Client renders with different opacity (30% vs 20%)
- Preview clears when mouse leaves or invalid cell

### Turn Timer

**Display:**
- Shows in header center: "Time: 1:00"
- Counts down every second
- Color changes:
  - White: 60-31 seconds
  - Yellow: 30-16 seconds
  - Red + Pulsing: 15-0 seconds

**Timeout Behavior:**
1. Timer hits 0:00
2. Turn automatically passes
3. Missed turn counter increments for that player
4. Player sees missed turns: "PlayerName [2/3]"
5. After 3 consecutive missed turns:
   - Player marked as disconnected
   - Shows "PlayerName (DC)" or "[REMOVED]"
   - Their light sources stop functioning
   - They're skipped in turn order
   - Game continues with remaining players

**Game End Conditions:**
- Only 1 active player left → That player wins
- 0 active players left → No winner
- Normal conditions still apply (75 points, 20 rounds)

---

## 🎨 Visual Changes

### Before v3.0:
- Static territory coloring
- No indication of light beam paths
- No preview of piece placement
- No time pressure

### After v3.0:
- **Dynamic Light Beams**: See exactly where light is flowing
- **Animated Particles**: Mesmerizing flowing light effects
- **Interactive Preview**: Know the impact before placing
- **Turn Timer**: Adds urgency and prevents stalling
- **Disconnect Handling**: Games don't get stuck on AFK players

---

## 🐛 Troubleshooting

### Issue: Animations are choppy

**Solution:**
- Reduce number of particles per beam in game.js:
  ```javascript
  const numParticles = 2 + Math.floor(Math.random() * 2); // Instead of 3-5
  ```
- Check browser performance (F12 → Performance tab)
- Verify Pi isn't under heavy load: `top` command

### Issue: Timer not updating

**Solution:**
- Check browser console for JavaScript errors (F12)
- Verify socket connection is established
- Check that game state includes `time_remaining` field
- Restart game server: `sudo systemctl restart prismwars`

### Issue: Preview not showing

**Solution:**
- Verify you're hovering over valid empty cells
- Check that piece is selected from inventory
- Look for `request_preview` events in browser network tab
- Server logs: `sudo journalctl -u prismwars -f`
- Ensure socket connection is active

### Issue: Player not getting removed after 3 timeouts

**Solution:**
- Check server logs for timeout handling
- Verify `missed_turns` counter is incrementing
- Check `disconnected_players` set in game state
- Background timer thread might not be running (restart server)

### Issue: Light beams not visible

**Solution:**
- Check that `light_beam_segments` exists in game state
- Verify `updateLightParticles()` is being called
- Look for JavaScript errors in console
- Check canvas is rendering: try clicking a cell

### Issue: Old games still running without timer

**Solution:**
All active games before v3.0 won't have timer. You need to:
- Start NEW games to get v3.0 features
- Old games will continue with old rules until finished
- Optional: Clear old games: `rm ~/prism-wars/data/games/*.json`

---

## 📊 Performance Notes

### Resource Usage
- **Animation Loop**: ~5-10% CPU on modern hardware
- **Light Particles**: 50-100 particles on screen at once
- **Preview Calculations**: Negligible (server-side, cached)
- **Timer Thread**: Minimal overhead (1 check per second)

### Optimization Tips
If performance is an issue on Raspberry Pi 3:
1. Reduce particles per beam (line 24 in game.js)
2. Increase particle size, reduce count
3. Lower frame rate: `setTimeout(() => animate(), 33)` for 30fps
4. Disable particle glow: Remove `ctx.shadowBlur` lines

---

## 🎮 Gameplay Impact

### Strategy Changes

**Time Pressure:**
- Players can't overthink every move
- Encourages faster, more intuitive play
- Prevents analysis paralysis
- Games move at better pace

**Preview System:**
- Reduces placement mistakes
- Encourages experimentation
- Makes complex strategies more accessible
- Visual learners benefit greatly

**Disconnect Handling:**
- Games no longer stuck waiting for AFK players
- Remaining players can finish properly
- 3-turn grace period prevents accidental removal
- Fair to active players

### Expected Game Length

- **Old version (v2.0):** 12-20 minutes
- **New version (v3.0):** 10-18 minutes (timer speeds things up)

---

## 📸 Visual Showcase

### What You Should See

**Animated Light Beams:**
```
Light Source → ----•---•--→ Mirror → ---•---•-→ Territory
                (glowing particles flowing)
```

**Preview Mode:**
```
Hover over cell → Ghost piece appears → Territory glows brighter
Move mouse → Preview updates instantly
```

**Turn Timer:**
```
60-31s: "Time: 0:45" (white)
30-16s: "Time: 0:25" (yellow)
15-0s:  "Time: 0:10" (red, pulsing)
0s:     Turn auto-passes
```

**Disconnected Player:**
```
Scores Panel:
┌─────────────────────────────┐
│ Player1      50/75          │ ← Active
│ Player2 (DC) 30/75          │ ← Disconnected (grayed out)
│ Player3 [2/3] 45/75         │ ← 2 missed turns
└─────────────────────────────┘
```

---

## ✅ Testing Checklist

### Animation System
- [ ] Light particles appear and flow along beams
- [ ] Particles loop continuously
- [ ] Animation is smooth (no stuttering)
- [ ] Light beam lines are visible
- [ ] Particles have appropriate colors (match players)

### Preview System
- [ ] Select piece from inventory
- [ ] Hover over empty cell → ghost piece appears
- [ ] Territory preview shows (brighter glow)
- [ ] Move mouse → preview updates
- [ ] Hover over occupied cell → no preview
- [ ] Hover over protected zone → no preview
- [ ] Leave canvas → preview disappears

### Turn Timer
- [ ] Timer starts at 1:00 when game begins
- [ ] Timer counts down every second
- [ ] Timer turns yellow at 0:30
- [ ] Timer turns red and pulses at 0:15
- [ ] Timer reaches 0:00 → turn auto-passes
- [ ] New turn starts → timer resets to 1:00

### Disconnect System
- [ ] Let timer run out → missed turn counter increases
- [ ] Player shows [1/3], [2/3] indicator
- [ ] After 3 timeouts → player marked (DC)
- [ ] Disconnected player grayed out in scores
- [ ] Disconnected player's light sources stop working
- [ ] Game continues with remaining players
- [ ] If only 1 player left → that player wins

### Edge Cases
- [ ] Player makes move before timeout → missed turns reset
- [ ] Player reconnects (refresh) → timer continues
- [ ] Multiple players timeout → all handled correctly
- [ ] Game ends normally with disconnected players
- [ ] Final scores show disconnected players

---

## 🔧 Configuration Options

### Adjust Turn Timer Duration

In `game_logic.py`, line 26:
```python
self.turn_timer_seconds = 60  # Change to 30, 45, 90, etc.
```

### Adjust Disconnect Threshold

In `game_logic.py`, line 127:
```python
if self.missed_turns[current_player_idx] >= 3:  # Change to 2, 4, 5, etc.
```

### Adjust Animation Speed

In `game.js`, LightParticle class:
```javascript
this.speed = 0.02 + Math.random() * 0.01;  // Increase for faster
```

### Adjust Number of Particles

In `game.js`, updateLightParticles():
```javascript
const numParticles = 3 + Math.floor(Math.random() * 3);  // Change range
```

---

## 🔄 Reverting to v2.0

If you need to revert:

```bash
cd ~
sudo systemctl stop prismwars
rm -rf prism-wars
mv prism-wars-v2-backup prism-wars
cd prism-wars
sudo systemctl start prismwars
```

---

## 🎉 Success Criteria

You've successfully implemented v3.0 when:

✅ Light particles flow along all beam paths  
✅ Semi-transparent beam lines are visible  
✅ Preview shows when hovering with selected piece  
✅ Turn timer displays and counts down  
✅ Timer changes color at thresholds  
✅ Turn auto-passes when timer hits 0  
✅ Players get removed after 3 consecutive timeouts  
✅ Disconnected players show (DC) indicator  
✅ Game continues smoothly with remaining players  
✅ No performance issues or lag  

---

## 💡 Pro Tips

### For Players

**Using Preview:**
- Hover over multiple spots to compare impacts
- Preview helps visualize complex mirror chains
- See exactly which territories you'll gain/lose
- Preview shows effect of prism splits

**Managing Timer:**
- Plan your move during opponent turns
- Use preview to make decisions faster
- Don't wait until last 15 seconds
- Have backup move ready

**Watching for AFKs:**
- If opponent has [1/3] or [2/3], they're timing out
- Game will continue without them after 3 timeouts
- Don't wait for them - play normally

### For You (Host)

**Performance:**
- v3.0 uses more CPU due to animations
- Pi 4 handles it easily
- Pi 3 might need particle reduction
- Monitor with `htop` if concerned

**Balancing:**
- 60 seconds is good default
- Faster players? Try 45 seconds
- Casual play? Try 90 seconds
- Competitive? Try 30 seconds

---

## 📞 Support

If you encounter issues:

1. Check browser console (F12) for JavaScript errors
2. Check server logs: `sudo journalctl -u prismwars -f`
3. Verify socket connection is established
4. Try in different browser
5. Check Pi CPU/memory: `htop`
6. Reduce animation complexity if needed

---

## 🌟 What's Next?

Potential future enhancements:
- Sound effects for piece placement
- Victory animations
- Replay system to watch game evolution
- Stats tracking across games
- Tournament mode with ELO ratings

**Enjoy the polished Prism Wars experience!** 🎮✨

The game now has professional visual feedback, prevents stalling, and handles disconnections gracefully. Your friends will love the flowing light animations and the strategic depth of the preview system!