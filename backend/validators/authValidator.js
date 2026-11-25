import { z } from "zod";

export const registerSchema = z.object({
    fullName: z
        .string({
            required_error: "Full name is required",
            invalid_type_error: "Full name must be a string"
        })
        .trim()
        .min(2, "Full name must be at least 2 characters")
        .max(150, "Full name must not exceed 150 characters"),

    email: z
        .string({
            required_error: "Email is required",
            invalid_type_error: "Email must be a string"
        })
        .trim()
        .email("Invalid email address")
        .max(191, "Email must not exceed 191 characters")
        .transform((val) => val.toLowerCase()),

    password: z
        .string({
            required_error: "Password is required",
            invalid_type_error: "Password must be a string"
        })
        .min(8, "Password must be at least 8 characters")
        .max(72, "Password must not exceed 72 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),

    confirmPassword: z
        .string({
            required_error: "Password confirmation is required",
            invalid_type_error: "Password confirmation must be a string"
        })
}).refine(
    (data) => data.password === data.confirmPassword,
    {
        message: "Passwords do not match",
        path: ["confirmPassword"]
    }
);

export const loginSchema = z.object({
    email: z
        .string({
            required_error: "Email is required",
            invalid_type_error: "Email must be a string"
        })
        .trim()
        .min(1, "Email is required")
        .email("Invalid email address")
        .max(191, "Email must not exceed 191 characters")
        .transform((val) => val.toLowerCase()),

    password: z
        .string({
            required_error: "Password is required",
            invalid_type_error: "Password must be a string"
        })
        .min(1, "Password is required")
});
