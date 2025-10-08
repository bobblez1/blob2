import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { ArrowLeft, User, CheckCircle, XCircle, Play, Crown, Swords, Clock, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { RoomPlayer, GameMode } from '../types/gameTypes';
import { showError, showSuccess } from '../utils/toast';

interface GameRoomScreenProps {
  onBackToLobby: () => void;
  onStartGame: () => void;
}

function GameRoomScreen({ onBackToLobby, onStartGame }: GameRoomScreenProps) {
  const { currentRoom, playersInRoom, stats, leaveRoom, setPlayerReady, startGame } = useGame();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Reset ready status when entering a new room
    setIsReady(false);
    setPlayerReady(false);
  }, [currentRoom?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLeaveRoom = async () => {
    await leaveRoom();
    onBackToLobby();
  };

  const handleToggleReady = async () => {
    const newReadyStatus = !isReady;
    await setPlayerReady(newReadyStatus);
    setIsReady(newReadyStatus);
  };

  const handleStartGame = () => {
    if (!currentRoom) return;

    const allPlayersReady = playersInRoom.every(p => p.is_ready);
    if (!allPlayersReady) {
      showError('All players must be ready to start the game!');
      return;
    }
    
    if (playersInRoom.length < 2) {
      showError('At least 2 players are required to start a multiplayer game!');
      return;
    }

    // In a real multiplayer game, this would trigger a server-side game start
    // For now, we'll simulate it by calling the single-player startGame
    showSuccess('Starting multiplayer game!');
    startGame();
    onStartGame(); // Navigate to the GameCanvas
  };

  if (!currentRoom) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center text-white">
        <p className="text-lg mb-4">No room joined.</p>
        <Button onClick={onBackToLobby} className="bg-blue-500 hover:bg-blue-600">
          Go to Lobby
        </Button>
      </div>
    );
  }

  const isHost = currentRoom.host_id === stats.playerId;
  const allPlayersReady = playersInRoom.every(p => p.is_ready);
  const canStartGame = isHost && allPlayersReady && playersInRoom.length >= 2;

  const getGameModeDetails = (mode: GameMode) => {
    switch (mode) {
      case 'classic': return { icon: <Play size={16} className="text-blue-400" />, name: 'Classic' };
      case 'timeAttack': return { icon: <Clock size={16} className="text-yellow-400" />, name: 'Time Attack' };
      case 'battleRoyale': return { icon: <Crown size={16} className="text-red-400" />, name: 'Battle Royale' };
      case 'team': return { icon: <Swords size={16} className="text-green-400" />, name: 'Team Mode' };
      default: return { icon: <Play size={16} className="text-gray-400" />, name: 'Unknown' };
    }
  };

  const modeDetails = getGameModeDetails(currentRoom.game_mode);

  return (
    <div className="relative w-full h-full flex flex-col text-white mx-auto">
      {/* Header */}
      <div className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-700/50 p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLeaveRoom}
            className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold">Room: {currentRoom.name}</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Room Info */}
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Shield size={20} className="text-purple-400" />
            Room Details
          </h2>
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex justify-between">
              <span>Game Mode:</span>
              <span className="flex items-center gap-1">
                {modeDetails.icon} {modeDetails.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Max Players:</span>
              <span>{currentRoom.max_players}</span>
            </div>
            {currentRoom.game_mode === 'team' && (
              <div className="flex justify-between">
                <span>Host's Team:</span>
                <span>{currentRoom.selected_team === 'red' ? '🔴 Red' : '🔵 Blue'}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Host:</span>
              <span>{currentRoom.host_id === stats.playerId ? 'You' : currentRoom.host_id.substring(0, 8)}</span>
            </div>
          </div>
        </div>

        {/* Players in Room */}
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Users size={20} className="text-blue-400" />
            Players ({playersInRoom.length}/{currentRoom.max_players})
          </h2>
          <div className="space-y-2">
            {playersInRoom.map((player: RoomPlayer) => (
              <div
                key={player.id}
                className="bg-gray-700/50 p-3 rounded-lg border border-gray-600/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <User size={18} className="text-gray-300" />
                  <span className="font-semibold">
                    {player.player_id === stats.playerId ? 'You' : player.player_name}
                    {player.player_id === currentRoom.host_id && ' (Host)'}
                  </span>
                  {player.team && (
                    <span className="ml-2 text-xs">
                      {player.team === 'red' ? '🔴 Red' : '🔵 Blue'}
                    </span>
                  )}
                </div>
                {player.is_ready ? (
                  <CheckCircle size={20} className="text-green-500" />
                ) : (
                  <XCircle size={20} className="text-red-500" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {!isHost && (
            <Button
              onClick={handleToggleReady}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                isReady ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isReady ? 'Unready' : 'Ready Up!'}
            </Button>
          )}

          {isHost && (
            <Button
              onClick={handleStartGame}
              disabled={!canStartGame}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                canStartGame ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-600 cursor-not-allowed'
              }`}
            >
              <Play size={20} className="mr-2" />
              Start Game
            </Button>
          )}

          <Button
            onClick={handleLeaveRoom}
            variant="outline"
            className="w-full py-3 rounded-lg font-semibold border-gray-600 text-gray-300 hover:bg-gray-700/50"
          >
            Leave Room
          </Button>
        </div>
      </div>
    </div>
  );
}

export default GameRoomScreen;