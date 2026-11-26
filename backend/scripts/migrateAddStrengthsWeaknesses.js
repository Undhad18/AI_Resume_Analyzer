import db from "../config/db.js";

/**
 * Migration to create resume_strengths_weaknesses table if not exists
 * Stores strengths, weaknesses, missing information, analysis mode, and analysis status
 */
export const migrateAddStrengthsWeaknesses = async () => {
    try {
        console.log("Checking if resume_strengths_weaknesses table exists...");
        const [tables] = await db.execute("SHOW TABLES LIKE 'resume_strengths_weaknesses'");
        
        if (tables.length === 0) {
            console.log("Creating resume_strengths_weaknesses table...");
            await db.execute(`
                CREATE TABLE IF NOT EXISTS resume_strengths_weaknesses (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    user_id BIGINT NOT NULL,
                    resume_id BIGINT NOT NULL,
                    analysis_id BIGINT NULL,
                    analysis_mode VARCHAR(20) NOT NULL DEFAULT 'free',
                    analysis_type VARCHAR(50) NOT NULL DEFAULT 'strengths_weaknesses',
                    strengths_result JSON NOT NULL,
                    weaknesses_result JSON NOT NULL,
                    missing_info_result JSON NULL,
                    status ENUM('completed', 'failed') NOT NULL DEFAULT 'completed',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_user_resume (user_id, resume_id),
                    CONSTRAINT fk_rsw_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                    CONSTRAINT fk_rsw_resume FOREIGN KEY (resume_id) REFERENCES resumes(resume_id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);
            console.log("Table resume_strengths_weaknesses created successfully.");
        } else {
            console.log("Table resume_strengths_weaknesses already exists.");
        }
    } catch (err) {
        console.error("Migration error in migrateAddStrengthsWeaknesses:", err.message);
        throw err;
    }
};

if (process.argv[1]?.includes("migrateAddStrengthsWeaknesses.js")) {
    migrateAddStrengthsWeaknesses()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

export default migrateAddStrengthsWeaknesses;
