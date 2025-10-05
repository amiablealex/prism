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
let heartbeatInterval = null;
let connectionStatus = 'connected';

// Visual control states
let showBeams = true;
let showParticles = true;
let showTerritory = true;
let showOtherPlayers = true;
let highlightMyLight = false;
let showOnlyActivePlayer = false;
let pickupMode = false;
let portalPlacementInProgress = false;

// Session persistence functions
function saveSession(gameId, playerId, playerName) {
    const session = {
        gameId: gameId,
        playerId: playerId,
        playerName: playerName,
        lastActive: Date.now()
    };
    localStorage.setItem('prismwars_session', JSON.stringify(session));
}

function getSession() {
    const stored = localStorage.getItem('prismwars_session');
    if (!stored) return null;
    
    const session = JSON.parse(stored);
    const hoursSinceActive = (Date.now() - session.lastActive) / (1000 * 60 * 60);
    
    if (hoursSinceActive > 6) {
        clearSession();
        return null;
    }
    
    return session;
}

function clearSession() {
    localStorage.removeItem('prismwars_session');
}

function updateSessionActivity() {
    const session = getSession();
    if (session) {
        session.lastActive = Date.now();
        localStorage.setItem('prismwars_session', JSON.stringify(session));
    }
}

// Light beam animation class
class LightParticle {
    constructor(x1, y1, x2, y2, color, player) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.color = color;
        this.player = player;
        this.progress = Math.random();
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
    
    saveSession(gameId, playerId, 'Player');
    
    socket = io();
    
    socket.on('connect', () => {
        console.log('Connected to server');
        connectionStatus = 'connected';
        updateConnectionStatus();
        
        socket.emit('join_game_room', {
            game_id: gameId,
            player_id: playerId
        });
        
        startHeartbeat();
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        connectionStatus = 'disconnected';
        updateConnectionStatus();
        
        setTimeout(() => {
            if (connectionStatus === 'disconnected') {
                socket.connect();
            }
        }, 2000);
    });
    
    socket.on('connect_error', () => {
        connectionStatus = 'error';
        updateConnectionStatus();
    });
    
    socket.on('game_state_update', (state) => {
        gameState = state;
        
        for (let i = 0; i < state.players.length; i++) {
            if (state.players[i].id === playerId) {
                myPlayerIndex = i;
                break;
            }
        }

        // Check if portal placement in progress
        if (state.portal_placement_in_progress && 
            state.portal_placement_in_progress.player === myPlayerIndex) {
            portalPlacementInProgress = true;
        } else {
            portalPlacementInProgress = false;
        }
        
        updateLightParticles();
        
        if (state.time_remaining !== undefined) {
            timeRemaining = state.time_remaining;
            updateTimerDisplay();
        }
        
        updateUI();
        renderBoard();
        updateSessionActivity();

        setTimeout(() => {
            resizeCanvas();
        }, 100);
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
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
        }
        clearSession();
        showGameOver(data);
    });
    
    socket.on('error', (data) => {
        showNotification(data.message, 'error');
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

    document.getElementById('cancelPortalBtn').addEventListener('click', () => {
        socket.emit('cancel_portal', {
            game_id: gameId,
            player_id: playerId
        });
        selectedPiece = null;
        portalPlacementInProgress = false;
    });
    
    document.getElementById('togglePickupMode').addEventListener('click', togglePickupMode);
    document.getElementById('toggleBeams').addEventListener('click', () => toggleVisual('beams'));
    document.getElementById('toggleParticles').addEventListener('click', () => toggleVisual('particles'));
    document.getElementById('toggleTerritory').addEventListener('click', () => toggleVisual('territory'));
    document.getElementById('toggleOtherPlayers').addEventListener('click', () => toggleVisual('others'));
    document.getElementById('highlightMyLightBtn').addEventListener('click', toggleHighlightMyLight);
    document.getElementById('showActivePlayerBtn').addEventListener('click', toggleShowActivePlayer);
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    animate();
    
    timerInterval = setInterval(() => {
        if (gameState && gameState.state === 'playing') {
            timeRemaining = Math.max(0, timeRemaining - 1);
            updateTimerDisplay();
        }
    }, 1000);
}

function startHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }
    
    heartbeatInterval = setInterval(() => {
        if (socket && socket.connected && window.gameId && window.playerId) {
            socket.emit('heartbeat', {
                game_id: window.gameId,
                player_id: window.playerId
            });
        }
    }, 10000);
}

