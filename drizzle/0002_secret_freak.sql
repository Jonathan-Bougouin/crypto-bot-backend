CREATE TABLE `trades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alertId` int,
	`asset` varchar(20) NOT NULL,
	`entryPrice` varchar(50) NOT NULL,
	`exitPrice` varchar(50),
	`quantity` varchar(50) NOT NULL,
	`profit` varchar(50),
	`profitPercent` varchar(20),
	`status` enum('open','closed','cancelled') NOT NULL DEFAULT 'open',
	`entryTime` timestamp NOT NULL,
	`exitTime` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trades_id` PRIMARY KEY(`id`)
);
