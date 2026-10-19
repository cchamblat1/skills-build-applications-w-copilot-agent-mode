# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Use a thin React presentation layer that consumes the shared API client and renders loading, empty, success, and accessible error states for each capability.
- Logic tier decision: Keep validation and business rules in Express service functions under `octofit-tracker/backend/src/services`, with routes acting as lightweight adapters for `/api/*` requests.
- Data tier decision: Keep persistence concerns in Mongoose schemas and the seed script, using required validation and idempotent upserts for demo data.
- Activity tracking approach: Validate `userId` and `teamId` as real ObjectIds, require positive minutes, create records with computed `points` and `occurredAt`, and reject invalid input with deliberate 4xx responses.
- Team management approach: Require `name` and `mascot`, keep `members` as an array of valid user IDs, and return team member IDs in a serializable form when listing teams.
- Leaderboard approach: Aggregate activity totals by team, sort from highest to lowest, and assign 1-based ranks while preserving the team name in the result payload.
- Workout suggestions approach: Match the requested user by email, infer focus from recent activities or the user’s goal, and return the best workout recommendations with a reasoning sentence.

## Test plan

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — verifies required Mongoose validation and deterministic, idempotent seed data.
- API command: `npm run test:api --prefix octofit-tracker/backend` — verifies the service contract for activity creation, team creation, leaderboard ordering, and workout recommendations with proper 4xx failures.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — verifies that each capability renders data, loading states, empty states, and accessible error alerts.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — checks TypeScript compilation for the Express app.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — checks TypeScript and the Vite production bundle for the React app.
