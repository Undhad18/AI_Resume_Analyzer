/**
 * Skill Normalization Service (Lesson 7.2)
 * Standardizes skill names, manages aliases, assigns controlled categories,
 * and provides safe word-boundary matching.
 */

import { SKILL_CATEGORIES_ENUM } from "../validators/skillsKeywordsSchema.js";

/**
 * Master Skill Dictionary: Normalization map, aliases, and standard categories
 */
export const SKILL_DICTIONARY = {
    // 1. PROGRAMMING LANGUAGES
    "javascript": { normalized: "JavaScript", category: "programming_languages", aliases: ["js", "es6", "vanilla js"] },
    "typescript": { normalized: "TypeScript", category: "programming_languages", aliases: ["ts"] },
    "python": { normalized: "Python", category: "programming_languages", aliases: ["py", "python3"] },
    "java": { normalized: "Java", category: "programming_languages", aliases: ["core java", "java 8", "java 11", "java 17"] },
    "c++": { normalized: "C++", category: "programming_languages", aliases: ["cpp", "cplusplus"] },
    "c#": { normalized: "C#", category: "programming_languages", aliases: ["csharp", "c sharp"] },
    "c": { normalized: "C", category: "programming_languages", aliases: ["c language"] },
    "go": { normalized: "Go", category: "programming_languages", aliases: ["golang"] },
    "ruby": { normalized: "Ruby", category: "programming_languages", aliases: ["rb"] },
    "php": { normalized: "PHP", category: "programming_languages", aliases: ["php7", "php8"] },
    "rust": { normalized: "Rust", category: "programming_languages", aliases: ["rustlang"] },
    "swift": { normalized: "Swift", category: "programming_languages", aliases: ["swiftlang"] },
    "kotlin": { normalized: "Kotlin", category: "programming_languages", aliases: [] },
    "bash": { normalized: "Bash", category: "programming_languages", aliases: ["shell", "shell scripting", "sh"] },
    "dart": { normalized: "Dart", category: "programming_languages", aliases: [] },
    "scala": { normalized: "Scala", category: "programming_languages", aliases: [] },
    "r": { normalized: "R", category: "programming_languages", aliases: ["r language"] },

    // 2. FRONTEND
    "react": { normalized: "React", category: "frontend", aliases: ["react.js", "reactjs", "react framework"] },
    "next.js": { normalized: "Next.js", category: "frontend", aliases: ["nextjs", "next"] },
    "vue": { normalized: "Vue.js", category: "frontend", aliases: ["vue.js", "vuejs"] },
    "angular": { normalized: "Angular", category: "frontend", aliases: ["angularjs", "angular 2+"] },
    "svelte": { normalized: "Svelte", category: "frontend", aliases: ["sveltekit"] },
    "html": { normalized: "HTML5", category: "frontend", aliases: ["html5", "html"] },
    "css": { normalized: "CSS3", category: "frontend", aliases: ["css3", "css"] },
    "tailwind css": { normalized: "Tailwind CSS", category: "frontend", aliases: ["tailwind", "tailwindcss"] },
    "bootstrap": { normalized: "Bootstrap", category: "frontend", aliases: ["bootstrap 5"] },
    "redux": { normalized: "Redux", category: "frontend", aliases: ["redux toolkit", "rtk"] },
    "sass": { normalized: "Sass", category: "frontend", aliases: ["scss"] },
    "jquery": { normalized: "jQuery", category: "frontend", aliases: [] },
    "vite": { normalized: "Vite", category: "frontend", aliases: ["vitejs"] },
    "webpack": { normalized: "Webpack", category: "frontend", aliases: [] },

    // 3. BACKEND
    "node.js": { normalized: "Node.js", category: "backend", aliases: ["nodejs", "node"] },
    "express.js": { normalized: "Express.js", category: "backend", aliases: ["express", "expressjs"] },
    "django": { normalized: "Django", category: "backend", aliases: ["django rest framework", "drf"] },
    "flask": { normalized: "Flask", category: "backend", aliases: [] },
    "fastapi": { normalized: "FastAPI", category: "backend", aliases: [] },
    "spring boot": { normalized: "Spring Boot", category: "backend", aliases: ["spring", "springboot"] },
    "asp.net": { normalized: "ASP.NET", category: "backend", aliases: [".net", "dotnet", ".net core", "asp.net core"] },
    "graphql": { normalized: "GraphQL", category: "backend", aliases: ["apollo graphql"] },
    "rest api": { normalized: "REST API", category: "backend", aliases: ["rest", "restful", "restful api", "restful apis", "rest apis"] },
    "nestjs": { normalized: "NestJS", category: "backend", aliases: ["nest.js"] },
    "laravel": { normalized: "Laravel", category: "backend", aliases: [] },
    "ruby on rails": { normalized: "Ruby on Rails", category: "backend", aliases: ["rails"] },
    "socket.io": { normalized: "Socket.io", category: "backend", aliases: ["websockets"] },
    "grpc": { normalized: "gRPC", category: "backend", aliases: [] },

    // 4. DATABASE
    "postgresql": { normalized: "PostgreSQL", category: "database", aliases: ["postgres", "psql"] },
    "mysql": { normalized: "MySQL", category: "database", aliases: [] },
    "mongodb": { normalized: "MongoDB", category: "database", aliases: ["mongo"] },
    "redis": { normalized: "Redis", category: "database", aliases: [] },
    "sqlite": { normalized: "SQLite", category: "database", aliases: ["sqlite3"] },
    "oracle db": { normalized: "Oracle DB", category: "database", aliases: ["oracle", "oracle database"] },
    "firebase": { normalized: "Firebase", category: "database", aliases: ["firestore"] },
    "supabase": { normalized: "Supabase", category: "database", aliases: [] },
    "elasticsearch": { normalized: "Elasticsearch", category: "database", aliases: ["elastic"] },
    "cassandra": { normalized: "Cassandra", category: "database", aliases: [] },
    "dynamodb": { normalized: "DynamoDB", category: "database", aliases: [] },
    "mariadb": { normalized: "MariaDB", category: "database", aliases: [] },

    // 5. TOOLS
    "git": { normalized: "Git", category: "tools", aliases: [] },
    "github": { normalized: "GitHub", category: "tools", aliases: [] },
    "gitlab": { normalized: "GitLab", category: "tools", aliases: [] },
    "postman": { normalized: "Postman", category: "tools", aliases: [] },
    "jira": { normalized: "Jira", category: "tools", aliases: [] },
    "vs code": { normalized: "VS Code", category: "tools", aliases: ["vscode", "visual studio code"] },
    "figma": { normalized: "Figma", category: "tools", aliases: [] },
    "npm": { normalized: "npm", category: "tools", aliases: ["yarn", "pnpm"] },

    // 6. CLOUD
    "aws": { normalized: "AWS", category: "cloud", aliases: ["amazon web services", "ec2", "s3", "lambda", "cloudfront"] },
    "azure": { normalized: "Azure", category: "cloud", aliases: ["microsoft azure", "azure cloud"] },
    "google cloud": { normalized: "Google Cloud", category: "cloud", aliases: ["gcp", "google cloud platform"] },
    "cloudflare": { normalized: "Cloudflare", category: "cloud", aliases: [] },
    "heroku": { normalized: "Heroku", category: "cloud", aliases: [] },
    "digitalocean": { normalized: "DigitalOcean", category: "cloud", aliases: [] },

    // 7. DEVOPS
    "docker": { normalized: "Docker", category: "devops", aliases: ["containerization", "containers"] },
    "kubernetes": { normalized: "Kubernetes", category: "devops", aliases: ["k8s"] },
    "ci/cd": { normalized: "CI/CD", category: "devops", aliases: ["cicd", "continuous integration", "continuous deployment"] },
    "jenkins": { normalized: "Jenkins", category: "devops", aliases: [] },
    "github actions": { normalized: "GitHub Actions", category: "devops", aliases: ["gh actions"] },
    "terraform": { normalized: "Terraform", category: "devops", aliases: [] },
    "ansible": { normalized: "Ansible", category: "devops", aliases: [] },
    "linux": { normalized: "Linux", category: "devops", aliases: ["unix", "ubuntu"] },
    "nginx": { normalized: "Nginx", category: "devops", aliases: [] },

    // 8. TESTING
    "jest": { normalized: "Jest", category: "testing", aliases: [] },
    "cypress": { normalized: "Cypress", category: "testing", aliases: [] },
    "playwright": { normalized: "Playwright", category: "testing", aliases: [] },
    "selenium": { normalized: "Selenium", category: "testing", aliases: [] },
    "unit testing": { normalized: "Unit Testing", category: "testing", aliases: ["unit tests", "tdd"] },
    "integration testing": { normalized: "Integration Testing", category: "testing", aliases: ["integration tests"] },
    "mocha": { normalized: "Mocha", category: "testing", aliases: [] },
    "chai": { normalized: "Chai", category: "testing", aliases: [] },

    // 9. SOFT SKILLS
    "agile": { normalized: "Agile", category: "soft_skills", aliases: ["agile methodologies", "scrum"] },
    "communication": { normalized: "Communication", category: "soft_skills", aliases: ["verbal communication", "written communication"] },
    "leadership": { normalized: "Leadership", category: "soft_skills", aliases: ["team leadership", "lead"] },
    "problem solving": { normalized: "Problem Solving", category: "soft_skills", aliases: ["analytical skills", "troubleshooting"] },
    "collaboration": { normalized: "Collaboration", category: "soft_skills", aliases: ["teamwork", "cross-functional"] },
    "mentoring": { normalized: "Mentoring", category: "soft_skills", aliases: ["coaching"] },
    "code review": { normalized: "Code Review", category: "soft_skills", aliases: ["peer reviews"] },

    // 10. DOMAIN SKILLS
    "microservices": { normalized: "Microservices", category: "domain_skills", aliases: ["microservices architecture"] },
    "system design": { normalized: "System Design", category: "domain_skills", aliases: ["distributed systems"] },
    "machine learning": { normalized: "Machine Learning", category: "domain_skills", aliases: ["ml", "deep learning", "ai"] },
    "data analysis": { normalized: "Data Analysis", category: "domain_skills", aliases: ["data analytics"] },
    "cybersecurity": { normalized: "Cybersecurity", category: "domain_skills", aliases: ["security", "infosec"] },
    "responsive design": { normalized: "Responsive Design", category: "domain_skills", aliases: ["mobile-first"] },
    "ui/ux": { normalized: "UI/UX", category: "domain_skills", aliases: ["ui design", "ux design", "user interface"] }
};

