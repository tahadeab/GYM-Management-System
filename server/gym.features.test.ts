import { describe, expect, it, vi, afterEach } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

function createContext(role: "admin" | "user" = "admin"): TrpcContext {
  const now = new Date();
  return {
    user: { id: 1, openId: "test-user", name: "Test User", email: "test@example.com", loginMethod: "test", role, createdAt: now, updatedAt: now, lastSignedIn: now },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

afterEach(() => vi.restoreAllMocks());

describe("gym feature procedures", () => {
  it("renews a subscription with the requested number of months", async () => {
    const renewed = [{ id: 7, memberId: 3, planName: "Gold", status: "active", endDate: new Date("2026-04-01") }];
    const spy = vi.spyOn(db, "renewSubscription").mockResolvedValue(renewed as never);
    const result = await appRouter.createCaller(createContext()).subscriptions.renew({ id: 7, months: 3 });
    expect(spy).toHaveBeenCalledWith(7, 3);
    expect(result).toEqual(renewed);
  });

  it("freezes and unfreezes a subscription through admin procedures", async () => {
    const update = vi.spyOn(db, "updateSubscription").mockResolvedValue([] as never);
    const freezeUntil = new Date("2026-02-01");
    await appRouter.createCaller(createContext()).subscriptions.freeze({ id: 9, freezeUntil });
    await appRouter.createCaller(createContext()).subscriptions.unfreeze({ id: 9 });
    expect(update).toHaveBeenNthCalledWith(1, 9, { status: "frozen", freezeUntil });
    expect(update).toHaveBeenNthCalledWith(2, 9, { status: "active", freezeUntil: null });
  });

  it("allows admins to create trainers and PT assignments", async () => {
    const trainer = vi.spyOn(db, "createTrainer").mockResolvedValue({ id: 4, name: "Amina", specialty: "Strength" } as never);
    const assignment = vi.spyOn(db, "createPtAssignment").mockResolvedValue({ id: 12, memberId: 2, trainerId: 4, packageId: 5 } as never);
    const caller = appRouter.createCaller(createContext());
    await caller.trainers.create({ name: "Amina", specialty: "Strength", active: true });
    await caller.personalTraining.assign({ memberId: 2, trainerId: 4, packageId: 5, startsAt: new Date("2026-01-01"), status: "active" });
    expect(trainer).toHaveBeenCalledWith({ name: "Amina", specialty: "Strength", active: true });
    expect(assignment).toHaveBeenCalledWith({ memberId: 2, trainerId: 4, packageId: 5, startsAt: new Date("2026-01-01"), status: "active" });
  });

  it("rejects trainer, room, and capacity scheduling conflicts", () => {
    const start = new Date("2026-08-15T10:00:00Z");
    const end = new Date("2026-08-15T11:00:00Z");
    expect(db.timeRangesOverlap(start, end, new Date("2026-08-15T10:30:00Z"), new Date("2026-08-15T11:30:00Z"))).toBe(true);
    expect(db.timeRangesOverlap(start, end, new Date("2026-08-15T11:00:00Z"), new Date("2026-08-15T12:00:00Z"))).toBe(false);
    expect(() => db.validateClassSchedule({ roomId: 2, capacity: 20 }, { trainerConflict: true, room: { capacity: 30 }, roomConflict: false })).toThrow("Trainer is already scheduled");
    expect(() => db.validateClassSchedule({ roomId: 2, capacity: 20 }, { trainerConflict: false, room: { capacity: 30 }, roomConflict: true })).toThrow("Room is already booked");
    expect(() => db.validateClassSchedule({ roomId: 2, capacity: 40 }, { trainerConflict: false, room: { capacity: 30 }, roomConflict: false })).toThrow("capacity exceeds");
  });

  it("cancels the exact booking id supplied by the caller", async () => {
    const cancel = vi.spyOn(db, "cancelBooking").mockResolvedValue({ id: 22, status: "cancelled" } as never);
    const result = await appRouter.createCaller(createContext("user")).classes.cancelBooking({ id: 22 });
    expect(cancel).toHaveBeenCalledWith(22);
    expect(result).toEqual({ id: 22, status: "cancelled" });
  });
});
