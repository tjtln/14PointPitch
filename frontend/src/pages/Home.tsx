import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Button, Container, Divider, Stack, TextField, Typography } from '@mui/material';
import { createGame } from '../api/http';

const NAME_KEY = 'pitch:name';

export function Home() {
  const navigate = useNavigate();
  const [name, setName] = useState(localStorage.getItem(NAME_KEY) ?? '');
  const [joinCode, setJoinCode] = useState('');
  const [winThreshold, setWinThreshold] = useState(52);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function rememberName(trimmed: string) {
    localStorage.setItem(NAME_KEY, trimmed);
  }

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter your name first');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const game = await createGame(winThreshold);
      rememberName(trimmed);
      navigate(`/game/${game.gameId}?name=${encodeURIComponent(trimmed)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
    } finally {
      setCreating(false);
    }
  }

  function handleJoin() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter your name first');
      return;
    }
    if (!joinCode.trim()) {
      setError('Enter a game code');
      return;
    }
    rememberName(trimmed);
    navigate(`/game/${joinCode.trim().toUpperCase()}?name=${encodeURIComponent(trimmed)}`);
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Typography variant="h3" gutterBottom>
        14 Point Pitch
      </Typography>

      <Stack spacing={2}>
        <TextField label="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        {error && <Typography color="error">{error}</Typography>}

        <Divider />
        <Typography variant="h6">Join a game</Typography>
        <TextField
          label="Game code"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
        />
        <Button variant="contained" onClick={handleJoin}>
          Join
        </Button>

        <Divider />
        <Typography variant="h6">Start a new game</Typography>
        <TextField
          label="Win threshold"
          type="number"
          value={winThreshold}
          onChange={(e) => setWinThreshold(Number(e.target.value))}
        />
        <Button variant="outlined" onClick={handleCreate} disabled={creating}>
          {creating ? 'Creating…' : 'Create game'}
        </Button>

        <Divider />
        <Box>
          <Link to="/leaderboard">View leaderboard</Link>
        </Box>
      </Stack>
    </Container>
  );
}
