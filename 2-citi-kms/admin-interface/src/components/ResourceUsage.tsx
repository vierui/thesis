import React, { useState } from 'react'
import { useEffect, useRef } from 'react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import NetworkChart from './NetworkChart'

ChartJS.register(ArcElement, Tooltip, Legend);

const DonutChart = ({ value }: {value: number}) => {
    const getColor = (usage: number) => {
        return usage < 40 ? '#1d4ed8' : usage < 70 ? '#d97706' : '#dc2626'
    }
    const data = {
      datasets: [
        {
          data: [value, 100-value],
          backgroundColor: [getColor(value), '#e2e8f0'],
          borderRadius: [50, 0],
        }
      ]
    };
  
    const options = {
        responsive: true,
        maintainAspectRation: true,
        cutout: "80%",
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
          }
        },


      };
  
    return (
      <div style={{ width: '150px', height: '150px' }} className='m-auto'>
        <Doughnut data={data} options={options} />
      </div>
    );
};



interface NetworkData {
  time: string,
  value: number | string
}

const ResourceUsage = () => {
    const [stats, setStats] = useState(null)
    const [error, setError] = useState<null | string>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [sentData, setSentData] = useState<NetworkData[]>([])
    const [recieveData, setReceiveData] = useState<NetworkData[]>([])
    const intervalIdRef = useRef(null)

    const formatNetworkData = (newSentVal: number, newReceiveVal: number) => {
      const now = new Date();
      let hours = String(now.getHours()).padStart(2, '0')
      let minutes = String(now.getMinutes()).padStart(2, '0')
      let seconds = String(now.getSeconds()).padStart(2, '0')

      setSentData(prevSentData => {
        let newSentData = [...prevSentData, { time: `${hours}:${minutes}:${seconds}`, value: newSentVal }]
        if (newSentData.length > 30) {
          newSentData.shift()
        } else {
          const additionalPair: NetworkData[] = []
          for (let i = 30; i > newSentData.length; i--) {
            const time = new Date(now.getTime() - i * 1000)
            hours = String(time.getHours()).padStart(2, '0')
            minutes = String(time.getMinutes()).padStart(2, '0')
            seconds = String(time.getSeconds()).padStart(2, '0')
            additionalPair.push({ time: `${hours}:${minutes}:${seconds}`, value: 0 })
          }
          newSentData = [...additionalPair, ...newSentData]
        }
        return newSentData
      });

      setReceiveData(prevReceiveData => {
        let newReceiveData = [...prevReceiveData, { time: `${hours}:${minutes}:${seconds}`, value: newReceiveVal }]
        if (newReceiveData.length > 30) {
          newReceiveData.shift()
        } else {
          const additionalPair: NetworkData[] = []
          for (let i = 30; i > newReceiveData.length; i--) {
            const time = new Date(now.getTime() - i * 1000)
            hours = String(time.getHours()).padStart(2, '0')
            minutes = String(time.getMinutes()).padStart(2, '0')
            seconds = String(time.getSeconds()).padStart(2, '0')
            additionalPair.push({ time: `${hours}:${minutes}:${seconds}`, value: 0 })
          }
          newReceiveData = [...additionalPair, ...newReceiveData]
        }
        return newReceiveData
      })
    }    

    useEffect(() => {
        const fetchData = async () => {
            const res = await fetch(`/api/informations/resource-usage`)
            if (!res.ok) {
              setError("An error has occured")
              setIsLoading(false)
            }
            else {
              const data = await res.json()
              formatNetworkData(data.payload.sentNetworkData, data.payload.receivedNetworkData)
              setStats(data.payload)
              setError(null)
              setIsLoading(false)

              if (!intervalIdRef.current) {
                intervalIdRef.current = setInterval(fetchData, 1000)
              }
            }
        }
        fetchData()

        return () => {
          if (intervalIdRef.current) {
            clearInterval(intervalIdRef.current)
          }
        }
    }, [])

  return (
    <div className='pb-5'>
        <h1 className="text-xl font-semibold">Resource Consumption</h1>
        {isLoading ?
        <div className='h-[140px] w-full animate-pulse bg-slate-100 rounded-lg mt-4'></div>
        :
        error ? 
        <div className='h-[140px] w-full text-red-600 flex justify-center items-center'>
          { error }
        </div>
        :
        <div className="flex flex-wrap gap-x-5 gap-y-7 justify-around py-4">
            <div className="flex flex-col gap-2 items-center">
                <div className="relative w-fit">
                    <DonutChart value={stats.memoryUsage}/>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <h3 className="font-medium">RAM</h3>
                        <h3 className="text-2xl font-bold">{stats.memoryUsage.toFixed(2)} %</h3>
                    </div>
                </div>
                <h3 className="font-semibold">{ (stats.usedMemory / (1024*1024*1024)).toFixed(2) } / { (stats.availableMemory / (1024*1024*1024)).toFixed(2) } Gi</h3>
            </div>
            <div className="flex flex-col gap-2 items-center">
                <div className="relative w-fit">
                    <DonutChart value={stats.cpuUsage}/>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <h3 className="font-medium">CPU</h3>
                        <h3 className="text-2xl font-bold">{stats.cpuUsage.toFixed(2)} %</h3>
                    </div>
                </div>
                <h3 className="font-semibold">{ stats.numberCpus } CPUs</h3>
            </div>
            <NetworkChart sentData={sentData} receiveData={recieveData}/>
        </div>
        }
    </div>
  )
}

export default ResourceUsage