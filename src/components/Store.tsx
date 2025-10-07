import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Star, Zap, FileX2 as X2, Skull, RotateCcw, ShoppingCart, Coins, ArrowLeft, CheckCircle, Shield, Heart, Palette } from 'lucide-react';

interface LootReward {
  type: 'points' | 'stars' | 'powerup' | 'cosmetic';
  value: number | string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface StoreProps {
  onBack: () => void;
}

function Store({ onBack }: StoreProps) {
  const { stats, upgrades, purchaseUpgrade, openLootBox, telegramStars, dailyDeal } = useGame();
  const [purchaseAnimation, setPurchaseAnimation] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'permanent' | 'cosmetic' | 'powerup' | 'utility'>('permanent');
  const [showLootModal, setShowLootModal] = useState(false);
  const [lootResults, setLootResults] = useState<LootReward[]>([]);

  const handleLootBoxPurchase = (boxType: string) => {
    const results = openLootBox(boxType);
    if (results.length > 0) {
      setLootResults(results);
      setShowLootModal(true);
    }
  };

  const handlePurchase = (upgradeId: string) => {
    const upgrade = upgrades.find(u => u.id === upgradeId);
    if (!upgrade || stats.totalPoints < upgrade.price) return;
    
    // For permanent upgrades, check if already owned
    if (upgrade.category === 'permanent' && upgrade.owned) return;
    
    purchaseUpgrade(upgradeId);
    setPurchaseAnimation(upgradeId);
    setTimeout(() => setPurchaseAnimation(null), 1000);
  };

  const handleDailyDealPurchase = () => {
    if (!dailyDeal) return;
    
    const dealUpgrade = upgrades.find(u => u.id === dailyDeal.upgradeId);
    if (!dealUpgrade) return;
    
    const discountedPrice = Math.floor(dealUpgrade.price * (1 - dailyDeal.discountPercent / 100));
    
    if (stats.totalPoints < discountedPrice) return;
    
    // For permanent upgrades, check if already owned
    if (dealUpgrade.category === 'permanent' && dealUpgrade.owned) return;
    
    purchaseUpgrade(dailyDeal.upgradeId, discountedPrice);
    setPurchaseAnimation(dailyDeal.upgradeId);
    setTimeout(() => setPurchaseAnimation(null), 1000);
  };

  const getUpgradeIcon = (type: string) => {
    switch (type) {
      case 'speed': return <Zap size={24} />;
      case 'multiplier': return <X2 size={24} />;
      case 'kill': return <Skull size={24} />;
      case 'revive': return <RotateCcw size={24} />;
      case 'cosmetic': return <Palette size={24} />;
      case 'powerup': return <Shield size={24} />;
      case 'utility': return <Heart size={24} />;
      default: return <Star size={24} />;
    }
  };

  const getUpgradeColor = (type: string) => {
    switch (type) {
      case 'speed': return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
      case 'multiplier': return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      case 'kill': return 'from-red-500/20 to-pink-500/20 border-red-500/30';
      case 'revive': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
      case 'cosmetic': return 'from-purple-500/20 to-pink-500/20 border-purple-500/30';
      case 'powerup': return 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30';
      case 'utility': return 'from-orange-500/20 to-red-500/20 border-orange-500/30';
      default: return 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
    }
  };

  const getButtonColor = (type: string) => {
    switch (type) {
      case 'speed': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'multiplier': return 'bg-green-500 hover:bg-green-600';
      case 'kill': return 'bg-red-500 hover:bg-red-600';
      case 'revive': return 'bg-blue-500 hover:bg-blue-600';
      case 'cosmetic': return 'bg-purple-500 hover:bg-purple-600';
      case 'powerup': return 'bg-cyan-500 hover:bg-cyan-600';
      case 'utility': return 'bg-orange-500 hover:bg-orange-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const filteredUpgrades = upgrades.filter(u => u.category === selectedCategory);

  const categories = [
    { id: 'permanent', name: 'Permanent', icon: <Star size={16} /> },
    { id: 'cosmetic', name: 'Cosmetics', icon: <Palette size={16} /> },
    { id: 'powerup', name: 'Power-ups', icon: <Shield size={16} /> },
    { id: 'utility', name: 'Utility', icon: <Heart size={16} /> },
  ];

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
          <h1 className="text-xl font-bold">Store</h1>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          {/* Current Points */}
          <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
            <div className="flex items-center justify-center gap-2">
              <Coins size={20} className="text-yellow-400" />
              <span className="text-xl font-bold">{stats.totalPoints.toLocaleString()}</span>
              <span className="text-gray-400">Points Available</span>
            </div>
          </div>

          {/* Telegram Stars Info */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Star size={20} className="text-blue-400" />
              <span className="font-semibold text-blue-400">Telegram Stars Integration</span>
            </div>
            <p className="text-sm text-gray-300">
              In production, upgrades would be purchased using Telegram Stars. 
              For now, you can use your earned points to buy upgrades!
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1 bg-gray-800/30 p-1 rounded-lg">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id as any)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                {category.icon}
                <span>{category.name}</span>
              </button>
            ))}
          </div>

          {/* Upgrades List */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ShoppingCart size={18} />
              {categories.find(c => c.id === selectedCategory)?.name} Items
            </h2>
            
            {filteredUpgrades.map(upgrade => (
              <div 
                key={upgrade.id} 
                className={`bg-gradient-to-r ${getUpgradeColor(upgrade.type)} p-4 rounded-xl border`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getButtonColor(upgrade.type).split(' ')[0]}/20`}>
                    {getUpgradeIcon(upgrade.type)}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-bold mb-1">{upgrade.name}</h3>
                    <p className="text-gray-300 text-sm mb-3">{upgrade.description}</p>
                    
                    {upgrade.effectDuration && (
                      <p className="text-xs text-gray-400 mb-2">
                        Duration: {upgrade.effectDuration / 1000}s
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star size={14} className="text-yellow-400" />
                        <span className="font-semibold text-sm">{upgrade.price} Points</span>
                      </div>
                      
                      {upgrade.category === 'permanent' && upgrade.owned ? (
                        <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg font-semibold flex items-center gap-1 text-sm">
                          <CheckCircle size={14} />
                          OWNED
                        </div>
                      ) : (
                        <button
                          onClick={() => handlePurchase(upgrade.id)}
                          disabled={stats.totalPoints < upgrade.price}
                          className={`px-4 py-1 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 text-sm ${getButtonColor(upgrade.type)} ${
                            purchaseAnimation === upgrade.id ? 'animate-pulse' : ''
                          }`}
                        >
                          {purchaseAnimation === upgrade.id ? 'Purchased!' : 
                           upgrade.category === 'powerup' ? 'Activate' :
                           upgrade.category === 'utility' ? 'Use' : 'Purchase'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Daily Deal Section */}
          {dailyDeal && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <div className="text-2xl">🔥</div>
                Daily Deal
              </h2>
              
              {(() => {
                const dealUpgrade = upgrades.find(u => u.id === dailyDeal.upgradeId);
                if (!dealUpgrade) return null;
                
                const discountedPrice = Math.floor(dealUpgrade.price * (1 - dailyDeal.discountPercent / 100));
                const isOwned = dealUpgrade.category === 'permanent' && dealUpgrade.owned;
                
                return (
                  <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-4 rounded-xl border border-orange-500/30">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-orange-500/20">
                        {getUpgradeIcon(dealUpgrade.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-orange-200">{dealUpgrade.name}</h3>
                          <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                            -{dailyDeal.discountPercent}%
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm mb-3">{dealUpgrade.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Star size={14} className="text-yellow-400" />
                              <span className="font-semibold text-sm line-through text-gray-400">
                                {dealUpgrade.price}
                              </span>
                              <span className="font-bold text-orange-400">
                                {discountedPrice} Points
                              </span>
                            </div>
                          </div>
                          
                          {isOwned ? (
                            <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg font-semibold flex items-center gap-1 text-sm">
                              <CheckCircle size={14} />
                              OWNED
                            </div>
                          ) : (
                            <button
                              onClick={handleDailyDealPurchase}
                              disabled={stats.totalPoints < discountedPrice}
                              className={`px-4 py-1 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 text-sm bg-orange-500 hover:bg-orange-600 ${
                                purchaseAnimation === dailyDeal.upgradeId ? 'animate-pulse' : ''
                              }`}
                            >
                              {purchaseAnimation === dailyDeal.upgradeId ? 'Purchased!' : 'Buy Deal'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Loot Boxes Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <div className="text-2xl">🎁</div>
              Mystery Crates
            </h2>
            
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 p-3 rounded-xl mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Star size={16} className="text-blue-400" />
                <span className="font-semibold text-blue-400">Telegram Stars Required</span>
              </div>
              <p className="text-sm text-gray-300">
                Open mystery crates to get random rewards including points, stars, and power-ups!
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Mystery Crate */}
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 p-4 rounded-xl border border-blue-500/30">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">📦</div>
                  
                  <div className="flex-1">
                    <h3 className="font-bold mb-1 text-blue-200">Mystery Crate</h3>
                    <p className="text-gray-300 text-sm mb-3">
                      Contains 1-3 random rewards with a chance for rare items!
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star size={14} className="text-blue-400" />
                        <span className="font-semibold text-sm text-blue-200">5 Telegram Stars</span>
                      </div>
                      
                      <button
                        onClick={() => handleLootBoxPurchase('mystery_crate')}
                        disabled={telegramStars < 5}
                        className="px-4 py-1 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 text-sm bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        Open Crate
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Premium Crate */}
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-4 rounded-xl border border-purple-500/30">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">🎁</div>
                  
                  <div className="flex-1">
                    <h3 className="font-bold mb-1 text-purple-200">Premium Crate</h3>
                    <p className="text-gray-300 text-sm mb-3">
                      Contains 2-5 rewards with much higher chances for epic and legendary items!
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star size={14} className="text-purple-400" />
                        <span className="font-semibold text-sm text-purple-200">15 Telegram Stars</span>
                      </div>
                      
                      <button
                        onClick={() => handleLootBoxPurchase('premium_crate')}
                        disabled={telegramStars < 15}
                        className="px-4 py-1 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 text-sm bg-purple-500 hover:bg-purple-600 text-white"
                      >
                        Open Crate
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Current Stars Display */}
            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
              <div className="flex items-center justify-center gap-2">
                <Star size={20} className="text-yellow-400" />
                <span className="text-xl font-bold">{telegramStars}</span>
                <span className="text-gray-400">Telegram Stars Available</span>
              </div>
              {telegramStars === 0 && (
                <p className="text-center text-sm text-gray-400 mt-2">
                  💡 Earn stars by opening loot boxes or through special events!
                </p>
              )}
            </div>
          </div>
          {/* How to Earn Points */}
          <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50">
            <h3 className="font-semibold mb-2">How to Earn Points</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Eat other players/bots: +points based on size</li>
              <li>• Complete daily challenges for bonus rewards</li>
              <li>• Daily login streak gives bonus points</li>
              <li>• Use multiplier upgrades to boost earnings</li>
              <li>• Open loot boxes for bonus points and stars</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Loot Box Results Modal */}
      {showLootModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold text-center mb-4 text-yellow-400">
              🎉 Loot Box Opened! 🎉
            </h2>
            
            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
              {lootResults.map((reward, index) => (
                <div key={index} className={`p-2 rounded-lg border ${
                  reward.rarity === 'legendary' ? 'bg-yellow-500/20 border-yellow-500/50' :
                  reward.rarity === 'epic' ? 'bg-purple-500/20 border-purple-500/50' :
                  reward.rarity === 'rare' ? 'bg-blue-500/20 border-blue-500/50' :
                  'bg-gray-500/20 border-gray-500/50'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      {reward.type === 'points' ? `${reward.value} Points` :
                       reward.type === 'stars' ? `${reward.value} Stars` :
                       reward.type === 'powerup' ? 'Power-up' : 'Item'}
                    </span>
                    <span className={`text-xs font-bold uppercase ${
                      reward.rarity === 'legendary' ? 'text-yellow-400' :
                      reward.rarity === 'epic' ? 'text-purple-400' :
                      reward.rarity === 'rare' ? 'text-blue-400' :
                      'text-gray-400'
                    }`}>
                      {reward.rarity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => setShowLootModal(false)}
              className="w-full bg-blue-500 hover:bg-blue-600 py-3 rounded-lg font-semibold transition-colors"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Store;