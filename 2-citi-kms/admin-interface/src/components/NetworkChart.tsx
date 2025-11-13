"use client"
import React from 'react'
import { Chart as ChartJs, LineElement, PointElement, CategoryScale, LinearScale, TimeScale, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2'

ChartJs.register(LineElement, PointElement, CategoryScale, LinearScale, TimeScale, Tooltip, Legend, Filler)

const chartOption = {
    responsive:true,
    maintainAspectRatio: false,
    animation: {
        duration: 0
    },
    mouseLine: {
        color: 'blue'
    },
    plugins: {
        legend: {
            display: true,
            labels:{
                boxHeight: 1,
                font: { family: "'Roboto', sans-serif"}
            },
            align: 'end' as const
        },
    },
    scales: {
        y: {
            grid: {
                display: true
            },
            border: {
                display: false
            },
            ticks: {
                display: true,
                stepSize: 200
            }
        },
        x: {
            title:{ 
                display: false
            },
            grid: {
                display: false,
            },
            ticks: {
                display: true,
                fontFamily: "'Roboto', sans-serif",
                padding: 15
            }
        }
    }
}

const configureDatasets = (data1: any[], data2: any[]) => {
    return {
        datasets: [
            {
                label: "O in Kbps",
                data: data1,
                parsing: {
                    xAxisKey: 'time',
                    yAxisKey: 'value'
                },
                borderColor: 'rgb(29, 78, 216)',
                pointRadius: 0,
                pointHoverRadius: 7,
                pointHoverBackgroundColor: 'rgba(29, 78, 216, 0.2)',
                pointHoverBorderColor: '#93c5fd',
                pointHoverBorderWidth: 1,
                tension: 0,
            },
            {
                label: "I in Kbps",
                data: data2,
                parsing: {
                    xAxisKey: 'time',
                    yAxisKey: 'value'
                },
                borderColor: 'rgba(245, 158, 11, 1)',
                pointRadius: 0,
                pointHoverRadius: 7,
                pointHoverBackgroundColor: 'rgba(245, 158, 11, 0.2)',
                pointHoverBorderColor: '#fcd34d',
                pointHoverBorderWidth: 1,
                tension: 0,
            },
        ]
    }
}


const NetworkChart = ({ receiveData, sentData }: { receiveData: any[], sentData: any[] }) => {
    return (
    <div className="flex flex-col w-full sm:w-fit">
        <h1 className="font-medium">Network I/O: <s className='ml-2 no-underline outline-none font-semibold'>{ receiveData[29].value } KB / { sentData[29].value } KB</s></h1>
        <div className="overflow-auto w-full">
            <div className='h-56 w-full min-w-[400px]'>
                <Line data={configureDatasets(sentData, receiveData)} options={chartOption}/>
            </div>
        </div>
    </div>
  )
}

export default NetworkChart