"use client"
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { TbClipboardCheck, TbClipboardList, TbClipboardData, TbClipboardCopy } from "react-icons/tb";
import { MdOutlineThumbUp, MdThumbDownOffAlt } from "react-icons/md";
import { IoIosStar, IoIosTimer } from "react-icons/io";
import { PersonIcon, FileIcon, LockClosedIcon } from '@radix-ui/react-icons';
import DatePicker from '@/components/DatePicker';
import PerformanceCard from '@/components/PerformanceCard';
import Card from '@/components/Card';
import Chart from '@/components/Chart';
import ResourceUsage from '@/components/ResourceUsage';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getSearchParams } from '@/utils';
import { useMediaQuery } from 'react-responsive';

const SystemPerformance = () => {
  const [averageResponseTime, setAverageResponseTime] = useState<number>(-1)
  const [f1Score, setF1Score] = useState<string>("-1")
  const [bleuScore, setBleuScore] = useState<string>("-1")
  const [perplexityScore, setPerplexityScore] = useState<string>("-1")
  const [rogueScore, setRogueScore] = useState<string>("-1")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/informations/system-metrics")
      const data = await res.json()
      if (!res.ok) setError("Failed fetching the data")
      else {
        setAverageResponseTime(data.payload.avgResponseTime)
        setError(null)
      }
      setIsLoading(false)
    }
    fetchData()
  }, [])

  return (
      <div className="pb-3">
        <h1 className='text-xl font-semibold pb-4'>System Performance</h1>
        {isLoading ?
        <div className="border rounded-lg flex flex-col lg:flex-row lg:flex-wrap justify-start p-4 gap-x-2 gap-y-4 shadow">
          <div className="bg-slate-100 w-full h-32 animate-pulse rounded-lg">
          </div>
        </div>
        :
        error ?
        <div className="border rounded-lg h-32 flex flex-col lg:flex-row lg:flex-wrap justify-center items-center p-4 gap-x-2 gap-y-4 shadow">
          <p className='text-red-700'>{ error }</p>
        </div>
        :
        <div className="border rounded-lg flex flex-col lg:flex-row lg:flex-wrap justify-start py-4 gap-x-2 gap-y-4 shadow">
            <PerformanceCard icon={<IoIosTimer size={40} className='text-blue-700'/>} 
            title='Average Response Time' 
            value={averageResponseTime.toString()} unit='ms'/>
            <PerformanceCard icon={<TbClipboardData size={40} className='text-blue-700'/>} 
            title='F1-Score' 
            value={f1Score} setter={setF1Score}/>
            <PerformanceCard icon={<TbClipboardCheck size={40} className='text-blue-700'/>} 
            title='BLEU Score' 
            value={bleuScore} setter={setBleuScore}/>
            <PerformanceCard icon={<TbClipboardList size={40} className='text-blue-700'/>} 
            title='Perplexity Score' 
            value={perplexityScore} setter={setPerplexityScore}/>
            <PerformanceCard icon={<TbClipboardCopy size={40} className='text-blue-700'/>} 
            title='Rogue Score' 
            value={rogueScore} setter={setRogueScore}/>
        </div>
        }
      </div>
  )
}

