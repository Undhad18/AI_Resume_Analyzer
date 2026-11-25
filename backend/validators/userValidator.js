import { z } from "zod";

export const updateProfileSchema = z.object({
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
        .min(1, "Email is required")
        .email("Invalid email address")
        .max(191, "Email must not exceed 191 characters")
        .transform((val) => val.toLowerCase())
});
