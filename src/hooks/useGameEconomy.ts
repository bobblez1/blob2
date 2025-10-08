import { useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { UPGRADE_IDS } from '../constants/gameConstants';
import { Upgrade, LootReward } from '../types/gameTypes';
import { showSuccess } from '../utils/toast';

interface DailyDeal {
  upgradeId: string;
  discountPercent: number;
  expiresAt: string;
}

interface GameStatsSetter {
  setStats: (updater: (prevStats: any) => any) => void;
}

interface GameProgressionActions {
  upgrades: Upgrade[];
  purchaseUpgrade: (upgradeId: string, priceOverride?: number) => void;
}

interface GameContextActions {
  activatePowerUp: (powerUpId: string, allUpgrades: Upgrade[]) => void;
}

export function useGameEconomy(
  gameStatsSetter: GameStatsSetter,
  gameProgressionActions: GameProgressionActions,
  gameContextActions: GameContextActions
) {
  const [telegramStars, setTelegramStars] = useLocalStorage<number>('agarTelegramStars', 0);
  const [dailyDeal, setDailyDeal] = useLocalStorage<DailyDeal | null>('agarDailyDeal', null);

  const { upgrades, purchaseUpgrade: progressionPurchaseUpgrade } = gameProgressionActions;
  const { activatePowerUp } = gameContextActions;

  // Generate daily deal if none exists or if it's a new day
  useEffect(() => {
    const today = new Date().toDateString();
    if (!dailyDeal || new Date(dailyDeal.expiresAt).toDateString() !== today) {
      const availableUpgrades = upgrades.filter(u => u.price > 50);
      if (availableUpgrades.length > 0) {
        const randomUpgrade = availableUpgrades[Math.floor(Math.random() * availableUpgrades.length)];
        const discountPercent = 20 + Math.floor(Math.random() * 31);
        
        setDailyDeal({
          upgradeId: randomUpgrade.id,
          discountPercent,
          expiresAt: today,
        });
      }
    }
  }, [dailyDeal, setDailyDeal, upgrades]);

  const purchaseWithStars = useCallback((upgradeId: string) => {
    const upgrade = upgrades.find(u => u.id === upgradeId);
    if (!upgrade) return;

    const starCost = Math.ceil(upgrade.price / 10);
    
    if (telegramStars < starCost) {
      console.log('Not enough Telegram Stars');
      return;
    }

    setTelegramStars((prev: number) => prev - starCost);

    if (upgrade.category === 'powerup') {
      activatePowerUp(upgradeId, upgrades);
    } else if (upgrade.category === 'utility') {
      // Utility items like 'EXTRA_LIVES' are handled by useGameProgression's purchaseUpgrade
      // We can call it with a price override of 0 since stars are used.
      progressionPurchaseUpgrade(upgradeId, 0);
    } else {
      // For permanent upgrades and cosmetics, use progressionPurchaseUpgrade with 0 price
      progressionPurchaseUpgrade(upgradeId, 0);
      showSuccess(`Purchased ${upgrade.name} with stars!`);
    }
  }, [telegramStars, upgrades, activatePowerUp, progressionPurchaseUpgrade, setTelegramStars]);

  const openLootBox = useCallback((boxType: string): LootReward[] => {
    const boxCosts = {
      'mystery_crate': 5,
      'premium_crate': 15,
    };

    const cost = boxCosts[boxType as keyof typeof boxCosts] || 5;
    
    if (telegramStars < cost) {
      console.log('Not enough Telegram Stars for loot box');
      return [];
    }

    setTelegramStars((prev: number) => prev - cost);

    const rewards: LootReward[] = [];
    const rewardCount = boxType === 'premium_crate' ? 2 + Math.floor(Math.random() * 3) : 1 + Math.floor(Math.random() * 3);

    for (let i = 0; i < rewardCount; i++) {
      const rand = Math.random();
      let rarity: 'common' | 'rare' | 'epic' | 'legendary';
      
      if (boxType === 'premium_crate') {
        if (rand < 0.1) rarity = 'legendary';
        else if (rand < 0.3) rarity = 'epic';
        else if (rand < 0.6) rarity = 'rare';
        else rarity = 'common';
      } else {
        if (rand < 0.02) rarity = 'legendary';
        else if (rand < 0.1) rarity = 'epic';
        else if (rand < 0.3) rarity = 'rare';
        else rarity = 'common';
      }

      const rewardType = Math.random();
      if (rewardType < 0.5) {
        const pointValues = { common: 25, rare: 75, epic: 150, legendary: 300 };
        const points = pointValues[rarity];
        rewards.push({ type: 'points', value: points, rarity });
        
        gameStatsSetter.setStats(prev => ({ ...prev, totalPoints: prev.totalPoints + points }));
      } else if (rewardType < 0.8) {
        const starValues = { common: 1, rare: 3, epic: 7, legendary: 15 };
        const stars = starValues[rarity];
        rewards.push({ type: 'stars', value: stars, rarity });
        
        setTelegramStars((prev: number) => prev + stars);
      } else {
        const powerUps = [UPGRADE_IDS.SHIELD, UPGRADE_IDS.DOUBLE_POINTS];
        const powerUpId = powerUps[Math.floor(Math.random() * powerUps.length)];
        const powerUpName = upgrades.find(u => u.id === powerUpId)?.name || 'Power-up';
        rewards.push({ type: 'powerup', value: powerUpName, rarity });
        
        activatePowerUp(powerUpId, upgrades);
      }
    }

    return rewards;
  }, [telegramStars, upgrades, gameStatsSetter, activatePowerUp, setTelegramStars]);

  const resetEconomy = useCallback(() => {
    setTelegramStars(0);
    setDailyDeal(null);
  }, [setTelegramStars, setDailyDeal]);

  return {
    telegramStars,
    dailyDeal,
    purchaseWithStars,
    openLootBox,
    resetEconomy,
  };
}