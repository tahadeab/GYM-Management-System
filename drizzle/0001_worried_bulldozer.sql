CREATE TABLE `attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`activityType` varchar(80) NOT NULL DEFAULT 'gym',
	`checkedInAt` timestamp NOT NULL DEFAULT (now()),
	`checkedOutAt` timestamp,
	`notes` text,
	CONSTRAINT `attendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`memberId` int NOT NULL,
	`status` enum('booked','cancelled','attended') NOT NULL DEFAULT 'booked',
	`bookedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`),
	CONSTRAINT `booking_class_member_unique` UNIQUE(`classId`,`memberId`)
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(160) NOT NULL,
	`description` text,
	`trainerId` int NOT NULL,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`capacity` int NOT NULL,
	`price` decimal(12,2) NOT NULL DEFAULT '0',
	`status` enum('scheduled','cancelled','completed') NOT NULL DEFAULT 'scheduled',
	CONSTRAINT `classes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`email` varchar(320),
	`phone` varchar(40),
	`status` enum('active','inactive','blocked') NOT NULL DEFAULT 'active',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`subscriptionId` int,
	`amount` decimal(12,2) NOT NULL,
	`method` enum('cash','card','transfer','online') NOT NULL DEFAULT 'cash',
	`paidAt` timestamp NOT NULL DEFAULT (now()),
	`description` varchar(240),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pt_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`trainerId` int NOT NULL,
	`packageId` int NOT NULL,
	`startsAt` timestamp NOT NULL DEFAULT (now()),
	`endsAt` timestamp,
	`status` enum('active','completed','cancelled') NOT NULL DEFAULT 'active',
	CONSTRAINT `pt_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pt_packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`sessionsCount` int NOT NULL,
	`price` decimal(12,2) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `pt_packages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pt_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assignmentId` int NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`completedAt` timestamp,
	`status` enum('scheduled','completed','cancelled','missed') NOT NULL DEFAULT 'scheduled',
	`notes` text,
	CONSTRAINT `pt_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`planName` varchar(120) NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`status` enum('active','frozen','expired','cancelled') NOT NULL DEFAULT 'active',
	`monthlyPrice` decimal(12,2) NOT NULL,
	`freezeUntil` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trainers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`specialty` varchar(160),
	`email` varchar(320),
	`phone` varchar(40),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trainers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `attendance_member_date_idx` ON `attendance` (`memberId`,`checkedInAt`);--> statement-breakpoint
CREATE INDEX `bookings_class_idx` ON `bookings` (`classId`);--> statement-breakpoint
CREATE INDEX `classes_starts_idx` ON `classes` (`startsAt`);--> statement-breakpoint
CREATE INDEX `members_email_idx` ON `members` (`email`);--> statement-breakpoint
CREATE INDEX `members_name_idx` ON `members` (`name`);--> statement-breakpoint
CREATE INDEX `payments_paid_at_idx` ON `payments` (`paidAt`);--> statement-breakpoint
CREATE INDEX `pt_sessions_date_idx` ON `pt_sessions` (`scheduledAt`);--> statement-breakpoint
CREATE INDEX `subscriptions_member_idx` ON `subscriptions` (`memberId`);--> statement-breakpoint
CREATE INDEX `subscriptions_end_idx` ON `subscriptions` (`endDate`);