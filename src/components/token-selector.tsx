import { useState, useEffect } from "react";
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';

interface TokenSelectorProps {
  onSelect: (tokenId: string) => void;
  label: string;
}

interface TokenInfo {
  id: string;
  type: string;
  metadata?: {
    name: string;
    symbol: string;
    image?: string;
  }
}

export default function TokenSelector({ onSelect, label }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();

  useEffect(() => {
    async function getTokens() {
      if (!currentAccount) return;
 
      try {
        const objects = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          options: {
            showType: true,
            showContent: true,
            showDisplay: true
          }
        });
 
        const coinPromises = objects.data
          .filter(obj => obj.data && obj.data.type.includes('::coin::'))
          .map(async (obj) => {
            const typeString = obj.data!.type;
            const [, , coinType] = typeString.split('<')[1].split('>')[0].split('::');
            
            try {
              const metadata = await suiClient.getCoinMetadata({
                coinType: typeString.split('<')[1].split('>')[0]
              });
 
              return {
                id: obj.data!.objectId,
                type: typeString,
                metadata: {
                  name: metadata?.name || coinType,
                  symbol: metadata?.symbol || coinType
                }
              };
            } catch (err) {
              return {
                id: obj.data!.objectId,
                type: typeString,
                metadata: {
                  name: coinType,
                  symbol: coinType
                }
              };
            }
          });
 
        const tokenObjects = await Promise.all(coinPromises);
        console.log("the token is",tokenObjects)
        setTokens(tokenObjects);
      } catch (error) {
        console.error('Error fetching tokens:', error);
      }
    }
 
    getTokens();
  }, [suiClient, currentAccount]);

  const handleTokenSelect = (token: TokenInfo) => {
    setSelectedToken(token);
    onSelect(token.id);
    setIsOpen(false);
  };

  // Format balance to a readable string
  const formatBalance = (balance: string) => {
    try {
      const num = BigInt(balance);
      return (Number(num) / 1e9).toFixed(6);
    } catch {
      return '0.000000';
    }
  };

  return (
    <div className="rounded-xl p-3 sm:p-4 border border-gray-700 hover:border-[#3a6bc9] transition-colors">
      <div className="flex justify-between items-center gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={amount}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*\.?\d*$/.test(value) || value === '') {
                setAmount(value);
              }
            }}
            className="bg-transparent border-none text-lg sm:text-2xl w-full p-0 focus:outline-none text-white"
            placeholder="0.0"
          />
        </div>
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#2a4b8a] hover:bg-[#3a6bc9] transition-colors"
        >
          {selectedToken ? (
            <>
              <img
                src={selectedToken.metadata?.image}
                alt={selectedToken.metadata?.symbol}
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/default-token-icon.png";
                }}
              />
              <span className="font-medium text-white text-sm sm:text-base">
                {selectedToken.metadata?.symbol}
              </span>
            </>
          ) : (
            <span className="text-white">Select Token</span>
          )}
          <svg 
            className="w-3 h-3 sm:w-4 sm:h-4 text-white" 
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
              <h3 className="text-lg sm:text-xl font-semibold text-white">Select Token</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-3 sm:mt-4 space-y-1 sm:space-y-2 overflow-y-auto flex-1">
              {tokens.length === null ? (
                <div className="text-center text-gray-400 py-4">
                  No tokens found in your wallet
                </div>
              ) : (
                tokens.map((token) => (
                  <button
                    key={token.id}
                    className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl hover:bg-[#2a4b8a] transition-colors"
                    onClick={() => handleTokenSelect(token)}
                  >
                    <img 
                      src={token.metadata?.image}
                      alt={token.metadata?.symbol}
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/default-token-icon.png";
                      }}
                    />
                    <div className="text-left flex-1">
                      <div className="font-medium text-white text-sm sm:text-base">
                        {token.metadata?.name}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-400">
                        {token.metadata?.symbol}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}