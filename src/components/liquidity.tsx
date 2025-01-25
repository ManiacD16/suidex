"use client";

import { useState, useEffect } from "react";
import "@mysten/dapp-kit/dist/index.css";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import TokenSelector from "./token-selector";
import { Transaction } from "@mysten/sui/transactions";
// import { toast } from "react-hot-toast";
import { CONSTANTS } from "../constants/addresses";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  const [amount1, setAmount1] = useState<string>("");
  // const [checkTrigger, setCheckTrigger] = useState(0);
  // const [amount2, setAmount2] = useState<string>("0.0");
  const [priceRate0, setPriceRate0] = useState<string | null>(null);
  const [priceRate1, setPriceRate1] = useState<string | null>(null);
  const [suggestedAmount1, setSuggestedAmount1] = useState<string | null>(null);
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

  // Reset when changing tabs
  const [suggestedLiquidityAmount, setSuggestedLiquidityAmount] = useState<
    string | null
  >(null);
  // Calculate the suggested liquidity amount based on reserves ratio
  const calculateSuggestedLiquidityAmount = (
    amount: string,
    token0: Token | null,
    token1: Token | null
  ): string | null => {
    if (
      !pairExists ||
      !amount ||
      !token0 ||
      !token1 ||
      reserves.reserve0 === "0" ||
      reserves.reserve1 === "0"
    ) {
      return null;
    }

    try {
      const inputAmount = Number(amount);
      const suggestedAmount =
        inputAmount * (Number(reserves.reserve0) / Number(reserves.reserve1));

      console.log("Calculation details:", {
        inputAmount,
        reserve0: reserves.reserve0,
        reserve1: reserves.reserve1,
        ratio: Number(reserves.reserve0) / Number(reserves.reserve1),
        suggestedAmount,
      });

      // Add toFixed(3) here
      return suggestedAmount.toFixed(3);
    } catch (error) {
      console.error("Error calculating suggested amount:", error);
      return null;
    }
  };
  // Reset relevant values when changing tokens
  const handleToken0Change = (newToken: Token | null) => {
    setAmount0("");
    setAmount1("");
    setPriceRate0(null);
    setPriceRate1(null);
    setSuggestedAmount1(null);
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

  // Add this new useEffect
  useEffect(() => {
    const updateLiquidityAmounts = () => {
      if (pairExists && amount0 && token0 && token1) {
        const suggestedAmount = calculateSuggestedLiquidityAmount(
          amount0,
          token0,
          token1
        );
        if (suggestedAmount) {
          setSuggestedLiquidityAmount(suggestedAmount);
          setAmount1(suggestedAmount);
        }
      }
    };

    updateLiquidityAmounts();
  }, [pairExists, amount0, token0, token1]);

  // const handleSlippageChange = (value: any) => {
  //   setSlippage(value);
  //   setShowSettings(false); // Hide the settings panel after selection
  // };

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
            toast.success("Pair creation successful!", { toastId });
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          },
          onError: (error) => {
            if (error.message.includes("308")) {
              toast.error("This pair already exists", { toastId });
            } else {
              toast.error(`Failed to create pair: ${error.message}`, {
                toastId,
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
      toast.error(errorMessage, { toastId });
    } finally {
      setIsLoading(false);
    }
  };

  // First, add the processLPEvent function near the top of your component, after the formatTokenAmount function
  const processLPEvent = async (txDigest: string) => {
    try {
      console.log("Processing LP events for transaction:", txDigest);
      // Fetch LPMint events for the transaction
      const mintEvents = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONSTANTS.PACKAGE_ID}::pair::LPMint`,
        },
        order: "descending",
      });
      console.log("Found events:", {
        mintEvents: mintEvents.data,
      });

      // Process mint events
      interface LPMintEvent {
        sender: string;
        lp_coin_id: string;
        token0_type: string;
        token1_type: string;
        amount0: string;
        amount1: string;
        liquidity: string;
        total_supply: string;
      }

      const processedMintEvents = mintEvents.data.map((event) => {
        const parsedEvent = event.parsedJson as LPMintEvent;
        const processed = {
          eventType: "mint",
          timestamp: new Date(Number(event.timestampMs)).toISOString(),
          txDigest: event.id.txDigest,
          sender: parsedEvent.sender,
          lpCoinId: parsedEvent.lp_coin_id,
          token0Type: parsedEvent.token0_type,
          token1Type: parsedEvent.token1_type,
          amount0: parsedEvent.amount0,
          amount1: parsedEvent.amount1,
          liquidity: parsedEvent.liquidity,
          totalSupply: parsedEvent.total_supply,
        };

        console.log("Processed event details:", {
          eventType: processed.eventType,
          timestamp: processed.timestamp,
          txDigest: processed.txDigest,
          sender: processed.sender,
          lpCoinId: processed.lpCoinId,
          token0Type: processed.token0Type,
          token1Type: processed.token1Type,
          amount0: processed.amount0,
          amount1: processed.amount1,
          liquidity: processed.liquidity,
          totalSupply: processed.totalSupply,
        });

        return processed;
      });

      const allProcessedEvents = [...processedMintEvents];
      console.log("Processed LP events:", allProcessedEvents);

      // Store events in database
      //   try {
      //     const response = await fetch("/api/lp-events", {
      //       method: "POST",
      //       headers: {
      //         "Content-Type": "application/json",
      //       },
      //       body: JSON.stringify(allProcessedEvents),
      //     });

      //     if (!response.ok) {
      //       throw new Error("Failed to store LP events");
      //     }
      //     console.log("Successfully stored LP events in database");
      //   } catch (error) {
      //     console.error("Error storing LP events:", error);
      //   }

      //   return allProcessedEvents;
    } catch (error) {
      console.error("Error processing LP events:", error);
      throw error;
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

      const isSUI0 = sortedType0.includes("0x2::sui::SUI");
      const isSUI1 = sortedType1.includes("0x2::sui::SUI");

      const splitCoin0 = isSUI0
        ? addLiquidityTx.splitCoins(addLiquidityTx.gas, [
            addLiquidityTx.pure.u64(amount0Value),
          ])[0]
        : addLiquidityTx.splitCoins(
            addLiquidityTx.object(coinToSplit0.coinObjectId),
            [addLiquidityTx.pure.u64(amount0Value)]
          )[0];

      const splitCoin1 = isSUI1
        ? addLiquidityTx.splitCoins(addLiquidityTx.gas, [
            addLiquidityTx.pure.u64(amount1Value),
          ])[0]
        : addLiquidityTx.splitCoins(
            addLiquidityTx.object(coinToSplit1.coinObjectId),
            [addLiquidityTx.pure.u64(amount1Value)]
          )[0];

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

            try {
              // Process LP events
              const lpEvents = await processLPEvent(result.digest);
              console.log("Processed LP events:", lpEvents);

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
              toast.update(toastId, {
                render: "Added liquidity Successfully",
                type: "success",
                isLoading: false,
                autoClose: 5000,
              });
            } catch (error) {
              console.error("Error processing LP events:", error);
              // Still show success toast since the transaction succeeded
              toast.update(toastId, {
                render: "Liquidity added successfully",
                type: "success",
                isLoading: false,
                autoClose: 5000,
              });
            }
          },
          onError: (error) => {
            console.error("Transaction error:", error);
            toast.update(toastId, {
              render: "Transaction failed",
              type: "error",
              isLoading: false,
              autoClose: 5000,
            });
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

      toast.update(toastId, {
        render: "Failed to add liquidity: " + errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setIsLoading(false);
      //   toast.success("Liquidity added successfully!", { toastId });
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

  return (
    <>
      {/* Main Content */}
      <main className="max-w-[480px] mx-auto pt-8 px-4">
        {/* Tab Navigation */}
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
                className={`p-4 rounded-xl mb-4 ${
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
                    <div className="text-cyan-500 font-medium mt-1">
                      {token0.symbol}:{" "}
                      {(
                        Number(reserves.reserve0) /
                        Math.pow(10, token0.decimals)
                      ).toFixed(3)}
                      <br />
                      {token1.symbol}:{" "}
                      {(
                        Number(reserves.reserve1) /
                        Math.pow(10, token1.decimals)
                      ).toFixed(3)}
                    </div>
                    {priceRate0 && priceRate1 && (
                      <div className="mt-2 text-sm text-gray-400">
                        <div>{`1 ${
                          token0?.symbol || "Token0"
                        } = ${priceRate0} ${token1?.symbol || "Token1"}`}</div>
                        <div>{`1 ${
                          token1?.symbol || "Token1"
                        } = ${priceRate1} ${token0?.symbol || "Token0"}`}</div>
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

                    // Handle price rate logic for swap
                    if (value && priceRate0) {
                      const suggested = (
                        Number(value) * Number(priceRate0)
                      ).toFixed(3);
                      setAmount1(suggested);
                    }
                    // Handle suggested liquidity amount logic
                    else {
                      const suggestedAmount = calculateSuggestedLiquidityAmount(
                        value,
                        token0,
                        token1
                      );
                      if (suggestedAmount) {
                        setAmount1(suggestedAmount);
                        setSuggestedLiquidityAmount(suggestedAmount);
                      }
                    }
                  }}
                  showInput={pairExists}
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
              {/* Display suggested amount and warning in liquidity mode */}
              <div className="mt-2">
                {suggestedLiquidityAmount && (
                  <div className="px-3 py-2 bg-gray-800/30 rounded-lg text-xs">
                    <span className="text-gray-400">
                      Suggested amount based on pool ratio:{" "}
                    </span>
                    <span className="text-cyan-500 font-medium">
                      {suggestedLiquidityAmount} {token1?.symbol}
                    </span>
                  </div>
                )}
                {suggestedLiquidityAmount &&
                  amount1 &&
                  Number(amount1) !== Number(suggestedLiquidityAmount) && (
                    <div className="mt-2 px-3 py-2 bg-yellow-500/10 rounded-lg">
                      <div className="text-xs text-yellow-500">
                        ⚠️ Current amount differs from the suggested amount.
                        This may result in sub-optimal liquidity provision.
                      </div>
                    </div>
                  )}
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
      </main>
    </>
  );
}
