
export interface SessionItem {
    id: string;
    label: string;
    lastSeen: number; // timestamp
    positionStr: string;
}

class SessionMemoryService {
    private foundObjects: Map<string, SessionItem> = new Map();

    // Remember an object location
    remember(label: string, positionStr: string) {
        this.foundObjects.set(label.toLowerCase(), {
            id: crypto.randomUUID(),
            label,
            lastSeen: Date.now(),
            positionStr
        });
        console.log(`🧠 Memory: Stored ${label} at ${positionStr}`);
    }

    // Recall an object
    recall(label: string): string | null {
        const item = this.foundObjects.get(label.toLowerCase());
        if (!item) return null;

        // Expire after 5 minutes? (For Demo, keep it simple)
        if (Date.now() - item.lastSeen > 5 * 60 * 1000) {
            this.foundObjects.delete(label.toLowerCase());
            return null;
        }

        return `I previously saw your ${item.label} ${item.positionStr}.`;
    }

    clear() {
        this.foundObjects.clear();
    }
}

export const sessionMemoryService = new SessionMemoryService();
