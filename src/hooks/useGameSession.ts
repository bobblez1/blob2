import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export type GameMode = 'classic' | 'timeAttack' | 'battleRoyale' | 'team';
export type Team = 'red' | 'blue';

export function useGameSession() {
  const [gameMode, setGameMode] = useLocalStorage<GameMode>('agarGameMode', 'classic');
  const [selectedTeam, setSelectedTeam] = useLocalStorage<Team>('agarSelectedTeam', 'red');

  const resetGameSession = useCallback(() => {
    setGameMode('classic');
    setSelectedTeam('red');
  }, [setGameMode, setSelectedTeam]);

  return {
    gameMode,
    setGameMode,
    selectedTeam,
    setSelectedTeam,
    resetGameSession,
  };
}