import { useEffect, useState, useRef } from "react";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import SimpleBar from "simplebar-react";
import "simplebar/dist/simplebar.min.css";
import { toast } from "react-hot-toast";

interface TokenSelectProps {
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
    decimals: number;
  };
  balance: string;
}

const DEFAULT_TOKEN_IMAGE = "https://assets.crypto.ro/logos/sui-sui-logo.png";

const TokenSkeleton = () => (
  <div className="animate-pulse w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl">
    <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
    <div className="flex-1">
      <div className="h-5 w-24 bg-gray-700 rounded mb-1"></div>
      <div className="h-4 w-16 bg-gray-700 rounded"></div>
    </div>
  </div>
);

export function TokenSelect({ onSelect, label }: TokenSelectProps) {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<TokenInfo[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const fetchBalance = async (
    tokenId: string,
    decimals: number
  ): Promise<string> => {
    if (!tokenId || !currentAccount?.address) return "0";
    try {
      const coin = await suiClient.getObject({
        id: tokenId,
        options: { showContent: true },
      });

      if (
        coin.data?.content &&
        "fields" in coin.data.content &&
        typeof coin.data.content.fields === "object" &&
        coin.data.content.fields &&
        "balance" in coin.data.content.fields
      ) {
        const rawBalance = coin.data.content.fields.balance as string;
        return (parseInt(rawBalance, 10) / Math.pow(10, decimals)).toFixed(2);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
    return "0";
  };

  useEffect(() => {
    async function getTokens() {
      if (!currentAccount) return;
      setIsLoading(true);

      try {
        const objects = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          options: {
            showType: true,
            showContent: true,
            showDisplay: true,
          },
        });

        const coinPromises = objects.data
          .filter(
            (obj): obj is typeof obj & { data: { type: string } } =>
              obj.data?.type != null && obj.data.type.includes("::coin::")
          )
          .map(async (obj) => {
            const typeString = obj.data.type;
            const [, , coinType] = typeString
              .split("<")[1]
              .split(">")[0]
              .split("::");

            try {
              const metadata = await suiClient.getCoinMetadata({
                coinType: typeString.split("<")[1].split(">")[0],
              });

              const balance = await fetchBalance(
                obj.data.objectId,
                metadata?.decimals || 0
              );

              return {
                id: obj.data.objectId,
                type: typeString,
                metadata: {
                  name: metadata?.name || coinType,
                  symbol: metadata?.symbol || coinType,
                  image: metadata?.iconUrl || DEFAULT_TOKEN_IMAGE,
                  decimals: metadata?.decimals || 0,
                },
                balance,
              } satisfies TokenInfo;
            } catch (err) {
              return {
                id: obj.data.objectId,
                type: typeString,
                metadata: {
                  name: coinType,
                  symbol: coinType,
                  image: DEFAULT_TOKEN_IMAGE,
                  decimals: 0,
                },
                balance: "0",
              } satisfies TokenInfo;
            }
          });

        const tokenObjects = await Promise.all(coinPromises);
        setTokens(tokenObjects);
        setFilteredTokens(tokenObjects);
      } catch (error) {
        console.error("Error fetching tokens:", error);
      } finally {
        setIsLoading(false);
      }
    }

    getTokens();
  }, [suiClient, currentAccount]);

  useEffect(() => {
    const filtered = tokens.filter((token) => {
      const name = token.metadata?.name?.toLowerCase() || "";
      const symbol = token.metadata?.symbol?.toLowerCase() || "";
      const query = searchQuery.toLowerCase();
      return name.includes(query) || symbol.includes(query);
    });
    setFilteredTokens(filtered);
  }, [searchQuery, tokens]);

  const handleTokenSelect = (token: TokenInfo) => {
    if (!token) {
      toast.error("No token selected! Please try again.");
      return;
    }
    setSelectedToken(token);
    onSelect(token.id);
    setIsOpen(false);
    toast.success(`${token.metadata?.name} selected!`);
  };

  const handleOpenModal = () => {
    if (!currentAccount?.address) {
      toast.error("Please connect your wallet to select a token.");
      return;
    }
    setIsOpen(true);
  };

  return (
    <div className="rounded-3xl px-4 py-6 border-2 border-gray-600 hover:border-[#3a6bc9] transition-all duration-300 hover:shadow-lg hover:shadow-[#3a6bc9]/20">
      <div className="flex justify-center items-center">
        <button
          onClick={handleOpenModal}
          style={{
            boxShadow: "0px 0px 10px cyan, 0px 0px 10px cyan inset",
          }}
          className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2 py-1 sm:py-[0.4rem] rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-[#3a6bc9]/20 active:scale-95 ${
            selectedToken
              ? "bg-gray-900 border-cyan-400"
              : "bg-cyan-200 border-gray-400"
          } border-[1px]`}
        >
          {selectedToken ? (
            <>
              <img
                src={selectedToken.metadata?.image || DEFAULT_TOKEN_IMAGE}
                alt={selectedToken.metadata?.symbol}
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full transition-transform duration-300 hover:rotate-12"
              />
              <span className="font-medium text-gray-300 text-sm sm:text-base">
                {selectedToken.metadata?.symbol}
              </span>
            </>
          ) : (
            <span className="text-gray-600 font-semibold">Select Token</span>
          )}
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
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

      {isOpen && (
        <div className="fixed inset-0 bg-black/10 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-1 animate-fadeIn">
          <div
            ref={modalRef}
            className="relative -mt-10 bg-[#222f3e] rounded-3xl p-2 sm:p-6 w-full max-w-md border-2 border-[#2b4b8a] max-h-[70vh] flex flex-col animate-slideIn shadow-xl shadow-[#3a6bc9]/20"
            style={{ overflow: "hidden" }}
          >
            <SimpleBar style={{ maxHeight: "400px" }}>
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-semibold text-white">
                  {label}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors duration-200 hover:rotate-90 transform"
                >
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex items-center justify-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tokens..."
                  className="w-[90%] p-2 text-white bg-gray-800 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#3a6bc9]"
                  style={{
                    boxShadow: "0px 0px 5px cyan, 0px 0px 5px cyan inset",
                  }}
                />
              </div>

              <div className="mt-3 sm:mt-4 space-y-1 sm:space-y-2 overflow-y-auto flex-1">
                {isLoading ? (
                  <>
                    <TokenSkeleton />
                    <TokenSkeleton />
                    <TokenSkeleton />
                  </>
                ) : filteredTokens.length === 0 ? (
                  <div className="text-center text-gray-400 py-4 animate-fadeIn">
                    No tokens found for your search
                  </div>
                ) : (
                  filteredTokens.map((token, index) => (
                    <button
                      key={token.id}
                      className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl hover:bg-[#222f3e] hover:bg-opacity-40 hover:backdrop-filter hover:backdrop-blur-sm transition-all duration-300 animate-slideIn"
                      onClick={() => handleTokenSelect(token)}
                      style={{
                        animationDelay: `${index * 50}ms`,
                      }}
                    >
                      <img
                        src={token.metadata?.image || DEFAULT_TOKEN_IMAGE}
                        alt={token.metadata?.symbol}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-transform duration-300 group-hover:rotate-12"
                      />
                      <div className="text-left flex-1">
                        <div className="font-medium text-white text-2xl transition-all duration-300 group-hover:text-[#3a6bc9]">
                          {token.metadata?.name}
                        </div>
                        <div className="flex justify-between text-sm sm:text-base text-gray-200">
                          <span>{token.metadata?.symbol}</span>
                          <span>{token.balance}</span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </SimpleBar>
          </div>
        </div>
      )}
    </div>
  );
}
