import db from "../config/db.js";

/**
 * Migration to create resume_skills_keywords table if not exists
 * Stores detected skills, missing skills, matched & missing keywords, and job description context
 */
export const migrateAddSkillsKeywords = async () => {
    try {
        console.log("Checking if resume_skills_keywords table exists...");
        const [tables] = await db.execute("SHOW TABLES LIKE 'resume_skills_keywords'");
        
        if (tables.length === 0) {
            console.log("Creating resume_skills_keywords table...");
            await db.execute(`
                CREATE TABLE IF NOT EXISTS resume_skills_keywords (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    user_id BIGINT NOT NULL,
                    resume_id BIGINT NOT NULL,
                    analysis_id BIGINT NULL,
                    analysis_mode VARCHAR(20) NOT NULL DEFAULT 'free',
                    detection_mode VARCHAR(30) NOT NULL DEFAULT 'general',
                    detected_skills JSON NOT NULL,
                    missing_skills JSON NULL,
                    matched_keywords JSON NULL,
                    missing_keywords JSON NULL,
                    partial_matches JSON NULL,
                    skill_categories JSON NULL,
                    job_description_snippet TEXT NULL,
                    limitations JSON NULL,
                    status ENUM('completed', 'failed') NOT NULL DEFAULT 'completed',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_user_resume (user_id, resume_id),
                    CONSTRAINT fk_rsk_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                    CONSTRAINT fk_rsk_resume FOREIGN KEY (resume_id) REFERENCES resumes(resume_id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);
            console.log("Table resume_skills_keywords created successfully.");
        } else {
            console.log("Table resume_skills_keywords already exists.");
        }
    } catch (err) {
        console.error("Migration error in migrateAddSkillsKeywords:", err.message);
        throw err;
    }
};

if (process.argv[1]?.includes("migrateAddSkillsKeywords.js")) {
    migrateAddSkillsKeywords()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

export default migrateAddSkillsKeywords;
