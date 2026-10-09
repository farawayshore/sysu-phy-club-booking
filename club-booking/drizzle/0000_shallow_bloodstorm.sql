CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`club` text NOT NULL,
	`activity` text NOT NULL,
	`date` text NOT NULL,
	`start` text NOT NULL,
	`end` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `bookings_date` ON `bookings` (`date`);