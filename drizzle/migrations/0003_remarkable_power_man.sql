CREATE INDEX `ix_sche_comp_stat_date` ON `COAPP_CRM_SCHEDULE` (`comp_idno`,`schedule_status`,`sche_date`);--> statement-breakpoint
CREATE INDEX `ix_ord_comp_crea` ON `COAPP_CRM_ORDER` (`comp_idno`,`crea_date`);--> statement-breakpoint
CREATE INDEX `ix_ship_comp_stat_paid` ON `COAPP_CRM_SHIPMENT` (`comp_idno`,`ship_status`,`paid_date`);