const Page = () => {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  const { data:session } = useSession()
  const [chosenDate, setChosenDate] = useState<Date | undefined>(searchParams.get('date') ? new Date(searchParams.get('date')) : new Date())
  const [hasMounted, setHasMounted] = useState(false);
  const isTablet = useMediaQuery({ maxWidth: 1023 })
  
  const handleLoadUsersCount = async () => {
    const res = await fetch(`/api/informations/users-count?date=${searchParams.get('date') !== null ? searchParams.get('date') : new Date().toDateString()}`)
    const data = await res.json()
    if (!res.ok) return null
    return data.payload as number
  }

  const handleLoadPublicDocsCount = async () => {
    const res = await fetch(`/api/informations/public-documents-count?date=${searchParams.get('date') !== null ? searchParams.get('date') : new Date().toDateString()}`)
    const data = await res.json()
    if (!res.ok) return null
    return data.payload as number
  }

  const handleLoadPrivateDocsCount = async () => {
    const res = await fetch(`/api/informations/private-documents-count?date=${searchParams.get('date') !== null ? searchParams.get('date') : new Date().toDateString()}`)
    const data = await res.json()
    if (!res.ok) return null
    return data.payload as number
  }

  const handleLoadLikesCount = async () => {
    const res = await fetch(`/api/informations/total-likes?date=${searchParams.get('date') !== null ? searchParams.get('date') : new Date().toDateString()}`)
    const data = await res.json()
    if (!res.ok) return null
    return data.payload as number
  }

  const handleLoadDislikesCount = async () => {
    const res = await fetch(`/api/informations/total-dislikes?date=${searchParams.get('date') !== null ? searchParams.get('date') : new Date().toDateString()}`)
    const data = await res.json()
    if (!res.ok) return null
    return data.payload as number
  }

  const handleLoadAvgRating = async () => {
    const res = await fetch(`/api/informations/avg-rating?date=${searchParams.get('date') !== null ? searchParams.get('date') : new Date().toDateString()}`)
    const data = await res.json()
    if (!res.ok) return null
    return data.payload as number
  }

  const handleSelectDate = (newDate: Date) => {
    let date = newDate ? newDate : new Date()
    console.log("UTC: ", date.toUTCString());
    console.log("NORMAL: ", date.toDateString());
    
    setChosenDate(date)
    const params = getSearchParams(date.toDateString(),'date',searchParams)
    replace(`${pathname}?${params.toString()}`)
  }

  useEffect(() => {
    setHasMounted(true);
  }, []);

    
  return (
    <div className='flex flex-col m-auto px-12 py-9 max-w-[1200px]'>
        <div className="flex gap-4 justify-between items-center">
          <div>
            <h1 className='font-bold text-xl md:text-2xl'>Hello, { session?.user?.name }</h1>
            <p className="text-neutral-400 text-xs md:text-sm font-normal">Manage users and documents of your knowlege center</p>
          </div>
          {hasMounted && <DatePicker date={chosenDate} onSelect={handleSelectDate} size={isTablet ? "sm" : "lg"}/>}
        </div>
        <div className="flex flex-wrap items-center gap-4 py-8">
           <Card icon={PersonIcon} title='Total Users' fetchFunction={handleLoadUsersCount}/>
           <Card icon={FileIcon} iconBgColor='bg-yellow-700' title='Public Documents' fetchFunction={handleLoadPublicDocsCount}/>
           <Card icon={LockClosedIcon} iconBgColor='bg-purple-700' title='Private Documents' fetchFunction={handleLoadPrivateDocsCount}/>
           <Card icon={MdOutlineThumbUp} iconBgColor='bg-sky-700' title='Total Likes' fetchFunction={handleLoadLikesCount}/>
           <Card icon={MdThumbDownOffAlt} iconBgColor='bg-pink-700' title='Total Dislikes' fetchFunction={handleLoadDislikesCount}/>
           <Card icon={IoIosStar} iconBgColor='bg-orange-700' title='Average Rating out of 5' fetchFunction={handleLoadAvgRating}/>
        </div>
        <ResourceUsage/>
        <SystemPerformance/>
        <Chart/>
    </div>
  )

  const ChatComponent = () => {
    const { input, handleInputChange, handleSubmit, messages } = useChat();

    return (
      <div className="relative max-h-screen overflow-scroll" id="message-container">
        <div className="sticky top-0 inset-x-0 p-2 bg-white h-fit">
          <h3 className="text-xl font-bold">Chat</h3>
        </div>
        <MessageList messages={messages} />
        <form onSubmit={handleSubmit} className="sticky bottom-0 inset-x-0 px-2 py-4 bg-white">
          <div className="flex">
            <Input value={input} onChange={handleInputChange} placeholder="Ask any question" className="w-full" />
            <Button className="bg-blue-600 ml-2">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    );
  };

}

export default Page