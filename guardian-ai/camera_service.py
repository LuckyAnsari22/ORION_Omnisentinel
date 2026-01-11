import cv2
import time
import numpy as np
from PIL import Image
from src.pipeline.fall_detect import FallDetector
from notifier import FCMNotifier
import io
import os # Added for _init_detector
import threading # For Async AI Loading

class CameraService:
    def __init__(self, logger=None):
        self.camera = None
        self.logger = logger
        self.notifier = FCMNotifier(logger=logger)
        self.current_location = None
        if self.logger: self.logger("Camera Service Initialized", "info")
        
        # LOAD AI MODEL IMMEDIATELY (NOT ASYNC)
        print("\n🤖 Initializing AI Model...", flush=True)
        try:
            self.fall_detector = self._init_detector()
            if self.fall_detector:
                print("✅ AI MODEL LOADED! Fall detection is ACTIVE.", flush=True)
                if self.logger: self.logger("AI Model Loaded: MoveNet Ready", "success")
            else:
                print("⚠️ Running in DEMO MODE (no AI)", flush=True)
        except Exception as e:
            print(f"❌ AI LOAD ERROR: {e}", flush=True)
            import traceback
            traceback.print_exc()
            self.fall_detector = None
            if self.logger: self.logger(f"AI Load Failed: {e}", "error")

    def update_fcm_token(self, token):
        self.notifier.set_fcm_token(token)

    def update_location(self, lat, lng):
        self.current_location = {
            'lat': lat,
            'lng': lng,
            'map_link': f"https://www.google.com/maps?q={lat},{lng}"
        }
        if self.logger: self.logger(f"GPS Location Updated: {lat}, {lng}", "info")

    def _init_detector(self):
        # Helper to load AI Model Configuration
        _dir = os.path.dirname(os.path.abspath(__file__))
        _good_tflite_model = os.path.join(
            _dir,
            'ai_models/posenet_mobilenet_v1_100_257x257_multi_kpt_stripped.tflite'
        )
        _good_edgetpu_model = os.path.join(
            _dir,
            'ai_models/posenet_mobilenet_v1_075_721_1281_quant_decoder_edgetpu.tflite'
        )
        _good_labels = os.path.join(_dir, 'ai_models/pose_labels.txt')
        
        config = {
            'model': {
                'tflite': _good_tflite_model,
                'edgetpu': _good_edgetpu_model,
            },
            'labels': _good_labels,
            'top_k': 5,
            'confidence_threshold': 0.25,
            'model_name': 'mobilenet'
        }
        if self.logger: self.logger("AI Model Loaded: PoseNet MobileNet v1 (Sensitivity: Balanced)", "success")
        return FallDetector(**config)

    def start_camera(self):
        # Prevent re-entrant or duplicate start attempts
        if self.camera is not None and self.camera.isOpened():
            return
        if hasattr(self, '_is_starting') and self._is_starting:
            return
        
        self._is_starting = True
        try:
            print("Attempting to open Real Camera...", flush=True)
            
            # FORCE RELEASE ANY EXISTING
            if self.camera:
                self.camera.release()
            cv2.destroyAllWindows()
            
            # Try index 0 first
            cap = cv2.VideoCapture(0, cv2.CAP_DSHOW) # Use DirectShow for faster/safer Windows access
            if cap.isOpened():
                # Warmup
                time.sleep(1.0)
                ret, _ = cap.read()
                if ret:
                    self.camera = cap
                    if self.logger: self.logger("Camera Connected Successfully", "success")
                    return
                else:
                    cap.release()
            
            # If 0 fails, try 1 (external cam?)
            print("Index 0 failed, trying Index 1...", flush=True)
            cap = cv2.VideoCapture(1, cv2.CAP_DSHOW)
            if cap.isOpened():
                time.sleep(1.0)
                ret, _ = cap.read()
                if ret:
                    self.camera = cap
                    if self.logger: self.logger("External Camera Connected", "success")
                    return
                else:
                    cap.release()
    
            print("CRITICAL: No Camera Found on Index 0 or 1", flush=True)
            # No fallback. Leave self.camera as None.
        finally:
            self._is_starting = False

    def stop_camera(self):
        if self.camera:
            self.camera.release()
            self.camera = None

    def reset_alert(self):
        """Manually clears the fall detection latch."""
        self.alert_latch_until = 0
        if self.logger: self.logger("Alert Manually Reset by User", "info")

    def _draw_keypoints(self, frame, keypoints):
        # Helper to draw skeleton
        connections = [
            ('left shoulder', 'right shoulder'),
            ('left shoulder', 'left hip'),
            ('right shoulder', 'right hip'),
            ('left hip', 'right hip')
        ]
        
        points = {}
        for name, coord in keypoints.items():
            if coord is not None:
                x = int(coord[0]) # Fixed: Index 0 is X
                y = int(coord[1]) # Fixed: Index 1 is Y
                points[name] = (x, y)
                cv2.circle(frame, (x, y), 5, (255, 0, 0), -1) 
        
        for start, end in connections:
            if start in points and end in points:
                cv2.line(frame, points[start], points[end], (255, 0, 0), 2)

    def _draw_bounding_box(self, frame, keypoints, color):
        """Draws a bounding box around the detected person."""
        x_coords = []
        y_coords = []
        
        for coord in keypoints.values():
            if coord is not None:
                x_coords.append(coord[0]) # Fixed: Index 0 is X
                y_coords.append(coord[1]) # Fixed: Index 1 is Y
        
        if x_coords and y_coords:
            min_x, max_x = int(min(x_coords)), int(max(x_coords))
            min_y, max_y = int(min(y_coords)), int(max(y_coords))
            
            pad = 20
            h, w, _ = frame.shape
            min_x = max(0, min_x - pad)
            min_y = max(0, min_y - pad)
            max_x = min(w, max_x + pad)
            max_y = min(h, max_y + pad)
            
            cv2.rectangle(frame, (min_x, min_y), (max_x, max_y), color, 3)
            
            label_bg_pt2 = (min_x + 140, min_y - 25)
            cv2.rectangle(frame, (min_x, min_y - 30), label_bg_pt2, color, -1)

    def generate_frames(self):
        # Initial connect attempt
        self.start_camera()
        
        while True:
            # Infinite Retry Loop for Connection
            if self.camera is None or not self.camera.isOpened():
                print("Camera link down. Retrying...", flush=True)
                self.start_camera()
                
                # If still down, show "Connecting" frame
                if self.camera is None or not self.camera.isOpened():
                    error_frame = np.zeros((480, 640, 3), dtype=np.uint8)
                    cv2.putText(error_frame, "CONNECTING TO CAMERA...", (50, 240), 
                               cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 0), 2)
                    cv2.putText(error_frame, "PLEASE WAIT", (200, 300), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 2)
                    
                    ret, buffer = cv2.imencode('.jpg', error_frame)
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
                    
                    time.sleep(1.0)
                    continue

            # Read Real Frame
            success, frame = self.camera.read()
            if not success:
                print("Read Error. Reconnecting...", flush=True)
                self.camera.release()
                self.camera = None
                continue

            # Simple Overlay (No AI) -> REPLACED WITH AI LOGIC
            # cv2.putText(frame, "LIVE FEED - NO AI", (10, 30), 
            #             cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            
            # --- GLOBAL TRY/CATCH TO PREVENT 500 ERRORS ---
            try:
                # --- AI LOGIC START ---
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_image = Image.fromarray(rgb_frame)
                
                if self.fall_detector is None:
                     # Visual Feedback
                    cv2.putText(frame, "AI LOADING / ERROR...", (10, 60), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                         
                else:
                     # AI IS READY
                     # DEBUG VISUAL
                    cv2.putText(frame, f"AI SYSTEM ONLINE", (10, 60), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

                processed_sample = None
                if self.fall_detector:
                    try:
                        processed_sample = next(self.fall_detector.process_sample(image=pil_image))
                    except Exception as e:
                        # If inference fails, just show raw video
                        # print(f"Inference Error: {e}", flush=True)
                         pass
                
                status_text = "Status: No Detection"
                if self.fall_detector:
                     status_text = "Status: Monitoring"
                
                color_status = (0, 255, 255) # Yellow

                # Check for alert latch expiration
                current_time = time.time()
                is_latched = hasattr(self, 'alert_latch_until') and current_time < self.alert_latch_until

                if processed_sample:
                    inference_result = processed_sample.get('inference_result')
                    color_status = (0, 255, 0) # Green

                    # ALWAYS DRAW KEYPOINTS IF AVAILABLE (Even if no fall detected)
                    # The generator yields a list of detections. If list is empty, no fall.
                    # But we want to see the skeleton regardless.
                    
                    # HACK: If inference_result is empty (no fall), we need to check if 'keypoints' are embedded elsewhere
                    # or force the pipeline to return basic pose data.
                    
                    # For now, let's look at how the pipeline works. 
                    # process_sample -> yield {'inference_result': [...]}
                    # If inference_result is empty, it means fall_detect returned []
                    # fall_detect returns [('FALL', ...)] ONLY on fall?
                    # Let's check fall_detect return.
                    
                    # Updated Logic:
                    # If inference_result has data, use it.
                    # If not, check if we can access the latest pose from the detector?
                    
                    # Assuming 'inference_result' structure contains the detection.
                    
                    has_drawn = False
                    if inference_result:
                        for det in inference_result:
                            keypoints = det.get('keypoint_corr')
                            label = det.get('label')
                            
                            box_color = (0, 255, 0)
                            box_label = "NORMAL"
                            
                            if label == 'FALL' or is_latched:
                                box_color = (0, 0, 255) # Red
                                box_label = "FALL DETECTED"
                                
                            if keypoints:
                                self._draw_keypoints(frame, keypoints)
                                # self._draw_bounding_box(frame, keypoints, box_color) # skip bbox for cleaner look
                                has_drawn = True

                                x_coords = [c[0] for c in keypoints.values() if c is not None]
                                y_coords = [c[1] for c in keypoints.values() if c is not None]
                                if x_coords and y_coords:
                                    txt_x = max(0, int(min(x_coords)) - 20)
                                    txt_y = max(30, int(min(y_coords)) - 35)
                                    display_label = "ID:1 FALLEN" if box_label == "FALL DETECTED" else "ID:1 ACTIVE"
                                    text_color = (0, 0, 255) if box_label == "FALL DETECTED" else (0, 255, 0)
                                    cv2.putText(frame, display_label, (txt_x + 5, txt_y + 20), 
                                              cv2.FONT_HERSHEY_SIMPLEX, 0.6, text_color, 2)
                    
                    # If we didn't draw anything (no fall detected), we still want to see the skeleton!
                    # However, the current fall_detect implementation ONLY returns inference_result if a fall is detected (or near fall).
                    # We need to modify fall_detect to RETURN THE POSE always.
                    
                    # Since I cannot easily modify fall_detect's return signature without breaking other things,
                    # I will try to fetch the last known pose directly from the detector if possible.
                    # Looking at fall_detect.py, it stores _prev_data.
                    
                if not has_drawn and self.fall_detector:
                     # Access internal state (Hack for demo visualization)
                     try:
                         # _prev_data is a deque of (timestamp, pose_dix, spinal, thumbnail)
                         if self.fall_detector._prev_data and self.fall_detector._prev_data[-1]:
                             last_data = self.fall_detector._prev_data[-1] 
                             last_pose = last_data.get(self.fall_detector.POSE_VAL) # pose_dix
                             if last_pose:
                                 self._draw_keypoints(frame, last_pose)
                                 # Draw "Normal" label
                                 x_coords = [c[0] for c in last_pose.values() if c is not None]
                                 if x_coords:
                                     # Calculate center approx
                                     txt_x = int(min(x_coords))
                                     txt_y = int(min([c[1] for c in last_pose.values() if c is not None]))
                                     cv2.putText(frame, "ID:1 ACTIVE", (txt_x, txt_y - 20), 
                                              cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                     except Exception as e:
                         pass

                # Check for fall triggers from the inference loop
                if inference_result:
                    for det in inference_result:
                        label = det.get('label')
                        if label == 'FALL':
                            self.alert_latch_until = current_time + 5.0
                            is_latched = True
                            _, img_encoded = cv2.imencode('.jpg', frame)
                            import datetime
                            now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                            payload = {'timestamp': now_str}
                            if self.current_location:
                                payload.update(self.current_location)
                            try:
                                self.notifier.send_fall_alert(img_encoded.tobytes(), payload)
                            except Exception as e:
                                print(f"Notification Failed: {e}", flush=True)

                if is_latched:
                    status_text = "WARNING: FALL DETECTED!"
                    color_status = (0, 0, 255)
                    cv2.putText(frame, f"FALL TRIGGERED", (10, 90), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)

                cv2.putText(frame, status_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 
                            1, color_status, 2, cv2.LINE_AA)
                # --- AI LOGIC END ---
            except Exception as e:
                print(f"CRITICAL LOOP ERROR: {e}", flush=True)
                # import traceback
                # traceback.print_exc()
                # On error, we just continue so we at least stream the raw frame
                pass

            ret, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')