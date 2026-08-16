/** A rule violation caused by the client (illegal move, wrong turn, bad input). Safe to show to the user. */
export class GameError extends Error {}

export class NotFoundError extends Error {}
