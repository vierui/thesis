"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from './ui/button';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { sidebarElements } from '@/constants';
import { signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { BsLayoutSidebarInsetReverse, BsLayoutSidebarInset } from "react-icons/bs";
import companyLogo from '../../public/images/company-logo.png'

const Sidebar = () => {
    const activeMenu = 'text-blue-700 bg-neutral-100 hover:text-blue-700'
    const deadMenu = 'text-slate-400 hover:text-slate-400'
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const pathname = usePathname()

  return (
    <div className="flex">
        <div className="flex justify-between w-full p-5 md:hidden shadow">
            <BsLayoutSidebarInsetReverse onClick={() => setIsOpen(!isOpen)} className='cursor-pointer text-muted-foreground hover:text-blue-700' size={20}/>
            <Link href={'#'} className='flex items-center justify-center gap-x-2 font-bold text-blue-800'>
                <h1 className="text-lg">
                    ADMIN 
                    <span className='text-neutral-500'> DASHBOARD</span>
                </h1>
            </Link>
        </div>
        <div className={`${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} w-[80%] md:w-[270px] flex flex-col bg-white border-r p-4 fixed md:static top-0 bottom-0 left-0 z-[60] transition-transform duration-300 md:duration-0 ease-in-out`}>
            <BsLayoutSidebarInset size={20} onClick={() => setIsOpen(!isOpen)} className='md:hidden cursor-pointer text-muted-foreground hover:text-blue-700 ml-auto'/>
            <Link href={'#'} className='flex items-center justify-start gap-x-2 font-bold text-blue-800 mt-5 mb-20'>
                <Image src={companyLogo} alt='Company logo' height={30} width={30} className='w-auto h-auto'/>
                <h1 className="text-lg">
                    ADMIN 
                    <span className='text-neutral-500'> DASHBOARD</span>
                </h1>
            </Link>
            <div className="flex-1 flex flex-col gap-y-3">
                { sidebarElements.map(item => (
                    <Link href={item.path} onClick={() => setIsOpen(false)} key={item.name}>
                        <Button className={`w-full justify-start items-center gap-x-3 font-normal ${pathname === item.path ? activeMenu : deadMenu}`} variant={"ghost"}>
                            <item.icon/>
                            { item.name }
                        </Button>
                    </Link>
                ))}
            </div>
            <Button onClick={() => signOut()} className='gap-x-3 rounded-full font-normal hover:text-red-500 text-slate-700' variant={"ghost"}>
                <ArrowLeftIcon/>
                Logout
            </Button>
        </div>
        {isOpen && <div className="md:hidden bg-black fixed h-screen w-screen opacity-30 z-50">
        </div>}
    </div>
  )
}

export default Sidebar