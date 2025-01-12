import React from "react";
import PropTypes from "prop-types";
import "./CSS/piano.css";
import "./CSS/pianokey.css";

const PianoKey = ({ note, isActive, isSharp, positionStyles }) => {
    console.log(`Key: ${note}, isActive: ${isActive}`); // Debug log for hover state
  
    return (
      <div
        className={`piano-key ${isSharp ? "sharp" : "natural"} ${
          isActive ? "active" : ""
        }`}
        style={{
          ...positionStyles,
          backgroundColor: isSharp ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)",
          boxShadow: isActive
            ? "0px 4px 8px rgba(0, 0, 0, 0.3)" // Active hover effect
            : "none",
          zIndex: isSharp ? 2 : 1,
        }}
      >
        {!isSharp && note}
      </div>
    );
  };
  

PianoKey.propTypes = {
  note: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  isSharp: PropTypes.bool.isRequired,
  positionStyles: PropTypes.shape({
    left: PropTypes.string.isRequired,
    top: PropTypes.string.isRequired,
    width: PropTypes.string.isRequired,
    height: PropTypes.string.isRequired,
  }).isRequired,
};

export default PianoKey;
