import mediapipe as mp
import numpy as np
import sounddevice as sd
from scipy.io import wavfile
import cv2

class DrumSampler:
    def __init__(self, sample_path, hand_type):
        # Load and normalize sample
        self.sample_rate, sample = wavfile.read(sample_path)
        if len(sample.shape) > 1:
            sample = np.mean(sample, axis=1)
        self.sample = sample.astype(np.float32) / np.max(np.abs(sample))
        
        # Audio setup
        self.position = 0
        self.is_playing = False
        self.buffer_size = 1024
        self.running = True
        
        # Hand type setup (right or left)
        self.hand_type = hand_type  # 'right' or 'left'
        
        # Hand tracking setup
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(min_detection_confidence=0.7)
        self.mp_draw = mp.solutions.drawing_utils
        
        # Audio stream
        self.stream = sd.OutputStream(
            samplerate=self.sample_rate,
            channels=1,
            callback=self.audio_callback,
            blocksize=self.buffer_size
        )
        self.stream.start()
        self.prev_y = None
        self.velocity_threshold = 15  # Adjust for sensitivity
        self.allow_trigger = True  # Allow trigger when conditions are met


    def audio_callback(self, outdata, frames, time, status):
        if self.is_playing:
            if self.position >= len(self.sample):
                self.is_playing = False
                self.position = 0
                outdata.fill(0)
                return
                
            chunk_end = min(self.position + frames, len(self.sample))
            chunk = self.sample[self.position:chunk_end]
            outdata[:len(chunk), 0] = chunk
            if len(chunk) < frames:
                outdata[len(chunk):, 0] = 0
            self.position += frames
        else:
            outdata.fill(0)

    def is_fist(self, hand_landmarks):
        # Check if fingers are curled (fist position)
        finger_tips = [8, 12, 16, 20]  # Index, middle, ring, pinky
        finger_base = [5, 9, 13, 17]   # Corresponding base joints
        
        is_closed = True
        for tip, base in zip(finger_tips, finger_base):
            if hand_landmarks.landmark[tip].y < hand_landmarks.landmark[base].y:
                is_closed = False
                break
        return is_closed


    def trigger(self):
        self.position = 0
        self.is_playing = True


kick = DrumSampler("sounds/Electronic-Kick-1.wav", "right")
snare = DrumSampler("sounds/Ensoniq-ESQ-1-Snare.wav", "left")

def process_hand_landmarks(results, frame, hand_landmarks_data):
    hand_landmarks_data.clear()
    
    if results.multi_hand_landmarks:
        for idx, hand_landmarks in enumerate(results.multi_hand_landmarks):
            # Get the hand label (Left or Right)
            hand_label = results.multi_handedness[idx].classification[0].label
            
            # Draw hand landmarks
            kick.mp_draw.draw_landmarks(frame, hand_landmarks, 
                                     kick.mp_hands.HAND_CONNECTIONS)
            hand_landmarks_data.append([
            {"x": lm.x, "y": lm.y, "z": lm.z}
            for lm in hand_landmarks.landmark
        ])

            
            # Calculate index finger tip position (for velocity calculation)
            y = int(hand_landmarks.landmark[8].y * frame.shape[0])  # Index finger tip position
            
            # Identify if it's the right hand (kick) or left hand (snare)
            if hand_label == 'Right':
                # Calculate velocity (movement in y direction)
                if kick.prev_y is not None:
                    velocity = y - kick.prev_y
                    
                    # Trigger on downward motion (quick downward motion)
                    if velocity > kick.velocity_threshold and kick.allow_trigger:
                        kick.trigger()
                        kick.allow_trigger = False  # Prevent triggering again until upward motion
                    
                    # Reset trigger condition after upward motion (negative velocity)
                    if velocity < -kick.velocity_threshold:
                        kick.allow_trigger = True


                kick.prev_y = y
            
            elif hand_label == 'Left':
                # Calculate velocity for left hand (snare)
                if snare.prev_y is not None:
                    velocity = y - snare.prev_y
                    
                    # Trigger on downward motion (quick downward motion)
                    if velocity > snare.velocity_threshold and snare.allow_trigger:
                        snare.trigger()
                        snare.allow_trigger = False  # Prevent triggering again until upward motion
                    
                    # Reset trigger condition after upward motion (negative velocity)
                    if velocity < -snare.velocity_threshold:
                        snare.allow_trigger = True

                snare.prev_y = y
