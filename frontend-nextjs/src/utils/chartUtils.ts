import { EnvioSwapEvent } from './envioClient';
import { ethers } from 'ethers';

/**
 * Chart data point interface
 */
export interface ChartDataPoint {
  timestamp: number;
  price: number;
  volume?: number;
}

/**
 * Transform Envio swap events into chart data
 * Calculates price as outputAmount / inputAmount for each swap
 */
export function transformSwapsToChartData(
  swaps: EnvioSwapEvent[],
  tokenA: { address: string; symbol: string },
  tokenB: { address: string; symbol: string }
): ChartDataPoint[] {
  if (!swaps || swaps.length === 0) return [];

  const chartData: ChartDataPoint[] = swaps
    .map((swap) => {
      // Determine the direction of the swap
      const isAtoB = swap.inputToken.toLowerCase() === tokenA.address.toLowerCase();
      
      // Calculate price based on direction
      let price: number;
      if (isAtoB) {
        // Swapping A → B, so price is how much B you get per A
        const inputBN = BigInt(swap.inputAmount);
        const outputBN = BigInt(swap.outputAmount);
        price = parseFloat(ethers.formatUnits(outputBN, 18)) / parseFloat(ethers.formatUnits(inputBN, 18));
      } else {
        // Swapping B → A, so price is inverse (how much A you get per B, inverted)
        const inputBN = BigInt(swap.inputAmount);
        const outputBN = BigInt(swap.outputAmount);
        const inversePrice = parseFloat(ethers.formatUnits(outputBN, 18)) / parseFloat(ethers.formatUnits(inputBN, 18));
        price = 1 / inversePrice;
      }

      // Volume in terms of tokenA
      const volume = isAtoB
        ? parseFloat(ethers.formatUnits(swap.inputAmount, 18))
        : parseFloat(ethers.formatUnits(swap.outputAmount, 18));

      return {
        timestamp: swap.timestamp,
        price,
        volume,
      };
    })
    .filter(point => point.price > 0 && isFinite(point.price))
    .sort((a, b) => a.timestamp - b.timestamp); // Sort by time ascending

  return chartData;
}

/**
 * Aggregate swap data into time buckets (e.g., 5 minutes, 1 hour)
 * Useful for reducing noise and showing trends
 */
export function aggregateChartData(
  data: ChartDataPoint[],
  bucketSizeSeconds: number = 300 // 5 minutes default
): ChartDataPoint[] {
  if (data.length === 0) return [];

  const buckets = new Map<number, { prices: number[]; volumes: number[] }>();

  data.forEach((point) => {
    const bucketKey = Math.floor(point.timestamp / bucketSizeSeconds) * bucketSizeSeconds;
    
    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, { prices: [], volumes: [] });
    }
    
    const bucket = buckets.get(bucketKey)!;
    bucket.prices.push(point.price);
    if (point.volume) bucket.volumes.push(point.volume);
  });

  const aggregated: ChartDataPoint[] = Array.from(buckets.entries())
    .map(([timestamp, { prices, volumes }]) => ({
      timestamp,
      price: prices.reduce((sum, p) => sum + p, 0) / prices.length, // Average price
      volume: volumes.reduce((sum, v) => sum + v, 0), // Total volume
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  return aggregated;
}

/**
 * Get price change percentage
 */
export function getPriceChange(data: ChartDataPoint[]): number {
  if (data.length < 2) return 0;
  
  const firstPrice = data[0].price;
  const lastPrice = data[data.length - 1].price;
  
  return ((lastPrice - firstPrice) / firstPrice) * 100;
}

/**
 * Get current price from latest swap
 */
export function getCurrentPrice(data: ChartDataPoint[]): number {
  if (data.length === 0) return 0;
  return data[data.length - 1].price;
}

/**
 * Calculate 24h volume
 */
export function get24hVolume(data: ChartDataPoint[]): number {
  const now = Math.floor(Date.now() / 1000);
  const oneDayAgo = now - 86400;

  return data
    .filter(point => point.timestamp >= oneDayAgo)
    .reduce((sum, point) => sum + (point.volume || 0), 0);
}

/**
 * Get OHLC data for candlestick charts
 */
export interface OHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function getOHLCData(
  data: ChartDataPoint[],
  bucketSizeSeconds: number = 3600 // 1 hour default
): OHLCData[] {
  if (data.length === 0) return [];

  const buckets = new Map<number, ChartDataPoint[]>();

  data.forEach((point) => {
    const bucketKey = Math.floor(point.timestamp / bucketSizeSeconds) * bucketSizeSeconds;
    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, []);
    }
    buckets.get(bucketKey)!.push(point);
  });

  const ohlc: OHLCData[] = Array.from(buckets.entries())
    .map(([timestamp, points]) => {
      const prices = points.map(p => p.price);
      return {
        timestamp,
        open: points[0].price,
        high: Math.max(...prices),
        low: Math.min(...prices),
        close: points[points.length - 1].price,
        volume: points.reduce((sum, p) => sum + (p.volume || 0), 0),
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp);

  return ohlc;
}