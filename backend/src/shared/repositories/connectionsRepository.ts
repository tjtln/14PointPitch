import { DeleteCommand, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { Seat } from '@pitch/shared';
import { ddb } from '../database/client.js';

const TABLE = process.env.CONNECTIONS_TABLE!;

export interface ConnectionRecord {
  connectionId: string;
  gameId: string;
  seat: Seat;
  connectedAt: string;
}

export async function putConnection(record: ConnectionRecord): Promise<void> {
  await ddb.send(new PutCommand({ TableName: TABLE, Item: record }));
}

export async function getConnection(connectionId: string): Promise<ConnectionRecord | undefined> {
  const res = await ddb.send(new GetCommand({ TableName: TABLE, Key: { connectionId } }));
  return res.Item as ConnectionRecord | undefined;
}

export async function deleteConnection(connectionId: string): Promise<void> {
  await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { connectionId } }));
}

export async function listConnectionsForGame(gameId: string): Promise<ConnectionRecord[]> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: 'GameIndex',
      KeyConditionExpression: 'gameId = :g',
      ExpressionAttributeValues: { ':g': gameId },
    })
  );
  return (res.Items ?? []) as ConnectionRecord[];
}
