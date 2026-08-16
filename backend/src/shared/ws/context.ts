import type { APIGatewayProxyWebsocketEventV2 } from 'aws-lambda';

export function managementEndpoint(event: APIGatewayProxyWebsocketEventV2): string {
  const { domainName, stage } = event.requestContext;
  return `https://${domainName}/${stage}`;
}
