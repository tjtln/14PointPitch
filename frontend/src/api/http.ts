const BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const body = await res.json().catch(() => undefined);
  if (!res.ok) {
    throw new Error(body?.message ?? `Request failed (${res.status})`);
  }
  return body as T;
}

export interface CreatedGame {
  gameId: string;
  winThreshold: number;
}

export function createGame(winThreshold: number): Promise<CreatedGame> {
  return request('/games', { method: 'POST', body: JSON.stringify({ winThreshold }) });
}

export interface SeatSummary {
  seat: number;
  name: string;
  connected: boolean;
  score: number;
}

export interface GameSummary {
  gameId: string;
  status: string;
  winThreshold: number;
  seats: (SeatSummary | null)[];
}

export function getGame(gameId: string): Promise<GameSummary> {
  return request(`/games/${encodeURIComponent(gameId)}`);
}

export interface PlayerStats {
  name: string;
  gamesPlayed: number;
  gamesWon: number;
}

export function getLeaderboard(): Promise<PlayerStats[]> {
  return request('/leaderboard');
}

export function getPlayerStats(name: string): Promise<PlayerStats> {
  return request(`/players/${encodeURIComponent(name)}`);
}
