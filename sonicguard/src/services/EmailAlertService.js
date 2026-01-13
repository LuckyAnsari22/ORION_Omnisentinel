import emailjs from '@emailjs/browser';

export class EmailAlertService {
    constructor() {
        this.isConfigured = false;
        this.serviceId = '';
        this.templateId = '';
        this.publicKey = '';
        this.recipientEmail = '';
        this.recipientName = '';
        this.lastAlertTime = 0;
        this.ALERT_COOLDOWN = 30000; // 30 seconds between alerts to avoid spam
    }

    configure(config) {
        this.serviceId = config.serviceId || '';
        this.templateId = config.templateId || '';
        this.publicKey = config.publicKey || '';
        this.recipientEmail = config.recipientEmail || '';
        this.recipientName = config.recipientName || 'Security Team';

        // Initialize EmailJS
        if (this.publicKey) {
            emailjs.init(this.publicKey);
            this.isConfigured = true;
            console.log('Email alerts configured successfully');
        }
    }

    async sendThreatAlert(threat) {
        if (!this.isConfigured) {
            console.warn('Email alerts not configured');
            return { success: false, error: 'Not configured' };
        }

        // Check cooldown to prevent spam
        const now = Date.now();
        if (now - this.lastAlertTime < this.ALERT_COOLDOWN) {
            console.log('Alert cooldown active, skipping email');
            return { success: false, error: 'Cooldown active' };
        }

        try {
            const templateParams = {
                to_email: this.recipientEmail,
                to_name: this.recipientName,
                threat_type: this.formatThreatType(threat.type),
                confidence: threat.confidence.toFixed(1),
                severity: threat.severity.toUpperCase(),
                direction: threat.direction,
                distance: threat.distance,
                timestamp: new Date().toLocaleString(),
                location: 'Unknown Location', // Could be enhanced with geolocation
            };

            const response = await emailjs.send(
                this.serviceId,
                this.templateId,
                templateParams
            );

            this.lastAlertTime = now;
            console.log('Threat alert email sent successfully:', response);

            return { success: true, response };
        } catch (error) {
            console.error('Failed to send threat alert email:', error);
            return { success: false, error: error.message };
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
            serviceId: this.serviceId,
            templateId: this.templateId,
            publicKey: this.publicKey ? '***' : '',
            recipientEmail: this.recipientEmail,
            recipientName: this.recipientName,
        };
    }
}
