import { gameplayHandler } from '../../shared/ws/gameplayHandler.js';
import { submitBid } from '../../shared/game/engine.js';
import { GameError } from '../../shared/errors/errors.js';

export const main = gameplayHandler((game, seat, body) => {
  if (body?.pass === true) {
    return submitBid(game, seat, 'pass');
  }
  const amount = Number(body?.amount);
  if (!Number.isFinite(amount)) {
    throw new GameError('Provide either { amount: number } or { pass: true }');
  }
  return submitBid(game, seat, amount);
});
