import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveTrick, trickPoints, findNextLeader, isRoundOver } from './trick.js';
import type { Card, Rank, Seat, Suit, TrickPlay } from '../models.js';

function card(suit: Suit, rank: Rank): Card {
  return { kind: 'standard', suit, rank, id: `${rank}-${suit}` };
}

test('highest trump rank wins the trick', () => {
  const plays: TrickPlay[] = [
    { seat: 0, card: card('hearts', '10') },
    { seat: 1, card: card('hearts', 'K') },
    { seat: 2, card: card('diamonds', 'A') }, // offA, rank 1 — beats K but not trump A
    { seat: 3, card: card('hearts', '2') },
  ];
  assert.equal(resolveTrick(plays, 'hearts'), 2);
});

test('trick points sum the point value of played cards only', () => {
  const plays: TrickPlay[] = [
    { seat: 0, card: card('hearts', '3') }, // 3 pts
    { seat: 1, card: card('hearts', 'K') }, // 0 pts
    { seat: 2, card: card('diamonds', '3') }, // off3, 3 pts
  ];
  assert.equal(trickPoints(plays, 'hearts'), 6);
});

test('findNextLeader skips seats with no trump left', () => {
  const hands: Record<Seat, Card[]> = {
    0: [card('clubs', 'K')], // no trump (hearts) left
    1: [card('hearts', '4')],
    2: [],
    3: [],
  };
  assert.equal(findNextLeader(0, hands, 'hearts'), 1);
});

test('isRoundOver is true once nobody has trump left', () => {
  const hands: Record<Seat, Card[]> = {
    0: [card('clubs', 'K')],
    1: [card('spades', 'Q')],
    2: [],
    3: [card('clubs', '9')],
  };
  assert.equal(isRoundOver(hands, 'hearts'), true);
});
