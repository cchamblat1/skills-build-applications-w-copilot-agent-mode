import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type ActivityResponse = { activities?: Array<{ type?: string; minutes?: number; points?: number }> };

export default function Activities() {
  const [activities, setActivities] = useState<Array<{ type?: string; minutes?: number; points?: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getJson<ActivityResponse>('/api/activities')
      .then((data) => {
        if (!active) return;
        setActivities(data.activities ?? []);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load activities');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">Activities</h2><p>Track student activity minutes and points.</p><p role="status">Loading activities...</p></div></section>;
  }

  if (error) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">Activities</h2><p>Track student activity minutes and points.</p><p role="alert">Unable to load activities.</p></div></section>;
  }

  if (activities.length === 0) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">Activities</h2><p>Track student activity minutes and points.</p><p>No activities</p></div></section>;
  }

  return <section className="card h-100"><div className="card-body"><h2 className="h4">Activities</h2><p>Track student activity minutes and points.</p><ul>{activities.map((activity, index) => <li key={`${activity.type ?? 'activity'}-${index}`}>{activity.type} {activity.minutes ?? activity.points ?? ''} minutes</li>)}</ul></div></section>;
}
