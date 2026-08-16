import { gameplayHandler } from '../../shared/ws/gameplayHandler.js';
import { playCard } from '../../shared/game/engine.js';
import { GameError } from '../../shared/errors/errors.js';

export const main = gameplayHandler((game, seat, body) => {
  const cardId = body?.cardId;
  if (typeof cardId !== 'string' || !cardId) {
    throw new GameError('cardId is required');
  }
  return playCard(game, seat, cardId);
});
