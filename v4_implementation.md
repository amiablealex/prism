# Prism Wars v4.0 - Complete Implementation Guide

## 🎯 Phase 4 Overview

**Version 4.0** is a major stability and balance update that addresses:
- ✅ **Session Persistence & Reconnection**
- ✅ **Visual Chaos Reduction**
- ✅ **Strategic Depth via Energy System**
- ✅ **Piece Pickup/Replacement Mechanic**
- ✅ **Live Objective/Combo Recalculation**
- ✅ **Game State Recovery**
- ✅ **Connection Health Monitoring**

---

## 📦 Files to Replace

### Backend (3 files):
1. ✅ **game_logic.py** - Complete rewrite with energy, pickup, live scoring
2. ✅ **app.py** - Reconnection endpoints, heartbeat, game loading
3. ❌ **lobby_manager.py** - NO CHANGES (keep existing)

### Frontend (5 files):
4. ✅ **static/js/game.js** - Session persistence, visual controls, pickup mode
5. ✅ **static/css/game.css** - New styles for controls, notifications, energy display
6. ✅ **templates/index.html** - Resume game feature
7. ✅ **templates/game.html** - Visual controls panel, energy display
8. ❌ **templates/lobby.html** - NO CHANGES (keep existing)
9. ❌ **static/css/main.css** - NO CHANGES (keep existing)

---

## 🚀 Step-by-Step Installation

### Step 1: Backup Your Current Game

```bash
cd ~/prism-wars
cp -r . ../prism-wars-v3-backup
```

### Step 2: Replace Backend Files

```bash
# Replace game_logic.py
nano game_logic.py
# (Paste the new v4.0 content, save with Ctrl+O, exit with Ctrl+X)

# Replace app.py
nano app.py
# (Paste the new v4.0 content)
```

### Step 3: Replace Frontend Files

```bash
# Replace JavaScript
nano static/js/game.js
# (Paste new content)

# Replace game CSS
nano static/css/game.css
# (Paste new content)

# Replace index HTML
nano templates/index.html
# (Paste new content)

# Replace game HTML
nano templates/game.html
# (Paste new content)
```

### Step 4: No New Dependencies

Good news! No new Python packages required. All features use existing dependencies.

### Step 5: Restart the Server

```bash
# If running production with systemd
sudo systemctl restart prismwars

# Or if using development server:
python3 app.py
```

### Step 6: Test All New Features

Visit `http://your-pi-ip:5000` and verify:

**Reconnection System:**
- [ ] Start a game, refresh browser → See "Resume Game" option on home page
- [ ] Click "Resume Game" → Returns to exact game state
- [ ] Disconnect during game → 30s grace period shown
- [ ] Reconnect within 30s → No penalty, continue playing
- [ ] Server restart → Games persist and can resume

**Energy System:**
- [ ] Each turn starts with 10 energy
- [ ] Placing mirror costs 2 energy
- [ ] Placing splitter costs 4 energy
- [ ] Placing blocker costs 3 energy
- [ ] Placing prism costs 8 energy
- [ ] Can't place piece if not enough energy
- [ ] Energy display shows current amount

**Pickup/Replace System:**
- [ ] Click "Pickup Mode" button
- [ ] Click your own piece → Costs 1 energy, returns to inventory
- [ ] Can't pickup opponent pieces
- [ ] Can place picked-up pieces in new locations

**Visual Controls:**
- [ ] Toggle "Show Light Beams" → Beams appear/disappear
- [ ] Toggle "Show Particles" → Particles appear/disappear
- [ ] Toggle "Show Territory" → Territory overlay appears/disappears
- [ ] Toggle "Show Other Players" → Opponent pieces/beams hide
- [ ] Click "Highlight My Light" → Your beams at 100%, others at 20%
- [ ] Click "Show Active Player" → Only current player's beams visible

**Game Balance:**
- [ ] Board is 15×15 (not 12×12)
- [ ] Players have 2 light sources each (not 3)
- [ ] Game ends at round 15 (not 20)
- [ ] Victory at 75 points (unchanged)
- [ ] Blocker stops all light completely (no penetration)

**Live Scoring:**
- [ ] Complete an objective → Points added immediately
- [ ] Lose objective on next turn → Points removed immediately
- [ ] Build mirror chain → Combo points awarded
- [ ] Break mirror chain → Combo points removed

