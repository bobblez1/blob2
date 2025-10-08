import { useState, useCallback } from 'react';
import { UPGRADE_IDS, CHALLENGE_TYPES } from '../constants/gameConstants';
import { ActivePowerUp, Upgrade } from '../types/gameTypes';

interface GameLifecycleProps {
  setCurrentPoints: (points: number) => void;
  finalizeGameStats: (finalScore: number, permanentPointMultiplier: number, powerUpMultiplier: number) => void;
  useLife: () => boolean;
  resetPlayerSize: () => void;
  resetActivePowerUps: () => void;
  updateChallengeProgress: (challengeType: string, value: number) => void;
  getPointMultiplier: () => number;
  activePowerUps: ActivePowerUp[];
  upgrades: Upgrade[]; // Needed to check for AUTO_REVIVE
}

export function useGameLifecycle({
  setCurrentPoints,
  finalizeGameStats,
  useLife,
  resetPlayerSize,
  resetActivePowerUps,
  updateChallengeProgress,
  getPointMultiplier,
  activePowerUps,
  upgrades,
}: GameLifecycleProps) {
  const [gameActive, setGameActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const startGame = useCallback(() => {
    setGameActive(true);
    setIsPaused(false);
    setCurrentPoints(0); // Reset current game points
    resetPlayerSize(); // Reset player size
    resetActivePowerUps(); // Reset any active power-ups
    console.log('Game started - gameActive:', true);
  }, [setCurrentPoints, resetPlayerSize, resetActivePowerUps]);

  const endGame = useCallback((finalScore: number) => {
    setGameActive(false);
    setIsPaused(false);
    
    const permanentPointMultiplier = getPointMultiplier();
    const powerUpMultiplier = activePowerUps.find(p => p.id === UPGRADE_IDS.DOUBLE_POINTS) ? 2 : 1;
    
    finalizeGameStats(finalScore, permanentPointMultiplier, powerUpMultiplier);
    updateChallengeProgress(CHALLENGE_TYPES.DAILY_GAMES, 1);
  }, [finalizeGameStats, updateChallengeProgress, getPointMultiplier, activePowerUps]);

  const revivePlayer = useCallback(() => {
    const hasAutoRevive = upgrades.find(u => u.id === UPGRADE_IDS.AUTO_REVIVE && u.owned);
    if (hasAutoRevive) {
      resetPlayerSize();
      // No need to call useLife here, as auto-revive doesn't consume a life
      return true;
    } else {
      // If no auto-revive, consume a life
      return useLife();
    }
  }, [upgrades, useLife, resetPlayerSize]);

  return {
    gameActive,
    setGameActive,
    isPaused,
    setIsPaused,
    startGame,
    endGame,
    revivePlayer,
  };
}