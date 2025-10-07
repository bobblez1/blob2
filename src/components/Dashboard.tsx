import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Trophy, Star, Heart, TrendingUp, Gamepad2, Target, ArrowLeft, Award, Calendar, Zap, Gift, CheckCircle } from 'lucide-react';

interface DashboardProps {
  onBack: () => void;
}

function Dashboard({ onBack }: DashboardProps) {
  const { stats, upgrades, challenges, claimChallengeReward } = useGame();
  const [selectedTab, setSelectedTab] = useState<'stats' | 'achievements' | 'challenges'>('stats');

  const ownedUpgrades = upgrades.filter(u => u.owned);
  const completedChallenges = challenges.filter(c => c.completed);
  
  const achievements = [
    { id: 'first_game', name: 'First Steps', description: 'Play your first game', completed: stats.gamesPlayed > 0, icon: '🎮' },
    { id: 'score_100', name: 'Century', description: 'Score 100 points in a single game', completed: stats.highScore >= 100, icon: '💯' },
    { id: 'score_500', name: 'High Roller', description: 'Score 500 points in a single game', completed: stats.highScore >= 500, icon: '🚀' },
    { id: 'games_10', name: 'Dedicated', description: 'Play 10 games', completed: stats.gamesPlayed >= 10, icon: '🏆' },
    { id: 'total_1000', name: 'Collector', description: 'Earn 1000 total points', completed: stats.totalPoints >= 1000, icon: '⭐' },
    { id: 'first_upgrade', name: 'Enhanced', description: 'Purchase your first upgrade', completed: ownedUpgrades.length > 0, icon: '⚡' },
    { id: 'login_streak_7', name: 'Loyal Player', description: 'Login 7 days in a row', completed: stats.loginStreak >= 7, icon: '🔥' },
  ];
  
  const completedAchievements = achievements.filter(a => a.completed);
  
  return (
    <div className="relative w-full h-full flex flex-col text-white max-w-sm mx-auto">
      {/* Header */}
      <div className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-700/50 p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Dashboard</h1>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-1 mt-4 bg-gray-800/30 p-1 rounded-lg">
          {[
            { id: 'stats', name: 'Stats', icon: <TrendingUp size={14} /> },
            { id: 'achievements', name: 'Achievements', icon: <Award size={14} /> },
            { id: 'challenges', name: 'Challenges', icon: <Target size={14} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                selectedTab === tab.id 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-300 hover:bg-gray-600/50'
              }`}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">

          {selectedTab === 'stats' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-3 rounded-xl border border-blue-500/30">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-500 p-1.5 rounded-lg">
                      <Star size={16} />
                    </div>
                    <div>
                      <div className="text-lg font-bold">{stats.totalPoints.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">Total Points</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 p-3 rounded-xl border border-green-500/30">
                  <div className="flex items-center gap-2">
                    <div className="bg-green-500 p-1.5 rounded-lg">
                      <Trophy size={16} />
                    </div>
                    <div>
                      <div className="text-lg font-bold">{stats.highScore.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">High Score</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-3 rounded-xl border border-purple-500/30">
                  <div className="flex items-center gap-2">
                    <div className="bg-purple-500 p-1.5 rounded-lg">
                      <Gamepad2 size={16} />
                    </div>
                    <div>
                      <div className="text-lg font-bold">{stats.gamesPlayed}</div>
                      <div className="text-xs text-gray-400">Games Played</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 p-3 rounded-xl border border-red-500/30">
                  <div className="flex items-center gap-2">
                    <div className="bg-red-500 p-1.5 rounded-lg">
                      <Heart size={16} />
                    </div>
                    <div>
                      <div className="text-lg font-bold">{stats.livesRemaining}</div>
                      <div className="text-xs text-gray-400">Lives Left</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Login Streak */}
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-4 rounded-xl border border-orange-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-2xl">🔥</div>
                  <div>
                    <div className="font-bold">Login Streak: {stats.loginStreak} days</div>
                    <div className="text-sm text-gray-300">Keep playing daily for bonus points!</div>
                  </div>
                </div>
              </div>

              {/* Progress Section */}
              <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <TrendingUp size={18} />
                  Progress
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Points to Next Milestone</span>
                      <span>{Math.max(0, 1000 - (stats.totalPoints % 1000))}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(stats.totalPoints % 1000) / 10}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Average Score</span>
                      <span>{stats.gamesPlayed > 0 ? Math.round(stats.totalPoints / stats.gamesPlayed) : 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Owned Upgrades */}
              <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Target size={18} />
                  Active Upgrades
                </h3>
                
                {ownedUpgrades.length > 0 ? (
                  <div className="space-y-2">
                    {ownedUpgrades.map(upgrade => (
                      <div key={upgrade.id} className="bg-gray-700/50 p-2 rounded-lg border border-gray-600/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-sm">{upgrade.name}</div>
                            <div className="text-xs text-gray-400">{upgrade.description}</div>
                          </div>
                          <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-semibold">
                            ACTIVE
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 text-center py-3">
                    <p className="text-sm">No upgrades purchased yet</p>
                    <p className="text-xs mt-1">Visit the store to get upgrades!</p>
                  </div>
                )}
              </div>
            </>
          )}

          {selectedTab === 'achievements' && (
            <>
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-yellow-400 mb-1">
                  {completedAchievements.length}/{achievements.length}
                </div>
                <p className="text-gray-400 text-sm">Achievements Unlocked</p>
              </div>
              
              <div className="space-y-3">
                {achievements.map(achievement => (
                  <div 
                    key={achievement.id}
                    className={`p-3 rounded-xl border transition-all duration-200 ${
                      achievement.completed 
                        ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30' 
                        : 'bg-gray-800/30 border-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`text-2xl ${achievement.completed ? '' : 'grayscale opacity-50'}`}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <div className={`font-bold text-sm ${achievement.completed ? 'text-yellow-400' : 'text-gray-400'}`}>
                          {achievement.name}
                        </div>
                        <div className="text-xs text-gray-300">
                          {achievement.description}
                        </div>
                      </div>
                      {achievement.completed && (
                        <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-semibold">
                          ✓
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {selectedTab === 'challenges' && (
            <>
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-blue-400 mb-1">
                  {completedChallenges.length}/{challenges.length}
                </div>
                <p className="text-gray-400 text-sm">Challenges Completed</p>
              </div>
              
              <div className="space-y-3">
                {challenges.map(challenge => (
                  <div 
                    key={challenge.id}
                    className={`p-3 rounded-xl border ${
                      challenge.completed 
                        ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30' 
                        : 'bg-gray-800/30 border-gray-700/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500/20 p-2 rounded-lg">
                        <Target size={16} className="text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm mb-1">{challenge.name}</div>
                        <div className="text-xs text-gray-300 mb-2">{challenge.description}</div>
                        
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-gray-400">
                            Progress: {challenge.currentValue}/{challenge.targetValue}
                          </div>
                          <div className="flex items-center gap-1">
                            <Gift size={12} className="text-yellow-400" />
                            <span className="text-xs text-yellow-400">{challenge.reward} pts</span>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-green-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (challenge.currentValue / challenge.targetValue) * 100)}%` }}
                          ></div>
                        </div>
                        
                        {challenge.completed && (
                          <div className="flex items-center gap-1 text-green-400 text-xs">
                            <CheckCircle size={12} />
                            <span>Completed! Reward claimed automatically.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;