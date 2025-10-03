let socket;
let gameState = null;
let selectedPiece = null;
let selectedRotation = 0;
let canvas, ctx;
let cellSize = 50;
let boardOffsetX = 0;
let boardOffsetY = 0;
let myPlayerIndex = -1;
let previewTerritory = null;
let lightParticles = [];
let animationFrame = null;
let timeRemaining = 60;
let timerInterval = null;

// Light beam animation
class LightParticle {
    constructor(x1, y1, x2, y2, color) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.color = color;
        this.progress = Math.random(); // Random start position
        this.speed = 0.02 + Math.random() * 0.01;
    }
    
    update() {
        this.progress += this.speed;
        if (this.progress > 1) {
            this.progress = 0;
        }
    }
    
    draw(ctx, boardOffsetX, boardOffsetY, cellSize) {
        const x = this.x1 + (this.x2 - this.x1) * this.progress;
        const y = this.y1 + (this.y2 - this.y1) * this.progress;
        
        const screenX = boardOffsetX + (x + 0.5) * cellSize;
        const screenY = boardOffsetY + (y + 0.5) * cellSize;
        
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

function initGame(gameId, playerId) {
    window.gameId = gameId;
    window.playerId = playerId;
    
    socket = io();
    
    socket.on('connect', () => {
        console.log('Connected to server');
        socket.emit('join_game_room', {
            game_id: gameId,
            player_id: playerId
        });
    });
    
    socket.on('game_state_update', (state) => {
        gameState = state;
        
        for (let i = 0; i < state.players.length; i++) {
            if (state.players[i].id === playerId) {
                myPlayerIndex = i;
                break;
            }
        }
        
        // Update light particles from beam segments
        updateLightParticles();
        
        // Update timer
        if (state.time_remaining !== undefined) {
            timeRemaining = state.time_remaining;
            updateTimerDisplay();
        }
        
        updateUI();
        renderBoard();
    });
    
    socket.on('preview_update', (data) => {
        previewTerritory = data.territory;
        renderBoard();
    });
    
    socket.on('game_over', (data) => {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        showGameOver(data);
    });
    
    socket.on('error', (data) => {
        alert(data.message);
    });
    
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleCanvasHover);
    canvas.addEventListener('mouseleave', () => {
        previewTerritory = null;
        renderBoard();
    });
    
    document.getElementById('passTurnBtn').addEventListener('click', () => {
        socket.emit('pass_turn', {
            game_id: gameId,
            player_id: playerId
        });
    });
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Start animation loop
    animate();
    
    // Start timer update interval
    timerInterval = setInterval(() => {
        if (gameState && gameState.state === 'playing') {
            timeRemaining = Math.max(0, timeRemaining - 1);
            updateTimerDisplay();
        }
    }, 1000);
}

function updateLightParticles() {
    if (!gameState || !gameState.light_beam_segments) return;
    
    // Clear old particles
    lightParticles = [];
    
    // Create particles for each beam segment
    gameState.light_beam_segments.forEach(segment => {
        // Create 3-5 particles per segment
        const numParticles = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numParticles; i++) {
            lightParticles.push(new LightParticle(
                segment.x1,
                segment.y1,
                segment.x2,
                segment.y2,
                segment.color
            ));
        }
    });
}

function animate() {
    // Update particles
    lightParticles.forEach(particle => particle.update());
    
    // Render
    renderBoard();
    
    // Continue animation
    animationFrame = requestAnimationFrame(animate);
}

function updateTimerDisplay() {
    const timerElement = document.getElementById('turnTimer');
    if (!timerElement) return;
    
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Warning colors
    if (timeRemaining <= 15) {
        timerElement.style.color = '#FF6B6B';
        timerElement.style.animation = 'pulse 1s infinite';
    } else if (timeRemaining <= 30) {
        timerElement.style.color = '#FFD93D';
        timerElement.style.animation = 'none';
    } else {
        timerElement.style.color = 'var(--text-light)';
        timerElement.style.animation = 'none';
    }
}

