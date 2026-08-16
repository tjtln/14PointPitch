import { GetCommand, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { PlayerStats } from '@pitch/shared';
import { ddb } from '../database/client.js';

const TABLE = process.env.PLAYERS_TABLE!;

/** Creates the player's stats row on their first-ever join, if it doesn't already exist. */
export async function ensurePlayer(name: string): Promise<void> {
  const now = new Date().toISOString();
  try {
    await ddb.send(
      new PutCommand({
        TableName: TABLE,
        Item: { name, gamesPlayed: 0, gamesWon: 0, createdAt: now, updatedAt: now },
        ConditionExpression: 'attribute_not_exists(#n)',
        ExpressionAttributeNames: { '#n': 'name' },
      })
    );
  } catch (err) {
    const alreadyExists = err instanceof Error && err.name === 'ConditionalCheckFailedException';
    if (!alreadyExists) throw err;
  }
}

export async function recordGameCompletion(playerNames: string[], winnerNames: string[]): Promise<void> {
  const now = new Date().toISOString();
  await Promise.all(
    playerNames.map((name) =>
      ddb.send(
        new UpdateCommand({
          TableName: TABLE,
          Key: { name },
          UpdateExpression: 'ADD gamesPlayed :one, gamesWon :won SET updatedAt = :now',
          ExpressionAttributeValues: {
            ':one': 1,
            ':won': winnerNames.includes(name) ? 1 : 0,
            ':now': now,
          },
        })
      )
    )
  );
}

export async function getPlayerStats(name: string): Promise<PlayerStats | undefined> {
  const res = await ddb.send(new GetCommand({ TableName: TABLE, Key: { name } }));
  return res.Item as PlayerStats | undefined;
}

export async function listLeaderboard(): Promise<PlayerStats[]> {
  const res = await ddb.send(new ScanCommand({ TableName: TABLE }));
  return ((res.Items ?? []) as PlayerStats[]).sort((a, b) => b.gamesWon - a.gamesWon);
}
