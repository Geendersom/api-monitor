import { Pool, type PoolConfig } from "pg";

let pool: Pool | null = null;

export const createPool = (connectionString: string): Pool => {
  const config: PoolConfig = {
    connectionString,
  };

  return new Pool(config);
};

export const getPool = (): Pool => {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL is required");
    }

    pool = createPool(connectionString);
  }

  return pool;
};

export const setPool = (nextPool: Pool): void => {
  pool = nextPool;
};

export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};
