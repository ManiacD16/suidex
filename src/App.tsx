"use client";

import Header from "./components/Header";
//import { useCurrentAccount } from '@mysten/dapp-kit';
//import { useWallet } from '@mysten/dapp-kit';
import MainCon from "./components/MainCon";
import "@mysten/dapp-kit/dist/index.css";

export default function App() {
  return (
    <>
      <div className="min-h-screen text-white ">
        {/* Header */}
        <Header />

        {/* Main Content */}
        <MainCon />

        {/* Version Info */}
      </div>
    </>
  );
}
