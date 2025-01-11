import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Piano from "./components/piano";
import About from "./components/About";
import AlbumCovers from "./components/AlbumCovers";


const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Piano />} />
        <Route path="/about" element={<About />} />
        <Route path="/albumcovers" element={<AlbumCovers />} />
      </Routes>
    </Router>
  );
};

export default App;
