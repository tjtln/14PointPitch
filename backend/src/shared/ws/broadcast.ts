import {
  ApiGatewayManagementApiClient,
  GoneException,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi';
import type { GameState } from '@pitch/shared';
import { deleteConnection, listConnectionsForGame } from '../repositories/connectionsRepository.js';
import { buildPlayerView } from '../game/view.js';

function client(endpoint: string): ApiGatewayManagementApiClient {
  return new ApiGatewayManagementApiClient({ endpoint });
}

/** Sends every connected player their own redacted view of the current game state. */
export async function broadcastGameState(endpoint: string, game: GameState): Promise<void> {
  const connections = await listConnectionsForGame(game.gameId);
  console.log(
    `broadcastGameState: endpoint=${endpoint} game=${game.gameId} connections=${connections.length}`,
    connections.map((c) => ({ connectionId: c.connectionId, seat: c.seat }))
  );
  const api = client(endpoint);

  await Promise.all(
    connections.map(async (conn) => {
      const payload = JSON.stringify({ type: 'state', ...buildPlayerView(game, conn.seat) });
      try {
        await api.send(
          new PostToConnectionCommand({ ConnectionId: conn.connectionId, Data: Buffer.from(payload) })
        );
        console.log(`broadcastGameState: sent to ${conn.connectionId} (seat ${conn.seat}, ${payload.length} bytes)`);
      } catch (err) {
        if (err instanceof GoneException) {
          console.log(`broadcastGameState: ${conn.connectionId} is gone, removing`);
          await deleteConnection(conn.connectionId);
        } else {
          console.error(`broadcastGameState: failed to post to ${conn.connectionId}`, err);
          throw err;
        }
      }
    })
  );
}

export async function sendError(endpoint: string, connectionId: string, message: string): Promise<void> {
  const api = client(endpoint);
  try {
    await api.send(
      new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: Buffer.from(JSON.stringify({ type: 'error', message })),
      })
    );
  } catch (err) {
    if (!(err instanceof GoneException)) throw err;
  }
}
