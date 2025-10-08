import { useState, useCallback } from 'react';
import { GAME_CONSTANTS } from '../constants/gameConstants';

export function usePlayer() {
  const [playerSize, setPlayerSize] = useState<number>(GAME_CONSTANTS.PLAYER_INITIAL_SIZE);

  const growPlayer = useCallback((amount: number) => {
    setPlayerSize(prev => Math.max(GAME_CONSTANTS.PLAYER_MIN_SIZE, prev + amount));
  }, []);

  const resetPlayerSize = useCallback(() => {
    setPlayerSize(GAME_CONSTANTS.PLAYER_INITIAL_SIZE);
  }, []);

  return {
    playerSize,
    setPlayerSize,
    growPlayer,
    resetPlayerSize,
  };
}