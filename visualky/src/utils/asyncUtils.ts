
/**
 * ASYNC UTILITIES FOR RELIABILITY
 * Ensures no operation blocks indefinitely.
 */

export class TimeoutError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TimeoutError';
    }
}

/**
 * Wraps a promise with a timeout.
 * If the promise doesn't resolve within ms, it rejects with TimeoutError.
 */
export async function withTimeout<T>(promise: Promise<T>, ms: number, context: string): Promise<T> {
    const timeout = new Promise<never>((_, reject) => { // Use never to avoid type issues with T
        const id = setTimeout(() => {
            clearTimeout(id);
            reject(new TimeoutError(`Operation '${context}' timed out after ${ms}ms`));
        }, ms);
    });

    // Race the promise against the timeout
    return Promise.race([promise, timeout]);
}

/**
 * reliableWait: Determinisitc wait helper
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
