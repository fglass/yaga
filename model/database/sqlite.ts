import * as SQLite from "expo-sqlite";
import { MIGRATIONS } from "./migrations";

let dbName = process.env.EXPO_PUBLIC_DB_NAME;

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
let initPromise: Promise<void> | null = null;
let transactionQueue: Promise<void> = Promise.resolve();

export const getDatabase = async () => {
    if (databasePromise == null) {
        if (!dbName) {
            console.error("[database] EXPO_PUBLIC_DB_NAME is unset");
        }
        databasePromise = SQLite.openDatabaseAsync(dbName);
    }
    return databasePromise;
};

export const resetDatabaseConnection = async () => {
    if (databasePromise != null) {
        const db = await databasePromise;
        const closeAsync = (db as { closeAsync?: () => Promise<void> })
            .closeAsync;
        if (closeAsync) {
            await db.closeAsync();
        }
    }
    databasePromise = null;
    initPromise = null;
    transactionQueue = Promise.resolve();
};

export const setDatabaseNameForTests = async (name: string) => {
    dbName = name;
    await resetDatabaseConnection();
};

const getSchemaVersion = async (db: SQLite.SQLiteDatabase) => {
    await db.execAsync(
        "CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)"
    );
    const row = await db.getFirstAsync<{ version: number }>(
        "SELECT version FROM schema_version ORDER BY version DESC LIMIT 1"
    );
    return row?.version ?? 0;
};

const setSchemaVersion = async (db: SQLite.SQLiteDatabase, version: number) => {
    await db.runAsync("DELETE FROM schema_version");
    await db.runAsync(
        "INSERT INTO schema_version (version) VALUES (?)",
        version
    );
};

const runMigrations = async (db: SQLite.SQLiteDatabase) => {
    await db.execAsync("PRAGMA foreign_keys = ON;");
    const currentVersion = await getSchemaVersion(db);

    for (let idx = currentVersion; idx < MIGRATIONS.length; idx += 1) {
        await db.execAsync("BEGIN");
        try {
            await db.execAsync(MIGRATIONS[idx]);
            await db.execAsync("COMMIT");
        } catch (error) {
            await db.execAsync("ROLLBACK");
            throw error;
        }
        await setSchemaVersion(db, idx + 1);
    }
};

export const ensureDatabase = async () => {
    if (initPromise) {
        return initPromise;
    }

    initPromise = (async () => {
        const db = await getDatabase();
        await runMigrations(db);
    })();

    return initPromise;
};

/**
 * Executes a write transaction behind a promise-based mutex on the shared connection.
 * Calls are queued FIFO, and each call runs BEGIN + fn + COMMIT or ROLLBACK before
 * releasing the next queued call.
 */
export const runInTransaction = async <T>(
    fn: (db: SQLite.SQLiteDatabase) => Promise<T>
) => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
        release = resolve;
    });
    const previousTransaction = transactionQueue;
    transactionQueue = previousTransaction
        .catch(() => undefined)
        .then(() => gate);

    await previousTransaction.catch(() => undefined);

    try {
        await ensureDatabase();
        const db = await getDatabase();
        await db.execAsync("BEGIN");
        try {
            const result = await fn(db);
            await db.execAsync("COMMIT");
            return result;
        } catch (error) {
            await db.execAsync("ROLLBACK");
            throw error;
        }
    } finally {
        release();
    }
};
