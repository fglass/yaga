import AppIntents
import Foundation
import SQLite3

@available(iOS 16.0, *)
struct RecentWorkoutEntity: AppEntity {
    static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Workout")
    static var defaultQuery = RecentWorkoutQuery()

    @Property(title: "ID") var id: String
    @Property(title: "Name") var name: String
    @Property(title: "Type") var type: String
    @Property(title: "Started At") var startedAt: Date?
    @Property(title: "Finished At") var finishedAt: Date?
    @Property(title: "Distance") var distance: Double?

    init(
        id: String,
        name: String,
        type: String,
        startedAt: Date?,
        finishedAt: Date?,
        distance: Double?
    ) {
        self.id = id
        self.name = name
        self.type = type
        self.startedAt = startedAt
        self.finishedAt = finishedAt
        self.distance = distance
    }

    var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(title: "\(name)")
    }
}

@available(iOS 16.0, *)
struct RecentWorkoutQuery: EntityQuery {
    func entities(for identifiers: [RecentWorkoutEntity.ID]) async throws -> [RecentWorkoutEntity] {
        return []
    }

    func suggestedEntities() async throws -> [RecentWorkoutEntity] {
        return []
    }
}

@available(iOS 16.0, *)
struct GetRecentWorkoutIntent: AppIntent {
    static var title: LocalizedStringResource = "Get Recent Workout"
    static var description = IntentDescription(
        "Returns all workouts finished within the last hour."
    )

    static var parameterSummary: some ParameterSummary {
        Summary("Get recent workout")
    }

    func perform() async throws -> some IntentResult & ReturnsValue<[RecentWorkoutEntity]> {
        let workout = try RecentWorkoutStore.fetchRecentWorkout()
        return .result(value: workout)
    }
}

@available(iOS 16.0, *)
struct RecentWorkoutShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        return [
            AppShortcut(
                intent: GetRecentWorkoutIntent(),
                phrases: [
                    "Get recent workout in \(.applicationName)",
                    "Recent workout in \(.applicationName)",
                ],
                shortTitle: "Recent Workout",
                systemImageName: "figure.strengthtraining.traditional"
            ),
        ]
    }
}

@available(iOS 16.0, *)
private enum RecentWorkoutStore {
    @available(iOS 16.0, *)
    static func fetchRecentWorkout() throws -> [RecentWorkoutEntity] {
        guard let databasePath = databasePath() else {
            throw RecentWorkoutError.missingDatabaseName
        }

        var db: OpaquePointer?
        if sqlite3_open_v2(databasePath, &db, SQLITE_OPEN_READONLY, nil) != SQLITE_OK {
            if db != nil {
                sqlite3_close(db)
            }
            throw RecentWorkoutError.unableToOpenDatabase
        }

        defer {
            sqlite3_close(db)
        }

        let nowMs = Int64(Date().timeIntervalSince1970 * 1000)
        let thresholdMs = nowMs - (60 * 60 * 1000)
        let query = """
        SELECT id, name, type, started_at, finished_at, distance
        FROM workouts
        WHERE status = 'completed' AND finished_at >= ?
        ORDER BY finished_at DESC
        """

        var statement: OpaquePointer?
        if sqlite3_prepare_v2(db, query, -1, &statement, nil) != SQLITE_OK {
            sqlite3_finalize(statement)
            throw RecentWorkoutError.queryPreparationFailed
        }

        defer {
            sqlite3_finalize(statement)
        }

        sqlite3_bind_int64(statement, 1, thresholdMs)

        var results: [RecentWorkoutEntity] = []
        while sqlite3_step(statement) == SQLITE_ROW {
            let id = readText(statement, index: 0)
            let name = readText(statement, index: 1)
            let type = readText(statement, index: 2)
            let startedAt = readDate(statement, index: 3)
            let finishedAt = readDate(statement, index: 4)
            let distance = readDouble(statement, index: 5)

            results.append(
                RecentWorkoutEntity(
                    id: id,
                    name: name,
                    type: type,
                    startedAt: startedAt,
                    finishedAt: finishedAt,
                    distance: distance
                )
            )
        }

        return results
    }

    @available(iOS 16.0, *)
    private static func databasePath() -> String? {
        let dbName =
            Bundle.main.object(forInfoDictionaryKey: "EXPO_PUBLIC_DB_NAME") as? String

        guard let resolvedName = dbName, !resolvedName.isEmpty else {
            return nil
        }

        guard let documentsDirectory = FileManager.default.urls(
            for: .documentDirectory,
            in: .userDomainMask
        ).first else {
            return nil
        }

        return documentsDirectory
            .appendingPathComponent("SQLite")
            .appendingPathComponent(resolvedName)
            .path
    }

    private static func readText(_ statement: OpaquePointer?, index: Int32) -> String {
        guard let text = sqlite3_column_text(statement, index) else {
            return ""
        }
        return String(cString: text)
    }

    private static func readDate(_ statement: OpaquePointer?, index: Int32) -> Date? {
        if sqlite3_column_type(statement, index) == SQLITE_NULL {
            return nil
        }
        let value = sqlite3_column_int64(statement, index)
        if value <= 0 {
            return nil
        }
        return Date(timeIntervalSince1970: TimeInterval(value) / 1000)
    }

    private static func readDouble(_ statement: OpaquePointer?, index: Int32) -> Double? {
        if sqlite3_column_type(statement, index) == SQLITE_NULL {
            return nil
        }
        return sqlite3_column_double(statement, index)
    }
}

@available(iOS 16.0, *)
private enum RecentWorkoutError: LocalizedError {
    case missingDatabaseName
    case unableToOpenDatabase
    case queryPreparationFailed

    var errorDescription: String? {
        switch self {
        case .missingDatabaseName:
            return "EXPO_PUBLIC_DB_NAME is not set in Info.plist."
        case .unableToOpenDatabase:
            return "Unable to open the workouts database."
        case .queryPreparationFailed:
            return "Failed to prepare the recent workouts query."
        }
    }
}
