import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import RenderLoadingNotice from "../RenderLoadingNotice";

export default function SwapChart({
  tokenA,
  tokenB,
  chartData = [],
  onRefresh,
  onClearLive,
  loading,
}) {
  const maxPrice = Math.max(...chartData.map((p) => p.price), 0);
  const minPrice = Math.min(...chartData.map((p) => p.price), 0);
  const formatTime = (ts) => new Date(ts * 1000).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const currentPrice = chartData.at(-1)?.price || 0;

  return (
  <div className="rounded-xl border border-gray-100  px-6 py-5">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-gray-800 font-semibold text-lg">
          {tokenA?.symbol}/{tokenB?.symbol} Price Chart
        </h3>
        <div className="flex gap-3 items-center text-gray-500 text-sm">
          <span>{chartData.length} trades</span>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="hover:text-purple-600 transition"
            title="Refresh"
          >
            🔄
          </button>
          <button
            onClick={onClearLive}
            className="hover:text-red-600 transition"
            title="Clear chart"
          >
            🗑
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[300px]">
        {loading ? (
          <RenderLoadingNotice show={loading} />
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTime}
                tick={{ fontSize: 12 }}
                stroke="#ccc"
              />
              <YAxis
                domain={[minPrice * 0.95, maxPrice * 1.05]}
                tick={{ fontSize: 12 }}
                stroke="#ccc"
              />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="bg-white border border-gray-200 shadow-md rounded-md px-3 py-2 text-xs text-gray-700">
                      <div>{new Date(label * 1000).toLocaleString()}</div>
                      <div className="text-purple-600 font-semibold">
                        Price: {payload[0].value.toFixed(6)}
                      </div>
                    </div>
                  ) : null
                }
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#fff", stroke: "#8b5cf6", strokeWidth: 2 }}
                activeDot={{ r: 5, stroke: "#3b82f6", strokeWidth: 2 }}
              />
              <ReferenceLine
                y={currentPrice}
                stroke="#ccc"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-purple-700 bg-purple-100 rounded-xl">
            📉 No data yet. Try swapping or refresh!
          </div>
        )}
      </div>

      {/* Stats */}
      {!loading && (
        <div className="mt-5 grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-gray-500">Current Price</div>
            <div className="font-semibold text-purple-600">
              {currentPrice.toFixed(6)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">24h High</div>
            <div className="font-semibold text-green-600">
              {maxPrice.toFixed(6)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">24h Low</div>
            <div className="font-semibold text-red-600">
              {minPrice.toFixed(6)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