function resizeCanvas() {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth - 40;
    const containerHeight = container.clientHeight - 40;
    
    if (gameState) {
        const boardSize = gameState.board_size;
        cellSize = Math.min(containerWidth / (boardSize + 2), containerHeight / (boardSize + 2), 60);
        
        canvas.width = cellSize * (boardSize + 2);
        canvas.height = cellSize * (boardSize + 2);
        
        boardOffsetX = cellSize;
        boardOffsetY = cellSize;
        
        renderBoard();
    }
}

function updateUI() {
    if (!gameState) return;
    
    document.getElementById('roundNumber').textContent = gameState.round_number;
    document.getElementById('maxRounds').textContent = gameState.max_rounds;
    
    const currentPlayer = gameState.players[gameState.current_player];
    const turnIndicator = document.querySelector('.turn-indicator');
    const turnText = document.querySelector('.current-turn span');
    
    turnIndicator.style.backgroundColor = currentPlayer.color;
    turnText.textContent = `${currentPlayer.username}'s Turn`;
    
    // Update scores with breakdown
    const scoresList = document.getElementById('scoresList');
    scoresList.innerHTML = '';
    
    gameState.scores.forEach((score, idx) => {
        const scoreItem = document.createElement('div');
        scoreItem.className = 'score-item';
        if (idx === gameState.current_player) {
            scoreItem.classList.add('current-player');
        }
        
        // Check if player is disconnected
        const isDisconnected = gameState.disconnected_players && gameState.disconnected_players.includes(idx);
        if (isDisconnected) {
            scoreItem.classList.add('disconnected');
        }
        
        const breakdown = score.breakdown;
        const progressPercent = Math.min(100, (score.score / gameState.win_points) * 100);
        
        scoreItem.innerHTML = `
            <div class="score-item-left">
                <div class="score-color" style="background-color: ${score.color}"></div>
                <div class="score-details">
                    <span class="score-name">${score.player}${isDisconnected ? ' (DC)' : ''}</span>
                    <div class="score-breakdown-mini">
                        Territory: ${breakdown.base_territory} | 
                        Combos: ${breakdown.combos.total} | 
                        Objectives: ${breakdown.objectives.total}
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%; background-color: ${score.color}"></div>
                    </div>
                </div>
            </div>
            <div class="score-right">
                <span class="score-value">${score.score}</span>
                <span class="score-target">/${gameState.win_points}</span>
            </div>
        `;
        
        scoresList.appendChild(scoreItem);
    });
    
    // Update players info
    const playersInfo = document.getElementById('playersInfo');
    playersInfo.innerHTML = '';
    
    gameState.players.forEach((player, idx) => {
        const playerItem = document.createElement('div');
        playerItem.className = 'player-info-item';
        if (idx === gameState.current_player) {
            playerItem.classList.add('active');
        }
        
        const isDisconnected = gameState.disconnected_players && gameState.disconnected_players.includes(idx);
        const missedTurns = gameState.missed_turns ? gameState.missed_turns[idx] || 0 : 0;
        
        playerItem.innerHTML = `
            <div class="player-info-color" style="background-color: ${player.color}"></div>
            <span class="player-info-name">
                ${player.username}${player.id === playerId ? ' (You)' : ''}
                ${isDisconnected ? ' [REMOVED]' : missedTurns > 0 ? ` [${missedTurns}/3]` : ''}
            </span>
        `;
        
        playersInfo.appendChild(playerItem);
    });
    
    // Update inventory
    if (myPlayerIndex !== -1) {
        const inventory = gameState.player_inventory[myPlayerIndex];
        const inventoryDiv = document.getElementById('inventory');
        inventoryDiv.innerHTML = '';
        
        const pieces = [
            { type: 'mirror', icon: '🪞', label: 'Mirror' },
            { type: 'splitter', icon: '✂️', label: 'Splitter' },
            { type: 'prism', icon: '◆', label: 'Prism' },
            { type: 'blocker', icon: '⬛', label: 'Blocker' }
        ];
        
        inventoryDiv.className = 'inventory-grid';
        
        pieces.forEach(piece => {
            const count = inventory[piece.type];
            const item = document.createElement('div');
            item.className = 'inventory-item';
            
            if (count === 0) {
                item.classList.add('disabled');
            }
            
            if (selectedPiece === piece.type) {
                item.classList.add('selected');
            }
            
            item.innerHTML = `
                <div class="inventory-item-left">
                    <span class="inventory-icon">${piece.icon}</span>
                    <span class="inventory-label">${piece.label}</span>
                </div>
                <span class="inventory-count">${count}</span>
            `;
            
            if (count > 0) {
                item.addEventListener('click', () => selectPiece(piece.type, piece.label, piece.icon));
            }
            
            inventoryDiv.appendChild(item);
        });
        
        updateObjectivesDisplay();
    }
    
    updateSelectedPieceInfo();
    
    const passTurnBtn = document.getElementById('passTurnBtn');
    passTurnBtn.disabled = gameState.current_player !== myPlayerIndex;
}

