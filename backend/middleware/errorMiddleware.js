import { errorResponse } from "../utils/apiResponse.js";

export const errorMiddleware = (
    err,
    req,
    res,
    next
) => {
    console.error(err);

    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.statusCode || 500;

    const message =
        statusCode >= 500
            ? "Internal server error"
            : err.message;

    return errorResponse(
        res,
        message,
        statusCode
    );
};