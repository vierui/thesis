import React from 'react'

// Force dynamic rendering for all auth pages (prevents static generation during build)
export const dynamic = 'force-dynamic'

const AuthLayout = ({ children }:{ children:React.ReactNode }) => {
  return (
    <div className='flex items-center justify-center h-screen overflow-hidden'>
        { children }
    </div>
  )
}

export default AuthLayout