import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { UPGRADE_IDS, CHALLENGE_TYPES } from '../constants/gameConstants';
import { GameSettings } from '../types/gameTypes';
import { FOOD_COLORS } from '../constants/gameConstants';

interface GameStats {
  totalPoints: number;
  gamesPlayed: number;
  highScore: number;
  livesRemaining: number;
  lastLifeReset: string;
  lastLoginDate: string;
  loginStreak: number;
}

interface GameSettings {
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  foodColorMode: 'fixed' | 'random';
  selectedFoodColor: string;
}

interface Upgrade {
  id: string;
  name: string;
  description: string;
  price: number;
  owned: boolean;
  type: 'speed' | 'multiplier' | 'revive' | 'kill' | 'cosmetic' | 'powerup' | 'utility';
  category?: 'cosmetic' | 'powerup' | 'utility' | 'permanent';
  color?: string;
  effectDuration?: number; // in milliseconds
}

interface Challenge {
  id: string;
  name: string;
  description: string;
  targetValue: number;
  currentValue: number;
  completed: boolean;
  reward: number;
  type: 'eat_blobs' | 'survive_time' | 'daily_games' | 'win_streak';
}

interface ActivePowerUp {
  id: string;
  name: string;
  expiresAt: number;
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

interface GameContextType {
  stats: GameStats;
  upgrades: Upgrade[];
  challenges: Challenge[];
  activePowerUps: ActivePowerUp[];
  settings: GameSettings;
  dailyDeal: DailyDeal | null;
  selectedCosmetic: string | null;
  currentPoints: number;
  gameActive: boolean;
  playerSize: number;
  gameMode: 'classic' | 'timeAttack' | 'battleRoyale' | 'team';
  selectedTeam: 'red' | 'blue';
  telegramStars: number;
  updateStats: (points: number) => void;
  growPlayer: (amount: number) => void;
  purchaseUpgrade: (upgradeId: string, priceOverride?: number) => void;
  purchaseWithStars: (upgradeId: string) => void;
  openLootBox: (boxType: string) => LootReward[];
  startGame: (mode?: 'classic' | 'timeAttack' | 'battleRoyale' | 'team') => void;
  endGame: (finalScore: number) => void;
  useLife: () => boolean;
  revivePlayer: () => void;
  resetAllData: () => void;
  updateChallengeProgress: (challengeType: string, value: number) => void;
  claimChallengeReward: (challengeId: string) => void;
  activatePowerUp: (powerUpId: string) => void;
  refillLives: () => void;
  setGameMode: (mode: 'classic' | 'timeAttack' | 'battleRoyale' | 'team') => void;
  setSelectedTeam: (team: 'red' | 'blue') => void;
  setSelectedCosmetic: (cosmeticId: string | null) => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const INITIAL_STATS: GameStats = {
  totalPoints: 0,
  gamesPlayed: 0,
  highScore: 0,
  livesRemaining: 10,
  lastLifeReset: new Date().toDateString(),
  lastLoginDate: new Date().toDateString(),
  loginStreak: 1,
};

const INITIAL_SETTINGS: GameSettings = {
  soundEnabled: true,
  vibrateEnabled: true,
  foodColorMode: 'fixed',
  selectedFoodColor: FOOD_COLORS.RED,
};

const INITIAL_UPGRADES: Upgrade[] = [
  // Permanent Upgrades
  {
    id: UPGRADE_IDS.SPEED_BOOST_1,
    name: 'Speed Boost I',
    description: 'Increase movement speed by 25%',
    price: 100,
    owned: false,
    type: 'speed',
    category: 'permanent',
  },
  {
    id: UPGRADE_IDS.POINT_MULTIPLIER_1,
    name: '2x Point Multiplier I',
    description: 'Double points from eating blobs',
    price: 150,
    owned: false,
    type: 'multiplier',
    category: 'permanent',
  },
  {
    id: UPGRADE_IDS.INSTANT_KILL,
    name: 'Instant Kill',
    description: 'Ability to eat any blob regardless of size',
    price: 200,
    owned: false,
    type: 'kill',
    category: 'permanent',
  },
  {
    id: UPGRADE_IDS.AUTO_REVIVE,
    name: 'Auto Revive',
    description: 'Automatically revive once per game',
    price: 250,
    owned: false,
    type: 'revive',
    category: 'permanent',
  },
  // Cosmetic Upgrades
  {
    id: UPGRADE_IDS.RED_SKIN,
    name: 'Crimson Blob',
    description: 'Stand out with a fiery red appearance',
    price: 50,
    owned: false,
    type: 'cosmetic',
    category: 'cosmetic',
    color: '#EF4444',
  },
  {
    id: UPGRADE_IDS.GOLD_SKIN,
    name: 'Golden Blob',
    description: 'Shine bright with golden colors',
    price: 100,
    owned: false,
    type: 'cosmetic',
    category: 'cosmetic',
    color: '#F59E0B',
  },
  {
    id: UPGRADE_IDS.RAINBOW_SKIN,
    name: 'Rainbow Blob',
    description: 'Cycle through rainbow colors',
    price: 200,
    owned: false,
    type: 'cosmetic',
    category: 'cosmetic',
    color: '#8B5CF6',
  },
  // Temporary Power-ups
  {
    id: UPGRADE_IDS.SHIELD,
    name: '5s Shield',
    description: 'Temporary invulnerability for 5 seconds',
    price: 30,
    owned: false,
    type: 'powerup',
    category: 'powerup',
    effectDuration: 5000,
  },
  {
    id: UPGRADE_IDS.DOUBLE_POINTS,
    name: '1min Double Points',
    description: 'Double all points for 1 minute',
    price: 50,
    owned: false,
    type: 'powerup',
    category: 'powerup',
    effectDuration: 60000,
  },
  // Utility
  {
    id: UPGRADE_IDS.EXTRA_LIVES,
    name: 'Refill Lives',
    description: 'Instantly refill all 10 lives',
    price: 75,
    owned: false,
    type: 'utility',
    category: 'utility',
  },
];

const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: 'eat_10_blobs',
    name: 'Blob Hunter',
    description: 'Eat 10 blobs in total',
    targetValue: 10,
    currentValue: 0,
    completed: false,
    reward: 25,
    type: CHALLENGE_TYPES.EAT_BLOBS,
  },
  {
    id: 'eat_50_blobs',
    name: 'Blob Master',
    description: 'Eat 50 blobs in total',
    targetValue: 50,
    currentValue: 0,
    completed: false,
    reward: 100,
    type: CHALLENGE_TYPES.EAT_BLOBS,
  },
  {
    id: 'survive_5_minutes',
    name: 'Survivor',
    description: 'Survive for 5 minutes in a single game',
    targetValue: 5,
    currentValue: 0,
    completed: false,
    reward: 50,
    type: CHALLENGE_TYPES.SURVIVE_TIME,
  },
  {
    id: 'play_daily',
    name: 'Daily Player',
    description: 'Play 5 games in one day',
    targetValue: 5,
    currentValue: 0,
    completed: false,
    reward: 30,
    type: CHALLENGE_TYPES.DAILY_GAMES,
  },
];

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useLocalStorage<GameStats>('agarGameStats', INITIAL_STATS);
  const [upgrades, setUpgrades] = useLocalStorage<Upgrade[]>('agarGameUpgrades', INITIAL_UPGRADES);
  const [challenges, setChallenges] = useLocalStorage<Challenge[]>('agarGameChallenges', INITIAL_CHALLENGES);
  const [settings, setSettings] = useLocalStorage<GameSettings>('agarGameSettings', INITIAL_SETTINGS);
  const [dailyDeal, setDailyDeal] = useLocalStorage<DailyDeal | null>('agarDailyDeal', null);
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUp[]>([]);
  const [selectedCosmetic, setSelectedCosmetic] = useLocalStorage<string | null>('agarSelectedCosmetic', null);
  const [telegramStars, setTelegramStars] = useLocalStorage<number>('agarTelegramStars', 0);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [playerSize, setPlayerSize] = useState(20);
  const [gameMode, setGameMode] = useState<'classic' | 'timeAttack' | 'battleRoyale' | 'team'>('classic');
  const [selectedTeam, setSelectedTeam] = useState<'red' | 'blue'>('red');

  // Handle daily resets and login streaks
  useEffect(() => {
    const today = new Date().toDateString();
    
    // Generate daily deal if none exists or if it's a new day
    if (!dailyDeal || new Date(dailyDeal.expiresAt).toDateString() !== today) {
      const availableUpgrades = upgrades.filter(u => u.price > 50); // Only discount expensive items
      if (availableUpgrades.length > 0) {
        const randomUpgrade = availableUpgrades[Math.floor(Math.random() * availableUpgrades.length)];
        const discountPercent = 20 + Math.floor(Math.random() * 31); // 20-50% discount
        
        setDailyDeal({
          upgradeId: randomUpgrade.id,
          discountPercent,
          expiresAt: today,
        });
      }
    }
    
    // Check if we need to reset daily lives
    if (stats.lastLifeReset !== today) {
      const updatedStats = {
        ...stats,
        livesRemaining: 10,
        lastLifeReset: today,
      };
      
      // Check login streak
      if (stats.lastLoginDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (stats.lastLoginDate === yesterday.toDateString()) {
          // Consecutive day - increment streak
          updatedStats.loginStreak += 1;
        } else {
          // Streak broken - reset to 1
          updatedStats.loginStreak = 1;
        }
        
        updatedStats.lastLoginDate = today;
        
        // Apply streak rewards
        const streakBonus = Math.min(updatedStats.loginStreak * 5, 50);
        updatedStats.totalPoints += streakBonus;
      }
      
      setStats(updatedStats);
    }
  }, [stats, setStats, dailyDeal, setDailyDeal, upgrades]);

  // Clean up expired power-ups
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setActivePowerUps(prev => prev.filter(powerUp => powerUp.expiresAt > now));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const updateStats = (points: number) => {
    setCurrentPoints(prev => prev + points);
  };
  
  const growPlayer = (amount: number) => {
    setPlayerSize(prev => Math.max(5, prev + amount));
  };

  const purchaseUpgrade = (upgradeId: string, priceOverride?: number) => {
    const upgrade = upgrades.find(u => u.id === upgradeId);
    const finalPrice = priceOverride ?? upgrade?.price ?? 0;
    if (!upgrade || stats.totalPoints < finalPrice) return;

    if (upgrade.category === 'powerup') {
      // Activate temporary power-up
      activatePowerUp(upgradeId);
    } else if (upgrade.category === 'utility') {
      // Handle utility purchases
      if (upgradeId === UPGRADE_IDS.EXTRA_LIVES) {
        refillLives();
      }
    } else {
      // Permanent upgrades
      setUpgrades(prev => 
        prev.map(u => 
          u.id === upgradeId ? { ...u, owned: true } : u
        )
      );
    }

    setStats(prev => ({
      ...prev,
      totalPoints: prev.totalPoints - finalPrice,
    }));
  };

  const purchaseWithStars = (upgradeId: string) => {
    const upgrade = upgrades.find(u => u.id === upgradeId);
    if (!upgrade) return;

    // Calculate star cost (for demo purposes, use price / 10)
    const starCost = Math.ceil(upgrade.price / 10);
    
    if (telegramStars < starCost) {
      console.log('Not enough Telegram Stars');
      return;
    }

    // Deduct stars
    setTelegramStars(prev => prev - starCost);

    // Apply upgrade effect
    if (upgrade.category === 'powerup') {
      activatePowerUp(upgradeId);
    } else if (upgrade.category === 'utility') {
      if (upgradeId === UPGRADE_IDS.EXTRA_LIVES) {
        refillLives();
      }
    } else {
      setUpgrades(prev => 
        prev.map(u => 
          u.id === upgradeId ? { ...u, owned: true } : u
        )
      );
    }
  };

  const openLootBox = (boxType: string): LootReward[] => {
    const boxCosts = {
      'mystery_crate': 5,
      'premium_crate': 15,
    };

    const cost = boxCosts[boxType as keyof typeof boxCosts] || 5;
    
    if (telegramStars < cost) {
      console.log('Not enough Telegram Stars for loot box');
      return [];
    }

    // Deduct stars
    setTelegramStars(prev => prev - cost);

    // Generate rewards
    const rewards: LootReward[] = [];
    const rewardCount = boxType === 'premium_crate' ? 2 + Math.floor(Math.random() * 3) : 1 + Math.floor(Math.random() * 3);

    for (let i = 0; i < rewardCount; i++) {
      const rand = Math.random();
      let rarity: 'common' | 'rare' | 'epic' | 'legendary';
      
      if (boxType === 'premium_crate') {
        if (rand < 0.1) rarity = 'legendary';
        else if (rand < 0.3) rarity = 'epic';
        else if (rand < 0.6) rarity = 'rare';
        else rarity = 'common';
      } else {
        if (rand < 0.02) rarity = 'legendary';
        else if (rand < 0.1) rarity = 'epic';
        else if (rand < 0.3) rarity = 'rare';
        else rarity = 'common';
      }

      const rewardType = Math.random();
      if (rewardType < 0.5) {
        // Points reward
        const pointValues = { common: 25, rare: 75, epic: 150, legendary: 300 };
        const points = pointValues[rarity];
        rewards.push({ type: 'points', value: points, rarity });
        
        // Apply points immediately
        setStats(prev => ({ ...prev, totalPoints: prev.totalPoints + points }));
      } else if (rewardType < 0.8) {
        // Stars reward
        const starValues = { common: 1, rare: 3, epic: 7, legendary: 15 };
        const stars = starValues[rarity];
        rewards.push({ type: 'stars', value: stars, rarity });
        
        // Apply stars immediately
        setTelegramStars(prev => prev + stars);
      } else {
        // Power-up reward
        const powerUps = [UPGRADE_IDS.SHIELD, UPGRADE_IDS.DOUBLE_POINTS];
        const powerUpId = powerUps[Math.floor(Math.random() * powerUps.length)];
        const powerUpName = upgrades.find(u => u.id === powerUpId)?.name || 'Power-up';
        rewards.push({ type: 'powerup', value: powerUpName, rarity });
        
        // Activate power-up immediately
        activatePowerUp(powerUpId);
      }
    }

    return rewards;
  };

  const activatePowerUp = (powerUpId: string) => {
    const upgrade = upgrades.find(u => u.id === powerUpId);
    if (!upgrade || !upgrade.effectDuration) return;

    const expiresAt = Date.now() + upgrade.effectDuration;
    
    setActivePowerUps(prev => [
      ...prev.filter(p => p.id !== powerUpId), // Remove existing same power-up
      {
        id: powerUpId,
        name: upgrade.name,
        expiresAt,
      }
    ]);
  };

  const refillLives = () => {
    setStats(prev => ({
      ...prev,
      livesRemaining: 10,
    }));
  };

  const startGame = () => {
    console.log('Starting game with mode:', gameMode);
    setGameActive(true);
    setCurrentPoints(0);
    setPlayerSize(20);
    console.log('Game started - gameActive:', true, 'playerSize:', 20);
  };

  const endGame = (finalScore: number) => {
    setGameActive(false);
    
    // Calculate multipliers
    const baseMultiplier = upgrades.find(u => u.id === UPGRADE_IDS.POINT_MULTIPLIER_1 && u.owned) ? 2 : 1;
    const powerUpMultiplier = activePowerUps.find(p => p.id === UPGRADE_IDS.DOUBLE_POINTS) ? 2 : 1;
    const totalScore = finalScore * baseMultiplier * powerUpMultiplier;
    
    setStats(prev => ({
      ...prev,
      totalPoints: prev.totalPoints + totalScore,
      gamesPlayed: prev.gamesPlayed + 1,
      highScore: Math.max(prev.highScore, totalScore),
    }));

    // Update daily games challenge
    updateChallengeProgress(CHALLENGE_TYPES.DAILY_GAMES, 1);
  };

  const useLife = (): boolean => {
    if (stats.livesRemaining <= 0) return false;
    
    setStats(prev => ({
      ...prev,
      livesRemaining: prev.livesRemaining - 1,
    }));
    return true;
  };

  const revivePlayer = () => {
    setGameActive(true);
    setPlayerSize(20);
  };

  const updateChallengeProgress = (challengeType: string, value: number) => {
    setChallenges(prev => 
      prev.map(challenge => {
        if (challenge.type === challengeType && !challenge.completed) {
          const newValue = challenge.currentValue + value;
          const completed = newValue >= challenge.targetValue;
          
          if (completed && !challenge.completed) {
            // Auto-claim reward
            setStats(prevStats => ({
              ...prevStats,
              totalPoints: prevStats.totalPoints + challenge.reward,
            }));
          }
          
          return {
            ...challenge,
            currentValue: Math.min(newValue, challenge.targetValue),
            completed,
          };
        }
        return challenge;
      })
    );
  };

  const claimChallengeReward = (challengeId: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge || !challenge.completed) return;

    setStats(prev => ({
      ...prev,
      totalPoints: prev.totalPoints + challenge.reward,
    }));
  };

  const resetAllData = () => {
    setStats(INITIAL_STATS);
    setUpgrades(INITIAL_UPGRADES);
    setChallenges(INITIAL_CHALLENGES);
    setSettings(INITIAL_SETTINGS);
    setActivePowerUps([]);
    setTelegramStars(0);
    setDailyDeal(null);
  };

  const updateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <GameContext.Provider value={{
      stats,
      upgrades,
      challenges,
      activePowerUps,
      settings,
      dailyDeal,
      selectedCosmetic,
      currentPoints,
      gameActive,
      playerSize,
      gameMode,
      selectedTeam,
      telegramStars,
      updateStats,
      purchaseUpgrade,
      purchaseWithStars,
      openLootBox,
      startGame,
      endGame,
      useLife,
      revivePlayer,
      resetAllData,
      updateChallengeProgress,
      claimChallengeReward,
      activatePowerUp,
      refillLives,
      setGameMode,
      setSelectedTeam,
      setSelectedCosmetic,
      growPlayer,
      updateSettings,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}