// TokenSelector.tsx
import { useState } from "react";

interface TokenSelectorProps {
  amount: string;
  setAmount: (value: string) => void;
  token: string;
  tokenImage: string;
}

const tokenList = {
  PLS: {
    name: "PulseChain",
    image: "/pulse-logo.png",
    symbol: "PLS"
  },
  PLSX: {
    name: "PulseX",
    image: "/pulsex-logo.png",
    symbol: "PLSX"
  },
  // Add more tokens as needed
};

export default function TokenSelector({ amount, setAmount, token, tokenImage }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl p-3 sm:p-4 border hover:border-[#3a6bc9] transition-colors">
      <div className="flex justify-between items-center gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-transparent border-none text-lg sm:text-2xl w-full p-0 focus:outline-none text-cyan-50 "
            placeholder="0.0"
          />
          <div className="text-xs sm:text-sm mt-0.5 sm:mt-1">
            ≈ $0.00
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#2a4b8a] hover:bg-[#3a6bc9] transition-colors"
        >
          <img
            src={tokenImage}
            alt={token}
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full ring-2 ring-cyan-400/30"
          />
          <span className="font-medium text-cyan-50 text-sm sm:text-base">{token}</span>
          <svg 
            className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-300" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 9l-7 7-7-7" 
            />
          </svg>
        </button>
      </div>

      {/* Token Selection Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a2b4a] rounded-2xl p-4 sm:p-6 w-full max-w-md border border-[#2a4b8a] max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-semibold text-cyan-50">Select Token</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-cyan-300 hover:text-cyan-100"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <input
              type="text"
              placeholder="Search token name or paste address"
              className="w-full bg-[#2a4b8a] rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-cyan-50 placeholder-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
            />

            <div className="mt-3 sm:mt-4 space-y-1 sm:space-y-2 overflow-y-auto flex-1">
              {Object.entries(tokenList).map(([symbol, details]) => (
                <button
                  key={symbol}
                  className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl hover:bg-[#2a4b8a] transition-colors"
                  onClick={() => {
                    // Handle token selection
                    setIsOpen(false);
                  }}
                >
                  <img 
                    src={details.image} 
                    alt={details.name} 
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full"
                  />
                  <div className="text-left">
                    <div className="font-medium text-cyan-50 text-sm sm:text-base">{details.name}</div>
                    <div className="text-xs sm:text-sm text-cyan-300/70">{symbol}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}