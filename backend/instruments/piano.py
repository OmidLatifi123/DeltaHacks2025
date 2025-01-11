import cv2
import mediapipe as mp
import pygame.midi

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils

pygame.midi.init()
midi_out = pygame.midi.Output(pygame.midi.get_default_output_id())

# MIDI note numbers for a single octave
midi_note_numbers = {
    "C": 60, "D": 62, "E": 64, "F": 65, "G": 67, "A": 69, "B": 71, "C_high": 72
}

# Virtual piano keys
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

# Track active notes, hand data, and played notes
active_notes = set()
recent_notes = []  # Keep track of the most recent notes played (up to 10)


def draw_keys(frame):
    """Draw virtual piano keys on the video frame."""
    for key in keys:
        cv2.rectangle(
            frame,
            (key['x_min'], key['y_min']),
            (key['x_max'], key['y_max']),
            (255, 255, 255),
            2,
        )
        cv2.putText(
            frame,
            key['note'],
            (key['x_min'] + 10, key['y_min'] - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (255, 255, 255),
            1,
        )

def process_hand_landmarks(results, frame, hand_landmarks_data):
    keys_with_fingers = set()
    hand_landmarks_data.clear()
    """Detect fingers over keys and play notes."""
    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

            # Extract and store hand landmarks for /hand-data endpoint
            hand_landmarks_data.append([
                {"x": lm.x, "y": lm.y, "z": lm.z}
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
                    if key['x_min'] <= fingertip_x <= key['x_max'] and key['y_min'] <= fingertip_y <= key['y_max']:
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