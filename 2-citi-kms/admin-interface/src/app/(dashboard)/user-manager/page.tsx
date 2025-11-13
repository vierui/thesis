import React from 'react';
import UserTable from '@/components/UserTable';

interface Props {
  searchParams?: {
    search?: string,
    page?: string,
    n?: string
  }
}

const page = ({ searchParams }: Props) => {
  return (
    <div className='flex flex-col h-full m-auto px-12 py-9 max-w-[1200px]'>
        <h1 className='font-bold text-lg md:text-2xl'>Welcome to Users Management Dashboard</h1>
        <p className="text-neutral-400 text-xs md:text-sm font-normal">Manage your users here</p>
        <UserTable search={searchParams?.search} currentPage={Number(searchParams?.page) || 1} numberOfUsers={Number(searchParams?.n) || 10}/>
    </div>
  )
}

export default page