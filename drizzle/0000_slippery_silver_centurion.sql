CREATE TABLE `COAPP_CORE_FILE_LINK` (
	`comp_idno` int NOT NULL,
	`file_idno` int NOT NULL,
	`file_ref_type` enum('sale_info','client','promise','order','delivery') NOT NULL,
	`refe_idno` int NOT NULL,
	`file_purp_type` enum('general','sale_audio','sale_image','contract','quote'),
	`sort_orde` int NOT NULL DEFAULT 0,
	`dele_yesn` int NOT NULL DEFAULT 0,
	`dele_date` timestamp,
	`crea_idno` int NOT NULL,
	`crea_date` timestamp NOT NULL DEFAULT (now()),
	`modi_idno` int,
	`modi_date` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pk_core_file_link` PRIMARY KEY(`comp_idno`,`file_ref_type`,`refe_idno`,`file_idno`)
);
--> statement-breakpoint
CREATE TABLE `COAPP_CORE_FILE` (
	`file_idno` int AUTO_INCREMENT NOT NULL,
	`comp_idno` int NOT NULL,
	`upld_idno` int NOT NULL,
	`file_name` varchar(300) NOT NULL,
	`file_extn` varchar(20),
	`mime_type` varchar(120),
	`file_size` int,
	`file_hash` varchar(64),
	`stor_drve` varchar(32) DEFAULT 's3',
	`file_path` varchar(500) NOT NULL,
	`file_addr` text,
	`dura_secs` int,
	`dele_yesn` int NOT NULL DEFAULT 0,
	`dele_date` timestamp,
	`drop_date` timestamp,
	`crea_idno` int NOT NULL,
	`crea_date` timestamp NOT NULL DEFAULT (now()),
	`modi_idno` int,
	`modi_date` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `COAPP_CORE_FILE_file_idno` PRIMARY KEY(`file_idno`),
	CONSTRAINT `ux_core_file_hash` UNIQUE(`comp_idno`,`file_hash`)
);
--> statement-breakpoint
CREATE TABLE `COAPP_CORE_COMPANY` (
	`comp_idno` int AUTO_INCREMENT NOT NULL,
	`comp_name` varchar(200) NOT NULL,
	`bizn_numb` varchar(10) NOT NULL,
	`need_appr` tinyint NOT NULL DEFAULT 0,
	`mail_domain` varchar(120),
	`invt_link_ok` tinyint NOT NULL DEFAULT 1,
	`invt_mail_ok` tinyint NOT NULL DEFAULT 0,
	`crea_date` timestamp NOT NULL DEFAULT (now()),
	`modi_date` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `COAPP_CORE_COMPANY_comp_idno` PRIMARY KEY(`comp_idno`),
	CONSTRAINT `ux_company_bizn_numb` UNIQUE(`bizn_numb`)
);
--> statement-breakpoint
CREATE TABLE `COAPP_CORE_USER` (
	`user_idno` int AUTO_INCREMENT NOT NULL,
	`open_idno` varchar(191) NOT NULL,
	`user_name` varchar(200),
	`mail_idno` varchar(320),
	`logi_mthd` varchar(64),
	`user_auth` varchar(16) NOT NULL DEFAULT 'user',
	`last_sign` timestamp NOT NULL DEFAULT (now()),
	`crea_date` timestamp NOT NULL DEFAULT (now()),
	`modi_date` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `COAPP_CORE_USER_user_idno` PRIMARY KEY(`user_idno`),
	CONSTRAINT `ux_core_user_open` UNIQUE(`open_idno`)
);
--> statement-breakpoint
CREATE TABLE `COAPP_CORE_COMPANY_USER` (
	`comp_idno` int NOT NULL,
	`user_idno` int NOT NULL,
	`company_role` enum('owner','admin','member') NOT NULL DEFAULT 'member',
	`member_status` enum('active','pending','removed') NOT NULL DEFAULT 'active',
	`crea_idno` int NOT NULL,
	`crea_date` timestamp NOT NULL DEFAULT (now()),
	`modi_idno` int,
	`modi_date` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pk_core_company_user` PRIMARY KEY(`comp_idno`,`user_idno`)
);
--> statement-breakpoint
CREATE TABLE `COAPP_BILLING_PLAN` (
	`plan_idno` int AUTO_INCREMENT NOT NULL,
	`plan_code` enum('free','pro','team','enterprise') NOT NULL,
	`plan_name` varchar(80) NOT NULL,
	`seat_limt` int NOT NULL,
	`tokn_mont` int NOT NULL,
	`crea_date` timestamp NOT NULL DEFAULT (now()),
	`modi_date` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `COAPP_BILLING_PLAN_plan_idno` PRIMARY KEY(`plan_idno`),
	CONSTRAINT `ux_billing_plan_code` UNIQUE(`plan_code`)
);
--> statement-breakpoint
CREATE TABLE `COAPP_BILLING_SUBSCRIPTION` (
	`subs_idno` int AUTO_INCREMENT NOT NULL,
	`comp_idno` int NOT NULL,
	`plan_idno` int NOT NULL,
	`sub_status` enum('active','trialing','canceled','past_due','inactive') NOT NULL DEFAULT 'active',
	`prov_name` varchar(40),
	`prov_subs` varchar(120),
	`seat_ovrr` int,
	`tokn_ovrr` int,
	`star_date` timestamp NOT NULL,
	`ends_date` timestamp NOT NULL,
	`crea_idno` int NOT NULL,
	`crea_date` timestamp NOT NULL DEFAULT (now()),
	`modi_idno` int,
	`modi_date` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `COAPP_BILLING_SUBSCRIPTION_subs_idno` PRIMARY KEY(`subs_idno`),
	CONSTRAINT `ux_billing_sub_prov` UNIQUE(`prov_name`,`prov_subs`)
);
--> statement-breakpoint
CREATE TABLE `COAPP_AI_TOKEN_BALANCE` (
	`comp_idno` int NOT NULL,
	`bala_tokn` int NOT NULL DEFAULT 0,
	`modi_date` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `COAPP_AI_TOKEN_BALANCE_comp_idno_pk` PRIMARY KEY(`comp_idno`)
);
--> statement-breakpoint
CREATE TABLE `COAPP_AI_TOKEN_LEDGER` (
	`ldgr_idno` int AUTO_INCREMENT NOT NULL,
	`comp_idno` int NOT NULL,
	`actv_user` int,
	`ledger_reason` enum('plan_monthly_grant','topup_purchase','usage_chat','usage_stt','usage_llm','admin_adjust') NOT NULL,
	`ai_feature` enum('chat','stt','llm'),
	`delt_tokn` int NOT NULL,
	`year_mont` int NOT NULL,
	`refe_type` varchar(40),
	`refe_idno` int,
	`meta_json` json,
	`crea_date` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `COAPP_AI_TOKEN_LEDGER_ldgr_idno` PRIMARY KEY(`ldgr_idno`)
);
--> statement-breakpoint
CREATE TABLE `COAPP_AI_USAGE_EVENT` (
	`evnt_idno` int AUTO_INCREMENT NOT NULL,
	`comp_idno` int NOT NULL,
	`user_idno` int NOT NULL,
	`ai_feature` enum('chat','stt','llm') NOT NULL,
	`mode_name` varchar(80),
	`tokn_inpt` int NOT NULL DEFAULT 0,
	`tokn_outs` int NOT NULL DEFAULT 0,
	`tokn_tota` int NOT NULL DEFAULT 0,
	`meta_json` json,
	`crea_date` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `COAPP_AI_USAGE_EVENT_evnt_idno` PRIMARY KEY(`evnt_idno`)
);
--> statement-breakpoint
CREATE TABLE `COAPP_AI_USAGE_MONTH` (
	`comp_idno` int NOT NULL,
	`year_mont` int NOT NULL,
	`ai_feature` enum('chat','stt','llm') NOT NULL,
	`call_usag` int NOT NULL DEFAULT 0,
	`modi_date` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pk_ai_usage_month` PRIMARY KEY(`comp_idno`,`year_mont`,`ai_feature`)
);
--> statement-breakpoint
CREATE TABLE `COAPP_CRM_CLIENT` (
	`clie_idno` int AUTO_INCREMENT NOT NULL,
	`comp_idno` int NOT NULL,
	`clie_name` varchar(200) NOT NULL,
	`indu_type` varchar(100),
	`cont_name` varchar(100),
	`cont_tele` varchar(50),
	`cont_mail` varchar(320),
	`clie_addr` text,
	`clie_memo` text,
	`enab_yesn` boolean NOT NULL DEFAULT true,
	`crea_idno` int NOT NULL,
	`crea_date` timestamp NOT NULL DEFAULT (now()),
	`modi_idno` int,
	`modi_date` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `COAPP_CRM_CLIENT_clie_idno` PRIMARY KEY(`clie_idno`)
);
--> statement-breakpoint
CREATE TABLE `COAPP_CRM_SALE` (
	`sale_idno` int AUTO_INCREMENT NOT NULL,
	`comp_idno` int NOT NULL,
	`owne_idno` int NOT NULL,
	`clie_idno` int,
	`clie_name` varchar(200),
	`cont_name` varchar(100),
	`sale_loca` varchar(200),
	`vist_date` timestamp NOT NULL,
	`orig_memo` text NOT NULL,
	`aiex_summ` text,
	`aiex_text` json,
	`audi_addr` text,
	`sttx_text` text,
	`aiex_done` boolean NOT NULL DEFAULT false,
	`crea_idno` int NOT NULL,
	`crea_date` timestamp NOT NULL DEFAULT (now()),
	`modi_idno` int,
	`modi_date` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `COAPP_CRM_SALE_sale_idno` PRIMARY KEY(`sale_idno`)
);
--> statement-breakpoint
CREATE TABLE `COAPP_CRM_SALE_AUDIO_JOB` (
	`jobs_idno` int AUTO_INCREMENT NOT NULL,
	`comp_idno` int NOT NULL,
	`sale_idno` int NOT NULL,
	`file_idno` int NOT NULL,
	`jobs_status` enum('queued','running','done','failed') NOT NULL DEFAULT 'queued',
	`fail_mess` text,
	`sttx_text` text,
	`aiex_sum` text,
	`aiex_ext` json,
	`sttx_name` varchar(80),
	`llmd_name` varchar(80),
	`meta_json` json,
	`reqe_date` timestamp NOT NULL DEFAULT (now()),
	`fini_date` timestamp,
	`crea_idno` int NOT NULL,
	`crea_date` timestamp NOT NULL DEFAULT (now()),
	`modi_idno` int,
	`modi_date` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `COAPP_CRM_SALE_AUDIO_JOB_jobs_idno` PRIMARY KEY(`jobs_idno`),
	CONSTRAINT `ux_sale_audio_job_ref` UNIQUE(`comp_idno`,`sale_idno`,`file_idno`)
);
--> statement-breakpoint
CREATE TABLE `COAPP_CRM_SCHEDULE` (
	`sche_idno` int AUTO_INCREMENT NOT NULL,
	`comp_idno` int NOT NULL,
	`owne_idno` int NOT NULL,
	`sale_idno` int,
	`clie_idno` int,
	`clie_name` varchar(200),
	`sche_name` varchar(300) NOT NULL,
	`sche_desc` text,
	`sche_pric` decimal(15,2),
	`sche_date` timestamp NOT NULL,
	`schedule_status` enum('scheduled','completed','canceled','overdue') NOT NULL DEFAULT 'scheduled',
	`remd_sent` boolean NOT NULL DEFAULT false,
	`auto_gene` boolean NOT NULL DEFAULT false,
	`crea_idno` int NOT NULL,
	`crea_date` timestamp NOT NULL DEFAULT (now()),
	`modi_idno` int,
	`modi_date` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `COAPP_CRM_SCHEDULE_sche_idno` PRIMARY KEY(`sche_idno`)
);
--> statement-breakpoint
CREATE TABLE `COAPP_CRM_ORDER` (
	`orde_idno` int AUTO_INCREMENT NOT NULL,
	`comp_idno` int NOT NULL,
	`owne_idno` int NOT NULL,
	`clie_idno` int,
	`sale_idno` int,
	`clie_name` varchar(200) NOT NULL,
	`prod_serv` varchar(300) NOT NULL,
	`orde_pric` decimal(15,2) NOT NULL,
	`order_status` enum('proposal','negotiation','confirmed','canceled') NOT NULL DEFAULT 'proposal',
	`ctrt_date` timestamp,
	`expd_date` timestamp,
	`orde_memo` text,
	`crea_idno` int NOT NULL,
	`crea_date` timestamp NOT NULL DEFAULT (now()),
	`modi_idno` int,
	`modi_date` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `COAPP_CRM_ORDER_orde_idno` PRIMARY KEY(`orde_idno`)
);
--> statement-breakpoint
CREATE TABLE `COAPP_CRM_SHIPMENT` (
	`ship_idno` int AUTO_INCREMENT NOT NULL,
	`comp_idno` int NOT NULL,
	`owne_idno` int NOT NULL,
	`orde_idno` int NOT NULL,
	`clie_name` varchar(200) NOT NULL,
	`ship_status` enum('pending','delivered','invoiced','paid') NOT NULL DEFAULT 'pending',
	`ship_date` timestamp,
	`ship_pric` decimal(15,2) NOT NULL,
	`ship_memo` text,
	`crea_idno` int NOT NULL,
	`crea_date` timestamp NOT NULL DEFAULT (now()),
	`modi_idno` int,
	`modi_date` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `COAPP_CRM_SHIPMENT_ship_idno` PRIMARY KEY(`ship_idno`)
);
--> statement-breakpoint
CREATE INDEX `ix_core_file_link_ref` ON `COAPP_CORE_FILE_LINK` (`comp_idno`,`file_ref_type`,`refe_idno`,`dele_yesn`);--> statement-breakpoint
CREATE INDEX `ix_core_file_link_file` ON `COAPP_CORE_FILE_LINK` (`comp_idno`,`file_idno`,`dele_yesn`);--> statement-breakpoint
CREATE INDEX `ix_core_file_comp` ON `COAPP_CORE_FILE` (`comp_idno`);--> statement-breakpoint
CREATE INDEX `ix_core_file_upld` ON `COAPP_CORE_FILE` (`comp_idno`,`upld_idno`);--> statement-breakpoint
CREATE INDEX `ix_core_file_dele` ON `COAPP_CORE_FILE` (`comp_idno`,`dele_date`);--> statement-breakpoint
CREATE INDEX `ix_core_file_drop` ON `COAPP_CORE_FILE` (`comp_idno`,`drop_date`);--> statement-breakpoint
CREATE INDEX `ix_company_name` ON `COAPP_CORE_COMPANY` (`comp_name`);--> statement-breakpoint
CREATE INDEX `ix_company_mail_domain` ON `COAPP_CORE_COMPANY` (`mail_domain`);--> statement-breakpoint
CREATE INDEX `ix_core_user_mail` ON `COAPP_CORE_USER` (`mail_idno`);--> statement-breakpoint
CREATE INDEX `ix_core_company_user_user` ON `COAPP_CORE_COMPANY_USER` (`user_idno`);--> statement-breakpoint
CREATE INDEX `ix_core_company_user_comp` ON `COAPP_CORE_COMPANY_USER` (`comp_idno`);--> statement-breakpoint
CREATE INDEX `ix_core_company_user_status` ON `COAPP_CORE_COMPANY_USER` (`comp_idno`,`member_status`);--> statement-breakpoint
CREATE INDEX `ix_billing_sub_comp` ON `COAPP_BILLING_SUBSCRIPTION` (`comp_idno`);--> statement-breakpoint
CREATE INDEX `ix_billing_sub_plan` ON `COAPP_BILLING_SUBSCRIPTION` (`plan_idno`);--> statement-breakpoint
CREATE INDEX `ix_billing_sub_stat` ON `COAPP_BILLING_SUBSCRIPTION` (`comp_idno`,`sub_status`);--> statement-breakpoint
CREATE INDEX `ix_billing_sub_comp_stat_end` ON `COAPP_BILLING_SUBSCRIPTION` (`comp_idno`,`sub_status`,`ends_date`);--> statement-breakpoint
CREATE INDEX `ix_ai_ledger_comp_crea` ON `COAPP_AI_TOKEN_LEDGER` (`comp_idno`,`crea_date`);--> statement-breakpoint
CREATE INDEX `ix_ai_ledger_comp_mont` ON `COAPP_AI_TOKEN_LEDGER` (`comp_idno`,`year_mont`);--> statement-breakpoint
CREATE INDEX `ix_ai_ledger_comp_user` ON `COAPP_AI_TOKEN_LEDGER` (`comp_idno`,`actv_user`);--> statement-breakpoint
CREATE INDEX `ix_ai_event_comp_crea` ON `COAPP_AI_USAGE_EVENT` (`comp_idno`,`crea_date`);--> statement-breakpoint
CREATE INDEX `ix_ai_event_comp_user_crea` ON `COAPP_AI_USAGE_EVENT` (`comp_idno`,`user_idno`,`crea_date`);--> statement-breakpoint
CREATE INDEX `ix_ai_event_comp_feat_crea` ON `COAPP_AI_USAGE_EVENT` (`comp_idno`,`ai_feature`,`crea_date`);--> statement-breakpoint
CREATE INDEX `ix_ai_mo_comp_mont` ON `COAPP_AI_USAGE_MONTH` (`comp_idno`,`year_mont`);--> statement-breakpoint
CREATE INDEX `ix_ai_mo_comp_feat_mont` ON `COAPP_AI_USAGE_MONTH` (`comp_idno`,`ai_feature`,`year_mont`);--> statement-breakpoint
CREATE INDEX `ix_client_comp` ON `COAPP_CRM_CLIENT` (`comp_idno`);--> statement-breakpoint
CREATE INDEX `ix_client_comp_name` ON `COAPP_CRM_CLIENT` (`comp_idno`,`clie_name`);--> statement-breakpoint
CREATE INDEX `ix_sale_comp_vist` ON `COAPP_CRM_SALE` (`comp_idno`,`vist_date`);--> statement-breakpoint
CREATE INDEX `ix_sale_comp_owne_vist` ON `COAPP_CRM_SALE` (`comp_idno`,`owne_idno`,`vist_date`);--> statement-breakpoint
CREATE INDEX `ix_sale_comp_clie_vist` ON `COAPP_CRM_SALE` (`comp_idno`,`clie_idno`,`vist_date`);--> statement-breakpoint
CREATE INDEX `ix_sale_audio_job_sale` ON `COAPP_CRM_SALE_AUDIO_JOB` (`comp_idno`,`sale_idno`);--> statement-breakpoint
CREATE INDEX `ix_sale_audio_job_file` ON `COAPP_CRM_SALE_AUDIO_JOB` (`comp_idno`,`file_idno`);--> statement-breakpoint
CREATE INDEX `ix_sale_audio_job_stat_reqe` ON `COAPP_CRM_SALE_AUDIO_JOB` (`comp_idno`,`jobs_status`,`reqe_date`);--> statement-breakpoint
CREATE INDEX `ix_sche_comp_date` ON `COAPP_CRM_SCHEDULE` (`comp_idno`,`sche_date`);--> statement-breakpoint
CREATE INDEX `ix_sche_comp_owne_date` ON `COAPP_CRM_SCHEDULE` (`comp_idno`,`owne_idno`,`sche_date`);--> statement-breakpoint
CREATE INDEX `ix_sche_comp_clie_date` ON `COAPP_CRM_SCHEDULE` (`comp_idno`,`clie_idno`,`sche_date`);--> statement-breakpoint
CREATE INDEX `ix_ord_comp` ON `COAPP_CRM_ORDER` (`comp_idno`);--> statement-breakpoint
CREATE INDEX `ix_ord_comp_stat` ON `COAPP_CRM_ORDER` (`comp_idno`,`order_status`);--> statement-breakpoint
CREATE INDEX `ix_ord_comp_owne` ON `COAPP_CRM_ORDER` (`comp_idno`,`owne_idno`);--> statement-breakpoint
CREATE INDEX `ix_ord_comp_ctrt` ON `COAPP_CRM_ORDER` (`comp_idno`,`ctrt_date`);--> statement-breakpoint
CREATE INDEX `ix_ord_comp_expd` ON `COAPP_CRM_ORDER` (`comp_idno`,`expd_date`);--> statement-breakpoint
CREATE INDEX `ix_ship_comp` ON `COAPP_CRM_SHIPMENT` (`comp_idno`);--> statement-breakpoint
CREATE INDEX `ix_ship_comp_orde` ON `COAPP_CRM_SHIPMENT` (`comp_idno`,`orde_idno`);--> statement-breakpoint
CREATE INDEX `ix_ship_comp_stat` ON `COAPP_CRM_SHIPMENT` (`comp_idno`,`ship_status`);--> statement-breakpoint
CREATE INDEX `ix_ship_comp_owne` ON `COAPP_CRM_SHIPMENT` (`comp_idno`,`owne_idno`);--> statement-breakpoint
CREATE INDEX `ix_ship_comp_date` ON `COAPP_CRM_SHIPMENT` (`comp_idno`,`ship_date`);