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

interface DailyDeal {
  upgradeId: string;
  discountPercent: number;
  expiresAt: string;
}

interface LootReward {
  type: 'points' | 'stars' | 'powerup' | 'cosmetic';
  value: number | string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export type EvolutionStage = 'basic' | 'common' | 'rare' | 'epic' | 'legendary';