import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Hand3D from './Hand3D';
import WebcamFeed from './WebcamFeed';
import './CSS/Tutorial.css';
import MascotImage from './CSS/Images/Mascot.png';
import Bird from './Bird';
import { useNavigate } from 'react-router-dom';
import PianoKey from './PianoKey';

const X_OFFSET = -120; // Adjust this value to shift keys left/right
const Y_OFFSET = -180; // Adjust this value to shift keys up/down

const pianoKeys = [
  { note: "C", x_min: 255 + X_OFFSET, x_max: 273.75 + X_OFFSET, y_min: 260 + Y_OFFSET, y_max: 350 + Y_OFFSET },
  { note: "C#", x_min: 268.125 + X_OFFSET, x_max: 279.375 + X_OFFSET, y_min: 260 + Y_OFFSET, y_max: 320 + Y_OFFSET },
  { note: "D", x_min: 273.75 + X_OFFSET, x_max: 292.5 + X_OFFSET, y_min: 260 + Y_OFFSET, y_max: 350 + Y_OFFSET },
  { note: "D#", x_min: 287.625 + X_OFFSET, x_max: 298.875 + X_OFFSET, y_min: 260 + Y_OFFSET, y_max: 320 + Y_OFFSET },
  { note: "E", x_min: 292.5 + X_OFFSET, x_max: 311.25 + X_OFFSET, y_min: 260 + Y_OFFSET, y_max: 350 + Y_OFFSET },
  { note: "F", x_min: 311.25 + X_OFFSET, x_max: 330 + X_OFFSET, y_min: 260 + Y_OFFSET, y_max: 350 + Y_OFFSET },
  { note: "F#", x_min: 324.375 + X_OFFSET, x_max: 335.625 + X_OFFSET, y_min: 260 + Y_OFFSET, y_max: 320 + Y_OFFSET },
  { note: "G", x_min: 330 + X_OFFSET, x_max: 348.75 + X_OFFSET, y_min: 260 + Y_OFFSET, y_max: 350 + Y_OFFSET },
  { note: "G#", x_min: 343.875 + X_OFFSET, x_max: 355.125 + X_OFFSET, y_min: 260 + Y_OFFSET, y_max: 320 + Y_OFFSET },
  { note: "A", x_min: 348.75 + X_OFFSET, x_max: 367.5 + X_OFFSET, y_min: 260 + Y_OFFSET, y_max: 350 + Y_OFFSET },
  { note: "A#", x_min: 362.625 + X_OFFSET, x_max: 373.875 + X_OFFSET, y_min: 260 + Y_OFFSET, y_max: 320 + Y_OFFSET },
  { note: "B", x_min: 367.5 + X_OFFSET, x_max: 386.25 + X_OFFSET, y_min: 260 + Y_OFFSET, y_max: 350 + Y_OFFSET },
  { note: "C_High", x_min: 386.25 + X_OFFSET, x_max: 405 + X_OFFSET, y_min: 260 + Y_OFFSET, y_max: 350 + Y_OFFSET }
];

const Tutorial = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [handData, setHandData] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeKeys, setActiveKeys] = useState([]);
  const navigate = useNavigate();

  const tutorialSteps = [
    "Welcome to the Music Basics Tutorial! I'm your guide, Melody the Mascot.",
    "This project is all about making music theory fun and interactive.",
    "You'll learn how to play instruments, read sheet music, and compose songs!",
    "Let's start with some basics of music theory. Did you know the musical alphabet is just A to G?"
  ];

  useEffect(() => {
    const socket = io("http://127.0.0.1:5000");
    
    socket.on("hand_data", (data) => {
      setHandData(data.hands);
      processHandData(data.hands);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const convertToCanvasCoordinates = (landmark) => {
    // Adjust the conversion formula to match the new key positions
    const xCanvas = -246.71 * landmark.x + 481.23 + X_OFFSET;
    const yCanvas = 290.32 * landmark.y + 138.06 + Y_OFFSET;
    return { x: xCanvas, y: yCanvas };
  };

  const isOverKey = (landmarkCanvas, pianoKey) => {
    return (
      pianoKey.x_min <= landmarkCanvas.x &&
      landmarkCanvas.x <= pianoKey.x_max &&
      pianoKey.y_min <= landmarkCanvas.y &&
      landmarkCanvas.y <= pianoKey.y_max
    );
  };

  const processHandData = (hands) => {
    const newActiveKeys = [];
    hands.forEach((hand) => {
      const canvasCoords = convertToCanvasCoordinates(hand[8]);
      pianoKeys.forEach((key) => {
        if (isOverKey(canvasCoords, key)) {
          newActiveKeys.push(key.note);
        }
      });
    });
    setActiveKeys(newActiveKeys);
  };

  useEffect(() => {
    let index = 0;
    setIsTyping(true);
    setIsComplete(false);
    setDisplayText('');
    
    const interval = setInterval(() => {
      if (index < tutorialSteps[currentStep].length) {
        setDisplayText(tutorialSteps[currentStep].substring(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 50);

    return () => {
      clearInterval(interval);
      setIsTyping(false);
    };
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1 && !isTyping) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === tutorialSteps.length - 1) {
      navigate('/tutorial2');
    }
  };

  const renderKeys = () => {
    const canvasWidth = 0.9 * window.innerWidth;
    const canvasHeight = 500;
    const backendWidth = 640;
    const backendHeight = 480;

    return pianoKeys.map((key, index) => {
      // Calculate position while accounting for the offsets
      const positionStyles = {
        left: `${(key.x_min / backendWidth) * canvasWidth}px`,
        top: `${(key.y_min / backendHeight) * canvasHeight}px`,
        width: `${((key.x_max - key.x_min) / backendWidth) * canvasWidth}px`,
        height: `${((key.y_max - key.y_min) / backendHeight) * canvasHeight}px`,
        position: 'absolute',
        pointerEvents: 'auto', // Enable hover effects
      };

      return (
        <PianoKey
          key={index}
          note={key.note}
          isActive={activeKeys.includes(key.note)}
          isSharp={key.note.includes("#")}
          positionStyles={positionStyles}
        />
      );
    });
  };


  return (
    <div className="tutorial-container">
      <div className="top-section">
        <div className="mascot-container">
          <img src={MascotImage} alt="Mascot" className="mascot-image" />
          <div className="speech-bubble">
            <p>{displayText}</p>
          </div>
        </div>
        <button 
          className={`next-button ${isComplete && !isTyping ? '' : 'disabled'}`}
          onClick={handleNext}
          disabled={!isComplete || isTyping}
        >
          {currentStep === tutorialSteps.length - 1 ? "Lesson 2: Music Theory" : "Next"}
        </button>
      </div>

      <div className="bottom-section">
        <div className="webcam-piano-container">
          <div className="glass-container">
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 1,
              }}
            >
              {renderKeys()}
            </div>
            <div
              style={{
                position: "absolute",
                top: "-400px",
                left: 0,
                width: "80%",
                height: "80%",
                zIndex: 2,
              }}
            >
              <Hand3D handData={handData} />
            </div>
          </div>
          <WebcamFeed />
        </div>
      </div>
      <Bird />
    </div>
  );
};

export default Tutorial;
