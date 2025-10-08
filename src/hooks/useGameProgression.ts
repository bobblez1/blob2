import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { UPGRADE_IDS, CHALLENGE_TYPES } from '../constants/gameConstants';
import { Upgrade, Challenge } from '../types/gameTypes';
import { showSuccess } from '../utils/toast';

interface GameStatsSetter {
  setStats: (updater: (prevStats: any) => any) => void;
  stats: { totalPoints: number };
}

const INITIAL_UPGRADES: Upgrade[] = [
  // Permanent Upgrades - Speed Boost
  {
    id: UPGRADE_IDS.SPEED_BOOST_1,
    name: 'Speed Boost I',
    description: 'Increase movement speed by 25%',
    price: 100,
    owned: false,
    type: 'speed',
    category: 'permanent',
    effectValue: 0.25, // 25% speed increase
  },
  {
    id: UPGRADE_IDS.SPEED_BOOST_2,
    name: 'Speed Boost II',
    description: 'Increase movement speed by 50%',
    price: 200,
    owned: false,
    type: 'speed',
    category: 'permanent',
    effectValue: 0.50, // 50% speed increase
  },
  {
    id: UPGRADE_IDS.SPEED_BOOST_3,
    name: 'Speed Boost III',
    description: 'Increase movement speed by 75%',
    price: 350,
    owned: false,
    type: 'speed',
    category: 'permanent',
    effectValue: 0.75, // 75% speed increase
  },
  // Permanent Upgrades - Point Multiplier
  {
    id: UPGRADE_IDS.POINT_MULTIPLIER_1,
    name: '2x Point Multiplier I',
    description: 'Double points from eating blobs',
    price: 150,
    owned: false,
    type: 'multiplier',
    category: 'permanent',
    effectValue: 2, // 2x multiplier
  },
  {
    id: UPGRADE_IDS.POINT_MULTIPLIER_2,
    name: '3x Point Multiplier II',
    description: 'Triple points from eating blobs',
    price: 300,
    owned: false,
    type: 'multiplier',
    category: 'permanent',
    effectValue: 3, // 3x multiplier
  },
  {
    id: UPGRADE_IDS.POINT_MULTIPLIER_3,
    name: '4x Point Multiplier III',
    description: 'Quadruple points from eating blobs',
    price: 500,
    owned: false,
    type: 'multiplier',
    category: 'permanent',
    effectValue: 4, // 4x multiplier
  },
  // Single-level Permanent Upgrades
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

export function useGameProgression(
  gameStatsSetter: GameStatsSetter, 
  refillLives: () => void, 
  activatePowerUp: (powerUpId: string, allUpgrades: Upgrade[]) => void // Updated signature
) {
  const [upgrades, setUpgrades] = useLocalStorage<Upgrade[]>('agarGameUpgrades', INITIAL_UPGRADES);
  const [challenges, setChallenges] = useLocalStorage<Challenge[]>('agarGameChallenges', INITIAL_CHALLENGES);

  const purchaseUpgrade = useCallback((upgradeId: string, priceOverride?: number) => {
    const upgrade = upgrades.find(u => u.id === upgradeId);
    const finalPrice = priceOverride ?? upgrade?.price ?? 0;
    if (!upgrade || gameStatsSetter.stats.totalPoints < finalPrice) return;

    if (upgrade.category === 'powerup') {
      activatePowerUp(upgradeId, upgrades); // Pass current upgrades to activatePowerUp
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

    gameStatsSetter.setStats(prev => ({
      ...prev,
      totalPoints: prev.totalPoints - finalPrice,
    }));
  }, [upgrades, gameStatsSetter, refillLives, activatePowerUp]);

  const updateChallengeProgress = useCallback((challengeType: string, value: number) => {
    setChallenges(prev => 
      prev.map(challenge => {
        if (challenge.type === challengeType && !challenge.completed) {
          const newValue = challenge.currentValue + value;
          const completed = newValue >= challenge.targetValue;
          
          if (completed && !challenge.completed) {
            gameStatsSetter.setStats(prevStats => ({ 
              ...prevStats,
              totalPoints: prevStats.totalPoints + challenge.reward,
            }));
            showSuccess(`Challenge Completed: ${challenge.name}! +${challenge.reward} points!`);
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
  }, [gameStatsSetter]);

  const claimChallengeReward = useCallback((challengeId: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge || !challenge.completed) return;

    gameStatsSetter.setStats(prev => ({ 
      ...prev,
      totalPoints: prev.totalPoints + challenge.reward,
    }));
  }, [challenges, gameStatsSetter]);

  const resetProgression = useCallback(() => {
    setUpgrades(INITIAL_UPGRADES);
    setChallenges(INITIAL_CHALLENGES);
  }, [setUpgrades, setChallenges]);

  const getSpeedBoostMultiplier = useCallback(() => {
    const speedUpgrades = upgrades.filter(u => u.type === 'speed' && u.owned && u.effectValue !== undefined);
    if (speedUpgrades.length === 0) return 0;
    return Math.max(...speedUpgrades.map(u => u.effectValue!));
  }, [upgrades]);

  const getPointMultiplier = useCallback(() => {
    const multiplierUpgrades = upgrades.filter(u => u.type === 'multiplier' && u.owned && u.effectValue !== undefined);
    if (multiplierUpgrades.length === 0) return 1;
    return Math.max(...multiplierUpgrades.map(u => u.effectValue!));
  }, [upgrades]);

  return {
    upgrades,
    challenges,
    purchaseUpgrade,
    updateChallengeProgress,
    claimChallengeReward,
    resetProgression,
    getSpeedBoostMultiplier,
    getPointMultiplier,
  };
}