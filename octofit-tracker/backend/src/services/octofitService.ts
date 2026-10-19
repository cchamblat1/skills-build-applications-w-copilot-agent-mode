import { isValidObjectId, Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function requireObjectId(value: unknown, label: string) {
  if (typeof value !== 'string' || !isValidObjectId(value)) {
    throw new HttpError(400, `${label} must be a valid MongoDB ObjectId`);
  }
  return new Types.ObjectId(value);
}

function requireText(value: unknown, label: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpError(400, `${label} is required`);
  }
  return value.trim();
}

function toObjectIdList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((member) => {
    if (typeof member !== 'string' || !isValidObjectId(member)) {
      throw new HttpError(400, 'Team members must contain valid user IDs');
    }
    return new Types.ObjectId(member);
  });
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  const payload = (input ?? {}) as Record<string, unknown>;
  const userId = requireObjectId(payload.userId, 'userId');
  const teamId = requireObjectId(payload.teamId, 'teamId');
  const type = requireText(payload.type, 'type');
  const minutes = Number(payload.minutes);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw new HttpError(400, 'minutes must be a positive number');
  }

  const [user, team] = await Promise.all([
    User.findById(userId),
    Team.findById(teamId),
  ]);

  if (!user) throw new HttpError(404, 'User not found');
  if (!team) throw new HttpError(404, 'Team not found');

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  const teams = await Team.find().lean();
  return teams.map((team) => ({
    ...team,
    members: (team.members ?? []).map((member) => member.toString()),
  }));
}

export async function createTeam(input: unknown) {
  const payload = (input ?? {}) as Record<string, unknown>;
  const name = requireText(payload.name, 'name');
  const mascot = requireText(payload.mascot, 'mascot');
  const members = toObjectIdList(payload.members);

  const team = await Team.create({ name, mascot, members });
  return team.toObject();
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);

  if (totals.length === 0) return [];

  const teamIds = totals.map(({ _id }) => _id);
  const teams = await Team.find({ _id: { $in: teamIds } }).lean();
  const teamNames = new Map(teams.map((team) => [team._id.toString(), team.name]));

  return totals.map((entry, index) => ({
    teamName: teamNames.get(entry._id.toString()) ?? 'Unknown team',
    totalPoints: Number(entry.totalPoints) || 0,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const email = requireText(userEmail, 'userEmail');
  const user = await User.findOne({ email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).lean();

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const recentType = recentActivities[0]?.type ?? user.fitnessGoal;
  const focusSet = [user.fitnessGoal, recentType].filter(Boolean) as string[];

  const matches = await Workout.find({ focus: { $in: focusSet } }).sort({ minutes: 1 }).lean();
  const fallback = matches.length > 0 ? matches : await Workout.find().sort({ minutes: 1 }).lean();

  return fallback.slice(0, 3).map((workout) => ({
    ...workout,
    reason: `Recent ${recentType ?? 'activity'} patterns align with ${workout.focus} training.`,
  }));
}

export { User };
