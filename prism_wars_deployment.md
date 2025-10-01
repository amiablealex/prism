# Prism Wars - Deployment Checklist

## 📦 Pre-Deployment

- [ ] Raspberry Pi is powered on and accessible
- [ ] You have SSH access to your Pi
- [ ] Python 3.7+ is installed (check with `python3 --version`)
- [ ] You know your Pi's IP address (run `hostname -I`)

## 📁 File Structure Setup

### 1. Create Directory Structure

```bash
mkdir -p ~/prism-wars/static/css
mkdir -p ~/prism-wars/static/js
mkdir -p ~/prism-wars/templates
mkdir -p ~/prism-wars/data/games
cd ~/prism-wars
```

### 2. Upload Files Checklist

Transfer these files to your Raspberry Pi:

**Root Directory (`~/prism-wars/`):**
- [ ] `app.py`
- [ ] `game_logic.py`
- [ ] `lobby_manager.py`
- [ ] `requirements.txt`
- [ ] `README.md`

**templates/ Directory:**
- [ ] `templates/index.html`
- [ ] `templates/lobby.html`
- [ ] `templates/game.html`

**static/css/ Directory:**
- [ ] `static/css/main.css`
- [ ] `static/css/game.css`

**static/js/ Directory:**
- [ ] `static/js/game.js`

**Verify file structure:**
```bash
cd ~/prism-wars
tree  # or: find . -type f
```

## 🔧 Installation Steps

### 3. Install Python Dependencies

```bash
cd ~/prism-wars
python3 -m pip install -r requirements.txt
```

**Verify installation:**
```bash
python3 -c "import flask, flask_socketio; print('Dependencies OK')"
```

Expected output: `Dependencies OK`

## 🧪 Testing Phase

### 4. Quick Development Test

```bash
cd ~/prism-wars
python3 app.py
```

Expected output:
```
* Running on http://0.0.0.0:5000
```

**Test in browser:**
- [ ] Open `http://YOUR_PI_IP:5000` in browser
- [ ] You should see the Prism Wars landing page
- [ ] Try creating a game
- [ ] Open another browser tab and try joining with the code

Press `Ctrl+C` to stop the development server.

## 🚀 Production Deployment

### 5. Install Nginx

```bash
sudo apt-get update
sudo apt-get install nginx -y
```

**Verify Nginx installed:**
```bash
nginx -v
```

### 6. Create Systemd Service

Create the service file:
```bash
sudo nano /etc/systemd/system/prismwars.service
```

Paste this content (adjust paths if needed):
```ini
[Unit]
Description=Prism Wars Game Server
After=network.target

[Service]
User=pi
WorkingDirectory=/home/pi/prism-wars
Environment="PATH=/home/pi/.local/bin:/usr/local/bin:/usr/bin:/bin"
ExecStart=/home/pi/.local/bin/gunicorn --worker-class eventlet -w 1 --bind 127.0.0.1:5000 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

Save: `Ctrl+O`, `Enter`, `Ctrl+X`

**Verify gunicorn path:**
```bash
which gunicorn
# If it's different from /home/pi/.local/bin/gunicorn, update the ExecStart path
```

### 7. Configure Nginx

Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/prismwars
```

Paste this content:
```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
```

Save: `Ctrl+O`, `Enter`, `Ctrl+X`

### 8. Enable Nginx Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/prismwars /etc/nginx/sites-enabled/

# Remove default site (optional but recommended)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t
```

Expected output:
```
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 9. Start Services

```bash
# Reload systemd
sudo systemctl daemon-reload

# Start and enable Prism Wars service
sudo systemctl start prismwars
sudo systemctl enable prismwars

# Restart and enable Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 10. Verify Services Running

```bash
# Check Prism Wars service
sudo systemctl status prismwars
```

Should show: `Active: active (running)`

```bash
# Check Nginx
sudo systemctl status nginx
```

Should show: `Active: active (running)`

## ✅ Post-Deployment Testing

### 11. Final Verification

**From Raspberry Pi:**
- [ ] `curl http://localhost` should return HTML

**From another device on same network:**
- [ ] Open `http://YOUR_PI_IP` in browser
- [ ] Landing page loads correctly
- [ ] Create a game
- [ ] Open another device/browser
- [ ] Join the game with the code
- [ ] Both players ready up
- [ ] Game starts correctly
- [ ] Place pieces and verify they appear
- [ ] Verify turn changes work
- [ ] Check territory colors update

## 🔍 Troubleshooting Commands

If something doesn't work:

**View Prism Wars logs:**
```bash
sudo journalctl -u prismwars -f
```

**View Nginx logs:**
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

**Restart services:**
```bash
sudo systemctl restart prismwars
sudo systemctl restart nginx
```

**Check if port 5000 is in use:**
```bash
sudo netstat -tulpn | grep 5000
```

**Check if port 80 is accessible:**
```bash
sudo netstat -tulpn | grep 80
```

## 🎉 Success Criteria

- [ ] Service runs automatically on Pi boot
- [ ] Multiple devices can access the game simultaneously
- [ ] Games persist if a player refreshes their browser
- [ ] No errors in systemd logs
- [ ] Response time is acceptable (<100ms per action)

## 📝 Optional: Firewall Configuration

If you have a firewall enabled:

```bash
sudo ufw allow 80/tcp
sudo ufw reload
sudo ufw status
```

## 🌐 Optional: Access from Internet

**Warning:** Only do this if you understand the security implications!

1. Set up port forwarding on your router: External 80 → Pi IP:80
2. Consider using a dynamic DNS service
3. **Strongly recommended:** Set up HTTPS with Let's Encrypt
4. Add rate limiting to prevent abuse

## 📊 Monitoring

**Check disk space:**
```bash
df -h
```

**Check memory usage:**
```bash
free -h
```

**Check active games:**
```bash
ls -lh ~/prism-wars/data/games/
```

**Auto-cleanup runs every time app starts** (removes games older than 7 days)

## 🎮 Ready to Play!

Your Prism Wars server is now deployed! Share your Pi's IP address with friends and start playing.

**Quick Command Reference:**
- Start: `sudo systemctl start prismwars`
- Stop: `sudo systemctl stop prismwars`
- Restart: `sudo systemctl restart prismwars`
- Logs: `sudo journalctl -u prismwars -f`
- Status: `sudo systemctl status prismwars`

Enjoy the game! 🎉