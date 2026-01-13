const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Configure your email service
// For Gmail, you need to:
// 1. Enable 2-factor authentication
// 2. Generate an "App Password"
// 3. Use that password here
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: functions.config().email.user, // Your Gmail address
        pass: functions.config().email.password, // Your App Password
    },
});

exports.sendThreatEmail = functions.https.onCall(async (data, context) => {
    const {
        type,
        confidence,
        severity,
        direction,
        distance,
        timestamp,
        recipientEmail,
        recipientName,
    } = data;

    // Format threat type
    const formatThreatType = (type) => {
        return type
            .replace(/([A-Z])/g, ' $1')
            .trim()
            .toUpperCase();
    };

    // Determine severity emoji
    const getSeverityEmoji = (severity) => {
        switch (severity) {
            case 'critical':
                return '🔴';
            case 'high':
                return '🟠';
            case 'medium':
                return '🟡';
            case 'low':
                return '🟢';
            default:
                return '⚠️';
        }
    };

    const mailOptions = {
        from: `SonicGuard Alert System <${functions.config().email.user}>`,
        to: recipientEmail,
        subject: `${getSeverityEmoji(severity)} SonicGuard Alert: ${formatThreatType(type)} Detected`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 20px auto;
                        background-color: #ffffff;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
                        color: #00ffff;
                        padding: 30px;
                        text-align: center;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 28px;
                        text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
                    }
                    .alert-badge {
                        display: inline-block;
                        padding: 10px 20px;
                        margin: 15px 0;
                        border-radius: 25px;
                        font-weight: bold;
                        font-size: 18px;
                    }
                    .critical { background-color: #ff0000; color: white; }
                    .high { background-color: #ff6600; color: white; }
                    .medium { background-color: #ffaa00; color: white; }
                    .low { background-color: #44ff88; color: white; }
                    .content {
                        padding: 30px;
                    }
                    .threat-type {
                        font-size: 32px;
                        font-weight: bold;
                        color: #0a0e1a;
                        margin: 20px 0;
                        text-align: center;
                    }
                    .details {
                        background-color: #f8f9fa;
                        border-left: 4px solid #00ffff;
                        padding: 20px;
                        margin: 20px 0;
                    }
                    .detail-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 10px 0;
                        border-bottom: 1px solid #e0e0e0;
                    }
                    .detail-row:last-child {
                        border-bottom: none;
                    }
                    .detail-label {
                        font-weight: bold;
                        color: #666;
                    }
                    .detail-value {
                        color: #333;
                        font-weight: 600;
                    }
                    .footer {
                        background-color: #f8f9fa;
                        padding: 20px;
                        text-align: center;
                        color: #666;
                        font-size: 14px;
                    }
                    .action-button {
                        display: inline-block;
                        padding: 12px 30px;
                        background: linear-gradient(135deg, #00ffff 0%, #00ff88 100%);
                        color: #0a0e1a;
                        text-decoration: none;
                        border-radius: 25px;
                        font-weight: bold;
                        margin: 20px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎯 SonicGuard Alert</h1>
                        <div class="alert-badge ${severity}">${severity.toUpperCase()}</div>
                    </div>
                    
                    <div class="content">
                        <p>Hello ${recipientName},</p>
                        <p>SonicGuard has detected a potential threat that requires immediate attention:</p>
                        
                        <div class="threat-type">
                            ${getSeverityEmoji(severity)} ${formatThreatType(type)}
                        </div>
                        
                        <div class="details">
                            <div class="detail-row">
                                <span class="detail-label">Confidence Level:</span>
                                <span class="detail-value">${confidence.toFixed(1)}%</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Severity:</span>
                                <span class="detail-value">${severity.toUpperCase()}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Direction:</span>
                                <span class="detail-value">${direction}° (${getDirectionName(direction)})</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Estimated Distance:</span>
                                <span class="detail-value">~${distance} meters</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Detection Time:</span>
                                <span class="detail-value">${timestamp}</span>
                            </div>
                        </div>
                        
                        <p style="margin-top: 20px; color: #d32f2f; font-weight: bold;">
                            ⚠️ Please investigate this incident immediately.
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p>This is an automated alert from SonicGuard AI Threat Detection System</p>
                        <p style="font-size: 12px; color: #999;">
                            Powered by AI • Real-time Audio Analysis • 360° Sound Awareness
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);

        // Update Firestore to mark notification as sent
        if (data.threatId) {
            await admin.firestore().collection('threats').doc(data.threatId).update({
                notificationSent: true,
                notificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }

        return { success: true, message: 'Email sent successfully' };
    } catch (error) {
        console.error('Error sending email:', error);
        throw new functions.https.HttpsError('internal', 'Failed to send email notification');
    }
});

// Helper function to convert degrees to cardinal direction
function getDirectionName(degrees) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((degrees % 360) / 45)) % 8;
    return directions[index];
}
