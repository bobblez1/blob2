import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas';
import Dashboard from './components/Dashboard';
import Store from './components/Store';
import Settings from './components/Settings';
import HomeScreen from './components/HomeScreen';
import LobbyScreen from './components/LobbyScreen';
import GameRoomScreen from './components/GameRoomScreen';
import { GameProvider } from './context/GameContext';
import { useGame } from './context/GameContext';
import { SessionContextProvider, useSession } from './context/SessionContext'; // Import SessionContextProvider and useSession

export type Screen = 'home' | 'game' | 'dashboard' | 'store' | 'settings' | 'lobby' | 'gameRoom';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const { currentRoom } = useGame();
  const { session, isLoading } = useSession(); // Use the session context

  // If session is loading or not authenticated, SessionContextProvider will handle rendering Login
  if (isLoading || !session) {
    return null; // SessionContextProvider will render Login page
  }

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
            onLobby={() => setCurrentScreen('lobby')}
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
    <SessionContextProvider>
      <GameProvider>
        <AppContent />
      </GameProvider>
    </SessionContextProvider>
  );
}

export default App;