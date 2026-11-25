-- Migration: 005_add_user_id_to_resume_analyses.sql
-- Module 5 Lesson 5.5: Link resume_analyses directly to authenticated users for high-performance multi-tenant scoping

ALTER TABLE `resume_analyses`
ADD COLUMN `user_id` bigint NULL AFTER `analysis_id`,
ADD KEY `idx_analysis_user` (`user_id`),
ADD CONSTRAINT `fk_resume_analyses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;
