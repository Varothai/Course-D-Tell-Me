"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell
} from "recharts"
import { Star } from 'lucide-react'

export function RatingChart({ data }: { data: Record<number, number> }) {
  // Transform data and calculate total reviews
  const totalReviews = Object.values(data).reduce((sum, count) => sum + count, 0)
  
  const chartData = [5, 4, 3, 2, 1].map(rating => ({
    rating: `${rating} ${rating === 1 ? 'STAR' : 'STAR'}`,
    count: data[rating] || 0,
    percentage: totalReviews ? Math.round((data[rating] || 0) / totalReviews * 100) : 0
  }))

  const maxCount = Math.max(...chartData.map(item => item.count))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-2xl font-bold">
        <span>{(totalReviews ? 
          chartData.reduce((sum, item) => sum + item.count * parseInt(item.rating), 0) / totalReviews 
          : 0).toFixed(1)}</span>
        <span className="text-sm text-muted-foreground">OUT OF</span>
        <span>5 STAR</span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, maxCount]} hide />
          <YAxis 
            dataKey="rating" 
            type="category" 
            axisLine={false}
            tickLine={false}
          />
          <Bar 
            dataKey="count" 
            fill="#8884d8"
            radius={[0, 4, 4, 0]}
            label={(props) => {
              const { x, y, width, value, index } = props
              const item = chartData[index]
              return (
                <text 
                  x={x + width + 10} 
                  y={y + 15} 
                  fill="#666" 
                  textAnchor="start"
                >
                  {`${value}`}
                </text>
              )
            }}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill="#7C3AED" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

