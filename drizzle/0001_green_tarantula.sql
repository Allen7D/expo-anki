CREATE TABLE `flashcards_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`word` text NOT NULL,
	`usphone` text,
	`ukphone` text,
	`meaning` text NOT NULL,
	`example` text,
	`imageUrl` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `study_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`flashcardId` integer NOT NULL,
	`isCorrect` integer NOT NULL,
	`responseTime` integer NOT NULL,
	`studiedAt` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users_table`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`flashcardId`) REFERENCES `flashcards_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_algorithm_config` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`algorithmType` text DEFAULT 'anki' NOT NULL,
	`learningMode` text DEFAULT 'standard' NOT NULL,
	`baseIntervalsEasy` text DEFAULT '[1,4,10]' NOT NULL,
	`baseIntervalsNormal` text DEFAULT '[1,2,6]' NOT NULL,
	`baseIntervalsHard` text DEFAULT '[1,1,4]' NOT NULL,
	`multiplierEasy` real DEFAULT 2.5 NOT NULL,
	`multiplierNormal` real DEFAULT 2 NOT NULL,
	`multiplierHard` real DEFAULT 1.3 NOT NULL,
	`maxInterval` integer DEFAULT 365 NOT NULL,
	`minInterval` integer DEFAULT 1 NOT NULL,
	`newCardSteps` text DEFAULT '[1,10,1440]' NOT NULL,
	`lapseSteps` text DEFAULT '[10,1440]' NOT NULL,
	`dailyNewCards` integer DEFAULT 20 NOT NULL,
	`dailyReviewCards` integer DEFAULT 200 NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_algorithm_config_userId_unique` ON `user_algorithm_config` (`userId`);--> statement-breakpoint
CREATE TABLE `user_flashcard_progress` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`flashcardId` integer NOT NULL,
	`difficulty` integer NOT NULL,
	`nextReviewDate` text NOT NULL,
	`reviewCount` integer DEFAULT 0 NOT NULL,
	`correctCount` integer DEFAULT 0 NOT NULL,
	`lastReviewedAt` text,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users_table`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`flashcardId`) REFERENCES `flashcards_table`(`id`) ON UPDATE no action ON DELETE cascade
);
