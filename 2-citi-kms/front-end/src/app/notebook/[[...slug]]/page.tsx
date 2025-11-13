import React from "react";
import NotebookPage from "./notebook-page";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getUserInfo } from "@/lib/user-queries";
import { checkIfUserExistInDb, registerUser } from "@/lib/user-queries";
import { redirect } from "next/navigation";

const Page = async ({ params }: { params: Promise<{ slug?: string[] }> }) => {
  const { userId, getToken } = await auth();

  if (!userId) {
    return redirect("/sign-in");
  }

  const token = await getToken();

  // Register user if they don't exist in database
  if (userId && !(await checkIfUserExistInDb(userId))) {
    const user = await currentUser();
    await registerUser(
      userId,
      user?.emailAddresses[0].emailAddress || "",
      user?.firstName + " " + user?.lastName,
      user?.firstName || "",
      user?.lastName || "",
      user?.imageUrl || ""
    );
  }

  const user = await getUserInfo(userId || "");

  // Handle different notebook routes/modes
  let notebookMode = "default";
  let notebookId = null;

  const { slug } = await params;

  if (slug && slug.length > 0) {
    // Handle different notebook routes
    // e.g., /notebook/session/123 or /notebook/document/456
    if (slug[0] === "session" && slug[1]) {
      notebookMode = "session";
      notebookId = slug[1];
    } else if (slug[0] === "document" && slug[1]) {
      notebookMode = "document";
      notebookId = slug[1];
    }
  }

  return (
    <NotebookPage 
      user={user} 
      mode={notebookMode}
      notebookId={notebookId}
      token={token}
    />
  );
};

export default Page; 