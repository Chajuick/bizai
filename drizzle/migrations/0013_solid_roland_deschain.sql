DROP INDEX `ix_billing_sub_comp` ON `COAPP_BILLING_SUBSCRIPTION`;--> statement-breakpoint
ALTER TABLE `COAPP_BILLING_SUBSCRIPTION` ADD CONSTRAINT `ux_billing_sub_comp` UNIQUE(`comp_idno`);