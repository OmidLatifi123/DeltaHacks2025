import React, { useState, useEffect } from 'react';
import './CSS/Tutorial.css'; // Import the styles
import MascotImage from './CSS/Images/Mascot.png'; // Path to your mascot image

const Tutorial = () => {
    const tutorialSteps = [
      "Welcome to the Music Basics Tutorial! I'm Aero, your guide into OrchestrAir.",
      "This project is all about making music theory fun and interactive.",
      "You'll learn how to play instruments, read sheet music, and compose songs!",
      "Let's start with some basics of music theory. Did you know the musical alphabet is just A to G?"
    ];
  
    const [currentStep, setCurrentStep] = useState(0);
    const [displayText, setDisplayText] = useState('');
    const [isComplete, setIsComplete] = useState(false);
  
    useEffect(() => {
      let index = 0;
      const interval = setInterval(() => {
        if (index < tutorialSteps[currentStep].length) {
          setDisplayText((prev) => prev + tutorialSteps[currentStep][index]);
          index++;
        } else {
          setIsComplete(true);
          clearInterval(interval);
        }
      }, 20); // Adjust typing speed here
  
      return () => clearInterval(interval);
    }, [currentStep]);
  
    const handleNext = () => {
      if (isComplete && currentStep < tutorialSteps.length - 1) {
        setCurrentStep(currentStep + 1);
        setDisplayText('');
        setIsComplete(false);
      }
    };
  
    return (
      <div className="tutorial-container">
        <div className="mascot-container">
          <img src={MascotImage} alt="Mascot" className="mascot-image" />
          <div className="speech-bubble">
            <p>{displayText}</p>
          </div>
        </div>
        <button 
          className={`next-button ${isComplete ? '' : 'disabled'}`} 
          onClick={handleNext} 
          disabled={!isComplete}
        >
          Next
        </button>
      </div>
    );
  };
  
  export default Tutorial;
