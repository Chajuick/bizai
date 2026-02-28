DROP INDEX `ix_client_comp_name` ON `COAPP_CRM_CLIENT`;--> statement-breakpoint
ALTER TABLE `COAPP_CRM_CLIENT` ADD CONSTRAINT `ux_client_comp_name` UNIQUE(`comp_idno`,`clie_name`);