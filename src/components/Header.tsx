import { useState, useEffect, useRef } from "react";
import BackgroundEffects from "./BackgroundEffects";
import { ConnectButton } from "@mysten/dapp-kit";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { Wallet, Search, X } from "lucide-react";
import { debounce } from "lodash";
import SimpleBar from "simplebar-react";
import "simplebar/dist/simplebar.min.css";

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

const getShortAddress = (address: string | undefined) => {
  if (!address) return "";
  return `${address.slice(0, 5)}...${address.slice(-4)}`;
};

const formatBalance = (balance: string, decimals: number = 9) => {
  const value = Number(balance) / Math.pow(10, decimals);
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
};

export default function Header() {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<TokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

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
        const balance = coin.data.content.fields.balance as string;
        return formatBalance(balance, decimals);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
    return "0";
  };

  const fetchTokens = async () => {
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

      const coinObjects = objects.data.filter(
        (obj) => obj.data && obj.data.type && obj.data.type.includes("::coin::")
      );

      const tokenPromises = coinObjects.map(async (obj) => {
        const typeString = obj.data!.type ?? "";
        const [, , coinType] = typeString
          .split("<")[1]
          .split(">")[0]
          .split("::");

        try {
          const metadata = await suiClient.getCoinMetadata({
            coinType: typeString.split("<")[1].split(">")[0],
          });

          const balance = await fetchBalance(
            obj.data!.objectId,
            metadata?.decimals || 9
          );

          return {
            id: obj.data!.objectId,
            type: typeString,
            metadata: {
              name: metadata?.name || coinType,
              symbol: metadata?.symbol || coinType,
              image: metadata?.iconUrl || DEFAULT_TOKEN_IMAGE,
              decimals: metadata?.decimals || 9,
            },
            balance,
          };
        } catch (err) {
          console.error("Error fetching token metadata:", err);
          return {
            id: obj.data!.objectId,
            type: typeString,
            metadata: {
              name: coinType,
              symbol: coinType,
              image: DEFAULT_TOKEN_IMAGE,
              decimals: 9,
            },
            balance: "0",
          };
        }
      });

      const tokenResults = await Promise.all(tokenPromises);
      setTokens(tokenResults);
      if (searchQuery) {
        debouncedSearch(searchQuery);
      }
    } catch (error) {
      console.error("Error fetching tokens:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Effects and Event Handlers
  useEffect(() => {
    fetchTokens();
    const intervalId = setInterval(fetchTokens, 30000); // Refresh every 30 seconds
    return () => clearInterval(intervalId);
  }, [currentAccount]);

  const debouncedSearch = debounce((term: string) => {
    const searchTerm = term.toLowerCase().trim();
    const filtered = tokens.filter((token) => {
      return (
        token.metadata?.name.toLowerCase().includes(searchTerm) ||
        token.metadata?.symbol.toLowerCase().includes(searchTerm) ||
        token.id.toLowerCase().includes(searchTerm)
      );
    });
    setFilteredTokens(filtered);
  }, 300);

  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery);
    } else {
      setFilteredTokens([]);
    }
    return () => debouncedSearch.cancel();
  }, [searchQuery]);

  const handleWalletClick = () => {
    setDropdownVisible(!dropdownVisible);
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
  };

  const handleSearchBlur = (e: React.FocusEvent) => {
    if (!searchRef.current?.contains(e.relatedTarget as Node)) {
      if (!searchQuery) {
        setIsSearchFocused(false);
      }
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearchFocused(false);
    setFilteredTokens([]);
  };

  const TokenItem = ({ token }: { token: TokenInfo }) => (
    <div className="flex items-center gap-3 p-3 hover:bg-gray-700/50 transition-colors cursor-pointer rounded-lg">
      <img
        src={token.metadata?.image || DEFAULT_TOKEN_IMAGE}
        alt={token.metadata?.symbol}
        className="w-8 h-8 rounded-full"
        onError={(e) => {
          (e.target as HTMLImageElement).src = DEFAULT_TOKEN_IMAGE;
        }}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-gray-200 font-medium truncate">
          {token.metadata?.symbol}
        </span>
        <span className="text-sm text-gray-400 truncate">
          {token.metadata?.name}
        </span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-sm text-gray-200">{token.balance}</span>
        <span className="text-xs text-gray-500">
          ≈ {token.id.slice(0, 4)}...{token.id.slice(-4)}
        </span>
      </div>
    </div>
  );

  return (
    <>
      <BackgroundEffects />

      <header className="relative flex px-4 items-center justify-between py-2 sm:py-2 border-b border-[#2a4b8a] bg-[#0f172a] z-50">
        <div className="flex items-center space-x-4 sm:space-x-8">
          <div className="flex items-center">
            <span className="text-xl sm:text-2xl font-bold text-cyan-500/90">
              SuiDe
            </span>
            <span className="text-xl sm:text-2xl font-bold text-green-500/90">
              X
            </span>
          </div>

          {/* Desktop Search */}
          <div ref={searchRef} className="relative hidden sm:block">
            <div
              className={`relative transition-all duration-300 ${
                isSearchFocused ? "w-96" : "w-64"
              }`}
            >
              <div className="absolute left-3 flex items-center pointer-events-none">
                <div className="mt-3">
                  <Search
                    className={`h-4 w-4 ${
                      isSearchFocused ? "text-cyan-500" : "text-gray-400"
                    }`}
                  />
                </div>
              </div>
              <input
                type="text"
                placeholder="Search tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                className={`w-full bg-gray-800/50 text-gray-200 pl-9 pr-8 py-2 rounded-xl border ${
                  isSearchFocused
                    ? "border-cyan-500 ring-1 ring-cyan-500/50"
                    : "border-gray-700 hover:border-gray-600"
                } focus:outline-none transition-all duration-300`}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors duration-200"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Desktop Search Results */}
              {/* Desktop Search Results - Fixed blurring and backdrop */}
              {isSearchFocused && searchQuery && (
                <>
                  {/* Semi-transparent overlay that doesn't blur */}
                  <div
                    className="fixed inset-0 bg-black/20 z-[51]"
                    onClick={() => {
                      setIsSearchFocused(false);
                      setSearchQuery("");
                    }}
                    style={{ marginTop: "60px" }} // Adjust this value based on your header height
                  />

                  {/* Results Container */}
                  <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-[28rem] bg-gray-800 rounded-xl border border-gray-700 shadow-xl overflow-hidden z-[52]">
                    <div className="backdrop-blur-sm bg-gray-800/80">
                      <SimpleBar style={{ maxHeight: "450px" }}>
                        <div className="max-h-[70vh] ">
                          <div className="p-2 space-y-1">
                            {isLoading ? (
                              <div className="p-4 text-center text-gray-400">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500 mx-auto"></div>
                              </div>
                            ) : filteredTokens.length > 0 ? (
                              filteredTokens.map((token) => (
                                <TokenItem key={token.id} token={token} />
                              ))
                            ) : (
                              <div className="p-4 text-center text-gray-400">
                                No tokens found
                              </div>
                            )}
                          </div>
                        </div>
                      </SimpleBar>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          {/* Mobile Search Button */}
          <button
            className="sm:hidden p-2 text-gray-400 hover:text-gray-200 transition-colors duration-200"
            onClick={() => setIsSearchFocused(!isSearchFocused)}
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Mobile Search Overlay */}
          {isSearchFocused && (
            <div className="fixed sm:hidden inset-0 bg-gray-900/95 z-[100] px-4 py-2">
              <div className="flex flex-col h-full">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="relative flex-1">
                    {/* Search Icon - Position based on parent height */}
                    <div className="absolute left-3 h-full flex items-center top-0">
                      <Search className="h-4 w-4 text-cyan-500" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search tokens..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                      className="w-full h-[42px] bg-gray-800/50 text-gray-200 pl-9 pr-8 rounded-xl border border-cyan-500 ring-1 ring-cyan-500/50 focus:outline-none"
                    />
                    {/* {searchQuery && (
                      <div className="absolute right-3 h-full flex items-center top-0">
                        <button
                          onClick={clearSearch}
                          className="text-gray-400 hover:text-gray-200"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )} */}
                  </div>
                  <button
                    onClick={() => {
                      setIsSearchFocused(false);
                      setSearchQuery("");
                    }}
                    className="text-gray-400 hover:text-gray-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Mobile Search Results */}
                <div className="flex-1 overflow-y-auto p-2">
                  {isLoading ? (
                    <div className="p-4 text-center text-gray-400">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500 mx-auto"></div>
                    </div>
                  ) : filteredTokens.length > 0 ? (
                    filteredTokens.map((token) => (
                      <TokenItem key={token.id} token={token} />
                    ))
                  ) : searchQuery ? (
                    <div className="p-4 text-center text-gray-400">
                      No tokens found
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* Desktop Connect Button */}
          <div className="hidden sm:block">
            <ConnectButton
              className="sui-connect-button !text-black hover:!bg-[#16a34a] rounded-xl transition-all duration-300"
              style={{
                backgroundColor: "#22c55e !important",
                color: "white !important",
                borderRadius: "1rem",
              }}
              connectText="Connect Wallet"
            >
              {currentAccount ? (
                <div className="flex items-center space-x-1">
                  <span className="hidden sm:inline-block">
                    {getShortAddress(currentAccount?.address)}
                  </span>
                  <span className="inline-block sm:hidden text-ellipsis overflow-hidden max-w-[80px]">
                    {getShortAddress(currentAccount?.address)}
                  </span>
                </div>
              ) : (
                "Connect"
              )}
            </ConnectButton>
          </div>

          {/* Mobile Wallet Button */}
          <div className="sm:hidden relative">
            <button
              className="text-white p-2 rounded-full bg-[#22c55e]"
              onClick={handleWalletClick}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Wallet size={20} color="white" />
            </button>

            {dropdownVisible && (
              <div className="absolute right-0 mt-2 w-[200px] bg-gray-800/95 border border-[#2a4b8a] rounded-lg px-2 shadow-lg z-50">
                <ConnectButton
                  className="sui-connect-button !text-black hover:!bg-[#16a34a] rounded-xl transition-all duration-300"
                  style={{
                    backgroundColor: "#22c55e !important",
                    color: "white !important",
                    borderRadius: "1rem",
                  }}
                  connectText="Connect Wallet"
                >
                  {currentAccount ? (
                    <div className="flex items-center space-x-1">
                      <span className="hidden sm:inline-block">
                        {getShortAddress(currentAccount?.address)}
                      </span>
                      <span className="inline-block sm:hidden text-ellipsis overflow-hidden max-w-[80px]">
                        {getShortAddress(currentAccount?.address)}
                      </span>
                    </div>
                  ) : (
                    "Connect"
                  )}
                </ConnectButton>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Backdrop for desktop search */}
      {isSearchFocused && searchQuery && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => {
            setIsSearchFocused(false);
            setSearchQuery("");
          }}
        />
      )}
    </>
  );
}
