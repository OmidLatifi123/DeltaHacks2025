import cv2
import mediapipe as mp
import pygame.midi

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
hands = mp_hands.Hands(min_detection_confidence=0.5, min_tracking_confidence=0.5)

# Initialize pygame MIDI
pygame.midi.init()
midi_out = pygame.midi.Output(0)

# MIDI note numbers for a single octave
midi_note_numbers = {
    "C": 60,  # Middle C
    "D": 62,
    "E": 64,
    "F": 65,
    "G": 67,
    "A": 69,
    "B": 71,
    "C_high": 72
}

# Define smaller virtual piano keys
keys = [
    {'note': 'C', 'x_min': 50, 'x_max': 100, 'y_min': 300, 'y_max': 350},
    {'note': 'D', 'x_min': 100, 'x_max': 150, 'y_min': 300, 'y_max': 350},
    {'note': 'E', 'x_min': 150, 'x_max': 200, 'y_min': 300, 'y_max': 350},
    {'note': 'F', 'x_min': 200, 'x_max': 250, 'y_min': 300, 'y_max': 350},
    {'note': 'G', 'x_min': 250, 'x_max': 300, 'y_min': 300, 'y_max': 350},
    {'note': 'A', 'x_min': 300, 'x_max': 350, 'y_min': 300, 'y_max': 350},
    {'note': 'B', 'x_min': 350, 'x_max': 400, 'y_min': 300, 'y_max': 350},
    {'note': 'C_high', 'x_min': 400, 'x_max': 450, 'y_min': 300, 'y_max': 350},
]

# Track active notes (to prevent repeated playing)
active_notes = {}

def draw_keys(frame):
    """Draw virtual piano keys on the screen."""
    for key in keys:
        cv2.rectangle(frame, (key['x_min'], key['y_min']), (key['x_max'], key['y_max']), (255, 255, 255), 2)
        cv2.putText(frame, key['note'], (key['x_min'] + 10, key['y_min'] - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

def play_midi(note):
    """Play a MIDI note."""
    if note in midi_note_numbers and note not in active_notes:
        midi_out.note_on(midi_note_numbers[note], velocity=100)
        active_notes[note] = True  # Mark the note as active

def stop_midi(note):
    """Stop a MIDI note."""
    if note in midi_note_numbers and note in active_notes:
        midi_out.note_off(midi_note_numbers[note], velocity=100)
        del active_notes[note]

# Start capturing video
cap = cv2.VideoCapture(0)

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        print("Failed to capture frame. Exiting...")
        break

    # Convert BGR to RGB for MediaPipe
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(rgb_frame)

    # Draw keys on the frame
    draw_keys(frame)

    # Track which keys have fingers on them
    keys_with_fingers = set()

    # Detect hand landmarks
    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

            # Iterate over all finger landmarks
            for finger_tip_idx in [
                mp_hands.HandLandmark.THUMB_TIP,
                mp_hands.HandLandmark.INDEX_FINGER_TIP,
                mp_hands.HandLandmark.MIDDLE_FINGER_TIP,
                mp_hands.HandLandmark.RING_FINGER_TIP,
                mp_hands.HandLandmark.PINKY_TIP,
            ]:
                fingertip_x = int(hand_landmarks.landmark[finger_tip_idx].x * frame.shape[1])
                fingertip_y = int(hand_landmarks.landmark[finger_tip_idx].y * frame.shape[0])

                # Check if the finger is over any key
                for key in keys:
                    if key['x_min'] <= fingertip_x <= key['x_max'] and key['y_min'] <= fingertip_y <= key['y_max']:
                        keys_with_fingers.add(key['note'])

    # Play notes for keys with fingers
    for note in keys_with_fingers:
        play_midi(note)

    # Stop notes for keys without fingers
    for note in list(active_notes):  # Use list to avoid modifying the dictionary while iterating
        if note not in keys_with_fingers:
            stop_midi(note)

    # Show the frame
    cv2.imshow('Virtual Piano', frame)

    # Exit on pressing 'q'
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
pygame.midi.quit()
cv2.destroyAllWindows()
