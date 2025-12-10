import {
  MetaCowFactory,
  MetaCowPair,
} from "generated";

/**
 * Handler for PairCreated event - Uses contractRegister for dynamic registration
 */
MetaCowFactory.PairCreated.contractRegister(({ event, context }) => {
  const { token0, token1, pair } = event.params;
  
  // ✅ Register the pair contract for indexing
  context.addMetaCowPair(pair);
  
  context.log.info(`✅ Pair registered: ${pair} (${token0}/${token1})`);
});

/**
 * Regular handler for PairCreated - Creates the entity
 */
MetaCowFactory.PairCreated.handler(async ({ event, context }) => {
  const { token0, token1, pair } = event.params;
  
  // Create Pair entity
  context.Pair.set({
    id: pair.toLowerCase(),
    token0: token0.toLowerCase(),
    token1: token1.toLowerCase(),
    reserve0: 0n,
    reserve1: 0n,
    totalSwaps: 0,
    lastSyncAt: event.block.timestamp,
  });
});

/**
 * Handler for Sync event
 */
MetaCowPair.Sync.handler(async ({ event, context }) => {
  const pairAddress = event.srcAddress.toLowerCase();
  const { reserve0, reserve1 } = event.params;

  const pair = await context.Pair.get(pairAddress);
  
  if (pair) {
    context.Pair.set({
      ...pair,
      reserve0: BigInt(reserve0),
      reserve1: BigInt(reserve1),
      lastSyncAt: event.block.timestamp,
    });
  }
});

/**
 * Handler for Swap event
 */
MetaCowPair.Swap.handler(async ({ event, context }) => {
  const pairAddress = event.srcAddress.toLowerCase();
  const { sender, amount0In, amount1In, amount0Out, amount1Out, to } = event.params;

  const swapId = `${event.transaction.hash}-${event.logIndex}`;
  
  context.SwapEvent.set({
    id: swapId,
    pairAddress,
    sender: sender.toLowerCase(),
    amount0In: BigInt(amount0In),
    amount1In: BigInt(amount1In),
    amount0Out: BigInt(amount0Out),
    amount1Out: BigInt(amount1Out),
    to: to.toLowerCase(),
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
    blockNumber: event.block.number,
  });

  const pair = await context.Pair.get(pairAddress);
  
  if (pair) {
    context.Pair.set({
      ...pair,
      totalSwaps: pair.totalSwaps + 1,
      lastSyncAt: event.block.timestamp,
    });
  }

  context.log.info(`💱 Swap indexed: ${swapId}`);
});