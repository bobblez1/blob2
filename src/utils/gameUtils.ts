import { GAME_CONSTANTS, EVOLUTION_STAGES } from '../constants/gameConstants';
import { GameBlob, SpatialGrid, EvolutionStage } from '../types/gameTypes';

export const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
};

export const getEvolutionStage = (size: number): EvolutionStage => {
  if (size >= EVOLUTION_STAGES.LEGENDARY.threshold) return 'legendary';
  if (size >= EVOLUTION_STAGES.EPIC.threshold) return 'epic';
  if (size >= EVOLUTION_STAGES.RARE.threshold) return 'rare';
  if (size >= EVOLUTION_STAGES.COMMON.threshold) return 'common';
  return 'basic';
};

export const getEvolutionColor = (stage: EvolutionStage): string => {
  return EVOLUTION_STAGES[stage.toUpperCase() as keyof typeof EVOLUTION_STAGES].color;
};

export const clampToCanvas = (x: number, y: number, size: number) => {
  return {
    x: Math.max(size, Math.min(GAME_CONSTANTS.CANVAS_WIDTH - size, x)),
    y: Math.max(size, Math.min(GAME_CONSTANTS.CANVAS_HEIGHT - size, y)),
  };
};

export const isInViewport = (x: number, y: number, cameraX: number, cameraY: number, margin = 50): boolean => {
  const screenX = x - cameraX;
  const screenY = y - cameraY;
  return screenX > -margin && screenX < GAME_CONSTANTS.VIEWPORT_WIDTH + margin &&
         screenY > -margin && screenY < GAME_CONSTANTS.VIEWPORT_HEIGHT + margin;
};

// Spatial partitioning for collision optimization
export const createSpatialGrid = (blobs: GameBlob[], cellSize = 100): SpatialGrid => {
  const grid: SpatialGrid = {};
  
  blobs.forEach(blob => {
    const cellX = Math.floor(blob.x / cellSize);
    const cellY = Math.floor(blob.y / cellSize);
    const key = `${cellX},${cellY}`;
    
    if (!grid[key]) {
      grid[key] = [];
    }
    grid[key].push(blob);
  });
  
  return grid;
};

export const getNearbyBlobs = (x: number, y: number, grid: SpatialGrid, cellSize = 100): GameBlob[] => {
  const nearby: GameBlob[] = [];
  const cellX = Math.floor(x / cellSize);
  const cellY = Math.floor(y / cellSize);
  
  // Check surrounding cells
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const key = `${cellX + dx},${cellY + dy}`;
      if (grid[key]) {
        nearby.push(...grid[key]);
      }
    }
  }
  
  return nearby;
};

export const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const vibrate = (pattern: number | number[], enabled: boolean): void => {
  if (enabled && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

// Create a single AudioContext instance to reuse
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Audio not supported:', error);
      return null;
    }
  }
  return audioContext;
};

export const playSound = (soundName: string, enabled: boolean): void => {
  if (!enabled) return;
  
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    const sounds: { [key: string]: () => void } = {
      eat: () => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
      },
      
      death: () => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.setValueAtTime(200, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
      },
      
      powerup: () => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.setValueAtTime(400, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
      }
    };
    
    if (sounds[soundName]) {
      sounds[soundName]();
    }
  } catch (error) {
    console.warn('Audio playback error:', error);
  }
};