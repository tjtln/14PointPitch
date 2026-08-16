import type { APIGatewayProxyResultV2, APIGatewayProxyWebsocketEventV2 } from 'aws-lambda';
import type { GameState, Seat } from '@pitch/shared';
import { SEATS } from '@pitch/shared';
import { getConnection } from '../repositories/connectionsRepository.js';
import { updateGame } from '../repositories/gamesRepository.js';
import { recordGameCompletion } from '../repositories/playersRepository.js';
import { broadcastGameState, sendError } from './broadcast.js';
import { managementEndpoint } from './context.js';
import { GameError, NotFoundError } from '../errors/errors.js';

/**
 * Wraps a single game-action mutation (bid, chooseTrump, playCard,
 * startNextRound) with the plumbing every WebSocket action route needs:
 * resolve the caller's seat from their connection, parse the message body,
 * apply the mutation with optimistic locking, broadcast the new state to
 * everyone in the game, and record stats if the game just finished.
 */
export function gameplayHandler(mutate: (game: GameState, seat: Seat, body: any) => GameState) {
  return async (event: APIGatewayProxyWebsocketEventV2): Promise<APIGatewayProxyResultV2> => {
    const connectionId = event.requestContext.connectionId;
    const endpoint = managementEndpoint(event);

    const connection = await getConnection(connectionId);
    if (!connection) {
      return { statusCode: 400, body: 'Unknown connection — reconnect and try again' };
    }

    let body: any = {};
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch {
      await sendError(endpoint, connectionId, 'Malformed message body');
      return { statusCode: 200, body: 'ok' };
    }

    try {
      const { previous, updated } = await updateGame(connection.gameId, (game) =>
        mutate(game, connection.seat, body)
      );

      await broadcastGameState(endpoint, updated);

      if (updated.status === 'complete' && previous.status !== 'complete') {
        const playerNames = SEATS.map((s) => updated.players[s]?.name).filter((n): n is string => !!n);
        const winnerNames = (updated.winnerSeats ?? [])
          .map((s) => updated.players[s]?.name)
          .filter((n): n is string => !!n);
        await recordGameCompletion(playerNames, winnerNames);
      }
    } catch (err) {
      if (err instanceof GameError || err instanceof NotFoundError) {
        await sendError(endpoint, connectionId, err.message);
      } else {
        throw err;
      }
    }

    return { statusCode: 200, body: 'ok' };
  };
}
