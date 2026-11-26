import db from "../config/db.js";

/**
 * Migration: Create resume_enhancement_drafts table (Lesson 7.4)
 */
async function runMigration() {
    console.log("Starting migration: resume_enhancement_drafts table...");

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS resume_enhancement_drafts (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT NOT NULL,
            resume_id BIGINT NOT NULL,
            version_id BIGINT NULL,
            enhancement_mode ENUM('free', 'advanced') NOT NULL DEFAULT 'free',
            scope ENUM('full_resume', 'single_section') NOT NULL DEFAULT 'full_resume',
            section_name VARCHAR(100) NULL,
            original_content JSON NOT NULL,
            enhanced_content JSON NOT NULL,
            changes_summary TEXT NULL,
            status ENUM('draft', 'approved', 'discarded') NOT NULL DEFAULT 'draft',
            approved_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_resume_user (resume_id, user_id),
            INDEX idx_user (user_id),
            INDEX idx_status (status),
            INDEX idx_created (created_at),
            CONSTRAINT fk_red_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
            CONSTRAINT fk_red_resume FOREIGN KEY (resume_id) REFERENCES resumes(resume_id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    try {
        await db.execute(createTableQuery);
        console.log("Migration successful: resume_enhancement_drafts table created or already exists.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

runMigration();
