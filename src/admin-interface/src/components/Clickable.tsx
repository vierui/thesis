import React, { useState } from 'react'
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover'
import { Cross1Icon } from '@radix-ui/react-icons'
import Loading from './Loading'

interface Props{
    children: React.ReactNode,
    setGlobalOptions: ([]) => void,
    options: string[]
    onClick: (value: string) => Promise<void>
}

const Clickable = ({ children, setGlobalOptions, options, onClick }: Props) => {
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isClicked, setIsClicked] = useState<boolean>(false)
    const [selectedOption, setSelectedOption] = useState<string | null>(children as string)
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [data, setData] = useState<string[]>(options)

    const handleUpdate = async (val:string) => {
        setSelectedOption(val)
        setIsLoading(true)
        await onClick(val)
        setIsLoading(false)
    }

    const handleSearchOptions = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
        if (e.target.value === "") setData(options)
        else {
            setData(options.filter(item => item.toLowerCase().includes(e.target.value.toLowerCase())))
        }
    }

    const handleCreateOption = () => {
        setSearchTerm("")
        handleUpdate(searchTerm)
        var newOptions = [...options, searchTerm]
        newOptions = newOptions.filter((item, index) => newOptions.indexOf(item) === index)

        setData(newOptions)
        setGlobalOptions(newOptions)
    }

    const onOpenChange = () => {
        if (!selectedOption) {
            setSelectedOption(children as string)
        }
        setIsClicked(!isClicked)
    }

    return (
    <Popover open={isClicked} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
            <button className='w-full'>
                <div className="font-normal text-center px-2 py-0.5 text-xs rounded-md bg-neutral-200 text-neutral-900 w-fit">{ children }</div>
            </button>
        </PopoverTrigger>
        <PopoverContent align='start' className='p-0 overflow-hidden border shadow-lg'>
            <div className="border-b">
                {isLoading ? <Loading size={10}/>
                : selectedOption ? 
                <div className="flex gap-2 text-center px-2 py-0.5 text-xs rounded-md bg-neutral-200 text-neutral-900 w-fit m-1.5">
                    { selectedOption }
                    <Cross1Icon  width={"10"} className='cursor-pointer' onClick={() => setSelectedOption(null)}/>
                </div>
                :
                <input type='text' value={searchTerm} onChange={(e) => handleSearchOptions(e)} placeholder='Search or replace...' className='w-full outline-none text-sm p-2'/>}
            </div>
            <h3 className="text-xs font-medium text-muted-foreground px-3 py-2">Select an option or replace with a new one</h3>
            {data.length !== 0 && <div className="Option Displayer flex flex-wrap gap-2 px-2 pb-2">
                {data.map(item => (
                    <button onClick={() => handleUpdate(item)} key={item} className="p-1 rounded-md bg-neutral-200 text-neutral-900 text-xs hover:shadow">
                        { item }
                    </button>
                ))}
            </div>}
            {searchTerm !== "" && data.indexOf(searchTerm) == -1 && 
            <div onClick={handleCreateOption} className='m-1 p-1 cursor-pointer rounded hover:bg-indigo-100 font-normal px-2 flex items-center gap-2 text-xs'>
                Replace with
                <div className="p-1 rounded bg-neutral-200 text-neutral-900 text-xs">
                    { searchTerm }
                </div>
            </div>
            }
        </PopoverContent>
    </Popover>
  )
}

export default Clickable