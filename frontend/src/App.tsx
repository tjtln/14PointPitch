import { Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home';
import { Game } from './pages/Game';
import { Leaderboard } from './pages/Leaderboard';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/game/:gameId" element={<Game />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
    </Routes>
  );
}
