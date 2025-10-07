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
}

export interface SpatialGrid {
  [key: string]: GameBlob[];
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