"use client"
import React, { useEffect, useState } from 'react';
import { IconType } from 'react-icons/lib';
import { IconProps } from '@radix-ui/react-icons/dist/types';
import { useSearchParams } from 'next/navigation';


interface Props {
    icon: React.ElementType<IconProps> | IconType,
    title: string,
    description?:string | number,
    fetchFunction?: () => Promise<number | string | null>
    iconBgColor?: string
}

const Card = ({ icon: Icon, title, description, iconBgColor, fetchFunction} : Props) => {
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const searchParams = useSearchParams()
    const [displayValue, setDisplayValue] = useState<number | string>(-1 || description)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            const data = await fetchFunction()
            if (data !== null) {
                setDisplayValue(data)
                setError(null)
            }
            else setError("Error Fetching the data")
            setIsLoading(false)
        }
        fetchData()
    }, [searchParams])

  return (
    <div className={`w-full flex items-center lg:items-start lg:flex-col rounded-xl lg:w-56 p-3 gap-x-4 bg-slate-100 text-neutral-900 shadow`}>
            {typeof Icon === 'function' ? (
                <Icon className={`${isLoading && "animate-pulse"} h-auto shadow rounded-full bg-blue-700 text-white p-2 ${iconBgColor}`} size={40}/>
            ) : (
                <Icon width={"40"} height={"40"} className={`${isLoading && "animate-pulse"} h-auto shadow rounded-full bg-blue-700 text-white p-2 ${iconBgColor}`}/>
            )}
        {isLoading ? 
        <div className="animate-pulse pt-0 lg:pt-3 w-full">
            <div className="bg-slate-200 w-full lg:h-[72px] rounded-lg">
            </div>
        </div>
        : error ?
        <div className="pt-0 lg:pt-3">
            <p className="text-red-500 text-xs">{ error }</p>
        </div>
        :
        <div className='pt-0 lg:pt-3'>
            <h1 className="font-medium text-sm">
                { title }
            </h1>
            <div className="flex items-center text-4xl font-semibold gap-2">
              { displayValue }
              <div className="rounded-full px-1 text-xs bg-green-100 border border-green-700 text-green-900">
                +12%
                </div>
                <p className='text-xs font-normal'>from last month</p>
            </div>
        </div>
        }
    </div>
  )
}

export default Card