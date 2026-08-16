import { and, asc, desc, eq, gt, gte, like, lt, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { ENV } from "./_core/env";
import {
  attendance, bookings, classes, members, payments, ptAssignments, ptPackages, ptSessions,
  rooms, subscriptions, trainers, users, type InsertUser,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  }
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined || user.openId === ENV.ownerOpenId) { values.role = user.role ?? "admin"; updateSet.role = values.role; }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return rows[0];
}

function requireDb() { return getDb().then(db => { if (!db) throw new Error("Database is not configured"); return db; }); }

export async function getDashboard() {
  const db = await requireDb();
  const today = new Date(); const dayStart = new Date(today); dayStart.setHours(0, 0, 0, 0);
  const soon = new Date(today); soon.setDate(soon.getDate() + 30);
  const [memberRows, activeRows, paymentRows, attendanceRows, expiringRows] = await Promise.all([
    db.select({ id: members.id }).from(members),
    db.select({ id: subscriptions.id }).from(subscriptions).where(and(eq(subscriptions.status, "active"), gte(subscriptions.endDate, today))),
    db.select({ paidAt: payments.paidAt, amount: payments.amount, method: payments.method }).from(payments).where(gte(payments.paidAt, new Date(today.getTime() - 29 * 86400000))),
    db.select({ checkedInAt: attendance.checkedInAt }).from(attendance).where(gte(attendance.checkedInAt, dayStart)),
    db.select({ id: subscriptions.id }).from(subscriptions).where(and(eq(subscriptions.status, "active"), gte(subscriptions.endDate, today), lte(subscriptions.endDate, soon))),
  ]);
  const daily = new Map<string, number>(); const methods = new Map<string, number>(); let revenueToday = 0;
  for (const row of paymentRows) { const key = row.paidAt.toISOString().slice(0, 10); const amount = Number(row.amount); daily.set(key, (daily.get(key) || 0) + amount); methods.set(row.method, (methods.get(row.method) || 0) + amount); if (row.paidAt >= dayStart) revenueToday += amount; }
  return { kpis: { totalMembers: memberRows.length, activeSubscriptions: activeRows.length, revenueToday, attendanceToday: attendanceRows.length, expiringSoon: expiringRows.length }, revenueTrend: Array.from(daily.entries()).sort().map(([date, revenue]) => ({ date, revenue })), paymentMix: Array.from(methods.entries()).map(([method, value]) => ({ method, value })) };
}

export async function listMembers(search?: string, status?: "active" | "inactive" | "blocked") {
  const db = await requireDb();
  const filters = [];
  if (search) filters.push(or(like(members.name, `%${search}%`), like(members.email, `%${search}%`), like(members.phone, `%${search}%`)));
  if (status) filters.push(eq(members.status, status));
  const rows = await db.select({ member: members, subscriptionStatus: sql<string | null>`(select status from subscriptions s where s.memberId = ${members.id} order by s.endDate desc limit 1)` }).from(members).where(filters.length ? and(...filters) : undefined).orderBy(desc(members.createdAt));
  return rows.map(row => ({ ...row.member, subscriptionStatus: row.subscriptionStatus }));
}
export async function createMember(input: typeof members.$inferInsert) { const db = await requireDb(); const result = await db.insert(members).values(input); return { id: Number(result[0].insertId), ...input }; }
export async function updateMember(id: number, input: Partial<typeof members.$inferInsert>) { const db = await requireDb(); await db.update(members).set(input).where(eq(members.id, id)); return db.select().from(members).where(eq(members.id, id)).limit(1); }
export async function deleteMember(id: number) { const db = await requireDb(); await db.update(members).set({ status: "inactive" }).where(eq(members.id, id)); return true; }

export async function listSubscriptions(status?: "active" | "frozen" | "expired" | "cancelled") {
  const db = await requireDb(); return db.select({ subscription: subscriptions, member: members }).from(subscriptions).innerJoin(members, eq(subscriptions.memberId, members.id)).where(status ? eq(subscriptions.status, status) : undefined).orderBy(desc(subscriptions.endDate));
}
export async function createSubscription(input: typeof subscriptions.$inferInsert) { const db = await requireDb(); const result = await db.insert(subscriptions).values(input); return { id: Number(result[0].insertId), ...input }; }
export async function updateSubscription(id: number, input: Partial<typeof subscriptions.$inferInsert>) { const db = await requireDb(); await db.update(subscriptions).set(input).where(eq(subscriptions.id, id)); return db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1); }
export async function renewSubscription(id: number, months = 1) { const db = await requireDb(); const current = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1); if (!current[0]) throw new Error("Subscription not found"); const base = current[0].endDate > new Date() ? current[0].endDate : new Date(); const endDate = new Date(base); endDate.setMonth(endDate.getMonth() + months); await db.update(subscriptions).set({ status: "active", endDate, freezeUntil: null }).where(eq(subscriptions.id, id)); return db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1); }

