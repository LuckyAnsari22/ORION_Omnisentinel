/**
 * LocalLens Storage Service
 * Manages offline data storage using IndexedDB
 * Stores user preferences, analysis history, and cached models
 */

import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

interface AnalysisEntry {
  id?: number;
  timestamp: number;
  mode: 'description' | 'text' | 'object' | 'color' | 'navigation';
  imageThumbnail?: string;
  result: string;
  detections?: string[];
  metadata?: Record<string, any>;
}

interface ObjectLocationEntry {
  id?: number;
  objectName: string;
  lastSeen: number;
  location: string;
  confidence: number;
}

interface UserPreferences {
  speechRate: number;
  speechPitch: number;
  vibrationIntensity: number;
  language: string;
  detailLevel: 'brief' | 'detailed' | 'very-detailed';
  highContrast: boolean;
  hapticFeedback: boolean;
  autoReadPreferences: boolean;
}

interface LocalLensDB extends DBSchema {
  analysisHistory: {
    key: number;
    value: AnalysisEntry;
    indexes: { 'by-timestamp': number; 'by-mode': string };
  };
  objectLocations: {
    key: number;
    value: ObjectLocationEntry;
    indexes: { 'by-name': string; 'by-timestamp': number };
  };
  preferences: {
    key: 'user-preferences';
    value: UserPreferences;
  };
  cachedModels: {
    key: string;
    value: {
      modelName: string;
      modelData: Blob;
      downloadedAt: number;
      version: string;
    };
  };
}

let db: IDBPDatabase<LocalLensDB> | null = null;

/**
 * Initialize the IndexedDB database
 */
export const initializeStorage = async (): Promise<void> => {
  if (db) return;

  try {
    db = await openDB<LocalLensDB>('LocalLensDB', 1, {
      upgrade(db) {
        // Analysis history store
        if (!db.objectStoreNames.contains('analysisHistory')) {
          const analysisStore = db.createObjectStore('analysisHistory', { keyPath: 'id', autoIncrement: true });
          analysisStore.createIndex('by-timestamp', 'timestamp');
          analysisStore.createIndex('by-mode', 'mode');
        }

        // Object locations store
        if (!db.objectStoreNames.contains('objectLocations')) {
          const objectStore = db.createObjectStore('objectLocations', { keyPath: 'id', autoIncrement: true });
          objectStore.createIndex('by-name', 'objectName');
          objectStore.createIndex('by-timestamp', 'lastSeen');
        }

        // User preferences store
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences');
        }

        // Cached models store
        if (!db.objectStoreNames.contains('cachedModels')) {
          db.createObjectStore('cachedModels', { keyPath: 'modelName' });
        }
      },
    });

    console.log('LocalLens storage initialized');
  } catch (error) {
    console.error('Failed to initialize storage:', error);
    throw error;
  }
};

/**
 * Save analysis result to history
 */
export const saveAnalysisResult = async (entry: Omit<AnalysisEntry, 'timestamp' | 'id'>): Promise<number | void> => {
  if (!db) await initializeStorage();
  if (!db) return;

  try {
    const timestamp = Date.now();
    const result = await db.add('analysisHistory', {
      ...entry,
      timestamp,
    });
    console.log('Analysis saved:', result);
    return result as number;
  } catch (error) {
    console.error('Failed to save analysis:', error);
  }
};

/**
 * Get analysis history
 */
export const getAnalysisHistory = async (mode?: string, limit: number = 50): Promise<AnalysisEntry[]> => {
  if (!db) await initializeStorage();
  if (!db) return [];

  try {
    if (mode) {
      const results = await db.getAllFromIndex('analysisHistory', 'by-mode', mode);
      return results.reverse().slice(0, limit);
    }
    const results = await db.getAll('analysisHistory');
    return results.reverse().slice(0, limit);
  } catch (error) {
    console.error('Failed to retrieve history:', error);
    return [];
  }
};

/**
 * Clear analysis history
 */
export const clearAnalysisHistory = async (): Promise<void> => {
  if (!db) await initializeStorage();
  if (!db) return;

  try {
    await db.clear('analysisHistory');
    console.log('Analysis history cleared');
  } catch (error) {
    console.error('Failed to clear history:', error);
  }
};

/**
 * Record object location (for finding objects later)
 */
export const recordObjectLocation = async (
  objectName: string,
  location: string,
  confidence: number = 0.8
): Promise<void> => {
  if (!db) await initializeStorage();
  if (!db) return;

  try {
    await db.put('objectLocations', {
      objectName,
      location,
      confidence,
      lastSeen: Date.now(),
    });
    console.log(`Location saved for ${objectName}`);
  } catch (error) {
    console.error('Failed to record object location:', error);
  }
};

/**
 * Find last known location of an object
 */
