import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';

// Pre-configured Firebase for OrionTeamOutliers
const defaultFirebaseConfig = {
    apiKey: "AIzaSyAOp34gqvNaWAB-VHdBXum3xsqIfMy9daY",
    authDomain: "orionteamoutliers.firebaseapp.com",
    projectId: "orionteamoutliers",
    storageBucket: "orionteamoutliers.firebasestorage.app",
    messagingSenderId: "661127440342",
    appId: "1:661127440342:web:284ba13bfc226ee3b82677",
    measurementId: "G-P1S2Q7VQQG"
};

export class FirebaseAlertService {
    constructor() {
        this.app = null;
        this.db = null;
        this.functions = null;
        this.analytics = null;
        this.isConfigured = false;
        this.lastAlertTime = 0;
        this.ALERT_COOLDOWN = 30000; // 30 seconds between alerts
        this.recipientEmail = '';
        this.recipientName = 'Security Team';
        this.useDefaultConfig = true;
    }

    configure(config) {
        try {
            // Use provided config or default
            const firebaseConfig = config.useDefault ? defaultFirebaseConfig : {
                apiKey: config.apiKey,
                authDomain: config.authDomain,
                projectId: config.projectId,
                storageBucket: config.storageBucket,
                messagingSenderId: config.messagingSenderId,
                appId: config.appId,
            };

            // Initialize Firebase
            this.app = initializeApp(firebaseConfig);
            this.db = getFirestore(this.app);
            this.functions = getFunctions(this.app);

            // Initialize Analytics
            try {
                this.analytics = getAnalytics(this.app);
            } catch (e) {
                console.log('Analytics not available (normal for localhost)');
            }

            // Store recipient info
            this.recipientEmail = config.recipientEmail || '';
            this.recipientName = config.recipientName || 'Security Team';
            this.useDefaultConfig = config.useDefault || false;

            this.isConfigured = true;
            console.log('Firebase alerts configured successfully');
            return true;
        } catch (error) {
            console.error('Failed to configure Firebase:', error);
            return false;
        }
    }

    async sendThreatAlert(threat) {
        if (!this.isConfigured) {
            console.warn('Firebase alerts not configured');
            return { success: false, error: 'Not configured' };
        }

        // Check cooldown to prevent spam
        const now = Date.now();
        if (now - this.lastAlertTime < this.ALERT_COOLDOWN) {
            console.log('Alert cooldown active, skipping notification');
            return { success: false, error: 'Cooldown active' };
        }

        try {
            // Prepare threat data
            const threatData = {
                type: threat.type,
                confidence: threat.confidence,
                severity: threat.severity,
                direction: threat.direction,
                distance: threat.distance,
                timestamp: serverTimestamp(),
                recipientEmail: this.recipientEmail,
                recipientName: this.recipientName,
                notificationSent: false,
            };

            // Store threat in Firestore
            const docRef = await addDoc(collection(this.db, 'threats'), threatData);
            console.log('Threat stored in Firestore:', docRef.id);

            // Trigger email notification via Cloud Function
            try {
                const sendEmail = httpsCallable(this.functions, 'sendThreatEmail');
                const emailResult = await sendEmail({
                    threatId: docRef.id,
                    ...threatData,
                    timestamp: new Date().toISOString(),
                });

                console.log('Email notification sent:', emailResult.data);
                this.lastAlertTime = now;

                return {
                    success: true,
                    threatId: docRef.id,
                    emailSent: true,
                };
            } catch (emailError) {
                // Even if email fails, threat is still stored
                console.warn('Email notification failed, but threat stored:', emailError);
                this.lastAlertTime = now;

                return {
                    success: true,
                    threatId: docRef.id,
                    emailSent: false,
                    emailError: emailError.message,
                };
            }
        } catch (error) {
            console.error('Failed to send threat alert:', error);
            return { success: false, error: error.message };
        }
    }

    async getRecentThreats(limit = 10) {
        if (!this.isConfigured || !this.db) {
            return [];
        }

        try {
            const { query, orderBy, getDocs, limitToLast } = await import('firebase/firestore');
            const threatsRef = collection(this.db, 'threats');
            const q = query(threatsRef, orderBy('timestamp', 'desc'), limitToLast(limit));
            const querySnapshot = await getDocs(q);

            const threats = [];
            querySnapshot.forEach((doc) => {
                threats.push({
                    id: doc.id,
                    ...doc.data(),
                });
            });

            return threats;
        } catch (error) {
            console.error('Failed to fetch recent threats:', error);
            return [];
        }
    }

    formatThreatType(type) {
        return type
            .replace(/([A-Z])/g, ' $1')
            .trim()
            .toUpperCase();
    }

    isReady() {
        return this.isConfigured;
    }

    getConfig() {
        return {
            isConfigured: this.isConfigured,
            recipientEmail: this.recipientEmail,
            recipientName: this.recipientName,
            useDefaultConfig: this.useDefaultConfig,
        };
    }
}
