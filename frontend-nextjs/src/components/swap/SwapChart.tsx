"use client";

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area
} from "recharts";

interface ChartDataPoint {
  timestamp: number;
  price: number;
  volume?: number;
}

interface SwapChartProps {
  tokenA: { symbol: string } | null;
  tokenB: { symbol: string } | null;
  data: ChartDataPoint[];
  loading?: boolean;
}

export default function SwapChart({ tokenA, tokenB, data, loading }: SwapChartProps) {
  if (!tokenA || !tokenB) {
    return <div className="h-[300px] flex items-center justify-center text-gray-400 bg-gray-50 rounded-2xl">Select tokens to view chart</div>;
  }

  if (loading) {
    return <div className="h-[300px] flex items-center justify-center text-purple-500 bg-purple-50/50 rounded-2xl animate-pulse">Loading Chart Data...</div>;
  }

  if (data.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-gray-400 bg-gray-50 rounded-2xl">No historical data available</div>;
  }

  const currentPrice = data[data.length - 1]?.price || 0;
  const isPositive = data[0].price <= currentPrice;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          {tokenA.symbol} / {tokenB.symbol}
        </h3>
        <div className="flex items-end gap-3">
          <span className="text-3xl font-bold text-gray-900">{currentPrice.toFixed(6)}</span>
          <span className={`text-sm font-medium mb-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? '▲' : '▼'} 24h
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={(ts) => new Date(ts * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              domain={['auto', 'auto']}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
              labelFormatter={(ts) => new Date(ts * 1000).toLocaleString()}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#8b5cf6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorPrice)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}