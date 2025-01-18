import React, { createContext, useContext, useState, useEffect } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { useCurrentAccount } from "@mysten/dapp-kit";

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

interface TokenContextType {
  tokens: TokenInfo[];
  filteredTokens: TokenInfo[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export const TokenProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<TokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();

  const DEFAULT_TOKEN_IMAGE = "https://assets.crypto.ro/logos/sui-sui-logo.png";

  const fetchBalance = async (
    tokenId: string,
    decimals: number,
    setBalance: (balance: string) => void
  ) => {
    if (!tokenId || !currentAccount?.address) return;
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
        const formattedBalance = (
          parseInt(rawBalance, 10) / Math.pow(10, decimals)
        ).toFixed(2);
        setBalance(formattedBalance);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  // Fetch tokens
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
            (obj) =>
              obj.data && obj.data.type && obj.data.type.includes("::coin::")
          )
          .map(async (obj) => {
            const typeString = obj.data!.type ?? "";
            const [, , coinType] = typeString
              .split("<")[1]
              .split(">")[0]
              .split("::");

            try {
              const metadata = await suiClient.getCoinMetadata({
                coinType: typeString.split("<")[1].split(">")[0],
              });

              const token: TokenInfo = {
                id: obj.data!.objectId,
                type: typeString,
                metadata: {
                  name: metadata?.name || coinType,
                  symbol: metadata?.symbol || coinType,
                  image: metadata?.iconUrl || DEFAULT_TOKEN_IMAGE,
                  decimals: metadata?.decimals || 0,
                },
                balance: "0",
              };

              await fetchBalance(
                obj.data!.objectId,
                metadata?.decimals || 0,
                (balance) => {
                  token.balance = balance;
                }
              );

              return token;
            } catch (err) {
              console.error("Error fetching metadata:", err);
              return {
                id: obj.data!.objectId,
                type: typeString,
                metadata: {
                  name: coinType,
                  symbol: coinType,
                  image: DEFAULT_TOKEN_IMAGE,
                  decimals: 0,
                },
                balance: "0",
              };
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

  // Filter tokens based on search
  useEffect(() => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) {
      setFilteredTokens(tokens);
      return;
    }

    const filtered = tokens.filter((token) => {
      return (
        token.metadata?.name.toLowerCase().includes(term) ||
        token.metadata?.symbol.toLowerCase().includes(term) ||
        token.id.toLowerCase().includes(term)
      );
    });
    setFilteredTokens(filtered);
  }, [searchQuery, tokens]);

  return (
    <TokenContext.Provider
      value={{
        tokens,
        filteredTokens,
        isLoading,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </TokenContext.Provider>
  );
};

export const useTokens = () => {
  const context = useContext(TokenContext);
  if (context === undefined) {
    throw new Error("useTokens must be used within a TokenProvider");
  }
  return context;
};

export default TokenContext;
