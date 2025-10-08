import { BotBlob, PlayerBlob, FoodBlob } from '../types/gameTypes'; // Removed unused GameBlob
import { GAME_CONSTANTS, BOT_COLORS, BOT_NAMES } from '../constants/gameConstants';
import { calculateDistance, clampToCanvas, generateUniqueId } from './gameUtils';

export interface BotAction {
  targetX: number;
  targetY: number;
  speed: number;
  foundTarget: boolean;
  vx: number; // Added for persistent movement
  vy: number; // Added for persistent movement
}

export const createBot = (gameMode: string, team?: 'red' | 'blue'): BotBlob => {
  const teamColors = { red: '#EF4444', blue: '#3B82F6' };
  const botColor = gameMode === 'team' && team ? teamColors[team] : BOT_COLORS[Math.floor(Math.random() * BOT_COLORS.length)];
  
  return {
    id: generateUniqueId(),
    x: Math.random() * GAME_CONSTANTS.CANVAS_WIDTH,
    y: Math.random() * GAME_CONSTANTS.CANVAS_HEIGHT,
    size: GAME_CONSTANTS.BOT_MIN_SIZE + Math.random() * GAME_CONSTANTS.BOT_MAX_INITIAL_SIZE,
    color: botColor,
    isBot: true,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    name: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)],
    team: team,
    aggressionLevel: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
    lastTargetChange: Date.now(),
    lastAIUpdateTime: Date.now(), // Initialize last AI update time
    speed: GAME_CONSTANTS.BOT_BASE_SPEED, // Initialize speed
  };
};

