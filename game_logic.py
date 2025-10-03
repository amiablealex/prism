from datetime import datetime
import random
import time

class PrismWarsGame:
    def __init__(self, game_id, max_players=2):
        self.game_id = game_id
        self.max_players = max_players
        self.players = []
        self.state = 'waiting'  # waiting, playing, finished
        self.board_size = 12
        self.board = []
        self.light_sources = []
        self.current_player = 0
        self.round_number = 1
        self.max_rounds = 20
        self.winner = None
        self.pieces_per_player = {
            'mirror': 15,
            'prism': 1,
            'blocker': 8,
            'splitter': 6
        }
        self.player_inventory = []
        self.amplifier_tiles = []
        self.protected_zones = []
        self.win_points = 75
        self.objectives = []
        self.completed_objectives = []
        
        # Turn timer system
        self.turn_timer_seconds = 60
        self.turn_start_time = None
        self.missed_turns = {}  # Track consecutive missed turns per player
        self.disconnected_players = set()  # Players removed due to inactivity
        
    def initialize_board(self):
        """Initialize the game board and light sources"""
        self.board = [[None for _ in range(self.board_size)] for _ in range(self.board_size)]
        
        self.player_inventory = []
        for _ in self.players:
            self.player_inventory.append({
                'mirror': self.pieces_per_player['mirror'],
                'prism': self.pieces_per_player['prism'],
                'blocker': self.pieces_per_player['blocker'],
                'splitter': self.pieces_per_player['splitter']
            })
        
        self._initialize_light_sources()
        self._generate_amplifier_tiles()
        self._create_protected_zones()
        self._assign_objectives()
        
        self.completed_objectives = [set() for _ in self.players]
        
        # Initialize turn timer
        self.turn_start_time = time.time()
        self.missed_turns = {i: 0 for i in range(len(self.players))}
        self.disconnected_players = set()
    
    def _initialize_light_sources(self):
        """Place light sources with better distribution"""
        self.light_sources = []
        
        if len(self.players) == 2:
            positions_p0 = [(2, 0, 'down'), (0, 2, 'right'), (3, 0, 'down')]
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
            all_positions = [
                [(2, 0, 'down'), (0, 3, 'right'), (4, 0, 'down')],
                [(11, 5, 'left'), (8, 11, 'up'), (11, 7, 'left')],
                [(0, 8, 'right'), (3, 11, 'up'), (0, 10, 'right')]
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
            all_positions = [
                [(2, 0, 'down'), (0, 2, 'right'), (3, 0, 'down')],
                [(9, 0, 'down'), (11, 2, 'left'), (10, 0, 'down')],
                [(2, 11, 'up'), (0, 9, 'right'), (3, 11, 'up')],
                [(9, 11, 'up'), (11, 9, 'left'), (10, 11, 'up')]
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
            if source['direction'] == 'down':
                entry_x, entry_y = source['x'], 0
            elif source['direction'] == 'up':
                entry_x, entry_y = source['x'], self.board_size - 1
            elif source['direction'] == 'right':
                entry_x, entry_y = 0, source['y']
            else:
                entry_x, entry_y = self.board_size - 1, source['y']
            
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
        
        self.objectives = []
        for _ in self.players:
            player_objectives = random.sample(all_objectives, 2)
            self.objectives.append(player_objectives)
    
    def get_time_remaining(self):
        """Get remaining time for current turn"""
        if not self.turn_start_time:
            return self.turn_timer_seconds
        
        elapsed = time.time() - self.turn_start_time
        remaining = max(0, self.turn_timer_seconds - elapsed)
        return int(remaining)
    
    def check_turn_timeout(self):
        """Check if current turn has timed out"""
        if not self.turn_start_time:
            return False
        
        elapsed = time.time() - self.turn_start_time
        return elapsed >= self.turn_timer_seconds
    
    def handle_turn_timeout(self):
        """Handle a turn timeout - auto-pass and track missed turns"""
        current_player_idx = self.current_player
        
        # Increment missed turns
        self.missed_turns[current_player_idx] = self.missed_turns.get(current_player_idx, 0) + 1
        
        # Check if player should be removed (3 consecutive missed turns)
        if self.missed_turns[current_player_idx] >= 3:
            self.disconnected_players.add(current_player_idx)
            
            # Check if game should end (only 1 player left)
            active_players = [i for i in range(len(self.players)) if i not in self.disconnected_players]
            if len(active_players) <= 1:
                if active_players:
                    self.force_end_game(active_players[0])
                else:
                    self.force_end_game(None)
                return True
        
        # Auto-pass turn
        self.next_turn()
        return False
    
    def place_piece(self, x, y, piece_type, rotation=0):
        """Place a piece on the board"""
        if x < 0 or x >= self.board_size or y < 0 or y >= self.board_size:
            return False, "Invalid coordinates"
        
        if (x, y) in self.protected_zones:
            return False, "Cannot place in protected zone near light sources"
        
        if self.board[y][x] is not None:
            return False, "Cell already occupied"
        
        if piece_type not in ['mirror', 'prism', 'blocker', 'splitter']:
            return False, "Invalid piece type"
        
        player_idx = self.current_player
        if self.player_inventory[player_idx][piece_type] <= 0:
            return False, f"No {piece_type}s remaining"
        
        self.board[y][x] = {
            'type': piece_type,
            'player': player_idx,
            'rotation': rotation,
            'color': self.players[player_idx]['color']
        }
        
        self.player_inventory[player_idx][piece_type] -= 1
        
        # Reset missed turns on successful move
        self.missed_turns[player_idx] = 0
        
        self.next_turn()
        
        return True, "Piece placed successfully"
    
    def next_turn(self):
        """Move to the next player's turn"""
        self.current_player = (self.current_player + 1) % len(self.players)
        
        # Skip disconnected players
        attempts = 0
        while self.current_player in self.disconnected_players and attempts < len(self.players):
            self.current_player = (self.current_player + 1) % len(self.players)
            attempts += 1
        
        # Reset turn timer
        self.turn_start_time = time.time()
        
        if self.current_player == 0 or attempts >= len(self.players):
            self.round_number += 1
            
            if self.round_number > self.max_rounds:
                self.end_game()
            else:
                detailed_scores = self.calculate_detailed_scores()
                for player_idx, score_data in enumerate(detailed_scores):
                    if player_idx not in self.disconnected_players and score_data['total'] >= self.win_points:
                        self.end_game()
                        break
    
    def calculate_light_paths(self):
        """Calculate all light beam paths and territory control"""
        territory = [[set() for _ in range(self.board_size)] for _ in range(self.board_size)]
        
        for source in self.light_sources:
            if source['player'] not in self.disconnected_players:
                self._trace_light_beam(source, territory)
        
        return territory
    
    def calculate_light_paths_with_preview(self, preview_x, preview_y, preview_piece_type, preview_rotation):
        """Calculate light paths with a preview piece temporarily placed"""
        # Save current board state
        original_piece = self.board[preview_y][preview_x]
        
        # Place preview piece
        self.board[preview_y][preview_x] = {
            'type': preview_piece_type,
            'player': self.current_player,
            'rotation': preview_rotation,
            'color': self.players[self.current_player]['color']
        }
        
        # Calculate paths
        territory = self.calculate_light_paths()
        
        # Restore original state
        self.board[preview_y][preview_x] = original_piece
        
        return territory
    
    def get_light_beam_segments(self):
        """Get all light beam segments for animation"""
        segments = []
        
        for source in self.light_sources:
            if source['player'] not in self.disconnected_players:
                source_segments = self._trace_beam_segments(source)
                segments.extend(source_segments)
        
        return segments
    
    def _trace_beam_segments(self, source, visited=None, blocker_penetrated=False):
        """Trace beam and return segments for animation"""
        if visited is None:
            visited = set()
        
        segments = []
        x, y = source['x'], source['y']
        direction = source['direction']
        player = source['player']
        color = source['color']
        
        dx, dy = self._get_direction_delta(direction)
        x += dx
        y += dy
        
        segment_start = None
        max_iterations = self.board_size * 2
        iterations = 0
        
        while iterations < max_iterations:
            iterations += 1
            
            if x < 0 or x >= self.board_size or y < 0 or y >= self.board_size:
                if segment_start:
                    segments.append({
                        'x1': segment_start[0],
                        'y1': segment_start[1],
                        'x2': x - dx,
                        'y2': y - dy,
                        'color': color,
                        'player': player
                    })
                break
            
            if (x, y) not in visited:
                visited.add((x, y))
                if segment_start is None:
                    segment_start = (x, y)
            
            piece = self.board[y][x]
            
            if piece is None:
                x += dx
                y += dy
                continue
            
            # End current segment at piece
            if segment_start:
                segments.append({
                    'x1': segment_start[0],
                    'y1': segment_start[1],
                    'x2': x,
                    'y2': y,
                    'color': color,
                    'player': player
                })
                segment_start = None
            
            piece_type = piece['type']
            
            if piece_type == 'blocker':
                if not blocker_penetrated:
                    blocker_penetrated = True
                    segment_start = (x, y)
                    x += dx
                    y += dy
                    continue
                else:
                    break
            
            elif piece_type == 'mirror':
                rotation = piece['rotation']
                direction = self._reflect_direction(direction, rotation)
                dx, dy = self._get_direction_delta(direction)
                segment_start = (x, y)
                x += dx
                y += dy
            
            elif piece_type == 'prism':
                rotation = piece['rotation']
                new_directions = self._prism_split(direction, rotation)
                
                for new_dir in new_directions[1:]:
                    new_source = {
                        'x': x,
                        'y': y,
                        'direction': new_dir,
                        'player': player,
                        'color': color
                    }
                    segments.extend(self._trace_beam_segments(new_source, visited.copy(), blocker_penetrated))
                
                if new_directions:
                    direction = new_directions[0]
                    dx, dy = self._get_direction_delta(direction)
                    segment_start = (x, y)
                    x += dx
                    y += dy
                else:
                    break
            
            elif piece_type == 'splitter':
                new_directions = self._splitter_split(direction)
                
                for new_dir in new_directions[1:]:
                    new_source = {
                        'x': x,
                        'y': y,
                        'direction': new_dir,
                        'player': player,
                        'color': color
                    }
                    segments.extend(self._trace_beam_segments(new_source, visited.copy(), blocker_penetrated))
                
                if new_directions:
                    direction = new_directions[0]
                    dx, dy = self._get_direction_delta(direction)
                    segment_start = (x, y)
                    x += dx
                    y += dy
                else:
                    break
        
        return segments
    
    def _trace_light_beam(self, source, territory, visited=None, blocker_penetrated=False):
        """Trace a single light beam through the board"""
        if visited is None:
            visited = set()
        
        x, y = source['x'], source['y']
        direction = source['direction']
        player = source['player']
        
        dx, dy = self._get_direction_delta(direction)
        x += dx
        y += dy
        
        max_iterations = self.board_size * 2
        iterations = 0
        
        while iterations < max_iterations:
            iterations += 1
            
            if x < 0 or x >= self.board_size or y < 0 or y >= self.board_size:
                break
            
            if (x, y) not in visited:
                territory[y][x].add(player)
                visited.add((x, y))
            
            piece = self.board[y][x]
            
            if piece is None:
                x += dx
                y += dy
                continue
            
            piece_type = piece['type']
            
            if piece_type == 'blocker':
                if not blocker_penetrated:
                    blocker_penetrated = True
                    x += dx
                    y += dy
                    continue
                else:
                    break
            
            elif piece_type == 'mirror':
                rotation = piece['rotation']
                direction = self._reflect_direction(direction, rotation)
                dx, dy = self._get_direction_delta(direction)
                x += dx
                y += dy
            
            elif piece_type == 'prism':
                rotation = piece['rotation']
                new_directions = self._prism_split(direction, rotation)
                
                for new_dir in new_directions[1:]:
                    new_source = {
                        'x': x,
                        'y': y,
                        'direction': new_dir,
                        'player': player,
                        'color': source['color']
                    }
                    self._trace_light_beam(new_source, territory, visited.copy(), blocker_penetrated)
                
                if new_directions:
                    direction = new_directions[0]
                    dx, dy = self._get_direction_delta(direction)
                    x += dx
                    y += dy
                else:
                    break
            
            elif piece_type == 'splitter':
                new_directions = self._splitter_split(direction)
                
                for new_dir in new_directions[1:]:
                    new_source = {
                        'x': x,
                        'y': y,
                        'direction': new_dir,
                        'player': player,
                        'color': source['color']
                    }
                    self._trace_light_beam(new_source, territory, visited.copy(), blocker_penetrated)
                
                if new_directions:
                    direction = new_directions[0]
                    dx, dy = self._get_direction_delta(direction)
                    x += dx
                    y += dy
                else:
                    break
    
    def _splitter_split(self, direction):
        """Split light into 2 perpendicular beams"""
        all_directions = ['up', 'right', 'down', 'left']
        current_idx = all_directions.index(direction)
        
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
        if rotation % 180 == 0:
            reflections = {
                'up': 'left',
                'down': 'right',
                'left': 'up',
                'right': 'down'
            }
        else:
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
        
        for y in range(self.board_size):
            for x in range(self.board_size):
                controllers = territory[y][x]
                
                if len(controllers) == 1:
                    player = list(controllers)[0]
                    if player not in self.disconnected_players:
                        if (x, y) in self.amplifier_tiles:
                            base_scores[player] += 2
                        else:
                            base_scores[player] += 1
        
        combo_scores = self._calculate_combos(territory)
        objective_scores = self._calculate_objectives(territory)
        
        detailed_scores = []
        for i in range(len(self.players)):
            detailed_scores.append({
                'player_index': i,
                'base_territory': base_scores[i],
                'combos': combo_scores[i],
                'objectives': objective_scores[i],
                'total': base_scores[i] + combo_scores[i]['total'] + objective_scores[i]['total'],
                'is_disconnected': i in self.disconnected_players
            })
        
        return detailed_scores
    
    def _calculate_combos(self, territory):
        """Calculate combo bonuses"""
        combo_scores = []
        
        for player_idx in range(len(self.players)):
            if player_idx in self.disconnected_players:
                combo_scores.append({'perfect_reflection': 0, 'prism_cascade': 0, 'total': 0, 'details': []})
                continue
            
            combos = {
                'perfect_reflection': 0,
                'prism_cascade': 0,
                'total': 0,
                'details': []
            }
            
            mirror_chains = self._find_mirror_chains(player_idx)
            for chain_length in mirror_chains:
                if chain_length >= 3:
                    bonus = 5 * (chain_length - 2)
                    combos['perfect_reflection'] += bonus
                    combos['details'].append(f"Mirror Chain x{chain_length}: +{bonus}")
            
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
        
        for y in range(self.board_size):
            for x in range(self.board_size):
                piece = self.board[y][x]
                if piece and piece['player'] == player_idx:
                    if piece['type'] in ['prism', 'splitter']:
                        local_territory = 0
                        for dy in range(-2, 3):
                            for dx in range(-2, 3):
                                ny, nx = y + dy, x + dx
                                if 0 <= nx < self.board_size and 0 <= ny < self.board_size:
                                    if player_idx in territory[ny][nx]:
                                        local_territory += 1
                        
                        if local_territory >= 10:
                            bonus += 3
        
        return bonus
    
    def _calculate_objectives(self, territory):
        """Calculate objective completion bonuses"""
        objective_scores = []
        
        for player_idx in range(len(self.players)):
            if player_idx in self.disconnected_players:
                objective_scores.append({'completed': [], 'total': 0})
                continue
            
            score = {
                'completed': [],
                'total': 0
            }
            
            for objective in self.objectives[player_idx]:
                obj_id = objective['id']
                
                if obj_id in self.completed_objectives[player_idx]:
                    score['completed'].append(objective)
                    score['total'] += objective['points']
                    continue
                
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
        """Calculate basic territory scores"""
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
    
    def force_end_game(self, winner_idx):
        """Force end game due to disconnections"""
        self.state = 'finished'
        
        if winner_idx is None:
            self.winner = {
                'username': 'No Winner',
                'color': '#FFFFFF',
                'score': 0,
                'breakdown': None
            }
        else:
            detailed_scores = self.calculate_detailed_scores()
            self.winner = {
                'username': self.players[winner_idx]['username'],
                'color': self.players[winner_idx]['color'],
                'score': detailed_scores[winner_idx]['total'],
                'breakdown': detailed_scores[winner_idx]
            }
    
    def end_game(self):
        """End the game and determine winner"""
        self.state = 'finished'
        detailed_scores = self.calculate_detailed_scores()
        
        # Filter out disconnected players
        active_scores = [(i, score) for i, score in enumerate(detailed_scores) if i not in self.disconnected_players]
        
        if not active_scores:
            self.winner = {
                'username': 'No Winner',
                'color': '#FFFFFF',
                'score': 0,
                'breakdown': None
            }
            return
        
        max_score = max(score['total'] for _, score in active_scores)
        winners = [i for i, score in active_scores if score['total'] == max_score]
        
        if len(winners) == 1:
            self.winner = {
                'username': self.players[winners[0]]['username'],
                'color': self.players[winners[0]]['color'],
                'score': max_score,
                'breakdown': detailed_scores[winners[0]]
            }
        else:
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
            'objectives': self.objectives,
            'light_beam_segments': self.get_light_beam_segments(),
            'time_remaining': self.get_time_remaining(),
            'disconnected_players': list(self.disconnected_players),
            'missed_turns': self.missed_turns
        }
