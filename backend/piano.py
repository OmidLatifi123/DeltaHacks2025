import cv2
import mediapipe as mp
import pygame.midi
from flask import Flask, jsonify, Response
from flask_cors import CORS
from threading import Thread

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
hands = mp_hands.Hands(min_detection_confidence=0.5, min_tracking_confidence=0.5)

# Initialize pygame MIDI
pygame.midi.init()
midi_out = pygame.midi.Output(pygame.midi.get_default_output_id())

# MIDI notes
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

# Track active notes
active_notes = {}
is_running = False


def draw_keys(frame):
    """Draw the piano keys on the video frame."""
    for key in keys:
        cv2.rectangle(frame, (key['x_min'], key['y_min']), (key['x_max'], key['y_max']), (255, 255, 255), 2)
        cv2.putText(frame, key['note'], (key['x_min'] + 10, key['y_min'] - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)


def play_midi(note):
    """Play a MIDI note."""
    if note in midi_note_numbers and note not in active_notes:
        midi_out.note_on(midi_note_numbers[note], velocity=100)
        active_notes[note] = True


def stop_midi(note):
    """Stop a MIDI note."""
    if note in midi_note_numbers and note in active_notes:
        midi_out.note_off(midi_note_numbers[note], velocity=100)
        del active_notes[note]


@app.route('/webcam')
def webcam():
    """Stream webcam feed to the frontend."""
    def generate_frames():
        cap = cv2.VideoCapture(0)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        while True:
            success, frame = cap.read()
            if not success:
                break
            else:
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = hands.process(rgb_frame)
                frame = cv2.cvtColor(rgb_frame, cv2.COLOR_RGB2BGR)
                draw_keys(frame)

                if results.multi_hand_landmarks:
                    for hand_landmarks in results.multi_hand_landmarks:
                        mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

                        keys_with_fingers = set()
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

                _, buffer = cv2.imencode('.jpg', frame)
                frame = buffer.tobytes()
                yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        cap.release()

    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/')
def home():
    """Default route."""
    return jsonify({"message": "Piano Backend is running"})


@app.route('/start-piano', methods=['GET'])
def start_piano():
    """Start the piano service."""
    global is_running
    if not is_running:
        thread = Thread(target=run_virtual_piano)
        thread.start()
        return jsonify({'status': 'success', 'message': 'Virtual piano started'})
    return jsonify({'status': 'error', 'message': 'Virtual piano is already running'})


@app.route('/stop-piano', methods=['GET'])
def stop_piano():
    """Stop the piano service."""
    global is_running
    is_running = False
    return jsonify({'status': 'success', 'message': 'Virtual piano stopped'})


@app.route('/hand-data', methods=['GET'])
def get_hand_data():
    """Endpoint for hand data."""
    return jsonify({'message': 'Hand data is being processed via webcam.'})


def run_virtual_piano():
    """Main piano logic."""
    global is_running
    is_running = True
    cap = cv2.VideoCapture(0)
    while is_running and cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(rgb_frame)
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                keys_with_fingers = set()
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
        if cv2.waitKey(1) & 0xFF == ord('q'):
            is_running = False
            break
    cap.release()


if __name__ == '__main__':
    app.run(port=5000)
