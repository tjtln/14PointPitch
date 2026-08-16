import { SEATS } from '../models.js';
/**
 * Determines the true (hidden) partnership for a round. Whoever holds the
 * trump Ace and whoever holds the trump 2 are teammates (2v2), unless the
 * same player holds both, in which case they play solo against the other
 * three (1v3). Players never see this directly — it's used only for scoring.
 */
export function determineTeams(hands, trumpSuit, bidderSeat) {
    let aceHolder;
    let twoHolder;
    for (const seat of SEATS) {
        for (const card of hands[seat]) {
            if (card.kind === 'standard' && card.suit === trumpSuit) {
                if (card.rank === 'A')
                    aceHolder = seat;
                if (card.rank === '2')
                    twoHolder = seat;
            }
        }
    }
    if (aceHolder === undefined || twoHolder === undefined) {
        throw new Error('Trump ace and trump 2 must both be in play to determine teams');
    }
    const soloSide = aceHolder === twoHolder;
    const acesSide = soloSide ? [aceHolder] : [aceHolder, twoHolder];
    const rest = SEATS.filter((s) => !acesSide.includes(s));
    const bidderSide = acesSide.includes(bidderSeat) ? acesSide : rest;
    const otherSide = bidderSide === acesSide ? rest : acesSide;
    return { aceHolder, twoHolder, bidderSide, otherSide };
}
