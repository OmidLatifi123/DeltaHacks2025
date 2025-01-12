# play_midi.py
import sys
import pygame
import os

def play_midi(file_path):
    pygame.mixer.init()
    pygame.mixer.music.load(file_path)
    pygame.mixer.music.play()
    while pygame.mixer.music.get_busy():
        pass

if __name__ == "__main__":
    midi_file_path = sys.argv[1]
    play_midi(midi_file_path)
    os.remove(midi_file_path)
