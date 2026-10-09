CREATE TABLE `curriculum_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`visibility` text DEFAULT 'private' NOT NULL,
	`updated_at` text NOT NULL
);
