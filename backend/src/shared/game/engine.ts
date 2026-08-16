import {
  canPass,
  checkForWinners,
  deal,
  determineTeams,
  findNextLeader,
  isLegalBid,
  isOut,
  isTrumpCard,
  nextSeat,
  resolveBiddingWinner,
  resolveTrick,
  scoreRound,
  trickPoints,
  SEATS,
} from '@pitch/shared';
import type { Card, GameState, RoundState, Seat, Suit } from '@pitch/shared';
import { GameError } from '../errors/errors.js';

const JOIN_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I/O — easy to read and say aloud
const JOIN_CODE_LENGTH = 5;

function generateJoinCode(): string {
  let code = '';
  for (let i = 0; i < JOIN_CODE_LENGTH; i++) {
    code += JOIN_CODE_ALPHABET[Math.floor(Math.random() * JOIN_CODE_ALPHABET.length)];
  }
  return code;
}

export function createGame(winThreshold: number): GameState {
  if (!Number.isInteger(winThreshold) || winThreshold <= 0) {
    throw new GameError('Win threshold must be a positive whole number');
  }
  return {
    gameId: generateJoinCode(),
    winThreshold,
    status: 'waiting-for-players',
    players: {},
    dealerSeat: 0,
    createdAt: new Date().toISOString(),
  };
}

export function joinOrReconnect(game: GameState, name: string): { game: GameState; seat: Seat } {
  const trimmed = name.trim();
  if (!trimmed) throw new GameError('Name is required');
  if (trimmed.length > 24) throw new GameError('Name is too long');

  for (const seat of SEATS) {
    const player = game.players[seat];
    if (player && player.name.toLowerCase() === trimmed.toLowerCase()) {
      if (player.connected) throw new GameError(`${trimmed} is already connected to this game`);
      player.connected = true;
      return { game, seat };
    }
  }

  const takenSeats = new Set(SEATS.filter((s) => game.players[s] !== undefined));
  const openSeat = SEATS.find((s) => !takenSeats.has(s));
  if (openSeat === undefined) throw new GameError('This game already has 4 players');

  game.players[openSeat] = { seat: openSeat, name: trimmed, connected: true, score: 0 };
  return { game, seat: openSeat };
}

export function markDisconnected(game: GameState, seat: Seat): GameState {
  const player = game.players[seat];
  if (player) player.connected = false;
  return game;
}

export function isReadyToStart(game: GameState): boolean {
  return game.status === 'waiting-for-players' && SEATS.every((s) => game.players[s] !== undefined);
}

/** Starts round 1 the moment all 4 seats are filled. No-op otherwise. */
export function maybeStartRound(game: GameState): GameState {
  return isReadyToStart(game) ? startRound(game) : game;
}

export function startRound(game: GameState): GameState {
  const roundNumber = (game.round?.roundNumber ?? 0) + 1;
  const hands = deal(game.dealerSeat);

  game.round = {
    roundNumber,
    dealerSeat: game.dealerSeat,
    hands,
    bids: [],
    currentTrick: [],
    completedTricks: [],
    outSeats: [],
    capturedPoints: {},
    turnSeat: nextSeat(game.dealerSeat),
  };
  game.status = 'bidding';
  return game;
}

export function startNextRound(game: GameState): GameState {
  if (game.status !== 'round-complete') throw new GameError('The current round is not complete yet');
  return startRound(game);
}

function requireRound(game: GameState): RoundState {
  if (!game.round) throw new GameError('No round is in progress');
  return game.round;
}

export function submitBid(game: GameState, seat: Seat, amount: number | 'pass'): GameState {
  const round = requireRound(game);
  if (game.status !== 'bidding') throw new GameError('Bidding is not open right now');
  if (round.turnSeat !== seat) throw new GameError('It is not your turn to bid');

  const currentHigh = resolveBiddingWinner(round.bids)?.amount ?? null;

  if (amount === 'pass') {
    if (!canPass(seat, round.dealerSeat, currentHigh)) {
      throw new GameError('As dealer, you must bid since nobody else has');
    }
  } else if (!isLegalBid(currentHigh, amount)) {
    throw new GameError(`Bid must be at least ${currentHigh === null ? 7 : currentHigh + 1}`);
  }

  round.bids.push({ seat, amount });

  if (round.bids.length === 4) {
    const winner = resolveBiddingWinner(round.bids);
    if (!winner) {
      // Unreachable: the dealer is always forced to bid if everyone else passed.
      throw new GameError('Bidding finished with no bids');
    }
    round.bidderSeat = winner.seat;
    round.bidAmount = winner.amount;
    round.turnSeat = winner.seat;
    game.status = 'choosing-trump';
  } else {
    round.turnSeat = nextSeat(seat);
  }

  return game;
}

