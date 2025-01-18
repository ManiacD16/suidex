"use client";

import { useState, useEffect } from "react";
import "@mysten/dapp-kit/dist/index.css";
import SwapTokenSelector from "./swap-token-selector";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import TokenSelector from "./token-selector";
import { Transaction } from "@mysten/sui/transactions";
import { toast } from "react-hot-toast";
import { CONSTANTS } from "../constants/addresses";
import { Settings } from "lucide-react";

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

export default function MainCon() {
  const [activeTab, setActiveTab] = useState<string>("exchange");
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

  const [isLoading, setIsLoading] = useState(false);
  const [balance0, setBalance0] = useState("0");
  const [balance1, setBalance1] = useState("0");
  const [pairExists, setPairExists] = useState(false);
  const [currentPairId, setCurrentPairId] = useState<string | null>(null);
  const [reserves, setReserves] = useState({
    reserve0: "0",
    reserve1: "0",
    timestamp: 0,
  });

  const resetAllValues = () => {
    setAmount0("");
    setAmount1("");
    setPriceRate0(null);
    setPriceRate1(null);
    setSuggestedAmount1(null);
    setEstimatedOutput(null);
    setToken0(null);
    setToken1(null);
    setBalance0("0");
    setBalance1("0");
    setPairExists(false);
    setCurrentPairId(null);
    setReserves({
      reserve0: "0",
      reserve1: "0",
      timestamp: 0,
    });
  };

  // Reset when changing tabs
  const handleTabChange = (tab: string) => {
    resetAllValues();
    setActiveTab(tab);
  };

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
        // Extract the IDs of token0 and token1
        const token0Id = token0.id;
        const token1Id = token1.id;

        // Get token types and decimals
        const [token0Obj, token1Obj] = await Promise.all([
          suiClient.getObject({ id: token0Id, options: { showType: true } }),
          suiClient.getObject({ id: token1Id, options: { showType: true } }),
        ]);

        if (!token0Obj?.data || !token1Obj?.data) {
          throw new Error("Failed to retrieve token data");
        }

        const getBaseType = (coinType: string | null | undefined): string => {
          if (!coinType) {
            throw new Error("Coin type is undefined or null");
          }
          const match = coinType.match(/<(.+)>/);
          return match ? match[1] : coinType;
        };

        const baseType0 = getBaseType(token0Obj.data.type);
        const baseType1 = getBaseType(token1Obj.data.type);

        // Retrieve decimals for token0 and token1
        const getTokenDecimals = (tokenObj: any): number => {
          return tokenObj?.data?.decimals || 9; // Default to 9 decimals if not found
        };

        const decimals0 = getTokenDecimals(token0Obj);
        const decimals1 = getTokenDecimals(token1Obj);

        // Check if the input token is the first token in the sorted pair
        const [firstSortedType] = sortTokens(baseType0, baseType1);
        const isToken0First = baseType0 === firstSortedType;

        // Calculate amount0 in the smallest unit (based on token0 decimals)
        const amount0Value = Math.floor(
          parseFloat(amount0) * Math.pow(10, decimals0)
        );

        // Use reserves in the correct order based on token positions
        const reserveIn = BigInt(
          isToken0First ? reserves.reserve0 : reserves.reserve1
        );
        const reserveOut = BigInt(
          isToken0First ? reserves.reserve1 : reserves.reserve0
        );

        // Calculate swap output using the formula:
        // amountOut = (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)
        const amountInWithFee = BigInt(amount0Value) * 997n;
        const numerator = amountInWithFee * reserveOut;
        const denominator = reserveIn * 1000n + amountInWithFee;
        const amountOut = numerator / denominator;

        // Set estimated output with proper decimal formatting
        setEstimatedOutput(Number(amountOut) / Math.pow(10, decimals1)); // Adjust to token1's decimals
        setAmount1((Number(amountOut) / Math.pow(10, decimals1)).toFixed(3)); // Limit to 6 decimals
      } catch (error) {
        console.error("Error calculating output:", error);
        setEstimatedOutput(null);
        setAmount1("0.0");
      }
    };

    calculateEstimatedOutput();
  }, [amount0, reserves, pairExists, token0, token1, suiClient]);

  const handleSlippageChange = (value: any) => {
    setSlippage(value);
    setShowSettings(false); // Hide the settings panel after selection
  };

  const renderSettingsPanel = () => (
    <div className="mb-4 p-4 bg-gray-800/50 rounded-lg">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Slippage Tolerance (%)
      </label>
      <div className="flex gap-2">
        {[0.1, 0.5, 1.0, 5.0].map((value) => (
          <button
            key={value}
            onClick={() => handleSlippageChange(value)}
            className={`px-3 py-1 rounded ${
              slippage === value
                ? "bg-cyan-500 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {value}%
          </button>
        ))}
        <input
          type="number"
          value={slippage}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (value >= 0 && value <= 100) setSlippage(value);
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
      const token0Id = typeof token0 === "string" ? token0 : token0.id;
      const token1Id = typeof token1 === "string" ? token1 : token1.id;

      const [token0Obj, token1Obj] = await Promise.all([
        suiClient.getObject({ id: token0Id, options: { showType: true } }),
        suiClient.getObject({ id: token1Id, options: { showType: true } }),
      ]);

      if (!token0Obj?.data || !token1Obj?.data) {
        throw new Error("Failed to retrieve token data");
      }

      const getBaseType = (coinType: string | null | undefined): string => {
        if (!coinType) throw new Error("Coin type is undefined or null");
        const match = coinType.match(/<(.+)>/);
        return match ? match[1] : coinType;
      };

      const baseType0 = getBaseType(token0Obj.data.type);
      const baseType1 = getBaseType(token1Obj.data.type);

      // Get token decimals
      const decimals0 = token0.decimals;
      const decimals1 = token1.decimals;

      // Calculate amounts with slippage
      const amountInValue = BigInt(
        Math.floor(parseFloat(amount0) * Math.pow(10, decimals0))
      );
      const minAmountOut = BigInt(
        Math.floor(
          estimatedOutput * (1 - slippage / 100) * Math.pow(10, decimals1)
        )
      );

      const coins = await suiClient.getCoins({
        owner: account.address,
        coinType: baseType0,
      });

      const coinToUse = coins.data.find(
        (coin) => BigInt(coin.balance) >= amountInValue
      );
      if (!coinToUse) throw new Error("Insufficient balance");

      const swapTx = new Transaction();
      const [splitCoin] = swapTx.splitCoins(
        swapTx.object(coinToUse.coinObjectId),
        [swapTx.pure.u64(amountInValue.toString())]
      );

      const deadline = Math.floor(Date.now() + 1200000); // 20 minutes

      swapTx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::router::swap_exact_tokens_for_tokens`,
        typeArguments: [baseType0, baseType1],
        arguments: [
          swapTx.object(CONSTANTS.ROUTER_ID),
          swapTx.object(CONSTANTS.FACTORY_ID),
          swapTx.object(currentPairId),
          splitCoin,
          swapTx.pure.u256(minAmountOut.toString()),
          swapTx.pure.u64(deadline),
        ],
      });

      await signAndExecute(
        { transaction: swapTx },
        {
          onSuccess: (result) => {
            console.log("Swap successful:", result);
            toast.success("Swap completed successfully!", { id: toastId });
            setAmount0("");
            setAmount1("");
          },
          onError: (error) => {
            console.error("Swap failed:", error);
            throw error;
          },
        }
      );
    } catch (error: any) {
      console.error("Swap failed:", error);
      toast.error(`Swap failed: ${error.message}`, { id: toastId });
    } finally {
      setIsSwapLoading(false);
    }
  };
  // const [checkTrigger, setCheckTrigger] = useState(0);

  // Helper function to wait
  // const delay = (ms: number) =>
  //   new Promise((resolve) => setTimeout(resolve, ms));
  // Helper function to wait
  // const delay = (ms: number) =>
  //   new Promise((resolve) => setTimeout(resolve, ms));

  // Modified retryQueryEvent function
  // const retryQueryEvent = async (
  //   sortedType0: string,
  //   sortedType1: string,
  //   maxRetries = 3
  // ) => {
  //   let retryCount = 0;

  //   while (retryCount < maxRetries) {
  //     try {
  //       await delay(1000 * (retryCount + 1));

  //       // Query for pair without using digest
  //       let newPairEvent = await suiClient.queryEvents({
  //         query: {
  //           MoveEventType: `${CONSTANTS.PACKAGE_ID}::factory::PairCreated`,
  //         },
  //       });

  //       if (newPairEvent.data && newPairEvent.data.length > 0) {
  //         // Try to find the matching pair for our token types
  //         const matchingEvent = newPairEvent.data.find((event) => {
  //           const eventData = event.parsedJson as any;
  //           return (
  //             eventData?.token0?.type === sortedType0 &&
  //             eventData?.token1?.type === sortedType1
  //           );
  //         });

  //         if (matchingEvent) {
  //           console.log("Found matching pair event:", matchingEvent);
  //           return { data: [matchingEvent] };
  //         }
  //       }

  //       retryCount++;
  //       console.log(`Retry attempt ${retryCount} of ${maxRetries}`);
  //       await delay(1000); // Wait before next retry
  //     } catch (error) {
  //       console.error(
  //         `Error during event query attempt ${retryCount + 1}:`,
  //         error
  //       );
  //       if (retryCount === maxRetries - 1) {
  //         throw error;
  //       }
  //       retryCount++;
  //     }
  //   }

  //   throw new Error("Failed to retrieve pair creation event after retries");
  // };

  // Modified handleCreatePair function
  const handleCreatePair = async () => {
    if (!account?.address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!token0 || !token1) {
      toast.error("Please select both tokens");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Creating new pair...");

    try {
      // Get token objects
      const token0Id = typeof token0 === "string" ? token0 : token0.id;
      const token1Id = typeof token1 === "string" ? token1 : token1.id;

      const [token0Obj, token1Obj] = await Promise.all([
        suiClient.getObject({ id: token0Id, options: { showType: true } }),
        suiClient.getObject({ id: token1Id, options: { showType: true } }),
      ]);

      if (!token0Obj?.data?.type || !token1Obj?.data?.type) {
        throw new Error("Invalid token types");
      }

      // Get base types
      const getBaseType = (coinType: string) => {
        const match = coinType.match(/<(.+)>/);
        return match ? match[1] : coinType;
      };

      const baseType0 = getBaseType(token0Obj.data.type);
      const baseType1 = getBaseType(token1Obj.data.type);

      // Sort token types
      const [sortedType0, sortedType1] = sortTokens(baseType0, baseType1);

      // Create the pair transaction
      const tx = new Transaction();
      tx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.ROUTER}::create_pair`,
        arguments: [
          tx.object(CONSTANTS.ROUTER_ID),
          tx.object(CONSTANTS.FACTORY_ID),
          tx.pure.string(sortedType0.split("::").pop() || ""),
          tx.pure.string(sortedType1.split("::").pop() || ""),
        ],
        typeArguments: [sortedType0, sortedType1],
      });

      // Execute the transaction
      await signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            toast.success("Pair creation successful!", { id: toastId });
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          },
          onError: (error) => {
            if (error.message.includes("308")) {
              toast.error("This pair already exists", { id: toastId });
            } else {
              toast.error(`Failed to create pair: ${error.message}`, {
                id: toastId,
              });
            }
          },
        }
      );
    } catch (error: any) {
      console.error("Pair creation failed:", error);
      let errorMessage = error.message || "Unknown error";

      if (errorMessage.includes("308")) {
        errorMessage = "Trading pair already exists";
      }
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };
  // Function to add liquidity (requires amounts and existing pair)
  const handleAddLiquidity = async () => {
    if (!account?.address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!token0 || !token1 || !amount0 || !amount1 || !currentPairId) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Adding liquidity...");

    try {
      // Get token IDs correctly depending on whether token0/token1 are strings or Token objects
      const token0Id = typeof token0 === "string" ? token0 : token0?.id;
      const token1Id = typeof token1 === "string" ? token1 : token1?.id;

      if (!token0Id || !token1Id) {
        throw new Error("Token IDs are missing or invalid");
      }

      const [token0Obj, token1Obj] = await Promise.all([
        suiClient.getObject({ id: token0Id, options: { showType: true } }),
        suiClient.getObject({ id: token1Id, options: { showType: true } }),
      ]);

      if (!token0Obj?.data || !token1Obj?.data) {
        throw new Error("Failed to retrieve token data");
      }

      const getBaseType = (coinType: string | null | undefined): string => {
        if (!coinType) {
          throw new Error("Coin type is undefined or null");
        }
        const match = coinType.match(/<(.+)>/);
        return match ? match[1] : coinType;
      };

      const baseType0 = getBaseType(token0Obj.data.type);
      const baseType1 = getBaseType(token1Obj.data.type);

      const [sortedType0, sortedType1] = sortTokens(baseType0, baseType1);

      // Get token decimals
      const getTokenDecimals = (tokenObj: any): number => {
        if (
          tokenObj?.data?.content &&
          "fields" in tokenObj.data.content &&
          typeof tokenObj.data.content.fields === "object" &&
          tokenObj.data.content.fields &&
          "decimals" in tokenObj.data.content.fields
        ) {
          return Number(tokenObj.data.content.fields.decimals);
        }
        return 9; // Default to 9 decimals if not found
      };

      const decimals0 = getTokenDecimals(token0Obj);
      const decimals1 = getTokenDecimals(token1Obj);

      // Calculate amounts with proper decimal handling
      const amount0Value = Math.floor(
        parseFloat(amount0) * Math.pow(10, decimals0)
      );
      const amount1Value = Math.floor(
        parseFloat(amount1) * Math.pow(10, decimals1)
      );

      // Check balances
      const [coins0, coins1] = await Promise.all([
        suiClient.getCoins({ owner: account.address, coinType: sortedType0 }),
        suiClient.getCoins({ owner: account.address, coinType: sortedType1 }),
      ]);

      const coinToSplit0 = coins0.data.find(
        (coin) => BigInt(coin.balance) >= BigInt(amount0Value)
      );
      const coinToSplit1 = coins1.data.find(
        (coin) => BigInt(coin.balance) >= BigInt(amount1Value)
      );

      if (!coinToSplit0 || !coinToSplit1) {
        throw new Error("Insufficient balance");
      }

      const addLiquidityTx = new Transaction();
      const [splitCoin0] = addLiquidityTx.splitCoins(
        addLiquidityTx.object(coinToSplit0.coinObjectId),
        [addLiquidityTx.pure.u64(amount0Value)]
      );
      const [splitCoin1] = addLiquidityTx.splitCoins(
        addLiquidityTx.object(coinToSplit1.coinObjectId),
        [addLiquidityTx.pure.u64(amount1Value)]
      );

      const deadline = Math.floor(Date.now() + 1200000); // 20 minutes
      const minAmount0 = (BigInt(amount0Value) * 95n) / 100n; // 5% slippage
      const minAmount1 = (BigInt(amount1Value) * 95n) / 100n;

      addLiquidityTx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.ROUTER}::add_liquidity`,
        arguments: [
          addLiquidityTx.object(CONSTANTS.ROUTER_ID),
          addLiquidityTx.object(CONSTANTS.FACTORY_ID),
          addLiquidityTx.object(currentPairId),
          splitCoin0,
          splitCoin1,
          addLiquidityTx.pure.u256(amount0Value.toString()),
          addLiquidityTx.pure.u256(amount1Value.toString()),
          addLiquidityTx.pure.u256(minAmount0.toString()),
          addLiquidityTx.pure.u256(minAmount1.toString()),
          addLiquidityTx.pure.string(sortedType0.split("::").pop() || ""),
          addLiquidityTx.pure.string(sortedType1.split("::").pop() || ""),
          addLiquidityTx.pure.u64(deadline),
        ],
        typeArguments: [sortedType0, sortedType1],
      });

      await signAndExecute(
        { transaction: addLiquidityTx },
        {
          onSuccess: async (result) => {
            console.log("Liquidity addition successful:", result);

            // Refresh the reserves and rates
            try {
              const pairObject = await suiClient.getObject({
                id: currentPairId,
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

                // Update reserves
                setReserves({
                  reserve0: fields.reserve0 as string,
                  reserve1: fields.reserve1 as string,
                  timestamp: fields.block_timestamp_last as number,
                });

                // Calculate and update price rates
                const rate0 = (
                  Number(fields.reserve1) / Number(fields.reserve0)
                ).toFixed(3);
                const rate1 = (
                  Number(fields.reserve0) / Number(fields.reserve1)
                ).toFixed(3);
                setPriceRate0(rate0);
                setPriceRate1(rate1);
              }
            } catch (error) {
              console.error("Error refreshing reserves:", error);
            }

            // Clear inputs and show success message
            setAmount0("");
            setAmount1("");
            toast.success("Liquidity added successfully!", { id: toastId });
          },
          onError: (error) => {
            console.error("Transaction error:", error);
            throw error;
          },
        }
      );
    } catch (error: any) {
      console.error("Transaction failed:", error);
      let errorMessage = error.message || "Unknown error";

      if (errorMessage.includes("Insufficient balance")) {
        errorMessage = "Insufficient balance to complete the transaction";
      }

      toast.error("Failed to add liquidity: " + errorMessage, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };
  // Combined function to handle both operations when needed
  // const handleCreatePairAndAddLiquidity = async () => {
  //   try {
  //     // First create the pair
  //     const pairId = await handleCreatePair();
  //     if (pairId) {
  //       // Then add liquidity
  //       await handleAddLiquidity();
  //     }
  //   } catch (error) {
  //     console.error("Create pair and add liquidity failed:", error);
  //   }
  // };

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSwapLoading, setIsSwapLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleSwapTokens = () => {
    const tempToken = token0;
    const tempAmount = amount0;
    handleToken0Change(token1);
    setAmount0(amount1);
    handleToken1Change(tempToken);
    setAmount1(tempAmount);
  };

  return (
    <>
      {/* Main Content */}
      <main className="max-w-[480px] mx-auto pt-8 px-4">
        {/* Tab Navigation */}
        <div className="mb-6 border rounded-2xl border-gray-800/50 backdrop-blur-sm relative bg-gradient-to-r from-gray-900/50 to-gray-800/50 p-1.5 shadow-lg">
          <div className="relative flex items-center justify-center w-full">
            {/* Background highlight for active tab */}
            <div
              className={`absolute h-full top-0 w-1/2 transition-all duration-300 ease-out rounded-xl bg-gradient-to-r from-cyan-500/10 to-cyan-400/5
            ${activeTab === "exchange" ? "left-0" : "left-1/2"}`}
            />

            {/* Tabs */}
            <div className="flex items-center justify-between w-full">
              {["exchange", "liquidity"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`relative w-1/2 py-2 px-6 text-base font-medium transition-all duration-300 group
                ${
                  activeTab === tab
                    ? "text-cyan-500"
                    : "text-gray-400 hover:text-gray-300"
                }`}
                >
                  {/* Tab text with hover effect */}
                  <span className="relative z-10 transition-transform duration-200 group-hover:transform group-hover:scale-105 inline-block">
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </span>

                  {/* Active indicator line */}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 flex flex-col items-center">
                      <span className="h-0.5 w-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full animate-expandWidth" />
                      <span className="h-1 w-1 bg-cyan-500 rounded-full mt-0.5 animate-pulse" />
                    </div>
                  )}

                  {/* Hover glow effect */}
                  <div
                    className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg
                  ${activeTab === tab ? "bg-cyan-500/5" : "bg-gray-500/5"}`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute -left-1 -top-1 w-2 h-2 bg-cyan-500/20 rounded-full animate-pulse" />
          <div className="absolute -right-1 -bottom-1 w-2 h-2 bg-cyan-500/20 rounded-full animate-pulse delay-150" />
        </div>

        {/* Content Area with Loading States */}
        {isInitialLoading ? (
          // Skeleton Loading State
          <div className="bg-[#222f3e] bg-opacity-10 backdrop-blur-sm rounded-3xl border border-gray-800 shadow-lg transition-all duration-300 hover:border-gray-700 p-4">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-700/50 bg-opacity-10 backdrop-blur-sm rounded-xl  w-1/4" />
              <div className="h-14 bg-gray-700/50 bg-opacity-10 backdrop-blur-sm rounded-xl" />
              <div className="h-10 bg-gray-700/50 bg-opacity-10 backdrop-blur-sm rounded-xl w-1/2 mx-auto" />
              <div className="h-14 bg-gray-700/50 bg-opacity-10 backdrop-blur-sm rounded-xl" />
              <div className="h-12 bg-gray-700/50 bg-opacity-10 backdrop-blur-sm rounded-xl" />
            </div>
          </div>
        ) : activeTab === "exchange" ? (
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
                  <span className="font-semibold text-cyan-500">
                    {slippage}%
                  </span>
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
                      className={
                        pairExists ? "text-green-500" : "text-yellow-500"
                      }
                    >
                      {pairExists ? "✓" : "⚠"}
                    </span>
                    <div>
                      <p className="text-sm">
                        {pairExists
                          ? "Trading Pair Active"
                          : "New Trading Pair"}
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
                onClick={pairExists ? handleSwap : handleCreatePair} // Use handleAddLiquidity when pair doesn't exist
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
                    Create Trading Pair
                  </div>
                ) : (
                  "Swap Tokens"
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#222f3e] bg-opacity-10 backdrop-blur-sm rounded-3xl border border-gray-800 shadow-lg transition-all duration-300 hover:border-gray-700">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg text-gray-300 font-semibold">
                  Add Liquidity
                </span>
                {token0 && token1 && (
                  <div
                    className={`px-3 py-2 rounded-lg text-sm ${
                      pairExists
                        ? "bg-green-500/10 text-green-500"
                        : "bg-yellow-500/10 text-yellow-500"
                    }`}
                  >
                    {pairExists ? "✓ Pair Exists" : "⚠ New Pair"}
                  </div>
                )}
              </div>

              {token0 && token1 && (
                <div
                  className={`p-4 rounded-lg mb-4 ${
                    pairExists ? "bg-green-500/5" : "bg-yellow-500/5"
                  } border ${
                    pairExists ? "border-green-500/20" : "border-yellow-500/20"
                  }`}
                >
                  {pairExists ? (
                    <>
                      <div className="text-sm text-gray-300">{`Pair ID: ${currentPairId?.slice(
                        0,
                        8
                      )}...`}</div>
                      <div className="text-sm text-gray-400 mt-1">
                        {" "}
                        {`Reserves: ${
                          token0
                            ? (
                                Number(reserves.reserve0) /
                                Math.pow(10, token0.decimals)
                              ).toFixed(3)
                            : "0"
                        } - ${
                          token1
                            ? (
                                Number(reserves.reserve1) /
                                Math.pow(10, token1.decimals)
                              ).toFixed(3)
                            : "0"
                        }`}
                      </div>
                      {priceRate0 && priceRate1 && (
                        <div className="mt-2 text-sm text-gray-400">
                          <div>{`1 Token0 = ${priceRate0} Token1`}</div>
                          <div>{`1 Token1 = ${priceRate1} Token0`}</div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-yellow-500">
                      New trading pair will be created
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs sm:text-sm text-gray-400">
                      First Token
                    </label>
                    <span className="text-xs sm:text-sm text-gray-400">
                      Balance: {balance0}
                    </span>
                  </div>
                  <TokenSelector
                    label="Token 0"
                    onSelect={handleToken0Change}
                    amount={amount0}
                    onAmountChange={(value) => {
                      setAmount0(value);
                      if (value && priceRate0) {
                        const suggested = (
                          Number(value) * Number(priceRate0)
                        ).toFixed(3);
                        setAmount1(suggested);
                      }
                    }}
                    showInput={pairExists} // Only show input if pair exists
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs sm:text-sm text-gray-400">
                      Second Token
                    </label>
                    <span className="text-xs sm:text-sm text-gray-400">
                      Balance: {balance1}
                    </span>
                  </div>
                  <TokenSelector
                    label="Token 1"
                    onSelect={handleToken1Change}
                    amount={amount1}
                    onAmountChange={setAmount1}
                    showInput={pairExists} // Only show input if pair exists
                  />
                </div>

                {/* Add Liquidity Button */}
                <button
                  onClick={pairExists ? handleAddLiquidity : handleCreatePair}
                  disabled={
                    isLoading ||
                    !token0 ||
                    !token1 ||
                    (pairExists ? !amount0 || !amount1 : false) // Only check amounts if pair exists
                  }
                  className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-cyan-500/25"
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
                      {pairExists ? "Adding Liquidity..." : "Creating Pair..."}
                    </div>
                  ) : pairExists ? (
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
                      Add Liquidity
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
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Create Trading Pair
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
