import { grammarScoreSchema } from "../validators/formattingGrammarScoreSchema.js";

/**
 * Whitelist of common technical terms, frameworks, tools, and acronyms that must NEVER be flagged as spelling errors
 */
const TECHNICAL_WHITELIST = new Set([
    // Languages & Runtimes
    "javascript", "typescript", "python", "java", "golang", "rust", "php", "ruby", "swift",
    "kotlin", "scala", "dart", "bash", "shell", "html", "html5", "css", "css3", "sass", "scss",
    "node", "nodejs", "node.js",

    // Frameworks & Libraries
    "react", "reactjs", "react.js", "vue", "vuejs", "vue.js", "angular", "angularjs", "svelte",
    "next", "nextjs", "next.js", "nuxt", "nuxtjs", "express", "expressjs", "express.js",
    "django", "flask", "fastapi", "spring", "springboot", "spring boot", "laravel", "tailwind",
    "tailwindcss", "bootstrap", "redux", "zustand", "vite", "webpack", "graphql", "rest", "restful",

    // Databases & Storage
    "sql", "nosql", "mysql", "postgresql", "postgres", "psql", "mongodb", "redis", "sqlite",
    "oracle", "mariadb", "cassandra", "dynamodb", "firebase", "supabase", "elasticsearch",

    // Cloud & DevOps
    "aws", "gcp", "azure", "docker", "k8s", "kubernetes", "ci", "cd", "cicd", "ci/cd",
    "jenkins", "terraform", "ansible", "nginx", "linux", "ubuntu", "debian", "centos",

    // Tools & Concepts
    "git", "github", "gitlab", "bitbucket", "jira", "postman", "figma", "vscode", "vs code",
    "api", "apis", "jwt", "oauth", "cors", "csrf", "crud", "agile", "scrum", "microservices",
    "saas", "paas", "sdk", "cli", "orm", "json", "yaml", "xml", "http", "https", "grpc", "websocket"
]);

/**
 * Common resume spelling errors dictionary with suggestions
 */
const COMMON_SPELLING_ERRORS = {
    "expereince": "experience",
    "experiance": "experience",
    "managment": "management",
    "mangement": "management",
    "resposible": "responsible",
    "responsibile": "responsible",
    "proffesional": "professional",
    "profesional": "professional",
    "develper": "developer",
    "devloper": "developer",
    "recieved": "received",
    "acheived": "achieved",
    "achive": "achieve",
    "implmented": "implemented",
    "implment": "implement",
    "enginer": "engineer",
    "colaberate": "collaborate",
    "colaborate": "collaborate",
    "maintainance": "maintenance",
    "succesful": "successful",
    "necesary": "necessary",
    "enviroment": "environment",
    "seperate": "separate",
    "intigrated": "integrated",
    "optmized": "optimized",
    "programing": "programming",
    "referance": "reference",
    "reponsibilities": "responsibilities",
    "leadreship": "leadership",
    "comunication": "communication"
};

/**
 * Common grammar and subject-verb agreement error patterns
 */
const GRAMMAR_ERROR_PATTERNS = [
    {
        regex: /\b(i|he|she|it)\s+(have\s+been|have\s+developed|have\s+led|have\s+managed)\b/i,
        issue: "Subject-Verb Agreement Mismatch",
        explanation: "Singular subject paired with plural auxiliary 'have'.",
        suggest: (match) => match.replace(/\bhave\b/i, "has")
    },
    {
        regex: /\b(they|we)\s+was\b/i,
        issue: "Subject-Verb Agreement Mismatch",
        explanation: "Plural subject paired with singular 'was'.",
        suggest: () => "were"
    },
    {
        regex: /\b(responsible\s+for\s+(develop|manage|create|build|maintain|design))\b/i,
        issue: "Gerund Form Required After Preposition",
        explanation: "Preposition 'for' must be followed by a gerund (-ing form).",
        suggest: (match) => match.replace(/\b(develop|manage|create|build|maintain|design)\b/i, "$1ing")
    },
    {
        regex: /\b(their\s+(is|are|was|were))\b/i,
        issue: "Homophone Confusion (their vs there)",
        explanation: "Possessive pronoun 'their' used instead of existential 'there'.",
        suggest: () => "there"
    },
    {
        regex: /\b(your\s+(a|an|the|going|welcome))\b/i,
        issue: "Homophone Confusion (your vs you're)",
        explanation: "Possessive 'your' used instead of contraction 'you're'.",
        suggest: () => "you're"
    }
];

/**
 * Informal, slang, or weak language patterns
 */