function updateObjectivesDisplay() {
    const objectivesDiv = document.getElementById('objectivesDisplay');
    if (!objectivesDiv || !gameState.objectives || myPlayerIndex === -1) return;
    
    const myObjectives = gameState.objectives[myPlayerIndex];
    const myScore = gameState.scores[myPlayerIndex];
    const completedObjs = myScore.breakdown.objectives.completed;
    
    objectivesDiv.innerHTML = '<h4>Your Objectives</h4>';
    
    myObjectives.forEach(obj => {
        const isCompleted = completedObjs.some(c => c.id === obj.id);
        const objDiv = document.createElement('div');
        objDiv.className = 'objective-item' + (isCompleted ? ' completed' : '');
        objDiv.innerHTML = `
            <div class="objective-header">
                <span class="objective-icon">${isCompleted ? '✓' : '○'}</span>
                <span class="objective-name">${obj.name}</span>
                <span class="objective-points">+${obj.points}</span>
            </div>
            <div class="objective-description">${obj.description}</div>
        `;
        objectivesDiv.appendChild(objDiv);
    });
}

function selectPiece(type, label, icon) {
    selectedPiece = type;
    selectedRotation = 0;
    updateUI();
}

function updateSelectedPieceInfo() {
    const selectedPieceName = document.getElementById('selectedPieceName');
    const pieceDescription = document.getElementById('pieceDescription');
    const rotationControls = document.getElementById('rotationControls');
    
    if (selectedPiece) {
        const descriptions = {
            'mirror': 'Reflects light beams at 90° angles. Rotate to change reflection direction.',
            'prism': 'Splits light into three beams: straight, left, and right. Creates powerful area coverage. LIMITED: Only 1 per player!',
            'blocker': 'Stops light beams (penetrates first blocker only). Cannot be placed near enemy light sources.',
            'splitter': 'Splits light into two perpendicular beams. More focused than prisms.'
        };
        
        const labels = {
            'mirror': 'Mirror 🪞',
            'prism': 'Prism ◆',
            'blocker': 'Blocker ⬛',
            'splitter': 'Splitter ✂️'
        };
        
        selectedPieceName.textContent = labels[selectedPiece];
        pieceDescription.textContent = descriptions[selectedPiece];
        
        if (selectedPiece === 'mirror' || selectedPiece === 'prism') {
            rotationControls.style.display = 'flex';
            document.getElementById('rotationDisplay').textContent = selectedRotation + '°';
        } else {
            rotationControls.style.display = 'none';
        }
    } else {
        selectedPieceName.textContent = 'None';
        pieceDescription.textContent = 'Select a piece from your inventory to place it on the board.';
        rotationControls.style.display = 'none';
    }
}

function rotatePiece(degrees) {
    selectedRotation = (selectedRotation + degrees + 360) % 360;
    document.getElementById('rotationDisplay').textContent = selectedRotation + '°';
}

