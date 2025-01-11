import React, { useEffect, useState } from "react";
import axios from "axios";
import Hand3D from "./Hand3D";
import WebcamFeed from "./WebcamFeed";
import ElectricPianoCanvas from "./3D-Models/ElectricPianoModel";

const pianoKeys = [
  { note: "C", x_min: 270, x_max: 285, y_min: 330, y_max: 350 },
  { note: "D", x_min: 285, x_max: 300, y_min: 330, y_max: 350 },
  { note: "E", x_min: 300, x_max: 315, y_min: 330, y_max: 350 },
  { note: "F", x_min: 315, x_max: 330, y_min: 330, y_max: 350 },
  { note: "G", x_min: 330, x_max: 345, y_min: 330, y_max: 350 },
  { note: "A", x_min: 345, x_max: 360, y_min: 330, y_max: 350 },
  { note: "B", x_min: 360, x_max: 375, y_min: 330, y_max: 350 },
  { note: "C_high", x_min: 375, x_max: 390, y_min: 330, y_max: 350 },
];

const Piano = () => {
  const [handData, setHandData] = useState([]);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState("Everything's Good!");

  // Start the piano backend (if applicable) when component mounts
  useEffect(() => {
    const startPianoBackend = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:5000/start-piano");
        setBackendStatus(response.data.message);
      } catch (err) {
        console.error("Failed to start piano backend:", err);
      }
    };
    startPianoBackend();
  }, []);

  // Periodically fetch hand tracking data
  useEffect(() => {
    const fetchHandData = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:5000/hand-data");
        setHandData(response.data.hands || []);
      } catch (err) {
        console.error("Error fetching hand data:", err);
        setError("Could not fetch hand data. Ensure the backend is running.");
      }
    };

    const interval = setInterval(fetchHandData, 100);
    return () => clearInterval(interval);
  }, []);

  const renderKeys = () => {
    const canvasWidth = 0.9 * window.innerWidth; // 90% of the window width
    const canvasHeight = 800; // Fixed canvas height
    const backendWidth = 640; // Backend canvas width
    const backendHeight = 480; // Backend canvas height

    return pianoKeys.map((key, index) => {
      // Scale positions and sizes proportionally to the canvas size
      const left = `${(key.x_min / backendWidth) * canvasWidth}px`;
      const top = `${(key.y_min / backendHeight) * canvasHeight}px`;
      const width = `${((key.x_max - key.x_min) / backendWidth) * canvasWidth}px`;
      const height = `${((key.y_max - key.y_min) / backendHeight) * canvasHeight}px`;

      return (
        <div
          key={index}
          style={{
            position: "absolute",
            left,
            top,
            width,
            height,
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            border: "2px solid #FFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFF",
            fontWeight: "bold",
            fontSize: "0.7rem",
            zIndex: 1,
          }}
        >
          {key.note}
        </div>
      );
    });
  };

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <h1>Digital Instrument - Virtual Piano</h1>
      <p style={{ color: backendStatus.includes("Failed") ? "red" : "green" }}>
        {backendStatus}
      </p>

      {/* Main container to hold 3D piano, hand visualization, and keys */}
      <div
        style={{
          width: "90%",
          height: "800px",
          border: "2px solid black",
          margin: "auto",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Electric Piano 3D Model */}
        <div
          style={{
            position: "absolute",
            top: "10%", // Adjusted position
            left: 0,
            width: "100%",
            height: "40%",
            zIndex: 1, // Below hand and keys
          }}
        >
          <ElectricPianoCanvas />
        </div>

        {/* Piano keys */}
        <div
          style={{
            backgroundColor: "rgba(186, 186, 186, 0.5)",
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none", // Ensure clicks pass through
            zIndex: 1, // Lower layer for keys
          }}
        >
          {renderKeys()}
        </div>

        {/* 3D Hand Visualization */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 2, // Higher layer for hands
          }}
        >
          <Hand3D handData={handData} />
        </div>
      </div>

      {/* Import the new WebcamFeed component */}
      <WebcamFeed />

      <div>
        <h3>Hand Data</h3>
        {error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : (
          <p>Hand tracking data is being visualized above.</p>
        )}
      </div>
    </div>
  );
};

export default Piano;
