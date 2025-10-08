import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UPGRADE_IDS, CHALLENGE_TYPES } from '../constants/gameConstants';
import { GameSettings, Upgrade, Challenge, LootReward, ActivePowerUp } from '../types/gameTypes';
import { showSuccess } from '../utils/toast';

// Import all custom hooks
import { useGameSettings } from '../hooks/useGameSettings';
import { useGameStats } from '../hooks/useGameStats';
import { useUpgrades } from '../hooks/useUpgrades'; // Renamed from useGameProgression
import { useGameEconomy } from '../hooks/useGameEconomy';
import { useActivePowerUps } from '../hooks/useActivePowerUps';
import { usePlayer } from '../hooks/usePlayer'; // New hook
import { useGameLifecycle } from '../hooks/useGameLifecycle'; // New hook
import { useChallenges } from '../hooks/useChallenges'; // New hook
import { useGameSession, GameMode, Team } from '../hooks/useGameSession'; // New hook

interface DailyDeal {
  upgradeId: string;
  discountPercent: number;
  expiresAt: string;
}

interface GameContextType {
  // From useGameStats
  stats: ReturnType<typeof useGameStats>['stats'];
  currentPoints: number;
  updateStats: ReturnType<typeof useGameStats>['updateStats'];
  useLife: ReturnType<typeof useGameStats>['useLife'];
  refillLives: ReturnType<typeof useGameStats>['refillLives'];

  // From useUpgrades
  upgrades: Upgrade[];
  purchaseUpgrade: (upgradeId: string, priceOverride?: number) => void;
  getSpeedBoostMultiplier: () => number;
  getPointMultiplier: () => number;

  // From useChallenges
  challenges: Challenge[];
  updateChallengeProgress: (challengeType: string, value: number) => void;
  claimChallengeReward: (challengeId: string) => void;

  // From useActivePowerUps
  activePowerUps: ActivePowerUp[];
  activatePowerUp: (powerUpId: string) => void;

  // From useGameSettings
  settings: GameSettings;
  updateSettings: (settings: Partial<GameSettings>) => void;
  selectedCosmetic: string | null;
  setSelectedCosmetic: (cosmeticId: string | null) => void;

  // From useGameEconomy
  dailyDeal: DailyDeal | null;
  telegramStars: number;
  purchaseWithStars: (upgradeId: string) => void;
  openLootBox: (boxType: string) => LootReward[];

  // From usePlayer
  playerSize: number;
  growPlayer: (amount: number) => void;

  // From useGameLifecycle
  gameActive: boolean;
  isPaused: boolean;
  startGame: () => void;
  endGame: (finalScore: number) => void;
  revivePlayer: () => boolean; // Returns true if revived, false otherwise
  setIsPaused: (paused: boolean) => void;

  // From useGameSession
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  selectedTeam: Team;
  setSelectedTeam: (team: Team) => void;

  // Global reset
  resetAllData: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  // Core Game State Hooks
  const { stats, setStats, currentPoints, setCurrentPoints, updateStats, finalizeGameStats, useLife, refillLives, resetStats } = useGameStats();
  const { settings, updateSettings, selectedCosmetic, setSelectedCosmetic, resetSettings } = useGameSettings();
  const { playerSize, setPlayerSize, growPlayer, resetPlayerSize } = usePlayer();
  const { gameMode, setGameMode, selectedTeam, setSelectedTeam, resetGameSession } = useGameSession();

  // Progression & Economy Hooks (depend on core state)
  const { activePowerUps, activatePowerUp, resetActivePowerUps } = useActivePowerUps(); // No longer needs upgrades as a prop
  const { upgrades, purchaseUpgrade: progressionPurchaseUpgrade, resetUpgrades, getSpeedBoostMultiplier, getPointMultiplier } = useUpgrades(
    { stats, setStats },
    { activatePowerUp, refillLives }
  );
  const { challenges, updateChallengeProgress, claimChallengeReward, resetChallenges } = useChallenges({ setStats });
  const { telegramStars, dailyDeal, purchaseWithStars: economyPurchaseWithStars, openLootBox: economyOpenLootBox, resetEconomy } = useGameEconomy(
    { setStats },
    { upgrades, purchaseUpgrade: progressionPurchaseUpgrade },
    { activatePowerUp }
  );

  // Game Lifecycle Hook (depends on multiple hooks)
  const { gameActive, setGameActive, isPaused, setIsPaused, startGame, endGame, revivePlayer } = useGameLifecycle({
    setCurrentPoints,
    finalizeGameStats,
    useLife,
    resetPlayerSize,
    resetActivePowerUps,
    updateChallengeProgress,
    getPointMultiplier,
    activePowerUps,
    upgrades, // Pass upgrades to check for AUTO_REVIVE
  });
  
  // Expose simplified purchase functions
  const purchaseUpgrade = useCallback((upgradeId: string, priceOverride?: number) => {
    progressionPurchaseUpgrade(upgradeId, priceOverride);
  }, [progressionPurchaseUpgrade]);

  const purchaseWithStars = useCallback((upgradeId: string) => {
    economyPurchaseWithStars(upgradeId);
  }, [economyPurchaseWithStars]);

  const openLootBox = useCallback((boxType: string): LootReward[] => {
    return economyOpenLootBox(boxType);
  }, [economyOpenLootBox]);

  // Global reset function
  const resetAllData = useCallback(() => {
    resetStats();
    resetUpgrades();
    resetChallenges();
    resetEconomy();
    resetActivePowerUps();
    resetSettings();
    resetPlayerSize();
    resetGameSession();
    setGameActive(false);
    setIsPaused(false);
    showSuccess('All game data reset!');
  }, [
    resetStats, resetUpgrades, resetChallenges, resetEconomy, resetActivePowerUps,
    resetSettings, resetPlayerSize, resetGameSession, setGameActive, setIsPaused
  ]);

  return (
    <GameContext.Provider value={{
      stats,
      currentPoints,
      updateStats,
      useLife,
      refillLives,
      upgrades,
      purchaseUpgrade,
      getSpeedBoostMultiplier,
      getPointMultiplier,
      challenges,
      updateChallengeProgress,
      claimChallengeReward,
      activePowerUps,
      activatePowerUp,
      settings,
      updateSettings,
      selectedCosmetic,
      setSelectedCosmetic,
      dailyDeal,
      telegramStars,
      purchaseWithStars,
      openLootBox,
      playerSize,
      growPlayer,
      gameActive,
      isPaused,
      startGame,
      endGame,
      revivePlayer,
      setIsPaused,
      gameMode,
      setGameMode,
      selectedTeam,
      setSelectedTeam,
      resetAllData,
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