function updateConnectionStatus() {
    const indicator = document.getElementById('connectionStatus');
    if (!indicator) return;
    
    indicator.className = 'connection-status';
    
    if (connectionStatus === 'connected') {
        indicator.classList.add('connected');
        indicator.textContent = '● Connected';
    } else if (connectionStatus === 'disconnected') {
        indicator.classList.add('disconnected');
        indicator.textContent = '● Reconnecting...';
    } else {
        indicator.classList.add('error');
        indicator.textContent = '● Connection Error';
    }
}

function togglePickupMode() {
    pickupMode = !pickupMode;
    const btn = document.getElementById('togglePickupMode');
    
    if (pickupMode) {
        btn.classList.add('active');
        btn.textContent = '🔄 Pickup Mode: ON';
        selectedPiece = null;
        showNotification('Click your pieces to pick them up', 'info');
    } else {
        btn.classList.remove('active');
        btn.textContent = '🔄 Pickup Mode: OFF';
    }
    
    updateUI();
}

function toggleVisual(type) {
    switch(type) {
        case 'beams':
            showBeams = !showBeams;
            document.getElementById('toggleBeams').classList.toggle('active');
            break;
        case 'particles':
            showParticles = !showParticles;
            document.getElementById('toggleParticles').classList.toggle('active');
            break;
        case 'territory':
            showTerritory = !showTerritory;
            document.getElementById('toggleTerritory').classList.toggle('active');
            break;
        case 'others':
            showOtherPlayers = !showOtherPlayers;
            document.getElementById('toggleOtherPlayers').classList.toggle('active');
            break;
    }
    renderBoard();
}

function toggleHighlightMyLight() {
    highlightMyLight = !highlightMyLight;
    showOnlyActivePlayer = false;
    
    const btn = document.getElementById('highlightMyLightBtn');
    const activeBtn = document.getElementById('showActivePlayerBtn');
    
    if (highlightMyLight) {
        btn.classList.add('active');
        activeBtn.classList.remove('active');
    } else {
        btn.classList.remove('active');
    }
    
    renderBoard();
}

function toggleShowActivePlayer() {
    showOnlyActivePlayer = !showOnlyActivePlayer;
    highlightMyLight = false;
    
    const btn = document.getElementById('showActivePlayerBtn');
    const myLightBtn = document.getElementById('highlightMyLightBtn');
    
    if (showOnlyActivePlayer) {
        btn.classList.add('active');
        myLightBtn.classList.remove('active');
    } else {
        btn.classList.remove('active');
    }
    
    renderBoard();
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function updateLightParticles() {
    if (!gameState || !gameState.light_beam_segments) return;
    
    lightParticles = [];
    
    gameState.light_beam_segments.forEach(segment => {
        const numParticles = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numParticles; i++) {
            lightParticles.push(new LightParticle(
                segment.x1,
                segment.y1,
                segment.x2,
                segment.y2,
                segment.color,
                segment.player
            ));
        }
    });
}

function animate() {
    if (showParticles) {
        lightParticles.forEach(particle => particle.update());
    }
    
    renderBoard();
    
    animationFrame = requestAnimationFrame(animate);
}

