import cv2
import mediapipe as mp
import numpy as np
import pygame.midi

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils

pygame.midi.init()
midi_out = pygame.midi.Output(pygame.midi.get_default_output_id())

# MIDI note numbers for a single octave
midi_note_numbers = {
    "C": 60, "C#": 61, "D": 62, "D#": 63, "E": 64, "F": 65, "F#": 66, "G": 67, "G#": 68, "A": 69, "A#": 70, "B": 71
}

keys = [ 
    {'note': 'C', 'shape': np.array([[50, 200], [85, 200], [85, 300], [50, 300]], np.int32), 'type': 'white'},
    {'note': 'D', 'shape': np.array([[115, 200], [135, 200], [135, 300], [115, 300]], np.int32), 'type': 'white'},
    {'note': 'E', 'shape': np.array([[165, 200], [200, 200], [200, 300], [165, 300]], np.int32), 'type': 'white'},
    {'note': 'F', 'shape': np.array([[200, 200], [235, 200], [235, 300], [200, 300]], np.int32), 'type': 'white'},
    {'note': 'G', 'shape': np.array([[265, 200], [285, 200], [285, 300], [265, 300]], np.int32), 'type': 'white'},
    {'note': 'A', 'shape': np.array([[315, 200], [335, 200], [335, 300], [315, 300]], np.int32), 'type': 'white'},
    {'note': 'B', 'shape': np.array([[365, 200], [400, 200], [400, 300], [365, 300]], np.int32), 'type': 'white'},
    {'note': 'C', 'shape': np.array([[50, 300], [100, 300], [100, 350], [50, 350]], np.int32), 'type': 'white_extension'},
    {'note': 'D', 'shape': np.array([[100, 300], [150, 300], [150, 350], [100, 350]], np.int32), 'type': 'white_extension'},
    {'note': 'E', 'shape': np.array([[150, 300], [200, 300], [200, 350], [150, 350]], np.int32), 'type': 'white_extension'},
    {'note': 'F', 'shape': np.array([[200, 300], [250, 300], [250, 350], [200, 350]], np.int32), 'type': 'white_extension'},
    {'note': 'G', 'shape': np.array([[250, 300], [300, 300], [300, 350], [250, 350]], np.int32), 'type': 'white_extension'},
    {'note': 'A', 'shape': np.array([[300, 300], [350, 300], [350, 350], [300, 350]], np.int32), 'type': 'white_extension'},
    {'note': 'B', 'shape': np.array([[350, 300], [400, 300], [400, 350], [350, 350]], np.int32), 'type': 'white_extension'},   

    # Black keys
    {'note': 'C#', 'shape': np.array([[85, 200], [115, 200], [115, 300], [85, 300]], np.int32), 'type': 'black'},
    {'note': 'D#', 'shape': np.array([[135, 200], [165, 200], [165, 300], [135, 300]], np.int32), 'type': 'black'},
    {'note': 'F#', 'shape': np.array([[235, 200], [265, 200], [265, 300], [235, 300]], np.int32), 'type': 'black'},
    {'note': 'G#', 'shape': np.array([[285, 200], [315, 200], [315, 300], [285, 300]], np.int32), 'type': 'black'},
    {'note': 'A#', 'shape': np.array([[335, 200], [365, 200], [365, 300], [335, 300]], np.int32), 'type': 'black'},
]



# Track active notes, hand data, and played notes
active_notes = set()
recent_notes = []  # Keep track of the most recent notes played (up to 10)


def draw_keys(frame):
    for key in keys:
        x_min = key['shape'][:, 0].min()
        y_min = key['shape'][:, 1].min()
        if key['type'] == 'white':
            # Draw the main white key
            cv2.fillPoly(frame, [key['shape']], (255, 255, 255))
            shape = key['shape']
            cv2.line(frame, tuple(shape[0]), tuple(shape[3]), color=(0, 0, 0), thickness=2)  # Left side
            cv2.line(frame, tuple(shape[0]), tuple(shape[1]), color=(0, 0, 0), thickness=2)  # top side
            cv2.line(frame, tuple(shape[2]), tuple(shape[1]), color=(0, 0, 0), thickness=2)  # Right side
            cv2.putText(frame, key['note'], (x_min + 10, y_min - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        elif key['type'] == 'black':
            # Draw the black key
            cv2.fillPoly(frame, [key['shape']], (0, 0, 0))
        elif key['type'] == 'white_extension':
            # Draw the white key extension without the top line
            cv2.fillPoly(frame, [key['shape']], (255, 255, 255))
            # Get the coordinates of the extension and draw only the sides and bottom
            shape = key['shape']
            cv2.line(frame, tuple(shape[0]), tuple(shape[3]), color=(0, 0, 0), thickness=2)  # Left side
            cv2.line(frame, tuple(shape[3]), tuple(shape[2]), color=(0, 0, 0), thickness=2)  # Bottom side
            cv2.line(frame, tuple(shape[2]), tuple(shape[1]), color=(0, 0, 0), thickness=2)  # Right side

def process_hand_landmarks(results, frame, hand_landmarks_data):
    keys_with_fingers = set()
    hand_landmarks_data.clear()
    """Detect fingers over keys and play notes."""
    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

            # Extract and store hand landmarks for /hand-data endpoint
            hand_landmarks_data.append([
                {"x": 1 - lm.x, "y": lm.y, "z": lm.z}
                for lm in hand_landmarks.landmark
            ])

            # Detect fingers over keys
            for finger_tip_idx in [
                mp_hands.HandLandmark.THUMB_TIP,
                mp_hands.HandLandmark.INDEX_FINGER_TIP,
                mp_hands.HandLandmark.MIDDLE_FINGER_TIP,
                mp_hands.HandLandmark.RING_FINGER_TIP,
                mp_hands.HandLandmark.PINKY_TIP,
            ]:
                fingertip_x = int(hand_landmarks.landmark[finger_tip_idx].x * frame.shape[1])
                fingertip_y = int(hand_landmarks.landmark[finger_tip_idx].y * frame.shape[0])

                for key in keys:
                    x_min, x_max = key['shape'][0][0], key['shape'][2][0]
                    y_min, y_max = key['shape'][0][1], key['shape'][2][1]
                    if x_min <= fingertip_x <= x_max and y_min <= fingertip_y <= y_max:
                        keys_with_fingers.add(key['note'])

    for note in keys_with_fingers:
        play_midi(note)

    for note in list(active_notes):
        if note not in keys_with_fingers:
            stop_midi(note)
    return recent_notes

def play_midi(note):
    """Play a MIDI note and record it."""
    global recent_notes
    if note in midi_note_numbers and note not in active_notes:
        midi_out.note_on(midi_note_numbers[note], velocity=100)
        active_notes.add(note)

        # Record the note
        recent_notes.append(note)
        if len(recent_notes) > 10:  # Keep only the last 10 notes
            recent_notes.pop(0)


def stop_midi(note):
    """Stop a MIDI note."""
    if note in midi_note_numbers and note in active_notes:
        midi_out.note_off(midi_note_numbers[note], velocity=100)
        active_notes.remove(note)