DROP INDEX `ix_core_user_mail` ON `COAPP_CORE_USER`;--> statement-breakpoint
ALTER TABLE `COAPP_CORE_USER` ADD CONSTRAINT `ux_core_user_mail` UNIQUE(`mail_idno`);