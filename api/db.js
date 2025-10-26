import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === "production";

export const isDatabaseConfigured = Boolean(connectionString);

let pool;

if (isDatabaseConfigured) {
  const poolKey = Symbol.for("network-event-db-pool");
  const globalScope = globalThis;

  if (!globalScope[poolKey]) {
    globalScope[poolKey] = new Pool({
      connectionString,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 5_000,
    });
  }

  pool = globalScope[poolKey];
}

export async function queryDatabase(text, params = []) {
  if (!pool) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }

  let client;
  try {
    client = await pool.connect();
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error("Database query failed:", error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}
