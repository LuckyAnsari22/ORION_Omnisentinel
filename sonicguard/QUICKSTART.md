# 🚀 SonicGuard - Quick Start Guide

## Immediate Testing (No Setup Required)

1. **Start the app:**
```bash
npm run dev
```

2. **Open in browser:** http://localhost:5174

3. **Click "START MONITORING"**

4. **Make sounds:**
   - Clap loudly (simulates gunshot)
   - Whistle sharply (simulates alarm)
   - Tap glass (simulates glass break)
   - Speak loudly (simulates aggressive voice)

5. **Watch the radar** - Threats will appear with direction and distance!

## With Firebase Alerts (15-Minute Setup)

### Quick Setup

1. **Create Firebase Project:**
   - Go to https://console.firebase.google.com/
   - Click "Add project" → Name it "sonicguard"
   - Disable Google Analytics (optional)
   - Click "Create project"

2. **Enable Firestore:**
   - Click "Firestore Database" → "Create database"
   - Start in "production mode"
   - Choose location → "Enable"

3. **Get Config:**
   - Click gear icon → "Project settings"
   - Scroll to "Your apps" → Click web icon (</>)
   - Register app as "SonicGuard"
   - Copy the config object

4. **Configure in App:**
   - Open SonicGuard
   - Click "📧 Configure Firebase Alerts"
   - Paste your Firebase config values
   - Enter your email address
   - Click "Save & Enable Alerts"

5. **Deploy Cloud Function (for emails):**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (select your project)
firebase init functions

# Configure email
firebase functions:config:set email.user="your@gmail.com" email.password="your-app-password"

# Deploy
firebase deploy --only functions
```

**Get Gmail App Password:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to "App passwords"
4. Generate password for "Mail"
5. Use that password in the command above

### Done! 🎉

Now when threats are detected:
- ✅ Stored in Firestore
- ✅ Email sent automatically
- ✅ Viewable in Firebase Console

## Testing Email Alerts

1. **Start monitoring**
2. **Make a loud sound** (clap, whistle, etc.)
3. **Check your email** - Alert should arrive within seconds!

## Troubleshooting

**No threats detected?**
- Check microphone permissions
- Increase volume
- Try different sounds

**Email not sending?**
- Check Firebase Functions logs: `firebase functions:log`
- Verify email config: `firebase functions:config:get`
- Ensure Cloud Function is deployed

**Firebase errors?**
- Check browser console (F12)
- Verify all config fields are correct
- Ensure Firestore is enabled

## What's Next?

- 📊 View threat history in Firebase Console
- 🔔 Add more notification channels (SMS, Slack, etc.)
- 📈 Build analytics dashboard
- 🚀 Deploy to production (Vercel)

---

**You're all set! Start protecting your space with SonicGuard! 🎯**
