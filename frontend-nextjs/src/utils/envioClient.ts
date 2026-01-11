import { GraphQLClient } from 'graphql-request';

// Your deployed Envio indexer endpoint
const ENVIO_ENDPOINT = 'https://indexer.dev.hyperindex.xyz/e39b553/v1/graphql';

const client = new GraphQLClient(ENVIO_ENDPOINT);

/**
 * Swap Event from Envio
 * Matches schema.graphql: SwapEvent
 */
export interface EnvioSwapEvent {
  id: string;
  pairAddress: string;
  user: string;        // ✅ Updated from 'sender'
  inputToken: string;
  outputToken: string;
  inputAmount: string; // BigInt comes as string in JSON
  outputAmount: string;
  timestamp: number;
  txHash: string;
  blockNumber: number;
}

/**
 * Pair info from Envio
 * Matches schema.graphql: Pair
 */
export interface EnvioPair {
  id: string;
  tokenA: string;      // ✅ Updated from token0
  tokenB: string;      // ✅ Updated from token1
  reserveA: string;    // ✅ Updated from reserve0
  reserveB: string;    // ✅ Updated from reserve1
  totalSwaps: number;
  lastSyncAt: number;
}

/**
 * Get pair address for two tokens
 * Fetches all pairs and filters client-side (simplest for hackathon)
 */
export async function getPairInfo(tokenA: string, tokenB: string): Promise<EnvioPair | null> {
  const query = `
    query GetAllPairs {
      Pair {
        id
        tokenA
        tokenB
        reserveA
        reserveB
        totalSwaps
        lastSyncAt
      }
    }
  `;

  try {
    const data: any = await client.request(query);
    const pairs = data.Pair || [];
    
    // Filter client-side for matching token pair (either direction)
    const tA = tokenA.toLowerCase();
    const tB = tokenB.toLowerCase();
    
    const matchingPair = pairs.find((pair: EnvioPair) => 
      (pair.tokenA === tA && pair.tokenB === tB) ||
      (pair.tokenA === tB && pair.tokenB === tA)
    );

    return matchingPair || null;
  } catch (error) {
    console.error('Error fetching pair info:', error);
    return null;
  }
}

/**
 * Fetch recent swaps for a specific pair
 * Used for the Swap Chart
 */
export async function fetchPairSwaps(
  pairAddress: string,
  limit: number = 50
): Promise<EnvioSwapEvent[]> {
  const query = `
    query GetSwaps($pairAddress: String!, $limit: Int!) {
      SwapEvent(
        where: { pairAddress: { _eq: $pairAddress } }
        order_by: { timestamp: desc }
        limit: $limit
      ) {
        id
        pairAddress
        user          # ✅ Updated from sender
        inputToken
        outputToken
        inputAmount
        outputAmount
        timestamp
        txHash
        blockNumber
      }
    }
  `;

  try {
    const data: any = await client.request(query, {
      pairAddress: pairAddress.toLowerCase(),
      limit,
    });

    return data.SwapEvent || [];
  } catch (error) {
    console.error('Error fetching swaps:', error);
    return [];
  }
}

/**
 * Fetch swaps for specific tokens
 * Wrapper: Get Pair -> Get Swaps
 */
export async function fetchSwapsByTokens(
  tokenA: string,
  tokenB: string,
  limit: number = 50
): Promise<EnvioSwapEvent[]> {
  try {
    const pairInfo = await getPairInfo(tokenA, tokenB);
    
    if (!pairInfo) {
      console.log('No pair found for these tokens');
      return [];
    }

    return await fetchPairSwaps(pairInfo.id, limit);
    
  } catch (error) {
    console.error('Error fetching swaps by tokens:', error);
    return [];
  }
}

/**
 * Fetch latest swaps across all pairs
 * Used for the Social Feed
 */
export async function fetchLatestSwaps(limit: number = 20): Promise<EnvioSwapEvent[]> {
  const query = `
    query GetLatestSwaps($limit: Int!) {
      SwapEvent(
        order_by: { timestamp: desc }
        limit: $limit
      ) {
        id
        pairAddress
        user          # ✅ Updated from sender
        inputToken
        outputToken
        inputAmount
        outputAmount
        timestamp
        txHash
        blockNumber
      }
    }
  `;

  try {
    const data: any = await client.request(query, { limit });
    return data.SwapEvent || [];
  } catch (error) {
    console.error('Error fetching latest swaps:', error);
    return [];
  }
}

/**
 * Fetch user's swap history
 * Used for User Profile Page
 */
export async function fetchUserSwaps(
  userAddress: string,
  limit: number = 20
): Promise<EnvioSwapEvent[]> {
  const query = `
    query GetUserSwaps($user: String!, $limit: Int!) {
      SwapEvent(
        where: { user: { _eq: $user } }  # ✅ Updated from sender
        order_by: { timestamp: desc }
        limit: $limit
      ) {
        id
        pairAddress
        user
        inputToken
        outputToken
        inputAmount
        outputAmount
        timestamp
        txHash
        blockNumber
      }
    }
  `;

  try {
    const data: any = await client.request(query, {
      user: userAddress.toLowerCase(),
      limit,
    });

    return data.SwapEvent || [];
  } catch (error) {
    console.error('Error fetching user swaps:', error);
    return [];
  }
}