const INFORMAL_PATTERNS = [
    { regex: /\b(lots\s+of|a\s+lot\s+of)\b/i, suggestion: "numerous / extensive / multiple", issue: "Informal Expression" },
    { regex: /\b(tons\s+of)\b/i, suggestion: "substantial / significant volume of", issue: "Colloquial Slang" },
    { regex: /\b(cool|awesome)\b/i, suggestion: "impactful / high-performance / innovative", issue: "Casual Terminology" },
    { regex: /\b(gonna|wanna|kinda)\b/i, suggestion: "formal phrasing", issue: "Contraction / Slang" },
    { regex: /\b(stuff|things)\b/i, suggestion: "deliverables / modules / components", issue: "Imprecise Noun" },
    { regex: /\b(etc\.?|and\s+so\s+on)\b/i, suggestion: "explicitly state the relevant tools", issue: "Vague Trailing List" }
];

/**
 * Wordy fluff phrases with concise alternatives
 */
const CONCISENESS_PATTERNS = [
    { regex: /\bin\s+order\s+to\b/i, suggestion: "to", issue: "Wordy Phrasing" },
    { regex: /\bat\s+this\s+point\s+in\s+time\b/i, suggestion: "currently", issue: "Wordy Phrasing" },
    { regex: /\bdue\s+to\s+the\s+fact\s+that\b/i, suggestion: "because", issue: "Wordy Phrasing" },
    { regex: /\bfor\s+the\s+purpose\s+of\b/i, suggestion: "for / to", issue: "Wordy Phrasing" },
    { regex: /\bwith\s+regard\s+to\b/i, suggestion: "regarding / on", issue: "Wordy Phrasing" }
];

/**
 * 1. Evaluate Spelling Accuracy (Weight: 25%)
 */
