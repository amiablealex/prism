from flask import Flask, render_template, request, session, jsonify, redirect, url_for
from flask_socketio import SocketIO, emit, join_room, leave_room
import secrets
import json
from datetime import datetime, timedelta
import os
import threading
import time
from lobby_manager import LobbyManager
from game_logic import PrismWarsGame

app = Flask(__name__)
app.config['SECRET_KEY'] = secrets.token_hex(32)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Initialize managers
lobby_manager = LobbyManager()

# Ensure data directory exists
os.makedirs('data/games', exist_ok=True)

# Turn timer check thread
def check_turn_timers():
    """Background thread to check for turn timeouts"""
    while True:
        try:
            time.sleep(1)  # Check every second
            
            for game_id, game in list(lobby_manager.games.items()):
                if game.state == 'playing':
                    if game.check_turn_timeout():
                        # Turn timed out
                        game_ended = game.handle_turn_timeout()
                        
                        # Broadcast updated state
                        socketio.emit('game_state_update', game.get_state(), room=game_id)
                        
                        if game_ended and game.state == 'finished':
                            socketio.emit('game_over', {
                                'winner': game.winner,
                                'final_scores': game.get_scores(),
                                'reason': 'Player disconnections'
                            }, room=game_id)
        except Exception as e:
            print(f"Error in turn timer thread: {e}")

# Start timer thread
timer_thread = threading.Thread(target=check_turn_timers, daemon=True)
timer_thread.start()

def cleanup_old_games():
    """Remove games older than 7 days"""
    cutoff = datetime.now() - timedelta(days=7)
    for game_id in list(lobby_manager.games.keys()):
        game = lobby_manager.games[game_id]
        if hasattr(game, 'created_at') and game.created_at < cutoff:
            del lobby_manager.games[game_id]
            try:
                os.remove(f'data/games/{game_id}.json')
            except:
                pass

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/create_game', methods=['POST'])
def create_game():
    data = request.json
    username = data.get('username', 'Player')
    num_players = int(data.get('num_players', 2))
    
    if not username or len(username.strip()) == 0:
        return jsonify({'error': 'Username required'}), 400
    
    if num_players < 2 or num_players > 4:
        return jsonify({'error': 'Invalid number of players'}), 400
    
    player_id = secrets.token_hex(16)
    session['player_id'] = player_id
    
    game_id = lobby_manager.create_game(num_players)
    lobby_manager.add_player_to_game(game_id, player_id, username)
    
    return jsonify({
        'game_id': game_id,
        'player_id': player_id
    })

@app.route('/join_game', methods=['POST'])
def join_game():
    data = request.json
    game_id = data.get('game_id', '').upper()
    username = data.get('username', 'Player')
    
    if not username or len(username.strip()) == 0:
        return jsonify({'error': 'Username required'}), 400
    
    if not game_id or game_id not in lobby_manager.games:
        return jsonify({'error': 'Game not found'}), 404
    
    game = lobby_manager.games[game_id]
    
    if game.state != 'waiting':
        player_id = session.get('player_id')
        if player_id and player_id in [p['id'] for p in game.players]:
            return jsonify({
                'game_id': game_id,
                'player_id': player_id,
                'reconnect': True
            })
        return jsonify({'error': 'Game already in progress'}), 400
    
    if len(game.players) >= game.max_players:
        return jsonify({'error': 'Game is full'}), 400
    
    player_id = secrets.token_hex(16)
    session['player_id'] = player_id
    
    lobby_manager.add_player_to_game(game_id, player_id, username)
    
    return jsonify({
        'game_id': game_id,
        'player_id': player_id
    })

@app.route('/lobby/<game_id>')
def lobby(game_id):
    game_id = game_id.upper()
    if game_id not in lobby_manager.games:
        return redirect(url_for('index'))
    
    player_id = session.get('player_id')
    if not player_id:
        return redirect(url_for('index'))
    
    game = lobby_manager.games[game_id]
    if player_id not in [p['id'] for p in game.players]:
        return redirect(url_for('index'))
    
    return render_template('lobby.html', game_id=game_id, player_id=player_id)

