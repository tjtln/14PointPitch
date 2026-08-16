import type { Card } from '@pitch/shared';

const SUIT_SYMBOLS: Record<string, string> = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
const RED_SUITS = new Set(['hearts', 'diamonds']);

export function cardLabel(card: Card): string {
  if (card.kind === 'joker') return card.variant === 'big' ? 'Big Joker' : 'Little Joker';
  return `${card.rank}${SUIT_SYMBOLS[card.suit]}`;
}

interface Props {
  card: Card;
  disabled?: boolean;
  onClick?: () => void;
}

export function PlayingCard({ card, disabled, onClick }: Props) {
  const isRed = card.kind === 'standard' && RED_SUITS.has(card.suit);
  const clickable = Boolean(onClick) && !disabled;

  return (
    <button
      onClick={onClick}
      disabled={!clickable}
      title={cardLabel(card)}
      style={{
        width: 56,
        height: 80,
        borderRadius: 8,
        border: '1px solid #999',
        background: card.kind === 'joker' ? '#f5f0e6' : '#fff',
        color: card.kind === 'joker' ? '#555' : isRed ? '#c62828' : '#222',
        fontWeight: 600,
        fontSize: card.kind === 'joker' ? 11 : 16,
        whiteSpace: 'pre-line',
        cursor: clickable ? 'pointer' : 'default',
        opacity: disabled ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }}
    >
      {card.kind === 'joker' ? (card.variant === 'big' ? 'BIG\nJKR' : 'LTL\nJKR') : cardLabel(card)}
    </button>
  );
}