export const calculateBotAction = (
  bot: BotBlob,
  player: PlayerBlob,
  foods: FoodBlob[],
  otherBots: BotBlob[],
  gameMode: string,
  selectedTeam: 'red' | 'blue',
  timeRemaining?: number,
  shieldActive?: boolean,
  playAreaRadius?: number
): BotAction => {
  const now = Date.now();
  
  // Calculate speed based on size and aggression
  let botBaseSpeed = Math.max(0.5, GAME_CONSTANTS.BOT_BASE_SPEED - (bot.size - GAME_CONSTANTS.BOT_MIN_SIZE) / 100);
  botBaseSpeed *= bot.aggressionLevel;
  
  // Increase aggression based on game mode
  if (gameMode === 'timeAttack' && timeRemaining) {
    const aggressionMultiplier = 1 + (GAME_CONSTANTS.TIME_ATTACK_DURATION - timeRemaining) / GAME_CONSTANTS.TIME_ATTACK_DURATION;
    botBaseSpeed *= aggressionMultiplier;
  } else if (gameMode === 'battleRoyale') {
    botBaseSpeed *= 1.5;
  }
  
  let targetX = bot.x;
  let targetY = bot.y;
  let foundTarget = false;
  let currentVx = bot.vx;
  let currentVy = bot.vy;
  
  // Battle Royale: Prioritize staying in safe zone (HIGHEST PRIORITY)
  if (gameMode === 'battleRoyale' && playAreaRadius) {
    const centerX = GAME_CONSTANTS.CANVAS_WIDTH / 2;
    const centerY = GAME_CONSTANTS.CANVAS_HEIGHT / 2;
    const distanceFromCenter = calculateDistance(bot.x, bot.y, centerX, centerY);
    
    // If bot is outside safe zone or too close to edge, move towards center
    const safeBuffer = 50; // Buffer to keep bots well inside the safe zone
    if (distanceFromCenter > playAreaRadius - safeBuffer) {
      const dx = centerX - bot.x;
      const dy = centerY - bot.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        // Move towards center with high priority
        const urgency = Math.min(2, distanceFromCenter / playAreaRadius);
        currentVx = (dx / distance) * botBaseSpeed * urgency * 2;
        currentVy = (dy / distance) * botBaseSpeed * urgency * 2;
        targetX = bot.x + currentVx;
        targetY = bot.y + currentVy;
        foundTarget = true;
      }
    }
  }
  
  // Find threats (larger entities to avoid)
  if (!foundTarget) {
    const threats: Array<{ x: number; y: number; size: number; distance: number }> = [];
  
    // Check player as threat (only if different teams in team mode)
    const playerIsThreat = gameMode === 'team' ? bot.team !== selectedTeam : true;
    if (playerIsThreat && player.size > bot.size * 1.2 && !shieldActive) {
      const playerDistance = calculateDistance(bot.x, bot.y, player.x, player.y);
      if (playerDistance < GAME_CONSTANTS.BOT_AVOID_RANGE) {
        threats.push({ x: player.x, y: player.y, size: player.size, distance: playerDistance });
      }
    }
  
    // Check other bots as threats (only if different teams in team mode)
    otherBots.forEach(otherBot => {
      const botIsThreat = gameMode === 'team' ? bot.team !== otherBot.team : true;
      if (otherBot.id !== bot.id && botIsThreat && otherBot.size > bot.size * 1.2) {
        const distance = calculateDistance(bot.x, bot.y, otherBot.x, otherBot.y);
        if (distance < GAME_CONSTANTS.BOT_AVOID_RANGE) {
          threats.push({ x: otherBot.x, y: otherBot.y, size: otherBot.size, distance });
        }
      }
    });
  
    // Avoid threats (high priority)
    if (threats.length > 0) {
      const nearestThreat = threats.reduce((nearest, threat) => 
        threat.distance < nearest.distance ? threat : nearest
      );
    
      const dx = bot.x - nearestThreat.x;
      const dy = bot.y - nearestThreat.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
    
      if (distance > 0) {
        const avoidanceStrength = Math.min(2, nearestThreat.size / bot.size);
        currentVx = (dx / distance) * botBaseSpeed * avoidanceStrength;
        currentVy = (dy / distance) * botBaseSpeed * avoidanceStrength;
        targetX = bot.x + currentVx;
        targetY = bot.y + currentVy;
        foundTarget = true;
      }
    }
  }
  
  // Team mode: prioritize enemy team members
  if (!foundTarget && gameMode === 'team' && bot.team) {
    const enemies: Array<{ x: number; y: number; size: number; distance: number }> = [];
    
    // Check other bots
    otherBots.forEach(otherBot => {
      if (otherBot.id !== bot.id && otherBot.team !== bot.team && otherBot.size < bot.size * 0.9) {
        const distance = calculateDistance(bot.x, bot.y, otherBot.x, otherBot.y);
        if (distance < GAME_CONSTANTS.BOT_CHASE_RANGE) {
          enemies.push({ x: otherBot.x, y: otherBot.y, size: otherBot.size, distance });
        }
      }
    });
    
    // Check player if on different team
    if (selectedTeam !== bot.team && player.size < bot.size * 0.9) {
      const playerDistance = calculateDistance(bot.x, bot.y, player.x, player.y);
      if (playerDistance < GAME_CONSTANTS.BOT_CHASE_RANGE) {
        enemies.push({ x: player.x, y: player.y, size: player.size, distance: playerDistance });
      }
    }
    
    if (enemies.length > 0) {
      const nearestEnemy = enemies.reduce((nearest, enemy) => 
        enemy.distance < nearest.distance ? enemy : nearest
      );
      
      const dx = nearestEnemy.x - bot.x;
      const dy = nearestEnemy.y - bot.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        currentVx = (dx / distance) * botBaseSpeed * 1.5;
        currentVy = (dy / distance) * botBaseSpeed * 1.5;
        targetX = bot.x + currentVx;
        targetY = bot.y + currentVy;
        foundTarget = true;
      }
    }
  }
  
  // Hunt smaller bots
  if (!foundTarget) {
    const prey: Array<{ x: number; y: number; size: number; distance: number }> = [];
    
    otherBots.forEach(otherBot => {
      const canEat = gameMode === 'team' ? bot.team !== otherBot.team : true;
      if (otherBot.id !== bot.id && canEat && otherBot.size < bot.size * 0.8) {
        const distance = calculateDistance(bot.x, bot.y, otherBot.x, otherBot.y);
        if (distance < GAME_CONSTANTS.BOT_CHASE_RANGE) {
          prey.push({ x: otherBot.x, y: otherBot.y, size: otherBot.size, distance });
        }
      }
    });
    
    // Consider player as prey if smaller
    const canEatPlayer = gameMode === 'team' ? bot.team !== selectedTeam : true;
    if (canEatPlayer && player.size < bot.size * 0.8 && !shieldActive) {
      const playerDistance = calculateDistance(bot.x, bot.y, player.x, player.y);
      if (playerDistance < GAME_CONSTANTS.BOT_CHASE_RANGE) {
        prey.push({ x: player.x, y: player.y, size: player.size, distance: playerDistance });
      }
    }
    
    if (prey.length > 0) {
      const nearestPrey = prey.reduce((nearest, p) => 
        p.distance < nearest.distance ? p : nearest
      );
      
      const dx = nearestPrey.x - bot.x;
      const dy = nearestPrey.y - bot.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        currentVx = (dx / distance) * botBaseSpeed * 1.3;
        currentVy = (dy / distance) * botBaseSpeed * 1.3;
        targetX = bot.x + currentVx;
        targetY = bot.y + currentVy;
        foundTarget = true;
      }
    }
  }
  
  // Seek food
  if (!foundTarget) {
    const nearbyFoods = foods.filter(food => 
      calculateDistance(bot.x, bot.y, food.x, food.y) < GAME_CONSTANTS.BOT_DETECTION_RANGE
    );
    
    if (nearbyFoods.length > 0) {
      const nearestFood = nearbyFoods.reduce((nearest, food) => {
        const distance = calculateDistance(bot.x, bot.y, food.x, food.y);
        const nearestDistance = calculateDistance(bot.x, bot.y, nearest.x, nearest.y);
        return distance < nearestDistance ? food : nearest;
      });
      
      const dx = nearestFood.x - bot.x;
      const dy = nearestFood.y - bot.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        currentVx = (dx / distance) * botBaseSpeed;
        currentVy = (dy / distance) * botBaseSpeed;
        targetX = bot.x + currentVx;
        targetY = bot.y + currentVy;
        foundTarget = true;
      }
    }
  }
  
  // Random movement with direction persistence
  if (!foundTarget) {
    if (!bot.vx || !bot.vy || Math.random() < 0.02 || now - bot.lastTargetChange > 3000) {
      currentVx = (Math.random() - 0.5) * 4;
      currentVy = (Math.random() - 0.5) * 4;
      bot.lastTargetChange = now;
    }
    targetX = bot.x + currentVx * botBaseSpeed;
    targetY = bot.y + currentVy * botBaseSpeed;
  }
  
  // Bounce off walls
  if (targetX < bot.size / 2 || targetX > GAME_CONSTANTS.CANVAS_WIDTH - bot.size / 2) {
    currentVx = -(currentVx || 0);
    targetX = Math.max(bot.size / 2, Math.min(GAME_CONSTANTS.CANVAS_WIDTH - bot.size / 2, targetX));
  }
  if (targetY < bot.size / 2 || targetY > GAME_CONSTANTS.CANVAS_HEIGHT - bot.size / 2) {
    currentVy = -(currentVy || 0);
    targetY = Math.max(bot.size / 2, Math.min(GAME_CONSTANTS.CANVAS_HEIGHT - bot.size / 2, targetY));
  }
  
  const clamped = clampToCanvas(targetX, targetY, bot.size / 2);
  
  return {
    targetX: clamped.x,
    targetY: clamped.y,
    speed: botBaseSpeed,
    foundTarget,
    vx: currentVx,
    vy: currentVy,
  };
};