import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getPlayerStats, listLeaderboard } from '../../shared/repositories/playersRepository.js';

function json(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

export const main = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const path = event.requestContext.http.path;

  if (path === '/leaderboard') {
    return json(200, await listLeaderboard());
  }

  if (event.pathParameters?.name) {
    const stats = await getPlayerStats(decodeURIComponent(event.pathParameters.name));
    if (!stats) return json(404, { message: 'Player not found' });
    return json(200, stats);
  }

  return json(404, { message: 'Not found' });
};
