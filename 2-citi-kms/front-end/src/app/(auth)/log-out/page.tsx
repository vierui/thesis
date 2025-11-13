"use client"
import { useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Page() {
  const { signOut } = useClerk()
  const router = useRouter()

  useEffect(() => {
    signOut().then(() => {
      router.push("/")
    })
  }, [signOut, router])

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Signing out...</p>
      </div>
    </div>
  )
}