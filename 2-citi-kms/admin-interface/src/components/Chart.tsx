"use client"
import React, { useEffect, useState } from 'react';
import { Chart as ChartJs, LineElement, PointElement, CategoryScale, LinearScale, TimeScale, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { PastInteractionData } from '@/types';
import { useSearchParams } from 'next/navigation';

ChartJs.register(LineElement, PointElement, CategoryScale, LinearScale, TimeScale, Tooltip, Legend, Filler)

const formatDateDDMMM = (dateString:string) => {
  const [day, month, year] = dateString.split('-')
  const date = new Date(`${year}-${month}-${day}`)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const monthName = monthNames[date.getMonth()]

  return `${day} ${monthName}`
}

const chartOption = {
    maintainAspectRatio: false,
    mouseLine: {
        color: 'blue'
    },
    plugins: {
        legend: {
            display: false,
            labels:{
                boxHeight: 1,
                font: { family: "'Poppins', 'sans-serif'"}
            },
            align: 'end' as const
        },
    },
    scales: {
        y: {
            grid: {
                display: false
            },
            suggestedMax: 100,
            border: {
                display: false
            },
            ticks: {
                display: false
            }
        },
        x: {
            title:{ 
                display: false
            },
            grid: {
                display: true,
            },
            border: {
                display: false,
                dash: [4, 4],
            },
            ticks: {
                display: true,
                fontFamily: "'Roboto', sans-serif",
                padding: 15
            }
        }
    }
}

const configureDatasets = (data:any[]) => {
    return {
        datasets: [
            {
                label: "Number of interaction",
                data: data,
                parsing: {
                    xAxisKey: 'date',
                    yAxisKey: 'count'
                },
                borderColor: 'rgb(29, 78, 216)',
                pointRadius: 0,
                pointHoverRadius: 7,
                pointHoverBackgroundColor: 'rgba(29, 78, 216, 0.2)',
                pointHoverBorderColor: '#93c5fd',
                pointHoverBorderWidth: 1,
                backgroundColor: (context:any) => {
                    if(!context.chart.chartArea){
                        return;
                    }
                    const {ctx, _, chartArea: {top, bottom}} = context.chart;
                    const gradientBg = ctx.createLinearGradient(0, top, 0, bottom);
                    gradientBg.addColorStop(0, 'rgba(29, 78, 216, 0.2)');
                    gradientBg.addColorStop(0.2, 'rgba(29, 78, 216, 0.1)');
                    gradientBg.addColorStop(1, 'rgba(29, 78, 216, 0)')
                    return gradientBg;
                },
                tension: 0.4,
                fill: true,
            }
        ]
    }
}

const Chart = () => {
    const searchParams = useSearchParams()

    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [error, setError] = useState<null | string>(null)
    const [data, setData] = useState<PastInteractionData[] | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            const res = await fetch(`/api/informations/user-interactions?date=${searchParams.get('date') !== null ? searchParams.get('date') : new Date().toDateString()}`)
            if (!res.ok) setError("Error fetching chart data")
            else {
                const data = await res.json()
                const chartData:PastInteractionData[] = data.payload.map(item => {
                    return {...item, date: formatDateDDMMM(item.date)}
                })
                
                setData(chartData)
                setError(null)
            }
            setIsLoading(false)
        }
        fetchData()
    }, [searchParams])
    

    return (
    <div className='flex flex-col w-full rounded-xl bg-white border px-5 py-5 shadow'>
        <h1 className="text-xl font-semibold px-4 pt-2">Last 30 Days Interactions</h1>
        <p className="text-muted-foreground text-xs mb-7 px-4">The number of interactions since 30 days prior to the date chosen on the calendar.</p>
        <div className="w-full overflow-auto">
            <div className="h-[300px] min-w-[400px]">
                {isLoading ?
                <div className="w-full h-full animate-pulse rounded-lg bg-slate-200"></div>
                :
                error ? 
                <div className="w-full h-full flex items-center justify-center text-red-700">
                    { error }
                </div>
                :
                <Line data={configureDatasets(data)} options={chartOption}/>}
            </div>
        </div>
    </div>
  )
}

export default Chart