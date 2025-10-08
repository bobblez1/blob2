import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { UPGRADE_IDS } from '../constants/gameConstants'; // Keep UPGRADE_IDS as it's used
import { GameSettings, Upgrade, Challenge, LootReward, ActivePowerUp, Room, RoomPlayer, RoomStatus } from '../types/gameTypes';
import { showSuccess, showError } from '../utils/toast';
import { supabase } from '../lib/supabase'; // Import Supabase client

// Import all custom hooks
import { useGameSettings } from '../hooks/useGameSettings';
import { useGameStats } from '../hooks/useGameStats';
import { useUpgrades } from '../hooks/useUpgrades';
import { useGameEconomy } from '../hooks/useGameEconomy';
import { useActivePowerUps } from '../hooks/useActivePowerUps';
import { usePlayer } from '../hooks/usePlayer';
import { useGameLifecycle } from '../hooks/useGameLifecycle';
import { useChallenges } from '../hooks/useChallenges';
import { useGameSession, GameMode, Team } from '../hooks/useGameSession';

interface DailyDeal {
  upgradeId: string;
  discountPercent: number;
  expiresAt: string;
}

interface GameContextType {
  // From useGameStats
  stats: ReturnType<typeof useGameStats>['stats'];
  currentPoints: number;
  updateStats: ReturnType<typeof useGameStats>['updateStats'];
  useLife: ReturnType<typeof useGameStats>['useLife'];
  refillLives: ReturnType<typeof useGameStats>['refillLives'];
  resetPlayerSize: ReturnType<typeof usePlayer>['resetPlayerSize']; // Added resetPlayerSize to context

  // From useUpgrades
  upgrades: Upgrade[];
  purchaseUpgrade: (upgradeId: string, priceOverride?: number) => void;
  getSpeedBoostMultiplier: () => number;
  getPointMultiplier: () => number;

  // From useChallenges
  challenges: Challenge[];
  updateChallengeProgress: (challengeType: string, value: number) => void;
  claimChallengeReward: (challengeId: string) => void;

  // From useActivePowerUps
  activePowerUps: ActivePowerUp[];
  activatePowerUp: (powerUpId: string, allUpgrades: Upgrade[]) => void; // Corrected signature

  // From useGameSettings
  settings: GameSettings;
  updateSettings: (settings: Partial<GameSettings>) => void;
  selectedCosmetic: string | null;
  setSelectedCosmetic: (cosmeticId: string | null) => void;

  // From useGameEconomy
  dailyDeal: DailyDeal | null;
  telegramStars: number;
  purchaseWithStars: (upgradeId: string) => void;
  openLootBox: (boxType: string) => LootReward[];

  // From usePlayer
  playerSize: number;
  growPlayer: (amount: number) => void;

  // From useGameLifecycle
  gameActive: boolean;
  isPaused: boolean;
  startGame: () => void;
  endGame: (finalScore: number) => void;
  revivePlayer: () => boolean; // Returns true if revived, false otherwise
  setIsPaused: (paused: boolean) => void;

  // From useGameSession
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  selectedTeam: Team;
  setSelectedTeam: (team: Team) => void;

  // New Multiplayer State & Actions
  currentRoom: Room | null;
  playersInRoom: RoomPlayer[];
  createRoom: (roomName: string, maxPlayers: number, mode: GameMode, team: Team) => Promise<Room | null>;
  joinRoom: (roomId: string) => Promise<Room | null>;
  leaveRoom: () => Promise<void>;
  setPlayerReady: (isReady: boolean) => Promise<void>;
  
  // Global reset
  resetAllData: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  // Core Game State Hooks
  const { stats, setStats, currentPoints, setCurrentPoints, updateStats, finalizeGameStats, useLife, refillLives, resetStats } = useGameStats();
  const { settings, updateSettings, selectedCosmetic, setSelectedCosmetic, resetSettings } = useGameSettings();
  const { playerSize, growPlayer, resetPlayerSize } = usePlayer(); // Removed setPlayerSize as it's not directly used here
  const { gameMode, setGameMode, selectedTeam, setSelectedTeam, resetGameSession } = useGameSession();

