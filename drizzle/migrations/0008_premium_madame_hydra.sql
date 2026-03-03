ALTER TABLE `COAPP_CRM_SALE` ADD `cont_role` varchar(100);--> statement-breakpoint
ALTER TABLE `COAPP_CRM_SALE` ADD `cont_tele` varchar(50);--> statement-breakpoint
ALTER TABLE `COAPP_CRM_SALE` ADD `cont_mail` varchar(320);--> statement-breakpoint
CREATE INDEX `ix_sale_comp_cont` ON `COAPP_CRM_SALE` (`comp_idno`,`cont_name`);--> statement-breakpoint
ALTER TABLE `COAPP_CRM_SALE` DROP COLUMN `audi_addr`;