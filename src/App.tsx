"use client";

import { useState } from "react";
import { useWeb3ModalAccount, useWeb3Modal } from "@web3modal/ethers5/react";
import BackgroundEffects from './components/BackgroundEffects';
// import {
//   useAccount,
//   useConnect,
//   useDisconnect,
//   createConfig,
//   http,
// } from "wagmi";
// import { WagmiProvider } from "wagmi";
// import { mainnet, polygon, optimism, arbitrum } from "wagmi/chains";
// import {
//   EthereumClient,
//   w3mConnectors,
//   w3mProvider,
// } from "@web3modal/ethereum";
// import { Web3Modal } from "@web3modal/react";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TokenSelector from "./components/token-selector";

// const projectId = "d0f48a26e609bd2f79c199be673180e4";

// const config = createConfig({
//   chains: [mainnet, polygon, optimism, arbitrum],
//   transports: {
//     [mainnet.id]: w3mProvider({ projectId }),
//     [polygon.id]: w3mProvider({ projectId }),
//     [optimism.id]: w3mProvider({ projectId }),
//     [arbitrum.id]: w3mProvider({ projectId }),
//   },
//   connectors: w3mConnectors({
//     projectId,
//     chains: [mainnet, polygon, optimism, arbitrum],
//   }),
// });

// // Create ethereum client
// const ethereumClient = new EthereumClient(config, [
//   mainnet,
//   polygon,
//   optimism,
//   arbitrum,
// ]);

// // Create query client
// const queryClient = new QueryClient();

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("exchange");
  const [amount1, setAmount1] = useState<string>("0.0");
  const [amount2, setAmount2] = useState<string>("0.0");

  const { open } = useWeb3Modal();
  const { address }: { address: string | undefined } = useWeb3ModalAccount();
  const [liquidityAmount1, setLiquidityAmount1] = useState("0.0");
  const [liquidityAmount2, setLiquidityAmount2] = useState("0.0");
  // const { address, isConnected } = useAccount();
  //  const { connect } = useConnect();
  //  const { disconnect } = useDisconnect();

  const [mounted, setMounted] = useState(false);

  // useEffect(() => setMounted(true), []);

  return (
    <>
     <BackgroundEffects />
      <div className="min-h-screen text-white ">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between p-3 sm:p-4 border-b border-[#2a4b8a] space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-4 sm:space-x-8 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center">
              <span className="text-xl sm:text-2xl font-bold">SuiDe</span>
              <span className="text-xl sm:text-2xl font-bold text-green-500">X</span>
            </div>
            {/* <nav className="hidden md:flex items-center space-x-6">
              <button className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm">
                Trade
              </button>
              <button className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm">
                Earn
              </button>
              <button className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                  />
                </svg>
              </button>
            </nav> */}
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto justify-center sm:justify-end">
            <div className="flex items-center space-x-2 text-xs sm:text-sm">
              <span className="text-green-500">$0.0000329</span>
            </div>
            <button className="p-1.5 sm:p-2 hover:bg-gray-800 rounded-full">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
            </button>
            <button className="p-1.5 sm:p-2 hover:bg-gray-800 rounded-full">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>

            {/* Connect Wallet Button */}
            {/* Connect Wallet Button */}
           {/* Connect Wallet Button */}
<div className="flex justify-center">
  <button
    onClick={() => open()}
    className="bg-cyan-900 hover:bg-[#2a2a2a] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-gray-700 font-medium flex items-center justify-center space-x-2 transition-all duration-200 text-sm sm:text-base"
  >
    {address 
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : "Connect Wallet"
    }
  </button>
</div>
          </div>

         
        </header>

        {/* Main Content */}
        <main className="max-w-[480px] mx-auto pt-8 px-4">
       
          <div className="mb-4 sm:mb-6 border-b border-gray-800">
            <div className="flex space-x-4 sm:space-x-6">
              <button
                onClick={() => setActiveTab("exchange")}
                className={`pb-2 px-1 text-sm sm:text-base ${
                  activeTab === "exchange"
                    ? "text-green-500 border-b-2 border-green-500"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                Exchange
              </button>
              <button
                onClick={() => setActiveTab("liquidity")}
                className={`pb-2 px-1 text-sm sm:text-base ${
                  activeTab === "liquidity"
                    ? "text-green-500 border-b-2 border-green-500"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                Liquidity
              </button>
            </div>
          </div>

          {activeTab === "exchange" ? (
            <div className="bg-[#222222] rounded-xl border border-gray-800">
              <div className="p-3 sm:p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs sm:text-sm text-gray-400">Swap</span>
                  <button className="p-1.5 sm:p-2 hover:bg-gray-700 rounded-lg">
                    <svg
                      className="w-3 h-3 sm:w-4 sm:h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-2">
                  <TokenSelector
                    amount={amount1}
                    setAmount={setAmount1}
                    token="PLS"
                    tokenImage="/placeholder.svg"
                  />
                  <TokenSelector
                    amount={amount2}
                    setAmount={setAmount2}
                    token="PLSX"
                    tokenImage="/placeholder.svg"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#222222] rounded-xl border border-gray-800">
              <div className="p-3 sm:p-4">
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <span className="text-xs sm:text-sm text-gray-400">Add Liquidity</span>
                  <button className="p-1.5 sm:p-2 hover:bg-gray-700 rounded-lg">
                    <svg
                      className="w-3 h-3 sm:w-4 sm:h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs sm:text-sm text-gray-400">
                        First Token
                      </label>
                      <span className="text-xs sm:text-sm text-gray-400">
                        Balance: 0.0
                      </span>
                    </div>
                    <TokenSelector
                      amount={liquidityAmount1}
                      setAmount={setLiquidityAmount1}
                      token="PLS"
                      tokenImage="/placeholder.svg"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs sm:text-sm text-gray-400">
                        Second Token
                      </label>
                      <span className="text-xs sm:text-sm text-gray-400">
                        Balance: 0.0
                      </span>
                    </div>
                    <TokenSelector
                      amount={liquidityAmount2}
                      setAmount={setLiquidityAmount2}
                      token="PLSX"
                      tokenImage="/placeholder.svg"
                    />
                  </div>

                  <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg transition-colors duration-200 text-sm sm:text-base">
                    Add Liquidity
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Version Info */}
       
      </div>
      
    </>
  );
}
