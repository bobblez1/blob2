import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { generateUniqueId } from '../utils/gameUtils';
import { showSuccess } from '../utils/toast';
import { supabase } from '../lib/supabase'; // Import supabase client

interface GameStats {
  totalPoints: number;
  gamesPlayed: number;
  highScore: number;
  livesRemaining: number;
  lastLifeReset: string;
  lastLoginDate: string;
  loginStreak: number;
  playerId: string; // This will now be linked to Supabase auth.uid
}

const INITIAL_STATS: GameStats = {
  totalPoints: 0,
  gamesPlayed: 0,
  highScore: 0,
  livesRemaining: 10,
  lastLifeReset: new Date().toDateString(),
  lastLoginDate: new Date().toDateString(),
  loginStreak: 1,
  playerId: 'guest_' + generateUniqueId(), // Default to guest ID, will be overwritten by auth
};

export function useGameStats() {
  const [stats, setStats] = useLocalStorage<GameStats>('agarGameStats', INITIAL_STATS);
  const [currentPoints, setCurrentPoints] = useState(0); // Points earned in current game

  // Effect to synchronize playerId with Supabase auth.uid
  useEffect(() => {
    const updatePlayerId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id && stats.playerId !== session.user.id) {
        setStats(prev => ({ ...prev, playerId: session.user.id }));
      } else if (!session?.user?.id && !stats.playerId.startsWith('guest_')) {
        // If user logs out, reset to a guest ID
        setStats(prev => ({ ...prev, playerId: 'guest_' + generateUniqueId() }));
      }
    };

    updatePlayerId(); // Initial check

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.id && stats.playerId !== session.user.id) {
        setStats(prev => ({ ...prev, playerId: session.user.id }));
      } else if (!session?.user?.id && !stats.playerId.startsWith('guest_')) {
        setStats(prev => ({ ...prev, playerId: 'guest_' + generateUniqueId() }));
      }
    });

    return () => subscription.unsubscribe();
  }, [stats.playerId, setStats]);


  // Handle daily resets and login streaks
  useEffect(() => {
    const today = new Date().toDateString();
    
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
        if (streakBonus > 0) {
          showSuccess(`Login Streak! +${streakBonus} points!`);
        }
      }
      
      setStats(updatedStats);
    }
  }, [stats, setStats]);

  const updateStats = useCallback((points: number) => {
    setCurrentPoints(prev => prev + points);
  }, []);

  const finalizeGameStats = useCallback((finalScore: number, permanentPointMultiplier: number, powerUpMultiplier: number) => {
    const totalScore = finalScore * permanentPointMultiplier * powerUpMultiplier;
    setStats((prev: GameStats) => ({
      ...prev,
      totalPoints: prev.totalPoints + totalScore,
      gamesPlayed: prev.gamesPlayed + 1,
      highScore: Math.max(prev.highScore, totalScore),
    }));
  }, [setStats]);

  const useLife = useCallback((): boolean => {
    if (stats.livesRemaining <= 0) return false;
    
    setStats((prev: GameStats) => ({
      ...prev,
      livesRemaining: prev.livesRemaining - 1,
    }));
    return true;
  }, [stats.livesRemaining, setStats]);

  const refillLives = useCallback(() => {
    setStats((prev: GameStats) => ({
      ...prev,
      livesRemaining: 10,
    }));
  }, [setStats]);

  const resetStats = useCallback(() => {
    setStats(INITIAL_STATS);
    setCurrentPoints(0);
  }, [setStats]);

  return {
    stats,
    currentPoints,
    setCurrentPoints, // Allow GameContext to reset current game points
    updateStats,
    finalizeGameStats,
    useLife,
    refillLives,
    resetStats,
  };
}