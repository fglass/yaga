import { createTestDb } from "../database.test.helpers";

describe("sqlite transactions", () => {
    it("serializes concurrent transactions on one connection", async () => {
        await createTestDb(async (_database, sqlite) => {
            const delays = [25, 15, 5, 0];

            await Promise.all(
                delays.map(async (delayMs, index) =>
                    sqlite.runInTransaction(async (db) => {
                        if (delayMs > 0) {
                            await new Promise((resolve) =>
                                setTimeout(resolve, delayMs)
                            );
                        }
                        await db.runAsync(
                            "INSERT INTO schema_version (version) VALUES (?)",
                            100 + index
                        );
                    })
                )
            );

            const db = await sqlite.getDatabase();
            const rows = await db.getAllAsync<{ version: number }>(
                "SELECT version FROM schema_version WHERE version >= 100 ORDER BY version ASC"
            );

            expect(rows.map((row) => row.version)).toEqual([
                100, 101, 102, 103,
            ]);
        });
    });

    it("rolls back failed work and keeps the queue usable", async () => {
        await createTestDb(async (_database, sqlite) => {
            await expect(
                sqlite.runInTransaction(async (db) => {
                    await db.runAsync(
                        "INSERT INTO schema_version (version) VALUES (?)",
                        200
                    );
                    throw new Error("boom");
                })
            ).rejects.toThrow("boom");

            await sqlite.runInTransaction(async (db) => {
                await db.runAsync(
                    "INSERT INTO schema_version (version) VALUES (?)",
                    201
                );
            });

            const db = await sqlite.getDatabase();
            const rows = await db.getAllAsync<{ version: number }>(
                "SELECT version FROM schema_version WHERE version >= 200 ORDER BY version ASC"
            );

            expect(rows.map((row) => row.version)).toEqual([201]);
        });
    });

});
