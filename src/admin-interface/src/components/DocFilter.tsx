import React, { useEffect, useState } from 'react'
import Loading from './Loading'
import DatePicker from './DatePicker'
import { User } from '@/types'
import { useDebouncedCallback } from 'use-debounce'
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { tagStyles } from '@/constants'
import { MixerVerticalIcon, Cross2Icon } from '@radix-ui/react-icons'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { getSearchParams } from '@/utils'
import { useMediaQuery } from 'react-responsive'
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet'

const UserBlock = ({ user, setUser }: { user: User, setUser: (user: User) => void }) => {
    return (
        <Button onClick={() => setUser(user)} className='justify-start items-center gap-x-3 text-xs' size={"sm"} variant={"ghost"}>
            <Avatar className='h-5 w-5' >
                <AvatarImage src={user.imgUrl} alt='user_img'/>
                <AvatarFallback>{ user.username[0] + user.username[1] }</AvatarFallback>
            </Avatar>
            { user.username }
        </Button>
    )
}



const DocFilter = ({ userInFilter }: { userInFilter: User | null}) => {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { replace } = useRouter()

    const [isOpen, setIsOpen] = useState<boolean>(false)
    const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false) // for mobile device
    const [selectedTags, setSelectedTags] = useState<string[]>(searchParams.getAll('tag'))
    const [users, setUsers] = useState<User[]>([])
    const [searchUserTerm, setSearchUserTerm] = useState<string>("")
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [isSearchLoading, setIsSearchLoading] = useState<boolean>(false)
    const [minSize, setMinSize] = useState<string>(searchParams.get('minSize') || "") // convert to number later
    const [maxSize, setMaxSize] = useState<string>(searchParams.get('maxSize') ||"") // convert to number later

    const paramMinDate = searchParams.get("minDate") || undefined
    const paramMaxDate = searchParams.get("maxDate") || undefined
    const [minDate, setMinDate] = useState<Date | undefined>(paramMinDate ? new Date(paramMinDate) : undefined)
    const [maxDate, setMaxDate] = useState<Date | undefined>(paramMaxDate ? new Date(paramMaxDate) : undefined)

    const isMobile = useMediaQuery({ maxWidth: 767 })
    
    const handleApplyFilter = () => {
        var params = getSearchParams(selectedUser?.id, "userId", searchParams)
        params.delete("tag")
        params.delete("minDate")
        params.delete("maxDate")
        params.delete("minSize")
        params.delete("maxSize")
    
        selectedTags.map(tag => params.append("tag", tag))
        params = getSearchParams(minDate?.toDateString(), "minDate", params)
        params = getSearchParams(maxDate?.toDateString(), "maxDate", params)
        params = getSearchParams(minSize, "minSize", params)
        params = getSearchParams(maxSize, "maxSize", params)
        
        replace(`${pathname}?${params.toString()}`)
        setIsOpen(false)
        setIsSheetOpen(false)
    }

    const handleClickTags = (tag: string) => {
        if (selectedTags.indexOf(tag) === -1) setSelectedTags([...selectedTags, tag])
        else setSelectedTags(selectedTags.filter(item => item != tag))
    }

    const handleChooseUser = (user: User) => {
        setSearchUserTerm("")
        setSelectedUser(user)
    }

    const handleResetFilter = () => {
        setSelectedTags([])
        setUsers([])
        setSearchUserTerm("")
        setSelectedUser(null)
        setMinDate(undefined)
        setMaxDate(undefined)
        setMinSize("")
        setMaxSize("")
    }

    const handleSearchUser = useDebouncedCallback((term: string) => {
        if (term !== ""){
            setIsSearchLoading(true)
            fetch(`api/users?search=${term}`).then(async res => {
                const data = await res.json()
                if (!res.ok) {
                    // handler
                } else {
                    setUsers(data.payload.users)
                }
                setIsSearchLoading(false)
            })
        } else {
            setUsers([])
        }
    }, 300)

    const handleSearchOnChange = (term: string) => {
        setSearchUserTerm(term)
        handleSearchUser(term)
    }

    useEffect(() => {
        setSelectedUser(userInFilter)
    }, [userInFilter])
    
  if (isMobile) {
    return (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
                <Button variant={"outline"} className='w-full sm:w-fit text-xs h-8 shadow gap-x-2'>
                    <MixerVerticalIcon/> Filter
                </Button>
            </SheetTrigger>
            <SheetContent side='top' className='flex flex-col gap-4 rounded-b-[30px] max-h-[90%] overflow-hidden'>
                <div className="flex p-1 flex-col gap-y-4 overflow-auto">
                    <div className="flex flex-col gap-2">
                        <h2 className='font-semibold text-sm'>Tags</h2>
                        <div className="flex flex-wrap gap-2">
                            {Object.keys(tagStyles).map(item => (
                                <div key={item} onClick={() => handleClickTags(item)} className={`${selectedTags.indexOf(item) !== -1 ? tagStyles[item as keyof typeof tagStyles] : 'bg-neutral-200'} text-center px-2 py-0.5 text-xs rounded-md cursor-pointer`}>
                                    { item }
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">{ selectedTags.length } tags selected</p>
                    </div>
                    <div className="flex flex-col gap-2 relative">
                        <h2 className='font-semibold text-sm'>Owner</h2>
                        <Input value={searchUserTerm} placeholder='Search a username' className='text-xs' onChange={(e) => handleSearchOnChange(e.target.value)}/>
                        {searchUserTerm !== "" && <div className="p-1 flex flex-col absolute z-40 rounded border top-[70px] bg-white text-xs w-full max-h-24 overflow-auto">
                            {users.length !== 0 ? users.map(item => (
                                <UserBlock key={item.id} user={item} setUser={handleChooseUser}/>
                            )) : isSearchLoading ? <Loading size={15}/> :
                            <p className="text-center text-xs text-muted-foreground">No users found</p>}
                        </div>}
                        <div className="flex items-center gap-x-4">
                            {selectedUser ? <p className='text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-md w-fit'>{ selectedUser.username }</p> :
                            <p className="text-xs text-muted-foreground">No user selected</p>}
                            {selectedUser && <button onClick={() => setSelectedUser(null)} className="text-xs text-muted-foregorund hover:underline hover:text-neutral-900">Clear</button>}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <h2 className='font-semibold text-sm'>Date Added</h2>
                        <h3 className="font-medium text-xs">From</h3>
                        <div className="flex items-center gap-x-2">
                            <DatePicker date={minDate} onSelect={(newDate: Date) => setMinDate(newDate)}/>
                            {minDate && <Cross2Icon onClick={() => setMinDate(undefined)} className='cursor-pointer text-muted-foreground hover:text-neutral-900 rounded-full'/>}
                        </div>
                        <h3 className="font-medium text-xs">Until</h3>
                        <div className="flex items-center gap-x-2">
                            <DatePicker date={maxDate} onSelect={(newDate: Date) => setMaxDate(newDate)}/>
                            {maxDate && <Cross2Icon onClick={() => setMaxDate(undefined)} className='cursor-pointer text-muted-foreground hover:text-neutral-900 rounded-full'/>}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <h2 className='font-semibold text-sm'>Document Size</h2>
                        <div className="flex items-center justify-around gap-x-3">
                            <div>
                                <h3 className="font-medium text-xs">Min Size (MB)</h3>
                                <Input value={minSize} onChange={(e) => setMinSize(e.target.value)} type='number' className='max-w-fit mt-1 text-xs' placeholder='Size'/>
                            </div>
                            
                            <div>
                                <h3 className="font-medium text-xs">Max Size (MB)</h3>
                                <Input value={maxSize} onChange={(e) => setMaxSize(e.target.value)} type='number' className='max-w-fit mt-1 text-xs' placeholder='Size'/>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-between gap-3">
                    <Button onClick={handleResetFilter} variant={"outline"} size={"sm"} className='w-full text-xs' >Clear All</Button>
                    <Button onClick={handleApplyFilter} size={"sm"} className='w-full text-xs bg-blue-700 hover:bg-blue-900'>Apply</Button>
                </div>
            </SheetContent>
        </Sheet>
    )
  }
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
            <Button variant={"outline"} className='w-full sm:w-fit text-xs h-8 shadow gap-x-2'>
                <MixerVerticalIcon/> Filter
            </Button>
        </PopoverTrigger>
        <PopoverContent align='end' className='flex flex-col gap-4'>
            <div className="flex flex-col gap-y-4">
                <div className="flex flex-col gap-2">
                    <h2 className='font-semibold text-sm'>Tags</h2>
                    <div className="flex flex-wrap gap-2">
                        {Object.keys(tagStyles).map(item => (
                            <div key={item} onClick={() => handleClickTags(item)} className={`${selectedTags.indexOf(item) !== -1 ? tagStyles[item as keyof typeof tagStyles] : 'bg-neutral-200'} text-center px-2 py-0.5 text-xs rounded-md cursor-pointer`}>
                                { item }
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{ selectedTags.length } tags selected</p>
                </div>
                <div className="flex flex-col gap-2 relative">
                    <h2 className='font-semibold text-sm'>Owner</h2>
                    <Input value={searchUserTerm} placeholder='Search a username' className='text-xs' onChange={(e) => handleSearchOnChange(e.target.value)}/>
                    {searchUserTerm !== "" && <div className="p-1 flex flex-col absolute z-40 rounded border top-[70px] bg-white text-xs w-full max-h-24 overflow-auto">
                        {users.length !== 0 ? users.map(item => (
                            <UserBlock key={item.id} user={item} setUser={handleChooseUser}/>
                        )) : isSearchLoading ? <Loading size={15}/> :
                        <p className="text-center text-xs text-muted-foreground">No users found</p>}
                    </div>}
                    <div className="flex items-center gap-x-4">
                        {selectedUser ? <p className='text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-md w-fit'>{ selectedUser.username }</p> :
                        <p className="text-xs text-muted-foreground">No user selected</p>}
                        {selectedUser && <button onClick={() => setSelectedUser(null)} className="text-xs text-muted-foregorund hover:underline hover:text-neutral-900">Clear</button>}
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <h2 className='font-semibold text-sm'>Date Added</h2>
                    <h3 className="font-medium text-xs">From</h3>
                    <div className="flex items-center gap-x-2">
                        <DatePicker date={minDate} onSelect={(newDate: Date) => setMinDate(newDate)}/>
                        {minDate && <Cross2Icon onClick={() => setMinDate(undefined)} className='cursor-pointer text-muted-foreground hover:text-neutral-900 rounded-full'/>}
                    </div>
                    <h3 className="font-medium text-xs">Until</h3>
                    <div className="flex items-center gap-x-2">
                        <DatePicker date={maxDate} onSelect={(newDate: Date) => setMaxDate(newDate)}/>
                        {maxDate && <Cross2Icon onClick={() => setMaxDate(undefined)} className='cursor-pointer text-muted-foreground hover:text-neutral-900 rounded-full'/>}
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <h2 className='font-semibold text-sm'>Document Size</h2>
                    <div className="flex items-center justify-around gap-x-3">
                        <div>
                            <h3 className="font-medium text-xs">Min Size (MB)</h3>
                            <Input value={minSize} onChange={(e) => setMinSize(e.target.value)} type='number' className='max-w-fit mt-1 text-xs' placeholder='Size'/>
                        </div>
                        
                        <div>
                            <h3 className="font-medium text-xs">Max Size (MB)</h3>
                            <Input value={maxSize} onChange={(e) => setMaxSize(e.target.value)} type='number' className='max-w-fit mt-1 text-xs' placeholder='Size'/>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <Button onClick={handleResetFilter} variant={"outline"} size={"sm"} className='text-xs' >Clear All</Button>
                <Button onClick={handleApplyFilter} size={"sm"} className='text-xs bg-blue-700 hover:bg-blue-900'>Apply</Button>
            </div>
        </PopoverContent>
    </Popover>
  )
}

export default DocFilter