function handleCanvasClick(e) {
    if (!gameState || gameState.current_player !== myPlayerIndex || !selectedPiece) {
        return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const gridX = Math.floor((x - boardOffsetX) / cellSize);
    const gridY = Math.floor((y - boardOffsetY) / cellSize);
    
    if (gridX >= 0 && gridX < gameState.board_size && gridY >= 0 && gridY < gameState.board_size) {
        placePiece(gridX, gridY);
    }
}

function handleCanvasHover(e) {
    if (!gameState || gameState.current_player !== myPlayerIndex || !selectedPiece) {
        previewTerritory = null;
        return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const gridX = Math.floor((x - boardOffsetX) / cellSize);
    const gridY = Math.floor((y - boardOffsetY) / cellSize);
    
    canvas.hoverX = gridX;
    canvas.hoverY = gridY;
    
    // Request preview from server
    if (gridX >= 0 && gridX < gameState.board_size && gridY >= 0 && gridY < gameState.board_size) {
        if (gameState.board[gridY][gridX] === null && 
            !gameState.protected_zones.some(([px, py]) => px === gridX && py === gridY)) {
            
            socket.emit('request_preview', {
                game_id: gameId,
                player_id: playerId,
                x: gridX,
                y: gridY,
                piece_type: selectedPiece,
                rotation: selectedRotation
            });
        } else {
            previewTerritory = null;
        }
    } else {
        previewTerritory = null;
    }
}

function placePiece(x, y) {
    socket.emit('place_piece', {
        game_id: gameId,
        player_id: playerId,
        x: x,
        y: y,
        piece_type: selectedPiece,
        rotation: selectedRotation
    });
    
    selectedPiece = null;
    selectedRotation = 0;
    previewTerritory = null;
}

function renderBoard() {
    if (!gameState || !ctx) return;
    
    const boardSize = gameState.board_size;
    
    ctx.fillStyle = '#0f1419';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw territory (current or preview)
    const territoryToDraw = previewTerritory || gameState.territory;
    drawTerritory(territoryToDraw, !!previewTerritory);
    
    // Draw amplifier tiles
    if (gameState.amplifier_tiles) {
        gameState.amplifier_tiles.forEach(([x, y]) => {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
            ctx.fillRect(
                boardOffsetX + x * cellSize + 2,
                boardOffsetY + y * cellSize + 2,
                cellSize - 4,
                cellSize - 4
            );
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                boardOffsetX + x * cellSize + 2,
                boardOffsetY + y * cellSize + 2,
                cellSize - 4,
                cellSize - 4
            );
            
            ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('2x', 
                boardOffsetX + (x + 0.5) * cellSize,
                boardOffsetY + (y + 0.5) * cellSize
            );
        });
    }
    
    // Draw protected zones
    if (gameState.protected_zones) {
        gameState.protected_zones.forEach(([x, y]) => {
            ctx.fillStyle = 'rgba(255, 100, 100, 0.15)';
            ctx.fillRect(
                boardOffsetX + x * cellSize + 1,
                boardOffsetY + y * cellSize + 1,
                cellSize - 2,
                cellSize - 2
            );
        });
    }
    
    // Draw light beam segments
    if (gameState.light_beam_segments) {
        gameState.light_beam_segments.forEach(segment => {
            drawLightBeam(segment);
        });
    }
    
    // Draw animated light particles
    lightParticles.forEach(particle => {
        particle.draw(ctx, boardOffsetX, boardOffsetY, cellSize);
    });
    
    // Draw grid
    ctx.strokeStyle = '#2a2a4e';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= boardSize; i++) {
        ctx.beginPath();
        ctx.moveTo(boardOffsetX + i * cellSize, boardOffsetY);
        ctx.lineTo(boardOffsetX + i * cellSize, boardOffsetY + boardSize * cellSize);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(boardOffsetX, boardOffsetY + i * cellSize);
        ctx.lineTo(boardOffsetX + boardSize * cellSize, boardOffsetY + i * cellSize);
        ctx.stroke();
    }
    
    drawLightSources();
    drawPieces();
    
    if (canvas.hoverX !== undefined && canvas.hoverY !== undefined && 
        gameState.current_player === myPlayerIndex && selectedPiece) {
        drawHoverPreview(canvas.hoverX, canvas.hoverY);
    }
}

