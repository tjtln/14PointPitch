import { SEATS } from '../models.js';
import { isTrumpCard, pointValue, trumpRankIndex } from './cards.js';
/** A player with no trump left in hand is "out" for the rest of the round. */
export function isOut(hand, trumpSuit) {
    return !hand.some((c) => isTrumpCard(c, trumpSuit));
}
export function resolveTrick(plays, trumpSuit) {
    if (plays.length === 0)
        throw new Error('Cannot resolve an empty trick');
    let winner = plays[0];
    let winnerIdx = trumpRankIndex(winner.card, trumpSuit);
    for (const p of plays.slice(1)) {
        const idx = trumpRankIndex(p.card, trumpSuit);
        if (idx < winnerIdx) {
            winner = p;
            winnerIdx = idx;
        }
    }
    return winner.seat;
}
export function trickPoints(plays, trumpSuit) {
    return plays.reduce((sum, p) => sum + pointValue(p.card, trumpSuit), 0);
}
/**
 * Next seat, clockwise from `from`, who still has trump left to lead.
 * Undefined means nobody does — the round is over.
 */
export function findNextLeader(from, hands, trumpSuit) {
    for (let i = 0; i < 4; i++) {
        const seat = ((from + i) % 4);
        if (!isOut(hands[seat], trumpSuit))
            return seat;
    }
    return undefined;
}
export function isRoundOver(hands, trumpSuit) {
    return SEATS.every((s) => isOut(hands[s], trumpSuit));
}
