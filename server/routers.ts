import * as XLSX from "xlsx";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

const dateRange = z.object({ from: z.coerce.date(), to: z.coerce.date() });
const memberInput = z.object({ name: z.string().min(2), email: z.string().email().optional().or(z.literal("")), phone: z.string().optional(), status: z.enum(["active", "inactive", "blocked"]).default("active"), notes: z.string().optional() });
const subscriptionInput = z.object({ memberId: z.number().int().positive(), planName: z.string().min(2), startDate: z.coerce.date(), endDate: z.coerce.date(), monthlyPrice: z.coerce.number().nonnegative(), status: z.enum(["active", "frozen", "expired", "cancelled"]).default("active"), freezeUntil: z.coerce.date().optional() });

function exportXlsx(rows: unknown[], sheetName: string, fileName: string) {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  return { fileName, contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", base64: XLSX.write(workbook, { bookType: "xlsx", type: "base64" }) };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  dashboard: protectedProcedure.query(() => db.getDashboard()),
  members: router({
    list: protectedProcedure.input(z.object({ search: z.string().optional(), status: z.enum(["active", "inactive", "blocked"]).optional() }).optional()).query(({ input }) => db.listMembers(input?.search, input?.status)),
    create: protectedProcedure.input(memberInput).mutation(({ input }) => db.createMember({ ...input, email: input.email || null })),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), data: memberInput.partial() })).mutation(({ input }) => db.updateMember(input.id, { ...input.data, email: input.data.email || null })),
    remove: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => db.deleteMember(input.id)),
    export: protectedProcedure.input(z.object({ search: z.string().optional(), status: z.enum(["active", "inactive", "blocked"]).optional() }).optional()).query(async ({ input }) => { const rows = await db.listMembers(input?.search, input?.status); return exportXlsx(rows, "Members", `members-${new Date().toISOString().slice(0, 10)}.xlsx`); }),
  }),
  subscriptions: router({
    list: protectedProcedure.input(z.object({ status: z.enum(["active", "frozen", "expired", "cancelled"]).optional() }).optional()).query(({ input }) => db.listSubscriptions(input?.status)),
    create: protectedProcedure.input(subscriptionInput).mutation(({ input }) => db.createSubscription({ ...input, monthlyPrice: input.monthlyPrice.toFixed(2) })),
    update: adminProcedure.input(z.object({ id: z.number().int().positive(), data: subscriptionInput.partial() })).mutation(({ input }) => db.updateSubscription(input.id, { ...input.data, monthlyPrice: input.data.monthlyPrice === undefined ? undefined : input.data.monthlyPrice.toFixed(2) })),
    freeze: adminProcedure.input(z.object({ id: z.number().int().positive(), freezeUntil: z.coerce.date() })).mutation(({ input }) => db.updateSubscription(input.id, { status: "frozen", freezeUntil: input.freezeUntil })),
    unfreeze: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => db.updateSubscription(input.id, { status: "active", freezeUntil: null })),
    renew: adminProcedure.input(z.object({ id: z.number().int().positive(), months: z.number().int().min(1).max(24).default(1) })).mutation(({ input }) => db.renewSubscription(input.id, input.months)),
  }),
  analytics: router({
    financial: protectedProcedure.input(dateRange).query(({ input }) => db.getFinancialReport(input.from, input.to)),
    attendance: protectedProcedure.input(dateRange).query(({ input }) => db.getAttendance(input.from, input.to)),
    exportFinancial: protectedProcedure.input(dateRange).query(async ({ input }) => { const report = await db.getFinancialReport(input.from, input.to); return exportXlsx(report.daily, "Daily Revenue", `financial-report-${input.from.toISOString().slice(0, 10)}.xlsx`); }),
  }),
  attendance: router({
    report: protectedProcedure.input(dateRange).query(({ input }) => db.getAttendance(input.from, input.to)),
    checkIn: protectedProcedure.input(z.object({ memberId: z.number().int().positive(), activityType: z.string().min(2) })).mutation(({ input }) => db.checkIn(input.memberId, input.activityType)),
    checkOut: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => db.checkOut(input.id)),
  }),
  trainers: router({
    list: protectedProcedure.query(() => db.listTrainers()),
    create: adminProcedure.input(z.object({ name: z.string().min(2), specialty: z.string().optional(), email: z.string().email().optional(), phone: z.string().optional(), active: z.boolean().default(true) })).mutation(({ input }) => db.createTrainer(input)),
  }),
  rooms: router({
    list: protectedProcedure.query(() => db.listRooms()),
    create: adminProcedure.input(z.object({ name: z.string().min(2), capacity: z.number().int().positive(), location: z.string().optional(), active: z.boolean().default(true) })).mutation(({ input }) => db.createRoom(input)),
  }),
  classes: router({
    list: protectedProcedure.input(z.object({ from: z.coerce.date().optional(), to: z.coerce.date().optional() }).optional()).query(({ input }) => db.listClasses(input?.from, input?.to)),
    create: adminProcedure.input(z.object({ title: z.string().min(2), description: z.string().optional(), trainerId: z.number().int().positive(), roomId: z.number().int().positive().optional(), startsAt: z.coerce.date(), endsAt: z.coerce.date(), capacity: z.number().int().positive(), price: z.coerce.number().nonnegative().default(0), status: z.enum(["scheduled", "cancelled", "completed"]).default("scheduled") })).mutation(({ input }) => db.createClass({ ...input, price: input.price.toFixed(2) })),
    book: protectedProcedure.input(z.object({ classId: z.number().int().positive(), memberId: z.number().int().positive() })).mutation(({ input }) => db.bookClass(input.classId, input.memberId)),
    cancelBooking: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => db.cancelBooking(input.id)),
  }),
  personalTraining: router({
    packages: protectedProcedure.query(() => db.listPtPackages()),
    createPackage: adminProcedure.input(z.object({ name: z.string().min(2), sessionsCount: z.number().int().positive(), price: z.coerce.number().nonnegative(), active: z.boolean().default(true) })).mutation(({ input }) => db.createPtPackage({ ...input, price: input.price.toFixed(2) })),
    assignments: protectedProcedure.query(() => db.listPtAssignments()),
    assign: adminProcedure.input(z.object({ memberId: z.number().int().positive(), trainerId: z.number().int().positive(), packageId: z.number().int().positive(), startsAt: z.coerce.date(), endsAt: z.coerce.date().optional(), status: z.enum(["active", "completed", "cancelled"]).default("active") })).mutation(({ input }) => db.createPtAssignment(input)), sessions: protectedProcedure.query(() => db.listPtSessions()), scheduleSession: protectedProcedure.input(z.object({ assignmentId: z.number().int().positive(), scheduledAt: z.coerce.date(), notes: z.string().optional(), status: z.enum(["scheduled", "completed", "cancelled", "missed"]).default("scheduled") })).mutation(({ input }) => db.createPtSession(input)),
    completeSession: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => db.completePtSession(input.id)),
  }),
});

export type AppRouter = typeof appRouter;