function drawLightBeam(segment) {
    const x1 = boardOffsetX + (segment.x1 + 0.5) * cellSize;
    const y1 = boardOffsetY + (segment.y1 + 0.5) * cellSize;
    const x2 = boardOffsetX + (segment.x2 + 0.5) * cellSize;
    const y2 = boardOffsetY + (segment.y2 + 0.5) * cellSize;
    
    // Draw beam line
    ctx.strokeStyle = segment.color + '40';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Draw glow
    ctx.strokeStyle = segment.color + '20';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function drawTerritory(territory, isPreview) {
    if (!territory) return;
    
    const boardSize = gameState.board_size;
    const alpha = isPreview ? '30' : '20';
    
    for (let y = 0; y < boardSize; y++) {
        for (let x = 0; x < boardSize; x++) {
            const controllers = territory[y][x];
            
            if (controllers.length === 1) {
                const playerIdx = controllers[0];
                const color = gameState.players[playerIdx].color;
                
                ctx.fillStyle = color + alpha;
                ctx.fillRect(
                    boardOffsetX + x * cellSize + 1,
                    boardOffsetY + y * cellSize + 1,
                    cellSize - 2,
                    cellSize - 2
                );
                
                // Add pulsing effect for preview
                if (isPreview) {
                    ctx.strokeStyle = color + '60';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(
                        boardOffsetX + x * cellSize + 1,
                        boardOffsetY + y * cellSize + 1,
                        cellSize - 2,
                        cellSize - 2
                    );
                }
            }
        }
    }
}

function drawLightSources() {
    if (!gameState.light_sources) return;
    
    gameState.light_sources.forEach(source => {
        // Skip disconnected players
        if (gameState.disconnected_players && gameState.disconnected_players.includes(source.player)) {
            return;
        }
        
        const x = source.x === -1 ? -0.5 : 
                  source.x === gameState.board_size ? gameState.board_size - 0.5 : 
                  source.x;
        const y = source.y === -1 ? -0.5 : 
                  source.y === gameState.board_size ? gameState.board_size - 0.5 : 
                  source.y;
        
        const centerX = boardOffsetX + (x + 0.5) * cellSize;
        const centerY = boardOffsetY + (y + 0.5) * cellSize;
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, cellSize * 0.6);
        gradient.addColorStop(0, source.color + '80');
        gradient.addColorStop(1, source.color + '00');
        ctx.fillStyle = gradient;
        ctx.fillRect(
            centerX - cellSize * 0.6,
            centerY - cellSize * 0.6,
            cellSize * 1.2,
            cellSize * 1.2
        );
        
        ctx.fillStyle = source.color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, cellSize * 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        const arrowSize = cellSize * 0.3;
        
        let angle = 0;
        switch (source.direction) {
            case 'down': angle = Math.PI / 2; break;
            case 'up': angle = -Math.PI / 2; break;
            case 'right': angle = 0; break;
            case 'left': angle = Math.PI; break;
        }
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(arrowSize * 0.3, 0);
        ctx.lineTo(arrowSize * 0.7, 0);
        ctx.moveTo(arrowSize * 0.5, -arrowSize * 0.2);
        ctx.lineTo(arrowSize * 0.7, 0);
        ctx.lineTo(arrowSize * 0.5, arrowSize * 0.2);
        ctx.stroke();
        ctx.restore();
    });
}

function drawPieces() {
    if (!gameState.board) return;
    
    const boardSize = gameState.board_size;
    
    for (let y = 0; y < boardSize; y++) {
        for (let x = 0; x < boardSize; x++) {
            const piece = gameState.board[y][x];
            if (piece) {
                drawPiece(x, y, piece);
            }
        }
    }
}

