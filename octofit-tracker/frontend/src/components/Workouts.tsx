import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type WorkoutResponse = { suggestions?: Array<{ title?: string; reason?: string; focus?: string }> };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Array<{ title?: string; reason?: string; focus?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getJson<WorkoutResponse>('/api/workouts/suggestions/mona@example.com')
      .then((data) => {
        if (!active) return;
        setSuggestions(data.suggestions ?? []);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load workout suggestions');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">Workout suggestions</h2><p>Recommend workouts from activity patterns.</p><p role="status">Loading workouts...</p></div></section>;
  }

  if (error) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">Workout suggestions</h2><p>Recommend workouts from activity patterns.</p><p role="alert">Unavailable</p></div></section>;
  }

  if (suggestions.length === 0) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">Workout suggestions</h2><p>Recommend workouts from activity patterns.</p><p>No workout suggestions</p></div></section>;
  }

  return <section className="card h-100"><div className="card-body"><h2 className="h4">Workout suggestions</h2><p>Recommend workouts from activity patterns.</p><ul>{suggestions.map((suggestion, index) => <li key={`${suggestion.title ?? 'workout'}-${index}`}>{suggestion.title} {suggestion.reason}</li>)}</ul></div></section>;
}
