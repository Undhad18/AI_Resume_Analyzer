import db from "../config/db.js";

export const migrateAddFormattingGrammarScoring = async () => {
    try {
        console.log("Checking resume_scores columns for formatting and grammar details...");
        const [formattingCols] = await db.execute("SHOW COLUMNS FROM resume_scores LIKE 'formatting_result'");
        
        if (formattingCols.length === 0) {
            console.log("Adding formatting_result and grammar_result columns to resume_scores table...");
            await db.execute(`
                ALTER TABLE resume_scores
                ADD COLUMN formatting_result json NULL AFTER detailed_result,
                ADD COLUMN grammar_result json NULL AFTER formatting_result,
                ADD COLUMN analysis_mode varchar(20) NOT NULL DEFAULT 'free' AFTER grammar_result
            `);
            console.log("Columns formatting_result, grammar_result, analysis_mode added successfully.");
        } else {
            console.log("Columns already present in resume_scores.");
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

if (process.argv[1]?.includes("migrateAddFormattingGrammarScoring.js")) {
    migrateAddFormattingGrammarScoring()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

export default migrateAddFormattingGrammarScoring;
