import openai
import os
import json
from music21 import stream, note, chord, tempo, meter, metadata
from datetime import datetime

def generate_notes_from_instructions(user_instruction):
    """
    Generates MIDI-compatible note data from user instructions.
    Returns a list of note dictionaries with time, pitch, duration, and velocity.
    """
    try:
        openai.api_key = os.getenv("OPENAI_API_KEY")
        if not openai.api_key:
            print("OpenAI API key not found")
            return None

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages = [

                {
                    "role": "system",
                    "content": (
                        "You are an experimental AI music composer specializing in creating expressive and genre-specific music compositions. "
                        "Your task is to generate a JSON array of musical notes that adhere strictly to the following format: "
                        "[{\"time\": <float>, \"pitch\": <int>, \"duration\": <float>, \"velocity\": <int>}]. "
                        "Each note must have these properties:\n"
                        "- time: The time the note starts (in seconds, a float).\n"
                        "- pitch: The MIDI pitch of the note (an integer between 60-72, representing C4 to C5).\n"
                        "- duration: The duration of the note (in seconds, a float).\n"
                        "- velocity: The volume of the note (an integer between 0-127).\n\n"
                        "You may vary the time, pitch, duration, and velocity creatively, within these constraints. "
                        "The generated music should align with the user's provided genre, mood, or pattern instructions. "
                        "Output only the JSON array, without any additional text or explanations."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        "Generate a JSON array of notes like this:\n"
                        "[\n"
                        "  { \"time\": 0.0, \"pitch\": 60, \"duration\": 0.5, \"velocity\": 90 },\n"
                        "  { \"time\": 0.5, \"pitch\": 63, \"duration\": 0.5, \"velocity\": 85 },\n"
                        "  ...\n"
                        "]\n"
                        "Based on the following instruction: " + user_instruction
                    )
                }
            ],

            temperature=0.9
        )

        # Extract and parse the JSON response
        notes_json = response['choices'][0]['message']['content']
        notes = json.loads(notes_json)
        return notes

    except Exception as e:
        print(f"Error generating notes: {e}")
        return None


def validate_notes(notes):
    """
    Validates the structure and values of generated note data.
    """
    if not isinstance(notes, list):
        return False

    required_keys = {'time', 'pitch', 'duration', 'velocity'}
    
    for note in notes:
        # Check if all required keys are present
        if not all(key in note for key in required_keys):
            return False
            
        # Validate data types and ranges
        if not isinstance(note['time'], (int, float)) or note['time'] < 0:
            return False
        
        if not isinstance(note['pitch'], int) or not (0 <= note['pitch'] <= 127):
            return False
        
        if not isinstance(note['duration'], (int, float)) or note['duration'] <= 0:
            return False
        
        if not isinstance(note['velocity'], int) or not (0 <= note['velocity'] <= 127):
            return False
            
    return True

def create_sheet_music_from_notes(notes, output_path, title):
    """
    Creates a sheet music PDF from a list of notes.
    
    Args:
        notes (list): List of note dictionaries
        output_path (str): Path to save the PDF
        title (str): Title for the sheet music
        
    Returns:
        tuple: (success, message, filename)
    """
    try:
        # Create a music21 stream
        sheet_music = stream.Stream()
        
        # Add metadata
        sheet_music.metadata = metadata.Metadata()
        sheet_music.metadata.title = title
        
        # Add time signature and tempo
        sheet_music.append(tempo.MetronomeMark(number=120))
        sheet_music.append(meter.TimeSignature('4/4'))
        
        # Add the notes to the stream
        for note_data in notes:
            n = note.Note(note_data['pitch'])
            n.duration.quarterLength = note_data['duration'] * 4  # Convert to music21 duration
            n.volume.velocity = note_data['velocity']
            # Set the offset (start time) for the note
            n.offset = note_data['time'] * 4  # Convert to music21 time units
            sheet_music.append(n)
        
        # Generate unique filename
        filename = f"notes_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        filepath = os.path.join(output_path, filename)
        
        # Write to PDF
        sheet_music.write(fmt='musicxml.pdf', fp=filepath)
        
        return True, "Sheet music created successfully", filename
        
    except Exception as e:
        return False, f"Error creating sheet music: {str(e)}", None

def process_music_generation(instructions, output_path):
    """
    Complete pipeline for generating music from instructions.
    
    Args:
        instructions (str): User instructions for music generation
        output_path (str): Path to save the generated PDF
        
    Returns:
        dict: Response containing status, message, and filename if successful
    """
    # Generate notes
    notes = generate_notes_from_instructions(instructions)
    
    if notes is None:
        return {
            "status": "error",
            "message": "Failed to generate notes from instructions"
        }
    
    # Validate notes
    if not validate_notes(notes):
        return {
            "status": "error",
            "message": "Generated notes failed validation"
        }
    
    # Create sheet music
    success, message, filename = create_sheet_music_from_notes(notes, output_path)
    
    if not success:
        return {
            "status": "error",
            "message": message
        }
    
    return {
        "status": "success",
        "message": "Sheet music generated successfully",
        "filename": filename
    }