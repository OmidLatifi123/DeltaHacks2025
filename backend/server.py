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

# Initialize Flask app
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
hands = mp_hands.Hands(min_detection_confidence=0.5, min_tracking_confidence=0.5)

hand_landmarks_data = []
active_instrument = "piano"
recent_notes = []
# Ensure the Images folder exists
images_folder = "Images"
os.makedirs(images_folder, exist_ok=True)

# Load the pipeline and move it to the appropriate device
pipeline = None



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


@app.route('/webcam')
def webcam():
    """Stream webcam feed to the frontend."""
    def generate_frames():
        global recent_notes
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
        # Emit the most recent key to the frontend
                    socketio.emit("recent_key", {"key": recent_notes[-1] if recent_notes else ""})
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


if __name__ == '__main__':
    app.run(port=5000)
