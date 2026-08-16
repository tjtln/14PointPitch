import type { Suit } from '@pitch/shared';
import { gameplayHandler } from '../../shared/ws/gameplayHandler.js';
import { chooseTrump } from '../../shared/game/engine.js';
import { GameError } from '../../shared/errors/errors.js';

const VALID_SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

export const main = gameplayHandler((game, seat, body) => {
  const suit = body?.suit;
  if (!VALID_SUITS.includes(suit)) {
    throw new GameError('suit must be one of hearts, diamonds, clubs, spades');
  }
  return chooseTrump(game, seat, suit);
});
