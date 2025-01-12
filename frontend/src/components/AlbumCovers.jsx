import React, { useEffect, useState } from "react";
import axios from "axios";
import "./CSS/albumcovers.css";
import Bird from './Bird';
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

const AlbumCover = () => {
  const [albumCovers, setAlbumCovers] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAlbumCovers = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:5000/album-covers");
        setAlbumCovers(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching album covers:", err);
        setError("Failed to fetch album covers. Ensure the backend is running.");
      }
    };

    fetchAlbumCovers();
  }, []);

  const downloadImage = (imageUrl, imageName) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = imageName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    navigate("/Instrument");
  };

  const deleteAlbumCover = async (filename) => {
    try {
      const response = await axios.delete(`http://127.0.0.1:5000/album-covers/${filename}`);
      if (response.data.status === "success") {
        alert(response.data.message);
        setAlbumCovers(albumCovers.filter((cover) => cover.filename !== filename));
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error("Error deleting album cover:", error);
      alert("Failed to delete album cover. Please try again.");
    }
  };

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
        paddingTop: "5%",
        height: "100%"
      }}
    >
      <Navbar />
      <h1>Album Covers</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {albumCovers.map((cover) => (
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
            <img
              src={`http://127.0.0.1:5000/Images/${cover.filename}`}
              alt={cover.filename}
              style={{
                width: "100%",
                height: "200px",
                objectFit: "cover",
                borderRadius: "10px",
              }}
            />
            <div style={{ marginTop: "10px", textAlign: "left" }}>
              <p>
                <strong>Filename:</strong> {cover.filename}
              </p>
              <p>
                <strong>Date Created:</strong> {new Date(cover.createdAt).toLocaleString()}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                  onClick={() =>
                    downloadImage(
                      `http://127.0.0.1:5000/Images/${cover.filename}`,
                      cover.filename
                    )
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
                <button
                  onClick={() => deleteAlbumCover(cover.filename)}
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
        ))}
      </div>
      <Footer />
    </div>
  );
};

export default AlbumCover;