import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Hand3D from './Hand3D';
import WebcamFeed from './WebcamFeed';
import './CSS/Tutorial.css';
import MascotImage from './CSS/Images/Mascot.png';
import Bird from './Bird';
import { useNavigate } from 'react-router-dom';

const scaleFactor = 1.7;
const offsetX = 200; // Move keys more left by this value

const pianoKeys = [
  { note: "C", x_min: 255 * scaleFactor - offsetX, x_max: 273.75 * scaleFactor - offsetX, y_min: 260, y_max: 350 },
  { note: "C#", x_min: 268.125 * scaleFactor - offsetX, x_max: 275.375 * scaleFactor - offsetX, y_min: 260, y_max: 250 },
  { note: "D", x_min: 273.75 * scaleFactor - offsetX, x_max: 292.5 * scaleFactor - offsetX, y_min: 260, y_max: 350 },
  { note: "D#", x_min: 287.625 * scaleFactor - offsetX, x_max: 294.875 * scaleFactor - offsetX, y_min: 260, y_max: 250 },
  { note: "E", x_min: 292.5 * scaleFactor - offsetX, x_max: 311.25 * scaleFactor - offsetX, y_min: 260, y_max: 350 },
  { note: "F", x_min: 311.25 * scaleFactor - offsetX, x_max: 330 * scaleFactor - offsetX, y_min: 260, y_max: 350 },
  { note: "F#", x_min: 324.375 * scaleFactor - offsetX, x_max: 331.625 * scaleFactor - offsetX, y_min: 260, y_max: 250 },
  { note: "G", x_min: 330 * scaleFactor - offsetX, x_max: 348.75 * scaleFactor - offsetX, y_min: 260, y_max: 350 },
  { note: "G#", x_min: 343.875 * scaleFactor - offsetX, x_max: 351.125 * scaleFactor - offsetX, y_min: 260, y_max: 250 },
  { note: "A", x_min: 348.75 * scaleFactor - offsetX, x_max: 367.5 * scaleFactor - offsetX, y_min: 260, y_max: 350 },
  { note: "A#", x_min: 362.625 * scaleFactor - offsetX, x_max: 369.875 * scaleFactor - offsetX, y_min: 260, y_max: 250 },
  { note: "B", x_min: 367.5 * scaleFactor - offsetX, x_max: 386.25 * scaleFactor - offsetX, y_min: 260, y_max: 350 },
  { note: "C_High", x_min: 386.25 * scaleFactor - offsetX, x_max: 405 * scaleFactor - offsetX, y_min: 260, y_max: 350 }
];


const Tutorial = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [handData, setHandData] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const navigate = useNavigate();

  const tutorialSteps = [
    "Welcome to the Music Basics Tutorial! I'm your guide, Melody the Mascot.",
    "This project is all about making music theory fun and interactive.",
    "You'll learn how to play instruments, read sheet music, and compose songs!",
    "Let's start with some basics of music theory. Did you know the musical alphabet is just A to G?"
  ];

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

  useEffect(() => {
    const socket = io("http://127.0.0.1:5000");
    
    socket.on("hand_data", (data) => {
      setHandData(data.hands);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

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
    const backendWidth = 1040;
    const backendHeight = 1480;

    return pianoKeys.map((key, index) => {
      const left = `${(key.x_min / backendWidth) * canvasWidth}px`;
      const top = `${(key.y_min / backendHeight) * canvasHeight}px`;
      const width = `${(((key.x_max - key.x_min) ) / backendWidth) * canvasWidth}px`;
      const height = `${(((key.y_max - key.y_min) + 200) / backendHeight) * canvasHeight}px`;
    
      const isSharp = key.note.includes("#");
    
      return (
        <div
          key={index}
          style={{
            position: "absolute",
            left,
            top,
            width,
            height,
            backgroundColor: isSharp ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)",
            color: isSharp ? "rgba(255, 255, 255, 0)" : "rgba(0, 0, 0, 1)",
            border: "2px solid rgba(0, 0, 0, 1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "0.7rem",
            zIndex: isSharp ? 2 : 1,
          }}
        >
          {!isSharp && key.note}
        </div>
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
