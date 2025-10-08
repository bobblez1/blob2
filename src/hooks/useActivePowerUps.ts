import { useState, useEffect, useCallback } from 'react';
import { ActivePowerUp, Upgrade } from '../types/gameTypes';
import { showSuccess } from '../utils/toast';

export function useActivePowerUps(allUpgrades: Upgrade[]) {
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUp[]>([]);

  // Clean up expired power-ups
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setActivePowerUps(prev => prev.filter(powerUp => powerUp.expiresAt > now));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const activatePowerUp = useCallback((powerUpId: string) => {
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
  }, [allUpgrades]);

  const resetActivePowerUps = useCallback(() => {
    setActivePowerUps([]);
  }, []);

  return {
    activePowerUps,
    activatePowerUp,
    resetActivePowerUps,
  };
}