  // Progression & Economy Hooks (depend on core state)
  const { activePowerUps, activatePowerUp, resetActivePowerUps } = useActivePowerUps();
  const { upgrades, purchaseUpgrade: progressionPurchaseUpgrade, resetUpgrades, getSpeedBoostMultiplier, getPointMultiplier } = useUpgrades(
    { stats, setStats },
    { activatePowerUp, refillLives }
  );
  const { challenges, updateChallengeProgress, claimChallengeReward, resetChallenges } = useChallenges({ setStats });
  const { telegramStars, dailyDeal, purchaseWithStars: economyPurchaseWithStars, openLootBox: economyOpenLootBox, resetEconomy } = useGameEconomy(
    { setStats },
    { upgrades, purchaseUpgrade: progressionPurchaseUpgrade },
    { activatePowerUp }
  );

  // Game Lifecycle Hook (depends on multiple hooks)
  const { gameActive, setGameActive, isPaused, setIsPaused, startGame, endGame, revivePlayer } = useGameLifecycle({
    setCurrentPoints,
    finalizeGameStats,
    useLife,
    resetPlayerSize,
    resetActivePowerUps,
    updateChallengeProgress,
    getPointMultiplier,
    activePowerUps,
    upgrades,
  });

  // --- Multiplayer State ---
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [playersInRoom, setPlayersInRoom] = useState<RoomPlayer[]>([]);
  const playerChannelRef = useRef<any>(null); // Ref to store the Supabase Realtime channel

  // Expose simplified purchase functions
  const purchaseUpgrade = useCallback((upgradeId: string, priceOverride?: number) => {
    progressionPurchaseUpgrade(upgradeId, priceOverride);
  }, [progressionPurchaseUpgrade]);

  const purchaseWithStars = useCallback((upgradeId: string) => {
    economyPurchaseWithStars(upgradeId);
  }, [economyPurchaseWithStars]);

  const openLootBox = useCallback((boxType: string): LootReward[] => {
    return economyOpenLootBox(boxType);
  }, [economyOpenLootBox]);

  // --- Multiplayer Actions ---

