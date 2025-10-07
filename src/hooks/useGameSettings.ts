import { useLocalStorage } from './useLocalStorage';
import { GameSettings } from '../types/gameTypes';
import { FOOD_COLORS } from '../constants/gameConstants';
import { showSuccess } from '../utils/toast';

const INITIAL_SETTINGS: GameSettings = {
  soundEnabled: true,
  vibrateEnabled: true,
  foodColorMode: 'fixed',
  selectedFoodColor: FOOD_COLORS.RED,
  selectedBackgroundColor: 'gradient',
};

export function useGameSettings() {
  const [settings, setSettings] = useLocalStorage<GameSettings>('agarGameSettings', INITIAL_SETTINGS);

  const updateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    showSuccess('Settings updated!');
  };

  return {
    settings,
    updateSettings,
  };
}