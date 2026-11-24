import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import db from "./config/db.js";

dotenv.config();

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

// Health Check API
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "AI Resume Analyzer API is running"
    });
});

// Database Connection Test
app.get("/api/health", async (req, res) => {
    try {
        await db.query("SELECT 1");

        res.status(200).json({
            success: true,
            message: "Backend and MySQL connected successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});