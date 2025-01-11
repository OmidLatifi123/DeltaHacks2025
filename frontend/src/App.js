import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import InstrumentSelector from "./components/InstrumentSelector";
import About from "./components/About";
import AlbumCovers from "./components/AlbumCovers";
import Home from "./components/Home";


const App = () => {
  const [selectedInstrument, setSelectedInstrument] = useState("piano");

  // Update the instrument on the backend when the user selects a new one
  const handleInstrumentChange = (instrument) => {
    setSelectedInstrument(instrument);
    fetch("http://127.0.0.1:5000/set-instrument", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instrument }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message) {
          console.log(data.message);
        } else {
          console.error(data.error || "Failed to switch instrument");
        }
      });
  };

  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          {/* Define routes */}
          <Route path="/" element={<Home />} />
          <Route
            path="/Instrument"
            element={
              <>
                <h1>Virtual Instrument Player</h1>
                <InstrumentSelector
                  selectedInstrument={selectedInstrument}
                  onInstrumentChange={handleInstrumentChange}
                />
              </>
            }
          />
          <Route path="/about" element={<About />} />
         <Route path="/albumcovers" element={<AlbumCovers />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;