export async function getFinancialReport(from: Date, to: Date) {
  const db = await requireDb();
  const rows = await db.select({ paidAt: payments.paidAt, amount: payments.amount, method: payments.method, subscriptionId: payments.subscriptionId }).from(payments).where(and(gte(payments.paidAt, from), lte(payments.paidAt, to)));
  const plans = await db.select({ id: subscriptions.id, planName: subscriptions.planName }).from(subscriptions);
  const planMap = new Map(plans.map(row => [row.id, row.planName]));
  const daily = new Map<string, { revenue: number; count: number }>(); const weekly = new Map<string, number>(); const monthly = new Map<string, number>(); const methods = new Map<string, { revenue: number; count: number }>(); const byPlan = new Map<string, number>();
  for (const row of rows) { const amount = Number(row.amount); const date = row.paidAt; const day = date.toISOString().slice(0, 10); const month = day.slice(0, 7); const week = `${date.getUTCFullYear()}-W${String(Math.ceil((date.getUTCDate() + new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).getUTCDay()) / 7)).padStart(2, "0")}`; const d = daily.get(day) || { revenue: 0, count: 0 }; d.revenue += amount; d.count += 1; daily.set(day, d); weekly.set(week, (weekly.get(week) || 0) + amount); monthly.set(month, (monthly.get(month) || 0) + amount); const m = methods.get(row.method) || { revenue: 0, count: 0 }; m.revenue += amount; m.count += 1; methods.set(row.method, m); const plan = row.subscriptionId ? planMap.get(row.subscriptionId) : undefined; if (plan) byPlan.set(plan, (byPlan.get(plan) || 0) + amount); }
  return { daily: Array.from(daily.entries()).sort().map(([period, value]) => ({ period, ...value })), weekly: Array.from(weekly.entries()).sort().map(([period, revenue]) => ({ period, revenue })), monthly: Array.from(monthly.entries()).sort().map(([period, revenue]) => ({ period, revenue })), byMethod: Array.from(methods.entries()).map(([method, value]) => ({ method, ...value })), byPlan: Array.from(byPlan.entries()).map(([planName, revenue]) => ({ planName, revenue })) };
}

export async function getAttendance(from: Date, to: Date) {
  const db = await requireDb(); const rows = await db.select({ checkedInAt: attendance.checkedInAt }).from(attendance).where(and(gte(attendance.checkedInAt, from), lte(attendance.checkedInAt, to))); const counts = new Map<string, number>(); for (const row of rows) { const key = row.checkedInAt.toISOString().slice(0, 10); counts.set(key, (counts.get(key) || 0) + 1); } return Array.from(counts.entries()).sort().map(([date, count]) => ({ date, count }));
}
export async function checkIn(memberId: number, activityType: string) { const db = await requireDb(); const result = await db.insert(attendance).values({ memberId, activityType }); return Number(result[0].insertId); }
export async function checkOut(id: number) { const db = await requireDb(); await db.update(attendance).set({ checkedOutAt: new Date() }).where(eq(attendance.id, id)); return true; }

export async function listTrainers() { const db = await requireDb(); return db.select().from(trainers).orderBy(asc(trainers.name)); }
export async function createTrainer(input: typeof trainers.$inferInsert) { const db = await requireDb(); const result = await db.insert(trainers).values(input); return { id: Number(result[0].insertId), ...input }; }
export async function listRooms() { const db = await requireDb(); return db.select().from(rooms).where(eq(rooms.active, true)).orderBy(asc(rooms.name)); }
export async function createRoom(input: typeof rooms.$inferInsert) { const db = await requireDb(); const result = await db.insert(rooms).values(input); return { id: Number(result[0].insertId), ...input }; }
export async function listClasses(from?: Date, to?: Date) { const db = await requireDb(); const dateFilter = from && to ? and(gte(classes.startsAt, from), lte(classes.startsAt, to)) : undefined; return db.select({ classItem: classes, trainerName: trainers.name, roomName: rooms.name, bookedCount: sql<number>`count(${bookings.id})` }).from(classes).innerJoin(trainers, eq(classes.trainerId, trainers.id)).leftJoin(rooms, eq(classes.roomId, rooms.id)).leftJoin(bookings, and(eq(bookings.classId, classes.id), eq(bookings.status, "booked"))).where(dateFilter).groupBy(classes.id, trainers.name, rooms.name).orderBy(asc(classes.startsAt)); }

