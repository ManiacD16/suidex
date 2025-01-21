"use client";

import Header from "./components/Header";
import MainCon from "./components/MainCon";
import Footer from "./components/footer";
// import { HashRouter as Router, Routes, Route } from "react-router-dom"; // Corrected import for routing
// import SwapPage from "./components/Swap";
import "@mysten/dapp-kit/dist/index.css";

export default function App() {
  return (
    <>
      <div className="min-h-screen text-white">
        {/* Header */}
        <Header />

        {/* Main Content */}
        <MainCon />

        {/* Footer */}
        <Footer />

        {/* Routing */}
        {/* <Router>
          <Routes>
            <Route path="/swap" element={<SwapPage />} />
          </Routes>
        </Router> */}

        {/* Version Info */}
      </div>
    </>
  );
}