export const evaluateSpelling = (rawText = "", structuredResume = {}) => {
    const findings = [];
    const weight = 25;

    if (!rawText || !rawText.trim()) {
        return {
            name: "Spelling Accuracy",
            weight,
            rating: 0,
            earnedPoints: 0,
            explanation: "No text available to evaluate.",
            findings: []
        };
    }

    const words = rawText.match(/\b[A-Za-z'-]+\b/g) || [];
    let typoCount = 0;
    const seenErrors = new Set();

    for (const rawWord of words) {
        const clean = rawWord.toLowerCase();

        // Skip words protected by technical whitelist
        if (TECHNICAL_WHITELIST.has(clean)) continue;

        // Skip single-letter words, roman numerals, or uppercase abbreviations
        if (clean.length <= 2 || rawWord === rawWord.toUpperCase()) continue;

        if (COMMON_SPELLING_ERRORS[clean] && !seenErrors.has(clean)) {
            seenErrors.add(clean);
            typoCount++;
            const suggestion = COMMON_SPELLING_ERRORS[clean];

            findings.push({
                type: "spelling",
                issue: `Spelling Typo: "${rawWord}"`,
                explanation: `Detected likely typo "${rawWord}". Did you mean "${suggestion}"?`,
                evidence: rawWord,
                suggestion: `Replace with "${suggestion}"`,
                severity: "high"
            });
        }
    }

    let rating = 100;
    if (typoCount === 1) rating = 85;
    else if (typoCount === 2) rating = 70;
    else if (typoCount >= 3) rating = Math.max(30, 100 - (typoCount * 18));

    const earnedPoints = Math.round(((rating / 100) * weight) * 10) / 10;
    const explanation = typoCount === 0
        ? "No common spelling mistakes or technical terminology errors detected."
        : `Identified ${typoCount} potential spelling mistake(s). Technical vocabulary is protected.`;

    return {
        name: "Spelling Accuracy",
        weight,
        rating,
        earnedPoints,
        explanation,
        findings
    };
};

/**
 * 2. Evaluate Grammar Correctness (Weight: 25%)
 */
export const evaluateGrammar = (rawText = "", structuredResume = {}) => {
    const findings = [];
    const weight = 25;

    if (!rawText || !rawText.trim()) {
        return {
            name: "Grammar Correctness",
            weight,
            rating: 0,
            earnedPoints: 0,
            explanation: "No text available.",
            findings: []
        };
    }

    let grammarIssuesCount = 0;

    for (const rule of GRAMMAR_ERROR_PATTERNS) {
        const matches = rawText.match(rule.regex);
        if (matches) {
            grammarIssuesCount += matches.length;
            const sampleMatch = matches[0];
            const suggestionText = typeof rule.suggest === "function" ? rule.suggest(sampleMatch) : rule.suggest;

            findings.push({
                type: "grammar",
                issue: rule.issue,
                explanation: rule.explanation,
                evidence: sampleMatch,
                suggestion: `Consider replacing with "${suggestionText}"`,
                severity: "medium"
            });
        }
    }

    let rating = 100;
    if (grammarIssuesCount === 1) rating = 85;
    else if (grammarIssuesCount === 2) rating = 70;
    else if (grammarIssuesCount >= 3) rating = Math.max(30, 100 - (grammarIssuesCount * 16));

    const earnedPoints = Math.round(((rating / 100) * weight) * 10) / 10;
    const explanation = grammarIssuesCount === 0
        ? "Grammar and agreement structures adhere to professional standards."
        : `Found ${grammarIssuesCount} potential grammatical or agreement issue(s).`;

    return {
        name: "Grammar Correctness",
        weight,
        rating,
        earnedPoints,
        explanation,
        findings
    };
};

/**
 * 3. Evaluate Sentence Structure (Weight: 20%)
 */
export const evaluateSentenceStructure = (rawText = "", structuredResume = {}) => {
    const findings = [];
    const weight = 20;

    if (!rawText || !rawText.trim()) {
        return {
            name: "Sentence Structure",
            weight,
            rating: 0,
            earnedPoints: 0,
            explanation: "No text available.",
            findings: []
        };
    }

    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let runOnCount = 0;
    let weakActionVerbCount = 0;

    for (const line of lines) {
        if (/^(?:skills|experience|education|projects|summary)/i.test(line)) continue;

        const words = line.split(/\s+/).filter(Boolean);
        // Run-on check: bullet lines with > 40 words without a semicolon or period
        if (words.length > 40 && !/[;.]\s+/.test(line)) {
            runOnCount++;
            if (runOnCount <= 2) {
                findings.push({
                    type: "style",
                    issue: "Overly Long / Run-On Sentence",
                    explanation: `Line contains ${words.length} words without mid-sentence punctuation.`,
                    evidence: line.slice(0, 80) + "...",
                    suggestion: "Split into two concise sentences or two separate bullet points.",
                    severity: "medium"
                });
            }
        }

        // Weak passive opener check in experience bullets
        if (/^[•\-*]\s+(?:was\s+responsible\s+for|helped\s+with|worked\s+on\s+various|participated\s+in)/i.test(line)) {
            weakActionVerbCount++;
            if (weakActionVerbCount <= 2) {
                findings.push({
                    type: "style",
                    issue: "Passive Bullet Opener",
                    explanation: "Bullet begins with passive phrasing rather than a decisive action verb.",
                    evidence: line.slice(0, 50) + "...",
                    suggestion: "Begin directly with an active verb (e.g., 'Spearheaded', 'Engineered', 'Managed').",
                    severity: "low"
                });
            }
        }
    }

    let rating = 100;
    if (runOnCount > 0) rating -= (runOnCount * 12);
    if (weakActionVerbCount > 0) rating -= (weakActionVerbCount * 8);
    rating = Math.max(30, Math.min(100, rating));

    const earnedPoints = Math.round(((rating / 100) * weight) * 10) / 10;
    const explanation = rating >= 85
        ? "Sentence structure is concise and begins with clear action verbs."
        : "Sentence structure could be enhanced by splitting run-on thoughts and strengthening openers.";

    return {
        name: "Sentence Structure",
        weight,
        rating,
        earnedPoints,
        explanation,
        findings
    };
};

/**
 * 4. Evaluate Professional Language (Weight: 15%)
 */
export const evaluateProfessionalLanguage = (rawText = "", structuredResume = {}) => {
    const findings = [];
    const weight = 15;

    if (!rawText || !rawText.trim()) {
        return {
            name: "Professional Language",
            weight,
            rating: 0,
            earnedPoints: 0,
            explanation: "No text available.",
            findings: []
        };
    }

    let informalCount = 0;

    for (const rule of INFORMAL_PATTERNS) {
        const matches = rawText.match(rule.regex);
        if (matches) {
            informalCount += matches.length;
            findings.push({
                type: "style",
                issue: rule.issue,
                explanation: `Informal phrasing "${matches[0]}" detracts from executive polish.`,
                evidence: matches[0],
                suggestion: `Replace with: ${rule.suggestion}`,
                severity: "medium"
            });
        }
    }

    // Check first-person over-usage in bullets (I, my, me)
    const firstPersonCount = (rawText.match(/\b(I\s+|my\s+|me\s+)/gi) || []).length;
    if (firstPersonCount > 4) {
        informalCount += 2;
        findings.push({
            type: "style",
            issue: "Excessive First-Person Pronouns",
            explanation: `Found ${firstPersonCount} instances of 'I', 'me', or 'my'. Professional resumes conventionally use implied first-person.`,
            suggestion: "Drop first-person pronouns (e.g. write 'Developed payment API' instead of 'I developed payment API').",
            severity: "low"
        });
    }

    let rating = 100;
    if (informalCount === 1) rating = 85;
    else if (informalCount === 2) rating = 70;
    else if (informalCount >= 3) rating = Math.max(30, 100 - (informalCount * 15));

    const earnedPoints = Math.round(((rating / 100) * weight) * 10) / 10;
    const explanation = informalCount === 0
        ? "Tone is professional, executive, and free of colloquial slang."
        : `Identified ${informalCount} instance(s) of casual or informal wording.`;

    return {
        name: "Professional Language",
        weight,
        rating,
        earnedPoints,
        explanation,
        findings
    };
};

/**
 * 5. Evaluate Clarity and Conciseness (Weight: 15%)
 */
export const evaluateClarity = (rawText = "", structuredResume = {}) => {
    const findings = [];
    const weight = 15;

    if (!rawText || !rawText.trim()) {
        return {
            name: "Clarity and Conciseness",
            weight,
            rating: 0,
            earnedPoints: 0,
            explanation: "No text available.",
            findings: []
        };
    }

    let wordyCount = 0;

    for (const rule of CONCISENESS_PATTERNS) {
        const matches = rawText.match(rule.regex);
        if (matches) {
            wordyCount += matches.length;
            findings.push({
                type: "readability",
                issue: rule.issue,
                explanation: `Phrase "${matches[0]}" adds unnecessary word length.`,
                evidence: matches[0],
                suggestion: `Simplify to "${rule.suggestion}"`,
                severity: "low"
            });
        }
    }

    // Check consecutive repeated words (e.g. "the the", "in in")
    const repeatedWordMatches = rawText.match(/\b([A-Za-z]+)\s+\1\b/gi) || [];
    if (repeatedWordMatches.length > 0) {
        for (const dup of repeatedWordMatches) {
            findings.push({
                type: "grammar",
                issue: "Repeated Word Typo",
                explanation: `Accidental duplicate word: "${dup}".`,
                evidence: dup,
                suggestion: `Remove one occurrence of "${dup.split(/\s+/)[0]}"`,
                severity: "medium"
            });
        }
        wordyCount += repeatedWordMatches.length * 2;
    }

    let rating = 100;
    if (wordyCount === 1) rating = 85;
    else if (wordyCount === 2) rating = 70;
    else if (wordyCount >= 3) rating = Math.max(35, 100 - (wordyCount * 12));

    const earnedPoints = Math.round(((rating / 100) * weight) * 10) / 10;
    const explanation = wordyCount === 0
        ? "Prose is crisp, direct, and free of redundant filler phrases."
        : `Identified ${wordyCount} opportunity(ies) to streamline and tighten phrasing.`;

    return {
        name: "Clarity and Conciseness",
        weight,
        rating,
        earnedPoints,
        explanation,
        findings
    };
};

/**
 * PHASE 3: Calculate Complete Grammar Score (0–100)
 * 
 * Internal Weights:
 * 1. Spelling Accuracy: 25%
 * 2. Grammar Correctness: 25%
 * 3. Sentence Structure: 20%
 * 4. Professional Language: 15%
 * 5. Clarity and Conciseness: 15%
 * Total = 100%
 */
export const calculateGrammarScore = ({ rawText = "", structuredResume = {} }) => {
    const spelling = evaluateSpelling(rawText, structuredResume);
    const grammar = evaluateGrammar(rawText, structuredResume);
    const sentenceStructure = evaluateSentenceStructure(rawText, structuredResume);
    const professionalLanguage = evaluateProfessionalLanguage(rawText, structuredResume);
    const clarity = evaluateClarity(rawText, structuredResume);

    const earnedPointsSum =
        spelling.earnedPoints +
        grammar.earnedPoints +
        sentenceStructure.earnedPoints +
        professionalLanguage.earnedPoints +
        clarity.earnedPoints;

    const rating = Math.max(0, Math.min(100, Math.round(earnedPointsSum)));

    const allFindings = [
        ...spelling.findings,
        ...grammar.findings,
        ...sentenceStructure.findings,
        ...professionalLanguage.findings,
        ...clarity.findings
    ];

    const limitations = [
        "Spelling and grammar are evaluated via deterministic pattern matching with technical vocabulary protection. Contextual semantic nuances are evaluated without altering candidate meaning."
    ];

    const status = (!rawText || !rawText.trim())
        ? "not_evaluable"
        : rating < 50 ? "needs_attention" : "evaluated";

    const payload = {
        category: "Grammar & Language",
        rating,
        status,
        parameters: {
            spelling,
            grammar,
            sentenceStructure,
            professionalLanguage,
            clarity
        },
        findings: allFindings,
        limitations
    };

    return grammarScoreSchema.parse(payload);
};

export default {
    evaluateSpelling,
    evaluateGrammar,
    evaluateSentenceStructure,
    evaluateProfessionalLanguage,
    evaluateClarity,
    calculateGrammarScore
};
