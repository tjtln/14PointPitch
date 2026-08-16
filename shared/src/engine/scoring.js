import { SEATS } from '../models.js';
import { TOTAL_ROUND_POINTS } from './cards.js';
/**
 * Scores a completed round. If the bidding side captured at least their
 * bid, every player on each side is credited with the total points THAT
 * side actually captured. If the bidding side fell short ("set"), every
 * player on the bidding side loses the bid amount, and every player on the
 * other side is credited the FULL 14 points in the hand (not just what
 * they captured) as a penalty bonus.
 *
 * Note: each side's total is credited in full to every member of that side
 * (not divided between partners) — matching how partnership scores work in
 * traditional pitch.
 */
export function scoreRound(capturedPoints, teams, bidAmount) {
    const bidSidePoints = teams.bidderSide.reduce((sum, s) => sum + (capturedPoints[s] ?? 0), 0);
    const otherSidePoints = teams.otherSide.reduce((sum, s) => sum + (capturedPoints[s] ?? 0), 0);
    const madeBid = bidSidePoints >= bidAmount;
    const deltas = { 0: 0, 1: 0, 2: 0, 3: 0 };
    if (madeBid) {
        for (const s of teams.bidderSide)
            deltas[s] = bidSidePoints;
        for (const s of teams.otherSide)
            deltas[s] = otherSidePoints;
    }
    else {
        for (const s of teams.bidderSide)
            deltas[s] = -bidAmount;
        for (const s of teams.otherSide)
            deltas[s] = TOTAL_ROUND_POINTS;
    }
    return deltas;
}
/**
 * Seats at or above the win threshold, highest score first. Empty if
 * nobody's there yet. If more than one seat is tied for the top score,
 * all of them are returned (a tied win).
 */
export function checkForWinners(scores, winThreshold) {
    const qualifying = SEATS.filter((s) => scores[s] >= winThreshold);
    if (qualifying.length === 0)
        return [];
    const max = Math.max(...qualifying.map((s) => scores[s]));
    return qualifying.filter((s) => scores[s] === max);
}
