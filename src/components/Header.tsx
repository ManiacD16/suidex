import { useEffect, useState } from "react";
//import { useWeb3ModalAccount, useWeb3Modal } from "@web3modal/ethers5/react";
import BackgroundEffects from "./BackgroundEffects";
import { ConnectButton } from "@mysten/dapp-kit";
// import { ConnectButton } from '@mysten/dapp-kit';
import { useCurrentAccount } from "@mysten/dapp-kit";
// //import { useWallet } from '@mysten/dapp-kit';
// import '@mysten/dapp-kit/dist/index.css';
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
//import TokenSelector from "./components/token-selector";

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

const getShortAddress = (address: string | undefined) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export default function Header() {
  const [activeTab, setActiveTab] = useState<string>("exchange");
  const [amount1, setAmount1] = useState<string>("0.0");
  const [amount2, setAmount2] = useState<string>("0.0");
  // const currentAccount = useCurrentAccount();
  const currentAccount = useCurrentAccount();
  // const { open } = useWeb3Modal();
  // const { address }: { address: string | undefined } = useWeb3ModalAccount();
  //const suiClient = useSuiClient();
  const [liquidityAmount1, setLiquidityAmount1] = useState("0.0");
  const [liquidityAmount2, setLiquidityAmount2] = useState("0.0");
  // const [isConnected, setIsConnected] = useState(false);
  // const { address, isConnected } = useAccount();
  //  const { connect } = useConnect();
  //  const { disconnect } = useDisconnect();

  // const getShortAddress = (address: string | undefined) => {
  //   if (!address) return '';
  //   return `${address.slice(0, 6)}...${address.slice(-4)}`;
  // };

  //const [mounted, setMounted] = useState(false);
  // Add effect to handle wallet connection
  // Add effect to handle wallet connection
  //  // Enhanced wallet connection monitoring
  //  useEffect(() => {
  //   if (!window.suiWallet) {
  //     console.warn("Sui Wallet is not installed.");
  //   } else {
  //     console.log("Sui Wallet is available.");
  //     window.suiWallet.getAccounts().then((accounts) => {
  //       console.log("Accounts available:", accounts);
  //     }).catch((error) => {
  //       console.error("Error fetching accounts:", error);
  //     });
  //   }
  // }, []);

  // useEffect(() => setMounted(true), []);

  // Custom connect button component

  useEffect(() => {
    console.log("Rendering App", { activeTab, amount1, amount2 });
  });

  return (
    <>
      <BackgroundEffects />

      {/* Header */}
      <header className="flex  px-2 items-center justify-between p-3 sm:p-4 border-b border-[#2a4b8a]">
        <div className="flex items-center space-x-4 sm:space-x-8 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center">
            <span className="text-xl sm:text-2xl font-bold">SuiDe</span>
            <span className="text-xl sm:text-2xl font-bold text-green-500">
              X
            </span>
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
        <div className="flex items-center space-x-2  w-full sm:w-auto justify-end">
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
          {/* Enhanced Connect Button with custom styling */}
          <div className="relative">
            <style>
              {`
          /* Base modal styles */
/* Base modal styles */
/* Base modal styles */

/* Clean up modal header */
div[role="dialog"] h1 {
  font-size: 1rem !important;
  padding: 0.75rem 1rem !important;
  margin: 0 !important;
  border-bottom: 1px solid #eee;
  text-align: center !important;
}

/* Style wallet options */
div[role="dialog"] button {
  width: 100% !important;
  padding: 0.625rem !important;
  margin: 0.25rem 0 !important;
  border-radius: 0.5rem !important;
  transition: background 0.2s !important;
  background-color: #dce8e1 !important; /* Green background */
  color: white !important;
}

/* Button hover state */
div[role="dialog"] button:hover {
  background-color: #16a34a !important; /* Darker green on hover */
}

/* Close Button */
div[role="dialog"] button[aria-label="Close"] {
  position: absolute !important;
  top: 0.75rem !important;
  right: 0.75rem !important;
  width: auto !important;
  padding: 0.375rem !important;
  background-color: transparent !important;
  color: #666 !important;
}

/* Clean up the modal content area */
div[role="dialog"] > div {
  padding: 0.75rem !important;
  max-height: 80vh !important;
  overflow-y: auto !important;
}

/* "What is a Wallet?" text styling */
div[role="dialog"] button:last-child,
div[role="dialog"] .what-is-wallet-btn {
  color: black !important;
  background-color: #f0f0f0 !important;
}

/* Mobile-first responsive button styles */
.sui-connect-button {
  font-size: 0.875rem !important;
  padding: 0.5rem 0.75rem !important;
  min-width: auto !important;
  white-space: nowrap !important;
  background-color: #dce8e1 !important;
  color: white !important;
  border-radius: 0.5rem !important;
}

/* Connected state styles */
.sui-connect-button div {
  background-color: #dce8e1 !important;
  color: white !important;
  padding: 0.5rem 0.75rem !important;
  border-radius: 0.5rem !important;
}

/* Center dropdown positioning */
div[role="dialog"] {
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  margin: 0 !important;
}

@media (max-width: 640px) {
  .sui-connect-button {
    font-size: 0.75rem !important;
    padding: 0.375rem 0.5rem !important;
  }
  
  .sui-connect-button span {
    max-width: 80px !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }
  
  /* Ensure dropdown stays centered on mobile */
  div[role="dialog"] {
    width: 90% !important;
    max-width: 400px !important;
  }
  
  /* Specific mobile styling for "What is a Wallet?" text */
  div[role="dialog"] button:last-child,
  div[role="dialog"] .what-is-wallet-btn {
    color: black !important;
    background-color: #f0f0f0 !important;
    font-weight: normal !important;
  }
}

/* Only target the main connect button */
.sui-connect-button {
  background-color: #dce8e1 !important;
  color: green !important;
  padding: 0.5rem 1rem !important;
  border-radius: 0.5rem !important;
}

.sui-connect-button:hover {
  background-color: #16a34a !important;
}
        `}
            </style>
            <ConnectButton
              className=" !text-black hover:!bg-[#16a34a] rounded-lg transition-colors duration-200"
              style={{
                backgroundColor: "#22c55e !important",
                color: "white !important",
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
              }}
              connectText="Connect Wallet"
            >
              {currentAccount ? (
                <div className="flex items-center space-x-1">
                  <span>{getShortAddress(currentAccount.address)}</span>
                </div>
              ) : (
                "Connect"
              )}
            </ConnectButton>
          </div>
        </div>
      </header>
    </>
  );
}
