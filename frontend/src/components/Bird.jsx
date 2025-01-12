import React, { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';
import './CSS/Bird.css';
import bird from './CSS/Images/bird.png';
import birdFly from './CSS/Images/bird-fly.png';
import birdFly1 from './CSS/Images/bird-fly1.png';

const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
console.log('API Key exists:', !!apiKey);

const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true,
});

function Bird() {
  const [isFlying, setIsFlying] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [direction, setDirection] = useState('right');
  const [isTextboxOpen, setIsTextboxOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hey I'm Melody, your virtual music tutor, ask me anything!", type: 'received' },
  ]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
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

    const smoothFlight = () => {
      if (step >= path.length) {
        setIsFlying(false);
        return;
      }

      const target = path[step];
      setPosition((prev) => {
        if (!target) return prev; // Avoid undefined target errors

        const deltaX = target.x - prev.x;
        const deltaY = target.y - prev.y;
        const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
        const speed = 6; // Adjusted speed for smoothness

        if (distance < speed) {
          step += 1;
          return prev;
        }

        const angle = Math.atan2(deltaY, deltaX);
        setDirection(deltaX < 0 ? 'left' : 'right');

        const nextX = prev.x + Math.cos(angle) * speed;
        const nextY = prev.y + Math.sin(angle) * speed;

        return {
          x: Math.min(Math.max(nextX, 0), window.innerWidth - 120),
          y: Math.min(Math.max(nextY, 0), window.innerHeight - 120),
        };
      });

      requestAnimationFrame(smoothFlight);
    };

    smoothFlight();
  };

  const toggleTextbox = () => {
    setIsTextboxOpen((prev) => !prev);
  };

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { text: userMessage, type: 'sent' }]);
    setInput('');

    try {
      const completion = await openai.chat.completions.create({
        messages: [
          { role: 'system', content: "You are Melody, a virtual music tutor knowledgeable in all things music-related. Only answer music-related questions. If the user asks about something unrelated to music, politely remind them that your expertise is in music. Keep answers brief." },
          { role: 'user', content: userMessage },
        ],
        model: 'gpt-4',
      });

      const melodyResponse = completion.choices[0].message.content;
      setMessages((prev) => [...prev, { text: melodyResponse, type: 'received' }]);
    } catch (err) {
      setError(err.message);
      setMessages((prev) => [...prev, { text: 'Sorry, I could not process your message. Please try again later.', type: 'received' }]);
      console.error('Error:', err);
    }
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
