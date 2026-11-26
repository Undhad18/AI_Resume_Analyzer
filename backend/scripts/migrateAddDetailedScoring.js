import db from "../config/db.js";

export const migrateAddDetailedScoring = async () => {
    try {
        console.log("Checking resume_scores columns for detailed scoring result...");
        const [cols] = await db.execute("SHOW COLUMNS FROM resume_scores LIKE 'detailed_result'");
        
        if (cols.length === 0) {
            console.log("Adding detailed_result column to resume_scores table...");
            await db.execute(`
                ALTER TABLE resume_scores
                ADD COLUMN detailed_result json NULL AFTER ats_result
            `);
            console.log("Column detailed_result added successfully.");
        } else {
            console.log("Column detailed_result already present in resume_scores.");
        }
    } catch (err) {
        if (err.code === "ER_DUP_FIELDNAME" || err.message.includes("Duplicate column")) {
            console.log("Column already exists.");
        } else {
            console.error("Migration error:", err.message);
            throw err;
        }
    }
};

if (process.argv[1]?.includes("migrateAddDetailedScoring.js")) {
    migrateAddDetailedScoring()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

export default migrateAddDetailedScoring;
