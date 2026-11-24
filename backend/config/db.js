import mysql from "mysql2/promise";
import { env } from "./env.js";

const db = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    enableKeepAlive: true
});

export const testDatabaseConnection = async () => {
    const connection = await db.getConnection();

    try {
        await connection.query("SELECT 1");
        console.log("MySQL database connected successfully");
    } finally {
        connection.release();
    }
};

export default db;