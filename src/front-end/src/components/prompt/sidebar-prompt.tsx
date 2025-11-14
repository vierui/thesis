"use client";
import React, { useEffect, useCallback } from "react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../ui/button";
import { BsLayoutSidebarInset, BsPencilSquare } from "react-icons/bs";
import { MdChat } from "react-icons/md";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card";
import UserProfile from "./user-profile";
import { useAuth } from "@clerk/nextjs";
import { useStore, useSidebarState } from "@/lib/useStore";
import { ScrollArea } from "../ui/scroll-area";
import ChatName from "./chat-name";

interface T {
  id: number;
  name: string;
  updatedAt: Date;
}

interface ChatBoxGroup {
  [key: string]: T[];
}

function sortChatBox(chatBox: ChatBoxGroup) {
  const sortingOrder = {
    Today: 0,
    Yesterday: 1,
    "Last 7 Days": 2,
    "Last 30 Days": 3,
    December: 4,
    November: 5,
    October: 6,
    September: 7,
    August: 8,
    July: 9,
    June: 10,
    May: 11,
    April: 12,
    March: 13,
    February: 14,
    January: 15,
  };

  function getSortOrder(key: string) {
    if (sortingOrder.hasOwnProperty(key)) {
      return sortingOrder[key as keyof typeof sortingOrder];
    } else {
      return new Date().getFullYear() - Number(key) + 15;
    }
  }

  const sortedKeys = Object.keys(chatBox).sort((a, b) => {
    const orderA = getSortOrder(a) as number;
    const orderB = getSortOrder(b) as number;
    return orderA - orderB;
  });

  return sortedKeys;
}

const SidebarPrompt = () => {
  const { isOpen, setIsOpen } = useSidebarState();
  const [chatBox, setChatBox] = useState<ChatBoxGroup | null>(null);
  const [sortedKeys, setSortedKeys] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { userId } = useAuth();

  const setFunction = useStore((state) => state.setFunction);

  const getChatBox = useCallback(async () => {
    console.log("Fetching chatbox data...");
    console.log("User ID:", userId);
    const response = await fetch('/api/chatbox');
    const data = await response.json();
    setChatBox(data.data as ChatBoxGroup);
    let sortedKeys = sortChatBox(data.data as ChatBoxGroup);
    setSortedKeys(sortedKeys);
  }, [userId]);

  useEffect(() => {
    setFunction(getChatBox);
  }, [setFunction, getChatBox]);

  useEffect(() => {
    getChatBox().then().catch().finally(() => setIsLoading(false));
  }, [getChatBox]);

  return (
    <aside className="h-screen">
      <nav
        className={`h-full ${isOpen ? "w-64" : "w-0"} flex flex-col bg-blue-700 dark:bg-gray-700 text-white transition-all duration-300 ease-in-out ${!isOpen ? "bg-transparent" : ""}`}
      >
        {isOpen && (
          <div className="flex flex-col p-4 justify-between h-full">
            <div className="flex items-center gap-2 justify-between">
              <HoverCard openDelay={100} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <Button onClick={() => setIsOpen(!isOpen)} className="h-fit p-2 rounded-xl bg-transparent shadow-none hover:bg-white text-slate-200 dark:hover:text-blue-700 hover:text-blue-700">
                    <BsLayoutSidebarInset size={20} />
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent className="p-1 bg-white text-blue-700 w-fit border-none shadow shadow-blue-400" align="start">
                  <p className="text-xs">Close the sidebar</p>
                </HoverCardContent>
              </HoverCard>
              <HoverCard openDelay={100} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <Link href={"/prompt"}>
                    <Button className="h-fit p-2 rounded-xl bg-transparent shadow-none hover:bg-white text-slate-200 dark:hover:text-blue-700 hover:text-blue-700 relative animate-fade-in">
                      <BsPencilSquare size={20} />
                    </Button>
                  </Link>
                </HoverCardTrigger>
                <HoverCardContent align="end" className="p-1 bg-white text-blue-700 w-fit border-none shadow shadow-blue-400">
                  <p className="text-xs">Create a new chat</p>
                </HoverCardContent>
              </HoverCard>
            </div>

            {isLoading ? (
              <div className="flex w-full text-blue-700 items-center justify-center h-full">
                <svg
                  aria-hidden="true"
                  role="status"
                  className="inline w-6 h-6 me-3 text-gray-200 animate-spin dark:text-gray-600"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="#1C64F2"
                  />
                </svg>
              </div>
            ) : (
              chatBox && (
                sortedKeys.length == 0 ? (
                  <div className="flex-1 h-full">
                    <div className="flex flex-col justify-center items-center h-full text-center text-slate-200 text-sm gap-y-3">
                      <MdChat size={40} />
                      You have no conversation
                      <br />
                      Start a new one!
                    </div>
                  </div>
                ) : (
                  <ScrollArea className="flex-1 h-full my-3">
                    {sortedKeys.map((key) => {
                      return (
                        <div className="w-full my-4 animate-fade-in" key={key}>
                          <label className="text-blue-100 text-xs pl-2 font-medium">
                            {key}
                          </label>
                          {chatBox[key].map((item, i) => (
                            <ChatName
                              id={item.id.toString()}
                              name={item.name}
                              key={i}
                            />
                          ))}
                        </div>
                      );
                    })}
                  </ScrollArea>
                )
              )
            )}
            <UserProfile />
          </div>
        )}
      </nav>
    </aside>
  );
};

export default SidebarPrompt;
