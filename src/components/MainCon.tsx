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
import { toast } from "react-hot-toast";
import { CONSTANTS } from "../constants/addresses";

export default function MainCon() {
  const [activeTab, setActiveTab] = useState<string>("exchange");
  const [amount1, setAmount1] = useState<string>("");
  const [amount2, setAmount2] = useState<string>("0.0");

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

  const [liquidityAmount1, setLiquidityAmount1] = useState("0.0");
  const [liquidityAmount2, setLiquidityAmount2] = useState("0.0");

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
        if (coin.data?.content?.fields?.balance) {
          setBalance(coin.data.content.fields.balance);
        }
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    };

    if (token0) fetchBalance(token0, setBalance0);
    if (token1) fetchBalance(token1, setBalance1);
  }, [token0, token1, account?.address, suiClient]);

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

        const baseType0 = getBaseType(token0Obj.data.type);
        const baseType1 = getBaseType(token1Obj.data.type);

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

            if (Array.isArray(addressBytes)) {
              const hexString = addressBytes
                .slice(1)
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

              if (pairObject.data?.content?.fields) {
                const fields = pairObject.data.content.fields;
                console.log(fields);
                setReserves({
                  reserve0: fields.reserve0,
                  reserve1: fields.reserve1,
                  timestamp: fields.block_timestamp_last,
                });
              }

              setPairExists(true);
              setCurrentPairId(pairId);
            } else {
              console.log("No pair exists (empty option)");
              setPairExists(false);
              setCurrentPairId(null);
              setReserves({ reserve0: "0", reserve1: "0", timestamp: 0 });
            }
          } else {
            console.log("No pair exists (invalid format)");
            setPairExists(false);
            setCurrentPairId(null);
            setReserves({ reserve0: "0", reserve1: "0", timestamp: 0 });
          }
        } else {
          console.log("No pair exists (no return value)");
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
  }, [token0, token1, suiClient]);

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
        const fields = event.parsedJson;

        // Extract token addresses from type strings
        const type0Parts = sortedType0.split("::");
        const type1Parts = sortedType1.split("::");

        // Normalize addresses
        const normalizedType0 = `${normalizeSuiAddress(type0Parts[0])}::${
          type0Parts[1]
        }::${type0Parts[2]}`;
        const normalizedType1 = `${normalizeSuiAddress(type1Parts[0])}::${
          type1Parts[1]
        }::${type1Parts[2]}`;

        console.log("Comparing token pairs:", {
          pair: event.parsedJson.pair,
          expectedToken0: normalizedType0,
          eventToken0: fields.token0.name,
          expectedToken1: normalizedType1,
          eventToken1: fields.token1.name,
          matches: {
            token0: fields.token0.name === normalizedType0,
            token1: fields.token1.name === normalizedType1,
          },
        });

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

        try {
          signAndExecute(
            { transaction: tx },
            {
              onError: (error) => {
                console.error("Pair creation error:", error);
                throw error;
              },
              onSuccess: (result) => {
                console.log(result);
                console.log("Pair creation transaction result:", result);
              },
            }
          );

          // Query for the newly created pair
          const newPairEvent = await suiClient.queryEvents({
            query: {
              MoveEventType: `${CONSTANTS.PACKAGE_ID}::factory::PairCreated`,
              Transaction: result.digest,
            },
          });

          console.log("New pair creation event:", newPairEvent.data);
          pairId = newPairEvent.data[0]?.parsedJson?.pair;
          console.log("New pair ID:", pairId);
        } catch (error) {
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
              const fields = event.parsedJson;
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
              pairId = existingPair.parsedJson.pair;
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

      const amount0Value = Math.floor(parseFloat(amount0) * 1e9);
      const amount1Value = Math.floor(parseFloat(amount1) * 1e9);

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

      // Get current timestamp in milliseconds
      const currentTimestamp = Math.floor(Date.now());
      // Add 20 minutes (1200000 milliseconds) to current timestamp
      const deadline = currentTimestamp + 1200000;

      console.log("Transaction timing:", {
        currentTimestamp,
        deadline,
        buffer: "20 minutes",
      });

      // Calculate minimum amounts with 5% slippage
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

      signAndExecute(
        { transaction: addLiquidityTx },
        {
          onError: (error) => {
            console.error("Error in add liquidity transaction:", error);
            throw error;
          },
          onSuccess: (result) => {
            console.log("Liquidity addition transaction result:", result);
            toast.success("Liquidity added successfully!", { id: toastId });
            setAmount0("");
            setAmount1("");
          },
        }
      );
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

  return (
    <>
      {/* Header */}

      {/* Main Content */}
      <main className="max-w-[480px] mx-auto pt-8 px-4">
        <div className="mb-4 sm:mb-6 border-b border-gray-800">
          <div className="flex space-x-4 sm:space-x-6">
            <button
              onClick={() => setActiveTab("exchange")}
              className={`pb-2 px-1 text-sm sm:text-base ${
                activeTab === "exchange"
                  ? "text-green-500 border-b-2 border-green-500"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Exchange
            </button>
            <button
              onClick={() => setActiveTab("liquidity")}
              className={`pb-2 px-1 text-sm sm:text-base ${
                activeTab === "liquidity"
                  ? "text-green-500 border-b-2 border-green-500"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Liquidity
            </button>
          </div>
        </div>

        {activeTab === "exchange" ? (
          <div className="bg-[#222222] rounded-xl border border-gray-800">
            <div className="p-3 sm:p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs sm:text-sm text-gray-400">Swap</span>
                <button className="p-1.5 sm:p-2 hover:bg-gray-700 rounded-lg">
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-2">
                <TokenSelector label="Token 0" onSelect={setToken0} />
                <TokenSelector label="Token 0" onSelect={setToken0} />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#222222] rounded-xl border border-gray-800">
            <div className="p-3 sm:p-4">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <span className="text-xs sm:text-sm text-gray-400">
                  Add Liquidity
                </span>
                {token0 && token1 && (
                  <div
                    className={`p-3 rounded-lg mb-4 ${
                      pairExists ? "bg-green-100" : "bg-yellow-100"
                    }`}
                  >
                    <p className="text-sm">
                      {pairExists ? (
                        <>
                          <div>{`✅ Trading pair exists (ID: ${currentPairId?.slice(
                            0,
                            8
                          )}...)`}</div>
                          <div>{`Reserves :  ${reserves.reserve0} - ${reserves.reserve1}`}</div>
                        </>
                      ) : (
                        "⚠️ Trading pair needs to be created"
                      )}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs sm:text-sm text-gray-400">
                      First Token
                    </label>
                    <span className="text-xs sm:text-sm text-gray-400">
                      Balance: {parseFloat(balance0) / 1e9}
                    </span>
                  </div>
                  <TokenSelector label="Token 0" onSelect={setToken0} />
                  <div className="flex-1 min-w-0"></div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs sm:text-sm text-gray-400">
                      Second Token
                    </label>
                    <span className="text-xs sm:text-sm text-gray-400">
                      Balance: {parseFloat(balance1) / 1e9}
                    </span>
                  </div>
                  <TokenSelector label="Token 1" onSelect={setToken1} />
                </div>

                <button
                  onClick={handleAddLiquidity}
                  disabled={
                    isLoading || !token0 || !token1 || !amount0 || !amount1
                  }
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg transition-colors duration-200 text-sm sm:text-base"
                >
                  {isLoading
                    ? "Processing..."
                    : pairExists
                    ? "Add Liquidity"
                    : "Create Pair & Add Liquidity"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Version Info */}
    </>
  );
}
