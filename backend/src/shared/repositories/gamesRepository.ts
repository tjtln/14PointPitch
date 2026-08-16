import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { GameState } from '@pitch/shared';
import { ddb } from '../database/client.js';
import { NotFoundError } from '../errors/errors.js';

const TABLE = process.env.GAMES_TABLE!;

export type StoredGameState = GameState & { version: number };

export async function getGame(gameId: string): Promise<StoredGameState | undefined> {
  const res = await ddb.send(new GetCommand({ TableName: TABLE, Key: { gameId } }));
  return res.Item as StoredGameState | undefined;
}

export async function createGameRecord(game: GameState): Promise<StoredGameState> {
  const stored: StoredGameState = { ...game, version: 0 };
  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: stored,
      ConditionExpression: 'attribute_not_exists(gameId)',
    })
  );
  return stored;
}

/**
 * Read-modify-write with optimistic locking on `version`, retrying on
 * concurrent-write conflicts. All gameplay mutations go through this so two
 * players acting at nearly the same instant can never silently clobber
 * each other's move.
 */
export async function updateGame(
  gameId: string,
  mutate: (game: GameState) => GameState | Promise<GameState>
): Promise<{ previous: StoredGameState; updated: StoredGameState }> {
  const MAX_ATTEMPTS = 5;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const existing = await getGame(gameId);
    if (!existing) throw new NotFoundError(`Game ${gameId} not found`);

    const { version: expectedVersion, ...gameOnly } = existing;
    const mutated = await mutate(structuredClone(gameOnly));
    const updated: StoredGameState = { ...mutated, version: expectedVersion + 1 };

    try {
      await ddb.send(
        new PutCommand({
          TableName: TABLE,
          Item: updated,
          ConditionExpression: 'version = :v',
          ExpressionAttributeValues: { ':v': expectedVersion },
        })
      );
      return { previous: existing, updated };
    } catch (err) {
      const isConflict = err instanceof Error && err.name === 'ConditionalCheckFailedException';
      if (isConflict && attempt < MAX_ATTEMPTS - 1) continue;
      throw err;
    }
  }

  throw new Error('Failed to update game after retries');
}
