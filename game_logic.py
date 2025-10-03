from datetime import datetime
import random

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
            'prism': 1,
            'blocker': 8,
            'splitter': 6  # NEW piece type
        }
        self.player_inventory = []
        self.amplifier_tiles = []  # Special tiles worth 2x points
        self.protected_zones = []  # Zones where pieces cannot be placed
        self.win_points = 75  # NEW: Win condition in points
        self.objectives = []  # Each player gets secret objectives
        self.completed_objectives = []  # Track completed objectives per player
        
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
                'blocker': self.pieces_per_player['blocker'],
                'splitter': self.pieces_per_player['splitter']
            })
        
        # Place light sources
        self._initialize_light_sources()
        
        # Generate amplifier tiles (5 random positions)
        self._generate_amplifier_tiles()
        
        # Create protected zones around light sources
        self._create_protected_zones()
        
        # Assign objectives to each player
        self._assign_objectives()
        
        # Initialize completed objectives tracker
        self.completed_objectives = [set() for _ in self.players]
    
    def _initialize_light_sources(self):
        """Place light sources with better distribution"""
        self.light_sources = []
        
        # Distribute sources more evenly based on player count
        if len(self.players) == 2:
            # Player 0: top-left area
            positions_p0 = [(2, 0, 'down'), (0, 2, 'right'), (3, 0, 'down')]
            # Player 1: bottom-right area
            positions_p1 = [(9, 11, 'up'), (11, 9, 'left'), (8, 11, 'up')]
            
            for x, y, direction in positions_p0:
                self.light_sources.append({
                    'x': x if direction in ['up', 'down'] else (-1 if direction == 'right' else self.board_size),
                    'y': y if direction in ['left', 'right'] else (-1 if direction == 'down' else self.board_size),
                    'direction': direction,
                    'player': 0,
                    'color': self.players[0]['color']
                })
            
            for x, y, direction in positions_p1:
                self.light_sources.append({
                    'x': x if direction in ['up', 'down'] else (-1 if direction == 'right' else self.board_size),
                    'y': y if direction in ['left', 'right'] else (-1 if direction == 'down' else self.board_size),
                    'direction': direction,
                    'player': 1,
                    'color': self.players[1]['color']
                })
        
        elif len(self.players) == 3:
            # Distribute in triangular pattern
            all_positions = [
                [(2, 0, 'down'), (0, 3, 'right'), (4, 0, 'down')],  # Top
                [(11, 5, 'left'), (8, 11, 'up'), (11, 7, 'left')],  # Right
                [(0, 8, 'right'), (3, 11, 'up'), (0, 10, 'right')]  # Left
            ]
            for i in range(3):
                for x, y, direction in all_positions[i]:
                    self.light_sources.append({
                        'x': x if direction in ['up', 'down'] else (-1 if direction == 'right' else self.board_size),
                        'y': y if direction in ['left', 'right'] else (-1 if direction == 'down' else self.board_size),
                        'direction': direction,
                        'player': i,
                        'color': self.players[i]['color']
                    })
        
        elif len(self.players) == 4:
            # Distribute in corners
            all_positions = [
                [(2, 0, 'down'), (0, 2, 'right'), (3, 0, 'down')],  # Top-left
                [(9, 0, 'down'), (11, 2, 'left'), (10, 0, 'down')],  # Top-right
                [(2, 11, 'up'), (0, 9, 'right'), (3, 11, 'up')],  # Bottom-left
                [(9, 11, 'up'), (11, 9, 'left'), (10, 11, 'up')]  # Bottom-right
            ]
            for i in range(4):
                for x, y, direction in all_positions[i]:
                    self.light_sources.append({
                        'x': x if direction in ['up', 'down'] else (-1 if direction == 'right' else self.board_size),
                        'y': y if direction in ['left', 'right'] else (-1 if direction == 'down' else self.board_size),
                        'direction': direction,
                        'player': i,
                        'color': self.players[i]['color']
                    })
    
    def _generate_amplifier_tiles(self):
        """Generate 5 random amplifier tiles"""
        self.amplifier_tiles = []
        attempts = 0
        while len(self.amplifier_tiles) < 5 and attempts < 100:
            x = random.randint(3, self.board_size - 4)
            y = random.randint(3, self.board_size - 4)
            if (x, y) not in self.amplifier_tiles:
                self.amplifier_tiles.append((x, y))
            attempts += 1
    
    def _create_protected_zones(self):
        """Create 2-cell buffer zones around light sources"""
        self.protected_zones = []
        
        for source in self.light_sources:
            # Get entry point of light
            if source['direction'] == 'down':
                entry_x, entry_y = source['x'], 0
            elif source['direction'] == 'up':
                entry_x, entry_y = source['x'], self.board_size - 1
            elif source['direction'] == 'right':
                entry_x, entry_y = 0, source['y']
            else:  # left
                entry_x, entry_y = self.board_size - 1, source['y']
            
            # Protect 2 cells from entry point
            for dist in range(2):
                dx, dy = self._get_direction_delta(source['direction'])
                px = entry_x + dx * dist
                py = entry_y + dy * dist
                if 0 <= px < self.board_size and 0 <= py < self.board_size:
                    self.protected_zones.append((px, py))
    
    def _assign_objectives(self):
        """Assign objectives to each player"""
        all_objectives = [
            {'id': 'corners', 'name': 'Control All 4 Corners', 'points': 15, 'description': 'Control all 4 corner cells'},
            {'id': 'center', 'name': 'Dominate Center', 'points': 12, 'description': 'Control the center 2x2 area'},
            {'id': 'edge_control', 'name': 'Edge Master', 'points': 10, 'description': 'Control 8+ edge cells'},
            {'id': 'amplifier_control', 'name': 'Power Surge', 'points': 12, 'description': 'Control 3+ amplifier tiles'},
            {'id': 'territory_spread', 'name': 'Expansionist', 'points': 10, 'description': 'Control territory in all 4 quadrants'},
        ]
        
        # Each player gets 2 random objectives
        self.objectives = []
        for _ in self.players:
            player_objectives = random.sample(all_objectives, 2)
            self.objectives.append(player_objectives)
    
    def place_piece(self, x, y, piece_type, rotation=0):
        """Place a piece on the board"""
        # Validate coordinates
        if x < 0 or x >= self.board_size or y < 0 or y >= self.board_size:
            return False, "Invalid coordinates"
        
        # Check if in protected zone
        if (x, y) in self.protected_zones:
            return False, "Cannot place in protected zone near light sources"
        
        # Check if cell is empty
        if self.board[y][x] is not None:
            return False, "Cell already occupied"
        
        # Validate piece type
        if piece_type not in ['mirror', 'prism', 'blocker', 'splitter']:
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
                # Check if anyone reached win points
                detailed_scores = self.calculate_detailed_scores()
                for player_idx, score_data in enumerate(detailed_scores):
                    if score_data['total'] >= self.win_points:
                        self.end_game()
                        break
    
    def calculate_light_paths(self):
        """Calculate all light beam paths and territory control"""
        territory = [[set() for _ in range(self.board_size)] for _ in range(self.board_size)]
        
        for source in self.light_sources:
            self._trace_light_beam(source, territory)
        
        return territory
    
    def _trace_light_beam(self, source, territory, visited=None, blocker_penetrated=False):
        """Trace a single light beam through the board with blocker penetration"""
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
                # NEW: Light penetrates first blocker
                if not blocker_penetrated:
                    blocker_penetrated = True
                    x += dx
                    y += dy
                    continue
                else:
                    # Second blocker stops light
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
                for new_dir in new_directions[1:]:
                    new_source = {
                        'x': x,
                        'y': y,
                        'direction': new_dir,
                        'player': player,
                        'color': source['color']
                    }
                    self._trace_light_beam(new_source, territory, visited.copy(), blocker_penetrated)
                
                # Continue with first direction
                if new_directions:
                    direction = new_directions[0]
                    dx, dy = self._get_direction_delta(direction)
                    x += dx
                    y += dy
                else:
                    break
            
            elif piece_type == 'splitter':
                # NEW: Split into 2 perpendicular beams
                new_directions = self._splitter_split(direction)
                
                # Trace each new beam
                for new_dir in new_directions[1:]:
                    new_source = {
                        'x': x,
                        'y': y,
                        'direction': new_dir,
                        'player': player,
                        'color': source['color']
                    }
                    self._trace_light_beam(new_source, territory, visited.copy(), blocker_penetrated)
                
                # Continue with first direction
                if new_directions:
                    direction = new_directions[0]
                    dx, dy = self._get_direction_delta(direction)
                    x += dx
                    y += dy
                else:
                    break
    
    def _splitter_split(self, direction):
        """Split light into 2 perpendicular beams (NEW piece)"""
        all_directions = ['up', 'right', 'down', 'left']
        current_idx = all_directions.index(direction)
        
        # Return two perpendicular directions (left and right from current)
        left_dir = all_directions[(current_idx - 1) % 4]
        right_dir = all_directions[(current_idx + 1) % 4]
        
        return [left_dir, right_dir]
    
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
        all_directions = ['up', 'right', 'down', 'left']
        current_idx = all_directions.index(direction)
        
        straight = direction
        left_dir = all_directions[(current_idx - 1) % 4]
        right_dir = all_directions[(current_idx + 1) % 4]
        
        return [straight, left_dir, right_dir]
    
    def calculate_detailed_scores(self):
        """Calculate detailed scores with breakdowns"""
        territory = self.calculate_light_paths()
        base_scores = {i: 0 for i in range(len(self.players))}
        
        # Calculate base territory control
        for y in range(self.board_size):
            for x in range(self.board_size):
                controllers = territory[y][x]
                
                if len(controllers) == 1:
                    player = list(controllers)[0]
                    # Check if amplifier tile
                    if (x, y) in self.amplifier_tiles:
                        base_scores[player] += 2  # Worth 2x
                    else:
                        base_scores[player] += 1
        
        # Calculate combos
        combo_scores = self._calculate_combos(territory)
        
        # Calculate objectives
        objective_scores = self._calculate_objectives(territory)
        
        # Build detailed score breakdown
        detailed_scores = []
        for i in range(len(self.players)):
            detailed_scores.append({
                'player_index': i,
                'base_territory': base_scores[i],
                'combos': combo_scores[i],
                'objectives': objective_scores[i],
                'total': base_scores[i] + combo_scores[i]['total'] + objective_scores[i]['total']
            })
        
        return detailed_scores
    
    def _calculate_combos(self, territory):
        """Calculate combo bonuses"""
        combo_scores = []
        
        for player_idx in range(len(self.players)):
            combos = {
                'perfect_reflection': 0,
                'prism_cascade': 0,
                'total': 0,
                'details': []
            }
            
            # Perfect Reflection: 3+ mirrors in sequence
            mirror_chains = self._find_mirror_chains(player_idx)
            for chain_length in mirror_chains:
                if chain_length >= 3:
                    bonus = 5 * (chain_length - 2)  # 5 points per mirror after 2nd
                    combos['perfect_reflection'] += bonus
                    combos['details'].append(f"Mirror Chain x{chain_length}: +{bonus}")
            
            # Prism Cascade: Control territory through prism/splitter
            prism_bonus = self._calculate_prism_cascade(player_idx, territory)
            combos['prism_cascade'] = prism_bonus
            if prism_bonus > 0:
                combos['details'].append(f"Prism Cascade: +{prism_bonus}")
            
            combos['total'] = combos['perfect_reflection'] + combos['prism_cascade']
            combo_scores.append(combos)
        
        return combo_scores
    
    def _find_mirror_chains(self, player_idx):
        """Find chains of mirrors for a player"""
        chains = []
        visited = set()
        
        for y in range(self.board_size):
            for x in range(self.board_size):
                piece = self.board[y][x]
                if piece and piece['type'] == 'mirror' and piece['player'] == player_idx:
                    if (x, y) not in visited:
                        chain_length = self._trace_mirror_chain(x, y, player_idx, visited)
                        if chain_length > 0:
                            chains.append(chain_length)
        
        return chains
    
    def _trace_mirror_chain(self, x, y, player_idx, visited):
        """Trace a chain of connected mirrors"""
        # Simple implementation: count adjacent mirrors
        count = 1
        visited.add((x, y))
        
        for dx, dy in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < self.board_size and 0 <= ny < self.board_size:
                if (nx, ny) not in visited:
                    piece = self.board[ny][nx]
                    if piece and piece['type'] == 'mirror' and piece['player'] == player_idx:
                        count += self._trace_mirror_chain(nx, ny, player_idx, visited)
        
        return count
    
    def _calculate_prism_cascade(self, player_idx, territory):
        """Calculate bonus for prism/splitter usage"""
        bonus = 0
        
        # Find all prisms/splitters
        for y in range(self.board_size):
            for x in range(self.board_size):
                piece = self.board[y][x]
                if piece and piece['player'] == player_idx:
                    if piece['type'] in ['prism', 'splitter']:
                        # Count territory around this piece
                        local_territory = 0
                        for dy in range(-2, 3):
                            for dx in range(-2, 3):
                                ny, nx = y + dy, x + dx
                                if 0 <= nx < self.board_size and 0 <= ny < self.board_size:
                                    if player_idx in territory[ny][nx]:
                                        local_territory += 1
                        
                        if local_territory >= 10:
                            bonus += 3  # 3 points per effective prism/splitter
        
        return bonus
    
    def _calculate_objectives(self, territory):
        """Calculate objective completion bonuses"""
        objective_scores = []
        
        for player_idx in range(len(self.players)):
            score = {
                'completed': [],
                'total': 0
            }
            
            for objective in self.objectives[player_idx]:
                obj_id = objective['id']
                
                # Check if already completed
                if obj_id in self.completed_objectives[player_idx]:
                    score['completed'].append(objective)
                    score['total'] += objective['points']
                    continue
                
                # Check if newly completed
                completed = False
                
                if obj_id == 'corners':
                    corners = [(0, 0), (self.board_size-1, 0), (0, self.board_size-1), (self.board_size-1, self.board_size-1)]
                    completed = all(player_idx in territory[y][x] and len(territory[y][x]) == 1 for x, y in corners)
                
                elif obj_id == 'center':
                    center_cells = [(5, 5), (6, 5), (5, 6), (6, 6)]
                    completed = all(player_idx in territory[y][x] and len(territory[y][x]) == 1 for x, y in center_cells)
                
                elif obj_id == 'edge_control':
                    edge_count = 0
                    for x in range(self.board_size):
                        if player_idx in territory[0][x] and len(territory[0][x]) == 1:
                            edge_count += 1
                        if player_idx in territory[self.board_size-1][x] and len(territory[self.board_size-1][x]) == 1:
                            edge_count += 1
                    for y in range(1, self.board_size-1):
                        if player_idx in territory[y][0] and len(territory[y][0]) == 1:
                            edge_count += 1
                        if player_idx in territory[y][self.board_size-1] and len(territory[y][self.board_size-1]) == 1:
                            edge_count += 1
                    completed = edge_count >= 8
                
                elif obj_id == 'amplifier_control':
                    amp_count = sum(1 for x, y in self.amplifier_tiles 
                                   if player_idx in territory[y][x] and len(territory[y][x]) == 1)
                    completed = amp_count >= 3
                
                elif obj_id == 'territory_spread':
                    quadrants = [False, False, False, False]
                    for y in range(self.board_size):
                        for x in range(self.board_size):
                            if player_idx in territory[y][x] and len(territory[y][x]) == 1:
                                if x < 6 and y < 6:
                                    quadrants[0] = True
                                elif x >= 6 and y < 6:
                                    quadrants[1] = True
                                elif x < 6 and y >= 6:
                                    quadrants[2] = True
                                else:
                                    quadrants[3] = True
                    completed = all(quadrants)
                
                if completed:
                    self.completed_objectives[player_idx].add(obj_id)
                    score['completed'].append(objective)
                    score['total'] += objective['points']
            
            objective_scores.append(score)
        
        return objective_scores
    
    def calculate_territory_control(self):
        """Calculate basic territory scores (legacy method)"""
        detailed_scores = self.calculate_detailed_scores()
        return {i: score['base_territory'] for i, score in enumerate(detailed_scores)}
    
    def get_scores(self):
        """Get current scores for all players with full breakdown"""
        detailed_scores = self.calculate_detailed_scores()
        return [
            {
                'player': self.players[i]['username'],
                'color': self.players[i]['color'],
                'score': detailed_scores[i]['total'],
                'breakdown': detailed_scores[i]
            }
            for i in range(len(self.players))
        ]
    
    def end_game(self):
        """End the game and determine winner"""
        self.state = 'finished'
        detailed_scores = self.calculate_detailed_scores()
        
        # Find winner by total points
        max_score = max(score['total'] for score in detailed_scores)
        winners = [i for i, score in enumerate(detailed_scores) if score['total'] == max_score]
        
        if len(winners) == 1:
            self.winner = {
                'username': self.players[winners[0]]['username'],
                'color': self.players[winners[0]]['color'],
                'score': max_score,
                'breakdown': detailed_scores[winners[0]]
            }
        else:
            # Tie
            self.winner = {
                'username': 'Tie',
                'color': '#FFFFFF',
                'score': max_score,
                'breakdown': None
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
            'scores': self.get_scores(),
            'amplifier_tiles': self.amplifier_tiles,
            'protected_zones': self.protected_zones,
            'win_points': self.win_points,
            'objectives': self.objectives
        }