function drawPiece(x, y, piece) {
    const centerX = boardOffsetX + (x + 0.5) * cellSize;
    const centerY = boardOffsetY + (y + 0.5) * cellSize;
    const size = cellSize * 0.6;
    
    ctx.fillStyle = piece.color + '40';
    ctx.fillRect(
        centerX - size / 2,
        centerY - size / 2,
        size,
        size
    );
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((piece.rotation || 0) * Math.PI / 180);
    
    ctx.fillStyle = piece.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    if (piece.type === 'mirror') {
        ctx.beginPath();
        ctx.moveTo(-size / 2, -size / 2);
        ctx.lineTo(size / 2, size / 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(-size / 3, -size / 3, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(size / 3, size / 3, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
    } else if (piece.type === 'prism') {
        ctx.beginPath();
        ctx.moveTo(0, -size / 2);
        ctx.lineTo(-size / 2, size / 2);
        ctx.lineTo(size / 2, size / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    } else if (piece.type === 'blocker') {
        ctx.fillRect(-size / 2, -size / 2, size, size);
        ctx.strokeRect(-size / 2, -size / 2, size, size);
    } else if (piece.type === 'splitter') {
        ctx.beginPath();
        ctx.moveTo(-size / 2, -size / 2);
        ctx.lineTo(size / 2, size / 2);
        ctx.moveTo(-size / 2, size / 2);
        ctx.lineTo(size / 2, -size / 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
}

function drawHoverPreview(x, y) {
    if (x < 0 || x >= gameState.board_size || y < 0 || y >= gameState.board_size) {
        return;
    }
    
    if (gameState.board[y][x] !== null) {
        return;
    }
    
    if (gameState.protected_zones && gameState.protected_zones.some(([px, py]) => px === x && py === y)) {
        return;
    }
    
    const centerX = boardOffsetX + (x + 0.5) * cellSize;
    const centerY = boardOffsetY + (y + 0.5) * cellSize;
    const size = cellSize * 0.6;
    
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = gameState.players[myPlayerIndex].color + '60';
    ctx.fillRect(
        centerX - size / 2,
        centerY - size / 2,
        size,
        size
    );
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(selectedRotation * Math.PI / 180);
    
    ctx.strokeStyle = gameState.players[myPlayerIndex].color;
    ctx.lineWidth = 2;
    
    if (selectedPiece === 'mirror') {
        ctx.beginPath();
        ctx.moveTo(-size / 2, -size / 2);
        ctx.lineTo(size / 2, size / 2);
        ctx.stroke();
    } else if (selectedPiece === 'prism') {
        ctx.beginPath();
        ctx.moveTo(0, -size / 2);
        ctx.lineTo(-size / 2, size / 2);
        ctx.lineTo(size / 2, size / 2);
        ctx.closePath();
        ctx.stroke();
    } else if (selectedPiece === 'blocker') {
        ctx.strokeRect(-size / 2, -size / 2, size, size);
    } else if (selectedPiece === 'splitter') {
        ctx.beginPath();
        ctx.moveTo(-size / 2, -size / 2);
        ctx.lineTo(size / 2, size / 2);
        ctx.moveTo(-size / 2, size / 2);
        ctx.lineTo(size / 2, -size / 2);
        ctx.stroke();
    }
    
    ctx.restore();
    ctx.globalAlpha = 1;
}

function showGameOver(data) {
    const modal = document.getElementById('gameOverModal');
    const winnerInfo = document.getElementById('winnerInfo');
    const finalScores = document.getElementById('finalScores');
    
    if (data.winner.username === 'Tie') {
        winnerInfo.innerHTML = `
            <div class="winner-name">It's a Tie!</div>
            <p>Multiple players share the victory!</p>
        `;
    } else {
        const breakdown = data.winner.breakdown;
        winnerInfo.innerHTML = `
            <div class="winner-name">${data.winner.username} Wins!</div>
            <p style="color: ${data.winner.color}">Total Score: ${data.winner.score} points</p>
            ${breakdown ? `
                <div class="winner-breakdown">
                    <p>Territory: ${breakdown.base_territory}</p>
                    <p>Combos: ${breakdown.combos.total}</p>
                    <p>Objectives: ${breakdown.objectives.total}</p>
                </div>
            ` : ''}
            ${data.reason ? `<p style="color: #FFD93D; margin-top: 10px;">${data.reason}</p>` : ''}
        `;
    }
    
    finalScores.innerHTML = '<h3>Final Scores</h3>';
    
    data.final_scores.forEach(score => {
        const isWinner = score.score === data.winner.score;
        const scoreItem = document.createElement('div');
        scoreItem.className = 'final-score-item';
        if (isWinner) {
            scoreItem.classList.add('winner');
        }
        
        const breakdown = score.breakdown;
        scoreItem.innerHTML = `
            <div class="final-score-left">
                <div class="final-score-color" style="background-color: ${score.color}"></div>
                <div>
                    <div>${score.player}</div>
                    <small style="color: #999">
                        T:${breakdown.base_territory} | C:${breakdown.combos.total} | O:${breakdown.objectives.total}
                    </small>
                </div>
            </div>
            <span class="final-score-value">${score.score}</span>
        `;
        
        finalScores.appendChild(scoreItem);
    });
    
    modal.classList.add('show');
}
