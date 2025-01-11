import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Piano from "./components/piano";
import About from "./components/About";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Piano />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Router>
  );
};

export default App;