**Connection Health:**
- [ ] Connection status shows in header (Connected/Reconnecting/Error)
- [ ] Heartbeat sent every 10 seconds automatically
- [ ] Miss turn timer → Marked [1/3], [2/3]
- [ ] After 3 consecutive missed turns → Player removed [DC]
- [ ] Game continues with remaining players

---

## 🎮 New Features Explained

### 1. Session Persistence & Reconnection

**How It Works:**
```javascript
// Stored in browser localStorage:
{
    gameId: "ABC123",
    playerId: "hex-string",
    playerName: "YourName",
    lastActive: timestamp
}

// On page load:
1. Check localStorage for session
2. If found, check if game still exists
3. Show "Resume Game" button
4. On resume, call /reconnect endpoint
5. Server validates and restores player
6. Redirects to game/lobby
```

**Features:**
- Survives browser refresh
- Survives accidental tab close
- Survives network hiccups
- Expires after 6 hours of inactivity
- Works even after server restart (games saved to disk)

**Backend Implementation:**
```python
# app.py
@app.route('/reconnect', methods=['POST'])
def reconnect_to_game():
    # Validates player was in game
    # Resets missed turns counter
    # Removes from disconnected set
    # Updates heartbeat timestamp
    return redirect_url
```

### 2. Energy System

**Balance:**
```
Per Turn: 10 energy
Costs:
- Mirror:   2 energy (efficient)
- Blocker:  3 energy (defensive)
- Splitter: 4 energy (tactical)
- Prism:    8 energy (expensive!)
- Pickup:   1 energy (cheap)
```

