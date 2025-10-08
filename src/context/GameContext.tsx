import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { UPGRADE_IDS, CHALLENGE_TYPES } from '../constants/gameConstants';
import { GameSettings, Upgrade, Challenge, LootReward } from '../types/gameTypes';
import { FOOD_COLORS } from '../constants/gameConstants';
import { showSuccess } from '../utils/toast';
import { generateUniqueId } from '../utils/gameUtils';
import { useGameSettings } from '../hooks/useGameSettings';
import { useGameStats } from '../hooks/useGameStats';
import { useGameProgression } from '../hooks/useGameProgression';
import { useGameEconomy } from '../hooks/useGameEconomy'; // Import the new hook

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
  activatePowerUp: (powerUpId: string, allUpgrades: Upgrade[]) => void;
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
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUp[]>([]);
  const [selectedCosmetic, setSelectedCosmetic] = useLocalStorage<string | null>('agarSelectedCosmetic', null);
  const [gameActive, setGameActive] = useState(false);
  const [playerSize, setPlayerSize] = useState(20);
  const [gameMode, setGameMode] = useState<'classic' | 'timeAttack' | 'battleRoyale' | 'team'>('classic');
  const [selectedTeam, setSelectedTeam] = useState<'red' | 'blue'>('red');

  // Define activatePowerUp here, accepting allUpgrades as an argument
  const activatePowerUp = useCallback((powerUpId: string, allUpgrades: Upgrade[]) => {
    const upgrade = allUpgrades.find(u => u.id === powerUpId);
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
  }, []); // No dependency on `upgrades` here, as it's passed as an argument.

  const {
    upgrades,
    challenges,
    purchaseUpgrade: progressionPurchaseUpgrade, // Renamed to avoid conflict
    updateChallengeProgress,
    claimChallengeReward,
    resetProgression,
    getSpeedBoostMultiplier,
    getPointMultiplier,
  } = useGameProgression({ stats, setStats }, refillLives, activatePowerUp); // Pass activatePowerUp here.

  const {
    telegramStars,
    dailyDeal,
    purchaseWithStars,
    openLootBox,
    resetEconomy,
  } = useGameEconomy(
    { setStats },
    { upgrades, purchaseUpgrade: progressionPurchaseUpgrade },
    { activatePowerUp }
  );

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

  // Wrapper for progressionPurchaseUpgrade
  const purchaseUpgrade = useCallback((upgradeId: string, priceOverride?: number) => {
    progressionPurchaseUpgrade(upgradeId, priceOverride);
  }, [progressionPurchaseUpgrade]);

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
    resetEconomy(); // Reset economy data
    updateSettings({});
    setActivePowerUps([]);
    setSelectedCosmetic(null); // Reset selected cosmetic
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