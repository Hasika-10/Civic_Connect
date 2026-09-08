const path = require('path');
const fs = require('fs');

let adapter = null;

// Normalizes parameters so caller can pass (val1, val2) or ([val1, val2])
function normalizeParams(args) {
  if (args.length === 1 && Array.isArray(args[0])) {
    return args[0];
  }
  return args;
}

// Converts LibSQL/SQLite row to clean plain JavaScript object
function rowToPlainObject(row) {
  if (!row) return undefined;
  if (typeof row !== 'object') return row;
  const obj = {};
  for (const [key, val] of Object.entries(row)) {
    // Convert BigInt to Number if within safe integer range
    if (typeof val === 'bigint') {
      obj[key] = Number(val);
    } else {
      obj[key] = val;
    }
  }
  return obj;
}

function createLibSqlAdapter(url, authToken) {
  const { createClient } = require('@libsql/client');
  const client = createClient({ url, authToken });

  return {
    isRemote: true,
    engine: 'turso',
    prepare(sql) {
      return {
        async get(...args) {
          const params = normalizeParams(args);
          const res = await client.execute({ sql, args: params });
          return res.rows[0] ? rowToPlainObject(res.rows[0]) : undefined;
        },
        async all(...args) {
          const params = normalizeParams(args);
          const res = await client.execute({ sql, args: params });
          return res.rows.map(r => rowToPlainObject(r));
        },
        async run(...args) {
          const params = normalizeParams(args);
          const res = await client.execute({ sql, args: params });
          return {
            changes: res.rowsAffected || 0,
            lastInsertRowid: res.lastInsertRowid !== undefined ? Number(res.lastInsertRowid) : 0
          };
        }
      };
    },
    async exec(sql) {
      if (typeof client.executeMultiple === 'function') {
        return await client.executeMultiple(sql);
      }
      // Fallback: split by semicolon
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      for (const statement of statements) {
        await client.execute(statement);
      }
    },
    pragma(cmd) {
      try {
        return client.execute('PRAGMA ' + cmd);
      } catch (_) {
        return Promise.resolve();
      }
    }
  };
}

function createLocalSqliteAdapter(filePath) {
  let Database;
  try {
    Database = require('better-sqlite3');
  } catch (_) {
    const { DatabaseSync } = require('node:sqlite');
    Database = function(f) {
      const s = new DatabaseSync(f);
      s.pragma = (cmd) => {
        try { s.exec('PRAGMA ' + cmd); } catch (_) {}
      };
      return s;
    };
  }

  const rawDb = new Database(filePath);
  if (typeof rawDb.pragma === 'function') {
    rawDb.pragma('journal_mode = WAL');
    rawDb.pragma('foreign_keys = ON');
  }

  return {
    isRemote: false,
    engine: 'sqlite',
    rawDb,
    prepare(sql) {
      let stmt;
      try {
        stmt = rawDb.prepare(sql);
      } catch (err) {
        console.error('SQL Prepare Error:', sql, err.message);
        throw err;
      }
      return {
        async get(...args) {
          const params = normalizeParams(args);
          const row = stmt.get(...params);
          return row ? rowToPlainObject(row) : undefined;
        },
        async all(...args) {
          const params = normalizeParams(args);
          const rows = stmt.all(...params);
          return (rows || []).map(r => rowToPlainObject(r));
        },
        async run(...args) {
          const params = normalizeParams(args);
          const res = stmt.run(...params);
          return {
            changes: res.changes || 0,
            lastInsertRowid: res.lastInsertRowid !== undefined ? Number(res.lastInsertRowid) : 0
          };
        }
      };
    },
    async exec(sql) {
      return rawDb.exec(sql);
    },
    pragma(cmd) {
      if (typeof rawDb.pragma === 'function') {
        return rawDb.pragma(cmd);
      }
      return rawDb.exec('PRAGMA ' + cmd);
    }
  };
}

function getDb() {
  if (adapter) return adapter;

  // 1. If TURSO_DATABASE_URL is provided, use Turso cloud LibSQL
  if (process.env.TURSO_DATABASE_URL) {
    console.log('🔗 Connecting to Turso persistent cloud database');
    adapter = createLibSqlAdapter(
      process.env.TURSO_DATABASE_URL,
      process.env.TURSO_AUTH_TOKEN
    );
    return adapter;
  }

  // 2. If running on Vercel without Turso credentials (zero-config preview), use /tmp/civicconnect.db
  if (process.env.VERCEL) {
    const tmpDbPath = path.join('/tmp', 'civicconnect.db');
    console.log('⚡ Vercel serverless environment detected (using /tmp database)');
    adapter = createLocalSqliteAdapter(tmpDbPath);
    return adapter;
  }

  // 3. Local Development: Use ./civicconnect.db
  const defaultPath = path.join(__dirname, '..', '..', 'civicconnect.db');
  adapter = createLocalSqliteAdapter(defaultPath);
  return adapter;
}

module.exports = {
  getDb,
  normalizeParams,
  rowToPlainObject
};
