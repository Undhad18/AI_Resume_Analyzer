import db from "../config/db.js";

export const migrateAddAnalysisType = async () => {
    try {
        const [cols] = await db.execute("SHOW COLUMNS FROM resume_analyses LIKE 'analysis_type'");
        if (cols.length === 0) {
            console.log("Adding analysis_type column to resume_analyses table...");
            await db.execute(`
                ALTER TABLE resume_analyses
                ADD COLUMN analysis_type VARCHAR(30) NOT NULL DEFAULT 'ai' AFTER analysis_status,
                ADD KEY idx_analysis_type (analysis_type)
            `);
            console.log("Migration successful: analysis_type column added to resume_analyses.");
        } else {
            console.log("Column analysis_type already present on resume_analyses.");
        }
    } catch (err) {
        if (err.code === "ER_DUP_FIELDNAME" || err.message.includes("Duplicate column")) {
            console.log("Column analysis_type already exists.");
        } else {
            console.error("Migration error:", err.message);
            throw err;
        }
    }
};

if (process.argv[1]?.includes("migrateAddAnalysisType.js")) {
    migrateAddAnalysisType()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

export default migrateAddAnalysisType;