function updateTimerDisplay() {
    const timerElement = document.getElementById('turnTimer');
    if (!timerElement) return;
    
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    if (timeRemaining <= 15) {
        timerElement.style.color = '#FF6B6B';
        timerElement.style.animation = 'pulse-timer 1s infinite';
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
        cellSize = Math.min(containerWidth / (boardSize + 2), containerHeight / (boardSize + 2), 50);
        
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

    // Replace scores + players update with consolidated scoreboard
    const scoresList = document.getElementById('scoresList');
    scoresList.innerHTML = '';
    
    gameState.scores.forEach((score, idx) => {
        const scoreItem = document.createElement('div');
        scoreItem.className = 'scoreboard-item';
        
        if (idx === gameState.current_player) {
            scoreItem.classList.add('current-player');
        }
        
        const isDisconnected = gameState.disconnected_players?.includes(idx);
        if (isDisconnected) {
            scoreItem.classList.add('disconnected');
        }
        
        const player = gameState.players[idx];
        const missedTurns = gameState.missed_turns?.[idx] || 0;
        const breakdown = score.breakdown;
        const progressPercent = Math.min(100, (score.score / gameState.win_points) * 100);
        
        let statusText = '';
        if (player.id === playerId) statusText = '(You)';
        if (idx === gameState.current_player) statusText += ' [Active]';
        if (isDisconnected) statusText = '[REMOVED]';
        else if (missedTurns > 0) statusText += ` [${missedTurns}/3]`;

        const playerEnergy = gameState.player_energy[idx];
        
        scoreItem.innerHTML = `
            <div class="scoreboard-left">
                <div class="scoreboard-color" style="background-color: ${score.color}"></div>
                <div class="scoreboard-info">
                    <div class="scoreboard-name">
                        ${score.player}
                        ${statusText ? `<span class="scoreboard-status">${statusText}</span>` : ''}
                    </div>
                    <div class="scoreboard-breakdown">
                        ⚡${playerEnergy} | T:${breakdown.base_territory} | C:${breakdown.combos.total} | O:${breakdown.objectives.total}
                    </div>        
                    <div class="scoreboard-progress">
                        <div class="scoreboard-progress-fill" style="width: ${progressPercent}%; background-color: ${score.color}"></div>
                    </div>
                </div>
            </div>
            <div class="scoreboard-right">
                <span class="scoreboard-score">${score.score}</span>
                <span class="scoreboard-target">/${gameState.win_points}</span>
            </div>
        `;
        
        scoresList.appendChild(scoreItem);
    });
    
    // Update inventory and energy
    if (myPlayerIndex !== -1) {
        const inventory = gameState.player_inventory[myPlayerIndex];
        const energy = gameState.player_energy[myPlayerIndex];
        
        // Update energy display
        document.getElementById('energyDisplay').textContent = energy;
        document.getElementById('energyGain').textContent = `+${gameState.energy_per_turn} per turn`;
        
        const inventoryDiv = document.getElementById('inventory');
        inventoryDiv.innerHTML = '';

        const pieces = [
            { type: 'mirror', icon: '🪞', label: 'Mirror', cost: gameState.piece_costs.mirror },
            { type: 'splitter', icon: '✂️', label: 'Splitter', cost: gameState.piece_costs.splitter },
            { type: 'prism', icon: '◆', label: 'Prism', cost: gameState.piece_costs.prism },
            { type: 'blocker', icon: '⬛', label: 'Blocker', cost: gameState.piece_costs.blocker },
            { type: 'portal', icon: '🌀', label: 'Portal Pair', cost: gameState.piece_costs.portal }
        ];
        
        inventoryDiv.className = 'inventory-grid';
        
        pieces.forEach(piece => {
            const count = inventory[piece.type];
            const canAfford = energy >= piece.cost;
            
            const item = document.createElement('div');
            item.className = 'inventory-item';
            
            if (count === 0 || !canAfford || pickupMode) {
                item.classList.add('disabled');
            }
            
            if (selectedPiece === piece.type && !pickupMode) {
                item.classList.add('selected');
            }
            
            item.innerHTML = `
                <div class="inventory-item-left">
                    <span class="inventory-icon">${piece.icon}</span>
                    <div class="inventory-details">
                        <span class="inventory-label">${piece.label}</span>
                        <span class="inventory-cost">⚡${piece.cost}</span>
                    </div>
                </div>
                <span class="inventory-count">${count}</span>
            `;
            
            if (count > 0 && canAfford && !pickupMode) {
                item.addEventListener('click', () => selectPiece(piece.type, piece.label, piece.icon));
            }
            
            inventoryDiv.appendChild(item);
        });
        
        updateObjectivesDisplay();
        updateCombosDisplay();
    }
    
    updateSelectedPieceInfo();

    const passTurnBtn = document.getElementById('passTurnBtn');
    const cancelPortalBtn = document.getElementById('cancelPortalBtn');
    
    if (portalPlacementInProgress) {
        passTurnBtn.style.display = 'none';
        cancelPortalBtn.style.display = 'block';
    } else {
        passTurnBtn.style.display = 'block';
        cancelPortalBtn.style.display = 'none';
        passTurnBtn.disabled = gameState.current_player !== myPlayerIndex;
    }    
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

function updateCombosDisplay() {
    const combosDiv = document.getElementById('combosDisplay');
    if (!combosDiv || myPlayerIndex === -1) return;
    
    const myScore = gameState.scores[myPlayerIndex];
    const combos = myScore.breakdown.combos;
    
    combosDiv.innerHTML = '<h4>Combo Bonuses</h4>';
    
    // Mirror Chain - show potential or actual
    const mirrorCombo = document.createElement('div');
    mirrorCombo.className = 'combo-item' + (combos.perfect_reflection > 0 ? ' active' : '');
    const mirrorPoints = combos.perfect_reflection > 0 ? `+${combos.perfect_reflection}` : '+5';
    const mirrorClass = combos.perfect_reflection > 0 ? '' : ' potential';
    
    mirrorCombo.innerHTML = `
        <div class="combo-header">
            <span class="combo-icon">${combos.perfect_reflection > 0 ? '✓' : '○'}</span>
            <span class="combo-name">Perfect Reflection</span>
            <span class="combo-points${mirrorClass}">${mirrorPoints}</span>
        </div>
        <div class="combo-description">Chain 3+ mirrors in a light beam</div>
    `;
    combosDiv.appendChild(mirrorCombo);
    
    // Longest Beam - show potential or actual
    const beamCombo = document.createElement('div');
    beamCombo.className = 'combo-item' + (combos.longest_beam > 0 ? ' active' : '');
    const beamPoints = combos.longest_beam > 0 ? `+${combos.longest_beam}` : '+10';
    const beamClass = combos.longest_beam > 0 ? '' : ' potential';
    
    beamCombo.innerHTML = `
        <div class="combo-header">
            <span class="combo-icon">${combos.longest_beam > 0 ? '✓' : '○'}</span>
            <span class="combo-name">Longest Beam</span>
            <span class="combo-points${beamClass}">${beamPoints}</span>
        </div>
        <div class="combo-description">Have the longest beam on the board (8+ cells)</div>
    `;
    combosDiv.appendChild(beamCombo);
    
    // Details if any combos active
    if (combos.details && combos.details.length > 0) {
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'combo-details';
        detailsDiv.innerHTML = combos.details.map(d => `<div class="combo-detail">• ${d}</div>`).join('');
        combosDiv.appendChild(detailsDiv);
    }
}

function selectPiece(type, label, icon) {
    if (pickupMode) return;
    
    selectedPiece = type;
    selectedRotation = 0;
    updateUI();
}

function updateSelectedPieceInfo() {
    const selectedPieceName = document.getElementById('selectedPieceName');
    const pieceDescription = document.getElementById('pieceDescription');
    const rotationControls = document.getElementById('rotationControls');
    
    if (pickupMode) {
        selectedPieceName.textContent = 'Pickup Mode';
        pieceDescription.textContent = `Click your own pieces to pick them up (costs ${gameState?.pickup_cost || 1} energy). Picking up doesn't end your turn.`;
        rotationControls.style.display = 'none';
        return;
    }
    
    if (selectedPiece) {
        const descriptions = {
            'mirror': 'Reflects light at 90°. Rotate to change direction. Placing ends your turn.',
            'prism': 'Splits into 3 beams. Creates powerful area coverage. Only 1 per player! Placing ends your turn.',
            'blocker': 'Completely stops light. Cannot be placed within 3 cells of light sources. Placing ends your turn.',
            'splitter': 'Splits into 2 perpendicular beams. More focused than prisms. Placing ends your turn.',
            'portal': 'Place on border edges. Light entering one portal exits out of the other. Costs 6 energy for the pair. Place both in one turn (2nd placement ends turn).'
        };
        
        const labels = {
            'mirror': 'Mirror 🪞',
            'prism': 'Prism ◆',
            'blocker': 'Blocker ⬛',
            'splitter': 'Splitter ✂️',
            'portal': 'Portal Pair 🌀'
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
        pieceDescription.textContent = 'Select a piece from your inventory. Placing a piece ends your turn immediately. Save energy by passing to place expensive pieces later.';
        rotationControls.style.display = 'none';
    }
}

function rotatePiece(degrees) {
    selectedRotation = (selectedRotation + degrees + 360) % 360;
    document.getElementById('rotationDisplay').textContent = selectedRotation + '°';
}

function handleCanvasClick(e) {
    if (!gameState || gameState.current_player !== myPlayerIndex) {
        return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const gridX = Math.floor((x - boardOffsetX) / cellSize);
    const gridY = Math.floor((y - boardOffsetY) / cellSize);
    
    if (gridX >= 0 && gridX < gameState.board_size && gridY >= 0 && gridY < gameState.board_size) {
        if (pickupMode) {
            pickupPiece(gridX, gridY);
        } else if (portalPlacementInProgress) {
            // If portal placement in progress, force portal placement
            const isBorder = (gridX === 0 || gridX === gameState.board_size - 1 || 
                             gridY === 0 || gridY === gameState.board_size - 1);
            if (!isBorder) {
                showNotification('Portals must be placed on border edges', 'error');
                return;
            }
            // Auto-select portal for second placement
            selectedPiece = 'portal';
            placePiece(gridX, gridY);
        } else if (selectedPiece) {
            // Check if placing on border for portals
            if (selectedPiece === 'portal') {
                const isBorder = (gridX === 0 || gridX === gameState.board_size - 1 || 
                                 gridY === 0 || gridY === gameState.board_size - 1);
                if (!isBorder) {
                    showNotification('Portals must be placed on border edges', 'error');
                    return;
                }
            }
            placePiece(gridX, gridY);
        }
    }
}

function handleCanvasHover(e) {
    if (!gameState || gameState.current_player !== myPlayerIndex || pickupMode) {
        previewTerritory = null;
        return;
    }
    
    if (!selectedPiece) {
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
    
    if (gridX >= 0 && gridX < gameState.board_size && gridY >= 0 && gridY < gameState.board_size) {
        if (gameState.board[gridY][gridX] === null) {
            // Check if valid based on piece type
            let isValid = true;
            
            if (selectedPiece === 'blocker') {
                isValid = !gameState.blocker_exclusion_zones.some(([px, py]) => px === gridX && py === gridY);
            } else {
                isValid = !gameState.protected_zones.some(([px, py]) => px === gridX && py === gridY);
            }
            
            if (isValid) {
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
    } else {
        previewTerritory = null;
    }
}

function pickupPiece(x, y) {
    socket.emit('pickup_piece', {
        game_id: gameId,
        player_id: playerId,
        x: x,
        y: y
    });
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
    
    // Draw territory
    if (showTerritory) {
        const territoryToDraw = previewTerritory || gameState.territory;
        drawTerritory(territoryToDraw, !!previewTerritory);
    }
    
    // Draw amplifier tiles (3x multiplier)
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
            ctx.fillText('3x', 
                boardOffsetX + (x + 0.5) * cellSize,
                boardOffsetY + (y + 0.5) * cellSize
            );
        });
    }
    
    // Draw protected zones
    if (gameState.protected_zones) {
        gameState.protected_zones.forEach(([x, y]) => {
            ctx.fillStyle = 'rgba(255, 100, 100, 0.12)';
            ctx.fillRect(
                boardOffsetX + x * cellSize + 1,
                boardOffsetY + y * cellSize + 1,
                cellSize - 2,
                cellSize - 2
            );
        });
    }
    
    // Draw blocker exclusion zones (darker/more visible)
    if (gameState.blocker_exclusion_zones && selectedPiece === 'blocker') {
        gameState.blocker_exclusion_zones.forEach(([x, y]) => {
            ctx.fillStyle = 'rgba(255, 50, 50, 0.25)';
            ctx.fillRect(
                boardOffsetX + x * cellSize + 1,
                boardOffsetY + y * cellSize + 1,
                cellSize - 2,
                cellSize - 2
            );
        });
    }
    
    // Draw light beam segments
    if (showBeams && gameState.light_beam_segments) {
        gameState.light_beam_segments.forEach(segment => {
            if (shouldDrawBeam(segment.player)) {
                drawLightBeam(segment);
            }
        });
    }
    
    // Draw animated light particles
    if (showParticles) {
        lightParticles.forEach(particle => {
            if (shouldDrawBeam(particle.player)) {
                particle.draw(ctx, boardOffsetX, boardOffsetY, cellSize);
            }
        });
    }
    
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

    drawCenterZone();
    drawLightSources();
    drawPieces();
    
    if (canvas.hoverX !== undefined && canvas.hoverY !== undefined && 
        gameState.current_player === myPlayerIndex && selectedPiece && !pickupMode) {
        drawHoverPreview(canvas.hoverX, canvas.hoverY);
    }
}

function shouldDrawBeam(playerIdx) {
    if (!showOtherPlayers && playerIdx !== myPlayerIndex) {
        return false;
    }
    
    if (showOnlyActivePlayer) {
        return playerIdx === gameState.current_player;
    }
    
    return true;
}

function getBeamOpacity(playerIdx) {
    if (highlightMyLight) {
        return playerIdx === myPlayerIndex ? '60' : '20';
    }
    
    if (showOnlyActivePlayer) {
        return playerIdx === gameState.current_player ? '60' : '15';
    }
    
    return '40';
}

function drawLightBeam(segment) {
    const x1 = boardOffsetX + (segment.x1 + 0.5) * cellSize;
    const y1 = boardOffsetY + (segment.y1 + 0.5) * cellSize;
    const x2 = boardOffsetX + (segment.x2 + 0.5) * cellSize;
    const y2 = boardOffsetY + (segment.y2 + 0.5) * cellSize;
    
    const opacity = getBeamOpacity(segment.player);
    
    ctx.strokeStyle = segment.color + opacity;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    const glowOpacity = parseInt(opacity, 16) / 2;
    ctx.strokeStyle = segment.color + Math.floor(glowOpacity).toString(16).padStart(2, '0');
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
                
                if (!showOtherPlayers && playerIdx !== myPlayerIndex) {
                    continue;
                }
                
                const color = gameState.players[playerIdx].color;
                
                ctx.fillStyle = color + alpha;
                ctx.fillRect(
                    boardOffsetX + x * cellSize + 1,
                    boardOffsetY + y * cellSize + 1,
                    cellSize - 2,
                    cellSize - 2
                );
                
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

// Remaining render functions (drawLightSources, drawPieces, drawPiece, drawHoverPreview, showGameOver)
// are identical to v4.0, keeping them as-is for brevity

function drawLightSources() {
    if (!gameState.light_sources) return;
    
    gameState.light_sources.forEach(source => {
        if (gameState.disconnected_players && gameState.disconnected_players.includes(source.player)) {
            return;
        }
        
        if (!showOtherPlayers && source.player !== myPlayerIndex) {
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

function drawCenterZone() {
    if (!gameState) return;
    
    // For 16x16 board, center is (7,7), (8,7), (7,8), (8,8)
    const centerX = 7;
    const centerY = 7;
    const centerSize = 2; // 2x2 area
    
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)'; // Subtle gold
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]); // Dashed line
    
    ctx.strokeRect(
        boardOffsetX + centerX * cellSize,
        boardOffsetY + centerY * cellSize,
        centerSize * cellSize,
        centerSize * cellSize
    );
    
    ctx.setLineDash([]); // Reset dash
}

function drawPieces() {
    if (!gameState.board) return;
    
    const boardSize = gameState.board_size;
    
    for (let y = 0; y < boardSize; y++) {
        for (let x = 0; x < boardSize; x++) {
            const piece = gameState.board[y][x];
            if (piece) {
                if (!showOtherPlayers && piece.player !== myPlayerIndex) {
                    continue;
                }
                
                const isLastPlaced = gameState.last_piece_placement && 
                                    gameState.last_piece_placement[0] === x && 
                                    gameState.last_piece_placement[1] === y;
                
                drawPiece(x, y, piece, isLastPlaced);
            }
        }
    }
}

function drawPiece(x, y, piece, isLastPlaced = false) {
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
    } else if (piece.type === 'portal') {
        // Draw swirling portal effect
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size / 2);
        gradient.addColorStop(0, piece.color + 'FF');
        gradient.addColorStop(0.5, piece.color + '88');
        gradient.addColorStop(1, piece.color + '22');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw portal ring
        ctx.strokeStyle = piece.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, size / 2.5, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw inner swirl
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, size / 4, 0, Math.PI * 1.5);
        ctx.stroke();
    }
    
    ctx.restore();

    if (isLastPlaced) {
        ctx.strokeStyle = '#FFD93D';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
            centerX - size / 2 - 3,
            centerY - size / 2 - 3,
            size + 6,
            size + 6
        );
        ctx.setLineDash([]);
    }
}

function drawHoverPreview(x, y) {
    if (x < 0 || x >= gameState.board_size || y < 0 || y >= gameState.board_size) {
        return;
    }
    
    if (gameState.board[y][x] !== null) {
        return;
    }
    
    // Check appropriate zone based on piece type
    if (selectedPiece === 'blocker') {
        if (gameState.blocker_exclusion_zones && gameState.blocker_exclusion_zones.some(([px, py]) => px === x && py === y)) {
            return;
        }
    } else {
        if (gameState.protected_zones && gameState.protected_zones.some(([px, py]) => px === x && py === y)) {
            return;
        }
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
    } else if (selectedPiece === 'portal') {
        // Draw portal preview
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = gameState.players[myPlayerIndex].color;
        ctx.fillText('🌀', 0, 0);
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
        
        let objectivesHTML = '';
        if (breakdown && breakdown.objectives && breakdown.objectives.completed.length > 0) {
            objectivesHTML = '<div class="winner-objectives">';
            breakdown.objectives.completed.forEach(obj => {
                objectivesHTML += `
                    <div class="winner-objective-item">
                        <span class="winner-objective-icon">✓</span>
                        <span class="winner-objective-name">${obj.name}</span>
                        <span class="winner-objective-points">+${obj.points}</span>
                    </div>
                `;
            });
            objectivesHTML += '</div>';
        }
        
        let combosHTML = '';
        if (breakdown && breakdown.combos && breakdown.combos.details.length > 0) {
            combosHTML = '<div class="winner-combos">';
            breakdown.combos.details.forEach(detail => {
                combosHTML += `<div class="winner-combo-detail">• ${detail}</div>`;
            });
            combosHTML += '</div>';
        }
        
        winnerInfo.innerHTML = `
            <div class="winner-name">${data.winner.username} Wins!</div>
            <p style="color: ${data.winner.color}; font-size: 1.5rem; font-weight: 700;">Total Score: ${data.winner.score} points</p>
            ${breakdown ? `
                <div class="winner-breakdown">
                    <div class="winner-breakdown-section">
                        <h4>Territory</h4>
                        <p class="winner-breakdown-value">${breakdown.base_territory} points</p>
                    </div>
                    
                    ${breakdown.objectives.total > 0 ? `
                        <div class="winner-breakdown-section">
                            <h4>Objectives (${breakdown.objectives.total} points)</h4>
                            ${objectivesHTML}
                        </div>
                    ` : ''}
                    
                    ${breakdown.combos.total > 0 ? `
                        <div class="winner-breakdown-section">
                            <h4>Combos (${breakdown.combos.total} points)</h4>
                            ${combosHTML}
                        </div>
                    ` : ''}
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

// Check for session on page load
window.addEventListener('DOMContentLoaded', () => {
    // This is handled by the HTML template
});
