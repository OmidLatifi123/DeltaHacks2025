import React, { useEffect, useState } from "react";
import axios from "axios";
import "./CSS/albumcovers.css";
import Bird from './Bird';
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";

const SheetMusic = () => {
  const [sheetMusic, setSheetMusic] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [error, setError] = useState(null);
  const [inputText, setInputText] = useState("");

  const navigate = useNavigate();

  const fetchSheetMusic = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5000/sheet-music");
      setSheetMusic(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching sheet music:", err);
      setError("Failed to fetch Sheet Music. Ensure the backend is running.");
    }
  };

  useEffect(() => {
    fetchSheetMusic();
  }, []);

  const deleteSheetMusic = async (filename) => {
    try {
      const response = await axios.delete(`http://127.0.0.1:5000/sheet-music/${filename}`);
      if (response.data.status === "success") {
        alert(response.data.message);
        setSheetMusic(sheetMusic.filter((sheet) => sheet.filename !== filename));
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error("Error deleting sheet music:", error);
      alert("Failed to delete sheet music. Please try again.");
    }
  };

  const playMusicSheet = async (filename) => {
    try {
      const response = await axios.post(`http://127.0.0.1:5000/sheet-music-player/${filename}`);
    } catch (error) {
      console.error("Error playing music:", error);
      alert("Failed to play music. Please try again.");
    }
  };

  const closeModal = () => setSelectedPdf(null);

  const handleGenerateNotes = async () => {
    try {
      const response = await axios.post("http://127.0.0.1:5000/generate-notes", {
        instructions: inputText,
      });
    } catch (error) {
      console.error("Error generating notes:", error);
      alert("Failed to generate notes. Please try again.");
    }
  };

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
        paddingTop: "5%",
        height: "100%",
      }}
    >
      <Navbar />
      <h1>Sheet Music</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter music instructions"
          style={{
            padding: "10px",
            width: "300px",
            marginRight: "10px",
            borderRadius: "5px",
            border: "1px solid #ddd",
          }}
        />
        <button
          onClick={handleGenerateNotes}
          style={{
            padding: "10px 15px",
            fontSize: "14px",
            fontWeight: "bold",
            color: "#fff",
            backgroundColor: "#007BFF",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Generate Notes
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {sheetMusic.map((cover) => (
          <div
            key={cover.filename}
            style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "10px",
              backgroundColor: "#f9f9f9",
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
              position: "relative",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "200px",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <Viewer
                  fileUrl={`http://127.0.0.1:5000/notes/${cover.filename}`}
                  renderMode="thumbnail"
                />
              </Worker>
            </div>

            <div style={{ marginTop: "10px", textAlign: "left" }}>
              <p>
                <strong>Date Created:</strong>{" "}
                {new Date(cover.createdAt).toLocaleString()}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                  onClick={() =>
                    setSelectedPdf(`http://127.0.0.1:5000/notes/${cover.filename}`)
                  }
                  style={{
                    padding: "10px 15px",
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: "#fff",
                    backgroundColor: "#007BFF",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  View
                </button>
                <div style={{ display: "flex", gap: "10px" }}>
                  {/* Play Button with Speaker Icon */}
                  <button
                    onClick={() => playMusicSheet(cover.filename)}
                    style={{
                      backgroundColor: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "8px",
                      transition: "background-color 0.2s",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f0f0f0";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#666666"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                    </svg>
                  </button>
                  {/* Existing Delete Button */}
                  <button
                    onClick={() => deleteSheetMusic(cover.filename)}
                    style={{
                      backgroundColor: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "8px",
                      transition: "background-color 0.2s",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f0f0f0";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#666666"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedPdf && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "80%",
              height: "80%",
              backgroundColor: "#fff",
              padding: "45px",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            <button
              onClick={closeModal}
              style={{
                position: "absolute",
                top: "5px",
                right: "5px",
                padding: "10px 15px",
                fontSize: "14px",
                fontWeight: "bold",
                color: "#fff",
                backgroundColor: "#FF0000",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
              <Viewer fileUrl={selectedPdf} />
            </Worker>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default SheetMusic;