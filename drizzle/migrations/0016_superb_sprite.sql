ALTER TABLE `COAPP_CRM_CLIENT` ADD `bizr_numb` varchar(10);--> statement-breakpoint
ALTER TABLE `COAPP_CRM_CLIENT` ADD `clie_type` varchar(16) DEFAULT 'sales' NOT NULL;--> statement-breakpoint
ALTER TABLE `COAPP_CRM_CLIENT` ADD CONSTRAINT `ux_client_comp_bizr` UNIQUE(`comp_idno`,`bizr_numb`);