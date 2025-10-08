import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas';
import Dashboard from './components/Dashboard';
import Store from './components/Store';
import Settings from './components/Settings';
import HomeScreen from './components/HomeScreen';
import LobbyScreen from './components/LobbyScreen'; // Import LobbyScreen
import GameRoomScreen from './components/GameRoomScreen'; // Import GameRoomScreen
import { GameProvider } from './context/GameContext';
import { useGame } from './context/GameContext'; // Import useGame to access currentRoom

export type Screen = 'home' | 'game' | 'dashboard' | 'store' | 'settings' | 'lobby' | 'gameRoom';

function AppContent() { // Renamed App to AppContent to use useGame hook
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const { currentRoom } = useGame(); // Access currentRoom from context

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
      case 'lobby':
        return <LobbyScreen onBack={() => setCurrentScreen('home')} onJoinGameRoom={() => setCurrentScreen('gameRoom')} />;
      case 'gameRoom':
        return <GameRoomScreen onBackToLobby={() => setCurrentScreen('lobby')} onStartGame={() => setCurrentScreen('game')} />;
      default:
        return (
          <HomeScreen 
            onPlay={() => setCurrentScreen('game')}
            onStore={() => setCurrentScreen('store')}
            onDashboard={() => setCurrentScreen('dashboard')}
            onSettings={() => setCurrentScreen('settings')}
            onLobby={() => setCurrentScreen('lobby')} // New prop for LobbyScreen
          />
        );
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {renderScreen()}
    </div>
  );
}

function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

export default App;