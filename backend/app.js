import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { csrfProtection } from "./middleware/csrfMiddleware.js";

import { env } from "./config/env.js";

import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import userRoutes from "./routes/userRoutes.js";

import {
    notFoundMiddleware
} from "./middleware/notFoundMiddleware.js";

import {
    errorMiddleware
} from "./middleware/errorMiddleware.js";

const app = express();

// Security
app.use(helmet());

// CORS
app.use(cors({
    origin: env.CLIENT_URL,
    credentials: true
}));

// Body parsing
app.use(express.json({
    limit: "1mb"
}));

app.use(express.urlencoded({
    extended: true,
    limit: "1mb"
}));

// Cookie parsing
app.use(cookieParser());

// CSRF Protection
app.use(csrfProtection);

// Request logging
if (env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

// API Routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);

// 404 Handler
app.use(notFoundMiddleware);

// Global Error Handler
app.use(errorMiddleware);

export default app;