@app.route('/game/<game_id>')
def game_view(game_id):
    game_id = game_id.upper()
    if game_id not in lobby_manager.games:
        return redirect(url_for('index'))
    
    player_id = session.get('player_id')
    if not player_id:
        return redirect(url_for('index'))
    
    game = lobby_manager.games[game_id]
    if player_id not in [p['id'] for p in game.players]:
        return redirect(url_for('index'))
    
    return render_template('game.html', game_id=game_id, player_id=player_id)

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('join_lobby')
def handle_join_lobby(data):
    game_id = data['game_id'].upper()
    player_id = data['player_id']
    
    if game_id not in lobby_manager.games:
        emit('error', {'message': 'Game not found'})
        return
    
    join_room(game_id)
    game = lobby_manager.games[game_id]
    
    emit('lobby_update', {
        'players': game.players,
        'max_players': game.max_players,
        'state': game.state
    })
    
    emit('lobby_update', {
        'players': game.players,
        'max_players': game.max_players,
        'state': game.state
    }, room=game_id)

@socketio.on('player_ready')
def handle_player_ready(data):
    game_id = data['game_id'].upper()
    player_id = data['player_id']
    
    if game_id not in lobby_manager.games:
        return
    
    game = lobby_manager.games[game_id]
    lobby_manager.set_player_ready(game_id, player_id)
    
    emit('lobby_update', {
        'players': game.players,
        'max_players': game.max_players,
        'state': game.state
    }, room=game_id)
    
    if len(game.players) >= 2 and all(p['ready'] for p in game.players):
        lobby_manager.start_game(game_id)
        save_game_state(game_id)
        
        emit('game_starting', {
            'game_id': game_id
        }, room=game_id)

@socketio.on('join_game_room')
def handle_join_game_room(data):
    game_id = data['game_id'].upper()
    player_id = data['player_id']
    
    if game_id not in lobby_manager.games:
        emit('error', {'message': 'Game not found'})
        return
    
    join_room(game_id)
    game = lobby_manager.games[game_id]
    
    emit('game_state_update', game.get_state())

@socketio.on('request_preview')
def handle_request_preview(data):
    """Handle preview request for light path visualization"""
    game_id = data['game_id'].upper()
    player_id = data['player_id']
    x = data['x']
    y = data['y']
    piece_type = data['piece_type']
    rotation = data.get('rotation', 0)
    
    if game_id not in lobby_manager.games:
        return
    
    game = lobby_manager.games[game_id]
    
    # Validate it's this player's turn
    if game.players[game.current_player]['id'] != player_id:
        return
    
    # Check if valid placement
    if x < 0 or x >= game.board_size or y < 0 or y >= game.board_size:
        return
    
    if game.board[y][x] is not None:
        return
    
    if (x, y) in game.protected_zones:
        return
    
    # Calculate preview
    try:
        preview_territory = game.calculate_light_paths_with_preview(x, y, piece_type, rotation)
        
        emit('preview_update', {
            'territory': [[list(cell) for cell in row] for row in preview_territory]
        })
    except Exception as e:
        print(f"Error calculating preview: {e}")

@socketio.on('place_piece')
def handle_place_piece(data):
    game_id = data['game_id'].upper()
    player_id = data['player_id']
    x = data['x']
    y = data['y']
    piece_type = data['piece_type']
    rotation = data.get('rotation', 0)
    
    if game_id not in lobby_manager.games:
        emit('error', {'message': 'Game not found'})
        return
    
    game = lobby_manager.games[game_id]
    
    current_player_idx = game.current_player
    if game.players[current_player_idx]['id'] != player_id:
        emit('error', {'message': 'Not your turn'})
        return
    
    success, message = game.place_piece(x, y, piece_type, rotation)
    
    if success:
        save_game_state(game_id)
        
        emit('game_state_update', game.get_state(), room=game_id)
        
        if game.state == 'finished':
            emit('game_over', {
                'winner': game.winner,
                'final_scores': game.get_scores()
            }, room=game_id)
    else:
        emit('error', {'message': message})

@socketio.on('pass_turn')
def handle_pass_turn(data):
    game_id = data['game_id'].upper()
    player_id = data['player_id']
    
    if game_id not in lobby_manager.games:
        emit('error', {'message': 'Game not found'})
        return
    
    game = lobby_manager.games[game_id]
    
    current_player_idx = game.current_player
    if game.players[current_player_idx]['id'] != player_id:
        emit('error', {'message': 'Not your turn'})
        return
    
    game.next_turn()
    
    save_game_state(game_id)
    
    emit('game_state_update', game.get_state(), room=game_id)
    
    if game.state == 'finished':
        emit('game_over', {
            'winner': game.winner,
            'final_scores': game.get_scores()
        }, room=game_id)

def save_game_state(game_id):
    """Save game state to JSON file"""
    game = lobby_manager.games[game_id]
    state = game.get_state()
    
    with open(f'data/games/{game_id}.json', 'w') as f:
        json.dump(state, f, indent=2)

if __name__ == '__main__':
    cleanup_old_games()
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
