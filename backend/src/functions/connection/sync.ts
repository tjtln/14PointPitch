import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import type { APIGatewayProxyResultV2, APIGatewayProxyWebsocketEventV2 } from 'aws-lambda';
import { getConnection } from '../../shared/repositories/connectionsRepository.js';
import { getGame } from '../../shared/repositories/gamesRepository.js';
import { buildPlayerView } from '../../shared/game/view.js';
import { managementEndpoint } from '../../shared/ws/context.js';

/**
 * "sync" route — the client sends this right after the socket opens.
 *
 * $connect can't reliably push state back to the connection that's still
 * connecting: API Gateway doesn't consider it fully registered with the
 * Management API until the $connect Lambda returns, so a PostToConnection
 * call targeting the connecting client's own connectionId from inside
 * $connect races and throws GoneException. This route runs as a separate,
 * later invocation — by then the connection is fully active — so it's the
 * reliable way for a freshly-connected client to get its first state.
 */
export const main = async (event: APIGatewayProxyWebsocketEventV2): Promise<APIGatewayProxyResultV2> => {
  const connectionId = event.requestContext.connectionId;

  const connection = await getConnection(connectionId);
  if (!connection) {
    return { statusCode: 400, body: 'Unknown connection — reconnect and try again' };
  }

  const game = await getGame(connection.gameId);
  if (!game) {
    return { statusCode: 404, body: 'Game not found' };
  }

  const api = new ApiGatewayManagementApiClient({ endpoint: managementEndpoint(event) });
  const payload = JSON.stringify({ type: 'state', ...buildPlayerView(game, connection.seat) });
  await api.send(new PostToConnectionCommand({ ConnectionId: connectionId, Data: Buffer.from(payload) }));

  return { statusCode: 200, body: 'ok' };
};
