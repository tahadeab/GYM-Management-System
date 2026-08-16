CREATE TABLE `rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`capacity` int NOT NULL,
	`location` varchar(160),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rooms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `classes` ADD `roomId` int;--> statement-breakpoint
CREATE INDEX `rooms_name_idx` ON `rooms` (`name`);