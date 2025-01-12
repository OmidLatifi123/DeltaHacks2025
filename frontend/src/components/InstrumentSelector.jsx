import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import axios from "axios";
import Hand3D from "./Hand3D";
import WebcamFeed from "./WebcamFeed";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Bird from './Bird'; // Import Bird component
import './CSS/piano.css';

const pianoKeys = [
  { note: "C", x_min: 255, x_max: 273.75, y_min: 260, y_max: 350 },
  { note: "C#", x_min: 268.125, x_max: 279.375, y_min: 260, y_max: 320 },
  { note: "D", x_min: 273.75, x_max: 292.5, y_min: 260, y_max: 350 },
  { note: "D#", x_min: 287.625, x_max: 298.875, y_min: 260, y_max: 320 },
  { note: "E", x_min: 292.5, x_max: 311.25, y_min: 260, y_max: 350 },
  { note: "F", x_min: 311.25, x_max: 330, y_min: 260, y_max: 350 },
  { note: "F#", x_min: 324.375, x_max: 335.625, y_min: 260, y_max: 320 },
  { note: "G", x_min: 330, x_max: 348.75, y_min: 260, y_max: 350 },
  { note: "G#", x_min: 343.875, x_max: 355.125, y_min: 260, y_max: 320 },
  { note: "A", x_min: 348.75, x_max: 367.5, y_min: 260, y_max: 350 },
  { note: "A#", x_min: 362.625, x_max: 373.875, y_min: 260, y_max: 320 },
  { note: "B", x_min: 367.5, x_max: 386.25, y_min: 260, y_max: 350 }
];


const InstrumentSelector = ({ selectedInstrument, onInstrumentChange }) => {
    
  const [handData, setHandData] = useState([]);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState("Everything's Good!");
  const [albumCover, setAlbumCover] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Start the piano backend (if applicable) when component mounts

  useEffect(() => {
    const socket = io("http://127.0.0.1:5000"); // Ensure this matches your backend URL
    
    socket.on("hand_data", (data) => {
      setHandData(data.hands);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const renderKeys = () => {
    const canvasWidth = 0.9 * window.innerWidth;
    const canvasHeight = 800;
    const backendWidth = 640; 
    const backendHeight = 480; 

    return pianoKeys.map((key, index) => {
      // Scale positions and sizes proportionally to the canvas size
      const left = `${(key.x_min / backendWidth) * canvasWidth}px`;
      const top = `${(key.y_min / backendHeight) * canvasHeight}px`;
      const width = `${((key.x_max - key.x_min) / backendWidth) * canvasWidth}px`;
      const height = `${((key.y_max - key.y_min) / backendHeight) * canvasHeight}px`;
    
      const isSharp = key.note.includes("#"); // Determine if the key is a sharp
    
      return (
        <div
          key={index}
          style={{
            position: "absolute",
            left,
            top,
            width,
            height,
            backgroundColor: isSharp ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)", // Black for sharp keys
            color: isSharp ? "rgba(255, 255, 255, 0)" : "rgba(0, 0, 0, 1)", // Hide text for sharp keys
            border: "2px solid rgba(0, 0, 0, 1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "0.7rem",
            zIndex: isSharp ? 2 : 1, // Ensure sharp keys appear on top
          }}
        >
          {!isSharp && key.note} {/* Render note label only for non-sharp keys */}
        </div>
      );
    });
    
  };

  const generateAlbumCover = async () => {
    setLoading(true);
    setProgress(0);
    try {
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 500);
      const response = await axios.post("http://127.0.0.1:5000/generate-image");
      clearInterval(interval);
      setProgress(100);
      const albumCoverUrl = response.data.image_url;
      setAlbumCover(`http://127.0.0.1:5000${albumCoverUrl}`);
      setError(null);
    } catch (err) {
      console.error("Error generating album cover:", err);
      setError("Failed to generate album cover. Ensure the backend is running.");
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 1000); // Reset progress after 1 second
    }
  };

  return (
    <div className="instrument-selector">
      <Navbar />
      <h1> Free Play</h1>
      <label htmlFor="instrument">Choose an instrument:</label>
      <select
        id="instrument"
        value={selectedInstrument}
        onChange={(e) => onInstrumentChange(e.target.value)}
      >
        <option value="piano">Piano</option>
        <option value="drums">Drums</option>
        {/* Add more instruments here */}
      </select>

      <p style={{ color: backendStatus.includes("Failed") ? "red" : "green" }}>
        {backendStatus}
      </p>
<div
  className="glass-container"
  style={{
    width: "90%",
    height: "800px",
    margin: "auto",
    position: "relative",
    overflow: "hidden",
    background: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)", // For Safari support
    borderRadius: "20px",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
  }}
>
  {selectedInstrument === "piano" && (
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
  )}

  {/* 3D Hand Visualization */}
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      zIndex: 2,
    }}
  >
    <Hand3D handData={handData} />
  </div>
</div>

      <WebcamFeed />

      <div style={{ margin: "20px 0" }}>
        <button
          onClick={generateAlbumCover}
          disabled={loading}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            backgroundColor: loading ? "#CCC" : "#007BFF",
            color: "#FFF",
            border: "none",
            borderRadius: "5px",
          }}
        >
          Generate Album Cover
        </button>
      </div>
      {loading && (
        <div style={{ margin: "20px auto", width: "50%" }}>
          <p>Generating album cover...</p>
          <div
            style={{
              width: "100%",
              backgroundColor: "#CCC",
              height: "20px",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                backgroundColor: "#007BFF",
                height: "100%",
                transition: "width 0.5s",
              }}
            ></div>
          </div>
        </div>
      )}
      {albumCover && (
        <div
          style={{
            margin: "20px auto",
            width: "50%",
            border: "5px solid #000",
            padding: "10px",
            backgroundColor: "#FFF",
            borderRadius: "10px",
          }}
        >
          <img
            src={albumCover}
            alt="Generated Album Cover"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              borderRadius: "10px",
            }}
          />
          <button
            onClick={() => {
              const link = document.createElement("a");
              link.href = albumCover;
              link.download = "album_cover.png";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            style={{
              marginTop: "10px",
              padding: "10px 20px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              backgroundColor: "#28a745",
              color: "#FFF",
              border: "none",
              borderRadius: "5px",
            }}
          >
            Download Album Cover
          </button>
        </div>
      )}

      <div>
        <h3>Hand Data</h3>
        {error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : (
          <p>Hand tracking data is being visualized above.</p>
        )}
      </div>
      <Bird />

      <Footer />
    </div>
  );
};

export default InstrumentSelector;
