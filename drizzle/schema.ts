import { boolean, decimal, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const members = mysqlTable("members", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 40 }),
  status: mysqlEnum("status", ["active", "inactive", "blocked"]).default("active").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ emailIdx: index("members_email_idx").on(table.email), nameIdx: index("members_name_idx").on(table.name) }));

export const trainers = mysqlTable("trainers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  specialty: varchar("specialty", { length: 160 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 40 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const rooms = mysqlTable("rooms", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  capacity: int("capacity").notNull(),
  location: varchar("location", { length: 160 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ nameIdx: index("rooms_name_idx").on(table.name) }));

export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").notNull(),
  planName: varchar("planName", { length: 120 }).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  status: mysqlEnum("status", ["active", "frozen", "expired", "cancelled"]).default("active").notNull(),
  monthlyPrice: decimal("monthlyPrice", { precision: 12, scale: 2 }).notNull(),
  freezeUntil: timestamp("freezeUntil"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ memberIdx: index("subscriptions_member_idx").on(table.memberId), endIdx: index("subscriptions_end_idx").on(table.endDate) }));

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").notNull(),
  subscriptionId: int("subscriptionId"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  method: mysqlEnum("method", ["cash", "card", "transfer", "online"]).default("cash").notNull(),
  paidAt: timestamp("paidAt").defaultNow().notNull(),
  description: varchar("description", { length: 240 }),
}, table => ({ paidAtIdx: index("payments_paid_at_idx").on(table.paidAt) }));

export const attendance = mysqlTable("attendance", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").notNull(),
  activityType: varchar("activityType", { length: 80 }).default("gym").notNull(),
  checkedInAt: timestamp("checkedInAt").defaultNow().notNull(),
  checkedOutAt: timestamp("checkedOutAt"),
  notes: text("notes"),
}, table => ({ memberDateIdx: index("attendance_member_date_idx").on(table.memberId, table.checkedInAt) }));

export const classes = mysqlTable("classes", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 160 }).notNull(),
  description: text("description"),
  trainerId: int("trainerId").notNull(),
  roomId: int("roomId"),
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt").notNull(),
  capacity: int("capacity").notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).default("0").notNull(),
  status: mysqlEnum("status", ["scheduled", "cancelled", "completed"]).default("scheduled").notNull(),
}, table => ({ startsIdx: index("classes_starts_idx").on(table.startsAt) }));

export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  memberId: int("memberId").notNull(),
  status: mysqlEnum("status", ["booked", "cancelled", "attended"]).default("booked").notNull(),
  bookedAt: timestamp("bookedAt").defaultNow().notNull(),
}, table => ({ uniqueBooking: uniqueIndex("booking_class_member_unique").on(table.classId, table.memberId), classIdx: index("bookings_class_idx").on(table.classId) }));

export const ptPackages = mysqlTable("pt_packages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  sessionsCount: int("sessionsCount").notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  active: boolean("active").default(true).notNull(),
});

export const ptAssignments = mysqlTable("pt_assignments", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").notNull(),
  trainerId: int("trainerId").notNull(),
  packageId: int("packageId").notNull(),
  startsAt: timestamp("startsAt").defaultNow().notNull(),
  endsAt: timestamp("endsAt"),
  status: mysqlEnum("status", ["active", "completed", "cancelled"]).default("active").notNull(),
});

export const ptSessions = mysqlTable("pt_sessions", {
  id: int("id").autoincrement().primaryKey(),
  assignmentId: int("assignmentId").notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  completedAt: timestamp("completedAt"),
  status: mysqlEnum("status", ["scheduled", "completed", "cancelled", "missed"]).default("scheduled").notNull(),
  notes: text("notes"),
}, table => ({ sessionDateIdx: index("pt_sessions_date_idx").on(table.scheduledAt) }));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Member = typeof members.$inferSelect;
export type Trainer = typeof trainers.$inferSelect;
export type Room = typeof rooms.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type GymClass = typeof classes.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type PtAssignment = typeof ptAssignments.$inferSelect;
export type PtSession = typeof ptSessions.$inferSelect;
