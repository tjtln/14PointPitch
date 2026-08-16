import type { APIGatewayProxyResultV2, APIGatewayProxyWebsocketEventV2 } from 'aws-lambda';
import { deleteConnection, getConnection } from '../../shared/repositories/connectionsRepository.js';
import { updateGame } from '../../shared/repositories/gamesRepository.js';
import { markDisconnected } from '../../shared/game/engine.js';
import { broadcastGameState } from '../../shared/ws/broadcast.js';
import { managementEndpoint } from '../../shared/ws/context.js';

/** $disconnect. The player's seat is kept (so they can reconnect by name) — just marked disconnected. */
export const main = async (event: APIGatewayProxyWebsocketEventV2): Promise<APIGatewayProxyResultV2> => {
  const connectionId = event.requestContext.connectionId;
  const connection = await getConnection(connectionId);
  await deleteConnection(connectionId);

  if (connection) {
    const { updated } = await updateGame(connection.gameId, (game) => markDisconnected(game, connection.seat));
    await broadcastGameState(managementEndpoint(event), updated);
  }

  return { statusCode: 200, body: 'disconnected' };
};
