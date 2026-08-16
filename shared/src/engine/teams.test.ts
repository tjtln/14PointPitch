import assert from 'node:assert/strict';
import test from 'node:test';
import { determineTeams } from './teams.js';
import type { Card, Rank, Seat, Suit } from '../models.js';

function card(suit: Suit, rank: Rank): Card {
  return { kind: 'standard', suit, rank, id: `${rank}-${suit}` };
}

test('ace and 2 holders on different seats form a 2v2 team', () => {
  const hands: Record<Seat, Card[]> = {
    0: [card('hearts', 'A')],
    1: [card('hearts', '2')],
    2: [card('clubs', 'K')],
    3: [card('spades', 'Q')],
  };
  const teams = determineTeams(hands, 'hearts', 2);
  assert.deepEqual(teams.bidderSide.slice().sort(), [2, 3]);
  assert.deepEqual(teams.otherSide.slice().sort(), [0, 1]);
});

test('bidder holding both ace and 2 plays solo 1v3', () => {
  const hands: Record<Seat, Card[]> = {
    0: [card('hearts', 'A'), card('hearts', '2')],
    1: [],
    2: [],
    3: [],
  };
  const teams = determineTeams(hands, 'hearts', 0);
  assert.deepEqual(teams.bidderSide, [0]);
  assert.deepEqual(teams.otherSide.slice().sort(), [1, 2, 3]);
});

test('non-bidder holding both ace and 2 leaves bidder 3v1 against them', () => {
  const hands: Record<Seat, Card[]> = {
    0: [card('hearts', 'A'), card('hearts', '2')],
    1: [],
    2: [],
    3: [],
  };
  const teams = determineTeams(hands, 'hearts', 2);
  assert.deepEqual(teams.bidderSide.slice().sort(), [1, 2, 3]);
  assert.deepEqual(teams.otherSide, [0]);
});
