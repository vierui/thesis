"use client"
import React, { useEffect, useState } from 'react'
import Loading from './Loading'
import { Table, TableBody, TableHead, TableHeader, TableCell, TableRow } from './ui/table'
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogAction } from './ui/alert-dialog'
import { IoChevronDownCircleOutline, IoChevronUpCircleOutline } from "react-icons/io5";
import { Button } from './ui/button'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { MagnifyingGlassIcon, EnvelopeClosedIcon, TrashIcon, CaretLeftIcon, CaretRightIcon } from '@radix-ui/react-icons'
import { User } from '@/types'
import { userTableAttr, numberOfPages } from '@/constants'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { useUsersStore } from '@/lib/useStore'
import { toastError, toastSuccess } from '@/lib/useToast'
import { getSearchParams } from '@/utils'
import { useMediaQuery } from 'react-responsive'


const DeleteAlert = ({ user, size="lg" }: { user: User, size?:string }) => {
    const { users, setUsers } = useUsersStore()

    const handleDelete = async () => {
        const res = await fetch(`/api/users?id=${user.id}`, { method: 'DELETE' })
        const data = await res.json()

        if (!res.ok) {
            toastError(data.message, "Delete Error", true)
        }
        else {
            const newUsers = users.filter(item => item.id !== user.id)
            setUsers(newUsers)
            toastSuccess(data.message, "Delete Success", false)
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {size === "sm" ? 
                    <Button variant='outline' size='sm'>
                        <TrashIcon className='text-red-600'/>
                    </Button> 
                    :
                    <Button className='items-center text-xs gap-x-2 w-full justify-start font-normal hover:text-red-500 text-neutral-900' variant={"ghost"} size={"sm"}>
                        <TrashIcon/> Delete
                    </Button>
                }
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete user <b className='text-neutral-900'>{ user.username }</b> account from our servers
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className='bg-red-700' onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

const AdminAction = ({ user }: { user: User }) => {
    const { push } = useRouter()
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className='flex flex-col sm:flex-row group items-center gap-0.5 md:border md:shadow py-2 px-1 hover:bg-neutral-200 rounded-md'>
                    <div className="h-[3px] w-[3px] rounded-full bg-neutral-400 group-hover:bg-neutral-900"></div>
                    <div className="h-[3px] w-[3px] rounded-full bg-neutral-400 group-hover:bg-neutral-900"></div>
                    <div className="h-[3px] w-[3px] rounded-full bg-neutral-400 group-hover:bg-neutral-900"></div>
                </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="p-1 w-32">
                <Button onClick={() => push(`mailto:${user.email}`)} className='items-center text-xs gap-x-2 w-full justify-start font-normal hover:text-blue-700 text-neutral-900' variant={"ghost"} size={"sm"}>
                    <EnvelopeClosedIcon/> Email
                </Button>
                <DeleteAlert user={user}/>
            </PopoverContent>
        </Popover>
    )
}

const LabelStorage = ({ totalSize, sizeLimit }: { totalSize:number, sizeLimit:number}) => {
    const safeStyle = "bg-blue-200 text-blue-700"
    const dangerStyle = "bg-orange-200 text-orange-700"
    const fullStyle = "bg-red-200 text-red-700"
    return (
        <div className={`w-16 text-xs font-medium text-center rounded-lg px-2 py-1 ${ totalSize >= sizeLimit ? fullStyle : totalSize >= 0.9*sizeLimit ? dangerStyle : safeStyle }`}>
            { totalSize >= sizeLimit ? "Full" : totalSize >= 0.9*sizeLimit ? "Danger" : "Safe" }
        </div>
    )
}

interface UserTableProps {
    search?: string,
    currentPage: number,
    numberOfUsers: number
}

const UserTable = ({ search, currentPage, numberOfUsers }: UserTableProps) => {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const { replace, push } = useRouter()
    const { users, setUsers } = useUsersStore()

    const [totalPages, setTotalPages] = useState<number>(1)
    const [error, setError] = useState<string>()
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [isSearching, setIsSearching] = useState<boolean>(false)
    const [userDetailId, setUserDetailId] = useState<string | null>(null)

    const isMobile = useMediaQuery({ maxWidth: 767 })

    const handleSetUserDetail = (userId: string) => {
        if (userId === userDetailId) setUserDetailId(null)
        else setUserDetailId(userId)
    }

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = getSearchParams(term, "search", searchParams)
        params.set("page", "1")
        replace(`${pathname}?${params.toString()}`)
    }, 300)

    const handlePagination = (pageNumber: number, ntake: number) => {
        if (pageNumber < 1 || pageNumber > totalPages) return
        const params = getSearchParams(pageNumber.toString(), "page", searchParams)
        params.set("n", ntake.toString())
        replace(`${pathname}?${params.toString()}`)
    }

    useEffect(() => {
        const fetchUsers = async () => {
            const params = getSearchParams(search, "search", searchParams)
            const res = await fetch(`/api/users?${params}`)
            const data = await res.json()

            if (!res.ok) {        
                setError(data.message)
                toastError(data.message, "Fetching Error", true)
            } else {
                const totalPages = Math.ceil(data.payload.totalUsers / numberOfUsers)
                setTotalPages(totalPages === 0 ? 1 : totalPages)
                setUsers(data.payload.users)
            }
            setIsLoading(false)
        }
        setIsLoading(true)
        fetchUsers()
    }, [search, currentPage, numberOfUsers])

  return (
    <div className='pt-8 overflow-hidden relative h-full'>
        <div className={`mb-5 py-2 px-2 gap-x-2 flex items-center rounded-lg border ${isSearching && 'border-indigo-700'} focus-within:text-indigo-700 w-full  md:w-72 overflow-hidden text-sm`}>
            <MagnifyingGlassIcon/>
            <input onChange={(e) => handleSearch(e.target.value)} defaultValue={searchParams.get('search')?.toString()} onBlur={() => setIsSearching(false)} onFocus={() => setIsSearching(true)} placeholder='Search by username or email...' className='w-full outline-none'/>
        </div>
        {isLoading ? 
            <Loading/> :
        !isMobile ? 
            <div className="max-h-[calc(100%-108px)] relative overflow-auto">
                <Table>
                    <TableHeader className='sticky w-full top-0 bg-white z-40'>
                        <TableRow>
                            {userTableAttr.map(item => (
                                <TableHead key={item}>{ item }</TableHead>
                            ))}
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? 
                            <TableRow>
                                <TableCell colSpan={userTableAttr.length} align='center'>{ error ? error : "No users found"}</TableCell>
                            </TableRow>
                        :
                        users.map((item, i) => (
                            <TableRow key={item.email}>
                                <TableCell>{ i + (currentPage-1)*numberOfUsers + 1 }</TableCell>
                                <TableCell className='flex items-center gap-x-4'>
                                    <Avatar className='h-7 w-7' >
                                        <AvatarImage src={item.imgUrl} alt='user_img'/>
                                        <AvatarFallback>{ item.username[0] + item.username[1] }</AvatarFallback>
                                    </Avatar>
                                    { item.username }
                                </TableCell>
                                <TableCell>{ item.email }</TableCell>
                                <TableCell>{ item.joinDate }</TableCell>
                                <TableCell>{ item.chatsCount }</TableCell>
                                <TableCell>{ item.docsCount }</TableCell>
                                <TableCell>{ item.likes }</TableCell>
                                <TableCell>{ item.dislikes }</TableCell>
                                <TableCell><LabelStorage totalSize={item.docsSize || 0} sizeLimit={20}/></TableCell>
                                <TableCell> <AdminAction user={item}/> </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div> :
            <div className="flex flex-col gap-3 overflow-auto max-h-[calc(100%-108px)]">
                {users.length === 0 ?
                <p className="text-muted-foreground w-full text-center text-sm">No users found</p> 
                :
                users.map(user => (
                    <div key={user.id} className='w-full rounded-lg text-sm px-3 py-2 border'>
                        <div className="flex items-center justify-between gap-2 " key={user.id}>
                            <Avatar className='h-7 w-7' >
                                <AvatarImage src={user.imgUrl} alt='user_img'/>
                                <AvatarFallback>{ user.username[0] + user.username[1] }</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 max-w-3/5 overflow-auto">
                                <h1 className="font-medium">{ user.username }</h1>
                                <p className="text-xs">{ user.email }</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {userDetailId === user.id ? 
                                <IoChevronUpCircleOutline onClick={() => handleSetUserDetail(user.id)} size={20} className='text-blue-700 cursor-pointer'/>
                                :
                                <IoChevronDownCircleOutline onClick={() => handleSetUserDetail(user.id)} size={20} className='text-blue-700 cursor-pointer'/>}
                            </div>
                        </div>
                        {userDetailId === user.id && 
                        <div className="flex flex-col gap-2">
                            <h1 className="text-xs mt-4 font-medium">Details</h1>
                            <div className="flex flex-col gap-1 text-xs">
                                <p>Join Date: { user.joinDate }</p>
                                <p>Chats Count: { user.chatsCount }</p>
                                <p>Documents Count: { user.docsCount }</p>
                                <p>Likes: { user.likes }</p>
                                <p>Dislikes: { user.dislikes }</p>
                                <p>Storage: { user.docsSize }</p>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={() => push(`mailto:${user.email}`)} className='items-center text-xs gap-x-2 w-fit justify-start font-normal hover:text-blue-700 text-neutral-900' variant={"outline"} size={"sm"}>
                                    <EnvelopeClosedIcon className='text-blue-700'/>
                                </Button>
                                <DeleteAlert size='sm' user={user}/>
                            </div>
                        </div>   
                        }
                    </div>
                ))}
            </div>
        }
        
        <div className="flex items-center justify-center gap-x-7 gap-y-3 pt-3 pb-1 text-muted-foreground text-xs sm:text-sm">
            <div className="flex items-center gap-x-2">
                <CaretLeftIcon onClick={() => handlePagination(currentPage - 1, numberOfUsers)} width={"24"} height={"24"}/>
                <p className='hidden sm:block '>Page</p>
                <div className="hidden sm:block rounded-lg px-2 border shadow-sm">{ currentPage }</div>
                <p className='hidden sm:block '>of { totalPages }</p>
                <CaretRightIcon onClick={() => handlePagination(currentPage + 1, numberOfUsers)} width={"24"} height={"24"}/>
            </div>
            <div className="flex items-center gap-x-2">
                Show
                <Select onValueChange={(value) => handlePagination(1, Number(value))}>
                    <SelectTrigger className='w-fit h-7 sm:w-16 sm:h-8 focus:ring-blue-700'>
                        <SelectValue placeholder={numberOfUsers.toString()}/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {numberOfPages.map(item => (
                                <SelectItem key={item} value={item.toString()}>{ item }</SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
        </div>
    </div>
  )
}

export default UserTable