import Image from 'next/image'
import LoginForm from '@/components/LoginForm'
import companyLogo from '../../../public/images/company-logo.png'
import { getServerSession  } from 'next-auth'
import { redirect } from 'next/navigation'

const page = async () => {  
    const session = await getServerSession()
    if (session) return redirect("/main")

    return (
    <div className="flex justify-center items-center h-full w-full bg-white">
        <div className="p-5 h-full w-full sm:h-fit sm:w-fit sm:rounded-lg sm:border flex justify-center items-center sm:shadow-md bg-neutral-100">
            <div className="sm:pl-5 py-5 sm:pr-12 sm:border-r-2 border-neutral-400 ">
                <h1 className="text-2xl text-neutral-900 font-semibold">Sign in as Admin</h1>
                <p className='font-light text-muted-foreground text-sm'>Sign in and manage your LKC system!</p>
                <LoginForm/>
            </div>
            <div className="hidden sm:block pl-12 pr-5 m-auto">
                <div className="flex items-center gap-3">
                    <Image src={companyLogo} alt='Company logo' width={100} height={100} className='w-auto h-auto'/>
                    <h1 className='text-2xl font-semibold'>
                        <div className="flex items-center justify-around">
                            <p>C</p><p>I</p><p>T</p><p>I</p>
                        </div>
                        <p className="text-sm">CENTER FOR IOT INNOVATION </p>
                    </h1>
                </div>
            </div>
        </div>
    </div>
  )
}

export default page