import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Hand3D from './Hand3D';
import WebcamFeed from './WebcamFeed';
import './CSS/Tutorial.css';
import MascotImage from './CSS/Images/Mascot.png';
import Bird from './Bird'; // Import Bird component

const pianoKeys = [
  { note: "C", x_min: 255, x_max: 273.75, y_min: 230, y_max: 250 },
  { note: "D", x_min: 273.75, x_max: 292.5, y_min: 230, y_max: 250 },
  { note: "E", x_min: 292.5, x_max: 311.25, y_min: 230, y_max: 250 },
  { note: "F", x_min: 311.25, x_max: 330, y_min: 230, y_max: 250 },
  { note: "G", x_min: 330, x_max: 348.75, y_min: 230, y_max: 250 },
  { note: "A", x_min: 348.75, x_max: 367.5, y_min: 230, y_max: 250 },
  { note: "B", x_min: 367.5, x_max: 386.25, y_min: 230, y_max: 250 },
  { note: "C_high", x_min: 386.25, x_max: 405, y_min: 230, y_max: 250 },
];

const Tutorial = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [handData, setHandData] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

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
    }
  };

  const renderKeys = () => {
    const canvasWidth = 0.9 * window.innerWidth; // Match frontend canvas width to backend proportions
    const canvasHeight = 900; // Match frontend canvas height to backend proportions
    const backendWidth = 1100; // Backend width in pixels
    const backendHeight = 1480; // Backend height in pixels
    const gap = 13; // Gap between keys in pixels

    return pianoKeys.map((key, index) => {
        const left = `${((key.x_min / backendWidth) * canvasWidth) + (index * gap)}px`; // Add gap to x position
        const top = `${(key.y_min / backendHeight) * canvasHeight}px`; // Direct scaling for y position
      const width = `${(((key.x_max - key.x_min) + 20)/ backendWidth) * canvasWidth}px`; // Match backend key width
      const height = `${(((key.y_max - key.y_min) +80) / backendHeight) * canvasHeight}px`; // Match backend key height
  
      return (
        <div
          key={index}
          style={{
            position: "absolute",
            left,
            top,
            width,
            height,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            color: "rgba(0, 0, 0, 1)",
            border: "2px solid rgba(0, 0, 0, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "0.7rem",
            zIndex: 1,
            borderRadius: "4px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          {key.note}
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
          Next
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
                top: "-400px", // Adjust this value to move hands higher
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