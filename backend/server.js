import app from "./app.js";

import { env } from "./config/env.js";

import {
    testDatabaseConnection
} from "./config/db.js";

import db from "./config/db.js";

const startServer = async () => {

    try {

        // Verify database connection
        await testDatabaseConnection();

        // Start Express server
        const server = app.listen(
            env.PORT,
            () => {
                console.log(
                    `AI Resume Analyzer running on port ${env.PORT}`
                );
            }
        );

        const shutdown = (signal) => {
            console.log(`${signal} received. Shutting down...`);

            server.close(async () => {
                await db.end();

                console.log("Server closed successfully");

                process.exit(0);
            });
        };

        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));

    } catch (error) {

        console.error(
            "Server startup failed:",
            error.message
        );

        await db.end();

        process.exit(1);
    }
};

startServer();