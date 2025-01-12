from datetime import datetime
import cv2
import mediapipe as mp
from flask import Flask, jsonify, Response, request, send_from_directory
from flask_cors import CORS
from diffusers import StableDiffusionPipeline
import torch
import os
import importlib
from flask_socketio import SocketIO
import instruments.drums as drums
import instruments.piano as piano
from music21 import stream, note

# Initialize Flask app
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
hands = mp_hands.Hands(min_detection_confidence= 0.5, min_tracking_confidence= 0.5)

hand_landmarks_data = []
active_instrument = "piano"
recent_notes = []
# Ensure the Images folder exists
images_folder = "Images"
os.makedirs(images_folder, exist_ok=True)
pipeline = None
is_recording = False
recorded_notes = []

# Ensure the notes folder exists
notes_folder = "notes"
os.makedirs(notes_folder, exist_ok=True)

def generate_abstract_album_cover(notes):
    """
    Generate an abstract, detailed album cover based on the most recent notes played.
    """
    global pipeline
    if pipeline is None:  # Check if the pipeline is already loaded
        print("Loading StableDiffusion pipeline...")
        device = "cuda" if torch.cuda.is_available() else "cpu"
        pipeline = StableDiffusionPipeline.from_pretrained("CompVis/stable-diffusion-v1-4").to(device)
        pipeline.safety_checker = None 
    # Create a prompt based on the notes
    note_colors = {
        "C": "red", "D": "green", "E": "blue", "F": "yellow",
        "G": "purple", "A": "orange", "B": "pink", "C_high": "cyan"
    }
    
    prompt_elements = [f"{note_colors.get(note, 'colorful')} light" for note in notes]
    prompt = (
        "A detailed, vibrant abstract album cover featuring swirling, "
        "dynamic patterns of " + ", ".join(prompt_elements) + ". "
        "Highly artistic, detailed, and modern design, perfect for a modern album."
    )

    # Generate the image
    image = pipeline(prompt, guidance_scale=7.5).images[0]

    # Ensure the images folder exists
    os.makedirs(images_folder, exist_ok=True)

    # Use the current timestamp for the filename
    filename = f"abstract_album_cover_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
    image_path = os.path.join(images_folder, filename)
    image.save(image_path)

    return image_path


@app.route('/generate-image', methods=['POST'])
def generate_image():
    global recent_notes
    """Generate an abstract album cover based on recent notes."""
    if not recent_notes:
        return jsonify({"error": "No notes played yet."}), 400

    image_path = generate_abstract_album_cover(recent_notes)
    recent_notes = []  # Clear recent notes after generating the image
    return jsonify({"message": "Image generated successfully!", "image_url": f"/Images/{os.path.basename(image_path)}"})


@app.route('/Images/<path:filename>')
def serve_image(filename):
    """Serve generated images."""
    return send_from_directory(images_folder, filename)

@app.route('/notes/<path:filename>')
def serve_sheet(filename):
    """Serve generated images."""
    return send_from_directory(notes_folder, filename)

def load_instrument(name):
    """Dynamically load the instrument module."""
    global active_instrument
    try:
        _ = importlib.import_module(f'instruments.{name}')
        active_instrument = name
        print(f"Loaded instrument: {name}")
    except ModuleNotFoundError:
        print(f"Instrument module '{name}' not found!")
        active_instrument = None

@app.route('/set-instrument', methods=['POST'])
def set_instrument():
    """Set the active instrument."""
    global active_instrument
    instrument_name = request.json.get('instrument')
    active_instrument = instrument_name  # Store the chosen instrument
    load_instrument(instrument_name)
    if active_instrument:
        return jsonify({"status": "success", "instrument": instrument_name}), 200
    else:
        return jsonify({"status": "error", "message": "Instrument not found!"}), 404
    

@app.route('/hand-data', methods=['GET'])
def get_hand_data():
    """Provide hand data to the frontend."""
    global hand_landmarks_data
    return jsonify({'hands': hand_landmarks_data})  


def Create_Sheet_Music(recorded_notes):
    # Create a new music21 stream
    sheet_music = stream.Stream()

    # Map note names to pitches
    note_mapping = {
         "C": "C4",
        "C#": "C#4",
        "D": "D4",
        "D#": "D#4",
        "E": "E4",
        "F": "F4",
        "F#": "F#4",
        "G": "G4",
        "G#": "G#4",
        "A": "A4",
        "A#": "A#4",
        "B": "B4",
        "C_High": "C5"
    }

    # Convert recorded notes into music21 notes
    for pitch in recorded_notes:
        if pitch in note_mapping:
            # Create a quarter note for each pitch
            n = note.Note(note_mapping[pitch])
            n.quarterLength = 1  # Quarter note
            sheet_music.append(n)
        else:
            print(f"Warning: Note '{pitch}' is not recognized and will be skipped.")


    return sheet_music

@app.route('/webcam')
def webcam():
    """Stream webcam feed to the frontend."""
    def generate_frames():
        global recent_notes
        global recorded_notes
        cap = cv2.VideoCapture(0)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        global hand_landmarks_data
        while True:
            success, frame = cap.read()
            if not success:
                break

            frame = cv2.flip(frame, 1)
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = hands.process(rgb_frame)

            # Process based on the instrument
# Update this section in the webcam route inside generate_frames()
            if active_instrument == "piano":
                piano.draw_keys(frame)
                recent_notes = piano.process_hand_landmarks(results, frame, hand_landmarks_data)
                if recent_notes:
                    if is_recording:
                        if not recorded_notes or recent_notes[0] != recorded_notes[-1]:
                            recorded_notes.extend(recent_notes)
                    else:
                        if recorded_notes:
                            sheet_music = Create_Sheet_Music(recorded_notes)
                            pdf_path = f"notes/output_sheet_music_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
                            sheet_music.write(fmt='musicxml.pdf', fp=pdf_path)
                            recorded_notes = []

                    socketio.emit("recent_key", {"key": recent_notes[-1] if recent_notes else ""}) #Is this ever > 1 anyway?
            elif active_instrument == "drums":
                drums.process_hand_landmarks(results, frame, hand_landmarks_data)

            # Emit hand data via WebSocket
            socketio.emit('hand_data', {'hands': hand_landmarks_data})

            # Encode and stream video
            _, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()
            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        cap.release()

    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')


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

@app.route('/toggle-recording', methods=['POST'])
def toggle_recording():
    """Toggle recording state."""
    global is_recording
    is_recording = not is_recording  # Toggle the state
    print(f"Recording state: {is_recording}")
    return jsonify({
        "status": "success", 
        "recording": is_recording
    })

@app.route('/sheet-music', methods=['GET'])
def get_sheet_music():
    """List all sheet music files with metadata."""
    sheet_music_files = []
    for filename in os.listdir(notes_folder):
        if filename.endswith(('.pdf')):
            file_path = os.path.join(notes_folder, filename)
            created_at = os.path.getctime(file_path)
            sheet_music_files.append({
                "filename": filename,
                "createdAt": datetime.fromtimestamp(created_at).isoformat()
            })
    return jsonify(sheet_music_files)

@app.route('/Notes/<path:filename>')
def serve_sheet_music(filename):
    """Serve sheet music files."""
    return send_from_directory(notes_folder, filename)

if __name__ == '__main__':
    app.run(port=5000)