export function chooseTrump(game: GameState, seat: Seat, suit: Suit): GameState {
  const round = requireRound(game);
  if (game.status !== 'choosing-trump') throw new GameError('Trump cannot be chosen right now');
  if (round.bidderSeat !== seat) throw new GameError('Only the winning bidder chooses trump');

  const hands = round.hands as Record<Seat, Card[]>;
  round.trumpSuit = suit;
  round.teams = determineTeams(hands, suit, round.bidderSeat);
  round.leaderSeat = round.bidderSeat;
  game.status = 'playing';

  const actionable = findActionableSeat(round, hands, suit, round.bidderSeat);
  if (actionable === undefined) {
    // Every seat (including the bidder) started with zero trump — impossible
    // since all 18 trump cards are always dealt out among the 4 hands.
    throw new GameError('No player has any trump cards — this should never happen');
  }
  round.turnSeat = actionable;

  return game;
}

export function playCard(game: GameState, seat: Seat, cardId: string): GameState {
  const round = requireRound(game);
  if (game.status !== 'playing') throw new GameError('No trick is being played right now');
  if (round.turnSeat !== seat) throw new GameError('It is not your turn to play');

  const trumpSuit = round.trumpSuit!;
  const hands = round.hands as Record<Seat, Card[]>;
  const hand = hands[seat];
  const cardIndex = hand.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) throw new GameError('You do not have that card');

  const card = hand[cardIndex];
  if (!isTrumpCard(card, trumpSuit)) throw new GameError('Only trump cards are playable');

  hand.splice(cardIndex, 1);
  round.currentTrick.push({ seat, card });

  const next = findActionableSeat(round, hands, trumpSuit, nextSeat(seat));
  if (next !== undefined) {
    round.turnSeat = next;
    return game;
  }

  return resolveCurrentTrick(game, round, hands, trumpSuit);
}

function resolveCurrentTrick(
  game: GameState,
  round: RoundState,
  hands: Record<Seat, Card[]>,
  trumpSuit: Suit
): GameState {
  const winnerSeat = resolveTrick(round.currentTrick, trumpSuit);
  const points = trickPoints(round.currentTrick, trumpSuit);
  round.capturedPoints[winnerSeat] = (round.capturedPoints[winnerSeat] ?? 0) + points;
  round.completedTricks.push({ plays: round.currentTrick, winnerSeat });
  round.currentTrick = [];

  const nextLeader = findNextLeader(winnerSeat, hands, trumpSuit);
  if (nextLeader === undefined) {
    return finishRound(game, round);
  }

  round.leaderSeat = nextLeader;
  const actionable = findActionableSeat(round, hands, trumpSuit, nextLeader);
  if (actionable === undefined) {
    return finishRound(game, round);
  }
  round.turnSeat = actionable;
  return game;
}

function finishRound(game: GameState, round: RoundState): GameState {
  const deltas = scoreRound(round.capturedPoints, round.teams!, round.bidAmount!);
  for (const seat of SEATS) {
    const player = game.players[seat];
    if (player) player.score += deltas[seat] ?? 0;
  }
  round.turnSeat = undefined;

  const scores = SEATS.reduce(
    (acc, s) => {
      acc[s] = game.players[s]?.score ?? 0;
      return acc;
    },
    {} as Record<Seat, number>
  );

  const winners = checkForWinners(scores, game.winThreshold);
  if (winners.length > 0) {
    game.status = 'complete';
    game.winnerSeats = winners;
  } else {
    game.status = 'round-complete';
    game.dealerSeat = nextSeat(game.dealerSeat);
  }

  return game;
}

/**
 * Walks forward from `from`, skipping any seat that's already out of trump
 * for the round (marking newly-discovered ones as out) or that already
 * played into the current trick. Returns the next seat that must act, or
 * undefined if every seat has now been resolved (trick complete).
 */
function findActionableSeat(
  round: RoundState,
  hands: Record<Seat, Card[]>,
  trumpSuit: Suit,
  from: Seat
): Seat | undefined {
  for (let i = 0; i < 4; i++) {
    const seat = ((from + i) % 4) as Seat;
    if (round.outSeats.includes(seat)) continue;
    if (round.currentTrick.some((p) => p.seat === seat)) continue;
    if (isOut(hands[seat], trumpSuit)) {
      round.outSeats.push(seat);
      continue;
    }
    return seat;
  }
  return undefined;
}

export { GameError } from '../errors/errors.js';
