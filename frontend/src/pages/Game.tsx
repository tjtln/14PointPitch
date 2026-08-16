import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Box, Button, Chip, Container, Stack, TextField, Typography } from '@mui/material';
import { isTrumpCard, MINIMUM_BID, SEATS } from '@pitch/shared';
import type { Suit } from '@pitch/shared';
import { useGameSocket } from '../ws/useGameSocket';
import { PlayingCard } from '../components/PlayingCard';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

export function Game() {
  const { gameId = '' } = useParams();
  const [params] = useSearchParams();
  const name = params.get('name') ?? '';

  const { view, error, connected, bid, pass, chooseTrump, playCard, startNextRound } = useGameSocket(gameId, name);
  const [bidAmount, setBidAmount] = useState(MINIMUM_BID);

  if (!name) {
    return (
      <Container sx={{ py: 6 }}>
        <Typography>Missing your name — go back and join again.</Typography>
        <Link to="/">Back home</Link>
      </Container>
    );
  }

  if (!view) {
    return (
      <Container sx={{ py: 6 }}>
        <Typography variant="h5">Connecting to game {gameId}…</Typography>
        {error && <Typography color="error">{error}</Typography>}
      </Container>
    );
  }

  const { game, yourSeat } = view;
  const round = game.round;
  const isYourTurn = round?.turnSeat === yourSeat;

  const currentHighBid = round
    ? round.bids.reduce<number>((max, b) => (b.amount !== 'pass' && b.amount > max ? b.amount : max), 0)
    : 0;
  const minLegalBid = Math.max(MINIMUM_BID, currentHighBid + 1);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Game {game.gameId}</Typography>
        <Chip label={connected ? 'Connected' : 'Disconnected'} color={connected ? 'success' : 'default'} />
      </Stack>

      {error && (
        <Typography color="error" sx={{ my: 1 }}>
          {error}
        </Typography>
      )}

      <Box sx={{ my: 2 }}>
        <Typography variant="subtitle1">Scores (first to {game.winThreshold} wins)</Typography>
        <Stack direction="row" spacing={3}>
          {SEATS.map((seat) => {
            const p = game.players[seat];
            if (!p) return null;
            return (
              <Box key={seat} sx={{ opacity: p.connected ? 1 : 0.5 }}>
                <Typography fontWeight={seat === yourSeat ? 700 : 400}>
                  {p.name}
                  {seat === yourSeat ? ' (you)' : ''}
                  {!p.connected ? ' — disconnected' : ''}
                </Typography>
                <Typography variant="h6">{p.score}</Typography>
              </Box>
            );
          })}
        </Stack>
      </Box>

      {game.status === 'waiting-for-players' && (
        <Typography>
          Waiting for players ({Object.keys(game.players).length}/4)… share code <b>{game.gameId}</b>.
        </Typography>
      )}

      {game.status === 'complete' && (
        <Typography variant="h6">
          Game over! Winner: {(game.winnerSeats ?? []).map((s) => game.players[s]?.name).join(', ')}
        </Typography>
      )}

      {round && game.status === 'bidding' && (
        <Box sx={{ my: 2 }}>
          <Typography variant="subtitle1">Bidding (minimum {minLegalBid})</Typography>
          {isYourTurn ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                type="number"
                size="small"
                value={bidAmount}
                onChange={(e) => setBidAmount(Number(e.target.value))}
                sx={{ width: 100 }}
              />
              <Button variant="contained" onClick={() => bid(bidAmount)}>
                Bid
              </Button>
              <Button variant="outlined" onClick={pass}>
                Pass
              </Button>
            </Stack>
          ) : (
            <Typography color="text.secondary">
              Waiting on {round.turnSeat !== undefined ? game.players[round.turnSeat]?.name : '…'}…
            </Typography>
          )}
        </Box>
      )}

      {round && game.status === 'choosing-trump' && (
        <Box sx={{ my: 2 }}>
          {round.bidderSeat === yourSeat ? (
            <>
              <Typography variant="subtitle1">You won the bid at {round.bidAmount} — choose trump</Typography>
              <Stack direction="row" spacing={1}>
                {SUITS.map((suit) => (
                  <Button key={suit} variant="outlined" onClick={() => chooseTrump(suit)}>
                    {suit}
                  </Button>
                ))}
              </Stack>
            </>
          ) : (
            <Typography color="text.secondary">
              {round.bidderSeat !== undefined ? game.players[round.bidderSeat]?.name : '…'} won the bid at{' '}
              {round.bidAmount} and is choosing trump…
            </Typography>
          )}
        </Box>
      )}

      {round && game.status === 'playing' && (
        <Box sx={{ my: 2 }}>
          <Typography variant="subtitle1">
            Trump: {round.trumpSuit} — Bid: {round.bidAmount} by{' '}
            {round.bidderSeat !== undefined ? game.players[round.bidderSeat]?.name : '…'}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ my: 1 }}>
            {round.currentTrick.map((play, i) => (
              <Box key={i} sx={{ textAlign: 'center' }}>
                <PlayingCard card={play.card} />
                <Typography variant="caption">{game.players[play.seat]?.name}</Typography>
              </Box>
            ))}
          </Stack>
          {round.outSeats.includes(yourSeat) && (
            <Typography color="text.secondary">You're out of trump for this round.</Typography>
          )}
          {isYourTurn && <Typography color="primary">Your turn — play a trump card.</Typography>}
          {!isYourTurn && round.turnSeat !== undefined && (
            <Typography color="text.secondary">Waiting on {game.players[round.turnSeat]?.name}…</Typography>
          )}
        </Box>
      )}

      {round && game.status === 'round-complete' && (
        <Box sx={{ my: 2 }}>
          <Typography variant="subtitle1">Round {round.roundNumber} complete.</Typography>
          <Button variant="contained" onClick={startNextRound}>
            Start next round
          </Button>
        </Box>
      )}

      {round && round.yourHand.length > 0 && game.status !== 'waiting-for-players' && (
        <Box sx={{ my: 2 }}>
          <Typography variant="subtitle1">Your hand</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {round.yourHand.map((card) => {
              const playable = Boolean(
                isYourTurn && game.status === 'playing' && round.trumpSuit && isTrumpCard(card, round.trumpSuit)
              );
              return (
                <PlayingCard
                  key={card.id}
                  card={card}
                  disabled={!playable}
                  onClick={playable ? () => playCard(card.id) : undefined}
                />
              );
            })}
          </Stack>
        </Box>
      )}

      <Box sx={{ mt: 4 }}>
        <Link to="/">Back home</Link>
      </Box>
    </Container>
  );
}
