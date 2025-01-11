import React, { useEffect, useState } from "react";
import axios from "axios";
import Hand3D from "./Hand3D";

// Piano Component
const Piano = () => {
  const [handData, setHandData] = useState([]);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState("Initializing...");

  useEffect(() => {
    const startPianoBackend = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:5000/start-piano");
        setBackendStatus(response.data.message);
      } catch (err) {
        console.error("Failed to start piano backend:", err);
        setBackendStatus("Failed to start piano backend. Ensure the backend is running.");
      }
    };

    startPianoBackend();
  }, []);

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

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px", textAlign: "center" }}>
      <h1>Digital Instrument - Virtual Piano</h1>
      <p style={{ color: backendStatus.includes("Failed") ? "red" : "green" }}>{backendStatus}</p>

      <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "flex-start" }}>
        <div>
          <h3>Piano Keys</h3>
          {/* Add piano keys here */}
        </div>
        <div>
          <h3>3D Hand Tracking</h3>
          <Hand3D handData={handData} />
        </div>
      </div>

      <iframe
        src="http://127.0.0.1:5000/webcam"
        style={{
          width: "320px",
          height: "240px",
          position: "absolute",
          bottom: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          border: "1px solid black",
        }}
        title="Webcam Feed"
      ></iframe>

      <div>
        <h3>Hand Data</h3>
        {error ? <p style={{ color: "red" }}>{error}</p> : <p>Hand tracking data is being visualized above.</p>}
      </div>
    </div>
  );
};

export default Piano;