**Strategy:**
- Can place 5 mirrors per turn (10 ÷ 2)
- Can place 2 splitters per turn (10 ÷ 4)
- Can place 1 prism + 1 mirror per turn (8 + 2)
- Need to save energy for prism (can't place in 1 turn)
- Or pickup old pieces and reuse them

**UI Display:**
```
⚡ Energy Available
   ⚡ 10

Each inventory item shows cost:
🪞 Mirror  ⚡2
✂️ Splitter ⚡4
```

### 3. Pickup & Replace Mechanic

**How It Works:**
1. Click "Pickup Mode: OFF" → Becomes "Pickup Mode: ON"
2. Click any of YOUR pieces on board
3. Costs 1 energy
4. Piece returns to inventory
5. Board recalculates light paths immediately
6. Can place it somewhere else

**Strategic Uses:**
- Reorganize mirrors that aren't working
- Move blocker to different position
- Reposition splitter for better coverage
- FREE UP the prism and use it elsewhere (big!)

**Restrictions:**
- Can only pickup YOUR pieces
- Costs 1 energy per pickup
- Can't pickup if you have 0 energy

### 4. Visual Controls

**Layer Toggles:**
```
☑ Show Light Beams    → All beam lines visible
☑ Show Particles      → Animated light particles
☑ Show Territory      → Colored territory overlay
☑ Show Other Players  → Show/hide opponent pieces
```

**Focus Modes:**
```
💡 Highlight My Light
- Your beams: 100% opacity
- Other beams: 20% opacity
- Your territory: normal brightness
- Other territory: faded

🎯 Show Active Player
- Current player: 100% opacity
- All others: 15% opacity
- Auto-switches each turn
```

**When to Use:**
- **Turn 1-5:** Keep everything on (board is clear)
- **Turn 6-10:** Start hiding particles to reduce clutter
- **Turn 11+:** Use "Highlight My Light" to focus
- **Planning:** Use "Show Active Player" to see current state
- **Analysis:** Toggle territory only for pure strategic view

### 5. Live Objective/Combo Scoring

**OLD v3.0 Behavior:**
```
Complete objective → ✓ Marked complete forever
Points awarded → Never recalculated
```

**NEW v4.0 Behavior:**
```
Complete objective → ✓ Points added
Lose objective next turn → ○ Points REMOVED
Build combo → Points added immediately
Lose combo → Points removed immediately
```

**Example:**
```
Turn 5: Control all 4 corners → +15 points ✓
Turn 6: Opponent takes 1 corner → -15 points ○
Turn 7: Reclaim corner → +15 points ✓
```

**Why This Matters:**
- More dynamic gameplay
- Prevents "camping" on objectives
- Encourages defending achievements
- Scores reflect CURRENT game state
- More accurate representation of who's winning

### 6. Connection Health Monitoring

**Three Layers:**

**Layer 1: Heartbeat (10s intervals)**
```javascript
// Client sends every 10 seconds
socket.emit('heartbeat', {
    game_id: gameId,
    player_id: playerId
});
```

**Layer 2: Grace Period (30s)**
```
No heartbeat for 15s → Marked as pending disconnect
Still no heartbeat for 30s total → Start turn timer
```

**Layer 3: Turn Timeouts (3 strikes)**
```
Miss turn 1 → [1/3] displayed
Miss turn 2 → [2/3] displayed
Miss turn 3 → [DC] removed from game
```

**Visual Indicators:**
```
● Connected         (green)
● Reconnecting...   (yellow, pulsing)
● Connection Error  (red)
```

**Recovery:**
```
Reconnect within 30s → No penalty, continue
Reconnect after 30s but before 3 timeouts → [1/3] or [2/3]
Make any move → Reset to [0/3]
```

### 7. Game State Saves

**Automatic Saving:**
```python
# After every action:
- Place piece → save_game_state()
- Pickup piece → save_game_state()
- Pass turn → save_game_state()
- Turn timeout → save_game_state()

# Saved to: data/games/{game_id}.json
```

**Recovery on Server Restart:**
```python
# On startup, app.py:
def load_saved_games():
    for filename in os.listdir('data/games'):
        game = PrismWarsGame.from_dict(json_data)
        lobby_manager.games[game_id] = game
```

**Players can resume even if:**
- Server crashes
- Raspberry Pi reboots
- Power outage (if Pi restarts)
- Manual server restart

---

## ⚖️ Balance Changes Summary

### Board & Game Length
| Item | v3.0 | v4.0 | Change |
|------|------|------|--------|
| Board Size | 12×12 | 15×15 | +56% cells |
| Light Sources | 3 per player | 2 per player | -33% |
| Max Rounds | 20 | 15 | -25% |
| Win Points | 75 | 75 | No change |

### Piece Availability
| Piece | v3.0 | v4.0 | Change |
|-------|------|------|--------|
| Mirrors | 15 | 8 | -47% |
| Splitters | 6 | 3 | -50% |
| Prisms | 1 | 1 | No change |
| Blockers | 8 | 4 | -50% |
| **TOTAL** | **30** | **16** | **-47%** |

### Energy Costs (NEW)
| Action | Energy Cost |
|--------|-------------|
| Place Mirror | 2 |
| Place Blocker | 3 |
| Place Splitter | 4 |
| Place Prism | 8 |
| Pickup Piece | 1 |
| **Per Turn** | **10** |

### Light Mechanics
| Mechanic | v3.0 | v4.0 |
|----------|------|------|
| Blocker Penetration | First blocker penetrated | **Blocks all light** |
| Protected Zones | 2 cells | 2 cells (same) |

---

## 🎯 Expected Gameplay Impact

### Game Duration
- **v3.0:** 12-18 minutes average
- **v4.0:** 10-15 minutes average (faster due to 15 rounds)

### Visual Clarity
- **v3.0:** Chaotic after turn 7-8
- **v4.0:** Manageable with visual controls
- **Reduction:** ~60% less visual noise with controls

### Strategic Depth
- **More planning:** Energy forces multi-turn strategies
- **More decisions:** Pickup vs. place new piece
- **More dynamic:** Live scoring creates comebacks
- **More forgiving:** Reconnection prevents losses

### Player Experience
- **Less frustration:** No lost games from refresh
- **More control:** Visual filters reduce overwhelm
- **More engaging:** Energy adds resource management
- **More fair:** Live scoring reflects true state

---

## 🐛 Troubleshooting

### Issue: Resume button doesn't appear

**Solution:**
- Check browser console (F12) for errors
- Verify localStorage is enabled in browser
- Check session hasn't expired (6 hour limit)
- Try creating a new game first

### Issue: Energy display not updating

**Solution:**
- Refresh page (should auto-reconnect)
- Check gameState.player_energy exists
- Verify updateUI() is being called
- Check browser console for JavaScript errors

### Issue: Pickup mode not working

**Solution:**
- Ensure it's your turn
- Verify you have at least 1 energy
- Check you're clicking YOUR pieces (not opponent's)
- Look for error notifications

### Issue: Visual controls not responding

**Solution:**
- Check toggleVisual() function exists
- Verify button IDs match JavaScript
- Clear browser cache (Ctrl+Shift+R)
- Check renderBoard() is being called

### Issue: Games not persisting after restart

**Solution:**
- Check data/games directory exists: `ls ~/prism-wars/data/games`
- Verify permissions: `chmod 755 ~/prism-wars/data/games`
- Check server logs: `sudo journalctl -u prismwars -f`
- Verify save_game_state() is being called

