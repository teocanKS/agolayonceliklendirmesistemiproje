import mysql from "mysql2/promise";

const connectionString = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === "production";

export const isDatabaseConfigured = Boolean(connectionString);

let pool;

if (isDatabaseConfigured) {
  const poolKey = Symbol.for("network-event-db-pool");
  const globalScope = globalThis;

  if (!globalScope[poolKey]) {
    // Parse DATABASE_URL if it's a full URL string (mysql://user:pass@host:port/database)
    // or create pool from individual env vars
    try {
      if (connectionString.startsWith("mysql://")) {
        const url = new URL(connectionString);
        globalScope[poolKey] = mysql.createPool({
          host: url.hostname,
          port: url.port || 3306,
          user: url.username,
          password: url.password,
          database: url.pathname.slice(1), // Remove leading slash
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          enableKeepAlive: true,
          keepAliveInitialDelay: 0,
          ssl: isProduction ? { rejectUnauthorized: false } : undefined,
        });
      } else {
        // Direct connection string or connection options
        globalScope[poolKey] = mysql.createPool({
          uri: connectionString,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          enableKeepAlive: true,
          keepAliveInitialDelay: 0,
          ssl: isProduction ? { rejectUnauthorized: false } : undefined,
        });
      }
    } catch (error) {
      console.error("Failed to create MySQL pool:", error);
      throw error;
    }
  }

  pool = globalScope[poolKey];
}

export async function queryDatabase(text, params = []) {
  if (!pool) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(text, params);
    return { rows };
  } catch (error) {
    console.error("Database query failed:", error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