export const findObjectLocation = async (objectName: string): Promise<ObjectLocationEntry | undefined> => {
  if (!db) await initializeStorage();
  if (!db) return undefined;

  try {
    const results = await db.getAllFromIndex('objectLocations', 'by-name', objectName);
    if (results.length === 0) return undefined;

    // Return the most recent
    return results.reduce((latest, current) => {
      return current.lastSeen > latest.lastSeen ? current : latest;
    });
  } catch (error) {
    console.error('Failed to find object location:', error);
    return undefined;
  }
};

/**
 * Get all remembered object locations
 */
export const getRememberedObjects = async (): Promise<ObjectLocationEntry[]> => {
  if (!db) await initializeStorage();
  if (!db) return [];

  try {
    const results = await db.getAll('objectLocations');
    // Sort by most recent
    return results.sort((a, b) => b.lastSeen - a.lastSeen);
  } catch (error) {
    console.error('Failed to retrieve remembered objects:', error);
    return [];
  }
};

/**
 * Clear object location history
 */
export const clearObjectLocations = async (): Promise<void> => {
  if (!db) await initializeStorage();
  if (!db) return;

  try {
    await db.clear('objectLocations');
    console.log('Object locations cleared');
  } catch (error) {
    console.error('Failed to clear object locations:', error);
  }
};

/**
 * Save user preferences
 */
export const savePreferences = async (preferences: UserPreferences): Promise<void> => {
  if (!db) await initializeStorage();
  if (!db) return;

  try {
    await db.put('preferences', preferences, 'user-preferences');
    console.log('Preferences saved');
  } catch (error) {
    console.error('Failed to save preferences:', error);
  }
};

/**
 * Load user preferences
 */
export const loadPreferences = async (): Promise<UserPreferences | undefined> => {
  if (!db) await initializeStorage();
  if (!db) return undefined;

  try {
    return await db.get('preferences', 'user-preferences');
  } catch (error) {
    console.error('Failed to load preferences:', error);
    return undefined;
  }
};

/**
 * Cache a downloaded model
 */
export const cacheModel = async (
  modelName: string,
  modelData: Blob,
  version: string
): Promise<void> => {
  if (!db) await initializeStorage();
  if (!db) return;

  try {
    await db.put('cachedModels', {
      modelName,
      modelData,
      version,
      downloadedAt: Date.now(),
    });
    console.log(`Model cached: ${modelName}`);
  } catch (error) {
    console.error('Failed to cache model:', error);
  }
};

/**
 * Get cached model
 */
export const getCachedModel = async (modelName: string): Promise<Blob | undefined> => {
  if (!db) await initializeStorage();
  if (!db) return undefined;

  try {
    const cached = await db.get('cachedModels', modelName);
    return cached?.modelData;
  } catch (error) {
    console.error('Failed to retrieve cached model:', error);
    return undefined;
  }
};

/**
 * Get database stats
 */
export const getStorageStats = async (): Promise<{
  analysisCount: number;
  objectLocationsCount: number;
  cacheSize: string;
}> => {
  if (!db) await initializeStorage();
  if (!db) {
    return { analysisCount: 0, objectLocationsCount: 0, cacheSize: '0 MB' };
  }

  try {
    const analysisCount = await db.count('analysisHistory');
    const objectLocationsCount = await db.count('objectLocations');
    
    // Estimate cache size (simplified)
    const models = await db.getAll('cachedModels');
    const totalSize = models.reduce((sum, model) => sum + model.modelData.size, 0);
    const cacheSizeInMB = (totalSize / (1024 * 1024)).toFixed(2);

    return {
      analysisCount,
      objectLocationsCount,
      cacheSize: `${cacheSizeInMB} MB`,
    };
  } catch (error) {
    console.error('Failed to get storage stats:', error);
    return { analysisCount: 0, objectLocationsCount: 0, cacheSize: '0 MB' };
  }
};

/**
 * Clear all storage
 */
export const clearAllStorage = async (): Promise<void> => {
  if (!db) await initializeStorage();
  if (!db) return;

  try {
    await db.clear('analysisHistory');
    await db.clear('objectLocations');
    await db.clear('cachedModels');
    console.log('All storage cleared');
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
};

/**
 * Export all data (for backup or debugging)
 */
export const exportAllData = async (): Promise<Record<string, any>> => {
  if (!db) await initializeStorage();
  if (!db) return {};

  try {
    return {
      analysisHistory: await db.getAll('analysisHistory'),
      objectLocations: await db.getAll('objectLocations'),
      preferences: await db.get('preferences', 'user-preferences'),
      stats: await getStorageStats(),
      exportedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to export data:', error);
    return {};
  }
};

export default {
  initializeStorage,
  saveAnalysisResult,
  getAnalysisHistory,
  clearAnalysisHistory,
  recordObjectLocation,
  findObjectLocation,
  getRememberedObjects,
  clearObjectLocations,
  savePreferences,
  loadPreferences,
  cacheModel,
  getCachedModel,
  getStorageStats,
  clearAllStorage,
  exportAllData,
};
