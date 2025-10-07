import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { 
  Play, 
  ShoppingBag, 
  BarChart3, 
  Settings as SettingsIcon, 
  Star, 
  Heart, 
  Trophy,
  Zap,
  Target,
  Crown
} from 'lucide-react';

interface HomeScreenProps {
  onPlay: () => void;
  onStore: () => void;
  onDashboard: () => void;
  onSettings: () => void;
}

function HomeScreen({ onPlay, onStore, onDashboard, onSettings }: HomeScreenProps) {
  const { stats, upgrades, gameMode, setGameMode, selectedTeam, setSelectedTeam } = useGame();
  const [animatedPoints, setAnimatedPoints] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);

  const ownedUpgrades = upgrades.filter(u => u.owned);

  // Animate points counter
  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = stats.totalPoints / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= stats.totalPoints) {
        setAnimatedPoints(stats.totalPoints);
        clearInterval(timer);
      } else {
        setAnimatedPoints(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [stats.totalPoints]);

  // Show welcome animation for new players
  useEffect(() => {
    if (stats.gamesPlayed === 0) {
      setShowWelcome(true);
    }
  }, [stats.gamesPlayed]);

  const getTimeUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="relative w-full h-full flex flex-col max-w-sm mx-auto">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500/20 rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-16 w-16 h-16 bg-purple-500/20 rounded-full animate-bounce"></div>
        <div className="absolute bottom-40 left-20 w-12 h-12 bg-pink-500/20 rounded-full animate-ping"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-green-500/20 rounded-full animate-pulse"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 p-6 text-center">
        <div className="mb-4">
          <h1 className="text-4xl font-bold text-white mb-2 animate-fade-in">
            🎮 Blob Battle
          </h1>
          <p className="text-gray-300 text-lg">
            Eat. Grow. Dominate.
          </p>
        </div>

        {/* Welcome Message for New Players */}
        {showWelcome && (
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 p-4 rounded-xl mb-4 animate-bounce">
            <div className="flex items-center justify-center gap-2 text-yellow-400 mb-2">
              <Crown size={20} />
              <span className="font-bold">Welcome, Champion!</span>
            </div>
            <p className="text-sm text-gray-300">
              Start your journey to become the ultimate blob master!
            </p>
          </div>
        )}

        {/* Login Streak Bonus */}
        {stats.loginStreak > 1 && (
          <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 p-3 rounded-xl mb-4">
            <div className="flex items-center justify-center gap-2 text-orange-400">
              <span className="text-lg">🔥</span>
              <span className="font-bold text-sm">
                {stats.loginStreak} Day Streak! +{Math.min(stats.loginStreak * 5, 50)} Bonus Points
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Game Mode Selection */}
      <div className="relative z-10 px-6 mb-4">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Target size={16} className="text-blue-400" />
          Game Mode
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'classic', name: 'Classic', icon: '🎯', desc: 'Standard gameplay' },
            { id: 'timeAttack', name: 'Time Attack', icon: '⏱️', desc: '3 min survival' },
            { id: 'battleRoyale', name: 'Battle Royale', icon: '👑', desc: 'Last blob standing' },
            { id: 'team', name: 'Team Mode', icon: '🤝', desc: 'Red vs Blue' },
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setGameMode(mode.id as any)}
              className={`p-3 rounded-xl border transition-all duration-200 ${
                gameMode === mode.id
                  ? 'bg-blue-500/30 border-blue-500/50 text-blue-200'
                  : 'bg-gray-800/30 border-gray-700/50 text-gray-300 hover:bg-gray-700/30'
              }`}
            >
              <div className="text-lg mb-1">{mode.icon}</div>
              <div className="text-xs font-semibold">{mode.name}</div>
              <div className="text-xs opacity-75">{mode.desc}</div>
            </button>
          ))}
        </div>
        
        {gameMode === 'team' && (
          <div className="mt-3">
            <p className="text-gray-400 text-xs mb-2">Select your team:</p>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedTeam('red')}
                className={`flex-1 p-2 rounded-lg border transition-all ${
                  selectedTeam === 'red'
                    ? 'bg-red-500/30 border-red-500/50 text-red-200'
                    : 'bg-gray-800/30 border-gray-700/50 text-gray-300'
                }`}
              >
                🔴 Red Team
              </button>
              <button
                onClick={() => setSelectedTeam('blue')}
                className={`flex-1 p-2 rounded-lg border transition-all ${
                  selectedTeam === 'blue'
                    ? 'bg-blue-500/30 border-blue-500/50 text-blue-200'
                    : 'bg-gray-800/30 border-gray-700/50 text-gray-300'
                }`}
              >
                🔵 Blue Team
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="relative z-10 px-6 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Total Points */}
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-4 rounded-xl border border-blue-500/30 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <Star size={20} className="text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {animatedPoints.toLocaleString()}
                </div>
                <div className="text-xs text-blue-200">Total Points</div>
              </div>
            </div>
          </div>

          {/* Lives Remaining */}
          <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 p-4 rounded-xl border border-red-500/30 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="bg-red-500 p-2 rounded-lg">
                <Heart size={20} className="text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {stats.livesRemaining}
                </div>
                <div className="text-xs text-red-200">Lives Left</div>
              </div>
            </div>
          </div>
        </div>

        {/* High Score & Games Played */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 p-3 rounded-xl border border-green-500/30 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-green-400" />
              <div>
                <div className="text-lg font-bold text-white">
                  {stats.highScore.toLocaleString()}
                </div>
                <div className="text-xs text-green-200">Best Score</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-3 rounded-xl border border-purple-500/30 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-purple-400" />
              <div>
                <div className="text-lg font-bold text-white">
                  {stats.gamesPlayed}
                </div>
                <div className="text-xs text-purple-200">Games</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Upgrades */}
      {ownedUpgrades.length > 0 && (
        <div className="relative z-10 px-6 mb-6">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Zap size={16} className="text-yellow-400" />
            Active Upgrades
          </h3>
          <div className="flex flex-wrap gap-2">
            {ownedUpgrades.map(upgrade => (
              <div 
                key={upgrade.id}
                className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 px-3 py-1 rounded-full"
              >
                <span className="text-yellow-400 text-sm font-medium">
                  {upgrade.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lives Reset Timer */}
      {stats.livesRemaining < 10 && (
        <div className="relative z-10 px-6 mb-6">
          <div className="bg-orange-500/10 border border-orange-500/30 p-3 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart size={16} className="text-orange-400" />
                <span className="text-orange-400 text-sm font-medium">
                  Lives reset in: {getTimeUntilReset()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Action Buttons */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 space-y-4">
        {/* Play Button */}
        <button
          onClick={onPlay}
          disabled={stats.livesRemaining <= 0}
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-2xl shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 disabled:scale-100"
        >
          <div className="flex items-center justify-center gap-3">
            <Play size={24} />
            <span className="text-xl">
              {stats.livesRemaining > 0 ? 'PLAY NOW' : 'NO LIVES LEFT'}
            </span>
          </div>
        </button>

        {/* Secondary Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={onStore}
            className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30 text-white font-semibold py-3 px-4 rounded-xl backdrop-blur-sm transition-all duration-200 hover:bg-orange-500/30 active:scale-95"
          >
            <div className="flex flex-col items-center gap-1">
              <ShoppingBag size={20} />
              <span className="text-sm">Store</span>
            </div>
          </button>

          <button
            onClick={onDashboard}
            className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 text-white font-semibold py-3 px-4 rounded-xl backdrop-blur-sm transition-all duration-200 hover:bg-blue-500/30 active:scale-95"
          >
            <div className="flex flex-col items-center gap-1">
              <BarChart3 size={20} />
              <span className="text-sm">Stats</span>
            </div>
          </button>

          <button
            onClick={onSettings}
            className="bg-gradient-to-r from-gray-500/20 to-gray-600/20 border border-gray-500/30 text-white font-semibold py-3 px-4 rounded-xl backdrop-blur-sm transition-all duration-200 hover:bg-gray-500/30 active:scale-95"
          >
            <div className="flex flex-col items-center gap-1">
              <SettingsIcon size={20} />
              <span className="text-sm">Settings</span>
            </div>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 p-4 text-center">
        <p className="text-gray-400 text-sm">
          🏆 Become the ultimate blob champion!
        </p>
      </div>
    </div>
  );
}

export default HomeScreen;