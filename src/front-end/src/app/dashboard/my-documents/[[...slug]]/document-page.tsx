"use client";
import React, { useState, useEffect } from "react";
import DocTable from "@/components/dashboard/doctable-dashboard";
import { getUserInfo } from "@/lib/user-queries";
import { useAuth } from "@clerk/nextjs";
import SessionDialog from "@/components/session_dialog";
import { useTheme } from "@/hooks/useTheme";
import { BsMoon, BsSun } from "react-icons/bs"

const DocumentPage = () => {
  const { userId } = useAuth();
  const [user, setUser] = React.useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getUserInfo(userId?.toString() || "");
        setUser(userData);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, [userId]);

  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="bg-white dark:bg-zinc-900 w-full h-full p-7 flex flex-col">
      <button
         onClick={toggleTheme}
         className="fixed top-4 right-4 p-2 bg-gray-200 dark:bg-gray-700 rounded-full"
         aria-label="Toggle Theme"
        >
 
         {theme === "light" ? <BsSun size={24} /> : <BsMoon size={24} />}
      </button>
      <div className="p-3 bg-gradient-to-r from-blue-700 to-teal-500 bg-clip-text text-transparent">
        <SessionDialog />
        <h1 className="text-3xl font-bold">Welcome, {user?.username || ""} </h1>
        
        <p className="text-muted-foreground font-light">
          Manage your documents here
        </p>
      </div>
      <div className="flex-1 overflow-hidden py-5 px-3">
        <DocTable />
      </div>
    </div>
  );
};

export default DocumentPage;
