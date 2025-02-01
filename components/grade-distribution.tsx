"use client"

import { Pie } from "react-chartjs-2"
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'
import { useTheme } from "next-themes"
import { Review } from "@/types/review"

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
)

interface GradeDistributionProps {
  reviews: Review[]
}

export function GradeDistribution({ reviews }: GradeDistributionProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Calculate grade distribution
  const gradeDistribution = reviews.reduce((acc: { [key: string]: number }, review) => {
    if (review.grade) {
      acc[review.grade] = (acc[review.grade] || 0) + 1
    }
    return acc
  }, {})

  // Sort grades in descending order: A, B+, B, C+, C, D+, D, F
  const gradeOrder = ["A", "B+", "B", "C+", "C", "D+", "D", "F"]
  const sortedGrades = Object.entries(gradeDistribution)
    .sort(([a], [b]) => gradeOrder.indexOf(a) - gradeOrder.indexOf(b))

  // Simpler color scheme matching the image
  const gradeColors = {
    "A": { bg: "rgba(34, 197, 94, 0.9)" },    // bright green
    "B+": { bg: "rgba(59, 130, 246, 0.9)" },  // bright blue
    "B": { bg: "rgba(59, 130, 246, 0.9)" },   // bright blue
    "C+": { bg: "rgba(250, 204, 21, 0.9)" },  // yellow
    "C": { bg: "rgba(250, 204, 21, 0.9)" },   // yellow
    "D+": { bg: "rgba(249, 115, 22, 0.9)" },  // orange
    "D": { bg: "rgba(249, 115, 22, 0.9)" },   // orange
    "F": { bg: "rgba(239, 68, 68, 0.9)" },    // red
  }

  const data = {
    labels: sortedGrades.map(([grade]) => grade),
    datasets: [
      {
        data: sortedGrades.map(([_, count]) => count),
        backgroundColor: sortedGrades.map(([grade]) => 
          gradeColors[grade as keyof typeof gradeColors]?.bg || "rgba(156, 163, 175, 0.9)"
        ),
        borderWidth: 0,
      }
    ]
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: isDark ? '#e5e7eb' : '#374151',
          padding: 20,
          font: {
            size: 14,
            family: 'system-ui'
          },
          generateLabels: (chart: any) => {
            const data = chart.data
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, index: number) => {
                const value = data.datasets[0].data[index]
                const total = data.datasets[0].data.reduce((acc: number, curr: number) => acc + curr, 0)
                const percentage = ((value / total) * 100).toFixed(0)
                return {
                  text: `${label} ${percentage}%`,
                  fillStyle: data.datasets[0].backgroundColor[index],
                  hidden: false,
                  index
                }
              })
            }
            return []
          }
        }
      },
      tooltip: {
        enabled: false // Disable tooltips for cleaner look
      }
    },
    layout: {
      padding: 0
    },
    cutout: '0%' // Make it a full pie chart, not a donut
  }

  // Only show the chart if there are grades
  if (sortedGrades.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
        No grade data available
      </div>
    )
  }

  return (
    <div className="h-[300px] relative">
      <Pie data={data} options={options} />
    </div>
  )
} 