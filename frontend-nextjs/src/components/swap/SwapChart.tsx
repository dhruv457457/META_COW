"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Token } from "@/utils/tokens";
import { ChartDataPoint } from "@/utils/chartUtils";

interface SwapChartProps {
  tokenA: Token | null;
  tokenB: Token | null;
  data: ChartDataPoint[];
  loading?: boolean;
}

type TimeFrame = '1H' | '4H' | '1D' | '1W' | '1M' | 'ALL';

interface TimeFrameConfig {
  label: string;
  seconds: number;
  format: (date: Date) => string;
}

const timeFrames: Record<TimeFrame, TimeFrameConfig> = {
  '1H': { 
    label: '1 Hour', 
    seconds: 3600,
    format: (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  },
  '4H': { 
    label: '4 Hours', 
    seconds: 14400,
    format: (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  },
  '1D': { 
    label: '1 Day', 
    seconds: 86400,
    format: (date) => date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit' })
  },
  '1W': { 
    label: '1 Week', 
    seconds: 604800,
    format: (date) => date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  },
  '1M': { 
    label: '1 Month', 
    seconds: 2592000,
    format: (date) => date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  },
  'ALL': { 
    label: 'All Time', 
    seconds: Infinity,
    format: (date) => date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }
};

// Icons
const ClockIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChevronLeftIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRightIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const ArrowTrendingUpIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
  </svg>
);

export default function SwapChart({ tokenA, tokenB, data, loading }: SwapChartProps) {
const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('ALL');
  const [filteredData, setFilteredData] = useState<ChartDataPoint[]>([]);
  const [offset, setOffset] = useState(0); // For navigating history
  const [hasDataInCurrentView, setHasDataInCurrentView] = useState(true);
  const [lastTradeTimestamp, setLastTradeTimestamp] = useState<number | null>(null);

  useEffect(() => {
    if (!data || data.length === 0) {
      setFilteredData([]);
      setHasDataInCurrentView(false);
      setLastTradeTimestamp(null);
      return;
    }

    // Find the most recent trade timestamp
    const latestTrade = Math.max(...data.map(d => d.timestamp));
    setLastTradeTimestamp(latestTrade);

    const now = Math.floor(Date.now() / 1000);
    const timeFrameConfig = timeFrames[selectedTimeFrame];
    const startTime = selectedTimeFrame === 'ALL' 
      ? 0 
      : now - timeFrameConfig.seconds - offset;

    const filtered = data.filter(point => {
      if (selectedTimeFrame === 'ALL') return true;
      return point.timestamp >= startTime && point.timestamp <= (now - offset);
    });

    setFilteredData(filtered);
    setHasDataInCurrentView(filtered.length > 0);
  }, [data, selectedTimeFrame, offset]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return timeFrames[selectedTimeFrame].format(date);
  };

  const formatPrice = (price: number) => {
    if (price > 1000) return price.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (price > 1) return price.toFixed(2);
    if (price > 0.01) return price.toFixed(4);
    return price.toFixed(6);
  };

  const getPriceChange = () => {
    if (filteredData.length < 2) return { value: 0, percent: 0 };
    const first = filteredData[0].price;
    const last = filteredData[filteredData.length - 1].price;
    const change = last - first;
    const percent = (change / first) * 100;
    return { value: change, percent };
  };

  const priceChange = getPriceChange();
  const isPositive = priceChange.value >= 0;

  const canGoBack = offset + timeFrames[selectedTimeFrame].seconds < (Date.now() / 1000);
  const canGoForward = offset > 0;

  const handleNavigateBack = () => {
    if (selectedTimeFrame === 'ALL') return;
    setOffset(prev => prev + timeFrames[selectedTimeFrame].seconds);
  };

  const handleNavigateForward = () => {
    if (offset === 0) return;
    setOffset(prev => Math.max(0, prev - timeFrames[selectedTimeFrame].seconds));
  };

  const handleTimeFrameChange = (tf: TimeFrame) => {
    setSelectedTimeFrame(tf);
    setOffset(0); // Reset to current when changing timeframe
  };

  const jumpToLastTrade = () => {
    if (!lastTradeTimestamp || !data || data.length === 0) return;
    
    const now = Math.floor(Date.now() / 1000);
    const timeSinceLastTrade = now - lastTradeTimestamp;
    
    // Calculate offset needed to show the last trade
    const timeFrameConfig = timeFrames[selectedTimeFrame];
    if (selectedTimeFrame === 'ALL') {
      setOffset(0);
      return;
    }
    
    // Set offset to center the view around the last trade
    const newOffset = Math.max(0, timeSinceLastTrade - (timeFrameConfig.seconds / 2));
    setOffset(newOffset);
  };

  const autoFindNearestData = () => {
    if (!data || data.length === 0 || selectedTimeFrame === 'ALL') return;
    
    const now = Math.floor(Date.now() / 1000);
    const timeFrameConfig = timeFrames[selectedTimeFrame];
    
    // Find the nearest trade before current view
    const latestTrade = Math.max(...data.map(d => d.timestamp));
    const timeSinceLastTrade = now - offset - latestTrade;
    
    if (timeSinceLastTrade > 0) {
      // There's a gap, jump to show the last trade
      jumpToLastTrade();
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 h-full flex flex-col">
      {/* Header with Token Pair */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ArrowTrendingUpIcon className="w-6 h-6 text-purple-600" />
              <span>Price Chart</span>
            </h3>
            {tokenA && tokenB && (
              <p className="text-sm text-gray-500 mt-1">
                {tokenA.symbol}/{tokenB.symbol}
              </p>
            )}
          </div>
          
          {/* Current Price & Change */}
          {filteredData.length > 0 && (
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {formatPrice(filteredData[filteredData.length - 1].price)}
              </div>
              <div className={`text-sm font-semibold flex items-center justify-end gap-1 ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                <span>{isPositive ? '↗' : '↘'}</span>
                <span>{isPositive ? '+' : ''}{priceChange.percent.toFixed(2)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Time Frame Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
            {(Object.keys(timeFrames) as TimeFrame[]).map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeFrameChange(tf)}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                  selectedTimeFrame === tf
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Navigation Controls */}
          {selectedTimeFrame !== 'ALL' && (
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={handleNavigateBack}
                disabled={!canGoBack || loading}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Go back in time"
              >
                <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={handleNavigateForward}
                disabled={!canGoForward || loading}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Go forward in time"
              >
                <ChevronRightIcon className="w-4 h-4 text-gray-600" />
              </button>
              {offset > 0 && (
                <button
                  onClick={() => setOffset(0)}
                  className="px-3 py-2 rounded-lg bg-purple-100 text-purple-700 text-xs font-semibold hover:bg-purple-200 transition-colors"
                >
                  Now
                </button>
              )}
              {!hasDataInCurrentView && data && data.length > 0 && (
                <button
                  onClick={jumpToLastTrade}
                  className="px-3 py-2 rounded-lg bg-orange-100 text-orange-700 text-xs font-semibold hover:bg-orange-200 transition-colors border border-orange-300 ml-1"
                  title="Jump to the most recent trade"
                >
                  Find Data
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 min-h-0">
        {!tokenA || !tokenB ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-5xl mb-3">📊</div>
              <p className="text-lg font-semibold">Select tokens to view chart</p>
              <p className="text-sm mt-1">Choose a trading pair to get started</p>
            </div>
          </div>
        ) : filteredData.length === 0 && !loading ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-5xl mb-3">📭</div>
              <p className="text-lg font-semibold">No trading data</p>
              <p className="text-sm mt-1 mb-4">
                {offset > 0 
                  ? 'No trades in this time period' 
                  : data && data.length > 0
                    ? `Last trade was ${Math.floor((Date.now()/1000 - lastTradeTimestamp!) / 86400)} days ago`
                    : 'Make the first swap to see the chart!'}
              </p>
              {data && data.length > 0 && lastTradeTimestamp && (
                <button
                  onClick={jumpToLastTrade}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg"
                >
                  <ClockIcon className="w-4 h-4" />
                  Jump to Last Trade
                </button>
              )}
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-gray-500 font-semibold">Loading chart data...</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTime}
                stroke="#9ca3af"
                style={{ fontSize: '11px' }}
                minTickGap={50}
              />
              <YAxis 
                tickFormatter={formatPrice}
                stroke="#9ca3af"
                style={{ fontSize: '11px' }}
                width={70}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.98)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
                labelFormatter={formatTime}
                formatter={(value: number) => [
                  <span className="font-bold">{formatPrice(value)}</span>, 
                  <span className="text-gray-600">Price</span>
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke={isPositive ? "#10b981" : "#ef4444"}
                strokeWidth={2.5}
                fill="url(#colorPrice)"
                dot={false}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Stats Footer */}
      {filteredData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Open</div>
              <div className="text-sm font-bold text-gray-900">
                {formatPrice(filteredData[0].price)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">High</div>
              <div className="text-sm font-bold text-green-600">
                {formatPrice(Math.max(...filteredData.map(d => d.price)))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Low</div>
              <div className="text-sm font-bold text-red-600">
                {formatPrice(Math.min(...filteredData.map(d => d.price)))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Close</div>
              <div className="text-sm font-bold text-gray-900">
                {formatPrice(filteredData[filteredData.length - 1].price)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Period Indicator */}
      {offset > 0 && (
        <div className="mt-3 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
            <ClockIcon className="w-4 h-4" />
            <span>
              Viewing {timeFrames[selectedTimeFrame].label} from {
                new Date((Date.now() / 1000 - offset) * 1000).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
}