import React from "react";

const WebcamFeed = () => {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "10px",
        left: "10px",
        width: "160px",
        height: "120px",
        border: "1px solid black",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <iframe
        src="http://127.0.0.1:5000/webcam"
        style={{
          width: "640px",
          height: "480px",
          transform: "scale(0.25)",
          transformOrigin: "0 0",
          border: "none",
        }}
        title="Webcam Feed"
      />
    </div>
  );
};

export default WebcamFeed;
