import React, { useEffect, useState } from "react";
import axios from "axios";
import "./CSS/albumcovers.css";
import Bird from './Bird'; // Import Bird component
import Navbar from "./Navbar";
import Footer from "./Footer";

const AlbumCover = () => {
  const [albumCovers, setAlbumCovers] = useState([]);
  const [error, setError] = useState(null);

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
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
};

export default AlbumCover;
