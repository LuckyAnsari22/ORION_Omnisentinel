
/**
 * CONTEXT-AWARE INTELLIGENCE
 * Makes your app remember and learn from user behavior
 */
import type { SpatialDescription, FusedObject } from './intelligenceFusion';

// Define the missing types within the file or import if possible.
// For simplicity, defining structure interfaces here based on usage.

interface Landmark {
    name: string;
    position: SpatialDescription;
    permanent: boolean;
}

interface RoomContext {
    id: string;
    type: string;
    objects: FusedObject[];
    landmarks: Landmark[];
    lastUpdated: number;
}

interface SceneAnalysis {
    objects: FusedObject[];
    description: string;
}



interface Prediction {
    intent: string;
    suggestion: string;
    proactiveAction: string;
}


export class ContextAwareEngine {
    private roomMap: Map<string, RoomContext> = new Map();

    // Storage Placeholder (In a real app, use IndexedDB wrapper)
    private storage = {
        set: async (key: string, val: any) => { localStorage.setItem(key, JSON.stringify(val)); },
        get: async (key: string) => { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
    };

    /**
     * ROOM MAPPING - Build a mental model of the space
     */
    async buildRoomMap(sceneAnalyses: SceneAnalysis[]): Promise<RoomContext> {
        // Analyze multiple captures to build 3D mental model
        const objects = this.extractAllObjects(sceneAnalyses);
        const roomLayout = this.inferRoomLayout(objects);

        // Create persistent map
        const roomId = this.generateRoomId(roomLayout);
        const roomContext: RoomContext = {
            id: roomId,
            type: roomLayout.type,
            objects: objects,
            landmarks: this.identifyLandmarks(objects),
            lastUpdated: Date.now()
        };

        this.roomMap.set(roomId, roomContext);

        return roomContext;
    }

    /**
     * PREDICTIVE ASSISTANCE - Anticipate user needs
     */
    async predictUserIntent(_currentScene: string, history: string[]): Promise<Prediction> {
        // Analyze patterns
        const isSearching = history.some(h => h.includes('find'));
        const isNavigating = history.some(h => h.includes('where') || h.includes('location'));

        if (isSearching) {
            return {
                intent: 'object-search',
                suggestion: 'Would you like me to scan for commonly misplaced items?',
                proactiveAction: 'highlight-small-objects'
            };
        }

        if (isNavigating) {
            return {
                intent: 'navigation',
                suggestion: 'I can guide you to specific locations in this room',
                proactiveAction: 'map-room-layout'
            };
        }

        return {
            intent: 'exploration',
            suggestion: 'Say "describe scene" to understand your surroundings',
            proactiveAction: 'continuous-monitoring'
        };
    }

    /**
     * SMART OBJECT TRACKING - Remember where things are
     */
    async rememberObjectLocation(objectName: string, location: SpatialDescription): Promise<void> {
        const key = objectName.toLowerCase();

        // Store in IndexedDB for persistence
        await this.storage.set(`object:${key}`, {
            name: objectName,
            location: location,
            lastSeen: Date.now(),
            confidence: 0.9
        });

        console.log(`📍 Remembered: ${objectName} at ${location.fullDescription}`);
    }

    async recallObjectLocation(objectName: string): Promise<string | null> {
        const key = objectName.toLowerCase();
        const stored = await this.storage.get(`object:${key}`);

        if (stored && Date.now() - stored.lastSeen < 3600000) { // 1 hour freshness
            return `Your ${objectName} was last seen at ${stored.location.fullDescription} about ${this.getTimeAgo(stored.lastSeen)}.`;
        }

        return null;
    }

    private getTimeAgo(timestamp: number): string {
        const minutes = Math.floor((Date.now() - timestamp) / 60000);
        if (minutes < 1) return 'just now';
        if (minutes === 1) return '1 minute ago';
        if (minutes < 60) return `${minutes} minutes ago`;
        const hours = Math.floor(minutes / 60);
        if (hours === 1) return '1 hour ago';
        return `${hours} hours ago`;
    }

    // Helpers
    private extractAllObjects(analyses: SceneAnalysis[]): FusedObject[] {
        return analyses.flatMap(a => a.objects);
    }

    private inferRoomLayout(objects: FusedObject[]): { type: string } {
        // Simple heuristic based on object types
        const names = objects.map(o => o.name.toLowerCase());
        if (names.some(n => n.includes('bed'))) return { type: 'bedroom' };
        if (names.some(n => n.includes('oven') || n.includes('fridge'))) return { type: 'kitchen' };
        if (names.some(n => n.includes('desk') || n.includes('monitor'))) return { type: 'office' };
        return { type: 'unknown' };
    }

    private generateRoomId(layout: { type: string }): string {
        return `${layout.type}_${Date.now()}`; // Unique enough for session
    }

    private identifyLandmarks(objects: FusedObject[]): Landmark[] {
        // Big static objects are landmarks
        return objects.filter(o => ['door', 'window', 'table', 'desk', 'bed', 'refrigerator'].includes(o.name.toLowerCase()))
            .map(o => ({
                name: o.name,
                position: o.position,
                permanent: true
            }));
    }
    /**
     * SMART LEARNING (Feature 3)
     */
    async learnUserObject(name: string, description: string): Promise<void> {
        const key = name.toLowerCase();
        await this.storage.set(`learned:${key}`, {
            name,
            description,
            learnedAt: Date.now()
        });
        this.userObjectsCache.set(key, description);
        console.log(`🧠 Learned: ${name} = ${description}`);
    }

    async getUserObjects(): Promise<string[]> {
        // In a real app, logic to load from storage. For now, cached + hardcoded.
        return Array.from(this.userObjectsCache.entries()).map(([k, v]) => `${k} (${v})`);
    }

    // Cache for speed
    private userObjectsCache = new Map<string, string>();
}

export const contextAwareEngine = new ContextAwareEngine();
