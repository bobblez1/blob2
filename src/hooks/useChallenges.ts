import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { CHALLENGE_TYPES } from '../constants/gameConstants';
import { Challenge } from '../types/gameTypes';
import { showSuccess } from '../utils/toast';
import { GameStats } from './useGameStats'; // Import GameStats

interface GameStatsSetter {
  setStats: (updater: (prevStats: GameStats) => GameStats) => void;
}

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

export function useChallenges(gameStatsSetter: GameStatsSetter) {
  const [challenges, setChallenges] = useLocalStorage<Challenge[]>('agarGameChallenges', INITIAL_CHALLENGES);

  const updateChallengeProgress = useCallback((challengeType: string, value: number) => {
    setChallenges((prev: Challenge[]) => 
      prev.map((challenge: Challenge) => {
        if (challenge.type === challengeType && !challenge.completed) {
          const newValue = challenge.currentValue + value;
          const completed = newValue >= challenge.targetValue;
          
          if (completed && !challenge.completed) {
            gameStatsSetter.setStats((prevStats: GameStats) => ({ 
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
  }, [gameStatsSetter, setChallenges]);

  const claimChallengeReward = useCallback((challengeId: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge || !challenge.completed) return;

    gameStatsSetter.setStats((prev: GameStats) => ({ 
      ...prev,
      totalPoints: prev.totalPoints + challenge.reward,
    }));
  }, [challenges, gameStatsSetter]);

  const resetChallenges = useCallback(() => {
    setChallenges(INITIAL_CHALLENGES);
  }, [setChallenges]);

  return {
    challenges,
    updateChallengeProgress,
    claimChallengeReward,
    resetChallenges,
  };
}