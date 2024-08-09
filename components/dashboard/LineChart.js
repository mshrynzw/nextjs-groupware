import React, { useEffect, useRef } from "react"
import { Chart, registerables } from "chart.js"

Chart.register(...registerables)

const LineChart = () => {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext("2d")

      const config = {
        type: "line",
        data: {
          labels: [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
          ],
          datasets: [
            {
              label: new Date().getFullYear().toString(),
              backgroundColor: "#4c51bf",
              borderColor: "#4c51bf",
              data: [65, 78, 66, 44, 56, 67, 75],
              fill: false,
              tension: 0.4,
            },
            {
              label: (new Date().getFullYear() - 1).toString(),
              fill: false,
              backgroundColor: "#fff",
              borderColor: "#fff",
              data: [40, 68, 86, 74, 56, 60, 87],
              tension: 0.4,
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          responsive: true,
          plugins: {
            legend: {
              labels: {
                color: "white",
              },
              align: "end",
              position: "bottom",
            },
            title: {
              display: false,
              text: "Sales Charts",
              color: "white",
            },
          },
          interaction: {
            intersect: false,
            mode: "index",
          },
          scales: {
            x: {
              grid: {
                display: false,
                drawBorder: false,
                drawOnChartArea: false,
              },
              ticks: {
                color: "rgba(255,255,255,.7)",
              },
            },
            y: {
              grid: {
                borderDash: [3],
                borderDashOffset: [3],
                drawBorder: false,
                drawOnChartArea: true,
                drawTicks: false,
                color: "rgba(255, 255, 255, 0.15)",
              },
              ticks: {
                color: "rgba(255,255,255,.7)",
              },
            },
          },
        },
      }

      // 既存のチャートインスタンスを破棄
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }

      // 新しいチャートインスタンスを作成
      chartInstance.current = new Chart(ctx, config)
    }

    // クリーンアップ関数
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [])

  return (
    <>
      <div className="relative mb-6 flex w-full min-w-0 flex-col break-words rounded shadow-lg bg-blueGray-700">
        <div className="mb-0 rounded-t bg-transparent px-4 py-3">
          <div className="flex flex-wrap items-center">
            <div className="relative w-full max-w-full flex-1 flex-grow">
              <h6 className="mb-1 text-xs font-semibold uppercase text-blueGray-100">
                Overview
              </h6>
              <h2 className="text-xl font-semibold text-white">Sales value</h2>
            </div>
          </div>
        </div>
        <div className="flex-auto p-4">
          <div className="relative h-350-px">
            <canvas ref={chartRef}></canvas>
          </div>
        </div>
      </div>
    </>
  )
}

export default LineChart