import { SEATS } from '../models.js';
import { createDeck, shuffle } from './cards.js';
/**
 * Deals a shuffled 54-card deck (52 + 2 jokers) to 4 seats. The dealer and
 * the seat to the dealer's right (dealerSeat + 3, i.e. the last to act
 * before the dealer) each get 13 cards; the other two seats get 14, so all
 * 54 cards are dealt out.
 */
export function deal(dealerSeat, rng = Math.random) {
    const deck = shuffle(createDeck(), rng);
    return dealFromDeck(dealerSeat, deck);
}
export function dealFromDeck(dealerSeat, deck) {
    const rightOfDealer = ((dealerSeat + 3) % 4);
    const leftOfDealer = ((dealerSeat + 1) % 4);
    const remaining = { 0: 14, 1: 14, 2: 14, 3: 14 };
    remaining[dealerSeat] = 13;
    remaining[rightOfDealer] = 13;
    const hands = { 0: [], 1: [], 2: [], 3: [] };
    let seat = leftOfDealer;
    let i = 0;
    while (i < deck.length) {
        if (remaining[seat] > 0) {
            hands[seat].push(deck[i]);
            remaining[seat]--;
            i++;
        }
        seat = ((seat + 1) % 4);
    }
    return hands;
}
export function nextSeat(seat) {
    return ((seat + 1) % 4);
}
export { SEATS };
