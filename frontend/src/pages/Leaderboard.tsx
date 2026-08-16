import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { getLeaderboard, type PlayerStats } from '../api/http';

export function Leaderboard() {
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLeaderboard()
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load leaderboard'));
  }, []);

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Leaderboard
      </Typography>
      {error && <Typography color="error">{error}</Typography>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="right">Games</TableCell>
              <TableCell align="right">Wins</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stats.map((s) => (
              <TableRow key={s.name}>
                <TableCell>{s.name}</TableCell>
                <TableCell align="right">{s.gamesPlayed}</TableCell>
                <TableCell align="right">{s.gamesWon}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography sx={{ mt: 2 }}>
        <Link to="/">Back home</Link>
      </Typography>
    </Container>
  );
}
