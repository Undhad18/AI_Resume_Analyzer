import db from "../config/db.js";

/**
 * Migration: Create or update job_descriptions table (Lesson 9.1)
 */
async function runMigration() {
  console.log("Starting migration: job_descriptions table...");

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS job_descriptions (
      job_id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      job_title VARCHAR(255) NOT NULL,
      company_name VARCHAR(255) NULL,
      experience_required VARCHAR(100) NULL,
      location VARCHAR(255) NULL,
      job_description MEDIUMTEXT NOT NULL,
      source_url VARCHAR(500) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_jd_user (user_id),
      INDEX idx_jd_created (created_at),
      INDEX idx_jd_title (job_title),
      INDEX idx_jd_company (company_name),
      CONSTRAINT fk_jd_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await db.execute(createTableQuery);

    // Verify and add any missing columns for backwards compatibility
    const [cols] = await db.execute("DESCRIBE job_descriptions");
    const colNames = cols.map((c) => c.Field);

    if (!colNames.includes("experience_required")) {
      await db.execute("ALTER TABLE job_descriptions ADD COLUMN experience_required VARCHAR(100) NULL");
      console.log("Added column: experience_required");
    }
    if (!colNames.includes("location")) {
      await db.execute("ALTER TABLE job_descriptions ADD COLUMN location VARCHAR(255) NULL");
      console.log("Added column: location");
    }
    if (!colNames.includes("source_url")) {
      await db.execute("ALTER TABLE job_descriptions ADD COLUMN source_url VARCHAR(500) NULL");
      console.log("Added column: source_url");
    }
    if (!colNames.includes("updated_at")) {
      await db.execute("ALTER TABLE job_descriptions ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
      console.log("Added column: updated_at");
    }

    console.log("Migration successful: job_descriptions table verified and up to date.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

runMigration();
