import { notFound } from 'next/navigation'
import React from 'react'
import DocumentPage from './document-page'
import { auth, currentUser } from '@clerk/nextjs/server'
import { checkIfUserExistInDb, registerUser } from "@/lib/user-queries"

const DashboardPage = async () => {
  const { userId } = await auth()

  // check if the userId is already in the database, if not, create
  if (userId && !await checkIfUserExistInDb(userId)) {
    const user = await currentUser()
    await registerUser(userId, user?.emailAddresses[0].emailAddress || "", (user?.firstName + " " + user?.lastName), user?.firstName || "", user?.lastName || "", user?.imageUrl || "")
  }

  
  return <DocumentPage/>
}

export default DashboardPage