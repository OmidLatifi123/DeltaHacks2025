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
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const birdRef = useRef();

  useEffect(() => {
    const initialX = window.innerWidth - 100;
    const initialY = window.innerHeight - 100;
    setPosition({ x: initialX, y: initialY });
  }, []);

  const handleClick = () => {
    if (isFlying) return;
    setIsFlying(true);

    const path = [
      { x: Math.random() * (window.innerWidth - 150), y: Math.random() * (window.innerHeight - 150) },
      { x: Math.random() * (window.innerWidth - 150), y: Math.random() * (window.innerHeight - 150) },
      { x: window.innerWidth - 120, y: window.innerHeight - 120 },
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

        if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
          step += 1;
          if (step >= path.length) {
            clearInterval(interval);
            setIsFlying(false);
          }
        }

        return {
          x: Math.min(Math.max(nextX, 0), window.innerWidth - 120),
          y: Math.min(Math.max(nextY, 0), window.innerHeight - 120),
        };
      });
    }, 50);
  };

  const toggleTextbox = () => {
    setIsTextboxOpen((prev) => !prev);
  };

  const handleSendMessage = () => {
    if (input.trim() === '') return;
    setMessages((prev) => [...prev, { text: input, type: 'sent' }]);
    setInput('');
    setTimeout(() => {
      setMessages((prev) => [...prev, { text: "Thanks for your message!", type: 'received' }]);
    }, 1000);
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
          left: position.x - 250,
          top: position.y - 220,
        }}
      >
        <button className="toggle-button" onClick={toggleTextbox}>
          {isTextboxOpen ? '▼' : '▲'}
        </button>
        {isTextboxOpen && (
          <div className="chatbox">
            <div className="chat-history">
              {messages.map((message, index) => (
                <div key={index} className={`chat-message ${message.type}`}>
                  {message.text}
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
              />
              <button onClick={handleSendMessage}>Send</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Bird;
