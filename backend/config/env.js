import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
    PORT: z.coerce.number().default(5000),

    NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development"),

    CLIENT_URL: z.string().url(),

    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().default(3306),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string(),
    DB_NAME: z.string().min(1),

    JWT_SECRET: z.string().min(32),

    OPENAI_API_KEY: z.string().optional(),

    OPENAI_MODEL: z.string().optional()
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
    console.error(
        "Environment configuration error:",
        result.error.flatten().fieldErrors
    );

    process.exit(1);
}

export const env = result.data;