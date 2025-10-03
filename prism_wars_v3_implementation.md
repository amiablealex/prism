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

**Behind the Scenes