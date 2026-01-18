import { ExerciseDef } from "../types";

export const normalizeExerciseName = (name: string): string => {
    const sanitized = name
        .replace(/[()]/g, " ")
        .replace(/[._-]+/g, " ")
        .replace(/[^a-zA-Z0-9\s]/g, " ")
        .toLowerCase()
        .trim();
    return sanitized.replace(/\s+/g, " ");
};

export const matchExerciseName = (
    exerciseName: string,
    exerciseDefs: Record<string, ExerciseDef>
): string | null => {
    const normalized = normalizeForMatch(exerciseName);
    const entries = Object.entries(exerciseDefs);

    for (const [id, def] of entries) {
        if (normalizeForMatch(def.name) === normalized) {
            return id;
        }
    }

    return null;
};

export const suggestExerciseMatches = (
    exerciseName: string,
    exerciseDefs: Record<string, ExerciseDef>
): Array<{ id: string; name: string }> => {
    const targetTokens = tokenizeExercise(exerciseName);
    if (targetTokens.size === 0) {
        return [];
    }

    const scored = Object.entries(exerciseDefs)
        .map(([id, def]) => {
            const candidateTokens = tokenizeExercise(def.name);
            const score = jaccard(targetTokens, candidateTokens);
            return {
                id,
                name: def.name,
                score,
                overlap: intersectCount(targetTokens, candidateTokens),
            };
        })
        .filter((entry) => {
            const exact =
                normalizeForMatch(entry.name) === normalizeForMatch(exerciseName);
            return exact || entry.overlap >= 1;
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);

    return scored.map(({ id, name }) => ({ id, name }));
};

export const parseCsv = (text: string): string[][] => {
    const rows: string[][] = [];
    let current: string[] = [];
    let value = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        const next = text[i + 1];

        if (inQuotes) {
            if (char === '"' && next === '"') {
                value += '"';
                i += 1;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                value += char;
            }
            continue;
        }

        if (char === '"') {
            inQuotes = true;
            continue;
        }

        if (char === ",") {
            current.push(value);
            value = "";
            continue;
        }

        if (char === "\n") {
            current.push(value);
            rows.push(current);
            current = [];
            value = "";
            continue;
        }

        if (char === "\r") {
            continue;
        }

        value += char;
    }

    current.push(value);
    if (current.length > 1 || current[0].trim() !== "") {
        rows.push(current);
    }

    return rows;
};

export const buildHeaderMap = (
    header: string[]
): Record<string, number> => {
    return header.reduce<Record<string, number>>((acc, value, index) => {
        acc[value.trim()] = index;
        return acc;
    }, {});
};

export const getColumn = (
    row: string[],
    map: Record<string, number>,
    key: string
): string => {
    const index = map[key];
    if (index == null) {
        return "";
    }
    return row[index]?.trim() ?? "";
};

export const parseStrongDate = (value: string): Date | null => {
    const match = value.match(
        /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/
    );
    if (!match) {
        return null;
    }

    const [, year, month, day, hour, minute, second] = match;
    const date = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
    );

    return Number.isNaN(date.getTime()) ? null : date;
};

export const parseDurationSeconds = (value: string): number | null => {
    if (!value) {
        return null;
    }

    const hourMatch = value.match(/(\d+)h/);
    const minuteMatch = value.match(/(\d+)m/);

    const hours = hourMatch ? Number(hourMatch[1]) : 0;
    const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;

    if (hours === 0 && minutes === 0) {
        return null;
    }

    return hours * 3600 + minutes * 60;
};

export const parseNumberOrNull = (value: string): number | null => {
    if (!value) {
        return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};

const tokenizeExercise = (name: string): Set<string> => {
    const tokens = normalizeExerciseName(name)
        .split(" ")
        .filter(Boolean);
    return new Set(tokens);
};

const normalizeForMatch = (name: string): string => {
    const normalized = normalizeExerciseName(name);
    const tokens = normalized
        .split(" ")
        .filter(Boolean);
    return tokens.join(" ");
};

const jaccard = (a: Set<string>, b: Set<string>): number => {
    if (a.size === 0 || b.size === 0) {
        return 0;
    }

    let intersection = 0;
    a.forEach((token) => {
        if (b.has(token)) {
            intersection += 1;
        }
    });

    const union = a.size + b.size - intersection;
    return union === 0 ? 0 : intersection / union;
};

const intersectCount = (a: Set<string>, b: Set<string>): number => {
    let count = 0;
    a.forEach((token) => {
        if (b.has(token)) {
            count += 1;
        }
    });
    return count;
};
