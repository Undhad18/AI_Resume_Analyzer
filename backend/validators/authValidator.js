import { z } from "zod";

export const registerSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(150),

    email: z
        .string()
        .trim()
        .email("Invalid email address")
        .max(191),

    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(72),

    confirmPassword: z.string()
}).refine(
    (data) => data.password === data.confirmPassword,
    {
        message: "Passwords do not match",
        path: ["confirmPassword"]
    }
);