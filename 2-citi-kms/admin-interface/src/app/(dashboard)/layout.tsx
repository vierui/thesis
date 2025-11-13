import Sidebar from '@/components/Sidebar';
import { authOptions } from '../api/auth/[...nextauth]/authOption';
import { Toaster } from "sonner";
import { getServerSession } from 'next-auth/next';
import Provider from '@/contexts/session-provider';

const DashboardLayout = async ({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) => {
    const session = await getServerSession(authOptions)

  return (
    <Provider session={session}>
      <div className='flex flex-col md:flex-row h-full w-full overflow-hidden'>
          <Sidebar/>
          <div className="flex-1 h-full overflow-auto">
            {children}
          </div>
          <Toaster/>
      </div>
    </Provider>
  )
}

export default DashboardLayout