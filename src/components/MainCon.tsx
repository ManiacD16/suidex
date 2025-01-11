"use client";

import { useState, useEffect } from "react";
import "@mysten/dapp-kit/dist/index.css";
// import { motion, AnimatePresence } from "framer-motion";
// import { ArrowDownCircle } from "lucide-react";

import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import TokenSelector from "./token-selector";
import { Transaction } from "@mysten/sui/transactions";
import { toast } from "react-hot-toast";
import { CONSTANTS } from "../constants/addresses";

export default function MainCon() {
  const [activeTab, setActiveTab] = useState<string>("exchange");
  const [amount1, setAmount1] = useState<string>("");
  // const [amount2, setAmount2] = useState<string>("0.0");
  const [priceRate0, setPriceRate0] = useState<string | null>(null);
  const [priceRate1, setPriceRate1] = useState<string | null>(null);
  const [suggestedAmount1, setSuggestedAmount1] = useState<string | null>(null);
  const [estimatedOutput, setEstimatedOutput] = useState<number | null>(null);
  const [token0, setToken0] = useState("");
  const [token1, setToken1] = useState("");
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

  useEffect(() => {
    const fetchBalance = async (
      tokenId: string,
      setBalance: (val: string) => void
    ) => {
      if (!tokenId || !account?.address) return;
      try {
        const coin = await suiClient.getObject({
          id: tokenId,
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
          setBalance(coin.data.content.fields.balance as string);
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
      ).toFixed(6);
      const rate1 = (
        Number(reserves.reserve0) / Number(reserves.reserve1)
      ).toFixed(6);

      setPriceRate0(rate0);
      setPriceRate1(rate1);
    };

    calculateRates();
  }, [reserves]);

  useEffect(() => {
    const suggestAmount = () => {
      if (amount0 && priceRate0 && reserves.reserve0 !== "0") {
        const suggested = (Number(amount0) * Number(priceRate0)).toFixed(6);
        console.log("Suggested amount:", suggested);
        setSuggestedAmount1(suggested);
        console.log("Suggested amount:", suggestedAmount1);
      } else {
        setSuggestedAmount1(null);
      }
    };

    suggestAmount();
  }, [amount0, priceRate0]);

  // Add effect to check pair existence whenever tokens change
  useEffect(() => {
    const checkPairExistence = async () => {
      if (!token0 || !token1) return;
      try {
        console.log("Checking pair existence for tokens:", { token0, token1 });
        const [token0Obj, token1Obj] = await Promise.all([
          suiClient.getObject({ id: token0, options: { showType: true } }),
          suiClient.getObject({ id: token1, options: { showType: true } }),
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
              // ensure we have enough data
              const hexString = addressBytes
                .slice(1) // remove the leading 0
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");
              const pairId = `0x${hexString}`;
              console.log("Found pair via factory:", {
                rawResponse: response.results[0].returnValues,
                addressBytes,
                pairId,
              });

              // Fetch reserves after finding pair
              const pairObject = await suiClient.getObject({
                id: pairId,
                options: {
                  showContent: true,
                  showType: true,
                },
              });

              // Add type guards for accessing fields
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
                console.log(fields);
                setReserves({
                  reserve0: fields.reserve0 as string,
                  reserve1: fields.reserve1 as string,
                  timestamp: fields.block_timestamp_last as number,
                });
              }
              setPairExists(true);
              setCurrentPairId(pairId);
            } else {
              console.log(
                "Pair address is empty or malformed, no pair exists."
              );
              setPairExists(false);
              setCurrentPairId(null);
              setReserves({ reserve0: "0", reserve1: "0", timestamp: 0 });
            }
          } else {
            console.log(
              "No pair exists (empty option value or invalid format)."
            );
            setPairExists(false);
            setCurrentPairId(null);
            setReserves({ reserve0: "0", reserve1: "0", timestamp: 0 });
          }
        } else {
          console.log("No pair exists (no return value from the factory).");
          setPairExists(false);
          setCurrentPairId(null);
          setReserves({ reserve0: "0", reserve1: "0", timestamp: 0 });
        }
      } catch (error) {
        console.error("Error during pair check:", error);
        setPairExists(false);
        setCurrentPairId(null);
        setReserves({ reserve0: "0", reserve1: "0", timestamp: 0 });
      }
    };

    checkPairExistence();
  }, [token0, token1, suiClient, account?.address]);

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
        // Get token types and decimals
        const [token0Obj, token1Obj] = await Promise.all([
          suiClient.getObject({ id: token0, options: { showType: true } }),
          suiClient.getObject({ id: token1, options: { showType: true } }),
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
        setAmount1((Number(amountOut) / Math.pow(10, decimals1)).toFixed(6)); // Limit to 6 decimals
      } catch (error) {
        console.error("Error calculating output:", error);
        setEstimatedOutput(null);
        setAmount1("0.0");
      }
    };

    calculateEstimatedOutput();
  }, [amount0, reserves, pairExists, token0, token1, suiClient]);

  const retryQueryEvent = async (createPairResult: any) => {
    try {
      console.log(
        "Querying for PairCreated event with digest:",
        createPairResult.digest
      );

      // Query for the PairCreated event
      const newPairEvent = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONSTANTS.PACKAGE_ID}::factory::PairCreated`,
          Transaction: createPairResult.digest,
        },
      });

      console.log("Raw response from queryEvents:", newPairEvent); // Log the entire response to check structure

      if (
        !newPairEvent ||
        !newPairEvent.data ||
        newPairEvent.data.length === 0
      ) {
        throw new Error("Pair creation event not found or empty response");
      }

      console.log(
        "Successfully retrieved PairCreated event:",
        newPairEvent.data
      );
      return newPairEvent; // Return the event data if found
    } catch (error) {
      console.error("Error during event query:", error);
      throw error; // Rethrow the error for further handling
    }
  };

  // Define the structure of the `PairCreatedEvent` clearly
  interface PairCreatedEvent {
    token0: { name: string };
    token1: { name: string };
    pair: string;
  }

  const handleAddLiquidity = async () => {
    if (!account?.address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!token0 || !token1 || !amount0 || !amount1) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Processing transaction...");

    try {
      console.log("Starting liquidity addition process...");
      console.log("Selected tokens:", { token0, token1 });

      const [token0Obj, token1Obj] = await Promise.all([
        suiClient.getObject({ id: token0, options: { showType: true } }),
        suiClient.getObject({ id: token1, options: { showType: true } }),
      ]);

      if (!token0Obj.data?.type || !token1Obj.data?.type) {
        throw new Error("Invalid token types");
      }

      const getBaseType = (coinType: string) => {
        const match = coinType.match(/<(.+)>/);
        return match ? match[1] : coinType;
      };

      const baseType0 = getBaseType(token0Obj.data.type);
      const baseType1 = getBaseType(token1Obj.data.type);
      console.log("Base types extracted:", { baseType0, baseType1 });

      // Retrieve decimals for token0 and token1
      const getTokenDecimals = (tokenObj: any): number => {
        return tokenObj?.data?.decimals || 9; // Default to 9 decimals if not found
      };

      const decimals0 = getTokenDecimals(token0Obj);
      const decimals1 = getTokenDecimals(token1Obj);

      const [sortedType0, sortedType1] = sortTokens(baseType0, baseType1);
      console.log("Sorted token types:", { sortedType0, sortedType1 });

      // Query existing pairs
      const pairs = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONSTANTS.PACKAGE_ID}::factory::PairCreated`,
        },
      });

      console.log("All existing pairs found:", pairs.data);

      // Helper function to normalize SUI address format
      const normalizeSuiAddress = (address: string) => {
        if (address === "0x2") {
          return "0000000000000000000000000000000000000000000000000000000000000002";
        }
        return address.replace("0x", "");
      };

      // Find existing pair with normalized comparison
      const existingPair = pairs.data.find((event) => {
        const fields = event.parsedJson as PairCreatedEvent | undefined;

        // If parsedJson is undefined or doesn't have token0, token1, or pair, skip the event
        if (!fields || !fields.token0 || !fields.token1 || !fields.pair) {
          return false;
        }

        const type0Parts = sortedType0.split("::");
        const type1Parts = sortedType1.split("::");
        const normalizedType0 = `${normalizeSuiAddress(type0Parts[0])}::${
          type0Parts[1]
        }::${type0Parts[2]}`;
        const normalizedType1 = `${normalizeSuiAddress(type1Parts[0])}::${
          type1Parts[1]
        }::${type1Parts[2]}`;

        return (
          fields.token0.name === normalizedType0 &&
          fields.token1.name === normalizedType1
        );
      });

      let pairId = existingPair?.parsedJson?.pair;
      console.log("Pair check result:", {
        pairFound: !!pairId,
        pairId,
        pairDetails: existingPair?.parsedJson,
      });

      if (!pairId) {
        console.log("No existing pair found, creating new pair...");
        toast.loading("Creating new pair...", { id: toastId });

        const tx = new Transaction();

        console.log("Creating pair with parameters:", {
          token0: sortedType0,
          token1: sortedType1,
          token0Symbol: sortedType0.split("::").pop(),
          token1Symbol: sortedType1.split("::").pop(),
        });

        // Create pair call with necessary arguments
        tx.moveCall({
          target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.ROUTER}::create_pair`,
          arguments: [
            tx.object(CONSTANTS.ROUTER_ID),
            tx.object(CONSTANTS.FACTORY_ID),
            tx.pure.string(sortedType0.split("::").pop() || ""),
            tx.pure.string(sortedType1.split("::").pop() || ""),
            // Add any additional parameters that are required by the create_pair function
            tx.pure.u64(1000), // Example additional argument, such as liquidity ratio or other configuration values
          ],
          typeArguments: [sortedType0, sortedType1],
        });

        try {
          const createPairResult = await new Promise((resolve, reject) => {
            signAndExecute(
              { transaction: tx },
              {
                onError: reject,
                onSuccess: resolve,
              }
            );
          });

          console.log("Pair creation transaction result:", createPairResult);

          // Query for the newly created pair with retry mechanism
          let newPairEvent = await retryQueryEvent(createPairResult); // Retry querying the event

          pairId = newPairEvent.data[0]?.parsedJson?.pair;
          console.log("New pair ID:", pairId);
        } catch (error: any) {
          console.log("Error during pair creation:", error);
          // If pair exists error, try to find the pair again
          if (error.message.includes("308")) {
            console.log(
              "Pair exists error detected, searching for existing pair..."
            );

            const retryPairs = await suiClient.queryEvents({
              query: {
                MoveEventType: `${CONSTANTS.PACKAGE_ID}::factory::PairCreated`,
              },
            });

            const existingPair = retryPairs.data.find((event) => {
              const fields = event.parsedJson as PairCreatedEvent | undefined;

              // If parsedJson is undefined or doesn't have token0, token1, or pair, skip the event
              if (!fields || !fields.token0 || !fields.token1 || !fields.pair) {
                return false;
              }

              const type0Parts = sortedType0.split("::");
              const type1Parts = sortedType1.split("::");
              const normalizedType0 = `${normalizeSuiAddress(type0Parts[0])}::${
                type0Parts[1]
              }::${type0Parts[2]}`;
              const normalizedType1 = `${normalizeSuiAddress(type1Parts[0])}::${
                type1Parts[1]
              }::${type1Parts[2]}`;

              return (
                fields.token0.name === normalizedType0 &&
                fields.token1.name === normalizedType1
              );
            });

            if (existingPair) {
              pairId = (existingPair.parsedJson as { pair: string }).pair;
              console.log("Found existing pair after error:", pairId);
            } else {
              throw new Error("Failed to find pair after creation attempt");
            }
          } else {
            throw error;
          }
        }
      }

      if (!pairId) {
        throw new Error("Failed to get pair ID");
      }

      setPairExists(true);
      setCurrentPairId(pairId);

      console.log("Proceeding to add liquidity to pair:", pairId);
      toast.loading("Adding liquidity...", { id: toastId });

      // Calculate amounts in the smallest units (based on token decimals)
      const amount0Value = Math.floor(
        parseFloat(amount0) * Math.pow(10, decimals0)
      );
      const amount1Value = Math.floor(
        parseFloat(amount1) * Math.pow(10, decimals1)
      );

      console.log("Calculated amounts:", {
        amount0: amount0Value,
        amount1: amount1Value,
      });

      const [coins0, coins1] = await Promise.all([
        suiClient.getCoins({ owner: account.address, coinType: sortedType0 }),
        suiClient.getCoins({ owner: account.address, coinType: sortedType1 }),
      ]);

      console.log("Available coins:", {
        coins0: coins0.data,
        coins1: coins1.data,
      });

      const coinToSplit0 = coins0.data.find(
        (coin) => BigInt(coin.balance) >= BigInt(amount0Value)
      );
      const coinToSplit1 = coins1.data.find(
        (coin) => BigInt(coin.balance) >= BigInt(amount1Value)
      );

      if (!coinToSplit0 || !coinToSplit1) {
        console.log("Insufficient balance:", {
          required0: amount0Value,
          required1: amount1Value,
          available0: coinToSplit0?.balance,
          available1: coinToSplit1?.balance,
        });
        throw new Error("Insufficient balance");
      }

      console.log("Selected coins for splitting:", {
        coin0: coinToSplit0,
        coin1: coinToSplit1,
      });

      const addLiquidityTx = new Transaction();
      const [splitCoin0] = addLiquidityTx.splitCoins(
        addLiquidityTx.object(coinToSplit0.coinObjectId),
        [addLiquidityTx.pure.u64(amount0Value)]
      );
      const [splitCoin1] = addLiquidityTx.splitCoins(
        addLiquidityTx.object(coinToSplit1.coinObjectId),
        [addLiquidityTx.pure.u64(amount1Value)]
      );

      const currentTimestamp = Math.floor(Date.now());
      const deadline = currentTimestamp + 1200000;

      console.log("Transaction timing:", {
        currentTimestamp,
        deadline,
        buffer: "20 minutes",
      });

      const minAmount0 = (BigInt(amount0Value) * 95n) / 100n;
      const minAmount1 = (BigInt(amount1Value) * 95n) / 100n;

      console.log("Adding liquidity with parameters:", {
        pairId,
        amount0: amount0Value,
        amount1: amount1Value,
        minAmount0,
        minAmount1,
        deadline,
      });

      addLiquidityTx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.ROUTER}::add_liquidity`,
        arguments: [
          addLiquidityTx.object(CONSTANTS.ROUTER_ID),
          addLiquidityTx.object(CONSTANTS.FACTORY_ID),
          addLiquidityTx.object(pairId),
          splitCoin0,
          splitCoin1,
          addLiquidityTx.pure.u128(amount0Value),
          addLiquidityTx.pure.u128(amount1Value),
          addLiquidityTx.pure.u128(minAmount0),
          addLiquidityTx.pure.u128(minAmount1),
          addLiquidityTx.pure.string(sortedType0.split("::").pop() || ""),
          addLiquidityTx.pure.string(sortedType1.split("::").pop() || ""),
          addLiquidityTx.pure.u64(deadline),
        ],
        typeArguments: [sortedType0, sortedType1],
      });

      await new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: addLiquidityTx },
          {
            onError: reject,
            onSuccess: (result) => {
              console.log("Liquidity addition transaction result:", result);
              toast.success("Liquidity added successfully!", { id: toastId });
              setAmount0("");
              setAmount1("");
              resolve(result);
            },
          }
        );
      });
    } catch (error) {
      console.error("Transaction failed:", error);
      let errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      if (errorMessage.includes("308")) {
        errorMessage = "Pair already exists, retrying...";
      } else if (errorMessage.includes("Insufficient balance")) {
        errorMessage = "Insufficient balance to complete the transaction";
      }

      toast.error("Transaction failed: " + errorMessage, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!account?.address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!token0 || !token1 || !amount0 || !pairExists) {
      toast.error("Please fill in all fields and ensure pair exists");
      return;
    }

    setIsSwapLoading(true);
    const toastId = toast.loading("Processing swap...");

    try {
      const [token0Obj, token1Obj] = await Promise.all([
        suiClient.getObject({ id: token0, options: { showType: true } }),
        suiClient.getObject({ id: token1, options: { showType: true } }),
      ]);

      // Ensure token0Obj.data and token1Obj.data are valid and not null/undefined
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
      console.log("Basetype0", baseType0);
      console.log("Basetype1", baseType1);

      // Retrieve the decimals for each token (assuming this is part of the token's metadata)
      const getTokenDecimals = async (tokenObj: any): Promise<number> => {
        // Assuming tokenObj.data contains decimals information (adjust based on actual structure)
        return tokenObj?.data?.decimals || 9; // Defaulting to 9 decimals if not found
      };

      const decimals0 = await getTokenDecimals(token0Obj);
      const decimals1 = await getTokenDecimals(token1Obj);

      // Adjust for the dynamic decimal precision of each token
      const amount0Value = Math.floor(
        parseFloat(amount0) * Math.pow(10, decimals0)
      );
      const estimatedOutput = parseFloat(amount1);
      const minimumAmountOut = Math.floor(
        estimatedOutput * 0.95 * Math.pow(10, decimals1)
      );

      // Get available coins for the input token
      const coins = await suiClient.getCoins({
        owner: account.address,
        coinType: baseType0,
      });

      // Find a coin with sufficient balance
      const coinToUse = coins.data.find(
        (coin) => BigInt(coin.balance) >= BigInt(amount0Value)
      );

      if (!coinToUse) {
        throw new Error("Insufficient balance");
      }

      // Create the swap transaction
      const swapTx = new Transaction();

      // Split the input coin
      const [splitCoin] = swapTx.splitCoins(
        swapTx.object(coinToUse.coinObjectId),
        [swapTx.pure.u64(amount0Value)]
      );

      // Set deadline 20 minutes from now
      const deadline = Math.floor(Date.now() + 1200000);
      if (!currentPairId) {
        throw new Error("Current pair ID is null");
      }

      // Add the swap call to the transaction
      swapTx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::router::swap_exact_tokens_for_tokens`,
        typeArguments: [baseType0, baseType1],
        arguments: [
          swapTx.object(CONSTANTS.ROUTER_ID),
          swapTx.object(CONSTANTS.FACTORY_ID),
          swapTx.object(currentPairId),
          splitCoin,
          swapTx.pure.u128(minimumAmountOut),
          swapTx.pure.u64(deadline),
        ],
      });

      // Execute the transaction
      await signAndExecute(
        { transaction: swapTx },
        {
          onSuccess: (result) => {
            console.log("Swap successful:", result);
            toast.success("Swap completed successfully!", { id: toastId });
            // Reset input amounts
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

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSwapLoading, setIsSwapLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

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
                  onClick={() => setActiveTab(tab)}
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
              <span className="text-sm text-gray-400">Swap</span>
              <div className="text-sm text-gray-500 bg-gray-800/50 px-3 py-1 rounded-full">
                Slippage: 5%
              </div>
            </div>

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
                        {(Number(reserves.reserve0) / 1e9).toFixed(6)} /{" "}
                        {(Number(reserves.reserve1) / 1e9).toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Token Input Section */}
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">You Pay</span>
                  <span className="text-gray-400">
                    Balance: {(parseFloat(balance0) / 1e9).toFixed(6)}
                  </span>
                </div>
                <TokenSelector
                  label="Token 0"
                  onSelect={setToken0}
                  amount={amount0}
                  onAmountChange={setAmount0}
                />
              </div>

              {/* Swap Direction Button */}
              {/* <div className="relative flex justify-center">
                <button
                  onClick={() => {
                    const tempToken = token0;
                    const tempAmount = amount0;
                    setToken0(token1);
                    setAmount0(amount1);
                    setToken1(tempToken);
                    setAmount1(tempAmount);
                  }}
                  className="p-3 rounded-full border-2 border-gray-400 hover:border-cyan-600 bg-gray-700 hover:bg-gray-600 transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                >
                  <svg
                    className="w-6 h-6 text-cyan-300 transform transition-transform duration-300 hover:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>
                </button>
              </div> */}

              {/* Token Output Section */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">You Receive</span>
                  <span className="text-gray-400">
                    Balance: {(parseFloat(balance1) / 1e9).toFixed(6)}
                  </span>
                </div>
                <TokenSelector
                  label="Token 1"
                  onSelect={setToken1}
                  amount={estimatedOutput ? estimatedOutput.toFixed(6) : "0.0"}
                  onAmountChange={setAmount1}
                  readOnly={true}
                />

                {estimatedOutput && (
                  <div className="mt-2 text-xs flex justify-between text-gray-500">
                    <span>Minimum received after slippage</span>
                    <span className="font-medium">
                      {(estimatedOutput * 0.95).toFixed(6)}
                    </span>
                  </div>
                )}
              </div>

              {/* Swap Button */}
              <button
                onClick={handleSwap}
                disabled={
                  isSwapLoading ||
                  !token0 ||
                  !token1 ||
                  !amount0 ||
                  !amount1 ||
                  !pairExists
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
                    Processing Swap...
                  </div>
                ) : !pairExists ? (
                  "No Trading Pair Available"
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
                <span className="text-sm text-gray-400">Add Liquidity</span>
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
                      <div className="text-sm text-gray-400 mt-1">{`Reserves: ${(
                        Number(reserves.reserve0) / 1e9
                      ).toFixed(6)} - ${(
                        Number(reserves.reserve1) / 1e9
                      ).toFixed(6)}`}</div>
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
                      Balance: {(parseFloat(balance0) / 1e9).toFixed(6)}
                    </span>
                  </div>
                  <TokenSelector
                    label="Token 0"
                    onSelect={setToken0}
                    amount={amount0}
                    onAmountChange={(value) => {
                      setAmount0(value);
                      if (value && priceRate0) {
                        const suggested = (
                          Number(value) * Number(priceRate0)
                        ).toFixed(6);
                        setAmount1(suggested);
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs sm:text-sm text-gray-400">
                      Second Token
                    </label>
                    <span className="text-xs sm:text-sm text-gray-400">
                      Balance: {(parseFloat(balance1) / 1e9).toFixed(6)}
                    </span>
                  </div>
                  <TokenSelector
                    label="Token 1"
                    onSelect={setToken1}
                    amount={amount1}
                    onAmountChange={setAmount1}
                    readOnly={true}
                  />
                </div>

                {/* Add Liquidity Button */}
                <button
                  onClick={handleAddLiquidity}
                  disabled={
                    isLoading || !token0 || !token1 || !amount0 || !amount1
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
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </div>
                  ) : pairExists ? (
                    "Add Liquidity"
                  ) : (
                    "Create Pair & Add Liquidity"
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
