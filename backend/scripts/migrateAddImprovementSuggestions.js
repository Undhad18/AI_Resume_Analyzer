import db from "../config/db.js";

/**
 * Migration: Create resume_improvement_suggestions table (Lesson 7.3)
 */
async function runMigration() {
    console.log("Starting migration: resume_improvement_suggestions table...");

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS resume_improvement_suggestions (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT NOT NULL,
            resume_id BIGINT NOT NULL,
            analysis_id BIGINT NULL,
            generation_mode ENUM('free', 'advanced') NOT NULL DEFAULT 'free',
            suggestions JSON NOT NULL,
            summary TEXT NULL,
            category_counts JSON NULL,
            priority_counts JSON NULL,
            status VARCHAR(50) DEFAULT 'completed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_resume_user (resume_id, user_id),
            INDEX idx_user (user_id),
            INDEX idx_created (created_at),
            CONSTRAINT fk_ris_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
            CONSTRAINT fk_ris_resume FOREIGN KEY (resume_id) REFERENCES resumes(resume_id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    try {
        await db.execute(createTableQuery);
        console.log("Migration successful: resume_improvement_suggestions table created or already exists.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

runMigration();
