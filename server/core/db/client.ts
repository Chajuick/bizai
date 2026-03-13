// server/core/db/client.ts

// #region Imports
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

import * as schema from "../../../drizzle/schema";
import { ENV } from "../env/env";
import { logger } from "../logger";
// #endregion


// #region Types

export type DbClient = MySql2Database<typeof schema>;

// #endregion


// #region Singleton

let _db: DbClient | null = null;
let _pool: mysql.Pool | null = null;

// #endregion


// #region Helpers

function parseDbHost(url: string) {
  try {
    const u = new URL(url);
    return {
      host: u.hostname,
      port: u.port || "3306",
      database: u.pathname.replace("/", ""),
    };
  } catch {
    return null;
  }
}

// #endregion


// #region Factory

export function getDb(): DbClient {

  if (_db) return _db;

  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("[DB] DATABASE_URL is not configured.");
  }

  const dbInfo = parseDbHost(url);

  logger.info(
    {
      host: dbInfo?.host,
      port: dbInfo?.port,
      database: dbInfo?.database,
      poolSize: ENV.dbPoolSize,
    },
    "[DB] creating connection pool",
  );

  _pool = mysql.createPool({
    uri: url,
    connectionLimit: ENV.dbPoolSize,
    waitForConnections: true,
    queueLimit: 0,
    timezone: "+00:00",
  });

  /**
   * DB Health Check
   * 서버 시작 시 DB 연결 테스트
   */
  _pool
    .getConnection()
    .then((conn) => {

      logger.info("[DB] connection established");

      conn.release();

    })
    .catch((err) => {

      logger.error(
        {
          code: err.code,
          message: err.message,
        },
        "[DB] connection failed",
      );

    });

  _db = drizzle(_pool, {
    schema,
    mode: "default",
  });

  return _db;
}

/**
 * raw mysql pool 접근
 */
export function getPool(): mysql.Pool {

  if (!_pool) {
    getDb();
  }

  if (!_pool) {
    throw new Error("[DB] Pool is not initialized.");
  }

  return _pool;
}

// #endregion