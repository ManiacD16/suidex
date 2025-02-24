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

interface HistoryData {
  sender: string;
  lpCoinId: string;
  pairId: string;
  transactionHash: string;
  token0Type: { name: string };
  token1Type: { name: string };
  amount0: string;
  amount1: string;
  liquidity: string;
  totalSupply: string;
  timestamp: string;
  type: string;
}

const formatTokenAmount = (amount: string, decimals: number) => {
  const formattedAmount = Number(amount) / Math.pow(10, decimals);
  return formattedAmount.toFixed(6);
};

export default function RemoveLiquidity() {
  const [selectedPercentage, setSelectedPercentage] = useState<number>(100);
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
  const [historyData, setHistoryData] = useState<HistoryData[]>([]);
  const handlePresetClick = (value: number) => {
    setSelectedPercentage(value);
  };
  //   const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  //   const [historyError, setHistoryError] = useState<string | null>(null);

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

  // In RemoveLiquidity.tsx
  // In RemoveLiquidity.tsx
  useEffect(() => {
    if (!currentPairId) return;
    // const pairId = currentPairId;
    const fetchHistory = async () => {
      try {
        const response = await fetch(
          `https://dexback-mu.vercel.app/api/lpcoin/pair/${currentPairId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch history");
        }

        const data = await response.json();
        // If the API returns { data: [...] }, extract the data array
        setHistoryData(Array.isArray(data) ? data : data.data || []);
      } catch (error) {
        console.error("Error fetching history:", error);
        setHistoryData([]); // Set empty array on error
      }
    };

    fetchHistory();
  }, [currentPairId]);

  const sortTokenTypes = (type0: string, type1: string): boolean => {
    const bytes0 = new TextEncoder().encode(type0);
    const bytes1 = new TextEncoder().encode(type1);

    const minLen = Math.min(bytes0.length, bytes1.length);
    for (let i = 0; i < minLen; i++) {
      if (bytes0[i] !== bytes1[i]) {
        return bytes0[i] < bytes1[i];
      }
    }
    return bytes0.length < bytes1.length;
  };

  // Function to find LP tokens

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
          // First check if it's from our package
          if (
            !obj.data?.type ||
            !obj.data.type.includes(CONSTANTS.PACKAGE_ID)
          ) {
            return false;
          }

          // Then check if it's an LP token
          if (!obj.data.type.includes("::pair::LPCoin<")) {
            return false;
          }

          const typeString = obj.data.type;
          const lpTokenTypes = typeString?.match(/LPCoin<(.+),\s*(.+)>/) || [];
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

          // Match with token types
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
        .filter((token) => token !== null)
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

  useEffect(() => {
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
              options: {
                showContent: true,
                showType: true,
              },
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

              // Determine token order in the pair
              // If token0Type is alphabetically first, then reserves match our display order
              // Otherwise, we need to swap reserve0 and reserve1
              const isToken0First = sortTokenTypes(token0Type, token1Type);

              setReserves({
                reserve0: isToken0First ? fields.reserve0 : fields.reserve1,
                reserve1: isToken0First ? fields.reserve1 : fields.reserve0,
                timestamp: Number(fields.block_timestamp_last) || 0,
              });

              console.log("Pool reserves mapping:", {
                token0Type,
                token1Type,
                isToken0First,
                pairReserve0: fields.reserve0,
                pairReserve1: fields.reserve1,
                displayReserve0: isToken0First
                  ? fields.reserve0
                  : fields.reserve1,
                displayReserve1: isToken0First
                  ? fields.reserve1
                  : fields.reserve0,
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
      // Filter for LP tokens from our program
      const latestProgramLP = lpBalances.filter((coin) =>
        coin.type.includes(CONSTANTS.PACKAGE_ID)
      );

      if (latestProgramLP.length === 0) {
        throw new Error("No LP tokens found for this program");
      }

      // Sort coins by balance (largest first)
      const sortedCoins = [...latestProgramLP].sort((a, b) => {
        const balanceA = BigInt(a.balance || "0");
        const balanceB = BigInt(b.balance || "0");
        return Number(balanceB - balanceA);
      });

      // Calculate total available LP
      const totalAvailableLp = latestProgramLP.reduce(
        (sum, coin) => sum + BigInt(coin.balance || "0"),
        0n
      );

      // Enhanced percentage handling
      let targetAmount: bigint;
      if (selectedPercentage === 100) {
        targetAmount = totalAvailableLp;
      } else {
        targetAmount = (totalAvailableLp * BigInt(selectedPercentage)) / 100n;
      }

      if (targetAmount === 0n || targetAmount > totalAvailableLp) {
        toast.error("Invalid amount to remove");
        return;
      }

      const tx = new Transaction();
      const biggestCoin = sortedCoins[0];
      const biggestCoinBalance = BigInt(biggestCoin.balance || "0");

      console.log("Initial LP Details:", {
        totalAvailable: totalAvailableLp.toString(),
        targetAmount: targetAmount.toString(),
        selectedPercentage,
        biggestCoinBalance: biggestCoinBalance.toString(),
      });

      let coinToUse;
      let burnAmount;

      // Simplified coin handling strategy
      if (biggestCoinBalance >= targetAmount) {
        console.log("Using single coin strategy");
        const primaryCoinObject = tx.object(biggestCoin.id);

        if (selectedPercentage === 100) {
          coinToUse = primaryCoinObject;
        } else {
          coinToUse = tx.splitCoins(primaryCoinObject, [
            tx.pure.u64(targetAmount.toString()),
          ]);
        }
        burnAmount = targetAmount;
      } else {
        console.log("Using merge strategy");
        let remainingTarget = targetAmount;
        const coinsNeeded = [];

        for (const coin of sortedCoins) {
          if (remainingTarget <= 0n) break;
          const coinBalance = BigInt(coin.balance || "0");
          coinsNeeded.push(coin.id);
          remainingTarget -= coinBalance;
        }

        if (remainingTarget > 0n) {
          throw new Error("Not enough LP tokens to reach target amount");
        }

        const primaryCoin = tx.object(coinsNeeded[0]);
        if (coinsNeeded.length > 1) {
          const otherCoins = coinsNeeded.slice(1).map((id) => tx.object(id));
          tx.mergeCoins(primaryCoin, otherCoins);
        }
        coinToUse = primaryCoin;
        burnAmount = targetAmount;
      }

      const vectorArg = tx.makeMoveVec({
        elements: [coinToUse],
      });

      if (!currentPairId) {
        throw new Error("No valid liquidity pair found.");
      }

      // Get LP token types first - we'll use this to get the correct order
      const response = await suiClient.getObject({
        id: biggestCoin.id,
        options: { showType: true },
      });

      if (!response?.data?.type) {
        throw new Error("Failed to retrieve LP token type.");
      }

      const lpTokenTypes = response.data.type.match(/LPCoin<(.+),\s*(.+)>/);
      if (!lpTokenTypes) {
        throw new Error("Invalid LP token format.");
      }

      let [, type0, type1] = lpTokenTypes;
      type0 = getBaseType(type0.trim());
      type1 = getBaseType(type1.trim().replace(">", ""));

      // Set minimum amount to zero to avoid ERR_INSUFFICIENT_B_AMOUNT (303)
      // This is safe because the actual amounts are calculated by the contract
      const minAmount0 = "0";
      const minAmount1 = "0";

      // Set deadline in milliseconds (not seconds)
      const currentTimestamp = Date.now();
      const deadline = currentTimestamp + 10 * 60 * 1000; // 10 minutes in milliseconds

      console.log("Transaction params:", {
        currentTimestampMs: currentTimestamp,
        deadlineMs: deadline,
        burnAmount: burnAmount.toString(),
        minAmount0,
        minAmount1,
        type0,
        type1,
      });

      tx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.ROUTER}::remove_liquidity`,
        typeArguments: [type0, type1],
        arguments: [
          tx.object(CONSTANTS.ROUTER_ID),
          tx.object(CONSTANTS.FACTORY_ID),
          tx.object(currentPairId),
          vectorArg,
          tx.pure.u256(burnAmount.toString()),
          tx.pure.u256(minAmount0),
          tx.pure.u256(minAmount1),
          tx.pure.u64(deadline),
        ],
      });

      console.log("Simulating LP removal...");
      const simulationResult = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: account.address,
      });

      console.group("📊 Simulation Results");
      console.log("Effects:", simulationResult.effects);
      if (simulationResult.effects?.status?.error) {
        throw new Error(
          `Simulation Error: ${simulationResult.effects.status.error}`
        );
      }
      console.groupEnd();

      await signAndExecute(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            console.log("Success:", result);
            toast.update(toastId, {
              render: "LP removed successfully!",
              type: "success",
              isLoading: false,
              autoClose: 5000,
            });

            await findLPTokens();

            // resetState();
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
                {/* Desktop/Large Screen Layout */}
                <div className="hidden md:block">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <div>
                        <p className="text-sm text-gray-300">
                          Trading Pair Active
                        </p>
                        <p className="text-xs text-gray-500">
                          ID: {currentPairId.slice(0, 8)}...
                          {currentPairId.slice(-6)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">
                        Pool Reserves
                      </p>
                      <p className="text-sm">
                        {token0
                          ? (
                              Number(reserves.reserve0) /
                              Math.pow(10, token0.decimals)
                            ).toFixed(3)
                          : "0"}{" "}
                        /{" "}
                        {token1
                          ? (
                              Number(reserves.reserve1) /
                              Math.pow(10, token1.decimals)
                            ).toFixed(3)
                          : "0"}
                      </p>
                    </div>
                  </div>
                  <div className="text-cyan-500 font-medium mt-3 text-center">
                    LP Balance: {formatTokenAmount(selectedLpBalance, 9)}
                  </div>
                </div>

                {/* Mobile/Small Screen Layout */}
                <div className="md:hidden">
                  <div className="text-sm text-gray-300">
                    ID: {currentPairId.slice(0, 8)}...{currentPairId.slice(-6)}
                  </div>
                  <div className="text-cyan-500 font-medium mt-1">
                    LP Balance: {formatTokenAmount(selectedLpBalance, 9)}
                  </div>
                  <div className="mt-2 text-sm text-gray-400">
                    Pool Reserves:
                    <div>{`${token0?.symbol}: ${
                      token0
                        ? (
                            Number(reserves.reserve0) /
                            Math.pow(10, token0.decimals)
                          ).toFixed(3)
                        : "0"
                    }`}</div>
                    <div>{`${token1?.symbol}: ${
                      token1
                        ? (
                            Number(reserves.reserve1) /
                            Math.pow(10, token1.decimals)
                          ).toFixed(3)
                        : "0"
                    }`}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex flex-1 lg:flex-row space-x-2 flex-col justify-between">
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
              </div>
              <div className="bg-zinc-900/40 p-8 rounded-3xl max-w-md mx-auto">
                <div className="mb-8">
                  <span className="text-white text-6xl font-bold">
                    {selectedPercentage}%
                  </span>
                </div>

                <div className="relative mb-8 ">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedPercentage}
                    onChange={(e) =>
                      setSelectedPercentage(Number(e.target.value))
                    }
                    className="w-full appearance-none bg-transparent cursor-pointer 
      [&::-webkit-slider-runnable-track]:rounded-full 
      [&::-webkit-slider-runnable-track]:h-2 
      [&::-webkit-slider-thumb]:appearance-none 
      [&::-webkit-slider-thumb]:-mt-2.5 
      [&::-webkit-slider-thumb]:h-6 
      [&::-webkit-slider-thumb]:w-6 
      [&::-webkit-slider-thumb]:rounded-full 
      [&::-webkit-slider-thumb]:bg-[url('/Trump.png')] 
      [&::-webkit-slider-thumb]:bg-[length:24px] 
      [&::-webkit-slider-thumb]:bg-no-repeat 
      [&::-webkit-slider-thumb]:bg-center"
                    style={{
                      background: ` linear-gradient(to right, rgb(39, 39, 42) 0%, rgb(39, 39, 42) ${selectedPercentage}%, rgb(255, 255, 255) ${selectedPercentage}%, rgb(255, 255, 255) 100%)`,
                      borderRadius: "9999px",
                    }}
                  />
                </div>

                <div className=" flex items-center justify-center mb-4">
                  <div className="relative lg:w-1/4 md:w-1/3 w-1/2">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={selectedPercentage || ""}
                      onChange={(e) => {
                        const value =
                          e.target.value === "" ? 1 : Number(e.target.value);
                        if (value >= 1 && value <= 100) {
                          setSelectedPercentage(value);
                        }
                      }}
                      className="w-full px-3 py-2 bg-[#2c2d3a] text-white rounded-lg border border-gray-700 focus:outline-none focus:border-purple-500"
                    />

                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      %
                    </span>
                  </div>
                </div>
                <div className="flex justify-between gap-4">
                  {[25, 50, 75, 100].map((value) => (
                    <button
                      key={value}
                      onClick={() => handlePresetClick(value)}
                      className="bg-zinc-800/50 text-teal-300 hover:bg-zinc-800 hover:text-teal-200 rounded-full px-4 py-2 flex-1"
                    >
                      {value === 100 ? "Max" : `${value}%`}
                    </button>
                  ))}
                </div>
              </div>
              {/* <div className="text-center text-gray-300 mb-4">
                Selected Percentage: {selectedPercentage}%
              </div> */}
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
      {/* Transaction History Table */}
      {currentPairId && (
        <div className="mt-6 p-4 ml-4 mr-4 bg-[#1f2028] rounded-2xl border border-[#8b7bef]/50 shadow-md">
          <h2 className="text-lg font-semibold text-white mb-3">
            Transaction History
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-white">
              <thead>
                <tr className="text-left text-sm text-[#b794f4]">
                  <th className="p-3">LP Coin ID</th>
                  <th className="p-3">Pair ID</th>
                  <th className="p-3">Tx Digest</th>
                  <th className="p-3">Token 0</th>
                  <th className="p-3">Token 1</th>
                  <th className="p-3">Amount 0</th>
                  <th className="p-3">Amount 1</th>
                  <th className="p-3">Total Supply</th>
                  <th className="p-3">Liquidity</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Sender</th>
                </tr>
              </thead>
              <tbody>
                {historyData.map((entry, index) => (
                  <tr
                    key={index}
                    className="border-t border-[#4a5568] hover:bg-[#2c2d3a]/50 transition"
                  >
                    <td className="p-3">
                      {entry.lpCoinId.slice(0, 6)}...
                      {entry.lpCoinId.slice(-4)}
                    </td>
                    <td className="p-3">
                      {entry.pairId.slice(0, 6)}...
                      {entry.pairId.slice(-4)}
                    </td>
                    <td className="p-3">
                      {entry.transactionHash.slice(0, 6)}...
                      {entry.transactionHash.slice(-4)}
                    </td>
                    <td className="p-3">
                      {entry.token0Type.name.split("::").pop()}
                    </td>
                    <td className="p-3">
                      {entry.token1Type.name.split("::").pop()}
                    </td>
                    <td className="p-3">
                      {Number(entry.amount0).toLocaleString()}
                    </td>
                    <td className="p-3">
                      {Number(entry.amount1).toLocaleString()}
                    </td>
                    <td className="p-3">
                      {Number(entry.totalSupply).toLocaleString()}
                    </td>
                    <td className="p-3">
                      {Number(entry.liquidity).toLocaleString()}
                    </td>
                    <td className="p-3">{entry.type.split("::").pop()}</td>
                    <td className="p-3">
                      {entry.sender.slice(0, 6)}...{entry.sender.slice(-4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
