import { useState, useEffect } from "react";
import {
  useCurrentAccount,
  useSuiClient,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TokenSelector from "./token-selector";
import { CONSTANTS } from "../constants/addresses";

interface Token {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  metadata?: any;
}

// interface LPEvent {
//   type: string;
//   sender: string;
//   lpCoinId: string;
//   token0Type: { name: string };
//   token1Type: { name: string };
//   amount0: string;
//   amount1: string;
//   liquidity: string;
//   totalSupply: string;
// }

const formatTokenAmount = (amount: string, decimals: number) => {
  const formattedAmount = Number(amount) / Math.pow(10, decimals);
  return formattedAmount.toFixed(6);
};

export default function RemoveLiquidity() {
  const [token0, setToken0] = useState<Token | null>(null);
  const [token1, setToken1] = useState<Token | null>(null);
  const [lpBalances, setLpBalances] = useState<any[]>([]);
  const [selectedLpBalance, setSelectedLpBalance] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(false);
  //   const [events, setEvents] = useState<LPEvent[]>([]);
  const [pairExists, setPairExists] = useState(false);
  const [currentPairId, setCurrentPairId] = useState<string | null>(null);
  const [reserves, setReserves] = useState({
    reserve0: "0",
    reserve1: "0",
    timestamp: 0,
  });

  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  // Function to get base type from coin type
  const getBaseType = (coinType: string) => {
    try {
      if (coinType.includes("::coin::Coin<")) {
        const match = coinType.match(/<(.+)>/);
        return match ? match[1] : coinType;
      }
      return coinType;
    } catch (error) {
      console.error("Error parsing coin type:", error);
      return coinType;
    }
  };

  // Function to normalize type for comparison
  const normalizeType = (type: string) => {
    type = type.trim();
    type = type.endsWith(">") ? type.slice(0, -1) : type;
    return type;
  };

  // Function to compare two token types
  const compareTokenTypes = (type1: string, type2: string) => {
    return normalizeType(type1) === normalizeType(type2);
  };

  // Function to handle token changes
  const handleToken0Change = async (newToken: Token | null) => {
    setToken0(newToken);
    resetState();
  };

  const handleToken1Change = async (newToken: Token | null) => {
    setToken1(newToken);
    resetState();
  };

  const resetState = () => {
    setLpBalances([]);
    setSelectedLpBalance("0");
    setPairExists(false);
    setCurrentPairId(null);
    setReserves({
      reserve0: "0",
      reserve1: "0",
      timestamp: 0,
    });
  };
  // Function to find LP tokens
  useEffect(() => {
    const findLPTokens = async () => {
      if (!token0 || !token1 || !account?.address) return;
      setIsLoading(true);
      console.log("\n--- Starting LP Token Search ---");

      try {
        const [token0Obj, token1Obj] = await Promise.all([
          suiClient.getObject({ id: token0.id, options: { showType: true } }),
          suiClient.getObject({ id: token1.id, options: { showType: true } }),
        ]);

        const token0Type = token0Obj.data?.type
          ? getBaseType(token0Obj.data.type)
          : "";
        const token1Type = token1Obj.data?.type
          ? getBaseType(token1Obj.data.type)
          : "";

        const objects = await suiClient.getOwnedObjects({
          owner: account.address,
          options: {
            showType: true,
            showContent: true,
            showDisplay: true,
          },
        });

        const lpTokens = objects.data
          .filter((obj) => {
            if (!obj.data?.type || !obj.data.type.includes("::pair::LPCoin<"))
              return false;

            const typeString = obj.data.type;
            const lpTokenTypes =
              typeString?.match(/LPCoin<(.+),\s*(.+)>/) || [];
            if (!lpTokenTypes) {
              console.log("No LP token types found in string");
              return false;
            }

            const [, lpType0, lpType1] = lpTokenTypes;
            const normalizedLpType0 = getBaseType(lpType0.trim());
            const normalizedLpType1 = getBaseType(
              lpType1.trim().replace(">", "")
            );
            console.log("Comparing Types:", {
              normalizedLpType0,
              normalizedLpType1,
              token0Type,
              token1Type,
            });

            return (
              (compareTokenTypes(normalizedLpType0, token0Type) &&
                compareTokenTypes(normalizedLpType1, token1Type)) ||
              (compareTokenTypes(normalizedLpType0, token1Type) &&
                compareTokenTypes(normalizedLpType1, token0Type))
            );
          })
          .map((obj) => {
            if (!obj.data?.type || !obj.data?.objectId) return null;

            let balance = "0";

            if (
              obj.data?.content &&
              typeof obj.data.content === "object" &&
              "fields" in obj.data.content &&
              obj.data.content.fields &&
              typeof obj.data.content.fields === "object" &&
              "balance" in obj.data.content.fields
            ) {
              balance = obj.data.content.fields.balance as string;
            }

            return {
              id: obj.data.objectId,
              type: obj.data.type,
              metadata: {
                name: "LPCoin",
                symbol: "LP",
              },
              balance,
            };
          })
          .filter(Boolean);

        const totalBalance = lpTokens
          .filter((token) => token !== null) // Remove null values
          .reduce((sum, token) => sum + BigInt(token.balance || 0), 0n);

        setLpBalances(lpTokens);
        setSelectedLpBalance(totalBalance.toString());
        setPairExists(lpTokens.length > 0);

        if (lpTokens.length > 0) {
          await fetchPairData(token0Type, token1Type);
        }
      } catch (error) {
        console.error("Error finding LP tokens:", error);
        toast.error("Error loading LP tokens");
      } finally {
        setIsLoading(false);
      }
    };

    findLPTokens();
  }, [token0, token1, account?.address, suiClient]);

  const fetchPairData = async (token0Type: string, token1Type: string) => {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::factory::get_pair`,
        typeArguments: [token0Type, token1Type],
        arguments: [tx.object(CONSTANTS.FACTORY_ID)],
      });

      const response = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: account?.address || "",
      });

      if (response?.results?.[0]?.returnValues) {
        const optionValue = response.results[0].returnValues[0];
        if (Array.isArray(optionValue) && optionValue.length > 0) {
          const addressBytes = optionValue[0];
          if (Array.isArray(addressBytes) && addressBytes.length > 1) {
            const hexString = addressBytes
              .slice(1)
              .map((b) => b.toString(16).padStart(2, "0"))
              .join("");
            const pairId = `0x${hexString}`;
            setCurrentPairId(pairId);

            const pairObject = await suiClient.getObject({
              id: pairId,
              options: { showContent: true },
            });

            if (
              pairObject.data?.content &&
              typeof pairObject.data.content === "object" &&
              "fields" in pairObject.data.content &&
              pairObject.data.content.fields
            ) {
              const fields = pairObject.data.content.fields as {
                reserve0: string;
                reserve1: string;
                block_timestamp_last: number;
              };
              setReserves({
                reserve0: fields.reserve0,
                reserve1: fields.reserve1,
                timestamp: Number(fields.block_timestamp_last) || 0,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching pair data:", error);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!account?.address || lpBalances.length === 0) {
      toast.error("Please select a pair with LP tokens");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Processing transaction...");

    try {
      if (!lpBalances.length || !lpBalances[0]) {
        toast.error("No LP tokens found");
        return;
      }

      const lpCoin = lpBalances[0];
      const lpAmount = BigInt(lpCoin?.balance || "0");

      const response = await suiClient.getObject({
        id: lpCoin.id,
        options: { showType: true },
      });

      if (!response?.data || !("type" in response.data)) {
        throw new Error("Invalid LP token type: Missing data.type");
      }

      const type = response.data.type;

      if (!type) {
        throw new Error("Failed to retrieve LP token type.");
      }

      const lpTokenTypes = type.match(/LPCoin<(.+),\s*(.+)>/);
      if (!lpTokenTypes) {
        throw new Error("Invalid LP token format.");
      }

      let [, type0, type1] = lpTokenTypes;
      type0 = getBaseType(type0.trim());
      type1 = getBaseType(type1.trim().replace(">", ""));

      const reserve0 = BigInt(reserves?.reserve0 || "0");
      const reserve1 = BigInt(reserves?.reserve1 || "0");

      const amount0Expected =
        (lpAmount * reserve0) / BigInt(selectedLpBalance || "1");
      const amount1Expected =
        (lpAmount * reserve1) / BigInt(selectedLpBalance || "1");

      const minAmount0 = (amount0Expected * 95n) / 100n;
      const minAmount1 = (amount1Expected * 95n) / 100n;

      const currentTimestamp = Math.floor(Date.now());
      const deadline = currentTimestamp + 1200000; // 20 minutes

      if (!currentPairId) {
        throw new Error("No valid liquidity pair found.");
      }

      const tx = new Transaction();
      tx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.ROUTER}::remove_liquidity`,
        typeArguments: [type0, type1],
        arguments: [
          tx.object(CONSTANTS.ROUTER_ID),
          tx.object(CONSTANTS.FACTORY_ID),
          tx.object(currentPairId),
          tx.object(lpCoin.id),
          tx.pure.u256(minAmount0.toString()),
          tx.pure.u256(minAmount1.toString()),
          tx.pure.u64(deadline),
        ],
      });

      await signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log("Success:", result);
            toast.update(toastId, {
              render: "LP removed successfully!",
              type: "success",
              isLoading: false,
              autoClose: 5000,
            });
            resetState();
          },
          onError: (error) => {
            console.error("Error:", error);
            toast.update(toastId, {
              render: `Failed: ${error.message}`,
              type: "error",
              isLoading: false,
              autoClose: 5000,
            });
          },
        }
      );
    } catch (error: any) {
      console.error("Handler Error:", error);
      toast.update(toastId, {
        render: error.message,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <main className="max-w-[480px] mx-auto pt-8 px-4">
        <div className="bg-[#222f3e] bg-opacity-10 backdrop-blur-sm rounded-3xl border border-gray-800 shadow-lg transition-all duration-300 hover:border-gray-700">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg text-gray-300 font-semibold">
                Remove Liquidity
              </span>
              {token0 && token1 && (
                <div
                  className={`px-3 py-2 rounded-lg text-sm ${
                    pairExists
                      ? "bg-green-500/10 text-green-500"
                      : "bg-yellow-500/10 text-yellow-500"
                  }`}
                >
                  {pairExists ? "✓ LP Tokens Found" : "No LP Tokens"}
                </div>
              )}
            </div>

            {pairExists && currentPairId && (
              <div className="p-4 rounded-xl mb-4 bg-green-500/5 border border-green-500/20">
                <div className="text-sm text-gray-300">
                  {`Pair ID: ${currentPairId.slice(0, 8)}...`}
                </div>
                <div className="text-cyan-500 font-medium mt-1">
                  LP Balance: {formatTokenAmount(selectedLpBalance, 9)}
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  Pool Reserves:
                  <div>{`${token0?.symbol}: ${formatTokenAmount(
                    reserves.reserve0,
                    token0?.decimals || 9
                  )}`}</div>
                  <div>{`${token1?.symbol}: ${formatTokenAmount(
                    reserves.reserve1,
                    token1?.decimals || 9
                  )}`}</div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm text-gray-400">
                  First Token
                </label>
                <TokenSelector
                  label="Token 0"
                  onSelect={handleToken0Change}
                  amount=""
                  onAmountChange={() => {}}
                  showInput={false}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm text-gray-400">
                  Second Token
                </label>
                <TokenSelector
                  label="Token 1"
                  onSelect={handleToken1Change}
                  amount=""
                  onAmountChange={() => {}}
                  showInput={false}
                />
              </div>

              <button
                onClick={handleRemoveLiquidity}
                disabled={isLoading || !pairExists}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-red-500/25"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Removing Liquidity...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
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
                        d="M20 12H4"
                      />
                    </svg>
                    Remove Liquidity
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Events Display */}
      {/* <div className="mt-8 max-w-full mx-auto px-4">
        <div className="bg-[#222f3e] bg-opacity-10 backdrop-blur-sm rounded-3xl border border-gray-800 shadow-lg p-4">
          <h2 className="text-lg text-gray-300 font-semibold mb-4">
            Recent Remove LP Events
          </h2>
          {events.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-gray-800">
              <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-gray-900">
                  <tr>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left text-xs font-medium text-gray-400"
                    >
                      Amount 0
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left text-xs font-medium text-gray-400"
                    >
                      Amount 1
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left text-xs font-medium text-gray-400"
                    >
                      Liquidity
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left text-xs font-medium text-gray-400"
                    >
                      LP Token ID
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left text-xs font-medium text-gray-400"
                    >
                      Sender
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left text-xs font-medium text-gray-400"
                    >
                      Token0 Type
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left text-xs font-medium text-gray-400"
                    >
                      Token1 Type
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left text-xs font-medium text-gray-400"
                    >
                      Total Supply
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-gray-900/50">
                  {events.map((event, idx) => (
                    <tr key={idx} className="hover:bg-gray-800/50">
                      <td className="px-3 py-2 text-xs text-gray-300 whitespace-nowrap">
                        {event.amount0
                          ? Number(event.amount0).toLocaleString()
                          : "N/A"}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-300 whitespace-nowrap">
                        {event.amount1
                          ? Number(event.amount1).toLocaleString()
                          : "N/A"}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-300 whitespace-nowrap">
                        {event.liquidity
                          ? Number(event.liquidity).toLocaleString()
                          : "N/A"}
                      </td>
                      <td className="px-3 py-2 text-xs text-cyan-500 whitespace-nowrap">
                        {event.lpCoinId
                          ? `${event.lpCoinId.slice(
                              0,
                              6
                            )}...${event.lpCoinId.slice(-4)}`
                          : "N/A"}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-300 whitespace-nowrap">
                        {event.sender
                          ? `${event.sender.slice(0, 6)}...${event.sender.slice(
                              -4
                            )}`
                          : "N/A"}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-300 whitespace-nowrap">
                        {event.token0Type?.name
                          ? event.token0Type.name.split("::").pop()
                          : "N/A"}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-300 whitespace-nowrap">
                        {event.token1Type?.name
                          ? event.token1Type.name.split("::").pop()
                          : "N/A"}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-300 whitespace-nowrap">
                        {event.totalSupply
                          ? Number(event.totalSupply).toLocaleString()
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-4">
              No remove LP events found
            </div>
          )}
        </div>
      </div> */}
    </>
  );
}
