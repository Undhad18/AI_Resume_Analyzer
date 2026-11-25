-- AI Resume Analyzer Database Schema
-- Preserved Module 1 MySQL Architecture

CREATE DATABASE IF NOT EXISTS i_resume_analyzer DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE i_resume_analyzer;

CREATE TABLE `roles` (
  `role_id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `user_id` bigint NOT NULL AUTO_INCREMENT,
  `role_id` int NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `profile_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_verified` tinyint(1) DEFAULT '0',
  `account_status` enum('active','inactive','suspended') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_role` (`role_id`),
  KEY `idx_users_status` (`account_status`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `resumes` (
  `resume_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `resume_title` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `candidate_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `extracted_text` longtext COLLATE utf8mb4_unicode_ci,
  `status` enum('uploaded','processing','completed','failed') COLLATE utf8mb4_unicode_ci DEFAULT 'uploaded',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`resume_id`),
  KEY `idx_resumes_user` (`user_id`),
  KEY `idx_resumes_status` (`status`),
  CONSTRAINT `resumes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `resume_files` (
  `file_id` bigint NOT NULL AUTO_INCREMENT,
  `resume_id` bigint NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` enum('pdf','doc','docx') COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` bigint DEFAULT NULL,
  `file_purpose` enum('original','improved','report') COLLATE utf8mb4_unicode_ci DEFAULT 'original',
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`file_id`),
  KEY `idx_files_resume` (`resume_id`),
  CONSTRAINT `resume_files_ibfk_1` FOREIGN KEY (`resume_id`) REFERENCES `resumes` (`resume_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `resume_versions` (
  `version_id` bigint NOT NULL AUTO_INCREMENT,
  `resume_id` bigint NOT NULL,
  `file_id` bigint DEFAULT NULL,
  `version_number` int NOT NULL,
  `version_type` enum('original','improved','manual_edit') COLLATE utf8mb4_unicode_ci DEFAULT 'original',
  `version_notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`version_id`),
  UNIQUE KEY `unique_resume_version` (`resume_id`,`version_number`),
  KEY `file_id` (`file_id`),
  KEY `idx_versions_resume` (`resume_id`),
  CONSTRAINT `resume_versions_ibfk_1` FOREIGN KEY (`resume_id`) REFERENCES `resumes` (`resume_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `resume_versions_ibfk_2` FOREIGN KEY (`file_id`) REFERENCES `resume_files` (`file_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `resume_analyses` (
  `analysis_id` bigint NOT NULL AUTO_INCREMENT,
  `resume_id` bigint NOT NULL,
  `overall_score` decimal(5,2) DEFAULT NULL,
  `analysis_status` enum('pending','processing','completed','failed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `ai_model` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `analysis_result` json DEFAULT NULL,
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `analyzed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`analysis_id`),
  KEY `idx_analysis_resume` (`resume_id`),
  KEY `idx_analysis_date` (`analyzed_at`),
  KEY `idx_analysis_status` (`analysis_status`),
  CONSTRAINT `resume_analyses_ibfk_1` FOREIGN KEY (`resume_id`) REFERENCES `resumes` (`resume_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `resume_scores` (
  `score_id` bigint NOT NULL AUTO_INCREMENT,
  `analysis_id` bigint NOT NULL,
  `overall_score` decimal(5,2) DEFAULT NULL,
  `ats_score` decimal(5,2) DEFAULT NULL,
  `skills_score` decimal(5,2) DEFAULT NULL,
  `experience_score` decimal(5,2) DEFAULT NULL,
  `education_score` decimal(5,2) DEFAULT NULL,
  `projects_score` decimal(5,2) DEFAULT NULL,
  `formatting_score` decimal(5,2) DEFAULT NULL,
  `grammar_score` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`score_id`),
  UNIQUE KEY `analysis_id` (`analysis_id`),
  KEY `idx_scores_analysis` (`analysis_id`),
  CONSTRAINT `resume_scores_ibfk_1` FOREIGN KEY (`analysis_id`) REFERENCES `resume_analyses` (`analysis_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_ats_score` CHECK ((`ats_score` between 0 and 100)),
  CONSTRAINT `chk_overall_score` CHECK ((`overall_score` between 0 and 100)),
  CONSTRAINT `chk_skills_score` CHECK ((`skills_score` between 0 and 100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `resume_suggestions` (
  `suggestion_id` bigint NOT NULL AUTO_INCREMENT,
  `analysis_id` bigint NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `suggestion_type` enum('missing_skill','keyword','grammar','formatting','experience','education','project','summary','general') COLLATE utf8mb4_unicode_ci DEFAULT 'general',
  `original_content` text COLLATE utf8mb4_unicode_ci,
  `suggested_content` text COLLATE utf8mb4_unicode_ci,
  `priority` enum('low','medium','high') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `is_applied` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`suggestion_id`),
  KEY `idx_suggestions_analysis` (`analysis_id`),
  KEY `idx_suggestions_priority` (`priority`),
  CONSTRAINT `resume_suggestions_ibfk_1` FOREIGN KEY (`analysis_id`) REFERENCES `resume_analyses` (`analysis_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `generated_resumes` (
  `generated_id` bigint NOT NULL AUTO_INCREMENT,
  `resume_id` bigint NOT NULL,
  `analysis_id` bigint DEFAULT NULL,
  `file_id` bigint DEFAULT NULL,
  `generated_content` longtext COLLATE utf8mb4_unicode_ci,
  `generation_status` enum('pending','completed','failed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`generated_id`),
  KEY `analysis_id` (`analysis_id`),
  KEY `file_id` (`file_id`),
  KEY `idx_generated_resume` (`resume_id`),
  CONSTRAINT `generated_resumes_ibfk_1` FOREIGN KEY (`resume_id`) REFERENCES `resumes` (`resume_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `generated_resumes_ibfk_2` FOREIGN KEY (`analysis_id`) REFERENCES `resume_analyses` (`analysis_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `generated_resumes_ibfk_3` FOREIGN KEY (`file_id`) REFERENCES `resume_files` (`file_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `job_descriptions` (
  `job_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `job_title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `job_description` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`job_id`),
  KEY `idx_jobs_user` (`user_id`),
  CONSTRAINT `job_descriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `job_matches` (
  `match_id` bigint NOT NULL AUTO_INCREMENT,
  `resume_id` bigint NOT NULL,
  `job_id` bigint NOT NULL,
  `match_score` decimal(5,2) DEFAULT NULL,
  `matched_skills` json DEFAULT NULL,
  `missing_skills` json DEFAULT NULL,
  `match_analysis` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`match_id`),
  KEY `idx_matches_resume` (`resume_id`),
  KEY `idx_matches_job` (`job_id`),
  CONSTRAINT `job_matches_ibfk_1` FOREIGN KEY (`resume_id`) REFERENCES `resumes` (`resume_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `job_matches_ibfk_2` FOREIGN KEY (`job_id`) REFERENCES `job_descriptions` (`job_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `analysis_history` (
  `history_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `resume_id` bigint NOT NULL,
  `analysis_id` bigint DEFAULT NULL,
  `event_type` enum('uploaded','analysis_started','analysis_completed','analysis_failed','improved','downloaded') COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_description` text COLLATE utf8mb4_unicode_ci,
  `event_data` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`history_id`),
  KEY `analysis_id` (`analysis_id`),
  KEY `idx_history_user` (`user_id`),
  KEY `idx_history_resume` (`resume_id`),
  KEY `idx_history_date` (`created_at`),
  CONSTRAINT `analysis_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `analysis_history_ibfk_2` FOREIGN KEY (`resume_id`) REFERENCES `resumes` (`resume_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `analysis_history_ibfk_3` FOREIGN KEY (`analysis_id`) REFERENCES `resume_analyses` (`analysis_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `activity_logs` (
  `log_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `action` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `idx_activity_user` (`user_id`),
  KEY `idx_activity_date` (`created_at`),
  KEY `idx_activity_module` (`module`),
  CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

