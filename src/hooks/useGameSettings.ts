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
  selectedCosmetic: null, // Added selectedCosmetic to initial settings
};

export function useGameSettings() {
  const [settings, setSettings] = useLocalStorage<GameSettings>('agarGameSettings', INITIAL_SETTINGS);

  const updateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    showSuccess('Settings updated!');
  };

  const setSelectedCosmetic = (cosmeticId: string | null) => {
    setSettings(prev => ({ ...prev, selectedCosmetic: cosmeticId }));
  };

  const resetSettings = () => {
    setSettings(INITIAL_SETTINGS);
  };

  return {
    settings,
    updateSettings,
    selectedCosmetic: settings.selectedCosmetic, // Expose selectedCosmetic directly
    setSelectedCosmetic,
    resetSettings,
  };
}