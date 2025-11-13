import React from 'react'
import DocTable from '@/components/DocTable'
import { getAdminTopics } from '@/utils/server-queries'

interface Props {
    searchParams?: {
        search?: string,
        page?: string,
        n?: string
    }
}

const page = async ({ searchParams }: Props) => {
  const adminTags = await getAdminTopics()
  

  return (
    <div className='flex flex-col h-full m-auto px-12 py-9 max-w-[1200px]'>
        <h1 className='font-bold text-lg sm:text-2xl'>Welcome to Documents Management Dashboard</h1>
        <p className="text-neutral-400 text-xs sm:text-sm font-normal">Manage your documents here</p>
        <DocTable adminTags={adminTags} search={searchParams?.search} currentPage={Number(searchParams?.page) || 1} numberOfDocs={Number(searchParams?.n) || 10}/>
    </div>
  )
}

export default page