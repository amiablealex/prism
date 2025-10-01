# File Transfer Guide to Raspberry Pi

## Quick Methods to Transfer Files

### Method 1: SCP (Secure Copy) - Recommended

**From your computer (with all files in a local folder):**

```bash
# Create a tarball of all files
tar -czf prism-wars.tar.gz app.py game_logic.py lobby_manager.py requirements.txt static/ templates/

# Copy to Pi
scp prism-wars.tar.gz pi@YOUR_PI_IP:~/

# SSH into Pi
ssh pi@YOUR_PI_IP

# Extract files
cd ~
tar -xzf prism-wars.tar.gz
mv prism-wars.tar.gz prism-wars/  # Move into directory

# Create data directory
mkdir -p prism-wars/data/games

# Done!
```

### Method 2: SFTP (GUI Method)

**Using FileZilla or WinSCP:**

1. Download FileZilla (free): https://filezilla-project.org/
2. Connect:
   - Host: `sftp://YOUR_PI_IP`
   - Username: `pi`
   - Password: your Pi password
   - Port: `22`
3. Navigate to `/home/pi/`
4. Create folder `prism-wars`
5. Drag and drop all files maintaining the structure:
   ```
   prism-wars/
   ├── app.py
   ├── game_logic.py
   ├── lobby_manager.py
   ├── requirements.txt
   ├── static/
   │   ├── css/
   │   │   ├── main.css
   │   │   └── game.css
   │   └── js/
   │       └── game.js
   └── templates/
       ├── index.html
       ├── lobby.html
       └── game.html
   ```
6. Create empty `data/games/` folder

### Method 3: Git (If files are in a repository)

```bash
ssh pi@YOUR_PI_IP
cd ~
git clone YOUR_REPOSITORY_URL prism-wars
cd prism-wars
mkdir -p data/games
```

### Method 4: Manual Copy-Paste (Small files)

SSH into your Pi and use nano:

```bash
ssh pi@YOUR_PI_IP
mkdir -p ~/prism-wars/static/css ~/prism-wars/static/js ~/prism-wars/templates ~/prism-wars/data/games
cd ~/prism-wars

# Create each file
nano app.py
# Paste content, press Ctrl+O to save, Ctrl+X to exit

nano game_logic.py
# Repeat...
```

## File Checklist

Copy this list and check off as you transfer:

### Root Files:
- [ ] app.py (542 lines)
- [ ] game_logic.py (385 lines)
- [ ] lobby_manager.py (95 lines)
- [ ] requirements.txt (6 lines)

### Templates:
- [ ] templates/index.html (167 lines)
- [ ] templates/lobby.html (131 lines)
- [ ] templates/game.html (109 lines)

### CSS:
- [ ] static/css/main.css (499 lines)
- [ ] static/css/game.css (334 lines)

### JavaScript:
- [ ] static/js/game.js (546 lines)

### Directories:
- [ ] data/games/ (empty, but must exist)

## Verify Transfer

After transferring, verify all files:

```bash
ssh pi@YOUR_PI_IP
cd ~/prism-wars

# Check file count
find . -type f | wc -l
# Should show: 10 files

# Check directory structure
tree
# or
find . -type d
```

## File Permissions

Usually not needed, but if you have permission issues:

```bash
cd ~/prism-wars
chmod 755 app.py game_logic.py lobby_manager.py
chmod -R 755 static templates
chmod 755 data/games
```

## Common Transfer Errors

**"Permission denied"**
- Ensure you're using the correct Pi username (usually `pi`)
- Check your Pi password

**"Connection refused"**
- Ensure SSH is enabled on Pi: `sudo systemctl start ssh`
- Check Pi's IP address: `hostname -I`

**"No such file or directory"**
- Create directories first: `mkdir -p ~/prism-wars/static/css ~/prism-wars/static/js ~/prism-wars/templates ~/prism-wars/data/games`

**Files missing after transfer**
- Verify transfer completed without errors
- Check file paths match exactly (case-sensitive!)
- Use `ls -la` to see hidden errors

## Next Steps

After all files are transferred:
1. ✅ Follow DEPLOYMENT_CHECKLIST.md
2. ✅ Install dependencies
3. ✅ Test with development server
4. ✅ Deploy to production

Good luck! 🚀