/**
 * Inverted alias lookup table for O(1) resolution
 */
const ALIAS_MAP = new Map();
for (const [key, entry] of Object.entries(SKILL_DICTIONARY)) {
    ALIAS_MAP.set(key.toLowerCase(), entry);
    ALIAS_MAP.set(entry.normalized.toLowerCase(), entry);
    for (const alias of entry.aliases) {
        ALIAS_MAP.set(alias.toLowerCase(), entry);
    }
}

/**
 * Normalize skill name to standardized form
 * 
 * @param {string} rawSkill
 * @returns {string} Standardized skill name
 */
export const normalizeSkillName = (rawSkill) => {
    if (!rawSkill || typeof rawSkill !== "string") return "";
    const clean = rawSkill.trim().replace(/\s+/g, " ");
    const lower = clean.toLowerCase();

    const matchedEntry = ALIAS_MAP.get(lower);
    if (matchedEntry) {
        return matchedEntry.normalized;
    }

    // Capitalize initial letters if not in dictionary
    return clean
        .split(" ")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
};

/**
 * Get category for a skill (guaranteed to be one of the 10 standard categories)
 * 
 * @param {string} skill
 * @returns {string} Standard category name
 */
export const getSkillCategory = (skill) => {
    if (!skill || typeof skill !== "string") return "domain_skills";
    const lower = skill.trim().toLowerCase();

    const matchedEntry = ALIAS_MAP.get(lower);
    if (matchedEntry && SKILL_CATEGORIES_ENUM.includes(matchedEntry.category)) {
        return matchedEntry.category;
    }

    // Heuristics for unknown skills
    if (/lang|script|code|c\+\+|c\#/i.test(lower)) return "programming_languages";
    if (/css|html|ui|view|front|design/i.test(lower)) return "frontend";
    if (/api|server|back|service|sql/i.test(lower)) return "backend";
    if (/db|data|store|redis|mongo/i.test(lower)) return "database";
    if (/tool|git|cli|editor/i.test(lower)) return "tools";
    if (/cloud|aws|azure|gcp/i.test(lower)) return "cloud";
    if (/devops|docker|k8s|deploy|ci/i.test(lower)) return "devops";
    if (/test|jest|cypress|qa/i.test(lower)) return "testing";
    if (/lead|manage|agile|scrum|team|problem/i.test(lower)) return "soft_skills";

    return "domain_skills";
};

/**
 * Escapes regex special characters safely
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Creates safe, word-boundary regex for a skill to avoid false substring matches.
 * Special care taken for Java vs JavaScript, C, C++, C#, .NET, Go, etc.
 * 
 * @param {string} skillName
 * @returns {RegExp} Safe regular expression
 */
export const buildSkillRegex = (skillName) => {
    const lower = skillName.trim().toLowerCase();

    // Specific boundary cases:
    if (lower === "java") {
        // Match Java but NOT JavaScript
        return /\bjava\b(?!\s*script)/i;
    }
    if (lower === "js") {
        // Match standalone JS, but NOT node.js, next.js, vue.js, etc.
        return /(?<!(?:node|next|vue|react|angular|express|nuxt)\.)\bjs\b/i;
    }
    if (lower === "c") {
        // Match standalone C, but not C++, C#, CSS, or inside words
        return /(?:^|[^a-zA-Z0-9+#])c(?:[^a-zA-Z0-9+#]|$)/i;
    }
    if (lower === "c++" || lower === "cpp") {
        return /\b(c\+\+|cpp)\b/i;
    }
    if (lower === "c#" || lower === "csharp") {
        return /\b(c\#|csharp)\b/i;
    }
    if (lower === ".net" || lower === "dotnet") {
        return /(?:\.net\b|dotnet\b)/i;
    }
    if (lower === "go" || lower === "golang") {
        return /\b(golang|go language)\b|\bgo\b(?!\s*(?:to|through|on|ahead|away|back))/i;
    }
    if (lower === "r") {
        return /\br language\b|(?:^|[^a-zA-Z0-9])r(?:[^a-zA-Z0-9]|$)/i;
    }
    if (lower === "react") {
        // Match React, React.js, ReactJS, but not reactive or reactor
        return /\breact(?:\.js|js)?\b/i;
    }

    // Default multi-word or standard word boundary
    const escaped = escapeRegex(lower);
    return new RegExp(`\\b${escaped}\\b`, "i");
};

/**
 * Determines whether two skill tokens represent the same technical skill
 * 
 * @param {string} skillA
 * @param {string} skillB
 * @returns {boolean}
 */
export const isSkillMatch = (skillA, skillB) => {
    if (!skillA || !skillB) return false;
    const normA = normalizeSkillName(skillA).toLowerCase();
    const normB = normalizeSkillName(skillB).toLowerCase();
    return normA === normB;
};

export default {
    SKILL_DICTIONARY,
    normalizeSkillName,
    getSkillCategory,
    buildSkillRegex,
    isSkillMatch
};
