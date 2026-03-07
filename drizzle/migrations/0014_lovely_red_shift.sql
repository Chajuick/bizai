ALTER TABLE `COAPP_CRM_SALE_AUDIO_JOB` DROP INDEX `ux_sale_audio_job_ref`;--> statement-breakpoint
ALTER TABLE `COAPP_CRM_SALE_AUDIO_JOB` ADD `jobs_type` varchar(20) DEFAULT 'analyze' NOT NULL;--> statement-breakpoint
ALTER TABLE `COAPP_CRM_SALE_AUDIO_JOB` ADD CONSTRAINT `ux_sale_audio_job_ref` UNIQUE(`comp_idno`,`sale_idno`,`file_idno`,`jobs_type`);