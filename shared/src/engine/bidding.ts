import type { BidRecord, Seat } from '../models.js';

export const MINIMUM_BID = 7;

export function isLegalBid(currentHighBid: number | null, amount: number): boolean {
  if (!Number.isInteger(amount) || amount < MINIMUM_BID) return false;
  if (currentHighBid === null) return true;
  return amount > currentHighBid;
}

/**
 * The dealer may not pass while nobody else has bid — they're forced to bid
 * (at least MINIMUM_BID) and choose trump. Everyone else can always pass.
 */
export function canPass(seat: Seat, dealerSeat: Seat, currentHighBid: number | null): boolean {
  if (currentHighBid !== null) return true;
  return seat !== dealerSeat;
}

export function resolveBiddingWinner(bids: BidRecord[]): { seat: Seat; amount: number } | null {
  let best: { seat: Seat; amount: number } | null = null;
  for (const bid of bids) {
    if (bid.amount === 'pass') continue;
    if (best === null || bid.amount > best.amount) {
      best = { seat: bid.seat, amount: bid.amount };
    }
  }
  return best;
}
