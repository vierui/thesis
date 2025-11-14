"use client"
import React, { useState } from 'react'
import Loading from './Loading'
import { PersonIcon, LockClosedIcon, EyeOpenIcon, EyeClosedIcon  } from '@radix-ui/react-icons'
import { signIn } from "next-auth/react"
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'

const LoginForm = () => {
    const searchParams = useSearchParams()
    const { push } = useRouter()
    const callbackUrl = searchParams.get('callbackUrl') || '/main'

    const [username, setUsername] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [error, setError] = useState<string | null>()
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isShowingPassword, setIsShowingPassword] = useState<boolean>(false)

    const onSubmitLogin = (event: React.FormEvent) => {
        event.preventDefault()
        setIsLoading(true)
        signIn("credentials", {
            redirect: false,
            username,
            password
        }).then(res => {
            if (res?.ok) {
                push(`${callbackUrl}`)
                setError(null)
                setUsername('')
                setPassword('')
            }
            else {
                setError("Invalid credentials")
                setIsLoading(false)
            }
        })
    }  
  return (
    <form onSubmit={onSubmitLogin} className="flex flex-col gap-4 py-10">
        <div className="bg-white flex items-center gap-x-2 text-sm  rounded-lg px-4 py-3">
            <PersonIcon className={`text-neutral-500`}/>
            <input disabled={isLoading} value={username} onChange={(e) => setUsername(e.target.value)} type="text" className='flex-1 outline-none border-none' placeholder='Enter username'/>
        </div>
        <div className="bg-white flex items-center justify-between gap-x-2 text-sm  rounded-lg px-4 py-3">
            <LockClosedIcon className={`text-neutral-500`}/>
            <input disabled={isLoading} value={password} onChange={(e) => setPassword(e.target.value)} type={isShowingPassword ? "text" : "password"} className='flex-1 outline-none border-none ' placeholder='Enter password'/>
            { isShowingPassword ? 
            <EyeClosedIcon className='cursor-pointer' onClick={() => setIsShowingPassword(false)}/> : 
            <EyeOpenIcon className='cursor-pointer' onClick={() => setIsShowingPassword(true)}/>}
        </div>
        {error && <p className='text-sm py-2 text-red-700 text-center'>{ error }</p>}
        <Button disabled={isLoading} >{ isLoading ? <Loading/> : "Sign in" }</Button>
    </form>
  )
}

export default LoginForm