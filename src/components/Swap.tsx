"use client";

import { useState, useEffect } from "react";
import "@mysten/dapp-kit/dist/index.css";
import SwapTokenSelector from "./swap-token-selector";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { toast } from "react-hot-toast";
import { CONSTANTS } from "../constants/addresses";
import { Settings, AlertCircle } from "lucide-react";

interface Token {
  id: string; // The token ID is a string
  name: string;
  symbol: string;
  decimals: number;
}

// interface ParsedEventJson {
//   pair: string;
//   token0: Token;
//   token1: Token;
// }

const formatTokenAmount = (amount: string, decimals: number) => {
  const formattedAmount = Number(amount) / Math.pow(10, decimals); // Adjust for the token's decimals
  return formattedAmount.toFixed(Math.min(decimals, 6)); // Limit to a maximum of 6 decimal places for display
};

const SwapPage = () => {
  const [amount1, setAmount1] = useState<string>("");
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  // const [checkTrigger, setCheckTrigger] = useState(0);
  // const [amount2, setAmount2] = useState<string>("0.0");
  const [priceRate0, setPriceRate0] = useState<string | null>(null);
  const [priceRate1, setPriceRate1] = useState<string | null>(null);
  const [suggestedAmount1, setSuggestedAmount1] = useState<string | null>(null);
  const [estimatedOutput, setEstimatedOutput] = useState<number | null>(null);
  const [token0, setToken0] = useState<Token | null>(null);
  const [token1, setToken1] = useState<Token | null>(null);
  const [amount0, setAmount0] = useState("");

  //   const [isLoading, setIsLoading] = useState(false);
  const [balance0, setBalance0] = useState("0");
  const [balance1, setBalance1] = useState("0");
  const [pairExists, setPairExists] = useState(false);
  const [currentPairId, setCurrentPairId] = useState<string | null>(null);
  const [reserves, setReserves] = useState({
    reserve0: "0",
    reserve1: "0",
    timestamp: 0,
  });

  // Reset when changing tabs

  // Calculate the suggested liquidity amount based on reserves ratio

  // Reset relevant values when changing tokens
  const handleToken0Change = (newToken: Token | null) => {
    setAmount0("");
    setAmount1("");
    setPriceRate0(null);
    setPriceRate1(null);
    setSuggestedAmount1(null);
    setEstimatedOutput(null);
    setBalance0("0");
    setPairExists(false);
    setCurrentPairId(null);
    setReserves({
      reserve0: "0",
      reserve1: "0",
      timestamp: 0,
    });
    setToken0(newToken);
  };

  const handleToken1Change = (newToken: Token | null) => {
    setAmount0("");
    setAmount1("");
    setPriceRate0(null);
    setPriceRate1(null);
    setSuggestedAmount1(null);
    setEstimatedOutput(null);
    setBalance1("0");
    setPairExists(false);
    setCurrentPairId(null);
    setReserves({
      reserve0: "0",
      reserve1: "0",
      timestamp: 0,
    });
    setToken1(newToken);
  };

  // const [liquidityAmount1, setLiquidityAmount1] = useState("0.0");
  // const [liquidityAmount2, setLiquidityAmount2] = useState("0.0");

  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  useEffect(() => {
    if (!window.suiWallet) {
      console.warn("Sui Wallet is not installed.");
    } else {
      console.log("Sui Wallet is available.");
      window.suiWallet
        .getAccounts()
        .then((accounts) => {
          console.log("Accounts available:", accounts);
        })
        .catch((error) => {
          console.error("Error fetching accounts:", error);
        });
    }
  }, []);

  // Fetch balance for a given token with the token's decimals
  useEffect(() => {
    const fetchBalance = async (
      token: Token | null, // Pass token object that contains decimals
      setBalance: (val: string) => void
    ) => {
      if (!token?.id || !account?.address) return;
      try {
        const coin = await suiClient.getObject({
          id: token.id, // Assuming token's name or ID is the token ID in this case
          options: { showContent: true },
        });

        // Add type guards to check the structure of the response
        if (
          coin.data?.content &&
          "fields" in coin.data.content &&
          typeof coin.data.content.fields === "object" &&
          coin.data.content.fields &&
          "balance" in coin.data.content.fields
        ) {
          const balance = coin.data.content.fields.balance as string;

          // Format the balance with the token's decimals
          setBalance(formatTokenAmount(balance, token.decimals));
        }
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    };

    if (token0) fetchBalance(token0, setBalance0);
    if (token1) fetchBalance(token1, setBalance1);
  }, [token0, token1, account?.address, suiClient]);
  console.log("balance0", balance0);
  console.log("balance1", balance1);
  useEffect(() => {
    const calculateRates = () => {
      if (reserves.reserve0 === "0" || reserves.reserve1 === "0") {
        setPriceRate0(null);
        setPriceRate1(null);
        return;
      }
      // Calculate price rates (1 token0 = X token1 and vice versa)
      const rate0 = (
        Number(reserves.reserve1) / Number(reserves.reserve0)
      ).toFixed(3);
      const rate1 = (
        Number(reserves.reserve0) / Number(reserves.reserve1)
      ).toFixed(3);
      setPriceRate0(rate0);
      setPriceRate1(rate1);
    };
    calculateRates();
  }, [reserves]);
  console.log("priceRate1", priceRate1);
  useEffect(() => {
    const suggestAmount = () => {
      if (amount0 && priceRate0 && reserves.reserve0 !== "0") {
        const suggested = (Number(amount0) * Number(priceRate0)).toFixed(3);
        console.log("Suggested amount:", suggested);
        setSuggestedAmount1(suggested);
        console.log("Suggested amount:", suggestedAmount1);
      } else {
        setSuggestedAmount1(null);
      }
    };

    suggestAmount();
  }, [amount0, priceRate0]);

  // Check pair existence function
  useEffect(() => {
    const checkPairExistence = async () => {
      if (!token0 || !token1) return;
      try {
        console.log("Checking pair existence for tokens:", { token0, token1 });

        const token0Id = token0.id;
        const token1Id = token1.id;

        const [token0Obj, token1Obj] = await Promise.all([
          suiClient.getObject({ id: token0Id, options: { showType: true } }),
          suiClient.getObject({ id: token1Id, options: { showType: true } }),
        ]);

        const getBaseType = (coinType: string) => {
          const match = coinType.match(/<(.+)>/);
          return match ? match[1] : coinType;
        };

        const baseType0 = token0Obj.data?.type
          ? getBaseType(token0Obj.data.type)
          : "";
        const baseType1 = token1Obj.data?.type
          ? getBaseType(token1Obj.data.type)
          : "";

        const tx = new Transaction();
        tx.moveCall({
          target: `${CONSTANTS.PACKAGE_ID}::factory::get_pair`,
          typeArguments: [baseType0, baseType1],
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

              const pairObject = await suiClient.getObject({
                id: pairId,
                options: {
                  showContent: true,
                  showType: true,
                },
              });

              if (
                pairObject.data?.content &&
                "fields" in pairObject.data.content &&
                typeof pairObject.data.content.fields === "object" &&
                pairObject.data.content.fields &&
                "reserve0" in pairObject.data.content.fields &&
                "reserve1" in pairObject.data.content.fields &&
                "block_timestamp_last" in pairObject.data.content.fields
              ) {
                const fields = pairObject.data.content.fields;
                setReserves({
                  reserve0: fields.reserve0 as string,
                  reserve1: fields.reserve1 as string,
                  timestamp: fields.block_timestamp_last as number,
                });
              }
              setPairExists(true);
              setCurrentPairId(pairId);
            } else {
              resetPairState();
            }
          } else {
            resetPairState();
          }
        } else {
          resetPairState();
        }
      } catch (error) {
        console.error("Error during pair check:", error);
        resetPairState();
      }
    };

    checkPairExistence();
  }, [token0, token1, suiClient, account?.address]);

  // Reset pair state helper
  const resetPairState = () => {
    setPairExists(false);
    setCurrentPairId(null);
    setReserves({ reserve0: "0", reserve1: "0", timestamp: 0 });
  };
  const sortTokens = (type0: string, type1: string): [string, string] => {
    if (type0 === type1) {
      throw new Error("Identical tokens");
    }
    const bytes0 = new TextEncoder().encode(type0);
    const bytes1 = new TextEncoder().encode(type1);
    return compareBytes(bytes0, bytes1) ? [type0, type1] : [type1, type0];
  };

  const compareBytes = (a: Uint8Array, b: Uint8Array): boolean => {
    const minLen = Math.min(a.length, b.length);
    for (let i = 0; i < minLen; i++) {
      if (a[i] !== b[i]) {
        return a[i] < b[i];
      }
    }
    return a.length < b.length;
  };

  // Add this new useEffect

  const [error, setError] = useState(null);

  useEffect(() => {
    const calculateEstimatedOutput = async () => {
      if (
        !pairExists ||
        !amount0 ||
        !reserves.reserve0 ||
        !reserves.reserve1 ||
        !token0 ||
        !token1
      ) {
        setEstimatedOutput(null);
        return;
      }
      try {
        const BASIS_POINTS = 10000n;
        const TOTAL_FEE = 30n;
        const scaledAmount0 = BigInt(
          Math.floor(parseFloat(amount0) * Math.pow(10, token0.decimals))
        );
        const reserveIn = BigInt(reserves.reserve0);
        const reserveOut = BigInt(reserves.reserve1);
        if (scaledAmount0 >= reserveIn) {
          throw new Error("Amount exceeds available liquidity");
        }
        const amountInWithFee = scaledAmount0 * (BASIS_POINTS - TOTAL_FEE);
        const numerator = amountInWithFee * reserveOut;
        const denominator = reserveIn * BASIS_POINTS;
        const amountOut = numerator / denominator;
        const scaledOutput = Number(amountOut) / Math.pow(10, token1.decimals);
        setEstimatedOutput(scaledOutput);
        setError(null);
        setAmount1(scaledOutput.toFixed(3));
      } catch (error: any) {
        console.error("Error calculating output:", error);
        setError(error.message);
        setEstimatedOutput(null);
        setAmount1("0.0");
      }
    };

    calculateEstimatedOutput();
  }, [amount0, reserves, token0, token1, pairExists]);
  // const handleSlippageChange = (value: any) => {
  //   setSlippage(value);
  //   setShowSettings(false); // Hide the settings panel after selection
  // };

  const renderSettingsPanel = () => (
    <div className="mb-4 p-4 bg-gray-800/50 rounded-lg">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Slippage Tolerance (%)
      </label>
      <div className="flex gap-2">
        {[0.1, 0.5, 1.0, 5.0].map((value) => (
          <button
            key={value}
            onClick={() => {
              setSlippage(value);
              setShowSettings(false);
            }}
            className={`px-3 py-1 rounded ${
              Number(slippage) === value
                ? "bg-cyan-500 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {value}%
          </button>
        ))}
        <input
          type="text"
          value={slippage === 0 ? "" : slippage}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "") {
              setSlippage(0);
            } else {
              const parsed = parseFloat(value);
              if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
                setSlippage(parsed);
              }
            }
          }}
          className="w-20 px-2 py-1 border rounded bg-gray-700 text-gray-300 border-gray-600"
          placeholder="Custom"
        />
      </div>
    </div>
  );
  const handleSwap = async () => {
    if (!account?.address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!token0 || !token1 || !amount0 || !estimatedOutput || !currentPairId) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSwapLoading(true);
    const toastId = toast.loading("Processing swap...");

    try {
      // === STEP 1: Initial Parameters Logging ===
      console.log("=== INITIAL PARAMETERS ===");
      console.log({
        rawAmountIn: amount0,
        rawAmountOut: amount1,
        tokenInInfo: {
          symbol: token0.symbol,
          decimals: token0.decimals,
          type: token0.id,
        },
        tokenOutInfo: {
          symbol: token1.symbol,
          decimals: token1.decimals,
          type: token1.id,
        },
        reserves: {
          reserve0: reserves.reserve0,
          reserve1: reserves.reserve1,
          timestamp: reserves.timestamp,
        },
        slippage,
      });

      // === STEP 2: Get Token Types ===
      const [token0Obj, token1Obj] = await Promise.all([
        suiClient.getObject({ id: token0.id, options: { showType: true } }),
        suiClient.getObject({ id: token1.id, options: { showType: true } }),
      ]);

      if (!token0Obj?.data?.type || !token1Obj?.data?.type) {
        throw new Error("Failed to retrieve token types");
      }

      const getBaseType = (coinType: string): string => {
        const match = coinType.match(/<(.+)>/);
        return match ? match[1] : coinType;
      };

      const baseType0 = getBaseType(token0Obj.data.type);
      const baseType1 = getBaseType(token1Obj.data.type);

      // === STEP 3: Determine Token Order and Direction ===
      // Get the sorted token types to determine which swap function to use
      const [firstSortedType, secondSortedType] = sortTokens(
        baseType0,
        baseType1
      );
      const isToken0First = baseType0 === firstSortedType;

      // Choose the appropriate swap function based on token order
      const swapFunction = isToken0First
        ? "swap_exact_tokens0_for_tokens1"
        : "swap_exact_tokens1_for_tokens0";

      console.log("=== TOKEN ORDER ===", {
        baseType0,
        baseType1,
        firstSortedType,
        secondSortedType,
        isToken0First,
        swapFunction,
      });

      // === STEP 4: Calculate Amounts ===
      const scaledAmountIn = BigInt(
        Math.floor(parseFloat(amount0) * Math.pow(10, token0.decimals))
      );
      const minAmountOut = BigInt(
        Math.floor(
          estimatedOutput * (1 - slippage / 100) * Math.pow(10, token1.decimals)
        )
      );

      console.log("=== AMOUNTS ===", {
        scaledAmountIn: scaledAmountIn.toString(),
        minAmountOut: minAmountOut.toString(),
        slippage: slippage + "%",
      });

      // === STEP 5: Validate Balance and Get Coins ===
      const coins = await suiClient.getCoins({
        owner: account.address,
        coinType: baseType0,
      });

      const coinToUse = coins.data.find(
        (coin) => BigInt(coin.balance) >= scaledAmountIn
      );
      if (!coinToUse) {
        throw new Error("Insufficient balance");
      }

      // === STEP 6: Setup Transaction ===
      const deadline = Math.floor(Date.now() + 1200000); // 20 minutes
      const swapTx = new Transaction();
      const [splitCoin] = swapTx.splitCoins(
        swapTx.object(coinToUse.coinObjectId),
        [swapTx.pure.u64(scaledAmountIn.toString())]
      );

      console.log("=== TRANSACTION SETUP ===", {
        swapFunction,
        typeArguments: [firstSortedType, secondSortedType], // Use sorted types
        arguments: {
          routerId: CONSTANTS.ROUTER_ID,
          factoryId: CONSTANTS.FACTORY_ID,
          pairId: currentPairId,
          amount: scaledAmountIn.toString(),
          minAmountOut: minAmountOut.toString(),
          deadline,
        },
      });

      // === STEP 7: Execute Transaction ===
      swapTx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::router::${swapFunction}`,
        typeArguments: [firstSortedType, secondSortedType], // Use sorted types in correct order
        arguments: [
          swapTx.object(CONSTANTS.ROUTER_ID),
          swapTx.object(CONSTANTS.FACTORY_ID),
          swapTx.object(currentPairId),
          splitCoin,
          swapTx.pure.u256(minAmountOut.toString()),
          swapTx.pure.u64(deadline),
        ],
      });

      console.log("=== EXECUTING TRANSACTION ===");

      await signAndExecute(
        { transaction: swapTx },
        {
          onSuccess: (result) => {
            console.log("=== TRANSACTION SUCCEEDED ===", result);
            toast.success("Swap completed successfully!", { id: toastId });
            setAmount0("");
            setAmount1("");
          },
          onError: (error) => {
            console.log("=== TRANSACTION FAILED ===", error);
            throw error;
          },
        }
      );
    } catch (error: any) {
      console.error("=== SWAP ERROR ===", error);
      const errorMessage = error.message || "Unknown error";
      // Provide user-friendly error messages
      const userMessage = errorMessage.includes("Insufficient balance")
        ? "Insufficient balance for swap"
        : errorMessage.includes("slippage")
        ? "Price moved too much, try increasing slippage tolerance"
        : `Swap failed: ${errorMessage}`;

      toast.error(userMessage, { id: toastId });
    } finally {
      console.log("=== SWAP COMPLETED ===");
      setIsSwapLoading(false);
    }
  };

  const [isSwapLoading, setIsSwapLoading] = useState(false);

  //
  const handleSwapTokens = () => {
    const tempToken = token0;
    const tempAmount = amount0;
    handleToken0Change(token1);
    setAmount0(amount1);
    handleToken1Change(tempToken);
    setAmount1(tempAmount);
  };

  return (
    <main className="max-w-[480px] mx-auto pt-8 px-4">
      <div className="bg-[#222f3e] bg-opacity-10 backdrop-blur-sm rounded-3xl border border-gray-800 shadow-lg transition-all duration-300 hover:border-gray-700 p-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg text-gray-300 font-semibold">Swap</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-gray-700/50"
            >
              <Settings className="w-5 h-5 text-gray-400" />
            </button>
            <div className="text-sm text-gray-300 bg-gray-800/50 px-3 py-1 rounded-full">
              Slippage:{" "}
              <span className="font-semibold text-cyan-500">{slippage}%</span>
            </div>
          </div>
        </div>
        {showSettings && renderSettingsPanel()}
        {/* Pair Info Card */}
        {token0 && token1 && (
          <div
            className={`p-4 rounded-lg mb-4 ${
              pairExists
                ? "bg-green-500/5 border-green-500/20"
                : "bg-yellow-500/5 border-yellow-500/20"
            } border`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={pairExists ? "text-green-500" : "text-yellow-500"}
                >
                  {pairExists ? "✓" : "⚠"}
                </span>
                <div>
                  <p className="text-sm">
                    {pairExists ? "Trading Pair Active" : "New Trading Pair"}
                  </p>
                  {currentPairId && (
                    <p className="text-xs text-gray-500">
                      ID: {currentPairId?.slice(0, 8)}...
                      {currentPairId?.slice(-6)}
                    </p>
                  )}
                </div>
              </div>
              {pairExists && reserves.reserve0 !== "0" && (
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Pool Reserves</p>
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
              )}
            </div>
          </div>
        )}

        {/* Token Input Section */}
        <div className="space-y-3">
          <div className="space-y-2">
            {/* <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">You Pay</span>
                  <span className="text-gray-400">Balance: {balance0}</span>
                </div> */}
            <SwapTokenSelector
              token0={token0}
              token1={token1}
              amount0={amount0}
              amount1={amount1}
              onSwapTokens={handleSwapTokens}
              onAmount0Change={setAmount0}
              onAmount1Change={setAmount1}
              onToken0Select={handleToken0Change}
              onToken1Select={handleToken1Change}
              showInput={pairExists}
            />
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-500">{error}</span>
              </div>
            )}
            {estimatedOutput && (
              <div className="mt-2 p-3 bg-gray-800/30 rounded-lg space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Minimum received after slippage:</span>
                  <span>
                    {(estimatedOutput * (1 - slippage / 100)).toFixed(3)}{" "}
                    {token1?.symbol}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Swap Button */}
          <button
            onClick={pairExists ? handleSwap : undefined} // Use handleAddLiquidity when pair doesn't exist
            disabled={
              isSwapLoading ||
              !token0 ||
              !token1 ||
              (!pairExists ? false : !amount0 || !amount1) // Only check amounts if pair exists
            }
            className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-cyan-500/25"
          >
            {isSwapLoading ? (
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
                {pairExists ? "Processing Swap..." : "Creating Pair..."}
              </div>
            ) : !pairExists ? (
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Create Pair First
              </div>
            ) : (
              "Swap Tokens"
            )}
          </button>
        </div>
      </div>
    </main>
  );
};

export default SwapPage;
