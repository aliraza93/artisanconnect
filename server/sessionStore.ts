import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PgStore = connectPg(session);

export const sessionStore = new PgStore({
  pool,
  tableName: "session",
  createTableIfMissing: true,
});
