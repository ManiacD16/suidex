// // Add this function inside your AddLiquidity component

// const processLPEvent = async (txDigest: string) => {
//   try {
//     console.log('Processing LP events for transaction:', txDigest);

//     // Fetch both LPMint and LPBurn events for the transaction
//     const [mintEvents, burnEvents] = await Promise.all([
//       suiClient.queryEvents({
//         query: {
//           MoveEventType: `${CONSTANTS.PACKAGE_ID}::pair::LPMint`,
//           Transaction: txDigest
//         }
//       }),
//       suiClient.queryEvents({
//         query: {
//           MoveEventType: `${CONSTANTS.PACKAGE_ID}::pair::LPBurn`,
//           Transaction: txDigest
//         }
//       })
//     ]);

//     console.log('Found events:', {
//       mintEvents: mintEvents.data,
//       burnEvents: burnEvents.data
//     });

//     // Process mint events
//     const processedMintEvents = mintEvents.data.map(event => ({
//       eventType: 'mint',
//       timestamp: new Date(Number(event.timestampMs)).toISOString(),
//       txDigest: event.id.txDigest,
//       sender: event.parsedJson.sender,
//       lpCoinId: event.parsedJson.lp_coin_id,
//       token0Type: event.parsedJson.token0_type,
//       token1Type: event.parsedJson.token1_type,
//       amount0: event.parsedJson.amount0,
//       amount1: event.parsedJson.amount1,
//       liquidity: event.parsedJson.liquidity,
//       totalSupply: event.parsedJson.total_supply
//     }));

//     // Process burn events
//     const processedBurnEvents = burnEvents.data.map(event => ({
//       eventType: 'burn',
//       timestamp: new Date(Number(event.timestampMs)).toISOString(),
//       txDigest: event.id.txDigest,
//       sender: event.parsedJson.sender,
//       lpCoinId: event.parsedJson.lp_coin_id,
//       token0Type: event.parsedJson.token0_type,
//       token1Type: event.parsedJson.token1_type,
//       amount0: event.parsedJson.amount0,
//       amount1: event.parsedJson.amount1,
//       liquidity: event.parsedJson.liquidity,
//       totalSupply: event.parsedJson.total_supply
//     }));

//     const allProcessedEvents = [...processedMintEvents, ...processedBurnEvents];

//     console.log('Processed LP events:', allProcessedEvents);

//     // Here you would send these events to your database
//     // Example API call to your backend:
//     try {
//       const response = await fetch('/api/lp-events', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(allProcessedEvents)
//       });

//       if (!response.ok) {
//         throw new Error('Failed to store LP events');
//       }

//       console.log('Successfully stored LP events in database');
//     } catch (error) {
//       console.error('Error storing LP events:', error);
//       // You might want to implement a retry mechanism here
//     }

//     return allProcessedEvents;
//   } catch (error) {
//     console.error('Error processing LP events:', error);
//     throw error;
//   }
// };

// // Modify your handleAddLiquidity success callback to include event processing:
// signAndExecute(
//   { transaction: addLiquidityTx },
//   {
//     onError: (error) => {
//       console.error('Error in add liquidity transaction:', error);
//       throw error;
//     },
//     onSuccess: async (result) => {
//       console.log('Liquidity addition transaction result:', result);

//       try {
//         // Process LP events
//         const lpEvents = await processLPEvent(result.digest);
//         console.log('Processed LP events:', lpEvents);

//         toast.success('Liquidity added successfully!', { id: toastId });
//         setAmount0('');
//         setAmount1('');
//       } catch (error) {
//         console.error('Error processing LP events:', error);
//         // Still show success toast since the transaction succeeded
//         toast.success('Liquidity added successfully, but there was an error tracking the position', { id: toastId });
//       }
//     }
//   }
// );