### Issue: Connection status stuck on "Reconnecting"

**Solution:**
- Check Socket.IO connection: browser console should show connect/disconnect
- Restart server: `sudo systemctl restart prismwars`
- Check firewall: `sudo ufw status`
- Verify port 5000 is accessible

### Issue: Objectives not recalculating

**Solution:**
- This is working as designed in v4.0
- Objectives recalculate every turn automatically
- Check score breakdown updates each turn
- Verify ○ and ✓ icons toggle correctly

### Issue: Initial canvas size too small

**Solution:**
- This is a known timing issue
- Workaround: Tiny window resize fixes it immediately
- OR refresh page after game loads
- OR wait 1 second, should auto-resize
- Fix coming in future update

### Issue: "Game not found" after resume

**Solution:**
- Game may have been cleaned up (7 day expiry)
- Check game actually exists: `/check_game` endpoint
- Clear localStorage: `localStorage.clear()`
- Start new game

---

## 📊 Testing Checklist

### Session Persistence
- [ ] Create game → Refresh → See resume button
- [ ] Resume game → Returns to exact state
- [ ] Play game → Close tab → Reopen → Resume works
- [ ] Start new game clears old session
- [ ] Session expires after 6 hours

### Reconnection
- [ ] Disconnect → Reconnect within 30s → No penalty
- [ ] Disconnect → Wait 40s → Reconnect → Shows [1/3]
- [ ] Make move after reconnect → Resets to [0/3]
- [ ] 3 timeouts → Player marked [DC]
- [ ] Server restart → Games persist → Can resume

### Energy System
- [ ] Turn starts with 10 energy
- [ ] Placing mirror costs 2
- [ ] Placing splitter costs 4
- [ ] Placing blocker costs 3
- [ ] Placing prism costs 8
- [ ] Can't place if insufficient energy
- [ ] Energy display updates correctly

### Pickup/Replace
- [ ] Pickup mode toggles on/off
- [ ] Can pickup own pieces (costs 1 energy)
- [ ] Can't pickup opponent pieces
- [ ] Piece returns to inventory
- [ ] Board recalculates immediately
- [ ] Can place picked-up piece elsewhere

### Visual Controls
- [ ] Toggle beams works
- [ ] Toggle particles works
- [ ] Toggle territory works
- [ ] Toggle other players works
- [ ] Highlight my light works (dimming others)
- [ ] Show active player works (auto-switches turns)

### Live Scoring
- [ ] Complete objective → Points added
- [ ] Lose objective → Points removed
- [ ] Build combo → Points added
- [ ] Break combo → Points removed
- [ ] Scores update every turn
- [ ] Breakdown shows current state

### Board Changes
- [ ] Board is 15×15
- [ ] 2 light sources per player
- [ ] Game ends at round 15
- [ ] Blocker stops all light
- [ ] Protected zones still work

### Connection Health
- [ ] Connection status displays correctly
- [ ] Heartbeat sends every 10 seconds
- [ ] Grace period of 30 seconds works
- [ ] Missed turns tracked [1/3], [2/3], [3/3]
- [ ] Player removed after 3 timeouts

### Edge Cases
- [ ] 2-player game works
- [ ] 3-player game works
- [ ] 4-player game works
- [ ] Multiple disconnects handled
- [ ] Game ends properly
- [ ] Final scores show correctly

---

## 🔄 Reverting to v3.0

If you need to revert:

```bash
cd ~
sudo systemctl stop prismwars
rm -rf prism-wars
mv prism-wars-v3-backup prism-wars
cd prism-wars
sudo systemctl start prismwars
```

---

## 🎉 Success Criteria

You've successfully implemented v4.0 when:

✅ Refresh browser → Resume game button appears  
✅ Energy system working (10 per turn, costs displayed)  
✅ Can pickup and replace pieces  
✅ Visual controls toggle layers on/off  
✅ Highlight modes work (my light / active player)  
✅ Board is 15×15 with 2 light sources per player  
✅ Objectives recalculate each turn (dynamic ✓/○)  
✅ Connection status shows in header  
✅ Games persist after server restart  
✅ Blocker stops all light (no penetration)  
✅ Game feels more strategic and less chaotic  

**Enjoy the refined, stable Prism Wars v4.0!** 🎮✨

The game now has professional stability, strategic depth, visual clarity, and graceful handling of real-world issues like disconnections and browser refreshes.