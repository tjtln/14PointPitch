import assert from 'node:assert/strict';
import test from 'node:test';
import { scoreRound, checkForWinners } from './scoring.js';
import type { RoundTeams, Seat } from '../models.js';

test('bidding side makes bid: each side credited its own captured points', () => {
  const teams: RoundTeams = { aceHolder: 0, twoHolder: 1, bidderSide: [0, 1], otherSide: [2, 3] };
  const captured: Partial<Record<Seat, number>> = { 0: 5, 1: 3, 2: 4, 3: 2 };
  const deltas = scoreRound(captured, teams, 7);
  assert.equal(deltas[0], 8);
  assert.equal(deltas[1], 8);
  assert.equal(deltas[2], 6);
  assert.equal(deltas[3], 6);
});

test('bidding side is set: they lose the bid amount, other side gets all 14', () => {
  const teams: RoundTeams = { aceHolder: 0, twoHolder: 1, bidderSide: [0, 1], otherSide: [2, 3] };
  const captured: Partial<Record<Seat, number>> = { 0: 2, 1: 2, 2: 6, 3: 4 };
  const deltas = scoreRound(captured, teams, 7);
  assert.equal(deltas[0], -7);
  assert.equal(deltas[1], -7);
  assert.equal(deltas[2], 14);
  assert.equal(deltas[3], 14);
});

test('solo bidder set: solo player loses bid, all 3 others get 14 each', () => {
  const teams: RoundTeams = { aceHolder: 0, twoHolder: 0, bidderSide: [0], otherSide: [1, 2, 3] };
  const captured: Partial<Record<Seat, number>> = { 0: 3, 1: 5, 2: 3, 3: 3 };
  const deltas = scoreRound(captured, teams, 9);
  assert.equal(deltas[0], -9);
  assert.equal(deltas[1], 14);
  assert.equal(deltas[2], 14);
  assert.equal(deltas[3], 14);
});

test('checkForWinners returns empty when nobody has reached the threshold', () => {
  const scores: Record<Seat, number> = { 0: 5, 1: 3, 2: -2, 3: 8 };
  assert.deepEqual(checkForWinners(scores, 14), []);
});

test('checkForWinners returns the highest scorer(s) at/above threshold', () => {
  const scores: Record<Seat, number> = { 0: 15, 1: 3, 2: -2, 3: 20 };
  assert.deepEqual(checkForWinners(scores, 14), [3]);
});

test('checkForWinners handles a tie at the top', () => {
  const scores: Record<Seat, number> = { 0: 20, 1: 3, 2: -2, 3: 20 };
  assert.deepEqual(checkForWinners(scores, 14), [0, 3]);
});
