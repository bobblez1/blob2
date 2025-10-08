import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { UPGRADE_IDS, CHALLENGE_TYPES } from '../constants/gameConstants';
import { GameSettings, Upgrade, Challenge, LootReward, ActivePowerUp } from '../types/gameTypes'; // Import ActivePowerUp
import { FOOD_COLORS } from '../constants/gameConstants';
import { showSuccess } from '../utils/toast';
import { generateUniqueId } from '../utils/gameUtils';
import { useGameSettings } from '../hooks/useGameSettings';
import { useGameStats } from '../hooks/useGameStats';
import { useGameProgression } from '../hooks/useGameProgression';
import { useGameEconomy } from '../hooks/useGameEconomy';
import { useActivePowerUps } from '../hooks/useActivePowerUps'; // Import the new hook

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
  activatePowerUp: (powerUpId: string) => void; // Updated signature
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
  const [selectedCosmetic, setSelectedCosmetic] = useLocalStorage<string | null>('agarSelectedCosmetic', null);
  const [gameActive, setGameActive] = useState(false);
  const [playerSize, setPlayerSize] = useState(20);
  const [gameMode, setGameMode] = useState<'classic' | 'timeAttack' | 'battleRoyale' | 'team'>('classic');
  const [selectedTeam, setSelectedTeam] = useState<'red' | 'blue'>('red');

  const {
    upgrades,
    challenges,
    purchaseUpgrade: progressionPurchaseUpgrade, // Renamed to avoid conflict
    updateChallengeProgress,
    claimChallengeReward,
    resetProgression,
    getSpeedBoostMultiplier,
    getPointMultiplier,
  } = useGameProgression({ stats, setStats }, refillLives, (powerUpId: string) => activatePowerUp(powerUpId)); // Pass activatePowerUp here.

  const { activePowerUps, activatePowerUp, resetActivePowerUps } = useActivePowerUps(upgrades); // Use the new hook

  const {
    telegramStars,
    dailyDeal,
    purchaseWithStars: economyPurchaseWithStars,
    openLootBox: economyOpenLootBox,
    resetEconomy,
  } = useGameEconomy(
    { setStats },
    { upgrades, purchaseUpgrade: progressionPurchaseUpgrade },
    { activatePowerUp }
  );
  
  const growPlayer = (amount: number) => {
    setPlayerSize(prev => Math.max(5, prev + amount));
  };

  // Wrapper for progressionPurchaseUpgrade
  const purchaseUpgrade = useCallback((upgradeId: string, priceOverride?: number) => {
    progressionPurchaseUpgrade(upgradeId, priceOverride);
  }, [progressionPurchaseUpgrade]);

  // Wrapper for economyPurchaseWithStars
  const purchaseWithStars = useCallback((upgradeId: string) => {
    economyPurchaseWithStars(upgradeId);
  }, [economyPurchaseWithStars]);

  // Wrapper for economyOpenLootBox
  const openLootBox = useCallback((boxType: string): LootReward[] => {
    return economyOpenLootBox(boxType);
  }, [economyOpenLootBox]);

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
    resetProgression();
    resetEconomy();
    resetActivePowerUps(); // Reset active power-ups
    updateSettings({});
    setSelectedCosmetic(null);
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