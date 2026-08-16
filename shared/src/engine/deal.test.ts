import assert from 'node:assert/strict';
import test from 'node:test';
import { deal } from './deal.js';

test('deal gives dealer and right-of-dealer 13 cards, others 14, all 54 dealt', () => {
  const dealerSeat = 1;
  const hands = deal(dealerSeat);

  assert.equal(hands[1].length, 13); // dealer
  assert.equal(hands[0].length, 13); // right of dealer (dealerSeat + 3) % 4
  assert.equal(hands[2].length, 14); // left of dealer
  assert.equal(hands[3].length, 14);

  const totalCards = hands[0].length + hands[1].length + hands[2].length + hands[3].length;
  assert.equal(totalCards, 54);

  const allIds = [...hands[0], ...hands[1], ...hands[2], ...hands[3]].map((c) => c.id);
  assert.equal(new Set(allIds).size, 54);
});
