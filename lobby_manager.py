import secrets
import string
from datetime import datetime
from game_logic import PrismWarsGame

class LobbyManager:
    def __init__(self):
        self.games = {}  # game_id -> PrismWarsGame
    
    def generate_game_id(self):
        """Generate a unique 6-character game ID"""
        while True:
            game_id = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
            if game_id not in self.games:
                return game_id
    
    def create_game(self, max_players=2):
        """Create a new game lobby"""
        game_id = self.generate_game_id()
        game = PrismWarsGame(game_id, max_players)
        game.created_at = datetime.now()
        self.games[game_id] = game
        return game_id
    
    def add_player_to_game(self, game_id, player_id, username):
        """Add a player to a game lobby"""
        if game_id not in self.games:
            return False
        
        game = self.games[game_id]
        
        if game.state != 'waiting':
            return False
        
        if len(game.players) >= game.max_players:
            return False
        
        # Check if player already in game (reconnection)
        for player in game.players:
            if player['id'] == player_id:
                return True
        
        # Assign color based on player index
        colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#A855F7']
        color = colors[len(game.players)]
        
        player = {
            'id': player_id,
            'username': username,
            'color': color,
            'ready': False
        }
        
        game.players.append(player)
        return True
    
    def set_player_ready(self, game_id, player_id):
        """Mark a player as ready"""
        if game_id not in self.games:
            return False
        
        game = self.games[game_id]
        
        for player in game.players:
            if player['id'] == player_id:
                player['ready'] = True
                return True
        
        return False
    
    def start_game(self, game_id):
        """Start the game"""
        if game_id not in self.games:
            return False
        
        game = self.games[game_id]
        
        if game.state != 'waiting':
            return False
        
        if len(game.players) < 2:
            return False
        
        if not all(p['ready'] for p in game.players):
            return False
        
        game.initialize_board()
        game.state = 'playing'
        game.started_at = datetime.now()
        return True
    
    def get_game(self, game_id):
        """Get a game by ID"""
        return self.games.get(game_id)
    
    def remove_game(self, game_id):
        """Remove a game from the manager"""
        if game_id in self.games:
            del self.games[game_id]
            return True
        return False