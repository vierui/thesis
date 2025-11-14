"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GoSidebarCollapse, GoSidebarExpand } from "react-icons/go";
import { CiLogout } from "react-icons/ci";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";
import { Button } from "../ui/button";
import { dashboardMenu } from "@/constants";
import { SidebarItems } from "@/types";

const SidebarDashboard = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [sidebarItems, setSidebarItems] =
    useState<SidebarItems[]>(dashboardMenu);
  const pathname = usePathname();

  return (
    <aside className="h-screen">
      <nav
        className={`${
          isOpen ? "w-72 p-3" : "w-0 pt-3 pb-3 px-0"
        } h-full bg-white dark:bg-gray-600 border relative transition-all duration-300 ease-in-out flex flex-col justify-between items-center`}
      >
        <HoverCard openDelay={10}>
          <div className={`flex w-full`}>
            <HoverCardTrigger
              asChild
              className="w-fit absolute -right-10 top-1/2 z-40"
            >
              <Button
                className="mt-2 mb-5"
                variant={"ghost"}
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? (
                  <GoSidebarExpand
                    className="text-muted-foreground hover:text-blue-700 cursor-pointer"
                    size={20}
                  />
                ) : (
                  <GoSidebarCollapse
                    className="text-muted-foreground hover:text-blue-700 cursor-pointer"
                    size={20}
                  />
                )}
              </Button>
            </HoverCardTrigger>
          </div>
          <HoverCardContent
            className="p-1 bg-slate-600 text-white w-fit border-none"
            align="start"
          >
            {isOpen ? (
              <p className="text-xs">Close sidebar</p>
            ) : (
              <p className="text-xs">Expand sidebar</p>
            )}
          </HoverCardContent>
        </HoverCard>
        <div className="flex items-center">
          <h1 className=""></h1>
        </div>

        <div className="w-full flex-1 py-4">
          {sidebarItems.map((item, i) => (
            <HoverCard key={i}>
              <HoverCardTrigger asChild className="flex flex-col items-center">
                <Link href={"/" + item.url} key={i} className="my-1">
                  <Button
                    variant={"ghost"}
                    key={i}
                    className={`${
                      isOpen ? "w-full justify-start" : "w-fit px-2"
                    } ${
                      item.url.split("/")[1] ===
                        (pathname ? pathname.split("/")[2] : "") &&
                      isOpen &&
                      "bg-blue-700 text-white hover:bg-blue-700 dark:bg-gray-700 dark:hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    {item.icon && isOpen && (
                      <item.icon
                        className={`${isOpen ? "mr-3" : "m-0"} animate-fade-in`}
                        size={20}
                      />
                    )}
                    {isOpen && (
                      <p className="transition-opacity duration-500 animate-fade-in">
                        {item.name}
                      </p>
                    )}
                  </Button>
                </Link>
              </HoverCardTrigger>
              {!isOpen && (
                <HoverCardContent
                  className="p-1 bg-slate-700 text-white w-fit"
                  align={isOpen ? "center" : "start"}
                >
                  <p className="text-xs">{item.name}</p>
                </HoverCardContent>
              )}
            </HoverCard>
          ))}
        </div>

        <HoverCard>
          <HoverCardTrigger
            asChild
            className="w-fit flex items-center justify-center"
          >
            <Link href={"/log-out"} className="w-full">
              {isOpen && (
                <Button
                  variant={"ghost"}
                  className={`${
                    isOpen ? "w-full justify-start" : "w-fit px-2"
                  } text-red-600 hover:text-red-700`}
                >
                  <CiLogout className={isOpen ? "mr-3" : "m-0"} size={20} />
                  Log Out
                </Button>
              )}
            </Link>
          </HoverCardTrigger>
          {!isOpen && (
            <HoverCardContent
              className="p-1 bg-slate-700 text-white w-fit"
              align={isOpen ? "center" : "start"}
            >
              <p className="text-xs">Logout</p>
            </HoverCardContent>
          )}
        </HoverCard>
      </nav>
    </aside>
  );
};

export default SidebarDashboard;