  const createRoom = useCallback(async (roomName: string, maxPlayers: number, mode: GameMode, team: Team): Promise<Room | null> => {
    if (!stats.playerId) {
      showError('Player ID not found. Cannot create room.');
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert({
          name: roomName,
          max_players: maxPlayers,
          host_id: stats.playerId,
          game_mode: mode,
          selected_team: team,
          status: 'waiting' as RoomStatus,
          current_players_count: 1, // Host joins immediately
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        const newRoom: Room = data;
        setCurrentRoom(newRoom);
        showSuccess(`Room '${newRoom.name}' created!`);
        // Host also joins the room_players table
        await supabase.from('room_players').insert({
          room_id: newRoom.id,
          player_id: stats.playerId,
          player_name: stats.playerId.substring(0, 8), // Use a short ID for now
          team: team,
          is_ready: false,
        });
        return newRoom;
      }
      return null;
    } catch (error: any) {
      showError(`Error creating room: ${error.message}`);
      console.error('Error creating room:', error);
      return null;
    }
  }, [stats.playerId]);

  const joinRoom = useCallback(async (roomId: string): Promise<Room | null> => {
    if (!stats.playerId) {
      showError('Player ID not found. Cannot join room.');
      return null;
    }
    try {
      // Fetch room details
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;
      if (!roomData) {
        showError('Room not found.');
        return null;
      }

      const room: Room = roomData;

      // Check if player is already in this room
      const { data: existingPlayer, error: existingPlayerError } = await supabase
        .from('room_players')
        .select('id')
        .eq('room_id', roomId)
        .eq('player_id', stats.playerId)
        .single();

      if (existingPlayerError && existingPlayerError.code !== 'PGRST116') { // PGRST116 means "no rows found"
        throw existingPlayerError;
      }

      if (existingPlayer) {
        showSuccess(`Already in room '${room.name}'.`);
        setCurrentRoom(room);
        return room;
      }

      // Check if room is full
      const { count: playerCount, error: countError } = await supabase
        .from('room_players')
        .select('*', { count: 'exact' })
        .eq('room_id', roomId);

      if (countError) throw countError;

      if (playerCount && playerCount >= room.max_players) {
        showError('Room is full!');
        return null;
      }

      // Add player to room_players
      const { error: playerError } = await supabase
        .from('room_players')
        .insert({
          room_id: roomId,
          player_id: stats.playerId,
          player_name: stats.playerId.substring(0, 8), // Use a short ID for now
          team: room.game_mode === 'team' ? (Math.random() > 0.5 ? 'red' : 'blue') : undefined, // Assign random team for joining players in team mode
          is_ready: false,
        })
        .select()
        .single();

      if (playerError) throw playerError;

      // Update room's current_players_count
      await supabase
        .from('rooms')
        .update({ current_players_count: (playerCount || 0) + 1 })
        .eq('id', roomId);

      setCurrentRoom(room);
      showSuccess(`Joined room '${room.name}'!`);
      return room;
    } catch (error: any) {
      showError(`Error joining room: ${error.message}`);
      console.error('Error joining room:', error);
      return null;
    }
  }, [stats.playerId]);

  const leaveRoom = useCallback(async () => {
    if (!currentRoom || !stats.playerId) return;

    try {
      // Remove player from room_players
      const { error: deleteError } = await supabase
        .from('room_players')
        .delete()
        .eq('room_id', currentRoom.id)
        .eq('player_id', stats.playerId);

      if (deleteError) throw deleteError;

      // Decrement room's current_players_count
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('current_players_count, host_id')
        .eq('id', currentRoom.id)
        .single();

      if (roomError) throw roomError;

      if (roomData) {
        const newCount = Math.max(0, roomData.current_players_count - 1);
        await supabase
          .from('rooms')
          .update({ current_players_count: newCount })
          .eq('id', currentRoom.id);

        // If host leaves and no players left, delete the room
        if (roomData.host_id === stats.playerId && newCount === 0) {
          await supabase.from('rooms').delete().eq('id', currentRoom.id);
          showSuccess('Room deleted as host left and no players remained.');
        } else if (roomData.host_id === stats.playerId && newCount > 0) {
          // If host leaves but players remain, assign new host (e.g., first player in room_players)
          const { data: remainingPlayers, error: playersError } = await supabase
            .from('room_players')
            .select('player_id')
            .eq('room_id', currentRoom.id)
            .order('joined_at', { ascending: true })
            .limit(1);

          if (playersError) throw playersError;

          if (remainingPlayers && remainingPlayers.length > 0) {
            await supabase
              .from('rooms')
              .update({ host_id: remainingPlayers[0].player_id })
              .eq('id', currentRoom.id);
            showSuccess('Host left, new host assigned.');
          }
        }
      }

      setCurrentRoom(null);
      setPlayersInRoom([]);
      showSuccess('Left room.');
    } catch (error: any) {
      showError(`Error leaving room: ${error.message}`);
      console.error('Error leaving room:', error);
    } finally {
      // Always unsubscribe from the channel
      if (playerChannelRef.current) {
        supabase.removeChannel(playerChannelRef.current);
        playerChannelRef.current = null;
      }
    }
  }, [currentRoom, stats.playerId]);

  const setPlayerReady = useCallback(async (isReady: boolean) => {
    if (!currentRoom || !stats.playerId) return;

    try {
      const { error } = await supabase
        .from('room_players')
        .update({ is_ready: isReady })
        .eq('room_id', currentRoom.id)
        .eq('player_id', stats.playerId);

      if (error) throw error;
      showSuccess(isReady ? 'You are ready!' : 'You are not ready.');
    } catch (error: any) {
      showError(`Error setting ready status: ${error.message}`);
      console.error('Error setting ready status:', error);
    }
  }, [currentRoom, stats.playerId]);

  // Supabase Realtime Subscription for players in the current room
  useEffect(() => {
    if (currentRoom) {
      // If there's an existing channel, remove it first
      if (playerChannelRef.current) {
        supabase.removeChannel(playerChannelRef.current);
      }

      const channel = supabase
        .channel(`room_players:${currentRoom.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${currentRoom.id}` },
          (payload) => {
            console.log('Realtime update for room_players:', payload);
            // Fetch all players again to ensure consistent state
            supabase
              .from('room_players')
              .select('*')
              .eq('room_id', currentRoom.id)
              .then(({ data, error }) => {
                if (error) {
                  console.error('Error fetching room players:', error);
                } else if (data) {
                  setPlayersInRoom(data as RoomPlayer[]);
                }
              });
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to room_players for room ${currentRoom.id}`);
            // Initial fetch of players when subscribed
            supabase
              .from('room_players')
              .select('*')
              .eq('room_id', currentRoom.id)
              .then(({ data, error }) => {
                if (error) {
                  console.error('Error fetching initial room players:', error);
                } else if (data) {
                  setPlayersInRoom(data as RoomPlayer[]);
                }
              });
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Error subscribing to room_players for room ${currentRoom.id}`);
          }
        });
      
      playerChannelRef.current = channel;

      return () => {
        if (playerChannelRef.current) {
          supabase.removeChannel(playerChannelRef.current);
          playerChannelRef.current = null;
        }
      };
    } else {
      // If no current room, ensure playersInRoom is empty and channel is removed
      setPlayersInRoom([]);
      if (playerChannelRef.current) {
        supabase.removeChannel(playerChannelRef.current);
        playerChannelRef.current = null;
      }
    }
  }, [currentRoom]);


  // Global reset function
  const resetAllData = useCallback(() => {
    resetStats();
    resetUpgrades();
    resetChallenges();
    resetEconomy();
    resetActivePowerUps();
    resetSettings();
    resetPlayerSize();
    resetGameSession();
    setGameActive(false);
    setIsPaused(false);
    setCurrentRoom(null); // Reset multiplayer state
    setPlayersInRoom([]); // Reset multiplayer state
    if (playerChannelRef.current) {
      supabase.removeChannel(playerChannelRef.current);
      playerChannelRef.current = null;
    }
    showSuccess('All game data reset!');
  }, [
    resetStats, resetUpgrades, resetChallenges, resetEconomy, resetActivePowerUps,
    resetSettings, resetPlayerSize, resetGameSession, setGameActive, setIsPaused
  ]);

  return (
    <GameContext.Provider value={{
      stats,
      currentPoints,
      updateStats,
      useLife,
      refillLives,
      resetPlayerSize, // Added to context
      upgrades,
      purchaseUpgrade,
      getSpeedBoostMultiplier,
      getPointMultiplier,
      challenges,
      updateChallengeProgress,
      claimChallengeReward,
      activePowerUps,
      activatePowerUp,
      settings,
      updateSettings,
      selectedCosmetic,
      setSelectedCosmetic,
      dailyDeal,
      telegramStars,
      purchaseWithStars,
      openLootBox,
      playerSize,
      growPlayer,
      gameActive,
      isPaused,
      startGame,
      endGame,
      revivePlayer,
      setIsPaused,
      gameMode,
      setGameMode,
      selectedTeam,
      setSelectedTeam,
      currentRoom,
      playersInRoom,
      createRoom,
      joinRoom,
      leaveRoom,
      setPlayerReady,
      resetAllData,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}