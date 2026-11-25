import db from "../config/db.js";

export const migrateResumeAnalysesTable = async () => {
    try {
        const [cols] = await db.execute("SHOW COLUMNS FROM resume_analyses LIKE 'user_id'");
        if (cols.length === 0) {
            console.log("Adding user_id column and foreign key to resume_analyses table...");
            await db.execute(`
                ALTER TABLE resume_analyses
                ADD COLUMN user_id bigint NULL AFTER analysis_id,
                ADD KEY idx_analysis_user (user_id),
                ADD CONSTRAINT fk_resume_analyses_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
            `);
            console.log("Migration successful: user_id column added to resume_analyses.");
        } else {
            console.log("Column user_id already present on resume_analyses.");
        }
    } catch (err) {
        // If foreign key already exists or duplicate column, log safely
        if (err.code === "ER_DUP_FIELDNAME" || err.message.includes("Duplicate column")) {
            console.log("Column user_id already exists.");
        } else {
            console.error("Migration error:", err.message);
            throw err;
        }
    }
};

if (process.argv[1]?.includes("migrateResumeAnalyses.js")) {
    migrateResumeAnalysesTable()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

export default migrateResumeAnalysesTable;
