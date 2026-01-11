# Task Checklist for Debugging Fall Detection Backend

- [ ] Verify backend is running and reachable (`/api/status`)
- [ ] Check camera service logs for AI load errors
- [ ] Ensure `FallDetector` is instantiated correctly
- [ ] Confirm `camera_service.py` processes frames and calls fall detection logic
- [ ] Validate that `fall_detect.py` thresholds are correct
- [ ] Test API endpoint that reports fall events (`/api/fall_events` or similar)
- [ ] Simulate a fall and observe console output
- [ ] Fix any identified issues and verify green overlay appears
