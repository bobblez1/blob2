import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { FOOD_COLORS } from '../constants/gameConstants';
import { 
  ArrowLeft, 
  User, 
  Volume2, 
  VolumeX, 
  Vibrate, 
  Smartphone,
  Info,
  Trash2,
  RefreshCw,
  Shield,
  Star,
  Heart,
  Palette
} from 'lucide-react';

interface SettingsProps {
  onBack: () => void;
}

function Settings({ onBack }: SettingsProps) {
  const { stats, settings, updateSettings, resetAllData, upgrades, selectedCosmetic, setSelectedCosmetic } = useGame();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleResetData = () => {
    if (showResetConfirm) {
      resetAllData();
      setShowResetConfirm(false);
    } else {
      setShowResetConfirm(true);
      setTimeout(() => setShowResetConfirm(false), 3000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="relative w-full h-full flex flex-col text-white">
      {/* Header */}
      <div className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-700/50 p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* User Profile */}
        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <User size={20} className="text-blue-400" />
            Player Profile
          </h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Player ID</span>
              <span className="font-mono text-sm bg-gray-700/50 px-2 py-1 rounded">
                #{Math.random().toString(36).substr(2, 8).toUpperCase()}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Member Since</span>
              <span className="text-sm">{formatDate(stats.lastLifeReset)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Total Games</span>
              <span className="font-semibold">{stats.gamesPlayed}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Best Score</span>
              <span className="font-semibold text-yellow-400">{stats.highScore.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Game Settings */}
        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Smartphone size={20} className="text-green-400" />
            Game Settings
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {settings.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                <span>Sound Effects</span>
              </div>
              <button
                onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.soundEnabled ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Vibrate size={20} />
                <span>Haptic Feedback</span>
              </div>
              <button
                onClick={() => updateSettings({ vibrateEnabled: !settings.vibrateEnabled })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.vibrateEnabled ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.vibrateEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
            
            {/* Food Color Settings */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Palette size={16} className="text-pink-400" />
                Food Appearance
              </h4>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Food Colors</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateSettings({ foodColorMode: 'fixed' })}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      settings.foodColorMode === 'fixed'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Fixed
                  </button>
                  <button
                    onClick={() => updateSettings({ foodColorMode: 'random' })}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      settings.foodColorMode === 'random'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Random
                  </button>
                </div>
              </div>
              
              {settings.foodColorMode === 'fixed' && (
                <div className="space-y-2">
                  <span className="text-sm text-gray-400">Select Food Color:</span>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(FOOD_COLORS).map(([name, color]) => (
                      <button
                        key={name}
                        onClick={() => updateSettings({ selectedFoodColor: color })}
                        className={`w-12 h-8 rounded-lg border-2 transition-all ${
                          settings.selectedFoodColor === color
                            ? 'border-white scale-110'
                            : 'border-gray-600 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color }}
                        title={name}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Cosmetic Selection */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Palette size={16} className="text-pink-400" />
              Active Cosmetic
            </h4>
            
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCosmetic(null)}
                className={`w-full p-2 rounded-lg border text-left transition-colors ${
                  selectedCosmetic === null
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-200'
                    : 'bg-gray-700/50 border-gray-600/50 text-gray-300 hover:bg-gray-600/50'
                }`}
              >
                Default Blue Blob
              </button>
              
              {upgrades
                .filter(u => u.category === 'cosmetic' && u.owned)
                .map(cosmetic => (
                  <button
                    key={cosmetic.id}
                    onClick={() => setSelectedCosmetic(cosmetic.id)}
                    className={`w-full p-2 rounded-lg border text-left transition-colors ${
                      selectedCosmetic === cosmetic.id
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-200'
                        : 'bg-gray-700/50 border-gray-600/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-400"
                        style={{ backgroundColor: cosmetic.color }}
                      />
                      {cosmetic.name}
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Lives System */}
        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Heart size={20} className="text-red-400" />
            Lives System
          </h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Lives Remaining</span>
              <div className="flex items-center gap-1">
                <Heart size={16} className="text-red-400" />
                <span className="font-semibold">{stats.livesRemaining}/10</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Last Reset</span>
              <span className="text-sm">{formatDate(stats.lastLifeReset)}</span>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg">
              <p className="text-sm text-blue-200">
                💡 Lives automatically reset to 10 every day at midnight
              </p>
            </div>
          </div>
        </div>

        {/* Telegram Integration */}
        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Star size={20} className="text-yellow-400" />
            Telegram Integration
          </h2>
          
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Star size={16} className="text-blue-400" />
                <span className="font-semibold text-blue-400">Telegram Stars</span>
              </div>
              <p className="text-sm text-gray-300">
                Purchase upgrades with Telegram Stars for enhanced gameplay experience.
              </p>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Mini App Version</span>
              <span className="text-sm font-mono">v1.0.0</span>
            </div>
          </div>
        </div>

        {/* Privacy & Data */}
        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Shield size={20} className="text-purple-400" />
            Privacy & Data
          </h2>
          
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-lg">
              <p className="text-sm text-green-200">
                🔒 All game data is stored locally on your device
              </p>
            </div>
            
            <button
              onClick={handleResetData}
              className={`w-full p-3 rounded-lg font-semibold transition-all duration-200 ${
                showResetConfirm 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {showResetConfirm ? <Trash2 size={20} /> : <RefreshCw size={20} />}
                <span>
                  {showResetConfirm ? 'Confirm Reset All Data' : 'Reset All Game Data'}
                </span>
              </div>
            </button>
            
            {showResetConfirm && (
              <p className="text-xs text-red-300 text-center">
                This will permanently delete all your progress!
              </p>
            )}
          </div>
        </div>

        {/* About */}
        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Info size={20} className="text-gray-400" />
            About
          </h2>
          
          <div className="space-y-2 text-sm text-gray-300">
            <p>🎮 Blob Battle - Telegram Mini App</p>
            <p>🏆 Eat, grow, and dominate the arena!</p>
            <p>⭐ Rate us in the Telegram App Store</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;