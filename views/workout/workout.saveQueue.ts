type AsyncTask<T> = (value: T) => Promise<void>;

export const createLatestTaskQueue = <T>(task: AsyncTask<T>) => {
    let queue = Promise.resolve();
    let latest: T | null = null;

    const schedule = () => {
        queue = queue
            .catch(() => undefined)
            .then(async () => {
                while (latest !== null) {
                    const nextValue = latest;
                    latest = null;
                    await task(nextValue);
                }
            });
        return queue;
    };

    const enqueue = (value: T) => {
        latest = value;
        return schedule();
    };

    const flush = async () => {
        await queue.catch(() => undefined);
        if (latest !== null) {
            await schedule().catch(() => undefined);
        }
        await queue.catch(() => undefined);
    };

    return { enqueue, flush };
};
