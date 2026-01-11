
/**
 * LEARNING MODULE - Captures user feedback to improve intelligence
 */

export class LearningModule {
    private learnedFailures: string[] = [];
    private knownObjects: Set<string> = new Set();

    // ACTION 1: Personal Object Exemplars
    async learnObject(name: string, _imageData: string): Promise<string> {
        this.knownObjects.add(name);
        // In real app: Store embedding in IndexedDB
        console.log(`🧠 Learned new personal object: ${name}`);
        return `I have learned what your ${name} looks like.`;
    }

    // ACTION 2: Failure-Driven Learning
    async reportFailure(description: string): Promise<string> {
        this.learnedFailures.push(description);
        // In real app: Update prompt weights
        console.log(`🧠 Learned from failure: ${description}`);
        return "Thank you. I have updated my logic to avoid this mistake.";
    }

    getFailures(): string[] {
        return this.learnedFailures;
    }

    getKnownObjects(): string[] {
        return Array.from(this.knownObjects);
    }
}

export const learningModule = new LearningModule();
