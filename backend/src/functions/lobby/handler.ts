import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { SEATS } from '@pitch/shared';
import { createGame } from '../../shared/game/engine.js';
import { createGameRecord, getGame } from '../../shared/repositories/gamesRepository.js';
import { GameError } from '../../shared/errors/errors.js';

function json(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

export const main = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const method = event.requestContext.http.method;
  const path = event.requestContext.http.path;

  try {
    if (method === 'POST' && path === '/games') {
      const body = event.body ? JSON.parse(event.body) : {};
      const game = createGame(Number(body.winThreshold));
      const stored = await createGameRecord(game);
      return json(201, { gameId: stored.gameId, winThreshold: stored.winThreshold });
    }

    if (method === 'GET' && event.pathParameters?.gameId) {
      const game = await getGame(event.pathParameters.gameId.toUpperCase());
      if (!game) return json(404, { message: 'Game not found' });

      return json(200, {
        gameId: game.gameId,
        status: game.status,
        winThreshold: game.winThreshold,
        seats: SEATS.map((seat) => {
          const player = game.players[seat];
          return player ? { seat, name: player.name, connected: player.connected, score: player.score } : null;
        }),
      });
    }

    return json(404, { message: 'Not found' });
  } catch (err) {
    if (err instanceof GameError) return json(400, { message: err.message });
    throw err;
  }
};
