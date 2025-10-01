from datetime import datetime

class PrismWarsGame:
    def __init__(self, game_id, max_players=2):
        self.game_id = game_id
        self.max_players = max_players
        self.players = []
        self.state = 'waiting'  # waiting, playing, finished
        self.board_size = 12
        self.board = []  # Will be initialized when game starts
        self.light_sources = []
        self.current_player = 0
        self.round_number = 1
        self.max_rounds = 20
        self.winner = None
        self.pieces_per_player = {
            'mirror': 15,
            'prism': 8,
            'blocker': 10
        }
        self.player_inventory = []  # Track remaining pieces per player
        
    def initialize_board(self):
        """Initialize the game board and light sources"""
        # Create empty board
        self.board = [[None for _ in range(self.board_size)] for _ in range(self.board_size)]
        
        # Initialize player inventories
        self.player_inventory = []
        for _ in self.players:
            self.player_inventory.append({
                'mirror': self.pieces_per_player['mirror'],
                'prism': self.pieces_per_player['prism'],
                'blocker': self.pieces_per_player['blocker']
            })
        
        # Place light sources on edges (3 per side)
        self.light_sources = []
        
        # Top edge (facing down)
        for col in [2, 6, 10]:
            for i, player in enumerate(self.players):
                if col == 2 + (i * 4):
                    self.light_sources.append({
                        'x': col,
                        'y': -1,
                        'direction': 'down',
                        'player': i,
                        'color': player['color']
                    })
        
        # Bottom edge (facing up)
        for col in [1, 5, 9]:
            for i, player in enumerate(self.players):
                if col == 1 + (i * 4):
                    self.light_sources.append({
                        'x': col,
                        'y': self.board_size,
                        'direction': 'up',
                        'player': i,
                        'color': player['color']
                    })
        
        # Left edge (facing right)
        for row in [2, 6, 10]:
            for i, player in enumerate(self.players):
                if row == 2 + (i * 4) and i < 3:
                    self.light_sources.append({
                        'x': -1,
                        'y': row,
                        'direction': 'right',
                        'player': i,
                        'color': player['color']
                    })
        
        # Right edge (facing left)
        for row in [1, 5, 9]:
            for i, player in enumerate(self.players):
                if row == 1 + (i * 4) and i < 3:
                    self.light_sources.append({
                        'x': self.board_size,
                        'y': row,
                        'direction': 'left',
                        'player': i,
                        'color': player['color']
                    })
        
        # Ensure each player has exactly 3 light sources
        sources_per_player = {}
        for source in self.light_sources:
            player_idx = source['player']
            sources_per_player[player_idx] = sources_per_player.get(player_idx, 0) + 1
        
        # Balance light sources if needed
        final_sources = []
        for i, player in enumerate(self.players):
            player_sources = [s for s in self.light_sources if s['player'] == i]
            final_sources.extend(player_sources[:3])
        
        self.light_sources = final_sources
    
    def place_piece(self, x, y, piece_type, rotation=0):
        """Place a piece on the board"""
        # Validate coordinates
        if x < 0 or x >= self.board_size or y < 0 or y >= self.board_size:
            return False, "Invalid coordinates"
        
        # Check if cell is empty
        if self.board[y][x] is not None:
            return False, "Cell already occupied"
        
        # Validate piece type
        if piece_type not in ['mirror', 'prism', 'blocker']:
            return False, "Invalid piece type"
        
        # Check player has pieces left
        player_idx = self.current_player
        if self.player_inventory[player_idx][piece_type] <= 0:
            return False, f"No {piece_type}s remaining"
        
        # Place piece
        self.board[y][x] = {
            'type': piece_type,
            'player': player_idx,
            'rotation': rotation,
            'color': self.players[player_idx]['color']
        }
        
        # Decrease inventory
        self.player_inventory[player_idx][piece_type] -= 1
        
        # Move to next turn
        self.next_turn()
        
        return True, "Piece placed successfully"
    
    def next_turn(self):
        """Move to the next player's turn"""
        self.current_player = (self.current_player + 1) % len(self.players)
        
        # If back to first player, increment round
        if self.current_player == 0:
            self.round_number += 1
            
            # Check for game end
            if self.round_number > self.max_rounds:
                self.end_game()
            else:
                # Check if 60% of board is controlled
                scores = self.calculate_territory_control()
                total_cells = self.board_size * self.board_size
                for player_idx, score in scores.items():
                    if score >= total_cells * 0.6:
                        self.end_game()
                        break
    
    def calculate_light_paths(self):
        """Calculate all light beam paths and territory control"""
        territory = [[set() for _ in range(self.board_size)] for _ in range(self.board_size)]
        
        for source in self.light_sources:
            self._trace_light_beam(source, territory)
        
        return territory
    
    def _trace_light_beam(self, source, territory, visited=None):
        """Trace a single light beam through the board"""
        if visited is None:
            visited = set()
        
        x, y = source['x'], source['y']
        direction = source['direction']
        player = source['player']
        
        # Move in the current direction
        dx, dy = self._get_direction_delta(direction)
        x += dx
        y += dy
        
        # Trace until out of bounds or max iterations
        max_iterations = self.board_size * 2
        iterations = 0
        
        while iterations < max_iterations:
            iterations += 1
            
            # Check if out of bounds
            if x < 0 or x >= self.board_size or y < 0 or y >= self.board_size:
                break
            
            # Mark territory
            if (x, y) not in visited:
                territory[y][x].add(player)
                visited.add((x, y))
            
            # Check for piece at current position
            piece = self.board[y][x]
            
            if piece is None:
                # Continue in same direction
                x += dx
                y += dy
                continue
            
            piece_type = piece['type']
            
            if piece_type == 'blocker':
                # Light stops
                break
            
            elif piece_type == 'mirror':
                # Reflect light 90 degrees
                rotation = piece['rotation']
                direction = self._reflect_direction(direction, rotation)
                dx, dy = self._get_direction_delta(direction)
                x += dx
                y += dy
            
            elif piece_type == 'prism':
                # Split into 3 beams
                rotation = piece['rotation']
                new_directions = self._prism_split(direction, rotation)
                
                # Trace each new beam
                for new_dir in new_directions[1:]:  # Skip first, we'll continue with it
                    new_source = {
                        'x': x,
                        'y': y,
                        'direction': new_dir,
                        'player': player,
                        'color': source['color']
                    }
                    self._trace_light_beam(new_source, territory, visited.copy())
                
                # Continue with first direction
                if new_directions:
                    direction = new_directions[0]
                    dx, dy = self._get_direction_delta(direction)
                    x += dx
                    y += dy
                else:
                    break
    
    def _get_direction_delta(self, direction):
        """Get x, y delta for a direction"""
        deltas = {
            'up': (0, -1),
            'down': (0, 1),
            'left': (-1, 0),
            'right': (1, 0)
        }
        return deltas[direction]
    
    def _reflect_direction(self, direction, rotation):
        """Reflect a light beam based on mirror rotation"""
        # Mirror rotations: 0 = \, 90 = /, 180 = \, 270 = /
        # Simplified: rotation 0 or 180 = \, rotation 90 or 270 = /
        
        if rotation % 180 == 0:  # \ mirror
            reflections = {
                'up': 'left',
                'down': 'right',
                'left': 'up',
                'right': 'down'
            }
        else:  # / mirror
            reflections = {
                'up': 'right',
                'down': 'left',
                'left': 'down',
                'right': 'up'
            }
        
        return reflections.get(direction, direction)
    
    def _prism_split(self, direction, rotation):
        """Split light into 3 beams based on prism orientation"""
        # Prism splits light into 3 directions: straight, +45°, -45°
        all_directions = ['up', 'right', 'down', 'left']
        current_idx = all_directions.index(direction)
        
        # Return straight and two perpendicular directions
        straight = direction
        left_dir = all_directions[(current_idx - 1) % 4]
        right_dir = all_directions[(current_idx + 1) % 4]
        
        return [straight, left_dir, right_dir]
    
    def calculate_territory_control(self):
        """Calculate how many squares each player controls"""
        territory = self.calculate_light_paths()
        scores = {i: 0 for i in range(len(self.players))}
        
        for row in territory:
            for cell in row:
                if len(cell) == 1:
                    # Only one player's light hits this cell
                    player = list(cell)[0]
                    scores[player] += 1
                # If multiple players' light hits the same cell, no one gets the point
        
        return scores
    
    def get_scores(self):
        """Get current scores for all players"""
        scores = self.calculate_territory_control()
        return [
            {
                'player': self.players[i]['username'],
                'color': self.players[i]['color'],
                'score': scores[i]
            }
            for i in range(len(self.players))
        ]
    
    def end_game(self):
        """End the game and determine winner"""
        self.state = 'finished'
        scores = self.calculate_territory_control()
        
        # Find winner
        max_score = max(scores.values())
        winners = [i for i, score in scores.items() if score == max_score]
        
        if len(winners) == 1:
            self.winner = {
                'username': self.players[winners[0]]['username'],
                'color': self.players[winners[0]]['color'],
                'score': max_score
            }
        else:
            # Tie
            self.winner = {
                'username': 'Tie',
                'color': '#FFFFFF',
                'score': max_score
            }
    
    def get_state(self):
        """Get the full game state for clients"""
        territory = self.calculate_light_paths()
        
        return {
            'game_id': self.game_id,
            'players': self.players,
            'state': self.state,
            'board': self.board,
            'board_size': self.board_size,
            'light_sources': self.light_sources,
            'current_player': self.current_player,
            'round_number': self.round_number,
            'max_rounds': self.max_rounds,
            'winner': self.winner,
            'player_inventory': self.player_inventory,
            'territory': [[list(cell) for cell in row] for row in territory],
            'scores': self.get_scores()
        }