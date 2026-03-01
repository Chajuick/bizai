CREATE TABLE `COAPP_CRM_CLIENT_CONT` (
	`cont_idno` int AUTO_INCREMENT NOT NULL,
	`comp_idno` int NOT NULL,
	`clie_idno` int NOT NULL,
	`cont_name` varchar(100) NOT NULL,
	`cont_role` varchar(100),
	`cont_tele` varchar(50),
	`cont_mail` varchar(320),
	`cont_memo` text,
	`main_yesn` boolean NOT NULL DEFAULT false,
	`enab_yesn` boolean NOT NULL DEFAULT true,
	`crea_idno` int NOT NULL,
	`crea_date` timestamp NOT NULL DEFAULT (now()),
	`modi_idno` int,
	`modi_date` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `COAPP_CRM_CLIENT_CONT_cont_idno` PRIMARY KEY(`cont_idno`),
	CONSTRAINT `ux_cont_comp_client_mail` UNIQUE(`comp_idno`,`clie_idno`,`cont_mail`),
	CONSTRAINT `ux_cont_comp_client_tele` UNIQUE(`comp_idno`,`clie_idno`,`cont_tele`)
);
--> statement-breakpoint
CREATE INDEX `ix_cont_comp_client` ON `COAPP_CRM_CLIENT_CONT` (`comp_idno`,`clie_idno`);--> statement-breakpoint
CREATE INDEX `ix_cont_comp_name` ON `COAPP_CRM_CLIENT_CONT` (`comp_idno`,`cont_name`);