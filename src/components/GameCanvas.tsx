import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { GAME_CONSTANTS, FOOD_COLORS, UPGRADE_IDS, CHALLENGE_TYPES, TEAM_COLORS } from '../constants/gameConstants';
import { PlayerBlob, BotBlob, FoodBlob } from '../types/gameTypes';
import { calculateDistance, getEvolutionStage, getEvolutionColor, isInViewport, clampToCanvas, generateUniqueId, vibrate, playSound } from '../utils/gameUtils';
import { createBot, calculateBotAction } from '../utils/botAI';
import { Play, Pause, RotateCcw, Heart, Home, Zap, Shield, Star } from 'lucide-react';

interface GameCanvasProps {
  onGameEnd: () => void;
}

function GameCanvas({ onGameEnd }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const keysRef = useRef<Set<string>>(new Set());
  const lastDecayTime = useRef<number>(Date.now());
  const gameStartTime = useRef<number>(Date.now());
  
  const { 
    stats, 
    upgrades, 
    challenges,
    activePowerUps,
    settings,
    gameMode,
    selectedTeam,
    currentPoints, 
    playerSize,
    gameActive, 
    startGame, 
    endGame, 
    useLife, 
    revivePlayer,
    updateStats,
    updateChallengeProgress,
    activatePowerUp,
    growPlayer
  } = useGame();
  
  const [player, setPlayer] = useState<PlayerBlob>({
    id: 'player',
    x: GAME_CONSTANTS.CANVAS_WIDTH / 2,
    y: GAME_CONSTANTS.CANVAS_HEIGHT / 2,
    size: GAME_CONSTANTS.PLAYER_INITIAL_SIZE,
    color: '#3B82F6',
    isPlayer: true as const,
    name: 'You',
  });
  
  const [bots, setBots] = useState<BotBlob[]>([]);
  const [foods, setFoods] = useState<FoodBlob[]>([]);
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [shieldActive, setShieldActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(GAME_CONSTANTS.TIME_ATTACK_DURATION);
  const [playAreaRadius, setPlayAreaRadius] = useState(Math.min(GAME_CONSTANTS.CANVAS_WIDTH, GAME_CONSTANTS.CANVAS_HEIGHT) / 2);

  // Initialize game
  useEffect(() => {
    console.log('Initializing game with mode:', gameMode);
    generateBots();
    generateFoods();
    gameStartTime.current = Date.now();
    setTimeRemaining(GAME_CONSTANTS.TIME_ATTACK_DURATION);
    setPlayAreaRadius(Math.min(GAME_CONSTANTS.CANVAS_WIDTH, GAME_CONSTANTS.CANVAS_HEIGHT) / 2);
    
    // Hide controls after 3 seconds
    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, [gameMode]);

  // Game mode specific timers
  useEffect(() => {
    if (!gameActive || gameOver || isPaused) return;
    
    const interval = setInterval(() => {
      if (gameMode === 'timeAttack') {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleGameOver();
            return 0;
          }
          return prev - 1;
        });
      } else if (gameMode === 'battleRoyale') {
        setPlayAreaRadius(prev => {
          return Math.max(GAME_CONSTANTS.BATTLE_ROYALE_MIN_RADIUS, prev - GAME_CONSTANTS.BATTLE_ROYALE_SHRINK_RATE);
        });
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameActive, gameOver, isPaused, gameMode]);

  // Check for active shield power-up
  useEffect(() => {
    const shield = activePowerUps.find(p => p.id === UPGRADE_IDS.SHIELD);
    setShieldActive(!!shield);
  }, [activePowerUps]);

  // Mouse and keyboard event handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused(prev => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game loop
  useEffect(() => {
    if (gameActive && !gameOver && !isPaused) {
      const gameLoop = () => {
        try {
          updateGame();
          draw();
          animationRef.current = requestAnimationFrame(gameLoop);
        } catch (error) {
          console.error('Game loop error:', error);
          setGameOver(true);
        }
      };
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameActive, gameOver, isPaused, player, bots, foods, activePowerUps]);

  const generateBots = () => {
    const newBots: BotBlob[] = [];
    
    const botCount = gameMode === 'battleRoyale' ? 20 : gameMode === 'team' ? 10 : 15;
    console.log('Generating', botCount, 'bots for mode:', gameMode);
    
    for (let i = 0; i < botCount; i++) {
      const team = gameMode === 'team' ? (i % 2 === 0 ? 'red' : 'blue') : undefined;
      newBots.push(createBot(gameMode, team));
    }
    console.log('Generated bots:', newBots.length);
    setBots(newBots);
  };

  const generateFoods = () => {
    const newFoods: FoodBlob[] = [];
    
    for (let i = 0; i < GAME_CONSTANTS.FOOD_COUNT; i++) {
      const foodColor = settings.foodColorMode === 'random' 
        ? Object.values(FOOD_COLORS)[Math.floor(Math.random() * Object.values(FOOD_COLORS).length)]
        : settings.selectedFoodColor;
        
      newFoods.push({
        id: generateUniqueId(),
        x: Math.random() * GAME_CONSTANTS.CANVAS_WIDTH,
        y: Math.random() * GAME_CONSTANTS.CANVAS_HEIGHT,
        size: GAME_CONSTANTS.FOOD_MIN_SIZE + Math.random() * (GAME_CONSTANTS.FOOD_MAX_SIZE - GAME_CONSTANTS.FOOD_MIN_SIZE),
        color: foodColor,
      });
    }
    console.log('Generated foods:', newFoods.length);
    setFoods(newFoods);
  };

  const updateGame = () => {
    // Create mutable copies for processing
    let currentFoods = [...foods];
    let currentBots = [...bots];
    let newPlayerSize = playerSize;
    
    // Blob decay mechanic - slowly shrink if inactive
    const now = Date.now();
    if (now - lastDecayTime.current > GAME_CONSTANTS.DECAY_INTERVAL) {
      if (newPlayerSize > GAME_CONSTANTS.PLAYER_MIN_SIZE) {
        growPlayer(-GAME_CONSTANTS.DECAY_AMOUNT);
        newPlayerSize = Math.max(GAME_CONSTANTS.PLAYER_MIN_SIZE, newPlayerSize - GAME_CONSTANTS.DECAY_AMOUNT);
      }
      lastDecayTime.current = now;
    }
    
    // Handle player movement with size-based speed
    const canvas = canvasRef.current;
    if (canvas) {
      const centerX = GAME_CONSTANTS.VIEWPORT_WIDTH / 2;
      const centerY = GAME_CONSTANTS.VIEWPORT_HEIGHT / 2;
      
      let targetX = mouseRef.current.x;
      let targetY = mouseRef.current.y;
      
      // Calculate speed based on size (bigger = slower)
      const baseSpeed = upgrades.find(u => u.id === UPGRADE_IDS.SPEED_BOOST && u.owned) 
        ? GAME_CONSTANTS.PLAYER_SPEED_BOOST 
        : GAME_CONSTANTS.PLAYER_BASE_SPEED;
      const sizeSpeedFactor = Math.max(0.3, 1 - (newPlayerSize - GAME_CONSTANTS.PLAYER_MIN_SIZE) / 200);
      const speed = baseSpeed * sizeSpeedFactor;
      
      let moveX = 0;
      let moveY = 0;
      
      // Keyboard movement for desktop
      if (keysRef.current.has('w') || keysRef.current.has('arrowup')) moveY -= speed;
      if (keysRef.current.has('s') || keysRef.current.has('arrowdown')) moveY += speed;
      if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) moveX -= speed;
      if (keysRef.current.has('d') || keysRef.current.has('arrowright')) moveX += speed;
      
      // Mouse movement
      if (Math.abs(targetX - centerX) > 5 || Math.abs(targetY - centerY) > 5) {
        const dx = targetX - centerX;
        const dy = targetY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          const normalizedDx = (dx / distance) * speed;
          const normalizedDy = (dy / distance) * speed;
          moveX += normalizedDx;
          moveY += normalizedDy;
        }
      }
      
      // Apply movement
      if (moveX !== 0 || moveY !== 0) {
        const clamped = clampToCanvas(player.x + moveX, player.y + moveY, newPlayerSize);
        setPlayer(prev => ({
          ...prev,
          x: clamped.x,
          y: clamped.y,
        }));
        
        // Reset decay timer when moving
        lastDecayTime.current = now;
      }
    }
    
    // Update camera to follow player
    setCamera({
      x: Math.max(0, Math.min(GAME_CONSTANTS.CANVAS_WIDTH - GAME_CONSTANTS.VIEWPORT_WIDTH, player.x - GAME_CONSTANTS.VIEWPORT_WIDTH / 2)),
      y: Math.max(0, Math.min(GAME_CONSTANTS.CANVAS_HEIGHT - GAME_CONSTANTS.VIEWPORT_HEIGHT, player.y - GAME_CONSTANTS.VIEWPORT_HEIGHT / 2)),
    });

    // Player-Food Interaction
    let totalGrowthThisFrame = 0;
    currentFoods = currentFoods.filter(food => {
      const distance = calculateDistance(player.x, player.y, food.x, food.y);
      if (distance < newPlayerSize / 2 + food.size / 2) {
        totalGrowthThisFrame += GAME_CONSTANTS.FOOD_GROWTH;
        playSound('eat', settings.soundEnabled);
        vibrate(50, settings.vibrateEnabled);
        return false; // Remove food
      }
      return true; // Keep food
    });
    
    // Apply player growth
    if (totalGrowthThisFrame > 0) {
      growPlayer(totalGrowthThisFrame);
      newPlayerSize += totalGrowthThisFrame;
    }

    // Bot-Food Interaction
    currentBots = currentBots.map(bot => {
      let botGrowth = 0;
      currentFoods = currentFoods.filter(food => {
        const distance = calculateDistance(bot.x, bot.y, food.x, food.y);
        if (distance < bot.size / 2 + food.size / 2) {
          botGrowth += GAME_CONSTANTS.FOOD_GROWTH * 0.7; // Bots grow slightly less from food
          return false; // Remove food
        }
        return true; // Keep food
      });
      
      return { ...bot, size: bot.size + botGrowth };
    });

    // Update bots with improved AI
    currentBots = currentBots.map(bot => {
      const action = calculateBotAction(
        bot, 
        { ...player, size: newPlayerSize } as PlayerBlob, 
        currentFoods, 
        currentBots.filter(b => b.id !== bot.id), 
        gameMode, 
        selectedTeam, 
        timeRemaining, 
        shieldActive,
        playAreaRadius
      );
      
      // Battle Royale: damage bots outside play area
      if (gameMode === 'battleRoyale') {
        const centerX = GAME_CONSTANTS.CANVAS_WIDTH / 2;
        const centerY = GAME_CONSTANTS.CANVAS_HEIGHT / 2;
        const distanceFromCenter = calculateDistance(bot.x, bot.y, centerX, centerY);
        
        if (distanceFromCenter > playAreaRadius) {
          bot.size = Math.max(5, bot.size - 1); // Shrink if outside safe zone
        }
      }
      
      return { ...bot, x: action.targetX, y: action.targetY };
    });
    
    // Bot-Bot Interaction (bots eating other bots)
    const botsToRemove = new Set<string>();
    currentBots = currentBots.map(bot => {
      if (botsToRemove.has(bot.id)) return bot;
      
      let botGrowth = 0;
      currentBots.forEach(otherBot => {
        if (bot.id !== otherBot.id && !botsToRemove.has(otherBot.id)) {
          const distance = calculateDistance(bot.x, bot.y, otherBot.x, otherBot.y);
          // In team mode, bots can only eat bots from different teams
          const canEat = gameMode === 'team' ? bot.team !== otherBot.team : true;
          if (canEat && distance < bot.size / 2 + otherBot.size / 2 && bot.size > otherBot.size) {
            botGrowth += otherBot.size * GAME_CONSTANTS.BOT_GROWTH_MULTIPLIER;
            botsToRemove.add(otherBot.id);
          }
        }
      });
      
      return { ...bot, size: bot.size + botGrowth };
    }).filter(bot => !botsToRemove.has(bot.id));
    
    // Regenerate food if needed
    if (currentFoods.length < GAME_CONSTANTS.FOOD_REGENERATION_THRESHOLD) {
      for (let i = 0; i < GAME_CONSTANTS.FOOD_REGENERATION_BATCH; i++) {
        const foodColor = settings.foodColorMode === 'random' 
          ? Object.values(FOOD_COLORS)[Math.floor(Math.random() * Object.values(FOOD_COLORS).length)]
          : settings.selectedFoodColor;
          
        currentFoods.push({
          id: generateUniqueId(),
          x: Math.random() * GAME_CONSTANTS.CANVAS_WIDTH,
          y: Math.random() * GAME_CONSTANTS.CANVAS_HEIGHT,
          size: GAME_CONSTANTS.FOOD_MIN_SIZE + Math.random() * (GAME_CONSTANTS.FOOD_MAX_SIZE - GAME_CONSTANTS.FOOD_MIN_SIZE),
          color: foodColor,
        });
      }
    }

    // Battle Royale: damage player outside play area
    if (gameMode === 'battleRoyale') {
      const centerX = GAME_CONSTANTS.CANVAS_WIDTH / 2;
      const centerY = GAME_CONSTANTS.CANVAS_HEIGHT / 2;
      const distanceFromCenter = calculateDistance(player.x, player.y, centerX, centerY);
      
      if (distanceFromCenter > playAreaRadius) {
        growPlayer(-GAME_CONSTANTS.DECAY_AMOUNT);
        newPlayerSize = Math.max(GAME_CONSTANTS.PLAYER_MIN_SIZE, newPlayerSize - GAME_CONSTANTS.DECAY_AMOUNT);
      }
    }

    // Battle Royale: Check if only player remains
    if (gameMode === 'battleRoyale' && currentBots.length === 0) {
      handleGameOver(); // Player wins!
    }

    // Check collisions with bots
    const hasInstantKill = upgrades.find(u => u.id === UPGRADE_IDS.INSTANT_KILL && u.owned);
    const baseMultiplier = upgrades.find(u => u.id === UPGRADE_IDS.POINT_MULTIPLIER_1 && u.owned) ? 2 : 1;
    const powerUpMultiplier = activePowerUps.find(p => p.id === UPGRADE_IDS.DOUBLE_POINTS) ? 2 : 1;
    
    const botsToRemoveFromPlayer = new Set<string>();
    currentBots.forEach(bot => {
      if (botsToRemoveFromPlayer.has(bot.id)) return;
      
      const distance = calculateDistance(player.x, player.y, bot.x, bot.y);
      
      if (distance < newPlayerSize / 2 + bot.size / 2) {
        // In team mode, player can only eat bots from different teams
        const canEatBot = gameMode === 'team' ? selectedTeam !== bot.team : true;
        const canBotEatPlayer = gameMode === 'team' ? selectedTeam !== bot.team : true;
        
        if (canEatBot && (newPlayerSize > bot.size || hasInstantKill)) {
          // Player eats bot - gain points and growth
          const basePoints = Math.floor(bot.size / 2);
          const totalPoints = basePoints * baseMultiplier * powerUpMultiplier;
          
          updateStats(totalPoints);
          updateChallengeProgress(CHALLENGE_TYPES.EAT_BLOBS, 1);
          
          playSound('eat', settings.soundEnabled);
          vibrate(100, settings.vibrateEnabled);
          
          // Growth from eating other blobs
          const growthAmount = bot.size * GAME_CONSTANTS.BOT_GROWTH_MULTIPLIER;
          growPlayer(growthAmount);
          newPlayerSize += growthAmount;
          
          botsToRemoveFromPlayer.add(bot.id);
          
          // Add new bot to maintain population
          if (gameMode !== 'battleRoyale') { // Don't respawn in Battle Royale
            const team = gameMode === 'team' ? (Math.random() > 0.5 ? 'red' : 'blue') : undefined;
            currentBots.push(createBot(gameMode, team));
          }
        } else if (canBotEatPlayer && !shieldActive) {
          // Bot eats player - game over (only if no shield and bot is larger)
          if (bot.size > newPlayerSize) {
            playSound('death', settings.soundEnabled);
            vibrate([200, 100, 200], settings.vibrateEnabled);
            handleGameOver();
          }
        }
      }
    });
    
    // Remove bots eaten by player
    currentBots = currentBots.filter(bot => !botsToRemoveFromPlayer.has(bot.id));
    
    // Update component state
    setFoods(currentFoods);
    setBots(currentBots);

    // Update survival time challenge
    const survivalTime = (now - gameStartTime.current) / 1000;
    if (survivalTime >= 60) { // 1 minute survival
      updateChallengeProgress(CHALLENGE_TYPES.SURVIVE_TIME, Math.floor(survivalTime / 60));
    }
  };

  const handleGameOver = () => {
    const hasAutoRevive = upgrades.find(u => u.id === UPGRADE_IDS.AUTO_REVIVE && u.owned);
    
    if (hasAutoRevive) {
      revivePlayer();
      setPlayer(prev => ({ ...prev, size: 20 }));
      playSound('powerup', settings.soundEnabled);
      vibrate(300, settings.vibrateEnabled);
    } else {
      setGameOver(true);
      endGame(currentPoints);
      
      // Use a life when game ends
      useLife();
    }
  };

  const handleRestart = () => {
    if (stats.livesRemaining > 0) {
      setGameOver(false);
      setPlayer({
        id: 'player',
        x: GAME_CONSTANTS.CANVAS_WIDTH / 2,
        y: GAME_CONSTANTS.CANVAS_HEIGHT / 2,
        color: getPlayerColor(),
        isPlayer: true as const,
        name: 'You',
      });
      generateBots();
      generateFoods();
      gameStartTime.current = Date.now();
      startGame();
    }
  };

  const getPlayerColor = () => {
    const cosmetic = upgrades.find(u => u.category === 'cosmetic' && u.owned);
    return cosmetic?.color || '#3B82F6';
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, GAME_CONSTANTS.VIEWPORT_WIDTH, GAME_CONSTANTS.VIEWPORT_HEIGHT);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = GAME_CONSTANTS.GRID_SIZE;
    
    for (let x = -camera.x % gridSize; x < GAME_CONSTANTS.VIEWPORT_WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME_CONSTANTS.VIEWPORT_HEIGHT);
      ctx.stroke();
    }
    
    for (let y = -camera.y % gridSize; y < GAME_CONSTANTS.VIEWPORT_HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME_CONSTANTS.VIEWPORT_WIDTH, y);
      ctx.stroke();
    }
    
    // Draw Battle Royale safe zone
    if (gameMode === 'battleRoyale') {
      const centerX = GAME_CONSTANTS.CANVAS_WIDTH / 2 - camera.x;
      const centerY = GAME_CONSTANTS.CANVAS_HEIGHT / 2 - camera.y;
      
      // Draw danger zone (outside safe area)
      ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
      ctx.fillRect(0, 0, GAME_CONSTANTS.VIEWPORT_WIDTH, GAME_CONSTANTS.VIEWPORT_HEIGHT);
      
      // Draw safe zone
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(centerX, centerY, playAreaRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      
      // Draw safe zone border
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, playAreaRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw foods
    foods.forEach(food => {
      const screenX = food.x - camera.x;
      const screenY = food.y - camera.y;
      
      if (isInViewport(food.x, food.y, camera.x, camera.y, 20)) {
        ctx.fillStyle = food.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, food.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add subtle glow
        ctx.shadowColor = food.color;
        ctx.shadowBlur = 3;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });
    
    // Draw bots
    bots.forEach(bot => {
      const screenX = bot.x - camera.x;
      const screenY = bot.y - camera.y;
      
      if (isInViewport(bot.x, bot.y, camera.x, camera.y, 100)) {
        // Draw bot
        ctx.fillStyle = bot.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, bot.size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw bot outline
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        
        // Team mode: different outline colors
        if (gameMode === 'team' && bot.team) {
          ctx.strokeStyle = bot.team === 'red' ? '#EF4444' : '#3B82F6';
        }
        
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw bot name
        if (bot.size > 15) {
          ctx.fillStyle = 'white';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(bot.name || '', screenX, screenY + 3);
        }
      }
    });
    
    // Draw player with evolution effects
    const playerScreenX = player.x - camera.x;
    const playerScreenY = player.y - camera.y;
    const evolutionStage = getEvolutionStage(playerSize);
    
    // Player glow based on evolution
    const glowIntensity = evolutionStage === 'legendary' ? 20 : 
                         evolutionStage === 'epic' ? 15 : 
                         evolutionStage === 'rare' ? 10 : 0;
    
    if (glowIntensity > 0) {
      ctx.shadowColor = getPlayerColor();
      ctx.shadowBlur = glowIntensity;
    }
    
    let playerColor = getPlayerColor();
    
    // Team mode: use team colors
    if (gameMode === 'team') {
      playerColor = selectedTeam === 'red' ? TEAM_COLORS.red : TEAM_COLORS.blue;
    }
    
    ctx.fillStyle = playerColor;
    ctx.beginPath();
    ctx.arc(playerScreenX, playerScreenY, playerSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Draw shield effect
    if (shieldActive) {
      ctx.strokeStyle = '#60A5FA';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(playerScreenX, playerScreenY, playerSize / 2 + 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Draw player outline
    ctx.strokeStyle = getEvolutionColor(evolutionStage);
                     
    // Team mode: team-colored outline
    if (gameMode === 'team') {
      ctx.strokeStyle = selectedTeam === 'red' ? TEAM_COLORS.red : TEAM_COLORS.blue;
    }
                     
    ctx.lineWidth = evolutionStage === 'legendary' ? 4 : 2;
    ctx.stroke();
    
    // Draw player name and evolution indicator
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('You', playerScreenX, playerScreenY + 4);
    
    if (evolutionStage !== 'basic') {
      ctx.font = '8px Arial';
      ctx.fillStyle = getEvolutionColor(evolutionStage);
      ctx.fillText(evolutionStage.toUpperCase(), playerScreenX, playerScreenY - playerSize / 2 - 8);
    }
    
    // Draw leaderboard
    drawLeaderboard(ctx);
    
    // Draw active power-ups indicator
    if (activePowerUps.length > 0) {
      drawPowerUpsIndicator(ctx);
    }
  };

  const drawLeaderboard = (ctx: CanvasRenderingContext2D) => {
    const playerBlob = { ...player, size: playerSize };
    const allBlobs = [playerBlob, ...bots].sort((a, b) => b.size - a.size).slice(0, 5);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 10, 140, 110);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Leaderboard', 15, 28);
    
    allBlobs.forEach((blob, index) => {
      const y = 45 + index * 13;
      ctx.font = '10px Arial';
      ctx.fillStyle = blob.isPlayer ? '#3B82F6' : '#888';
      const name = blob.name || 'Bot';
      const size = Math.round(blob.size);
      ctx.fillText(`${index + 1}. ${name} (${size})`, 15, y);
    });
  };

  const drawPowerUpsIndicator = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(GAME_CONSTANTS.VIEWPORT_WIDTH - 120, 10, 110, 30 + activePowerUps.length * 15);
    
    ctx.fillStyle = '#60A5FA';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Active Power-ups', GAME_CONSTANTS.VIEWPORT_WIDTH - 115, 25);
    
    activePowerUps.forEach((powerUp, index) => {
      const y = 40 + index * 15;
      const timeLeft = Math.ceil((powerUp.expiresAt - Date.now()) / 1000);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '9px Arial';
      ctx.fillText(`${powerUp.name}: ${timeLeft}s`, GAME_CONSTANTS.VIEWPORT_WIDTH - 115, y);
    });
  };

  const handleTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    mouseRef.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  };

  const handleStartGame = () => {
    console.log('Starting game with mode:', gameMode);
    // Generate bots and foods when starting the game
    generateBots();
    generateFoods();
    startGame();
  };

  return (
    <div className="relative w-full h-full flex flex-col max-w-sm mx-auto">
      {/* Game HUD */}
      <div className="absolute top-0 left-0 right-0 z-10 p-3 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex justify-between items-center text-white text-sm">
          <div className="flex items-center gap-3">
            <div className="font-bold">Score: {currentPoints}</div>
            <div className="flex items-center gap-1">
              <Heart size={14} className="text-red-400" />
              <span>{stats.livesRemaining}</span>
            </div>
            {gameMode === 'timeAttack' && (
              <div className="flex items-center gap-1">
                <span className="text-yellow-400">⏱️</span>
                <span>{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span>
              </div>
            )}
            {gameMode === 'battleRoyale' && (
              <div className="flex items-center gap-1">
                <span className="text-green-400">🛡️</span>
                <span>{Math.round(playAreaRadius)}</span>
              </div>
            )}
            {gameMode === 'team' && (
              <div className="flex items-center gap-1">
                <span className={selectedTeam === 'red' ? 'text-red-400' : 'text-blue-400'}>
                  {selectedTeam === 'red' ? '🔴' : '🔵'}
                </span>
                <span className="capitalize">{selectedTeam}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onGameEnd}
              className="p-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
            >
              <Home size={14} />
            </button>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
            >
              {isPaused ? <Play size={14} /> : <Pause size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Controls Help */}
      {showControls && (
        <div className="absolute bottom-16 left-2 right-2 z-10 bg-black/80 p-2 rounded-lg text-white text-xs text-center">
          <p className="mb-1">🖱️ Move mouse or WASD to move</p>
          <p>📱 Touch to move on mobile</p>
        </div>
      )}

      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        width={GAME_CONSTANTS.VIEWPORT_WIDTH}
        height={GAME_CONSTANTS.VIEWPORT_HEIGHT}
        className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 cursor-crosshair"
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
        style={{ touchAction: 'none', aspectRatio: `${GAME_CONSTANTS.VIEWPORT_WIDTH}/${GAME_CONSTANTS.VIEWPORT_HEIGHT}` }}
      />

      {/* Pause Screen */}
      {isPaused && gameActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20">
          <div className="bg-gray-900/90 p-6 rounded-2xl text-white text-center">
            <h2 className="text-xl font-bold mb-4">Game Paused</h2>
            <button
              onClick={() => setIsPaused(false)}
              className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 mx-auto"
            >
              <Play size={18} />
              Resume
            </button>
          </div>
        </div>
      )}

      {/* Game Over / Start Screen */}
      {(!gameActive || gameOver) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20">
          <div className="bg-gray-900/90 p-6 rounded-2xl text-white text-center max-w-xs mx-4">
            {gameOver ? (
              <>
                <h2 className="text-xl font-bold mb-2">Game Over!</h2>
                <p className="text-gray-300 mb-2">Final Score: {currentPoints}</p>
                <p className="text-sm text-gray-400 mb-4">
                  Evolution: {getEvolutionStage(playerSize).toUpperCase()}
                </p>
                
                <div className="flex gap-2">
                  <button
                    onClick={onGameEnd}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 justify-center text-sm"
                  >
                    <Home size={16} />
                    Home
                  </button>
                  
                  {stats.livesRemaining > 0 && (
                    <button
                      onClick={handleRestart}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 justify-center text-sm"
                    >
                      <RotateCcw size={16} />
                      Retry
                    </button>
                  )}
                </div>
                
                {stats.livesRemaining <= 0 && (
                  <div className="text-red-400 mt-3">
                    <p className="text-sm">No lives remaining!</p>
                    <p className="text-xs text-gray-400">Lives reset daily</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4">Ready to Play?</h2>
                <p className="text-gray-300 mb-6 text-sm">Eat food to grow, eat smaller blobs for points!</p>
                <button
                  onClick={handleStartGame}
                  className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 mx-auto"
                >
                  <Play size={18} />
                  Start Game
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default GameCanvas;