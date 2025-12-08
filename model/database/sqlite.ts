import * as SQLite from "expo-sqlite";
import { isUsingExpoDevClient } from "../../util";

const DB_NAME = isUsingExpoDevClient() ? "yaga-dev.db" : "yaga.db";
const TABLE_NAME = "kv_store";

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
let initPromise: Promise<void> | null = null;

const getDatabase = async () => {
    if (databasePromise == null) {
        databasePromise = SQLite.openDatabaseAsync(DB_NAME);
    }
    return databasePromise;
};

export const ensureDatabase = async () => {
    if (initPromise) {
        return initPromise;
    }

    initPromise = (async () => {
        const db = await getDatabase();
        await db.execAsync(
            `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
                key TEXT PRIMARY KEY NOT NULL,
                value TEXT NOT NULL
            )`
        );
    })();

    return initPromise;
};

export const getValue = async (key: string) => {
    await ensureDatabase();
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
        `SELECT value FROM ${TABLE_NAME} WHERE key = ? LIMIT 1`,
        key
    );
    return row?.value ?? null;
};

export const setValue = async (key: string, value: string) => {
    await ensureDatabase();
    const db = await getDatabase();
    await db.runAsync(
        `INSERT OR REPLACE INTO ${TABLE_NAME} (key, value) VALUES (?, ?)`,
        key,
        value
    );
};

export const getAllEntries = async () => {
    await ensureDatabase();
    const db = await getDatabase();
    return await db.getAllAsync<{ key: string; value: string }>(
        `SELECT key, value FROM ${TABLE_NAME} ORDER BY key`
    );
};

export const clearAllEntries = async () => {
    await ensureDatabase();
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM ${TABLE_NAME}`);
};
