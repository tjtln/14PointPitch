import assert from 'node:assert/strict';
import test from 'node:test';
import { createDeck, pointValue, trumpRankIndex, TOTAL_ROUND_POINTS } from './cards.js';
import type { Card } from '../models.js';

test('deck has 54 unique cards', () => {
  const deck = createDeck();
  assert.equal(deck.length, 54);
  assert.equal(new Set(deck.map((c) => c.id)).size, 54);
});

test('exactly 18 cards are trump for a given suit', () => {
  const deck = createDeck();
  const trumpCards = deck.filter((c) => trumpRankIndex(c, 'hearts') !== undefined);
  assert.equal(trumpCards.length, 18);
});

test('total round points sum to 14', () => {
  const deck = createDeck();
  const total = deck.reduce((sum, c) => sum + pointValue(c, 'hearts'), 0);
  assert.equal(total, TOTAL_ROUND_POINTS);
});

test('off-suit A/J/3 are trump, other off-suit ranks are not', () => {
  const offAce: Card = { kind: 'standard', suit: 'diamonds', rank: 'A', id: 'A-diamonds' };
  const offKing: Card = { kind: 'standard', suit: 'diamonds', rank: 'K', id: 'K-diamonds' };
  assert.notEqual(trumpRankIndex(offAce, 'hearts'), undefined);
  assert.equal(trumpRankIndex(offKing, 'hearts'), undefined);
});

test('trump rank order matches spec: A > offA > K > Q > J > offJack > bigJoker > littleJoker > 10..4 > 3 > off3 > 2', () => {
  const cards: [Card, number][] = [
    [{ kind: 'standard', suit: 'hearts', rank: 'A', id: '' }, 0],
    [{ kind: 'standard', suit: 'diamonds', rank: 'A', id: '' }, 1],
    [{ kind: 'standard', suit: 'hearts', rank: 'K', id: '' }, 2],
    [{ kind: 'standard', suit: 'hearts', rank: 'Q', id: '' }, 3],
    [{ kind: 'standard', suit: 'hearts', rank: 'J', id: '' }, 4],
    [{ kind: 'standard', suit: 'diamonds', rank: 'J', id: '' }, 5],
    [{ kind: 'joker', variant: 'big', id: '' }, 6],
    [{ kind: 'joker', variant: 'little', id: '' }, 7],
    [{ kind: 'standard', suit: 'hearts', rank: '10', id: '' }, 8],
    [{ kind: 'standard', suit: 'hearts', rank: '3', id: '' }, 15],
    [{ kind: 'standard', suit: 'diamonds', rank: '3', id: '' }, 16],
    [{ kind: 'standard', suit: 'hearts', rank: '2', id: '' }, 17],
  ];
  for (const [card, expected] of cards) {
    assert.equal(trumpRankIndex(card, 'hearts'), expected, JSON.stringify(card));
  }
});
