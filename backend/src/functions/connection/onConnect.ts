import type { APIGatewayProxyResultV2, APIGatewayProxyWebsocketEventV2 } from 'aws-lambda';
import type { Seat } from '@pitch/shared';
import { updateGame } from '../../shared/repositories/gamesRepository.js';
import { putConnection } from '../../shared/repositories/connectionsRepository.js';
import { ensurePlayer } from '../../shared/repositories/playersRepository.js';
import { joinOrReconnect, maybeStartRound } from '../../shared/game/engine.js';
import { broadcastGameState } from '../../shared/ws/broadcast.js';
import { managementEndpoint } from '../../shared/ws/context.js';
import { GameError, NotFoundError } from '../../shared/errors/errors.js';

/**
 * $connect. Join code + name arrive as query string params on the WS URL
 * (e.g. wss://.../?gameId=ABCDE&name=Alice) — there's no separate HTTP join
 * call. A name matching an existing, currently-disconnected seat reconnects
 * that player; otherwise it claims the next open seat.
 */
export const main = async (event: APIGatewayProxyWebsocketEventV2): Promise<APIGatewayProxyResultV2> => {
  const connectionId = event.requestContext.connectionId;
  const gameId = event.queryStringParameters?.gameId?.trim().toUpperCase();
  const name = event.queryStringParameters?.name?.trim();

  if (!gameId || !name) {
    return { statusCode: 400, body: 'gameId and name query string parameters are required' };
  }

  let seat: Seat | undefined;

  try {
    const { updated } = await updateGame(gameId, (game) => {
      const result = joinOrReconnect(game, name);
      seat = result.seat;
      return maybeStartRound(result.game);
    });

    await putConnection({ connectionId, gameId, seat: seat!, connectedAt: new Date().toISOString() });
    await ensurePlayer(name);
    await broadcastGameState(managementEndpoint(event), updated);
  } catch (err) {
    if (err instanceof GameError || err instanceof NotFoundError) {
      return { statusCode: 400, body: err.message };
    }
    throw err;
  }

  return { statusCode: 200, body: 'connected' };
};