export function timeRangesOverlap(startA: Date, endA: Date, startB: Date, endB: Date) { return startA < endB && endA > startB; }

export function validateClassSchedule(input: { roomId?: number | null; capacity: number }, checks: { trainerConflict: boolean; room?: { capacity: number }; roomConflict: boolean }) {
  if (checks.trainerConflict) throw new Error("Trainer is already scheduled during this time");
  if (input.roomId) {
    if (!checks.room) throw new Error("Room not found");
    if (checks.room.capacity < input.capacity) throw new Error("Class capacity exceeds room capacity");
    if (checks.roomConflict) throw new Error("Room is already booked during this time");
  }
}

export async function createClass(input: typeof classes.$inferInsert) { const db = await requireDb(); const trainerConflict = await db.select({ id: classes.id }).from(classes).where(and(eq(classes.trainerId, input.trainerId), eq(classes.status, "scheduled"), lt(classes.startsAt, input.endsAt), gt(classes.endsAt, input.startsAt))).limit(1); let room: { capacity: number } | undefined; let roomConflict = false; if (input.roomId) { const roomRows = await db.select({ capacity: rooms.capacity }).from(rooms).where(and(eq(rooms.id, input.roomId), eq(rooms.active, true))).limit(1); room = roomRows[0]; roomConflict = Boolean((await db.select({ id: classes.id }).from(classes).where(and(eq(classes.roomId, input.roomId), eq(classes.status, "scheduled"), lt(classes.startsAt, input.endsAt), gt(classes.endsAt, input.startsAt))).limit(1))[0]); } validateClassSchedule(input, { trainerConflict: Boolean(trainerConflict[0]), room, roomConflict }); const result = await db.insert(classes).values(input); return { id: Number(result[0].insertId), ...input }; }
export async function bookClass(classId: number, memberId: number) { const db = await requireDb(); const capacity = await db.select({ capacity: classes.capacity, booked: sql<number>`(select count(*) from bookings where classId = ${classId} and status = 'booked')` }).from(classes).where(eq(classes.id, classId)).limit(1); if (!capacity[0]) throw new Error("Class not found"); if (Number(capacity[0].booked) >= capacity[0].capacity) throw new Error("Class is full"); const result = await db.insert(bookings).values({ classId, memberId }); return Number(result[0].insertId); }
export async function cancelBooking(id: number) { const db = await requireDb(); await db.update(bookings).set({ status: "cancelled" }).where(eq(bookings.id, id)); return true; }

export async function listPtPackages() { const db = await requireDb(); return db.select().from(ptPackages).where(eq(ptPackages.active, true)).orderBy(asc(ptPackages.price)); }
export async function createPtPackage(input: typeof ptPackages.$inferInsert) { const db = await requireDb(); const result = await db.insert(ptPackages).values(input); return { id: Number(result[0].insertId), ...input }; }
export async function listPtAssignments() { const db = await requireDb(); return db.select({ assignment: ptAssignments, memberName: members.name, trainerName: trainers.name, packageName: ptPackages.name, totalSessions: ptPackages.sessionsCount, completedSessions: sql<number>`(select count(*) from pt_sessions where assignmentId = ${ptAssignments.id} and status = 'completed')` }).from(ptAssignments).innerJoin(members, eq(ptAssignments.memberId, members.id)).innerJoin(trainers, eq(ptAssignments.trainerId, trainers.id)).innerJoin(ptPackages, eq(ptAssignments.packageId, ptPackages.id)).orderBy(desc(ptAssignments.startsAt)); }
export async function createPtAssignment(input: typeof ptAssignments.$inferInsert) { const db = await requireDb(); const result = await db.insert(ptAssignments).values(input); return { id: Number(result[0].insertId), ...input }; }
export async function createPtSession(input: typeof ptSessions.$inferInsert) { const db = await requireDb(); const result = await db.insert(ptSessions).values(input); return { id: Number(result[0].insertId), ...input }; }
export async function listPtSessions() { const db = await requireDb(); return db.select().from(ptSessions).orderBy(desc(ptSessions.scheduledAt)); }
export async function completePtSession(id: number) { const db = await requireDb(); await db.update(ptSessions).set({ status: "completed", completedAt: new Date() }).where(eq(ptSessions.id, id)); return true; }
