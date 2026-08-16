import { useCallback, useEffect, useRef, useState } from 'react';
import type { PlayerView, Suit } from '@pitch/shared';

const WS_BASE_URL = import.meta.env.VITE_WS_URL;

type IncomingMessage = ({ type: 'state' } & PlayerView) | { type: 'error'; message: string };

export interface GameSocket {
  view: PlayerView | null;
  error: string | null;
  connected: boolean;
  bid: (amount: number) => void;
  pass: () => void;
  chooseTrump: (suit: Suit) => void;
  playCard: (cardId: string) => void;
  startNextRound: () => void;
}

/** Owns the WebSocket connection for one game. Reconnecting with the same name re-seats the player. */
export function useGameSocket(gameId: string, name: string): GameSocket {
  const [view, setView] = useState<PlayerView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!gameId || !name) return;

    const url = `${WS_BASE_URL}?gameId=${encodeURIComponent(gameId)}&name=${encodeURIComponent(name)}`;
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
      // $connect can't reliably push state back to the connection that's
      // still connecting (API Gateway hasn't fully registered it yet), so
      // this is how we get our first state — see backend's sync route.
      socket.send(JSON.stringify({ action: 'sync' }));
    };
    socket.onclose = () => setConnected(false);
    socket.onerror = () => setError('Connection error — check the game code and try again');

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data) as IncomingMessage;
      if (msg.type === 'state') {
        setView(msg);
        setError(null);
      } else {
        setError(msg.message);
      }
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [gameId, name]);

  const send = useCallback((action: string, payload: Record<string, unknown> = {}) => {
    socketRef.current?.send(JSON.stringify({ action, ...payload }));
  }, []);

  return {
    view,
    error,
    connected,
    bid: (amount) => send('bid', { amount }),
    pass: () => send('bid', { pass: true }),
    chooseTrump: (suit) => send('chooseTrump', { suit }),
    playCard: (cardId) => send('playCard', { cardId }),
    startNextRound: () => send('startNextRound'),
  };
}
