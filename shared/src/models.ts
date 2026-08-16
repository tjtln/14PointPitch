export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export type Rank =
  | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10'
  | 'J' | 'Q' | 'K' | 'A';

export interface StandardCard {
  kind: 'standard';
  suit: Suit;
  rank: Rank;
  id: string;
}

export interface JokerCard {
  kind: 'joker';
  variant: 'big' | 'little';
  id: string;
}

export type Card = StandardCard | JokerCard;

export type Seat = 0 | 1 | 2 | 3;

export const SEATS: Seat[] = [0, 1, 2, 3];

export interface GamePlayer {
  seat: Seat;
  name: string;
  connected: boolean;
  score: number;
}

export type GameStatus =
  | 'waiting-for-players'
  | 'bidding'
  | 'choosing-trump'
  | 'playing'
  | 'round-complete'
  | 'complete';

export interface BidRecord {
  seat: Seat;
  amount: number | 'pass';
}

export interface TrickPlay {
  seat: Seat;
  card: Card;
}

export interface CompletedTrick {
  plays: TrickPlay[];
  winnerSeat: Seat;
}

/** Server-authoritative record of who is really teamed with whom this round. */
export interface RoundTeams {
  aceHolder: Seat;
  twoHolder: Seat;
  /** The bidder's side. If aceHolder === twoHolder, this is just [thatSeat]. */
  bidderSide: Seat[];
  /** The other side (3 players if the bidder is solo, otherwise 2). */
  otherSide: Seat[];
}

export interface RoundState {
  roundNumber: number;
  dealerSeat: Seat;
  /** Full hands, seat -> cards. Server-only view; never sent to other players as-is. */
  hands: Partial<Record<Seat, Card[]>>;
  bids: BidRecord[];
  bidderSeat?: Seat;
  bidAmount?: number;
  trumpSuit?: Suit;
  /** Seat who leads the next trick. */
  leaderSeat?: Seat;
  /** True once teams are known server-side (immediately after dealing). */
  teams?: RoundTeams;
  /** Seat whose action (bid/choose trump/play) is currently awaited. Undefined once the round ends. */
  turnSeat?: Seat;
  currentTrick: TrickPlay[];
  completedTricks: CompletedTrick[];
  /** Seats that have declared "I'm out" (no trump left) for the rest of this round. */
  outSeats: Seat[];
  capturedPoints: Partial<Record<Seat, number>>;
}

export interface GameState {
  gameId: string;
  winThreshold: number;
  status: GameStatus;
  players: Partial<Record<Seat, GamePlayer>>;
  dealerSeat: Seat;
  round?: RoundState;
  createdAt: string;
  winnerSeats?: Seat[];
}

/** What a single player is allowed to see: their own hand, nobody else's. */
export interface PlayerView {
  game: Omit<GameState, 'round'> & {
    round?: Omit<RoundState, 'hands' | 'teams'> & { yourHand: Card[] };
  };
  yourSeat: Seat;
}

export interface PlayerStats {
  name: string;
  gamesPlayed: number;
  gamesWon: number;
  createdAt: string;
  updatedAt: string;
}
