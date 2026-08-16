const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
export function createDeck() {
    const cards = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            cards.push({ kind: 'standard', suit, rank, id: `${rank}-${suit}` });
        }
    }
    cards.push({ kind: 'joker', variant: 'big', id: 'joker-big' });
    cards.push({ kind: 'joker', variant: 'little', id: 'joker-little' });
    return cards;
}
export function shuffle(items, rng = Math.random) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
export function color(suit) {
    return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
}
/** The other suit of the same color — its A/J/3 are "off" trump cards. */
export function offSuit(trumpSuit) {
    switch (trumpSuit) {
        case 'hearts':
            return 'diamonds';
        case 'diamonds':
            return 'hearts';
        case 'clubs':
            return 'spades';
        case 'spades':
            return 'clubs';
    }
}
/**
 * Rank index of a card among the 18 cards that are ever playable for a given
 * trump suit, 0 = highest (trump Ace) .. 17 = lowest (trump 2). Undefined if
 * the card isn't one of the 18 trump cards at all (i.e. it's dead this round).
 *
 * Order: A, offA, K, Q, J, offJack, Joker(big), Joker(little/off), 10, 9, 8,
 * 7, 6, 5, 4, 3, off3, 2.
 */
export function trumpRankIndex(card, trumpSuit) {
    if (card.kind === 'joker') {
        return card.variant === 'big' ? 6 : 7;
    }
    if (card.suit === trumpSuit) {
        switch (card.rank) {
            case 'A':
                return 0;
            case 'K':
                return 2;
            case 'Q':
                return 3;
            case 'J':
                return 4;
            case '10':
                return 8;
            case '9':
                return 9;
            case '8':
                return 10;
            case '7':
                return 11;
            case '6':
                return 12;
            case '5':
                return 13;
            case '4':
                return 14;
            case '3':
                return 15;
            case '2':
                return 17;
            default:
                return undefined;
        }
    }
    if (card.suit === offSuit(trumpSuit)) {
        switch (card.rank) {
            case 'A':
                return 1;
            case 'J':
                return 5;
            case '3':
                return 16;
            default:
                return undefined;
        }
    }
    return undefined;
}
export function isTrumpCard(card, trumpSuit) {
    return trumpRankIndex(card, trumpSuit) !== undefined;
}
const ONE_POINT_INDICES = new Set([0, 1, 4, 5, 6, 7, 8, 17]);
const THREE_POINT_INDICES = new Set([15, 16]);
/** Point value of a card THIS round. Non-trump cards are always worth 0 (they're never played). */
export function pointValue(card, trumpSuit) {
    const idx = trumpRankIndex(card, trumpSuit);
    if (idx === undefined)
        return 0;
    if (ONE_POINT_INDICES.has(idx))
        return 1;
    if (THREE_POINT_INDICES.has(idx))
        return 3;
    return 0;
}
export const TOTAL_ROUND_POINTS = 14;
/** All 18 trump cards a player is holding, ranked (index 0 = highest first). */
export function trumpCardsInHand(hand, trumpSuit) {
    return hand
        .filter((c) => isTrumpCard(c, trumpSuit))
        .sort((a, b) => trumpRankIndex(a, trumpSuit) - trumpRankIndex(b, trumpSuit));
}
