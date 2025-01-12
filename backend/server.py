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
from music21 import stream, note, chord, tempo, meter, metadata
import time
from AI_Utils import generate_notes_from_instructions
from dotenv import load_dotenv


load_dotenv()
# Initialize Flask app
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
hands = mp_hands.Hands(min_detection_confidence= 0.6, min_tracking_confidence= 0.5)

hand_landmarks_data = []
active_instrument = "piano"
recent_notes = []
# Ensure the Images folder exists
images_folder = "Images"
os.makedirs(images_folder, exist_ok=True)
pipeline = None
is_recording = False
recorded_notes = []
last_append_time = None

# Ensure the notes folder exists
notes_folder = "notes"
os.makedirs(notes_folder, exist_ok=True)


@app.route('/generate-notes', methods=['POST'])
def generate_notes():
    """
    Generate notes based on user instructions received from the frontend.
    """
    data = request.get_json()
    instructions = data.get('instructions')

    if not instructions:
        return jsonify({"status": "error", "message": "No instructions provided."}), 400

    result = generate_notes_from_instructions(instructions)

    if isinstance(result, list):
        try:
            # Create a filename with timestamp
            pdf_filename = f"notes_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            pdf_path = os.path.join(notes_folder, pdf_filename)

            # Create a music21 stream
            sheet_music = stream.Stream()
            sheet_music.metadata = metadata.Metadata()
            sheet_music.metadata.title = "AI powered notes"
            sheet_music.append(tempo.MetronomeMark(number=120))
            sheet_music.append(meter.TimeSignature('4/4'))

            # Add notes to the stream
            for note_data in result:
                n = note.Note(note_data["pitch"])
                n.duration.quarterLength = note_data["duration"] * 2
                n.volume.velocity = note_data["velocity"]
                sheet_music.append(n)

            # Write to PDF
            sheet_music.write(fmt='musicxml.pdf', fp=pdf_path)

            return jsonify({
                "status": "success",
                "message": "Notes generated successfully.",
                "filename": pdf_filename
            })
        except Exception as e:
            return jsonify({
                "status": "error",
                "message": f"Error creating sheet music: {str(e)}"
            }), 500
    else:
        return jsonify({
            "status": "error",
            "message": "Failed to generate notes."
        }), 500



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

@app.route('/album-covers/<string:filename>', methods=['DELETE'])
def delete_album_cover(filename):
    """Delete a specific album cover."""
    file_path = os.path.join(images_folder, filename)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            return jsonify({"status": "success", "message": f"{filename} has been deleted."}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": f"Error deleting file: {str(e)}"}), 500
    else:
        return jsonify({"status": "error", "message": f"File {filename} not found."}), 404


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


def round_to_nearest_duration(time_interval):
    # Define the note durations based on a quarter note length of 0.5
    note_durations = {
        "eighth": 0.25,
        "quarter": 0.5,
        "dotted quarter": 0.75,
        "half": 1.0,
        "dotted half": 1.5,
        "whole": 2.0
    }
    
    # Find the closest duration
    closest_note = min(note_durations, key=lambda note: abs(note_durations[note] - time_interval))
    
    return note_durations[closest_note]

def Create_Sheet_Music(recorded_notes):
    # Create a new music21 stream
    sheet_music = stream.Stream()

    sheet_music.metadata = metadata.Metadata()
    sheet_music.metadata.title = "Untitled Custom Composition"
    sheet_music.append(tempo.MetronomeMark(number=120))
    sheet_music.append(meter.TimeSignature("4/4"))

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
    for entry in recorded_notes:
        notes = entry.get("notes", [])
        time_interval = entry.get("time_interval")
        if time_interval is None or time_interval < 0.2:
            continue
        time_interval = round_to_nearest_duration(time_interval)

        # Calculate quarterLength based on time_interval and 120 BPM
        quarter_length = time_interval / 0.5  # 0.5 seconds per beat at 120 BPM

        if not notes:  # Treat as a rest if no notes are present
            r = note.Rest()
            r.quarterLength = quarter_length
            sheet_music.append(r)
        elif len(notes) == 1:  # Single note
            pitch = notes[0]
            if pitch in note_mapping:
                n = note.Note(note_mapping[pitch])
                n.quarterLength = quarter_length
                sheet_music.append(n)
        else:  # Multiple notes, treat as a chord
            pitches = [note_mapping[n] for n in notes if n in note_mapping]
            if pitches:
                c = chord.Chord(pitches)
                c.quarterLength = quarter_length
                sheet_music.append(c)

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
        global last_append_time

        while True:
            success, frame = cap.read()
            if not success:
                break

            frame = cv2.flip(frame, 1)
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = hands.process(rgb_frame)

            # Process based on the instrument
            if active_instrument == "piano":
                piano.draw_keys(frame)
                recent_notes = piano.process_hand_landmarks(results, frame, hand_landmarks_data)
                if recent_notes:
                    socketio.emit("recent_key", {"key": recent_notes[-1] if recent_notes else ""})
                if is_recording:
                    if not recorded_notes:
                        if recent_notes:
                            recorded_notes.append({
                                'notes': recent_notes.copy(),
                                'time_interval': None
                            })
                            last_append_time = time.time()
                    elif recent_notes != recorded_notes[-1]['notes']:
                        current_time = time.time()
                        time_interval = current_time - last_append_time
                        last_append_time = current_time
                        recorded_notes[-1]['time_interval'] = time_interval
                        recorded_notes.append({
                            'notes': recent_notes.copy(),
                            'time_interval': None
                        })
                else:
                    last_append_time = None
                    if recorded_notes:
                        sheet_music = Create_Sheet_Music(recorded_notes)
                        pdf_path = f"notes/output_sheet_music_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
                        sheet_music.write(fmt='musicxml.pdf', fp=pdf_path)
                        recorded_notes = []
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
    """Set recording state based on received value."""
    global is_recording
    data = request.get_json()
    is_recording = data.get('isRecording', False)
    print(f"Recording state: {is_recording}")
    return jsonify({
        "status": "success", 
        "recording": is_recording
    })

@app.route('/sheet-music', methods=['GET'])
def get_sheet_music():
    """List all sheet music files with metadata, ordered by creation date."""
    sheet_music_files = []
    for filename in os.listdir(notes_folder):
        if filename.endswith('.pdf'):
            file_path = os.path.join(notes_folder, filename)
            created_at = os.path.getctime(file_path)
            sheet_music_files.append({
                "filename": filename,
                "createdAt": datetime.fromtimestamp(created_at).isoformat()
            })
    
    # Sort the list by createdAt in ascending order (oldest first)
    sorted_files = sorted(sheet_music_files, key=lambda x: x['createdAt'])

    return jsonify(sorted_files)


@app.route('/sheet-music/<string:filename>', methods=['DELETE'])
def delete_sheet_music(filename):
    """Delete a specific sheet music file."""
    file_path = os.path.join(notes_folder, filename)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            return jsonify({"status": "success", "message": f"{filename} has been deleted."}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": f"Error deleting file: {str(e)}"}), 500
    else:
        return jsonify({"status": "error", "message": f"File {filename} not found."}), 404


@app.route('/Notes/<path:filename>')
def serve_sheet_music(filename):
    """Serve sheet music files."""
    return send_from_directory(notes_folder, filename)

if __name__ == '__main__':
    app.run(port=5000)
