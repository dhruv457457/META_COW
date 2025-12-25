"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Token } from "@/utils/tokens";
import { ChartDataPoint } from "@/utils/chartUtils";

interface SwapChartProps {
  tokenA: Token | null;
  tokenB: Token | null;
  data: ChartDataPoint[];
  loading?: boolean;
}

export default function SwapChart({ tokenA, tokenB, data, loading }: SwapChartProps) {
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatPrice = (price: number) => {
    if (price > 1000) return price.toFixed(0);
    if (price > 1) return price.toFixed(2);
    if (price > 0.01) return price.toFixed(4);
    return price.toFixed(6);
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6 h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span>📈</span>
          <span>Price Chart</span>
          {loading && <span className="text-sm text-gray-400">(Loading...)</span>}
        </h3>
        {tokenA && tokenB && (
          <p className="text-sm text-gray-500 mt-1">
            {tokenA.symbol}/{tokenB.symbol} • Real-time price
          </p>
        )}
      </div>

      <div className="flex-1 min-h-0">
        {!tokenA || !tokenB ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p>Select tokens to view chart</p>
            </div>
          </div>
        ) : data.length === 0 && !loading ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-sm">No trading data yet</p>
              <p className="text-xs mt-1">Make the first swap!</p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-gray-500">Loading chart data...</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTime}
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                tickFormatter={formatPrice}
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                width={80}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '8px 12px'
                }}
                labelFormatter={formatTime}
                formatter={(value: number) => [formatPrice(value), 'Price']}
              />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke="#9333ea" 
                strokeWidth={2}
                fill="url(#colorPrice)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {data.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-500">Current</div>
            <div className="text-sm font-bold text-gray-800">
              {formatPrice(data[data.length - 1].price)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">High</div>
            <div className="text-sm font-bold text-green-600">
              {formatPrice(Math.max(...data.map(d => d.price)))}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Low</div>
            <div className="text-sm font-bold text-red-600">
              {formatPrice(Math.min(...data.map(d => d.price)))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}