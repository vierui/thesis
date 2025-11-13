"use client"
import React, { useEffect, useState } from 'react'
import Loading from './Loading'
import UploadCard from './UploadCard'
import DetailSheet from './DetailSheet'
import RenameAble from './RenameAble'
import Clickable from './Clickable'
import DocFilter from './DocFilter'
import { Table, TableBody, TableHead, TableHeader, TableCell, TableRow } from './ui/table'
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar'
import { Checkbox } from './ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogAction } from './ui/alert-dialog'
import { Button } from './ui/button'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { MagnifyingGlassIcon, TrashIcon, CaretLeftIcon, CaretRightIcon, DownloadIcon } from '@radix-ui/react-icons'
import { IoChevronDownCircleOutline, IoChevronUpCircleOutline } from "react-icons/io5";
import { Doc, User } from '@/types'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { docTableAttr, numberOfPages, tagStyles } from '@/constants'
import { useDocsStore, useTagsStore } from '@/lib/useStore'
import { useDebouncedCallback } from 'use-debounce'
import { toastError, toastSuccess, toastLoading } from '@/lib/useToast'
import { getSearchParams } from '@/utils'
import { useMediaQuery } from 'react-responsive'

const DeleteAlert = ({ docs, onDelete, size="lg" }: { docs: Doc[], onDelete: () => void, size?: string }) => {
    const { docs: documents, setDocs } = useDocsStore()
    
    const getDescriptionMessage = () => {
        if (docs.length === 1) return (
            <>
            This action cannot be undone. This will permanently delete document <b className='text-neutral-900'>{ docs[0].title }</b> from our servers
            </>
        )
        else return (
            <>
            This action cannot be undone. This will permanently delete <b className='text-neutral-900'>{ docs.length } documents</b> from our servers
            </>
        )
    }

    const handleDelete = async () => {
        if (docs.length === 1) {
            const closeLoadingToast = toastLoading(`Deleting document ${docs[0].id}.${docs[0].tag}`, "This may take a while")

            const res = await fetch(`/api/documents?id=${docs[0].id}`, { method: 'DELETE' })
            const data = await res.json()

            if (!res.ok) {
                closeLoadingToast()
                toastError(data.message, "Delete Error", true)
            } else {
                const newDocs = documents.filter(item => item.id !== docs[0].id)
                setDocs(newDocs)
                closeLoadingToast()
                toastSuccess(data.message, "Delete Success", false)
            }
        } else {
            const closeLoadingToast = toastLoading(`Deleting ${docs.length} documents`, "This may take a while")
            
            const res = await fetch(`/api/documents/bulk-delete`, { method: 'POST', body: JSON.stringify({ ids: docs.map(item => item.id) }) })
            const data = await res.json()
            if (!res.ok) {
                closeLoadingToast()
                toastError(data.message, "Delete Error", true)
            } else {
                const newDocs = documents.filter(item => docs.indexOf(item) === -1)
                setDocs(newDocs)
                closeLoadingToast()
                toastSuccess(data.message, "Delete Success", false)
            }
            onDelete()
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
                </Button>}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        { getDescriptionMessage() }
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

const AdminAction = ({ doc }: { doc: Doc }) => {
    const { push } = useRouter()
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className='flex group shadow items-center gap-x-0.5 border py-2 px-1 hover:bg-neutral-200 rounded-md'>
                    <div className="h-[3px] w-[3px] rounded-full bg-neutral-400 group-hover:bg-neutral-900"></div>
                    <div className="h-[3px] w-[3px] rounded-full bg-neutral-400 group-hover:bg-neutral-900"></div>
                    <div className="h-[3px] w-[3px] rounded-full bg-neutral-400 group-hover:bg-neutral-900"></div>
                </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="p-1 w-32">
                <DetailSheet doc={doc}/>
                <Button onClick={() => push(`/api/documents/download?id=${doc.id}`)} className='items-center text-xs gap-x-2 w-full justify-start font-normal hover:text-blue-700 text-neutral-900' variant={"ghost"} size={"sm"}>
                    <DownloadIcon/> Download
                </Button>
                <DeleteAlert docs={[doc]} onDelete={() => {}}/>
            </PopoverContent>
        </Popover>
    )
}

const SelectActions = ({ selectedDocs, setSelectedDocs }: { selectedDocs: Doc[], setSelectedDocs: (newDocs:Doc[]) => void }) => {
    return (
        <div className="border rounded-lg flex items-center gap-x-3 bg-white w-fit shadow px-5 py-2 text-sm absolute bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <p className="text-blue-700 whitespace-nowrap rounded-md bg-blue-100 py-1 px-3 text-xs">{ selectedDocs.length } documents selected</p>
            <DeleteAlert docs={selectedDocs} onDelete={() => setSelectedDocs([])}/>
            <Button variant={"outline"} size={"sm"} onClick={() => setSelectedDocs([])}>Close</Button>
        </div>
    )
}

interface DocTableProps {
    search?: string,
    currentPage: number,
    adminTags: string[],
    numberOfDocs: number
}

const DocTable = ({ adminTags, search, currentPage, numberOfDocs }: DocTableProps) => {
    const searchParams = useSearchParams()
    const pathname = usePathname()

    const { replace, push } = useRouter()
    const { docs, setDocs } = useDocsStore()
    const { tags, setTags } = useTagsStore()

    const [totalPages, setTotalPages] = useState<number>(1)
    const [selectedItems, setSelectedItems] = useState<Doc[]>([])
    const [error, setError] = useState<string>()
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [isSearching, setIsSearching] = useState<boolean>(false)
    const [userInFilter, setUserInFilter] = useState<User | null>(null)
    const [docInDetails, setDocInDetails] = useState<number | null>(null)

    const isMobile = useMediaQuery({ maxWidth: 767 })

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = getSearchParams(term, "search", searchParams)
        params.set("page", "1")
        replace(`${pathname}?${params.toString()}`)
    }, 300)

    const handleSelectItem = (item:Doc) => {
        if (selectedItems.indexOf(item) === -1) setSelectedItems([item, ...selectedItems])
        else setSelectedItems(selectedItems.filter(doc => doc !== item))
    }

    const handleSelectAll = () => {
        if (selectedItems.length === docs.length) setSelectedItems([])
        else setSelectedItems(docs)
    }

    const handlePagination = (pageNumber: number, ntake: number) => {
        if (pageNumber < 1 || pageNumber > totalPages) return
        const params = getSearchParams(pageNumber.toString(), "page", searchParams)
        params.set("n", ntake.toString())
        replace(`${pathname}?${params.toString()}`)
    }

    const handleUpdate = async (attribute: string, value: string, docId: string | number) => {
        const res = await fetch('/api/documents', {
            method: 'PATCH',
            body: JSON.stringify({
                attribute,
                value,
                docId
            })
        })
        const data = await res.json()

        if (!res.ok) {
            toastError(data.message, "Rename Failed", true)
        } else {
            setDocs(docs.map(item => {
                if (item.id === docId) {
                    item[attribute as keyof Object] = data.payload[attribute as keyof Object]
                }
                return item
            }))
        }
    }

    const handleSetDocumentDetailId = (docId: number) => {
        if (docInDetails === docId) setDocInDetails(null)
        else setDocInDetails(docId)
    } 

    useEffect(() => {
        const fetchDocs = async () => {
            const params = getSearchParams(search, "search", searchParams)
            const res = await fetch(`/api/documents?${params}`)
            const data = await res.json()

            if (!res.ok) {        
                setError(data.message)
                toastError(data.message, "Fetching Error", true)
            } else {
                const totalPages = Math.ceil(data.payload.docsCount / numberOfDocs)
                setTotalPages(totalPages === 0 ? 1 : totalPages)
                setDocs(data.payload.docs)
                setUserInFilter(data.payload.userInFilter)
            }
            setIsLoading(false)
        }
        setIsLoading(true)
        fetchDocs()
    }, [searchParams])

    return (
    <div className='py-3 sm:py-8 overflow-hidden h-full'>
        <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className={`py-2 px-2 w-full sm:w-72 gap-x-4 flex items-center rounded-lg border ${isSearching && 'border-indigo-700'} focus-within:text-indigo-700 overflow-hidden text-sm`}>
                <MagnifyingGlassIcon/>
                <input onChange={(e) => handleSearch(e.target.value)} defaultValue={searchParams.get('search')?.toString()} onBlur={() => setIsSearching(false)} onFocus={() => setIsSearching(true)} placeholder='Search by title or topic...' className='w-full outline-none'/>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-fit">
                <UploadCard/>
                <DocFilter userInFilter={userInFilter}/>
            </div>
        </div>

        {isLoading ? <Loading/> : isMobile ? 
            <div className="flex flex-col gap-3 overflow-auto max-h-[calc(100%-142px)] mt-5">
                {docs.length === 0 ?
                <p className="text-muted-foreground w-full text-center text-sm">No documents found</p> 
                :
                docs.map(doc => (
                    <div key={doc.id} className='w-full rounded-lg text-sm px-3 py-2 border'>
                        <div className="flex items-center justify-between gap-2 " key={doc.id}>
                            <div className="flex-1 max-w-3/5 overflow-auto">
                                <h1 className="font-medium">{ doc.title }</h1>
                                <p className="text-xs">{ doc.topic }</p>
                                <div className="flex items-center gap-2 text-xs mt-2">
                                    <Avatar className='h-5 w-5' >
                                        <AvatarImage src={doc.ownerImgUrl} alt='user_img'/>
                                        <AvatarFallback>{ doc.ownerName[0] + doc.ownerName[1] }</AvatarFallback>
                                    </Avatar>
                                    <p>{ doc.ownerName }</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {docInDetails === doc.id ? 
                                <IoChevronUpCircleOutline onClick={() => handleSetDocumentDetailId(doc.id)} size={20} className='text-blue-700 cursor-pointer'/>
                                :
                                <IoChevronDownCircleOutline onClick={() => handleSetDocumentDetailId(doc.id)} size={20} className='text-blue-700 cursor-pointer'/>}
                            </div>
                        </div>
                        {docInDetails === doc.id && 
                            <div className="flex flex-col gap-2">
                                <h1 className="text-xs mt-4 font-medium">Details</h1>
                                <div className="flex flex-col gap-1 text-xs">
                                    <p>Tag: { doc.tag } </p>
                                    <p>Size: { doc.size } MB</p>
                                    <p>Original Name: { doc.originalName }</p>
                                    <p>Repository: Public</p>
                                    <p>Location: {`public/${doc.ownerName}`}</p>
                                    <p>Date Created: { doc.createdAt }</p>
                                    <p>Date Modified: { doc.createdAt }</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={() => push(`/api/documents/download?id=${doc.id}`)} size='sm' variant='outline'>
                                        <DownloadIcon className='text-blue-700'/>
                                    </Button>
                                    <DeleteAlert size='sm' docs={[doc]} onDelete={() => {}}/>
                                </div>
                            </div>   
                        }
                    </div>
                ))}
            </div>
            :
            <div className="relative overflow-auto max-h-[calc(100%-114px)] mt-5">
                { selectedItems.length !== 0 && <SelectActions setSelectedDocs={setSelectedItems} selectedDocs={selectedItems}/> }
                <Table>
                    <TableHeader className='sticky w-full top-0 bg-white z-40'>
                        <TableRow>
                            <TableHead><Checkbox checked={selectedItems.length === docs.length && docs.length !== 0} onClick={handleSelectAll} className='border-neutral-300 data-[state=checked]:bg-blue-700 data-[state=checked]:border-none'/></TableHead>
                            {docTableAttr.map(item => (
                                <TableHead key={item}>{ item }</TableHead>
                            ))}
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {docs.length === 0 ? 
                        <TableRow>
                            <TableCell colSpan={docTableAttr.length + 1} align='center'>{ error ? error : "No documents found"}</TableCell>
                        </TableRow>
                    :
                    docs.map(item => (
                        <TableRow key={item.id}>
                            <TableCell><Checkbox checked={selectedItems.indexOf(item) !== -1} onClick={() => handleSelectItem(item)} className='border-neutral-300 data-[state=checked]:bg-blue-700 data-[state=checked]:border-none'/></TableCell>
                            <TableCell>
                                {/* { i + (currentPage-1)*numberOfDocs + 1 } */}
                                { item.id }
                            </TableCell>
                            <TableCell><RenameAble onChange={async (value:string) => {
                                await handleUpdate("title", value, item.id)
                            }} textDisplay={item.title}/></TableCell>
                            <TableCell className='relative'>
                                <Clickable setGlobalOptions={setTags} onClick={async (value:string) => {
                                await handleUpdate("topic", value, item.id)
                            }} options={tags.length !== 0 ? tags : adminTags}>
                                    { item.topic }
                                </Clickable>
                            </TableCell>
                            <TableCell>
                                <div className={`${tagStyles[item.tag as keyof typeof tagStyles]} text-center px-2 py-0.5 text-xs rounded-md`}>{ item.tag }</div>
                            </TableCell>
                            <TableCell className='flex items-center gap-x-4'>
                                <Avatar className='h-7 w-7' >
                                    <AvatarImage src={item.ownerImgUrl} alt='user_img'/>
                                    <AvatarFallback>{ item.ownerName[0] + item.ownerName[1] }</AvatarFallback>
                                </Avatar>
                                { item.ownerName }
                            </TableCell>
                            <TableCell>
                                <div className="text-center px-2 py-0.5 text-xs rounded-md bg-sky-200 text-sky-900 w-fit">
                                    { item.size } MB
                                </div>
                            </TableCell>
                            <TableCell>{ item.createdAt }</TableCell>
                            <TableCell><AdminAction doc={item}/></TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </div>
        }

        <div className="flex items-center justify-center gap-x-7 gap-y-3 py-3 text-muted-foreground text-xs sm:text-sm">
            <div className="flex items-center gap-x-2">
                <CaretLeftIcon onClick={() => handlePagination(currentPage - 1, numberOfDocs)} width={"24"} height={"24"}/>
                <p className='hidden sm:block '>Page</p>
                <div className="hidden sm:block rounded-lg px-2 border shadow-sm">{ currentPage }</div>
                <p className='hidden sm:block '>of { totalPages }</p>
                <CaretRightIcon onClick={() => handlePagination(currentPage + 1, numberOfDocs)} width={"24"} height={"24"}/>
            </div>
            <div className="flex items-center gap-x-2">
                Show
                <Select onValueChange={(value) => handlePagination(1, Number(value))}>
                    <SelectTrigger className='w-fit h-7 sm:w-16 sm:h-8 focus:ring-blue-700'>
                        <SelectValue placeholder={numberOfDocs.toString()}/>
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

export default DocTable