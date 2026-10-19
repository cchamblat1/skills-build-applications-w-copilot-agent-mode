import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardResponse = { leaderboard?: Array<{ teamName?: string; totalPoints?: number; rank?: number }> };

export default function Leaderboard() {
  const [rows, setRows] = useState<Array<{ teamName?: string; totalPoints?: number; rank?: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getJson<LeaderboardResponse>('/api/leaderboard')
      .then((data) => {
        if (!active) return;
        setRows(data.leaderboard ?? []);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load leaderboard');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">Leaderboard</h2><p>Compare team point totals.</p><p role="status">Loading leaderboard...</p></div></section>;
  }

  if (error) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">Leaderboard</h2><p>Compare team point totals.</p><p role="alert">Unable to load leaderboard.</p></div></section>;
  }

  if (rows.length === 0) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">Leaderboard</h2><p>Compare team point totals.</p><p>No leaderboard</p></div></section>;
  }

  return <section className="card h-100"><div className="card-body"><h2 className="h4">Leaderboard</h2><p>Compare team point totals.</p><ol>{rows.map((row, index) => <li key={`${row.teamName ?? 'team'}-${index}`}>{row.teamName} {row.totalPoints}</li>)}</ol></div></section>;
}
