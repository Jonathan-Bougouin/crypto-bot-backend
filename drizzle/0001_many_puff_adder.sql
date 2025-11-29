CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timestamp` timestamp NOT NULL,
	`asset` varchar(20) NOT NULL,
	`price` varchar(50) NOT NULL,
	`signalType` varchar(50) NOT NULL,
	`confidence` varchar(20) NOT NULL,
	`recommendation` text NOT NULL,
	`indicatorsTriggered` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
