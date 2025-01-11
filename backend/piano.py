from datetime import datetime
import cv2
import mediapipe as mp
import pygame.midi
from flask import Flask, jsonify, Response, request, send_from_directory
from flask_cors import CORS
from diffusers import StableDiffusionPipeline
import torch
import os
import random

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
hand_landmarks_data = []
recent_notes = []  # Keep track of the most recent notes played (up to 10)

# Ensure the Images folder exists
images_folder = "Images"
os.makedirs(images_folder, exist_ok=True)

# Load Stable Diffusion pipeline
pipeline = StableDiffusionPipeline.from_pretrained("CompVis/stable-diffusion-v1-4").to("cuda")
pipeline.safety_checker = None  # Disable safety checker for abstract album covers


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


def generate_abstract_album_cover(notes):
    """
    Generate an abstract, detailed album cover based on the most recent notes played.
    """
    # Create a prompt based on the notes
    note_colors = {
        "C": "red", "D": "green", "E": "blue", "F": "yellow",
        "G": "purple", "A": "orange", "B": "pink", "C_high": "cyan"
    }
    
    prompt_elements = [f"{note_colors.get(note, 'colorful')} light" for note in notes]
    prompt = (
        "A detailed, vibrant abstract album cover featuring swirling, "
        "dynamic patterns of " + ", ".join(prompt_elements) + ". "
        "Highly artistic and futuristic design, perfect for a modern album."
    )

    # Generate the image
    image = pipeline(prompt, guidance_scale=7.5).images[0]

    # Save the image
    image_path = os.path.join(images_folder, f"abstract_album_cover_{random.randint(1000, 9999)}.png")
    image.save(image_path)
    return image_path


@app.route('/generate-image', methods=['POST'])
def generate_image():
    """Generate an abstract album cover based on recent notes."""
    global recent_notes
    if not recent_notes:
        return jsonify({"error": "No notes played yet."}), 400

    image_path = generate_abstract_album_cover(recent_notes)
    recent_notes = []  # Clear recent notes after generating the image
    return jsonify({"message": "Image generated successfully!", "image_url": f"/Images/{os.path.basename(image_path)}"})


@app.route('/Images/<path:filename>')
def serve_image(filename):
    """Serve generated images."""
    return send_from_directory(images_folder, filename)


@app.route('/webcam')
def webcam():
    """Stream webcam feed to the frontend."""
    def generate_frames():
        cap = cv2.VideoCapture(0)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        global hand_landmarks_data
        while True:
            success, frame = cap.read()
            if not success:
                break
            else:
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = hands.process(rgb_frame)
                frame = cv2.cvtColor(rgb_frame, cv2.COLOR_RGB2BGR)
                draw_keys(frame)

                hand_landmarks_data = []
                keys_with_fingers = set()

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

                _, buffer = cv2.imencode('.jpg', frame)
                frame = buffer.tobytes()
                yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        cap.release()

    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/hand-data', methods=['GET'])
def get_hand_data():
    """Provide hand data to the frontend."""
    global hand_landmarks_data
    return jsonify({'hands': hand_landmarks_data})

@app.route('/album-covers', methods=['GET'])
def get_album_covers():
    """List all album cover images with metadata."""
    image_files = []
    for filename in os.listdir(images_folder):
        if filename.endswith(('.png', '.jpg', '.jpeg')):
            file_path = os.path.join(images_folder, filename)
            created_at = os.path.getctime(file_path)
            image_files.append({
                "filename": filename,
                "createdAt": datetime.fromtimestamp(created_at).isoformat()
            })
    return jsonify(image_files)


if __name__ == '__main__':
    app.run(port=5000)
