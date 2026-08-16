import type { GameState, PlayerView, Seat } from '@pitch/shared';

/** Redacts a GameState down to what one specific seat is allowed to see — never anyone else's hand. */
export function buildPlayerView(game: GameState, seat: Seat): PlayerView {
  const { round, ...rest } = game;

  if (!round) {
    return { yourSeat: seat, game: { ...rest, round: undefined } };
  }

  const { hands, teams, ...publicRound } = round;

  return {
    yourSeat: seat,
    game: {
      ...rest,
      round: {
        ...publicRound,
        yourHand: hands[seat] ?? [],
      },
    },
  };
}
