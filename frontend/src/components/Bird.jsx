import React, { useState, useEffect, useRef } from 'react';
import './CSS/Bird.css';
import bird from './CSS/Images/bird.png';
import birdFly from './CSS/Images/bird-fly.png';
import birdFly1 from './CSS/Images/bird-fly1.png';

function Bird() {
  const [isFlying, setIsFlying] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [direction, setDirection] = useState('right');
  const [isTextboxOpen, setIsTextboxOpen] = useState(false);
  const birdRef = useRef();

  // Set initial position when the component mounts
  useEffect(() => {
    const initialX = window.innerWidth - 100; // Bottom-right position
    const initialY = window.innerHeight - 100;
    setPosition({ x: initialX, y: initialY });
  }, []);

  // Function to start the flight
  const handleClick = () => {
    if (isFlying) return; // Prevent multiple clicks
    setIsFlying(true);

    // Simulate a flight path using random points
    const path = [
      { x: Math.random() * (window.innerWidth - 150), y: Math.random() * (window.innerHeight - 150) },
      { x: Math.random() * (window.innerWidth - 150), y: Math.random() * (window.innerHeight - 150) },
      { x: window.innerWidth - 120, y: window.innerHeight - 120 }, // Return to the bottom-right corner
    ];

    let step = 0;

    const interval = setInterval(() => {
      const target = path[step];
      setPosition((prev) => {
        const deltaX = target.x - prev.x;
        const deltaY = target.y - prev.y;
        const angle = Math.atan2(deltaY, deltaX);
        setDirection(deltaX < 0 ? 'left' : 'right');
        const speed = 10;

        const nextX = prev.x + Math.cos(angle) * speed;
        const nextY = prev.y + Math.sin(angle) * speed;

        // Check if the bird has reached the target
        if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
          step += 1;
          if (step >= path.length) {
            clearInterval(interval);
            setIsFlying(false);
          }
        }

        return {
          x: Math.min(Math.max(nextX, 0), window.innerWidth - 120), // Prevent overflow
          y: Math.min(Math.max(nextY, 0), window.innerHeight - 120), // Prevent overflow
        };
      });
    }, 50);
  };

  const toggleTextbox = () => {
    setIsTextboxOpen((prev) => !prev);
  };

  return (
    <div>
      <div
        ref={birdRef}
        className={`bird ${isFlying ? 'flying' : ''} ${direction}`}
        style={{
          left: position.x,
          top: position.y,
          backgroundImage: `url(${isFlying ? (Math.random() > 0.5 ? birdFly : birdFly1) : bird})`,
        }}
        onClick={handleClick}
      />
      <div
        className={`textbox-container ${isTextboxOpen ? 'open' : 'closed'}`}
        style={{
          left: position.x - 80, // Position textbox relative to the bird
          top: position.y - 140, // Place above the bird
        }}
      >
        <button className="toggle-button" onClick={toggleTextbox}>
          {isTextboxOpen ? '▼' : '▲'}
        </button>
        {isTextboxOpen && (
          <div className="textbox-content">
            Hi there! I’m your interactive bird companion. Stay tuned for AI text and speech!
          </div>
        )}
      </div>
    </div>
  );
}

export default Bird;
