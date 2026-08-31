import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, QueryResult, QueryResultRow } from 'pg';
import { PoolClient } from 'pg';


@Injectable()
export class DatabaseService implements OnModuleDestroy {
  public readonly pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('neon.tech')
        ? { rejectUnauthorized: false }
        : false,
    });
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async serializableTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  let attempt = 0;

  while (true) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err: any) {
      await client.query('ROLLBACK');

      // Postgres error code 40001 = serialization_failure — safe to retry
      if (err.code === '40001' && attempt < maxRetries) {
        attempt++;
        continue;
      }
      throw err;
    } finally {
      client.release();
    }
  }
}
}