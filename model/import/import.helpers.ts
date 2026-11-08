export const normalizeExerciseName = (name: string): string => {
    const sanitized = name
        .replace(/[()]/g, " ")
        .replace(/[._-]+/g, " ")
        .replace(/[^a-zA-Z0-9\s]/g, " ")
        .toLowerCase()
        .trim();
    return sanitized.replace(/\s+/g, " ");
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

export const buildHeaderMap = (header: string[]): Record<string, number> => {
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
