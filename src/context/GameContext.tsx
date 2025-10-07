import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { UPGRADE_IDS, CHALLENGE_TYPES } from '../constants/gameConstants';
import { GameSettings, Upgrade, Challenge, LootReward } from '../types/gameTypes'; // Import Upgrade and Challenge interfaces
import { FOOD_COLORS } from '../constants/gameConstants';
import { showSuccess } from '../utils/toast';
import { generateUniqueId } from '../utils/gameUtils';
import { useGameSettings } from '../hooks/useGameSettings';
import { useGameStats } from '../hooks/useGameStats';
import { useGameProgression } from '../hooks/useGameProgression'; // Import the new hook

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

interface GameContextType {
  stats: ReturnType<typeof useGameStats>['stats'];
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
  updateStats: ReturnType<typeof useGameStats>['updateStats'];
  growPlayer: (amount: number) => void;
  purchaseUpgrade: (upgradeId: string, priceOverride?: number) => void;
  purchaseWithStars: (upgradeId: string) => void;
  openLootBox: (boxType: string) => LootReward[];
  startGame: (mode?: 'classic' | 'timeAttack' | 'battleRoyale' | 'team') => void;
  endGame: (finalScore: number) => void;
  useLife: ReturnType<typeof useGameStats>['useLife'];
  revivePlayer: () => void;
  resetAllData: () => void;
  updateChallengeProgress: (challengeType: string, value: number) => void;
  claimChallengeReward: (challengeId: string) => void;
  activatePowerUp: (powerUpId: string) => void;
  refillLives: ReturnType<typeof useGameStats>['refillLives'];
  setGameMode: (mode: 'classic' | 'timeAttack' | 'battleRoyale' | 'team') => void;
  setSelectedTeam: (team: 'red' | 'blue') => void;
  setSelectedCosmetic: (cosmeticId: string | null) => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
  getSpeedBoostMultiplier: () => number;
  getPointMultiplier: () => number;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { stats, setStats, currentPoints, setCurrentPoints, updateStats, finalizeGameStats, useLife, refillLives, resetStats } = useGameStats();
  const { settings, updateSettings } = useGameSettings();
  const [dailyDeal, setDailyDeal] = useLocalStorage<DailyDeal | null>('agarDailyDeal', null);
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUp[]>([]);
  const [selectedCosmetic, setSelectedCosmetic] = useLocalStorage<string | null>('agarSelectedCosmetic', null);
  const [telegramStars, setTelegramStars] = useLocalStorage<number>('agarTelegramStars', 0);
  const [gameActive, setGameActive] = useState(false);
  const [playerSize, setPlayerSize] = useState(20);
  const [gameMode, setGameMode] = useState<'classic' | 'timeAttack' | 'battleRoyale' | 'team'>('classic');
  const [selectedTeam, setSelectedTeam] = useState<'red' | 'blue'>('red');

  // Function to activate power-up, passed to useGameProgression
  const activatePowerUp = useCallback((powerUpId: string) => {
    const upgrade = upgrades.find(u => u.id === powerUpId);
    if (!upgrade || !upgrade.effectDuration) return;

    const expiresAt = Date.now() + upgrade.effectDuration;
    
    setActivePowerUps(prev => [
      ...prev.filter(p => p.id !== powerUpId),
      {
        id: powerUpId,
        name: upgrade.name,
        expiresAt,
      }
    ]);
    showSuccess(`${upgrade.name} activated!`);
  }, [upgrades]); // Depend on upgrades to find the power-up details

  const {
    upgrades,
    challenges,
    purchaseUpgrade,
    updateChallengeProgress,
    claimChallengeReward,
    resetProgression,
    getSpeedBoostMultiplier,
    getPointMultiplier,
  } = useGameProgression({ stats, setStats }, refillLives, activatePowerUp);

  // Generate daily deal if none exists or if it's a new day
  useEffect(() => {
    const today = new Date().toDateString();
    if (!dailyDeal || new Date(dailyDeal.expiresAt).toDateString() !== today) {
      const availableUpgrades = upgrades.filter(u => u.price > 50);
      if (availableUpgrades.length > 0) {
        const randomUpgrade = availableUpgrades[Math.floor(Math.random() * availableUpgrades.length)];
        const discountPercent = 20 + Math.floor(Math.random() * 31);
        
        setDailyDeal({
          upgradeId: randomUpgrade.id,
          discountPercent,
          expiresAt: today,
        });
      }
    }
  }, [dailyDeal, setDailyDeal, upgrades]);

  // Clean up expired power-ups
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setActivePowerUps(prev => prev.filter(powerUp => powerUp.expiresAt > now));
    }, 1000);

    return () => clearInterval(interval);
  }, []);
  
  const growPlayer = (amount: number) => {
    setPlayerSize(prev => Math.max(5, prev + amount));
  };

  const purchaseWithStars = (upgradeId: string) => {
    const upgrade = upgrades.find(u => u.id === upgradeId);
    if (!upgrade) return;

    const starCost = Math.ceil(upgrade.price / 10);
    
    if (telegramStars < starCost) {
      console.log('Not enough Telegram Stars');
      return [];
    }

    setTelegramStars(prev => prev - starCost);

    if (upgrade.category === 'powerup') {
      activatePowerUp(upgradeId);
    } else if (upgrade.category === 'utility') {
      if (upgradeId === UPGRADE_IDS.EXTRA_LIVES) {
        refillLives();
        showSuccess('Lives refilled!');
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

    setTelegramStars(prev => prev - cost);

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
        const pointValues = { common: 25, rare: 75, epic: 150, legendary: 300 };
        const points = pointValues[rarity];
        rewards.push({ type: 'points', value: points, rarity });
        
        setStats(prev => ({ ...prev, totalPoints: prev.totalPoints + points }));
      } else if (rewardType < 0.8) {
        const starValues = { common: 1, rare: 3, epic: 7, legendary: 15 };
        const stars = starValues[rarity];
        rewards.push({ type: 'stars', value: stars, rarity });
        
        setTelegramStars(prev => prev + stars);
      } else {
        const powerUps = [UPGRADE_IDS.SHIELD, UPGRADE_IDS.DOUBLE_POINTS];
        const powerUpId = powerUps[Math.floor(Math.random() * powerUps.length)];
        const powerUpName = upgrades.find(u => u.id === powerUpId)?.name || 'Power-up';
        rewards.push({ type: 'powerup', value: powerUpName, rarity });
        
        activatePowerUp(powerUpId);
      }
    }

    return rewards;
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
    
    const permanentPointMultiplier = getPointMultiplier();
    const powerUpMultiplier = activePowerUps.find(p => p.id === UPGRADE_IDS.DOUBLE_POINTS) ? 2 : 1;
    
    finalizeGameStats(finalScore, permanentPointMultiplier, powerUpMultiplier);

    updateChallengeProgress(CHALLENGE_TYPES.DAILY_GAMES, 1);
  };

  const revivePlayer = () => {
    setGameActive(true);
    setPlayerSize(20);
  };

  const resetAllData = () => {
    resetStats();
    resetProgression(); // Reset upgrades and challenges via useGameProgression
    updateSettings({});
    setActivePowerUps([]);
    setTelegramStars(0);
    setDailyDeal(null);
    showSuccess('All game data reset!');
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
      getSpeedBoostMultiplier,
      getPointMultiplier,
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