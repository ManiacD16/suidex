"use client";
import Header from "./components/Header";
// import MainCon from "./components/MainCon";
import Footer from "./components/footer";
import Pool from "./components/pool";
import Liquidity from "./components/liquidity";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import SwapPage from "./components/Swap";
import "@mysten/dapp-kit/dist/index.css";
import Main from "./components/Main";

export default function App() {
  const closeToastManually = () => {
    toast.dismiss();
  };

  return (
    <Router>
      <ToastContainer
        onClick={closeToastManually}
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        className={"items-center"}
      />
      <Header />
      <div className="min-h-screen text-white">
        <Routes>
          {/* <Route path="/header" element={<Header />} /> */}
          <Route path="/main" element={<Main />} />
          <Route path="/swap" element={<SwapPage />} />
          <Route path="/" element={<SwapPage />} />
          {/* <Route path="/" element={<MainCon />} /> */}
          <Route path="/pool" element={<Pool />} />
          <Route path="/addliquidity" element={<Liquidity />} />
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}
