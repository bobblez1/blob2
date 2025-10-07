import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas';
import Dashboard from './components/Dashboard';
import Store from './components/Store';
import Settings from './components/Settings';
import HomeScreen from './components/HomeScreen';
import { GameProvider } from './context/GameContext';

export type Screen = 'home' | 'game' | 'dashboard' | 'store' | 'settings';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'game':
        return <GameCanvas onGameEnd={() => setCurrentScreen('home')} />;
      case 'dashboard':
        return <Dashboard onBack={() => setCurrentScreen('home')} />;
      case 'store':
        return <Store onBack={() => setCurrentScreen('home')} />;
      case 'settings':
        return <Settings onBack={() => setCurrentScreen('home')} />;
      default:
        return (
          <HomeScreen 
            onPlay={() => setCurrentScreen('game')}
            onStore={() => setCurrentScreen('store')}
            onDashboard={() => setCurrentScreen('dashboard')}
            onSettings={() => setCurrentScreen('settings')}
          />
        );
    }
  };

  return (
    <GameProvider>
      <div className="h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex flex-col overflow-hidden">
        {renderScreen()}
      </div>
    </GameProvider>
  );
}

export default App;