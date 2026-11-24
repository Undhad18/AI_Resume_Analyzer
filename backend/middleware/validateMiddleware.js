import { errorResponse } from "../utils/apiResponse.js";

export const validate = (schema) => {
    return (req, res, next) => {

        const result = schema.safeParse(req.body);

        if (!result.success) {

            const errors = result.error.issues.map(
                (issue) => ({
                    field: issue.path.join("."),
                    message: issue.message
                })
            );

            return errorResponse(
                res,
                "Validation failed",
                400,
                errors
            );
        }

        req.validatedBody = result.data;

        next();
    };
};