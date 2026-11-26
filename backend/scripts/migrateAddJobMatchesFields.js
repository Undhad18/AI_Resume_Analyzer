import db from "../config/db.js";

/**
 * Migration: Add fields to job_matches table (Lesson 9.2)
 */
async function runMigration() {
  console.log("Starting migration: job_matches table fields...");

  try {
    const [cols] = await db.execute("DESCRIBE job_matches");
    const colNames = cols.map((c) => c.Field);

    if (!colNames.includes("user_id")) {
      await db.execute("ALTER TABLE job_matches ADD COLUMN user_id BIGINT NULL AFTER match_id");
      await db.execute("ALTER TABLE job_matches ADD CONSTRAINT fk_jm_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE");
      await db.execute("CREATE INDEX idx_matches_user ON job_matches (user_id)");
      console.log("Added column: user_id and index");
    }

    if (!colNames.includes("status")) {
      await db.execute(
        "ALTER TABLE job_matches ADD COLUMN status ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'completed' AFTER job_id"
      );
      console.log("Added column: status");
    }

    if (!colNames.includes("matching_details")) {
      await db.execute("ALTER TABLE job_matches ADD COLUMN matching_details JSON NULL AFTER match_analysis");
      console.log("Added column: matching_details");
    }

    if (!colNames.includes("error_message")) {
      await db.execute("ALTER TABLE job_matches ADD COLUMN error_message TEXT NULL AFTER matching_details");
      console.log("Added column: error_message");
    }

    if (!colNames.includes("updated_at")) {
      await db.execute(
        "ALTER TABLE job_matches ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
      );
      console.log("Added column: updated_at");
    }

    console.log("Migration successful: job_matches table updated.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

runMigration();
