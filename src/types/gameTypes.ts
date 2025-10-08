export interface BaseBlob {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
}

export interface PlayerBlob extends BaseBlob {
  isPlayer: true;
  name: string;
  team?: 'red' | 'blue';
}

export interface BotBlob extends BaseBlob {
  isBot: true;
  vx: number;
  vy: number;
  name: string;
  team?: 'red' | 'blue';
  aggressionLevel: number;
  lastTargetChange: number;
  lastAIUpdateTime?: number; // Added for AI optimization
  speed: number; // Added to store current speed
}

export interface FoodBlob extends BaseBlob {
  // Food blobs only need the base properties
}

export type GameBlob = PlayerBlob | BotBlob | FoodBlob;

export interface GameSettings {
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  foodColorMode: 'fixed' | 'random';
  selectedFoodColor: string;
  selectedBackgroundColor: 'gradient' | 'white' | 'grey' | 'black'; // Added background color setting
  selectedCosmetic: string | null; // Added selectedCosmetic to GameSettings interface
}

export interface SpatialGrid {
  [key: string]: GameBlob[];
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  price: number;
  owned: boolean;
  type: 'speed' | 'multiplier' | 'revive' | 'kill' | 'cosmetic' | 'powerup' | 'utility';
  category?: 'cosmetic' | 'powerup' | 'utility' | 'permanent';
  color?: string;
  effectDuration?: number; // in milliseconds
  effectValue?: number; // e.g., speed percentage (0.25 for 25%), multiplier value (2 for 2x)
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  targetValue: number;
  currentValue: number;
  completed: boolean;
  reward: number;
  type: 'eat_blobs' | 'survive_time' | 'daily_games' | 'win_streak';
}

export interface ActivePowerUp {
  id: string;
  name: string;
  expiresAt: number;
}

export interface DailyDeal {
  upgradeId: string;
  discountPercent: number;
  expiresAt: string;
}

export interface LootReward {
  type: 'points' | 'stars' | 'powerup' | 'cosmetic';
  value: number | string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export type EvolutionStage = 'basic' | 'common' | 'rare' | 'epic' | 'legendary';

// --- New Multiplayer Types ---
export type RoomStatus = 'waiting' | 'in_game' | 'finished';

export interface Room {
  id: string;
  name: string;
  status: RoomStatus;
  max_players: number;
  current_players_count: number;
  host_id: string;
  game_mode: 'classic' | 'timeAttack' | 'battleRoyale' | 'team';
  selected_team?: 'red' | 'blue'; // Host's selected team for team mode
  created_at: string;
}

export interface RoomPlayer {
  id: string; // This will be the player's unique ID (e.g., from useGameStats)
  room_id: string;
  player_name: string;
  team?: 'red' | 'blue';
  is_ready: boolean;
  joined_at: string;
}

// This interface will be used for the server-authoritative game state
export interface GameState {
  room_id: string;
  players_data: PlayerBlob[]; // Array of all player blobs in the game
  bots_data: BotBlob[];     // Array of all bot blobs
  foods_data: FoodBlob[];   // Array of all food blobs
  game_time: number;        // Current game time (e.g., for time attack)
  play_area_radius: number; // Current play area radius (for battle royale)
  last_updated_at: string;
}