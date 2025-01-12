import React from "react";
import "./CSS/Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p className="footer-text">
          &copy; {new Date().getFullYear()} OrchestrAir | Designed by Omid Latifi and Mark Kogan
        </p>
      </div>
    </footer>
  );
};

export default Footer;
