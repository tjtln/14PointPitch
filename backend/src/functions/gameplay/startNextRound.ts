import { gameplayHandler } from '../../shared/ws/gameplayHandler.js';
import { startNextRound } from '../../shared/game/engine.js';

export const main = gameplayHandler((game) => startNextRound(game));
