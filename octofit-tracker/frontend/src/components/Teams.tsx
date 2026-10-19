import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type TeamResponse = { teams?: Array<{ name?: string; mascot?: string; members?: Array<string | { name?: string }> }> };

export default function Teams() {
  const [teams, setTeams] = useState<Array<{ name?: string; mascot?: string; members?: Array<string | { name?: string }> }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getJson<TeamResponse>('/api/teams')
      .then((data) => {
        if (!active) return;
        setTeams(data.teams ?? []);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load teams');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">Teams</h2><p>Manage teams and members.</p><p role="status">Loading teams...</p></div></section>;
  }

  if (error) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">Teams</h2><p>Manage teams and members.</p><p role="alert">Unavailable</p></div></section>;
  }

  if (teams.length === 0) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">Teams</h2><p>Manage teams and members.</p><p>No teams</p></div></section>;
  }

  return <section className="card h-100"><div className="card-body"><h2 className="h4">Teams</h2><p>Manage teams and members.</p><ul>{teams.map((team, index) => <li key={`${team.name ?? 'team'}-${index}`}>{team.name} ({team.members?.length ?? 0} members)</li>)}</ul></div></section>;
}
