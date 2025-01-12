import React, { useEffect, useState } from "react";
import axios from "axios";
import "./CSS/albumcovers.css";
import Bird from './Bird'; // Import Bird component
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";

const SheetMusic = () => {
  const [sheetMusic, setSheetMusic] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null); // State for the selected PDF
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
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

    fetchSheetMusic();
  }, []);

  const closeModal = () => setSelectedPdf(null);

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
    }}
  >
    {/* PDF Preview */}
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
          renderMode="thumbnail" // Optionally adjust to show a thumbnail view
        />
      </Worker>
    </div>

    <div style={{ marginTop: "10px", textAlign: "left" }}>
      <p>
        <strong>Date Created:</strong>{" "}
        {new Date(cover.createdAt).toLocaleString()}
      </p>
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
    </div>
  </div>
))}

      </div>

      {/* Modal for PDF Viewer */}
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
