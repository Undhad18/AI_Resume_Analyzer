import db from "../config/db.js";

export const migrateAddAtsScoreDetails = async () => {
    try {
        console.log("Checking resume_scores columns for ATS details...");
        const [cols] = await db.execute("SHOW COLUMNS FROM resume_scores LIKE 'ats_rating_label'");
        
        if (cols.length === 0) {
            console.log("Adding ATS scoring columns to resume_scores table...");
            await db.execute(`
                ALTER TABLE resume_scores
                ADD COLUMN user_id bigint NULL AFTER analysis_id,
                ADD COLUMN resume_id bigint NULL AFTER user_id,
                ADD COLUMN ats_rating_label varchar(50) NULL AFTER ats_score,
                ADD COLUMN ats_result json NULL AFTER grammar_score,
                ADD COLUMN scoring_version varchar(20) NOT NULL DEFAULT '1.0.0' AFTER ats_result,
                ADD COLUMN scored_at timestamp NULL DEFAULT CURRENT_TIMESTAMP AFTER scoring_version,
                ADD KEY idx_scores_user (user_id),
                ADD KEY idx_scores_resume (resume_id)
            `);
            console.log("Columns added successfully.");

            // Backfill user_id and resume_id from resume_analyses for existing records
            console.log("Backfilling user_id and resume_id from resume_analyses...");
            await db.execute(`
                UPDATE resume_scores rs
                JOIN resume_analyses ra ON rs.analysis_id = ra.analysis_id
                SET rs.user_id = ra.user_id,
                    rs.resume_id = ra.resume_id
                WHERE rs.resume_id IS NULL
            `);
            console.log("Backfill completed.");
        } else {
            console.log("ATS score columns already present in resume_scores.");
        }
    } catch (err) {
        if (err.code === "ER_DUP_FIELDNAME" || err.message.includes("Duplicate column")) {
            console.log("Columns already exist.");
        } else {
            console.error("Migration error:", err.message);
            throw err;
        }
    }
};

if (process.argv[1]?.includes("migrateAddAtsScoreDetails.js")) {
    migrateAddAtsScoreDetails()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

export default migrateAddAtsScoreDetails;
