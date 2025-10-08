import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { ArrowLeft, PlusCircle, Users, Play, RefreshCw, Crown, Swords, Clock, Shield, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Room, RoomPlayer, RoomStatus } from '../types/gameTypes';
import { GameMode, Team } from '../hooks/useGameSession';
import { supabase } from '../lib/supabase';
import { showError, showSuccess } from '../utils/toast';

interface LobbyScreenProps {
  onBack: () => void;
  onJoinGameRoom: () => void;
}

function LobbyScreen({ onBack, onJoinGameRoom }: LobbyScreenProps) {
  const { stats, createRoom, joinRoom, currentRoom, setGameMode, setSelectedTeam, gameMode, selectedTeam } = useGame();
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('status', 'waiting')
      .order('created_at', { ascending: false });

    if (error) {
      showError('Error fetching rooms: ' + error.message);
      console.error('Error fetching rooms:', error);
    } else {
      setAvailableRooms(data || []);
    }
  };

  useEffect(() => {
    fetchRooms(); // Initial fetch

    // Set up real-time subscription for rooms
    const channel = supabase
      .channel('public:rooms')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        (payload) => {
          console.log('Realtime update for rooms:', payload);
          fetchRooms(); // Re-fetch rooms on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      showError('Room name cannot be empty.');
      return;
    }
    setIsCreatingRoom(true);
    const newRoom = await createRoom(roomName, maxPlayers, gameMode, selectedTeam);
    setIsCreatingRoom(false);
    if (newRoom) {
      onJoinGameRoom(); // Navigate to game room screen
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    const room = await joinRoom(roomId);
    if (room) {
      onJoinGameRoom(); // Navigate to game room screen
    }
  };

  const getGameModeIcon = (mode: GameMode) => {
    switch (mode) {
      case 'classic': return <Play size={14} className="text-blue-400" />;
      case 'timeAttack': return <Clock size={14} className="text-yellow-400" />;
      case 'battleRoyale': return <Crown size={14} className="text-red-400" />;
      case 'team': return <Swords size={14} className="text-green-400" />;
      default: return <Play size={14} className="text-gray-400" />;
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col text-white mx-auto">
      {/* Header */}
      <div className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-700/50 p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold">Multiplayer Lobby</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Create Room Section */}
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <PlusCircle size={20} className="text-green-400" />
            Create New Room
          </h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full bg-green-500 hover:bg-green-600">
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Create Game Room</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Set up your multiplayer game room.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="roomName" className="text-right text-gray-300">
                    Room Name
                  </label>
                  <Input
                    id="roomName"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="col-span-3 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="maxPlayers" className="text-right text-gray-300">
                    Max Players
                  </label>
                  <Input
                    id="maxPlayers"
                    type="number"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                    min={2}
                    max={8}
                    className="col-span-3 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-gray-300">Game Mode</label>
                  <div className="col-span-3 flex flex-wrap gap-2">
                    {['classic', 'timeAttack', 'battleRoyale', 'team'].map((mode) => (
                      <Button
                        key={mode}
                        variant={gameMode === mode ? 'default' : 'outline'}
                        onClick={() => setGameMode(mode as GameMode)}
                        className={`text-xs h-auto py-1 px-2 ${gameMode === mode ? 'bg-blue-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
                {gameMode === 'team' && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-gray-300">Your Team</label>
                    <div className="col-span-3 flex gap-2">
                      <Button
                        variant={selectedTeam === 'red' ? 'default' : 'outline'}
                        onClick={() => setSelectedTeam('red')}
                        className={`flex-1 text-xs h-auto py-1 px-2 ${selectedTeam === 'red' ? 'bg-red-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`}
                      >
                        🔴 Red
                      </Button>
                      <Button
                        variant={selectedTeam === 'blue' ? 'default' : 'outline'}
                        onClick={() => setSelectedTeam('blue')}
                        className={`flex-1 text-xs h-auto py-1 px-2 ${selectedTeam === 'blue' ? 'bg-blue-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`}
                      >
                        🔵 Blue
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={handleCreateRoom} disabled={isCreatingRoom} className="bg-green-500 hover:bg-green-600">
                  {isCreatingRoom ? 'Creating...' : 'Create Room'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Available Rooms Section */}
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Users size={20} className="text-blue-400" />
              Available Rooms
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchRooms}
              className="p-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
            >
              <RefreshCw size={16} />
            </Button>
          </div>

          {availableRooms.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No rooms available. Be the first to create one!</p>
          ) : (
            <div className="space-y-3">
              {availableRooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-gray-700/50 p-3 rounded-lg border border-gray-600/50 flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      {room.name}
                      <span className="text-xs text-gray-400">({room.current_players_count}/{room.max_players})</span>
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      {getGameModeIcon(room.game_mode)}
                      <span className="capitalize">{room.game_mode}</span>
                      {room.game_mode === 'team' && (
                        <span className="ml-2 text-xs">Host Team: {room.selected_team === 'red' ? '🔴' : '🔵'}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleJoinRoom(room.id)}
                    disabled={room.current_players_count >= room.max_players}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Join
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LobbyScreen;