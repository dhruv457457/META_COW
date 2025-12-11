import {
  MetaCowFactory,
  MetaCowPair,
} from "generated";

/**
 * Handler for PairCreated - Register dynamic contract
 */
MetaCowFactory.PairCreated.contractRegister(({ event, context }) => {
  const { pairAddress } = event.params;
  
  context.addMetaCowPair(pairAddress);
  
  context.log.info(`✅ Pair registered: ${pairAddress}`);
});

/**
 * Handler for PairCreated - Create entity
 */
MetaCowFactory.PairCreated.handler(async ({ event, context }) => {
  const { tokenA, tokenB, pairAddress } = event.params;
  
  context.Pair.set({
    id: pairAddress.toLowerCase(),
    tokenA: tokenA.toLowerCase(),
    tokenB: tokenB.toLowerCase(),
    reserveA: 0n,
    reserveB: 0n,
    totalSwaps: 0,
    volume24h: 0n,
    lastSyncAt: event.block.timestamp,
  });
});

/**
 * Handler for ReserveSynced
 */
MetaCowPair.ReserveSynced.handler(async ({ event, context }) => {
  const pairAddress = event.srcAddress.toLowerCase();
  const { reserveA, reserveB } = event.params;

  const pair = await context.Pair.get(pairAddress);
  
  if (pair) {
    context.Pair.set({
      ...pair,
      reserveA: BigInt(reserveA),
      reserveB: BigInt(reserveB),
      lastSyncAt: event.block.timestamp,
    });
  }
});

/**
 * Handler for Swapped event
 */
MetaCowPair.Swapped.handler(async ({ event, context }) => {
  const pairAddress = event.srcAddress.toLowerCase();
  const { user, inputToken, outputToken, inputAmount, outputAmount } = event.params;

  const swapId = `${event.transaction.hash}-${event.logIndex}`;
  
  context.SwapEvent.set({
    id: swapId,
    pairAddress,
    user: user.toLowerCase(),
    inputToken: inputToken.toLowerCase(),
    outputToken: outputToken.toLowerCase(),
    inputAmount: BigInt(inputAmount),
    outputAmount: BigInt(outputAmount),
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
    blockNumber: event.block.number,
  });

  // Update pair statistics
  const pair = await context.Pair.get(pairAddress);
  
  if (pair) {
    context.Pair.set({
      ...pair,
      totalSwaps: pair.totalSwaps + 1,
      volume24h: pair.volume24h + BigInt(inputAmount),
      lastSyncAt: event.block.timestamp,
    });
  }

  context.log.info(`💱 Swap indexed: ${swapId}`);
});